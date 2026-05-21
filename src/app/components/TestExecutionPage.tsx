import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Terminal,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  StopCircle
} from 'lucide-react';
import { useTestContext } from '../contexts/TestContext';
import {
  DEFAULT_REQUESTER,
  flowOpsApi,
  getDefaultAppId,
  type EnvironmentResponse,
  type ExecutionDetailResponse,
  type ExecutionStepLogResponse,
  type HttpMethod,
} from '../api/flowOpsClient';

interface ExecutionLog {
  id: string;
  timestamp: string;
  testCase: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  status: 'running' | 'success' | 'failed' | 'pending';
  duration: number;
  responseCode: number;
  source: 'auto' | 'edited';
  requestBody?: string;
  responseBody?: string;
  errorMessage?: string;
}


const methodColors = {
  GET: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  POST: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  PUT: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  DELETE: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  PATCH: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  OPTIONS: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  HEAD: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
};

const toTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const normalizeStatus = (status?: string, success?: boolean): ExecutionLog['status'] => {
  if (status === 'RUNNING') return 'running';
  if (status === 'FAILED' || success === false) return 'failed';
  return 'success';
};

const normalizeLog = (log: ExecutionStepLogResponse, index: number): ExecutionLog => ({
  id: String(log.id ?? index + 1),
  timestamp: toTime(log.executedAt || log.startedAt),
  testCase: log.step || log.caseName || `Execution step ${index + 1}`,
  endpoint: log.endpoint || '-',
  method: (log.method || 'GET') as HttpMethod,
  status: normalizeStatus(log.status, log.success),
  duration: log.durationMs ?? 0,
  responseCode: log.responseCode ?? (log.success === false ? 500 : 200),
  source: 'auto',
  requestBody: log.requestBody ? JSON.stringify(log.requestBody, null, 2) : undefined,
  responseBody: log.responseBody ? JSON.stringify(log.responseBody, null, 2) : undefined,
  errorMessage: log.errorMessage,
});

const normalizeExecution = (execution: ExecutionDetailResponse): ExecutionLog[] => {
  if (execution.timeline?.length) {
    return execution.timeline.map((log, index) => {
      const normalized = normalizeLog(log, index);
      return { ...normalized, testCase: `${normalized.testCase} #step ${index + 1}` };
    });
  }

  return [
    {
      id: String(execution.id),
      timestamp: toTime(execution.executedAt),
      testCase: execution.caseName || 'FlowOps execution',
      endpoint: execution.endpoint || '-',
      method: 'GET',
      status: normalizeStatus(execution.status, execution.status === 'SUCCESS'),
      duration: execution.avgDurationMs ?? execution.responseTimeMs ?? execution.durationMs ?? 0,
      responseCode: execution.statusCode ?? (execution.status === 'SUCCESS' ? 200 : 500),
      source: 'auto',
      requestBody: execution.body ? JSON.stringify(execution.body, null, 2) : undefined,
      responseBody: execution.response ? JSON.stringify(execution.response, null, 2) : undefined,
      errorMessage: execution.errorMessage,
    },
  ];
};

const hasUnfilledPathParameter = (path: string) =>
  /[:{][A-Za-z0-9_]+}?/.test(path) && /(sample|undefined|null|^$)/i.test(path);

export function TestExecutionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { environment, setEnvironment, selectedAPIs, executionResults, setExecutionResults } = useTestContext();

  // Configuration State
  const [executionType, setExecutionType] = useState<'tests' | 'scenario'>('tests');
  const [testLevel, setTestLevel] = useState('smoke');

  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [environments, setEnvironments] = useState<EnvironmentResponse[]>([]);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Context-aware prefill from navigation
  useEffect(() => {
    const state = location.state as any;
    if (state?.scenarioId || state?.scenarioIds) {
      setExecutionType('scenario');
    } else {
      setExecutionType('tests');
    }
  }, [location.state]);

  useEffect(() => {
    flowOpsApi
      .listEnvironments(getDefaultAppId())
      .then(setEnvironments)
      .catch(() => undefined);
  }, []);

  const resolveEnvironmentId = () => {
    const selected = environments.find((env) => {
      const label = `${env.name} ${env.branchName || ''}`.toLowerCase();
      if (environment === 'dev') return label.includes('dev') || label.includes('develop');
      if (environment === 'prod') return label.includes('prod') || label.includes('main');
      return label.includes('staging') || label.includes('stage');
    });
    return selected?.id ?? environments[0]?.id ?? null;
  };

  const getSelectedApiIds = () => {
    const state = location.state as any;
    const stateIds = state?.selectedApiIds || (state?.selectedApiId ? [state.selectedApiId] : []);
    const contextIds = selectedAPIs.map((api) => api.id);
    return [...new Set([...stateIds, ...contextIds])]
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
  };

  const handleRun = async () => {
    setLogs([]);
    setCurrentLogIndex(0);
    setIsRunning(true);
    setExpandedLogId(null);
    setExecutionError(null);

    const apiIds = getSelectedApiIds();
    const environmentId = resolveEnvironmentId();

    try {
      if (!environmentId) {
        throw new Error('Select an environment before running tests.');
      }
      if (executionType === 'tests') {
        const invalidApi = selectedAPIs.find((api) => !api.method || !api.endpoint || hasUnfilledPathParameter(api.endpoint));
        if (invalidApi) {
          throw new Error(`Check method/path and path parameter values for ${invalidApi.endpoint || invalidApi.name}.`);
        }
      }

      let result: ExecutionDetailResponse;
      if (executionType === 'scenario') {
        const state = location.state as any;
        const scenarioIds = state?.scenarioIds ?? (state?.scenarioId ? [state.scenarioId] : []);
        const normalizedScenarioIds = scenarioIds.map(Number).filter(Number.isFinite);
        if (normalizedScenarioIds.length === 0) {
          throw new Error('Select a scenario before running tests.');
        }
        result = await flowOpsApi.runScenario({
          appId: getDefaultAppId(),
          environmentId,
          scenarioIds: normalizedScenarioIds,
          testLevel: testLevel.toUpperCase() as any,
          createdBy: DEFAULT_REQUESTER,
        });
      } else if (apiIds.length > 0) {
        result = await flowOpsApi.runApis({
          appId: getDefaultAppId(),
          environmentId,
          apiIds,
          executionMode: 'RUN_EXISTING',
          testLevel: testLevel.toUpperCase() as any,
          createdBy: DEFAULT_REQUESTER,
        });
      } else {
        throw new Error('Select test cases or APIs before running tests.');
      }
      const nextLogs = normalizeExecution(result);
      setLogs(nextLogs);
      setExecutionResults({
        timestamp: new Date().toISOString(),
        environment,
        testLevel,
        execution: result,
        logs: nextLogs,
        stats: calculateStats(nextLogs),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '테스트 실행 요청에 실패했습니다.';
      setExecutionError(message);
      setLogs([]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleRerunFailed = () => {
    setLogs(logs.filter(log => log.status === 'failed').map(log => ({ ...log, status: 'running' })));
    void handleRun();
  };

  const handleGenerateEdgeCases = () => {
    navigate('/qc/testcase', { state: { generateEdgeCases: true } });
  };

  const handleGenerateFixTests = () => {
    navigate('/qc/testcase', { state: { generateFixTests: true } });
  };

  const handleImproveCoverage = () => {
    navigate('/qc/testcase', { state: { improveCoverage: true } });
  };

  const calculateStats = (logsToCalc: ExecutionLog[]) => {
    const total = logsToCalc.length;
    const passed = logsToCalc.filter(l => l.status === 'success').length;
    const failed = logsToCalc.filter(l => l.status === 'failed').length;
    const avgDuration = total > 0 ? Math.round(logsToCalc.reduce((sum, l) => sum + l.duration, 0) / total) : 0;
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return { total, passed, failed, avgDuration, successRate };
  };

  const stats = calculateStats(logs);
  const failedLogs = logs.filter(log => log.status === 'failed');
  const hasFailures = failedLogs.length > 0;
  const isComplete = !isRunning && logs.length > 0;

  return (
    <div className="flex-1 overflow-hidden bg-[#060609] flex flex-col">
      {/* Top Execution Control Bar */}
      <div className="bg-[#0a0a0f] border-b border-[#1f1f28] px-4 py-3 sticky top-0 z-10 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Left: Configuration Controls */}
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
            {/* Execution Type - Segmented Control */}
            <div className="flex items-center bg-[#13131a] border border-[#1f1f28] rounded-lg p-1 flex-shrink-0">
              <button
                onClick={() => setExecutionType('tests')}
                disabled={isRunning}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  executionType === 'tests'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white'
                } disabled:opacity-50`}
              >
                Test Cases
              </button>
              <button
                onClick={() => setExecutionType('scenario')}
                disabled={isRunning}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  executionType === 'scenario'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white'
                } disabled:opacity-50`}
              >
                Scenario
              </button>
            </div>

            {/* Vertical Separator */}
            <div className="hidden sm:block w-px h-7 bg-[#1f1f28] flex-shrink-0"></div>

            {/* Environment */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-500 uppercase tracking-wider hidden sm:inline">Env</span>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as any)}
                disabled={isRunning}
                className="bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500/30 transition-colors disabled:opacity-50"
              >
                <option value="dev">Development</option>
                <option value="staging">Staging</option>
                <option value="prod">Production</option>
              </select>
            </div>

            {/* Test Level */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-500 uppercase tracking-wider hidden sm:inline">Level</span>
              <select
                value={testLevel}
                onChange={(e) => setTestLevel(e.target.value)}
                disabled={isRunning}
                className="bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500/30 transition-colors disabled:opacity-50"
              >
                <option value="smoke">Smoke</option>
                <option value="sanity">Sanity</option>
                <option value="regression">Regression</option>
                <option value="full">Full Suite</option>
              </select>
            </div>
          </div>

          {/* Right: Action Buttons — always visible */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            {hasFailures && !isRunning && (
              <button
                onClick={handleRerunFailed}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#13131a] border border-orange-500/20 hover:bg-orange-500/5 text-orange-400 rounded-lg transition-all text-sm"
              >
                <RefreshCw size={15} />
                <span className="hidden sm:inline">Re-run Failed ({failedLogs.length})</span>
                <span className="sm:hidden">{failedLogs.length}</span>
              </button>
            )}

            {isRunning ? (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold text-sm"
              >
                <StopCircle size={17} />
                Stop
              </button>
            ) : (
              <button
                onClick={handleRun}
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-sm"
              >
                <Play size={17} />
                {logs.length > 0 ? 'Run Again' : 'Run Tests'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="responsive-detail-grid relative flex-1 overflow-hidden grid grid-cols-[1fr_320px]">
        {/* Execution Console */}
        <main className="h-full overflow-y-auto bg-[#060609] p-6">
          {/* Console Header */}
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 text-gray-500">
              <Terminal size={18} />
              <span className="text-sm font-mono">Test Execution Console</span>
              {logs.length > 0 && (
                <span className="text-xs text-gray-600">
                  [{new Date().toLocaleDateString()} {logs[0]?.timestamp}]
                </span>
              )}
            </div>

            {logs.length > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500">
                  {stats.total} tests • {stats.passed} passed • {stats.failed} failed
                </span>
                {isRunning && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    Running...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Console Logs */}
          {executionError && (
            <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
              Backend execution failed: {executionError}
            </div>
          )}
          {logs.length === 0 && !isRunning ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-[#13131a] rounded-full flex items-center justify-center mb-4">
                <Play size={24} className="text-gray-500" />
              </div>
              <h3 className="text-white mb-2">Ready to Execute</h3>
              <p className="text-gray-500 text-sm">Configure options above and click "Run Tests"</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`bg-[#0a0a0f] border rounded-lg overflow-hidden transition-all ${
                    log.status === 'running' ? 'border-blue-500/30 bg-blue-500/5' :
                    log.status === 'success' ? 'border-[#1f1f28] hover:border-green-500/30' :
                    log.status === 'failed' ? 'border-[#1f1f28] hover:border-red-500/30' :
                    'border-[#1f1f28]'
                  }`}
                >
                  <div
                    onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                    className="flex flex-col gap-4 p-4 cursor-pointer lg:flex-row lg:items-center"
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {log.status === 'success' && (
                        <CheckCircle2 size={20} className="text-green-400" />
                      )}
                      {log.status === 'failed' && (
                        <XCircle size={20} className="text-red-400" />
                      )}
                      {log.status === 'running' && (
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>

                    {/* Test Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-white font-medium">{log.testCase}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          log.source === 'auto'
                            ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {log.source}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={`font-mono font-semibold ${methodColors[log.method].text}`}>
                          {log.method}
                        </span>
                        <span className="text-gray-500 font-mono">{log.endpoint}</span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid w-full grid-cols-3 gap-3 flex-shrink-0 lg:w-auto lg:flex lg:items-center lg:gap-6">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Code</div>
                        <div className={`text-sm font-semibold font-mono ${
                          log.responseCode >= 200 && log.responseCode < 300 ? 'text-green-400' :
                          log.responseCode === 0 ? 'text-yellow-400' :
                          log.responseCode >= 400 ? 'text-red-400' :
                          'text-yellow-400'
                        }`}>
                          {log.responseCode}
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Duration</div>
                        <div className="text-sm text-white font-mono">{log.duration}ms</div>
                      </div>

                      <div className="text-xs text-gray-500 flex-shrink-0 col-span-3 lg:col-span-1">{log.timestamp}</div>

                      {expandedLogId === log.id ? (
                        <ChevronUp size={18} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedLogId === log.id && (
                    <div className="border-t border-[#1f1f28] p-4 bg-[#0d0d12]">
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {log.requestBody && (
                          <div>
                            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Request</div>
                            <pre className="bg-[#13131a] rounded-lg p-3 text-xs text-gray-300 font-mono overflow-x-auto">
                              {log.requestBody}
                            </pre>
                          </div>
                        )}

                        {log.responseBody && (
                          <div>
                            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Response</div>
                            <pre className="bg-[#13131a] rounded-lg p-3 text-xs text-gray-300 font-mono overflow-x-auto">
                              {log.responseBody}
                            </pre>
                          </div>
                        )}

                        {log.errorMessage && (
                          <div className="col-span-2">
                            <div className="text-xs text-red-400 mb-2 uppercase tracking-wider">Error</div>
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                              {log.errorMessage}
                            </div>
                            {log.responseCode === 0 && (
                              <div className="mt-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs text-yellow-300">
                                HTTP request did not reach a valid response. Check baseUrl, DNS, connection, timeout, SSL, or server availability.
                              </div>
                            )}
                          </div>
                        )}

                        {log.responseCode === 0 && !log.errorMessage && (
                          <div className="col-span-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs text-yellow-300">
                            HTTP request did not reach a valid response. Check baseUrl, DNS, connection, timeout, SSL, or server availability.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Right: Summary Panel */}
        <aside className="bg-[#0a0a0f] border-l border-[#1f1f28] flex flex-col h-full overflow-hidden">
          <div className="p-5 border-b border-[#1f1f28]">
            <h3 className="text-white mb-1 flex items-center gap-2">
              <Activity size={18} className="text-blue-400" />
              Execution Summary
            </h3>
            <p className="text-gray-500 text-xs">Real-time statistics</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Stats Cards */}
            <div className="space-y-3">
              <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Total Tests</span>
                  <Activity size={16} className="text-gray-500" />
                </div>
                <div className="text-2xl text-white font-semibold">{stats.total}</div>
              </div>

              <div className="bg-[#13131a] border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Passed</span>
                  <CheckCircle2 size={16} className="text-green-400" />
                </div>
                <div className="text-2xl text-green-400 font-semibold">{stats.passed}</div>
                {stats.total > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    {stats.successRate}% success rate
                  </div>
                )}
              </div>

              <div className="bg-[#13131a] border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Failed</span>
                  <XCircle size={16} className="text-red-400" />
                </div>
                <div className="text-2xl text-red-400 font-semibold">{stats.failed}</div>
              </div>

              <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Avg Duration</span>
                  <Clock size={16} className="text-gray-500" />
                </div>
                <div className="text-2xl text-white font-semibold">{stats.avgDuration}ms</div>
              </div>
            </div>

            {/* Coverage Impact */}
            {isComplete && (
              <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                  <TrendingUp size={14} />
                  Coverage Impact
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Before</span>
                  <span className="text-sm text-white">72%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">After</span>
                  <span className="text-sm text-green-400 font-semibold">78% (+6%)</span>
                </div>
              </div>
            )}

            {/* AI-Powered Quick Actions */}
            {isComplete && (
              <div>
                <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-purple-400" />
                  AI-Powered Next Steps
                </div>
                <div className="space-y-2">
                  {hasFailures && (
                    <>
                      <button
                        onClick={handleGenerateEdgeCases}
                        className="w-full flex items-center justify-start gap-3 bg-[#13131a] border border-[#1f1f28] hover:border-purple-500/30 hover:bg-purple-500/5 text-white px-4 py-3 rounded-lg transition-all text-sm"
                      >
                        <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                          <AlertTriangle size={16} className="text-purple-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium">Generate Edge Cases</div>
                          <div className="text-xs text-gray-500">Based on failures</div>
                        </div>
                      </button>

                      <button
                        onClick={handleGenerateFixTests}
                        className="w-full flex items-center justify-start gap-3 bg-[#13131a] border border-[#1f1f28] hover:border-blue-500/30 hover:bg-blue-500/5 text-white px-4 py-3 rounded-lg transition-all text-sm"
                      >
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                          <Sparkles size={16} className="text-blue-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium">Generate Fix Tests</div>
                          <div className="text-xs text-gray-500">Validate error handling</div>
                        </div>
                      </button>
                    </>
                  )}

                  <button
                    onClick={handleImproveCoverage}
                    className="w-full flex items-center justify-start gap-3 bg-[#13131a] border border-[#1f1f28] hover:border-green-500/30 hover:bg-green-500/5 text-white px-4 py-3 rounded-lg transition-all text-sm"
                  >
                    <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <TrendingUp size={16} className="text-green-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">Improve Coverage</div>
                      <div className="text-xs text-gray-500">Fill coverage gaps</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
