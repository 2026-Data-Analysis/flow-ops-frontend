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
import {
  flowOpsApi,
  getDefaultAppId,
  type ExecutionDetailResponse,
  type ExecutionStepLogResponse,
  type IncidentAnalyzeResponse,
} from '../api/flowOpsClient';
import { normalizeAssertionResults, type NormalizedAssertionResult } from '../utils/executionAssertions';
import { parseMaybeJson } from '../utils/incidentAnalysis';
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
    status: number | null;
    headers: Record<string, string>;
    body?: string;
  };
  validationErrors?: string[];
  expectedStatus: number | null;
}

const methodColors = {
  GET: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  POST: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  PUT: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  DELETE: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  PATCH: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

const normalizeMethod = (method?: string): ExecutionStep['method'] => {
  const upper = (method || '').toUpperCase();
  return (HTTP_METHODS as readonly string[]).includes(upper) ? (upper as ExecutionStep['method']) : 'GET';
};

const stringifyBody = (value: unknown): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

// 검증 결과 중 HTTP 상태 단언에서 기대 상태 코드를 추출한다.
const extractExpectedStatus = (assertions: NormalizedAssertionResult[]): number | null => {
  for (const assertion of assertions) {
    if (/status/i.test(assertion.name)) {
      const parsed = parseInt(assertion.expected, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return null;
};

const resolveStepStatus = (step: ExecutionStepLogResponse): ExecutionStep['status'] => {
  if (step.status === 'SUCCESS' || step.success === true) return 'success';
  if (step.status === 'FAILED' || step.success === false) return 'failed';
  return step.responseCode != null && step.responseCode >= 200 && step.responseCode < 300 ? 'success' : 'failed';
};

const mapStepLog = (
  step: ExecutionStepLogResponse,
  execution: ExecutionDetailResponse,
  index: number,
): ExecutionStep => {
  const assertions = normalizeAssertionResults(step.validationResults, step.assertionResults);
  const failedMessages = assertions
    .filter((assertion) => !assertion.passed)
    .map((assertion) => assertion.message || `${assertion.name}: expected ${assertion.expected}, got ${assertion.actual}`);
  const errors = [step.errorMessage, ...failedMessages].filter((value): value is string => Boolean(value));

  return {
    id: String(step.id ?? index),
    order: index + 1,
    testCase: step.caseName || step.step || execution.caseName || `Step ${index + 1}`,
    endpoint: step.endpoint || execution.endpoint || 'Unknown endpoint',
    method: normalizeMethod(step.method || execution.endpoint?.split(' ')[0]),
    status: resolveStepStatus(step),
    timestamp: step.executedAt || step.startedAt || execution.executedAt || '',
    duration: step.durationMs ?? 0,
    request: { headers: {}, body: stringifyBody(step.requestBody) },
    response: { status: step.responseCode ?? null, headers: {}, body: stringifyBody(step.responseBody) },
    validationErrors: errors.length ? Array.from(new Set(errors)) : undefined,
    expectedStatus: extractExpectedStatus(assertions),
  };
};

const buildSteps = (execution: ExecutionDetailResponse): ExecutionStep[] => {
  if (execution.timeline?.length) {
    return execution.timeline.map((step, index) => mapStepLog(step, execution, index));
  }

  const errors = execution.errorMessage ? [execution.errorMessage] : undefined;
  return [{
    id: String(execution.id),
    order: 1,
    testCase: execution.caseName || execution.executionType || `Execution #${execution.id}`,
    endpoint: execution.endpoint || 'Unknown endpoint',
    method: normalizeMethod(execution.endpoint?.split(' ')[0]),
    status: execution.status === 'SUCCESS' ? 'success' : 'failed',
    timestamp: execution.executedAt || '',
    duration: execution.durationMs ?? execution.responseTimeMs ?? execution.avgDurationMs ?? 0,
    request: { headers: {}, body: stringifyBody(execution.body) },
    response: { status: execution.statusCode ?? null, headers: {}, body: stringifyBody(execution.response) },
    validationErrors: errors,
    expectedStatus: null,
  }];
};

export function LogDetailPage() {
  const navigate = useNavigate();
  const { runId } = useParams();
  const [execution, setExecution] = useState<ExecutionDetailResponse | null>(null);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [expandedCauseIdx, setExpandedCauseIdx] = useState<number | null>(0);

  const [incidentAnalysis, setIncidentAnalysis] = useState<IncidentAnalyzeResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const failedSteps = steps.filter((s) => s.status === 'failed');
  const primaryStep = steps.find((s) => s.status === 'failed') || steps[0];
  const pageTitle = execution
    ? execution.caseName
      || (steps.length === 1 && primaryStep ? `${primaryStep.method} ${primaryStep.endpoint}` : `Execution #${execution.id}`)
    : runId
      ? `Execution #${runId}`
      : 'Execution Log';

  // 실제 실행 상세를 runId 기준으로 조회한다.
  useEffect(() => {
    if (!runId) {
      setLoadError('No execution id provided.');
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setLoadError(null);
    flowOpsApi
      .getExecution(Number(runId))
      .then((detail) => {
        if (!active) return;
        setExecution(detail);
        const mapped = buildSteps(detail);
        setSteps(mapped);
        const firstFailed = mapped.find((step) => step.status === 'failed');
        setExpandedStepId(firstFailed ? firstFailed.id : mapped[0]?.id ?? null);
      })
      .catch((error) => {
        if (!active) return;
        setExecution(null);
        setSteps([]);
        setLoadError(error instanceof Error ? error.message : 'Failed to load execution detail.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [runId]);

  // 실패 스텝이 있으면 실제 실패 컨텍스트로 인시던트 분석을 요청한다.
  useEffect(() => {
    if (!execution) return;

    const failed = steps.filter((step) => step.status === 'failed');
    if (failed.length === 0) {
      setIncidentAnalysis(null);
      setAnalyzeError(null);
      setIsAnalyzing(false);
      return;
    }

    const firstFailed = failed[0];
    let active = true;
    setIsAnalyzing(true);
    setAnalyzeError(null);

    flowOpsApi
      .analyzeIncident({
        project_id: String(execution.appId ?? getDefaultAppId()),
        service_name: execution.caseName || execution.executionType || `execution-${execution.id}`,
        occurred_at: execution.executedAt || new Date().toISOString(),
        raw_log: steps
          .map((step) => `[${step.timestamp}] ${step.status.toUpperCase()} ${step.method} ${step.endpoint} ${step.response.status ?? 'no response'}`)
          .join('\n'),
        log_entries: steps.map((step) => ({
          timestamp: step.timestamp || new Date().toISOString(),
          level: step.status === 'failed' ? 'ERROR' : 'INFO',
          message: `${step.method} ${step.endpoint} → ${step.response.status ?? 'no response'}`,
          logger: step.testCase,
          stack_trace: step.validationErrors?.join('\n') ?? null,
        })),
        failure_context: {
          endpoint: `${firstFailed.method} ${firstFailed.endpoint}`,
          expected_status: firstFailed.expectedStatus ?? undefined,
          actual_status: firstFailed.response.status ?? undefined,
          request_body: parseMaybeJson(firstFailed.request.body),
          response_body: parseMaybeJson(firstFailed.response.body),
          error_message: firstFailed.validationErrors?.join('; ') || undefined,
        },
      })
      .then((res) => {
        if (active) setIncidentAnalysis(res);
      })
      .catch((err) => {
        if (active) setAnalyzeError(err instanceof Error ? err.message : 'Failed to analyze incident.');
      })
      .finally(() => {
        if (active) setIsAnalyzing(false);
      });

    return () => {
      active = false;
    };
  }, [execution, steps]);

  const handleGenerateReport = () => {
    navigate('/monitoring/response', { state: { incidentAnalysis, executionId: execution?.id } });
  };

  const handleRerun = () => {
    navigate('/execution/run', execution ? { state: { rerunExecutionId: execution.id } } : undefined);
  };

  return (
    <div className="flex-1 overflow-hidden bg-[#060609] flex flex-col">
      {/* Header */}
      <div className="flow-page-header">
        <button
          onClick={() => navigate('/monitoring/history')}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={18} />
          <span>Back to History</span>
        </button>

        <div className="flow-page-header-row">
          <div>
            <h1 className="flow-page-title">{pageTitle}</h1>
          </div>

          <div className="flow-page-actions">
            {failedSteps.length > 0 && (
              <button
                onClick={handleGenerateReport}
                disabled={isAnalyzing || !incidentAnalysis}
                className="flow-action-secondary"
              >
                {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Generate Incident Report
              </button>
            )}
            <button
              onClick={handleRerun}
              disabled={!execution}
              className="flow-action-primary"
            >
              <Play size={16} />
              Re-run
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flow-page-body">
        <div className="flow-page-body-inner">

          {isLoading && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-[#1f1f28] bg-[#0a0a0f] px-5 py-10 text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              Loading execution detail...
            </div>
          )}

          {!isLoading && loadError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
              <AlertTriangle size={16} />
              {loadError}
            </div>
          )}

          {!isLoading && !loadError && steps.length === 0 && (
            <div className="rounded-xl border border-[#1f1f28] bg-[#0a0a0f] px-5 py-10 text-center text-sm text-gray-500">
              No step details available for this execution.
            </div>
          )}

          {/* Incident Analysis Panel */}
          {!isLoading && !loadError && failedSteps.length > 0 && (
            <div className="rounded-xl border border-[#1f1f28] bg-[#0a0a0f] overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1f1f28]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <ShieldAlert size={16} className="text-orange-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-white">Incident Analysis</h2>
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

                {!isAnalyzing && !analyzeError && (incidentAnalysis?.data?.root_causes?.length ?? 0) > 0 && (
                  <IncidentRootCauseList
                    causes={incidentAnalysis!.data.root_causes}
                    expandedIndex={expandedCauseIdx}
                    onToggle={(index) => setExpandedCauseIdx(expandedCauseIdx === index ? null : index)}
                  />
                )}

                {!isAnalyzing && !analyzeError && (incidentAnalysis?.data?.root_causes?.length ?? 0) === 0 && (
                  <div className="text-sm text-gray-500">No root causes were identified for this incident.</div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          {!isLoading && !loadError && steps.length > 0 && (
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
                            {step.response.status ?? 'No response'}
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
                              {Object.keys(step.request.headers).length > 0 && (
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
                              )}
                              {step.request.body ? (
                                <div>
                                  <div className="text-xs text-gray-500 mb-2">Body:</div>
                                  <pre className="bg-[#13131a] rounded-lg p-3 text-xs font-mono text-gray-300 overflow-x-auto">
                                    {step.request.body}
                                  </pre>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500">No request body.</div>
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
                                    {step.response.status ?? 'No response'}
                                  </span>
                                </div>
                                {Object.keys(step.response.headers).length > 0 && (
                                  <div className="bg-[#13131a] rounded-lg p-3 space-y-1">
                                    {Object.entries(step.response.headers).map(([key, value]) => (
                                      <div key={key} className="text-xs font-mono">
                                        <span className="text-green-400">{key}:</span>{' '}
                                        <span className="text-gray-300">{value}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-2">Body:</div>
                                {step.response.body ? (
                                  <pre className="bg-[#13131a] rounded-lg p-3 text-xs font-mono text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
                                    {step.response.body}
                                  </pre>
                                ) : (
                                  <div className="text-xs text-gray-500">No response body.</div>
                                )}
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
          )}
        </div>
      </div>
    </div>
  );
}
