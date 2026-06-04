import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import {
  CheckCircle2,
  Copy,
  Globe,
  Loader2,
  Save,
  Send,
  Sparkles,
  AlertTriangle,
  Users,
} from 'lucide-react';
import {
  flowOpsApi,
  getDefaultAppId,
  type IncidentAnalyzeResponse,
} from '../api/flowOpsClient';

type AiTab = 'internal' | 'external';

interface IncidentOption {
  id: string;
  title: string;
  status?: string;
  endpoint?: string;
  errorMessage?: string;
}

export function ResponseAssistantPage() {
  const location = useLocation();
  const navIncidentAnalysis = (location.state as any)?.incidentAnalysis as IncidentAnalyzeResponse | undefined;
  const hasNavReport = !!navIncidentAnalysis?.data;

  const [incidents, setIncidents] = useState<IncidentOption[]>([]);
  const [selectedIncident, setSelectedIncident] = useState('');
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(!hasNavReport);
  const [listError, setListError] = useState<string | null>(null);

  const [aiAnalysis, setAiAnalysis] = useState<IncidentAnalyzeResponse | null>(navIncidentAnalysis ?? null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [aiTab, setAiTab] = useState<AiTab>('internal');
  const [content, setContent] = useState(navIncidentAnalysis?.data?.internal_report ?? '');
  const [copied, setCopied] = useState(false);

  const analyzeAbortRef = useRef<AbortController | null>(null);
  const hasAiReport = !!aiAnalysis?.data;

  useEffect(() => {
    if (hasNavReport) return;
    let active = true;
    setIsLoadingIncidents(true);

    flowOpsApi
      .listExecutions(getDefaultAppId())
      .then((page) => {
        if (!active) return;
        const list = page.content
          .filter((execution) => !['SUCCESS', 'QUEUED', 'RUNNING'].includes(execution.status))
          .map((execution) => ({
            id: String(execution.id),
            title: execution.errorMessage || `${execution.status} in ${execution.caseName || execution.endpoint || 'execution'}`,
            status: execution.status,
            endpoint: execution.endpoint,
            errorMessage: execution.errorMessage,
          }));

        setIncidents(list);
        if (list[0]) setSelectedIncident(list[0].id);
        setListError(null);
      })
      .catch((error) => {
        if (!active) return;
        setListError(error instanceof Error ? error.message : 'Failed to load incidents.');
      })
      .finally(() => {
        if (active) setIsLoadingIncidents(false);
      });

    return () => {
      active = false;
    };
  }, [hasNavReport]);

  useEffect(() => () => {
    analyzeAbortRef.current?.abort();
  }, []);

  const setAudience = (nextTab: AiTab) => {
    setAiTab(nextTab);
    setContent(
      nextTab === 'internal'
        ? aiAnalysis?.data?.internal_report ?? ''
        : aiAnalysis?.data?.external_notice ?? '',
    );
  };

  const handleAnalyzeSelectedIncident = () => {
    if (hasNavReport || !selectedIncident) return;

    analyzeAbortRef.current?.abort();
    const controller = new AbortController();
    analyzeAbortRef.current = controller;

    setIsAnalyzing(true);
    setAnalyzeError(null);
    setAiAnalysis(null);
    setContent('');

    const incident = incidents.find((item) => item.id === selectedIncident);

    flowOpsApi
      .getExecution(Number(selectedIncident))
      .then((execution) => {
        if (controller.signal.aborted) return undefined;

        const failedStep = execution.timeline?.find((step) => !step.success);

        return flowOpsApi.analyzeIncident({
          project_id: String(getDefaultAppId()),
          service_name: execution.caseName || incident?.endpoint || 'unknown',
          occurred_at: execution.executedAt || execution.startedAt || new Date().toISOString(),
          raw_log: execution.timeline
            ?.map((step) => `[${step.startedAt || ''}] ${step.success ? 'INFO' : 'ERROR'} ${step.method || ''} ${step.endpoint || ''} ${step.responseCode ?? ''}`)
            .join('\n') ?? '',
          log_entries: (execution.timeline ?? []).map((step) => ({
            timestamp: step.startedAt || '',
            level: step.success ? 'INFO' : 'ERROR',
            message: `${step.method || ''} ${step.endpoint || ''} -> ${step.responseCode ?? ''}`,
            logger: step.caseName || step.step || '',
            stack_trace: step.errorMessage ?? null,
          })),
          failure_context: {
            endpoint: failedStep?.endpoint || incident?.endpoint || '',
            expected_status: 200,
            actual_status: failedStep?.responseCode ?? execution.statusCode,
            request_body: failedStep?.requestBody ?? execution.body ?? null,
            response_body: failedStep?.responseBody ?? execution.response ?? null,
            error_message: failedStep?.errorMessage || execution.errorMessage || null,
          },
        });
      })
      .then((response) => {
        if (!response || controller.signal.aborted) return;
        setAiAnalysis(response);
        setAiTab('internal');
        setContent(response.data?.internal_report ?? '');
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setAnalyzeError(error instanceof Error ? error.message : 'Failed to analyze incident.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsAnalyzing(false);
      });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-hidden bg-[#060609] flex">
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Response Assistant</h1>
              <p className="text-gray-400">AI-generated communication for incidents</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                disabled={!content}
                className="flex items-center gap-2 px-4 py-2 bg-[#13131a] border border-[#1f1f28] hover:bg-[#1a1a22] text-gray-300 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {copied ? (
                  <><CheckCircle2 size={16} className="text-green-400" />Copied!</>
                ) : (
                  <><Copy size={16} />Copy</>
                )}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#13131a] border border-[#1f1f28] hover:bg-[#1a1a22] text-gray-300 rounded-xl font-medium transition-colors">
                <Save size={16} />Save
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
                <Send size={16} />Share
              </button>
            </div>
          </div>

          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 space-y-4">
            {!hasNavReport && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Select Incident</label>
                <div className="flex gap-3">
                  {isLoadingIncidents ? (
                    <div className="h-12 flex-1 rounded-xl bg-[#13131a] animate-pulse" />
                  ) : (
                    <select
                      value={selectedIncident}
                      onChange={(event) => {
                        setSelectedIncident(event.target.value);
                        setAiAnalysis(null);
                        setAnalyzeError(null);
                        setContent('');
                      }}
                      className="flex-1 px-4 py-3 bg-[#13131a] border border-[#1f1f28] rounded-xl text-white font-medium focus:outline-none focus:border-blue-500/30"
                    >
                      {incidents.length === 0 && <option value="">No failed incidents found</option>}
                      {incidents.map((incident) => (
                        <option key={incident.id} value={incident.id}>{incident.title}</option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={handleAnalyzeSelectedIncident}
                    disabled={!selectedIncident || isLoadingIncidents || isAnalyzing}
                    className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Incident'}
                  </button>
                </div>
                {listError && <p className="mt-2 text-xs text-red-400">{listError}</p>}
                {analyzeError && (
                  <p className="mt-2 flex items-center gap-2 text-xs text-red-400">
                    <AlertTriangle size={13} />
                    {analyzeError}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Target Audience</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAudience('internal')}
                  className={`p-4 rounded-xl border-2 transition-all ${aiTab === 'internal' ? 'border-blue-500 bg-blue-500/10' : 'border-[#1f1f28] hover:border-[#2f2f38] bg-[#13131a]'}`}
                >
                  <Users size={24} className={`mb-2 ${aiTab === 'internal' ? 'text-blue-400' : 'text-gray-500'}`} />
                  <div className={`font-medium ${aiTab === 'internal' ? 'text-blue-400' : 'text-gray-300'}`}>Internal Team</div>
                  <div className="text-xs text-gray-500 mt-1">Internal report</div>
                </button>
                <button
                  onClick={() => setAudience('external')}
                  className={`p-4 rounded-xl border-2 transition-all ${aiTab === 'external' ? 'border-blue-500 bg-blue-500/10' : 'border-[#1f1f28] hover:border-[#2f2f38] bg-[#13131a]'}`}
                >
                  <Globe size={24} className={`mb-2 ${aiTab === 'external' ? 'text-blue-400' : 'text-gray-500'}`} />
                  <div className={`font-medium ${aiTab === 'external' ? 'text-blue-400' : 'text-gray-300'}`}>External Team</div>
                  <div className="text-xs text-gray-500 mt-1">External notice</div>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-blue-400" />
                <span className="text-sm font-medium text-blue-400">AI Generated Content</span>
                {isAnalyzing && (
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-orange-400">
                    <Loader2 size={13} className="animate-spin" />Generating report...
                  </span>
                )}
                {hasAiReport && !isAnalyzing && (
                  <span className="ml-auto text-xs text-gray-500">
                    {aiTab === 'internal' ? 'Internal report' : 'External notice'}
                  </span>
                )}
              </div>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="w-full h-[600px] px-4 py-3 bg-[#13131a] border border-[#1f1f28] rounded-xl text-gray-300 font-mono text-sm focus:outline-none focus:border-blue-500/30 resize-none"
                placeholder={isAnalyzing ? 'Analyzing incident...' : 'Select an incident and run AI analysis to generate content.'}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
