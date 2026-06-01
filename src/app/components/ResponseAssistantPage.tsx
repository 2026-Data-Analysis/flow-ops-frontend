import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import {
  Copy,
  Save,
  Send,
  Sparkles,
  Users,
  Mail,
  MessageSquare,
  CheckCircle2,
  Globe,
  Loader2,
  ShieldAlert,
  ChevronRight,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import {
  flowOpsApi,
  getDefaultAppId,
  type IncidentAnalyzeResponse,
} from '../api/flowOpsClient';

type AudienceType = 'internal' | 'customer' | 'cs';
type AiTab = 'internal' | 'external';

interface IncidentOption {
  id: string;
  title: string;
  status?: string;
  endpoint?: string;
  errorMessage?: string;
}

const severityStyle = (severity: string) => {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'HIGH':     return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'MEDIUM':   return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    default:         return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export function ResponseAssistantPage() {
  const location = useLocation();

  // ── navigation state (from Log Detail) ────────────────────────────────────
  const analysisReference = (location.state as any)?.analysis;
  const navIncidentAnalysis = (location.state as any)?.incidentAnalysis as IncidentAnalyzeResponse | undefined;
  const hasNavReport = !!navIncidentAnalysis?.data;

  // ── manual mode state ──────────────────────────────────────────────────────
  const [incidents, setIncidents] = useState<IncidentOption[]>([]);
  const [selectedIncident, setSelectedIncident] = useState('');
  const [audience, setAudience] = useState<AudienceType>('internal');
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(!hasNavReport);

  // ── AI analysis state (shared for both paths) ─────────────────────────────
  const [aiAnalysis, setAiAnalysis] = useState<IncidentAnalyzeResponse | null>(navIncidentAnalysis ?? null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [aiTab, setAiTab] = useState<AiTab>('internal');
  const [expandedCauseIdx, setExpandedCauseIdx] = useState<number | null>(0);

  // ── content editor ─────────────────────────────────────────────────────────
  const [content, setContent] = useState(navIncidentAnalysis?.data?.internal_report ?? '');
  const [copied, setCopied] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const analyzeAbortRef = useRef<AbortController | null>(null);

  const hasAiReport = !!aiAnalysis?.data;

  // Load incident list (manual mode only)
  useEffect(() => {
    if (hasNavReport) return;
    let active = true;
    setIsLoadingIncidents(true);
    flowOpsApi
      .listExecutions(getDefaultAppId())
      .then((page) => {
        if (!active) return;
        const list = page.content
          .filter((e) => !['SUCCESS', 'QUEUED', 'RUNNING'].includes(e.status))
          .map((e) => ({
            id: String(e.id),
            title: e.errorMessage || `${e.status} in ${e.caseName || e.endpoint || 'execution'}`,
            status: e.status,
            endpoint: e.endpoint,
            errorMessage: e.errorMessage,
          }));
        setIncidents(list);
        if (list[0]) setSelectedIncident(list[0].id);
        setListError(null);
      })
      .catch((err) => {
        if (!active) return;
        setListError(err instanceof Error ? err.message : 'Failed to load incidents.');
      })
      .finally(() => { if (active) setIsLoadingIncidents(false); });
    return () => { active = false; };
  }, [hasNavReport]);

  // Call analyzeIncident whenever selectedIncident changes (manual mode)
  useEffect(() => {
    if (hasNavReport || !selectedIncident) return;

    // Cancel any in-flight request
    analyzeAbortRef.current?.abort();
    const controller = new AbortController();
    analyzeAbortRef.current = controller;

    setIsAnalyzing(true);
    setAnalyzeError(null);
    setAiAnalysis(null);
    setContent('');

    const inc = incidents.find((i) => i.id === selectedIncident);

    flowOpsApi
      .getExecution(Number(selectedIncident))
      .then((execution) => {
        if (controller.signal.aborted) return;

        const failedStep = execution.timeline?.find((s) => !s.success);

        return flowOpsApi.analyzeIncident({
          project_id: String(getDefaultAppId()),
          service_name: execution.caseName || inc?.endpoint || 'unknown',
          occurred_at: execution.executedAt || execution.startedAt || new Date().toISOString(),
          raw_log: execution.timeline
            ?.map((s) => `[${s.startedAt || ''}] ${s.success ? 'INFO' : 'ERROR'} ${s.method || ''} ${s.endpoint || ''} ${s.responseCode ?? ''}`)
            .join('\n') ?? '',
          log_entries: (execution.timeline ?? []).map((s) => ({
            timestamp: s.startedAt || '',
            level: s.success ? 'INFO' : 'ERROR',
            message: `${s.method || ''} ${s.endpoint || ''} → ${s.responseCode ?? ''}`,
            logger: s.caseName || s.step || '',
            stack_trace: s.errorMessage ?? null,
          })),
          failure_context: {
            endpoint: failedStep?.endpoint || inc?.endpoint || '',
            expected_status: 200,
            actual_status: failedStep?.responseCode ?? execution.statusCode,
            request_body: failedStep?.requestBody ?? execution.body ?? null,
            response_body: failedStep?.responseBody ?? execution.response ?? null,
            error_message: failedStep?.errorMessage || execution.errorMessage || null,
          },
        });
      })
      .then((res) => {
        if (!res || controller.signal.aborted) return;
        setAiAnalysis(res);
        setContent(res.data?.internal_report ?? '');
        setAiTab('internal');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setAnalyzeError(err instanceof Error ? err.message : 'Failed to analyze incident.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsAnalyzing(false);
      });

    return () => { controller.abort(); };
  }, [selectedIncident, hasNavReport]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-hidden bg-[#060609] flex">
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Response Assistant</h1>
              <p className="text-gray-400">AI-generated communication for incidents</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-[#13131a] border border-[#1f1f28] hover:bg-[#1a1a22] text-gray-300 rounded-xl font-medium transition-colors"
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

          {/* Log Analysis Reference (legacy path) */}
          {analysisReference && (
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-purple-300">
                <Sparkles size={16} />Log Analysis Reference
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div><div className="mb-1 text-purple-200/70">Category</div><div className="text-white">{analysisReference.failureCategory}</div></div>
                <div><div className="mb-1 text-purple-200/70">Severity</div><div className="text-white">{analysisReference.severity}</div></div>
                <div><div className="mb-1 text-purple-200/70">Confidence</div><div className="text-white">{Math.round((analysisReference.confidence || 0) * 100)}%</div></div>
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-300">{analysisReference.diagnosis}</p>
            </div>
          )}

          {/* Incident Analysis Panel */}
          <div className="rounded-xl border border-[#1f1f28] bg-[#0a0a0f] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1f1f28]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
                <ShieldAlert size={16} className="text-orange-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-white">Incident Analysis</h2>
                <p className="text-xs text-gray-500">AI-powered root cause diagnosis</p>
              </div>
              {isAnalyzing && (
                <div className="flex items-center gap-2 text-xs text-orange-400">
                  <Loader2 size={14} className="animate-spin" />Analyzing...
                </div>
              )}
              {!isAnalyzing && hasAiReport && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle2 size={13} />Analysis complete
                </span>
              )}
            </div>

            <div className="p-5">
              {isAnalyzing && (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-lg border border-[#1f1f28] bg-[#13131a] p-4 animate-pulse">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-5 w-16 rounded bg-[#1f1f28]" />
                        <div className="h-4 w-48 rounded bg-[#1f1f28]" />
                      </div>
                      <div className="h-3 w-3/4 rounded bg-[#1f1f28]" />
                    </div>
                  ))}
                </div>
              )}

              {!isAnalyzing && analyzeError && (
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <AlertTriangle size={16} />{analyzeError}
                </div>
              )}

              {!isAnalyzing && aiAnalysis?.data?.root_causes && aiAnalysis.data.root_causes.length > 0 && (
                <div className="space-y-2">
                  {aiAnalysis.data.root_causes.map((cause, i) => (
                    <div key={i} className="rounded-lg border border-[#1f1f28] bg-[#13131a] overflow-hidden">
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#1f1f28] transition-colors"
                        onClick={() => setExpandedCauseIdx(expandedCauseIdx === i ? null : i)}
                      >
                        <span className={`text-xs px-2 py-0.5 rounded border font-semibold flex-shrink-0 ${severityStyle(cause.severity)}`}>
                          {cause.severity}
                        </span>
                        <span className="flex-1 text-sm text-white font-medium">{cause.summary}</span>
                        {expandedCauseIdx === i
                          ? <ChevronUp size={15} className="text-gray-500 flex-shrink-0" />
                          : <ChevronRight size={15} className="text-gray-500 flex-shrink-0" />}
                      </button>
                      {expandedCauseIdx === i && (
                        <div className="px-4 pb-4 space-y-3 border-t border-[#1f1f28] pt-3">
                          {cause.suggested_fix && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Suggested Fix</div>
                              <p className="text-sm text-gray-300">{cause.suggested_fix}</p>
                            </div>
                          )}
                          {cause.evidence?.length > 0 && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Evidence</div>
                              <ul className="space-y-1">
                                {cause.evidence.map((e, j) => (
                                  <li key={j} className="text-xs text-gray-400 flex items-start gap-2">
                                    <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span>
                                    <span>{e}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!isAnalyzing && !analyzeError && !hasAiReport && !hasNavReport && !selectedIncident && (
                <p className="text-sm text-gray-500">Select an incident above to start analysis.</p>
              )}
            </div>
          </div>

          {/* Incident Selector + Target Audience */}
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 space-y-4">
            {/* Incident selector — manual mode only */}
            {!hasNavReport && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Select Incident</label>
                {isLoadingIncidents ? (
                  <div className="h-12 rounded-xl bg-[#13131a] animate-pulse" />
                ) : (
                  <select
                    value={selectedIncident}
                    onChange={(e) => setSelectedIncident(e.target.value)}
                    className="w-full px-4 py-3 bg-[#13131a] border border-[#1f1f28] rounded-xl text-white font-medium focus:outline-none focus:border-blue-500/30"
                  >
                    {incidents.length === 0 && <option value="">No failed incidents found</option>}
                    {incidents.map((inc) => (
                      <option key={inc.id} value={inc.id}>{inc.title}</option>
                    ))}
                  </select>
                )}
                {listError && <p className="mt-2 text-xs text-red-400">{listError}</p>}
              </div>
            )}

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Target Audience</label>
              {hasAiReport ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setAiTab('internal'); setContent(aiAnalysis!.data.internal_report ?? ''); }}
                    className={`p-4 rounded-xl border-2 transition-all ${aiTab === 'internal' ? 'border-blue-500 bg-blue-500/10' : 'border-[#1f1f28] hover:border-[#2f2f38] bg-[#13131a]'}`}
                  >
                    <Users size={24} className={`mb-2 ${aiTab === 'internal' ? 'text-blue-400' : 'text-gray-500'}`} />
                    <div className={`font-medium ${aiTab === 'internal' ? 'text-blue-400' : 'text-gray-300'}`}>Internal Team</div>
                    <div className="text-xs text-gray-500 mt-1">Engineering & DevOps</div>
                  </button>
                  <button
                    onClick={() => { setAiTab('external'); setContent(aiAnalysis!.data.external_notice ?? ''); }}
                    className={`p-4 rounded-xl border-2 transition-all ${aiTab === 'external' ? 'border-blue-500 bg-blue-500/10' : 'border-[#1f1f28] hover:border-[#2f2f38] bg-[#13131a]'}`}
                  >
                    <Globe size={24} className={`mb-2 ${aiTab === 'external' ? 'text-blue-400' : 'text-gray-500'}`} />
                    <div className={`font-medium ${aiTab === 'external' ? 'text-blue-400' : 'text-gray-300'}`}>External Team</div>
                    <div className="text-xs text-gray-500 mt-1">Customers & Partners</div>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {(['internal', 'customer', 'cs'] as const).map((a) => {
                    const icon = a === 'internal' ? <Users size={24} /> : a === 'customer' ? <Mail size={24} /> : <MessageSquare size={24} />;
                    const label = a === 'internal' ? 'Internal Team' : a === 'customer' ? 'Customer' : 'CS Team';
                    const sub = a === 'internal' ? 'Engineering & DevOps' : a === 'customer' ? 'External users' : 'Support staff';
                    return (
                      <button key={a} onClick={() => setAudience(a)}
                        className={`p-4 rounded-xl border-2 transition-all ${audience === a ? 'border-blue-500 bg-blue-500/10' : 'border-[#1f1f28] hover:border-[#2f2f38] bg-[#13131a]'}`}
                      >
                        <div className={`mb-2 ${audience === a ? 'text-blue-400' : 'text-gray-500'}`}>{icon}</div>
                        <div className={`font-medium ${audience === a ? 'text-blue-400' : 'text-gray-300'}`}>{label}</div>
                        <div className="text-xs text-gray-500 mt-1">{sub}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* AI Generated Content */}
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
                    {aiTab === 'internal' ? 'Internal report · Engineering & DevOps' : 'External notice · Customers & Partners'}
                  </span>
                )}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[600px] px-4 py-3 bg-[#13131a] border border-[#1f1f28] rounded-xl text-gray-300 font-mono text-sm focus:outline-none focus:border-blue-500/30 resize-none"
                placeholder={isAnalyzing ? 'Analyzing incident...' : 'Select an incident or navigate from Log Detail to generate content.'}
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
