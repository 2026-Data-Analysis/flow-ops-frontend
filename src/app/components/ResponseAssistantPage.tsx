import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { flowOpsApi, getDefaultAppId } from '../api/flowOpsClient';

type AudienceType = 'internal' | 'customer' | 'cs';
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
  const [incidents, setIncidents] = useState<IncidentOption[]>([]);
  const [selectedIncident, setSelectedIncident] = useState('');
  const [audience, setAudience] = useState<AudienceType>('internal');
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [aiTab, setAiTab] = useState<AiTab>('internal');

  const analysisReference = (location.state as any)?.analysis;
  const incidentAnalysis = (location.state as any)?.incidentAnalysis as import('../api/flowOpsClient').IncidentAnalyzeResponse | undefined;
  const hasAiReport = !!incidentAnalysis?.data;

  // Pre-fill from AI incident analysis
  useEffect(() => {
    if (incidentAnalysis?.data?.internal_report) {
      setContent(incidentAnalysis.data.internal_report);
      setAiTab('internal');
    }
  }, [incidentAnalysis]);

  // Load incident list for manual mode
  useEffect(() => {
    if (hasAiReport) {
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    flowOpsApi
      .listExecutions(getDefaultAppId())
      .then((page) => {
        if (!active) return;
        const nextIncidents = page.content
          .filter((e) => !['SUCCESS', 'QUEUED', 'RUNNING'].includes(e.status))
          .map((e) => ({
            id: String(e.id),
            title: e.errorMessage || `${e.status} in ${e.caseName || e.endpoint || 'execution'}`,
            status: e.status,
            endpoint: e.endpoint,
            errorMessage: e.errorMessage,
          }));
        setIncidents(nextIncidents);
        setSelectedIncident(nextIncidents[0]?.id || '');
        setApiError(null);
      })
      .catch((error) => {
        if (!active) return;
        setApiError(error instanceof Error ? error.message : 'Failed to load incidents.');
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [hasAiReport]);

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

          {/* Log Analysis Reference */}
          {analysisReference && (
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-purple-300">
                <Sparkles size={16} />
                Log Analysis Reference
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="mb-1 text-purple-200/70">Category</div>
                  <div className="text-white">{analysisReference.failureCategory}</div>
                </div>
                <div>
                  <div className="mb-1 text-purple-200/70">Severity</div>
                  <div className="text-white">{analysisReference.severity}</div>
                </div>
                <div>
                  <div className="mb-1 text-purple-200/70">Confidence</div>
                  <div className="text-white">{Math.round((analysisReference.confidence || 0) * 100)}%</div>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-300">{analysisReference.diagnosis}</p>
            </div>
          )}

          {/* Target Audience */}
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 space-y-4">
            {/* Incident selector — only for manual mode */}
            {!hasAiReport && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Select Incident</label>
                {isLoading ? (
                  <div className="h-12 rounded-xl bg-[#13131a] animate-pulse" />
                ) : (
                  <select
                    value={selectedIncident}
                    onChange={(e) => setSelectedIncident(e.target.value)}
                    className="w-full px-4 py-3 bg-[#13131a] border border-[#1f1f28] rounded-xl text-white font-medium focus:outline-none focus:border-blue-500/30"
                  >
                    {incidents.length === 0 && (
                      <option value="">No failed incidents found</option>
                    )}
                    {incidents.map((inc) => (
                      <option key={inc.id} value={inc.id}>{inc.title}</option>
                    ))}
                  </select>
                )}
                {apiError && <p className="mt-2 text-xs text-red-400">{apiError}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Target Audience</label>
              {hasAiReport ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setAiTab('internal');
                      setContent(incidentAnalysis!.data.internal_report ?? '');
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      aiTab === 'internal'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-[#1f1f28] hover:border-[#2f2f38] bg-[#13131a]'
                    }`}
                  >
                    <Users size={24} className={`mb-2 ${aiTab === 'internal' ? 'text-blue-400' : 'text-gray-500'}`} />
                    <div className={`font-medium ${aiTab === 'internal' ? 'text-blue-400' : 'text-gray-300'}`}>Internal Team</div>
                    <div className="text-xs text-gray-500 mt-1">Engineering & DevOps</div>
                  </button>
                  <button
                    onClick={() => {
                      setAiTab('external');
                      setContent(incidentAnalysis!.data.external_notice ?? '');
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      aiTab === 'external'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-[#1f1f28] hover:border-[#2f2f38] bg-[#13131a]'
                    }`}
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
                      <button
                        key={a}
                        onClick={() => setAudience(a)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          audience === a
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-[#1f1f28] hover:border-[#2f2f38] bg-[#13131a]'
                        }`}
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
                {hasAiReport && (
                  <span className="ml-auto text-xs text-gray-500">
                    {aiTab === 'internal' ? 'Internal report for engineering team' : 'External notice for customers & partners'}
                  </span>
                )}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[600px] px-4 py-3 bg-[#13131a] border border-[#1f1f28] rounded-xl text-gray-300 font-mono text-sm focus:outline-none focus:border-blue-500/30 resize-none"
                placeholder={hasAiReport ? 'AI-generated report will appear here...' : 'Select an incident to generate content...'}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
