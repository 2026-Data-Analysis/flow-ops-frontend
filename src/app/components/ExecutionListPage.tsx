import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  Play,
  Sparkles,
  X,
  AlertCircle,
  FileText,
  Code,
  Loader2
} from 'lucide-react';
import { flowOpsApi, getDefaultAppId, type ExecutionDetailResponse, type ExecutionStepLogResponse, type IncidentAnalyzeResponse } from '../api/flowOpsClient';
import { IncidentRootCauseList } from './IncidentRootCauseList';
import { normalizeAssertionResults, type NormalizedAssertionResult } from '../utils/executionAssertions';
import { parseMaybeJson } from '../utils/incidentAnalysis';

interface ExecutionLog {
  id: string;
  timestamp: string;
  execution: string;
  step?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  status: 'success' | 'failed';
  duration: number;
  environment: string;
  testLevel: 'smoke' | 'sanity' | 'regression' | 'full';
  responseCode?: number;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  errorMessage?: string;
  expectedResult?: string;
  actualResult?: string;
  assertions: NormalizedAssertionResult[];
  scenarioSteps?: { step: number; name: string; method: string; path: string; status: 'success' | 'failed'; duration: number }[];
}

const methodColors = {
  GET: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  POST: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  PUT: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  DELETE: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  PATCH: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

const envColors = {
  dev: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  staging: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  prod: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
};

const getEnvColor = (environment: string) =>
  envColors[environment as keyof typeof envColors] || { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };

const normalizeMethod = (method?: string): ExecutionLog['method'] =>
  (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method || '') ? method : 'GET') as ExecutionLog['method'];

const normalizeExecutionStatus = (status?: string): ExecutionLog['status'] =>
  status === 'SUCCESS' ? 'success' : 'failed';

const normalizeStepLog = (step: ExecutionStepLogResponse, execution: ExecutionDetailResponse): ExecutionLog => ({
  id: String(step.id),
  timestamp: step.executedAt || step.startedAt || execution.executedAt || '',
  execution: execution.caseName || execution.executionType || `Execution #${execution.id}`,
  step: step.step || step.caseName,
  method: normalizeMethod(step.method || execution.endpoint?.split(' ')[0]),
  path: step.endpoint || execution.endpoint || 'Unknown endpoint',
  status: normalizeExecutionStatus(step.status || (step.success === false ? 'FAILED' : 'SUCCESS')),
  duration: step.durationMs || 0,
  environment: execution.environmentName || String(execution.environmentId),
  testLevel: (execution.testLevel?.toLowerCase() as ExecutionLog['testLevel']) || 'smoke',
  responseCode: step.responseCode,
  requestBody: step.requestBody ? JSON.stringify(step.requestBody, null, 2) : undefined,
  responseBody: step.responseBody ? JSON.stringify(step.responseBody, null, 2) : undefined,
  errorMessage: step.errorMessage || execution.errorMessage,
  assertions: normalizeAssertionResults(step.validationResults, step.assertionResults),
});

const normalizeExecution = (execution: ExecutionDetailResponse): ExecutionLog[] => {
  if (execution.timeline?.length) {
    return execution.timeline.map((step) => normalizeStepLog(step, execution));
  }

  return [{
    id: String(execution.id),
    timestamp: execution.executedAt || '',
    execution: execution.caseName || execution.executionType || `Execution #${execution.id}`,
    method: normalizeMethod(execution.endpoint?.split(' ')[0]),
    path: execution.endpoint || 'Unknown endpoint',
    status: normalizeExecutionStatus(execution.status),
    duration: execution.durationMs || execution.responseTimeMs || execution.avgDurationMs || 0,
    environment: execution.environmentName || String(execution.environmentId),
    testLevel: (execution.testLevel?.toLowerCase() as ExecutionLog['testLevel']) || 'smoke',
    responseCode: execution.statusCode,
    responseBody: execution.response ? JSON.stringify(execution.response, null, 2) : undefined,
    errorMessage: execution.errorMessage,
    assertions: [],
  }];
};

export function ExecutionListPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFailedOnly, setShowFailedOnly] = useState(false);
  const [showSlowOnly, setShowSlowOnly] = useState(false);
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [testLevelFilter, setTestLevelFilter] = useState<'all' | 'smoke' | 'sanity' | 'regression' | 'full'>('all');

  const selectedLog = selectedLogId ? logs.find(l => l.id === selectedLogId) : null;
  const [isAnalyzingIncident, setIsAnalyzingIncident] = useState(false);
  const [incidentAnalysis, setIncidentAnalysis] = useState<IncidentAnalyzeResponse | null>(null);
  const [incidentAnalysisError, setIncidentAnalysisError] = useState<string | null>(null);
  const incidentAnalysisRequestRef = useRef(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    flowOpsApi
      .listExecutions(getDefaultAppId())
      .then((page) => {
        if (!active) return;
        const next = page.content.flatMap(normalizeExecution);
        setLogs(next);
        setApiError(null);
      })
      .catch((error) => {
        if (!active) return;
        setLogs([]);
        setApiError(error instanceof Error ? error.message : 'Failed to load execution history.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.execution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.errorMessage && log.errorMessage.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFailed = !showFailedOnly || log.status === 'failed';
    const matchesSlow = !showSlowOnly || log.duration > 200;
    const matchesEnv = environmentFilter === 'all' || log.environment === environmentFilter;
    const matchesLevel = testLevelFilter === 'all' || log.testLevel === testLevelFilter;

    return matchesSearch && matchesFailed && matchesSlow && matchesEnv && matchesLevel;
  });

  const handleRerun = () => {
    if (!selectedLog) return;
    navigate('/execution/run', { state: { rerunLog: selectedLog } });
  };

  const handleGenerateIncidentReport = async (navigateAfter = true, targetLog = selectedLog) => {
    if (!targetLog) return;
    const requestId = ++incidentAnalysisRequestRef.current;
    setIsAnalyzingIncident(true);
    setIncidentAnalysisError(null);
    try {
      const rawLog = [
        targetLog.errorMessage,
        targetLog.step ? `Step: ${targetLog.step}` : null,
        `${targetLog.method} ${targetLog.path} -> ${targetLog.responseCode ?? 'no response'}`,
      ].filter(Boolean).join('\n');

      const analysis = await flowOpsApi.analyzeIncident({
        project_id: String(getDefaultAppId()),
        service_name: targetLog.execution,
        occurred_at: targetLog.timestamp || new Date().toISOString(),
        raw_log: rawLog,
        log_entries: [{
          timestamp: targetLog.timestamp || new Date().toISOString(),
          level: 'ERROR',
          message: targetLog.errorMessage || `${targetLog.method} ${targetLog.path} failed`,
          logger: targetLog.path,
          stack_trace: null,
          extra: { statusCode: String(targetLog.responseCode ?? '') },
        }],
        failure_context: {
          endpoint: `${targetLog.method} ${targetLog.path}`,
          expected_status: 200,
          actual_status: targetLog.responseCode,
          request_body: parseMaybeJson(targetLog.requestBody),
          response_body: parseMaybeJson(targetLog.responseBody),
          error_message: targetLog.errorMessage,
        },
      });
      if (requestId !== incidentAnalysisRequestRef.current) return;
      setIncidentAnalysis(analysis);
      if (navigateAfter) {
        navigate('/monitoring/response', { state: { incidentAnalysis: analysis, executionId: targetLog.id } });
      }
    } catch (error) {
      if (requestId !== incidentAnalysisRequestRef.current) return;
      setIncidentAnalysis(null);
      setIncidentAnalysisError(error instanceof Error ? error.message : 'Failed to analyze incident.');
    } finally {
      if (requestId === incidentAnalysisRequestRef.current) {
        setIsAnalyzingIncident(false);
      }
    }
  };

  useEffect(() => {
    incidentAnalysisRequestRef.current += 1;
    setIncidentAnalysis(null);
    setIncidentAnalysisError(null);
    if (selectedLog?.status === 'failed') {
      void handleGenerateIncidentReport(false, selectedLog);
    } else {
      setIsAnalyzingIncident(false);
    }
  }, [selectedLogId]);

  return (
    <div className="responsive-detail-grid flex-1 overflow-hidden bg-[#060609] grid" style={{ gridTemplateColumns: selectedLogId ? '1fr 600px' : '1fr' }}>
      {/* Main: Execution Logs Table */}
      <main className="flex flex-col overflow-hidden bg-[#060609]">
        {/* Header */}
        <div className="bg-[#0a0a0f] border-b border-[#1f1f28] px-8 py-6">
          <div className="responsive-header flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Execution Logs</h1>
              <p className="text-gray-500 text-sm">Test execution history and debugging</p>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-[#13131a] border border-[#1f1f28] hover:border-blue-500/30 text-white rounded-lg transition-all text-sm">
              <Download size={16} />
              Export
            </button>
          </div>

          {/* Search and Filters */}
          <div className="responsive-filters flex items-center gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search execution, path, or error..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/30"
              />
            </div>

            {/* Failed Only Toggle */}
            <button
              onClick={() => setShowFailedOnly(!showFailedOnly)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all ${
                showFailedOnly
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-[#13131a] border border-[#1f1f28] text-gray-400 hover:text-white'
              }`}
            >
              <XCircle size={14} />
              Failed Only
            </button>

            {/* Slow Requests Toggle */}
            <button
              onClick={() => setShowSlowOnly(!showSlowOnly)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all ${
                showSlowOnly
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'bg-[#13131a] border border-[#1f1f28] text-gray-400 hover:text-white'
              }`}
            >
              <Clock size={14} />
              Slow (&gt;200ms)
            </button>

            {/* Environment Filter */}
            <select
              value={environmentFilter}
              onChange={(e) => setEnvironmentFilter(e.target.value as any)}
              className="px-4 py-2.5 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/30"
            >
              <option value="all">All Environments</option>
              <option value="dev">Dev</option>
              <option value="staging">Staging</option>
              <option value="prod">Prod</option>
            </select>

            {/* Test Level Filter */}
            <select
              value={testLevelFilter}
              onChange={(e) => setTestLevelFilter(e.target.value as any)}
              className="px-4 py-2.5 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/30"
            >
              <option value="all">All Levels</option>
              <option value="smoke">Smoke</option>
              <option value="sanity">Sanity</option>
              <option value="regression">Regression</option>
              <option value="full">Full</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="responsive-table-wrap flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-[#0a0a0f] border-b border-[#1f1f28] sticky top-0 z-10">
              <tr>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-6 py-4 font-medium">Timestamp</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-6 py-4 font-medium">Execution</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-6 py-4 font-medium">Step</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-6 py-4 font-medium">Method</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-6 py-4 font-medium">Path</th>
                <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-6 py-4 font-medium">Status</th>
                <th className="text-right text-xs text-gray-500 uppercase tracking-wider px-6 py-4 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLogId(log.id)}
                  className={`border-b border-[#1f1f28] cursor-pointer transition-colors ${
                    selectedLogId === log.id
                      ? 'bg-blue-500/10'
                      : log.status === 'failed'
                      ? 'bg-red-500/5 hover:bg-red-500/10'
                      : 'hover:bg-[#0d0d12]'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-400 font-mono">{log.timestamp}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white font-medium">{log.execution}</div>
                    {log.errorMessage && (
                      <div className="mt-1 max-w-sm truncate text-xs text-red-300">{log.errorMessage}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {log.step ? (
                      <div className="text-xs text-gray-400">{log.step}</div>
                    ) : (
                      <div className="text-xs text-gray-600">-</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold font-mono ${methodColors[log.method].bg} ${methodColors[log.method].text} ${methodColors[log.method].border} border`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300 font-mono">{log.path}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {log.status === 'success' ? (
                        <>
                          <CheckCircle2 size={16} className="text-green-400" />
                          <span className="text-sm text-green-400">Success</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={16} className="text-red-400" />
                          <span className="text-sm text-red-400">Failed</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={`text-sm font-mono ${
                      log.duration > 200 ? 'text-orange-400' : 'text-gray-400'
                    }`}>
                      {log.duration}ms
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-[#13131a] rounded-full flex items-center justify-center mb-4">
                <Search size={24} className="text-gray-500" />
              </div>
              <h3 className="text-white mb-2">No logs found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </main>

      {/* Right: Log Detail Panel */}
      {selectedLogId && selectedLog && (
        <aside className="bg-[#0a0a0f] border-l border-[#1f1f28] flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-[#1f1f28] flex items-center justify-between">
            <h3 className="text-white font-semibold">Log Details</h3>
            <button
              onClick={() => setSelectedLogId(null)}
              className="p-2 hover:bg-[#1f1f28] rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* A. Summary */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Summary</div>
              <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Timestamp</span>
                  <span className="text-sm text-white font-mono">{selectedLog.timestamp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Execution</span>
                  <span className="text-sm text-white font-medium">{selectedLog.execution}</span>
                </div>
                {selectedLog.step && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Step</span>
                    <span className="text-sm text-white">{selectedLog.step}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Environment</span>
                  <span className={`text-xs px-2 py-1 rounded ${getEnvColor(selectedLog.environment).bg} ${getEnvColor(selectedLog.environment).text} ${getEnvColor(selectedLog.environment).border} border capitalize`}>
                    {selectedLog.environment}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <div className="flex items-center gap-2">
                    {selectedLog.status === 'success' ? (
                      <>
                        <CheckCircle2 size={14} className="text-green-400" />
                        <span className="text-sm text-green-400">Success</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={14} className="text-red-400" />
                        <span className="text-sm text-red-400">Failed</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Duration</span>
                  <span className="text-sm text-white font-mono">{selectedLog.duration}ms</span>
                </div>
              </div>
            </div>

            {/* B. Request */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Request</div>
              <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded text-xs font-semibold font-mono ${methodColors[selectedLog.method].bg} ${methodColors[selectedLog.method].text} ${methodColors[selectedLog.method].border} border`}>
                    {selectedLog.method}
                  </span>
                  <span className="text-sm text-white font-mono">{selectedLog.path}</span>
                </div>

                {selectedLog.requestHeaders && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Headers</div>
                    <div className="bg-[#0a0a0f] rounded p-2 space-y-1">
                      {Object.entries(selectedLog.requestHeaders).map(([key, value]) => (
                        <div key={key} className="text-xs font-mono">
                          <span className="text-gray-400">{key}:</span>{' '}
                          <span className="text-gray-300">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedLog.requestBody && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Body</div>
                    <pre className="bg-[#0a0a0f] rounded p-3 text-xs text-gray-300 font-mono overflow-x-auto">
                      {selectedLog.requestBody}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* C. Response */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Response</div>
              <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4 space-y-3">
                {selectedLog.responseCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Status Code</span>
                    <span className={`text-sm font-semibold font-mono ${
                      selectedLog.responseCode >= 200 && selectedLog.responseCode < 300 ? 'text-green-400' :
                      selectedLog.responseCode >= 400 ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {selectedLog.responseCode}
                    </span>
                  </div>
                )}

                {selectedLog.responseBody && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Body</div>
                    <pre className="bg-[#0a0a0f] rounded p-3 text-xs text-gray-300 font-mono overflow-x-auto max-h-48">
                      {selectedLog.responseBody}
                    </pre>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Response Time</span>
                  <span className="text-sm text-white font-mono">{selectedLog.duration}ms</span>
                </div>
              </div>
            </div>

            {/* D. Validation / Error */}
            {(selectedLog.errorMessage || selectedLog.assertions.length > 0) && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Validation</div>
                <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4 space-y-3">
                  {selectedLog.errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-xs text-red-400 mb-1">Error Message</div>
                          <div className="text-sm text-red-300">{selectedLog.errorMessage}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedLog.expectedResult && selectedLog.actualResult && (
                    <div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-2">Expected</div>
                          <div className="bg-[#0a0a0f] rounded p-2 text-xs text-gray-300">{selectedLog.expectedResult}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-2">Actual</div>
                          <div className="bg-[#0a0a0f] rounded p-2 text-xs text-red-300">{selectedLog.actualResult}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedLog.assertions.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-2">Assertions</div>
                      <div className="space-y-2">
                        {selectedLog.assertions.map((assertion, idx) => (
                          <div key={`${assertion.id}-${idx}`} className="rounded-lg border border-[#1f1f28] bg-[#0a0a0f] p-3">
                            <div className="mb-2 flex items-start gap-2">
                              {assertion.passed ? (
                                <CheckCircle2 size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
                              ) : (
                                <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <div className={`text-xs ${assertion.passed ? 'text-gray-300' : 'text-red-300'}`}>
                                  {assertion.name}
                                </div>
                                <div className="mt-2 grid gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-500">Expected </span>
                                    <span className="font-mono text-gray-300">{assertion.expected}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Actual </span>
                                    <span className="font-mono text-gray-300">{assertion.actual}</span>
                                  </div>
                                </div>
                                {assertion.message && (
                                  <div className="text-xs text-gray-500 mt-2">{assertion.message}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* E. Timeline (for scenarios) */}
            {selectedLog.scenarioSteps && selectedLog.scenarioSteps.length > 1 && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Execution Timeline</div>
                <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4">
                  <div className="space-y-3 relative">
                    {selectedLog.scenarioSteps.map((step, index) => (
                      <div key={index} className="relative">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            step.status === 'success'
                              ? 'bg-green-500/10 border border-green-500/20'
                              : 'bg-red-500/10 border border-red-500/20'
                          }`}>
                            <span className={`text-xs font-semibold ${
                              step.status === 'success' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {step.step}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-white font-medium">{step.name}</span>
                              {step.status === 'success' ? (
                                <CheckCircle2 size={14} className="text-green-400" />
                              ) : (
                                <XCircle size={14} className="text-red-400" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className={`font-mono ${methodColors[step.method as keyof typeof methodColors]?.text || 'text-gray-400'}`}>
                                {step.method}
                              </span>
                              <span className="text-gray-500 font-mono">{step.path}</span>
                              <span className="text-gray-600">-</span>
                              <span className="text-gray-500">{step.duration}ms</span>
                            </div>
                          </div>
                        </div>

                        {index < selectedLog.scenarioSteps!.length - 1 && (
                          <div className="absolute left-4 top-8 bottom-0 w-px bg-gradient-to-b from-blue-500/30 to-transparent h-3"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* F. Actions */}
          <div className="p-6 border-t border-[#1f1f28] space-y-3">
            <button
              onClick={handleRerun}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-semibold"
            >
              <Play size={18} />
              Re-run
            </button>

            {selectedLog.status === 'failed' && (
              <>
                <div className="rounded-lg border border-[#1f1f28] bg-[#13131a] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Sparkles size={16} className="text-purple-400" />
                      AI Failure Analysis
                    </div>
                    {isAnalyzingIncident && (
                      <span className="flex items-center gap-1.5 text-xs text-orange-400">
                        <Loader2 size={13} className="animate-spin" />
                        Analyzing
                      </span>
                    )}
                    {!isAnalyzingIncident && incidentAnalysis && (
                      <span className="flex items-center gap-1.5 text-xs text-green-400">
                        <CheckCircle2 size={13} />
                        Complete
                      </span>
                    )}
                  </div>

                  {isAnalyzingIncident && (
                    <div className="space-y-2">
                      <div className="h-4 w-2/3 rounded bg-[#1f1f28] animate-pulse" />
                      <div className="h-3 w-full rounded bg-[#1f1f28] animate-pulse" />
                      <div className="h-3 w-4/5 rounded bg-[#1f1f28] animate-pulse" />
                    </div>
                  )}

                  {!isAnalyzingIncident && incidentAnalysisError && (
                    <div className="flex items-center gap-2 text-xs text-red-400">
                      <AlertCircle size={14} />
                      {incidentAnalysisError}
                    </div>
                  )}

                  {!isAnalyzingIncident && incidentAnalysis?.data?.root_causes?.length > 0 && (
                    <IncidentRootCauseList causes={incidentAnalysis.data.root_causes} compact />
                  )}
                </div>

                <button
                  onClick={() => {
                    if (incidentAnalysis) {
                      navigate('/monitoring/response', { state: { incidentAnalysis, executionId: selectedLog.id } });
                      return;
                    }
                    void handleGenerateIncidentReport(true);
                  }}
                  disabled={isAnalyzingIncident}
                  className="w-full flex items-center justify-center gap-2 bg-[#13131a] border border-orange-500/20 hover:bg-orange-500/5 text-orange-400 px-4 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzingIncident ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {incidentAnalysis ? 'Use in Response Assistant' : 'Generate Incident Report'}
                </button>
              </>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
