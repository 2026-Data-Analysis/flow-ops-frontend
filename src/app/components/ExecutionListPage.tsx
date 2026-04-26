import { useState } from 'react';
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
  Code
} from 'lucide-react';

interface ExecutionLog {
  id: string;
  timestamp: string;
  execution: string;
  step?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  status: 'success' | 'failed';
  duration: number;
  environment: 'dev' | 'staging' | 'prod';
  testLevel: 'smoke' | 'sanity' | 'regression' | 'full';
  responseCode?: number;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  errorMessage?: string;
  expectedResult?: string;
  actualResult?: string;
  assertions?: { name: string; passed: boolean; message?: string }[];
  scenarioSteps?: { step: number; name: string; method: string; path: string; status: 'success' | 'failed'; duration: number }[];
}

const mockLogs: ExecutionLog[] = [
  {
    id: '1',
    timestamp: '2026-04-10 14:23:01.234',
    execution: 'User Authentication Flow',
    step: 'Step 1: Login',
    method: 'POST',
    path: '/api/v1/auth/login',
    status: 'success',
    duration: 245,
    environment: 'staging',
    testLevel: 'smoke',
    responseCode: 200,
    requestHeaders: { 'Content-Type': 'application/json' },
    requestBody: '{\n  "username": "admin@test.com",\n  "password": "***"\n}',
    responseHeaders: { 'Content-Type': 'application/json' },
    responseBody: '{\n  "token": "jwt_abc123",\n  "user": {\n    "id": "usr_123",\n    "email": "admin@test.com"\n  }\n}',
    assertions: [
      { name: 'Status code is 200', passed: true },
      { name: 'Token exists', passed: true },
      { name: 'User ID exists', passed: true },
    ],
    scenarioSteps: [
      { step: 1, name: 'Login', method: 'POST', path: '/api/v1/auth/login', status: 'success', duration: 245 },
      { step: 2, name: 'Get Profile', method: 'GET', path: '/api/v1/users/usr_123', status: 'success', duration: 89 },
    ],
  },
  {
    id: '2',
    timestamp: '2026-04-10 14:23:01.523',
    execution: 'User Authentication Flow',
    step: 'Step 2: Get Profile',
    method: 'GET',
    path: '/api/v1/users/usr_123',
    status: 'success',
    duration: 89,
    environment: 'staging',
    testLevel: 'smoke',
    responseCode: 200,
    scenarioSteps: [
      { step: 1, name: 'Login', method: 'POST', path: '/api/v1/auth/login', status: 'success', duration: 245 },
      { step: 2, name: 'Get Profile', method: 'GET', path: '/api/v1/users/usr_123', status: 'success', duration: 89 },
    ],
  },
  {
    id: '3',
    timestamp: '2026-04-10 13:45:18.456',
    execution: 'POST /api/v1/posts',
    method: 'POST',
    path: '/api/v1/posts',
    status: 'failed',
    duration: 156,
    environment: 'staging',
    testLevel: 'regression',
    responseCode: 400,
    requestBody: '{\n  "content": "Hello World"\n}',
    responseBody: '{\n  "error": "Validation failed",\n  "details": {\n    "title": "Title is required"\n  }\n}',
    errorMessage: 'Validation error: title field is required',
    expectedResult: 'Status code 201',
    actualResult: 'Status code 400',
    assertions: [
      { name: 'Status code is 201', passed: false, message: 'Expected 201 but got 400' },
      { name: 'Post ID exists', passed: false, message: 'Post was not created' },
    ],
  },
  {
    id: '4',
    timestamp: '2026-04-10 12:30:45.123',
    execution: 'GET /api/v1/users/:id',
    method: 'GET',
    path: '/api/v1/users/usr_456',
    status: 'success',
    duration: 89,
    environment: 'prod',
    testLevel: 'smoke',
    responseCode: 200,
    responseBody: '{\n  "id": "usr_456",\n  "name": "John Doe",\n  "email": "john@example.com"\n}',
  },
  {
    id: '5',
    timestamp: '2026-04-10 11:20:15.789',
    execution: 'Post Creation Scenario',
    step: 'Step 2: Create Post',
    method: 'POST',
    path: '/api/v1/posts',
    status: 'failed',
    duration: 234,
    environment: 'dev',
    testLevel: 'sanity',
    responseCode: 403,
    errorMessage: 'Forbidden: Invalid authentication token',
    expectedResult: 'Status code 201',
    actualResult: 'Status code 403',
    assertions: [
      { name: 'Authentication valid', passed: false, message: 'Token expired or invalid' },
      { name: 'Post created', passed: false },
    ],
    scenarioSteps: [
      { step: 1, name: 'Login', method: 'POST', path: '/api/v1/auth/login', status: 'success', duration: 189 },
      { step: 2, name: 'Create Post', method: 'POST', path: '/api/v1/posts', status: 'failed', duration: 234 },
    ],
  },
  {
    id: '6',
    timestamp: '2026-04-10 10:15:22.345',
    execution: 'DELETE /api/v1/users/:id',
    method: 'DELETE',
    path: '/api/v1/users/usr_789',
    status: 'success',
    duration: 67,
    environment: 'staging',
    testLevel: 'regression',
    responseCode: 204,
  },
  {
    id: '7',
    timestamp: '2026-04-10 09:45:10.567',
    execution: 'Token Expiration Recovery',
    step: 'Step 3: Access Protected',
    method: 'GET',
    path: '/api/v1/users/profile',
    status: 'failed',
    duration: 123,
    environment: 'staging',
    testLevel: 'full',
    responseCode: 401,
    errorMessage: 'Unauthorized: Token has expired',
    scenarioSteps: [
      { step: 1, name: 'Login', method: 'POST', path: '/api/v1/auth/login', status: 'success', duration: 245 },
      { step: 2, name: 'Wait', method: 'GET', path: '/api/v1/wait', status: 'success', duration: 5000 },
      { step: 3, name: 'Access Protected', method: 'GET', path: '/api/v1/users/profile', status: 'failed', duration: 123 },
    ],
  },
  {
    id: '8',
    timestamp: '2026-04-10 08:30:00.890',
    execution: 'PUT /api/v1/posts/:id',
    method: 'PUT',
    path: '/api/v1/posts/post_123',
    status: 'success',
    duration: 134,
    environment: 'dev',
    testLevel: 'regression',
    responseCode: 200,
  },
];

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

export function ExecutionListPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ExecutionLog[]>(mockLogs);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFailedOnly, setShowFailedOnly] = useState(false);
  const [showSlowOnly, setShowSlowOnly] = useState(false);
  const [environmentFilter, setEnvironmentFilter] = useState<'all' | 'dev' | 'staging' | 'prod'>('all');
  const [testLevelFilter, setTestLevelFilter] = useState<'all' | 'smoke' | 'sanity' | 'regression' | 'full'>('all');

  const selectedLog = selectedLogId ? logs.find(l => l.id === selectedLogId) : null;

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

  const handleGenerateTests = () => {
    if (!selectedLog) return;
    navigate('/qc/testcase', { state: { generateFromFailure: true, log: selectedLog } });
  };

  return (
    <div className="flex-1 overflow-hidden bg-[#060609] grid" style={{ gridTemplateColumns: selectedLogId ? '1fr 600px' : '1fr' }}>
      {/* Main: Execution Logs Table */}
      <main className="flex flex-col overflow-hidden bg-[#060609]">
        {/* Header */}
        <div className="bg-[#0a0a0f] border-b border-[#1f1f28] px-8 py-6">
          <div className="flex items-center justify-between mb-6">
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
          <div className="flex items-center gap-3">
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
        <div className="flex-1 overflow-y-auto">
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
                  </td>
                  <td className="px-6 py-4">
                    {log.step ? (
                      <div className="text-xs text-gray-400">{log.step}</div>
                    ) : (
                      <div className="text-xs text-gray-600">—</div>
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
                  <span className={`text-xs px-2 py-1 rounded ${envColors[selectedLog.environment].bg} ${envColors[selectedLog.environment].text} ${envColors[selectedLog.environment].border} border capitalize`}>
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
            {(selectedLog.errorMessage || selectedLog.assertions) && (
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

                  {selectedLog.assertions && (
                    <div>
                      <div className="text-xs text-gray-500 mb-2">Assertions</div>
                      <div className="space-y-2">
                        {selectedLog.assertions.map((assertion, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            {assertion.passed ? (
                              <CheckCircle2 size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className={`text-xs ${assertion.passed ? 'text-gray-300' : 'text-red-300'}`}>
                                {assertion.name}
                              </div>
                              {assertion.message && (
                                <div className="text-xs text-gray-500 mt-0.5">{assertion.message}</div>
                              )}
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
                              <span className="text-gray-600">•</span>
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
              <button
                onClick={handleGenerateTests}
                className="w-full flex items-center justify-center gap-2 bg-[#13131a] border border-purple-500/20 hover:bg-purple-500/5 text-purple-400 px-4 py-3 rounded-lg transition-all"
              >
                <Sparkles size={18} />
                Generate Test Cases from Failure
              </button>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
