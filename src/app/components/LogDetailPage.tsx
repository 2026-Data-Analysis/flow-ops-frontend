import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Code,
  FileJson,
  Loader2,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { flowOpsApi, getDefaultAppId, type IncidentAnalyzeResponse } from '../api/flowOpsClient';
import { IncidentRootCauseList } from './IncidentRootCauseList';

interface ExecutionStep {
  id: string;
  order: number;
  testCase: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  status: 'success' | 'failed';
  timestamp: string;
  duration: number;
  request: {
    headers: Record<string, string>;
    body?: string;
  };
  response: {
    status: number;
    headers: Record<string, string>;
    body: string;
  };
  validationErrors?: string[];
}

const mockSteps: ExecutionStep[] = [
  {
    id: '1',
    order: 1,
    testCase: 'Login - Admin Success',
    endpoint: '/api/v1/auth/login',
    method: 'POST',
    status: 'success',
    timestamp: '14:23:01.234',
    duration: 245,
    request: {
      headers: { 'Content-Type': 'application/json' },
      body: '{\n  "email": "admin@example.com",\n  "password": "password123"\n}',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: '{\n  "success": true,\n  "data": {\n    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n    "user": {\n      "id": "usr_123",\n      "role": "admin"\n    }\n  }\n}',
    },
  },
  {
    id: '2',
    order: 2,
    testCase: 'Create Post - Missing Field',
    endpoint: '/api/v1/posts',
    method: 'POST',
    status: 'failed',
    timestamp: '14:23:01.634',
    duration: 56,
    request: {
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer {{token}}' },
      body: '{\n  "content": "Test post content"\n}',
    },
    response: {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: '{\n  "success": false,\n  "error": {\n    "code": "MISSING_FIELD",\n    "message": "Field \'title\' is required"\n  }\n}',
    },
    validationErrors: ['Expected status 201, got 400', "Required field \"title\" is missing"],
  },
  {
    id: '3',
    order: 3,
    testCase: 'Create Post - Success',
    endpoint: '/api/v1/posts',
    method: 'POST',
    status: 'success',
    timestamp: '14:23:01.723',
    duration: 134,
    request: {
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer {{token}}' },
      body: '{\n  "title": "Test Post",\n  "content": "Test post content"\n}',
    },
    response: {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
      body: '{\n  "success": true,\n  "data": {\n    "id": "post_456",\n    "title": "Test Post",\n    "content": "Test post content"\n  }\n}',
    },
  },
];

const methodColors = {
  GET: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  POST: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  PUT: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  DELETE: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  PATCH: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

export function LogDetailPage() {
  const navigate = useNavigate();
  const { runId } = useParams();
  const [steps] = useState<ExecutionStep[]>(mockSteps);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [expandedCauseIdx, setExpandedCauseIdx] = useState<number | null>(0);

  const [incidentAnalysis, setIncidentAnalysis] = useState<IncidentAnalyzeResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const failedSteps = steps.filter((s) => s.status === 'failed');

  useEffect(() => {
    if (failedSteps.length === 0) {
      setIsAnalyzing(false);
      return;
    }
    const firstFailed = failedSteps[0];

    flowOpsApi
      .analyzeIncident({
        project_id: String(getDefaultAppId()),
        service_name: 'log-detail',
        occurred_at: new Date().toISOString(),
        raw_log: steps
          .map((s) => `[${s.timestamp}] ${s.status.toUpperCase()} ${s.method} ${s.endpoint} ${s.response.status}`)
          .join('\n'),
        log_entries: steps.map((s) => ({
          timestamp: s.timestamp,
          level: s.status === 'failed' ? 'ERROR' : 'INFO',
          message: `${s.method} ${s.endpoint} → ${s.response.status}`,
          logger: s.testCase,
          stack_trace: s.validationErrors?.join('\n') ?? null,
        })),
        failure_context: {
          endpoint: firstFailed.endpoint,
          expected_status: 201,
          actual_status: firstFailed.response.status,
          request_body: firstFailed.request.body ?? null,
          response_body: firstFailed.response.body,
          error_message: firstFailed.validationErrors?.join('; ') ?? null,
        },
      })
      .then((res) => {
        setIncidentAnalysis(res);
      })
      .catch((err) => {
        setAnalyzeError(err instanceof Error ? err.message : 'Failed to analyze incident.');
      })
      .finally(() => {
        setIsAnalyzing(false);
      });
  }, []);

  const handleGenerateReport = () => {
    navigate('/monitoring/response', { state: { incidentAnalysis } });
  };

  return (
    <div className="flex-1 overflow-hidden bg-[#060609] flex flex-col">
      {/* Header */}
      <div className="bg-[#0a0a0f] border-b border-[#1f1f28] px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/monitoring/history')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back to History</span>
          </button>

          <div className="flex items-center gap-3">
            {failedSteps.length > 0 && (
              <button
                onClick={handleGenerateReport}
                disabled={isAnalyzing || !incidentAnalysis}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Generate Incident Report
              </button>
            )}
            <button
              onClick={() => navigate('/execution/run')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Play size={16} />
              Re-run
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-1">POST /api/v1/posts</h1>
          <p className="text-gray-400 text-sm">Executed on Staging • 2026-04-10 14:23:01</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Incident Analysis Panel */}
          {failedSteps.length > 0 && (
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
                    <Loader2 size={14} className="animate-spin" />
                    Analyzing...
                  </div>
                )}
                {!isAnalyzing && incidentAnalysis && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    Analysis complete
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
                    <AlertTriangle size={16} />
                    {analyzeError}
                  </div>
                )}

                {!isAnalyzing && incidentAnalysis?.data?.root_causes?.length > 0 && (
                  <IncidentRootCauseList
                    causes={incidentAnalysis.data.root_causes}
                    expandedIndex={expandedCauseIdx}
                    onToggle={(index) => setExpandedCauseIdx(expandedCauseIdx === index ? null : index)}
                  />
                )}

                {!isAnalyzing && !analyzeError && !incidentAnalysis && (
                  <p className="text-sm text-gray-500">No analysis available.</p>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-0">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                {index < steps.length - 1 && (
                  <div className="absolute left-[21px] top-[52px] w-0.5 h-[calc(100%+8px)] bg-[#1f1f28]" />
                )}

                <div className="relative flex gap-4 pb-4">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center z-10 ${
                      step.status === 'success'
                        ? 'bg-green-500/20 border-2 border-green-500'
                        : 'bg-red-500/20 border-2 border-red-500'
                    }`}>
                      {step.status === 'success' ? (
                        <CheckCircle2 size={20} className="text-green-400" />
                      ) : (
                        <XCircle size={20} className="text-red-400" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className={`bg-[#0a0a0f] border rounded-xl p-5 cursor-pointer transition-all ${
                        step.status === 'failed'
                          ? 'border-red-500/30 hover:border-red-500/50'
                          : 'border-[#1f1f28] hover:border-blue-500/30'
                      }`}
                      onClick={() => setExpandedStepId(expandedStepId === step.id ? null : step.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`${methodColors[step.method].bg} ${methodColors[step.method].text} ${methodColors[step.method].border} border px-2.5 py-1 rounded text-xs font-semibold font-mono`}>
                            {step.method}
                          </span>
                          <span className="text-white font-medium">{step.testCase}</span>
                        </div>
                        {expandedStepId === step.id ? (
                          <ChevronUp size={18} className="text-gray-500" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-500" />
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm mb-3">
                        <span className="text-gray-500 font-mono">{step.endpoint}</span>
                        <span className="text-gray-600">•</span>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Clock size={14} />
                          <span>{step.duration}ms</span>
                        </div>
                        <span className="text-gray-600">•</span>
                        <span className={`font-medium ${step.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                          {step.response.status}
                        </span>
                      </div>

                      {step.validationErrors && step.validationErrors.length > 0 && (
                        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <div className="text-xs text-red-400 font-medium mb-2">Validation Errors:</div>
                          <ul className="space-y-1">
                            {step.validationErrors.map((error, idx) => (
                              <li key={idx} className="text-xs text-red-400 flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">•</span>
                                <span>{error}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {expandedStepId === step.id && (
                        <div className="mt-4 pt-4 border-t border-[#1f1f28] grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Code size={16} className="text-blue-400" />
                              <h4 className="text-white text-sm font-medium">Request</h4>
                            </div>
                            <div className="mb-3">
                              <div className="text-xs text-gray-500 mb-2">Headers:</div>
                              <div className="bg-[#13131a] rounded-lg p-3 space-y-1">
                                {Object.entries(step.request.headers).map(([key, value]) => (
                                  <div key={key} className="text-xs font-mono">
                                    <span className="text-blue-400">{key}:</span>{' '}
                                    <span className="text-gray-300">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {step.request.body && (
                              <div>
                                <div className="text-xs text-gray-500 mb-2">Body:</div>
                                <pre className="bg-[#13131a] rounded-lg p-3 text-xs font-mono text-gray-300 overflow-x-auto">
                                  {step.request.body}
                                </pre>
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <FileJson size={16} className="text-green-400" />
                              <h4 className="text-white text-sm font-medium">Response</h4>
                            </div>
                            <div className="mb-3">
                              <div className="text-xs text-gray-500 mb-2">
                                Status:{' '}
                                <span className={step.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                                  {step.response.status}
                                </span>
                              </div>
                              <div className="bg-[#13131a] rounded-lg p-3 space-y-1">
                                {Object.entries(step.response.headers).map(([key, value]) => (
                                  <div key={key} className="text-xs font-mono">
                                    <span className="text-green-400">{key}:</span>{' '}
                                    <span className="text-gray-300">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-2">Body:</div>
                              <pre className="bg-[#13131a] rounded-lg p-3 text-xs font-mono text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
                                {step.response.body}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
