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

const mockLogs: ExecutionLog[] = [
  {
    id: '1',
    timestamp: '14:23:01.234',
    testCase: 'Login - Admin Success',
    endpoint: '/api/v1/auth/login',
    method: 'POST',
    status: 'success',
    duration: 245,
    responseCode: 200,
    source: 'auto',
    requestBody: '{"username": "admin@test.com", "password": "***"}',
    responseBody: '{"token": "jwt_token", "user": {"id": "123"}}',
  },
  {
    id: '2',
    timestamp: '14:23:01.512',
    testCase: 'Get User Profile',
    endpoint: '/api/v1/users/usr_123',
    method: 'GET',
    status: 'success',
    duration: 89,
    responseCode: 200,
    source: 'auto',
  },
  {
    id: '3',
    timestamp: '14:23:01.634',
    testCase: 'Create Post - Missing Field',
    endpoint: '/api/v1/posts',
    method: 'POST',
    status: 'failed',
    duration: 56,
    responseCode: 400,
    source: 'edited',
    errorMessage: 'Validation error: title is required',
  },
  {
    id: '4',
    timestamp: '14:23:01.723',
    testCase: 'Create Post - Success',
    endpoint: '/api/v1/posts',
    method: 'POST',
    status: 'success',
    duration: 134,
    responseCode: 201,
    source: 'auto',
  },
  {
    id: '5',
    timestamp: '14:23:01.845',
    testCase: 'Delete Post - Unauthorized',
    endpoint: '/api/v1/posts/post_456',
    method: 'DELETE',
    status: 'failed',
    duration: 67,
    responseCode: 403,
    source: 'auto',
    errorMessage: 'Forbidden: Insufficient permissions',
  },
];

const methodColors = {
  GET: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  POST: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  PUT: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  DELETE: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  PATCH: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

export function TestExecutionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { environment, setEnvironment, selectedAPIs, executionResults, setExecutionResults } = useTestContext();

  // Configuration State
  const [executionType, setExecutionType] = useState<'apis' | 'tests' | 'scenario'>('apis');
  const [testLevel, setTestLevel] = useState('smoke');
  const [executionMode, setExecutionMode] = useState<'existing' | 'generate'>('existing');

  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Context-aware prefill from navigation
  useEffect(() => {
    const state = location.state as any;
    if (state?.selectedApiId) {
      setExecutionType('apis');
    } else if (state?.scenarioId || state?.scenarioIds) {
      setExecutionType('scenario');
    }
  }, [location.state]);

  // Run execution
  useEffect(() => {
    if (isRunning && currentLogIndex < mockLogs.length) {
      const timer = setTimeout(() => {
        const newLog = { ...mockLogs[currentLogIndex], status: 'running' as const };
        setLogs(prev => [...prev, newLog]);

        setTimeout(() => {
          setLogs(prev =>
            prev.map(log =>
              log.id === newLog.id ? mockLogs[currentLogIndex] : log
            )
          );
          setCurrentLogIndex(prev => prev + 1);
        }, 800);
      }, 500);
      return () => clearTimeout(timer);
    } else if (isRunning && currentLogIndex >= mockLogs.length) {
      setIsRunning(false);
      setExecutionResults({
        timestamp: new Date().toISOString(),
        environment,
        testLevel,
        logs,
        stats: calculateStats(mockLogs),
      });
    }
  }, [isRunning, currentLogIndex, environment, testLevel]);

  const handleRun = () => {
    setLogs([]);
    setCurrentLogIndex(0);
    setIsRunning(true);
    setExpandedLogId(null);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleRerunFailed = () => {
    const failedLogs = mockLogs.filter(log => log.status === 'failed');
    setLogs([]);
    setCurrentLogIndex(0);
    setIsRunning(true);
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
      <div className="bg-[#0a0a0f] border-b border-[#1f1f28] px-8 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-6">
          {/* Left: Configuration Controls */}
          <div className="flex items-center gap-4">
            {/* Execution Type - Segmented Control */}
            <div className="flex items-center bg-[#13131a] border border-[#1f1f28] rounded-lg p-1">
              <button
                onClick={() => setExecutionType('apis')}
                disabled={isRunning}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  executionType === 'apis'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white'
                } disabled:opacity-50`}
              >
                APIs
              </button>
              <button
                onClick={() => setExecutionType('tests')}
                disabled={isRunning}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
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
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  executionType === 'scenario'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white'
                } disabled:opacity-50`}
              >
                Scenario
              </button>
            </div>

            {/* Vertical Separator */}
            <div className="w-px h-8 bg-[#1f1f28]"></div>

            {/* Environment */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Env</span>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as any)}
                disabled={isRunning}
                className="bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 transition-colors disabled:opacity-50"
              >
                <option value="dev">Development</option>
                <option value="staging">Staging</option>
                <option value="prod">Production</option>
              </select>
            </div>

            {/* Test Level */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Level</span>
              <select
                value={testLevel}
                onChange={(e) => setTestLevel(e.target.value)}
                disabled={isRunning}
                className="bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 transition-colors disabled:opacity-50"
              >
                <option value="smoke">Smoke</option>
                <option value="sanity">Sanity</option>
                <option value="regression">Regression</option>
                <option value="full">Full Suite</option>
              </select>
            </div>

            {/* Execution Mode */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Mode</span>
              <select
                value={executionMode}
                onChange={(e) => setExecutionMode(e.target.value as any)}
                disabled={isRunning}
                className="bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 transition-colors disabled:opacity-50 min-w-[200px]"
              >
                <option value="existing">Run existing tests</option>
                <option value="generate">Generate + run tests (AI)</option>
              </select>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3">
            {hasFailures && !isRunning && (
              <button
                onClick={handleRerunFailed}
                className="flex items-center gap-2 px-4 py-2 bg-[#13131a] border border-orange-500/20 hover:bg-orange-500/5 text-orange-400 rounded-lg transition-all text-sm"
              >
                <RefreshCw size={16} />
                Re-run Failed ({failedLogs.length})
              </button>
            )}

            {isRunning ? (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
              >
                <StopCircle size={18} />
                Stop
              </button>
            ) : (
              <button
                onClick={handleRun}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
              >
                <Play size={18} />
                {logs.length > 0 ? 'Run Again' : 'Run Tests'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="responsive-detail-grid flex-1 overflow-hidden grid grid-cols-[1fr_320px]">
        {/* Execution Console */}
        <main className="h-full overflow-y-auto bg-[#060609] p-6">
          {/* Console Header */}
          <div className="mb-4 flex items-center justify-between">
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
                    className="flex items-center gap-4 p-4 cursor-pointer"
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
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Code</div>
                        <div className={`text-sm font-semibold font-mono ${
                          log.responseCode >= 200 && log.responseCode < 300 ? 'text-green-400' :
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

                      <div className="text-xs text-gray-500 flex-shrink-0">{log.timestamp}</div>

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
                      <div className="grid grid-cols-2 gap-4">
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
