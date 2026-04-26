import { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  X,
  Code,
  FileJson,
  AlertTriangle,
  Zap,
  Calendar,
  Activity,
  ArrowUpDown,
  ExternalLink
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  executionId: string;
  executionName: string;
  stepName: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  status: 'success' | 'failed';
  statusCode: number;
  duration: number;
  environment: 'dev' | 'staging' | 'prod';
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  };
  response: {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    duration: number;
  };
  assertions?: AssertionResult[];
  errorMessage?: string;
  expectedValue?: string;
  actualValue?: string;
}

interface AssertionResult {
  id: string;
  type: string;
  fieldPath: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const mockLogs: LogEntry[] = [
  {
    id: 'log_001',
    timestamp: '2026-04-01 14:32:15.234',
    executionId: 'exec_001',
    executionName: 'User Authentication Flow',
    stepName: 'Login - Get Auth Token',
    method: 'POST',
    path: '/api/v1/auth/login',
    status: 'success',
    statusCode: 200,
    duration: 245,
    environment: 'staging',
    request: {
      method: 'POST',
      url: 'https://staging.api.example.com/api/v1/auth/login',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: '{\n  "email": "test@example.com",\n  "password": "password123"\n}',
    },
    response: {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': 'req_abc123',
      },
      body: '{\n  "success": true,\n  "data": {\n    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n    "user": {\n      "id": "usr_123",\n      "email": "test@example.com"\n    }\n  }\n}',
      duration: 245,
    },
    assertions: [
      { id: 'a1', type: 'exists', fieldPath: 'data.token', expected: 'exists', actual: 'exists', passed: true },
      { id: 'a2', type: 'equals', fieldPath: 'success', expected: 'true', actual: 'true', passed: true },
    ],
  },
  {
    id: 'log_002',
    timestamp: '2026-04-01 14:32:15.512',
    executionId: 'exec_001',
    executionName: 'User Authentication Flow',
    stepName: 'Create New Post',
    method: 'POST',
    path: '/api/v1/posts',
    status: 'success',
    statusCode: 201,
    duration: 134,
    environment: 'staging',
    request: {
      method: 'POST',
      url: 'https://staging.api.example.com/api/v1/posts',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      body: '{\n  "title": "Test Post",\n  "content": "Test content"\n}',
    },
    response: {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{\n  "success": true,\n  "data": {\n    "id": "post_456",\n    "title": "Test Post"\n  }\n}',
      duration: 134,
    },
  },
  {
    id: 'log_003',
    timestamp: '2026-04-01 11:15:32.789',
    executionId: 'exec_002',
    executionName: 'Login API Test',
    stepName: 'Login - Missing Field',
    method: 'POST',
    path: '/api/v1/auth/login',
    status: 'failed',
    statusCode: 500,
    duration: 369,
    environment: 'prod',
    request: {
      method: 'POST',
      url: 'https://api.example.com/api/v1/auth/login',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{\n  "password": "password123"\n}',
    },
    response: {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{\n  "success": false,\n  "error": {\n    "code": "INTERNAL_ERROR",\n    "message": "An unexpected error occurred"\n  }\n}',
      duration: 369,
    },
    assertions: [
      { id: 'a3', type: 'equals', fieldPath: 'response.status', expected: '400', actual: '500', passed: false },
      { id: 'a4', type: 'equals', fieldPath: 'error.code', expected: 'MISSING_FIELD', actual: 'INTERNAL_ERROR', passed: false },
    ],
    errorMessage: 'Expected status 400 but received 500. Server error instead of validation error.',
    expectedValue: '400',
    actualValue: '500',
  },
  {
    id: 'log_004',
    timestamp: '2026-04-01 10:45:12.123',
    executionId: 'exec_003',
    executionName: 'Get User Profile',
    stepName: 'Fetch User Details',
    method: 'GET',
    path: '/api/v1/users/123',
    status: 'success',
    statusCode: 200,
    duration: 89,
    environment: 'dev',
    request: {
      method: 'GET',
      url: 'https://dev.api.example.com/api/v1/users/123',
      headers: {
        'Authorization': 'Bearer token123',
      },
    },
    response: {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{\n  "success": true,\n  "data": {\n    "id": "123",\n    "name": "John Doe",\n    "email": "john@example.com"\n  }\n}',
      duration: 89,
    },
  },
  {
    id: 'log_005',
    timestamp: '2026-04-01 09:30:45.678',
    executionId: 'exec_004',
    executionName: 'Delete Post',
    stepName: 'Delete Post by ID',
    method: 'DELETE',
    path: '/api/v1/posts/456',
    status: 'failed',
    statusCode: 404,
    duration: 2456,
    environment: 'staging',
    request: {
      method: 'DELETE',
      url: 'https://staging.api.example.com/api/v1/posts/456',
      headers: {
        'Authorization': 'Bearer token456',
      },
    },
    response: {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{\n  "success": false,\n  "error": {\n    "code": "NOT_FOUND",\n    "message": "Post not found"\n  }\n}',
      duration: 2456,
    },
    errorMessage: 'Post not found. Response time exceeded threshold (>2s).',
  },
];

const methodColors = {
  GET: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  POST: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  PUT: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  DELETE: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  PATCH: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

export function LogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>('24h');
  const [showFilters, setShowFilters] = useState(false);
  const [showFailedOnly, setShowFailedOnly] = useState(false);
  const [showSlowOnly, setShowSlowOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const logsPerPage = 50;

  const selectedLog = selectedLogId ? logs.find(l => l.id === selectedLogId) : null;

  const filteredLogs = logs.filter(log => {
    // Search
    const matchesSearch = 
      log.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.executionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.stepName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.errorMessage && log.errorMessage.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filters
    const matchesEnv = environmentFilter === 'all' || log.environment === environmentFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || log.method === methodFilter;

    // Quick filters
    const matchesFailedOnly = !showFailedOnly || log.status === 'failed';
    const matchesSlowOnly = !showSlowOnly || log.duration > 2000;

    return matchesSearch && matchesEnv && matchesStatus && matchesMethod && matchesFailedOnly && matchesSlowOnly;
  });

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

  const handleClosePanel = () => {
    setSelectedLogId(null);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const handleViewExecution = () => {
    if (selectedLog) {
      navigate(`/execution/history?id=${selectedLog.executionId}`);
    }
  };

  return (
    <div className="flex-1 overflow-hidden bg-[#060609] flex">
      {/* Main Panel: Log Table */}
      <main className={`bg-[#0a0a0f] flex flex-col transition-all duration-300 ${
        selectedLogId ? 'w-[calc(100%-520px)]' : 'flex-1'
      }`}>
        {/* Header & Controls */}
        <div className="p-6 border-b border-[#1f1f28] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-lg mb-1">Execution Logs</h2>
              <p className="text-gray-500 text-sm">{filteredLogs.length} logs found</p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-[#13131a] border border-[#1f1f28] hover:border-blue-500/30 hover:bg-blue-500/5 text-white px-4 py-2 rounded-lg transition-all"
            >
              <Download size={16} />
              Export
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by path, scenario, step, or error message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/30"
            />
          </div>

          {/* Quick Filters & Main Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Filters */}
            <button
              onClick={() => setShowFailedOnly(!showFailedOnly)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showFailedOnly ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[#13131a] border border-[#1f1f28] text-gray-400 hover:text-white'
              }`}
            >
              <XCircle size={14} />
              Failed Only
            </button>
            <button
              onClick={() => setShowSlowOnly(!showSlowOnly)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showSlowOnly ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-[#13131a] border border-[#1f1f28] text-gray-400 hover:text-white'
              }`}
            >
              <Clock size={14} />
              Slow (&gt;2s)
            </button>

            <div className="h-6 w-px bg-[#1f1f28]"></div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showFilters ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-[#13131a] border border-[#1f1f28] text-gray-400 hover:text-white'
              }`}
            >
              <Filter size={14} />
              Filters
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Environment</label>
                <select
                  value={environmentFilter}
                  onChange={(e) => setEnvironmentFilter(e.target.value)}
                  className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/30"
                >
                  <option value="all">All</option>
                  <option value="dev">Dev</option>
                  <option value="staging">Staging</option>
                  <option value="prod">Prod</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/30"
                >
                  <option value="all">All</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Method</label>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/30"
                >
                  <option value="all">All</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Time Range</label>
                <select
                  value={timeRangeFilter}
                  onChange={(e) => setTimeRangeFilter(e.target.value)}
                  className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/30"
                >
                  <option value="1h">Last 1 hour</option>
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Log Table */}
        <div className="flex-1 overflow-auto">
          {paginatedLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-[#13131a] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity size={32} className="text-gray-500" />
                </div>
                <h3 className="text-white text-lg mb-2">No logs available</h3>
                <p className="text-gray-500 text-sm mb-4">Try adjusting your filters or run some tests</p>
                <button
                  onClick={() => navigate('/execution/run')}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Activity size={16} />
                  Run Tests
                </button>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-[#13131a] border-b border-[#1f1f28] z-10">
                <tr>
                  <th className="text-left text-xs text-gray-400 font-medium py-3 px-4 w-[180px]">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      Timestamp
                    </div>
                  </th>
                  <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Execution</th>
                  <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Step</th>
                  <th className="text-left text-xs text-gray-400 font-medium py-3 px-4 w-[100px]">Method</th>
                  <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Path</th>
                  <th className="text-left text-xs text-gray-400 font-medium py-3 px-4 w-[80px]">Status</th>
                  <th className="text-left text-xs text-gray-400 font-medium py-3 px-4 w-[80px]">Code</th>
                  <th className="text-left text-xs text-gray-400 font-medium py-3 px-4 w-[90px]">Duration</th>
                  <th className="text-left text-xs text-gray-400 font-medium py-3 px-4 w-[100px]">Env</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`border-b border-[#1f1f28] cursor-pointer transition-all ${
                      selectedLogId === log.id
                        ? 'bg-blue-500/10 border-l-2 border-l-blue-500'
                        : log.status === 'failed'
                        ? 'bg-red-500/5 hover:bg-red-500/10 border-l-2 border-l-transparent'
                        : 'hover:bg-[#13131a] border-l-2 border-l-transparent'
                    }`}
                  >
                    <td className="py-3 px-4 text-xs text-gray-400 font-mono">{log.timestamp}</td>
                    <td className="py-3 px-4 text-xs text-white">{log.executionName}</td>
                    <td className="py-3 px-4 text-xs text-gray-300">{log.stepName}</td>
                    <td className="py-3 px-4">
                      <span className={`${methodColors[log.method].bg} ${methodColors[log.method].text} ${methodColors[log.method].border} border px-2 py-0.5 rounded text-xs font-semibold font-mono`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-300 font-mono">{log.path}</td>
                    <td className="py-3 px-4">
                      {log.status === 'success' ? (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <XCircle size={12} />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className={`py-3 px-4 text-xs font-mono font-semibold ${
                      log.statusCode >= 200 && log.statusCode < 300 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {log.statusCode}
                    </td>
                    <td className={`py-3 px-4 text-xs font-mono ${
                      log.duration > 2000 ? 'text-orange-400' : 'text-gray-400'
                    }`}>
                      {formatDuration(log.duration)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        log.environment === 'prod'
                          ? 'bg-green-500/10 text-green-400'
                          : log.environment === 'staging'
                          ? 'bg-orange-500/10 text-orange-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {log.environment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-[#1f1f28] p-4 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {(currentPage - 1) * logsPerPage + 1} to {Math.min(currentPage * logsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-[#13131a] border border-[#1f1f28] hover:border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-all"
              >
                Previous
              </button>
              <div className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-[#13131a] border border-[#1f1f28] hover:border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Right Panel: Log Detail */}
      {selectedLog ? (
        <aside className="w-[520px] bg-[#0a0a0f] border-l border-[#1f1f28] overflow-y-auto animate-slide-in">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-white text-lg mb-1">Log Details</h2>
                <p className="text-gray-500 text-sm">Full request and response information</p>
              </div>
              <button
                onClick={handleClosePanel}
                className="flex items-center justify-center w-8 h-8 bg-[#13131a] border border-[#1f1f28] hover:border-red-500/30 hover:bg-red-500/5 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                title="Close panel"
              >
                <X size={16} />
              </button>
            </div>

            {/* [1] Summary */}
            <div className="bg-[#13131a] border border-[#1f1f28] rounded-xl p-4">
              <h3 className="text-white text-sm mb-3">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Timestamp</span>
                  <span className="text-white font-mono text-xs">{selectedLog.timestamp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Execution</span>
                  <button
                    onClick={handleViewExecution}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs"
                  >
                    {selectedLog.executionName}
                    <ExternalLink size={12} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Step</span>
                  <span className="text-white text-xs">{selectedLog.stepName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Environment</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedLog.environment === 'prod'
                      ? 'bg-green-500/10 text-green-400'
                      : selectedLog.environment === 'staging'
                      ? 'bg-orange-500/10 text-orange-400'
                      : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {selectedLog.environment}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status</span>
                  {selectedLog.status === 'success' ? (
                    <span className="flex items-center gap-1 text-green-400 text-xs">
                      <CheckCircle2 size={12} />
                      Success
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 text-xs">
                      <XCircle size={12} />
                      Failed
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Duration</span>
                  <span className={`font-mono text-xs ${
                    selectedLog.duration > 2000 ? 'text-orange-400' : 'text-white'
                  }`}>
                    {formatDuration(selectedLog.duration)}
                  </span>
                </div>
              </div>
            </div>

            {/* [5] Error Details (if failed) */}
            {selectedLog.status === 'failed' && selectedLog.errorMessage && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <h3 className="text-white text-sm mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-400" />
                  Error Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-400 mb-2">Error Message</div>
                    <div className="text-sm text-red-400 bg-[#13131a] rounded p-3">{selectedLog.errorMessage}</div>
                  </div>
                  {selectedLog.expectedValue && selectedLog.actualValue && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Expected</div>
                        <code className="text-xs text-green-400 bg-[#13131a] px-2 py-1 rounded block font-mono">
                          {selectedLog.expectedValue}
                        </code>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Actual</div>
                        <code className="text-xs text-red-400 bg-[#13131a] px-2 py-1 rounded block font-mono">
                          {selectedLog.actualValue}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* [2] Request */}
            <div className="bg-[#13131a] border border-[#1f1f28] rounded-xl p-4">
              <h3 className="text-white text-sm mb-3 flex items-center gap-2">
                <Code size={16} className="text-blue-400" />
                Request
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Method & URL</div>
                  <div className="flex items-center gap-2 bg-[#1f1f28] rounded p-2">
                    <span className={`${methodColors[selectedLog.method].bg} ${methodColors[selectedLog.method].text} ${methodColors[selectedLog.method].border} border px-2 py-0.5 rounded text-xs font-semibold font-mono`}>
                      {selectedLog.method}
                    </span>
                    <span className="text-xs text-white font-mono break-all">{selectedLog.request.url}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-2">Headers</div>
                  <div className="bg-[#1f1f28] rounded p-3 space-y-1 max-h-32 overflow-y-auto">
                    {Object.entries(selectedLog.request.headers).map(([key, value]) => (
                      <div key={key} className="text-xs font-mono">
                        <span className="text-blue-400">{key}:</span>{' '}
                        <span className="text-gray-300">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedLog.request.body && (
                  <div>
                    <div className="text-xs text-gray-400 mb-2">Body</div>
                    <pre className="bg-[#1f1f28] rounded p-3 text-xs font-mono text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
                      {selectedLog.request.body}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* [3] Response */}
            <div className="bg-[#13131a] border border-[#1f1f28] rounded-xl p-4">
              <h3 className="text-white text-sm mb-3 flex items-center gap-2">
                <FileJson size={16} className="text-green-400" />
                Response
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Status Code</div>
                    <div className={`text-sm font-mono font-semibold ${
                      selectedLog.response.statusCode >= 200 && selectedLog.response.statusCode < 300
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      {selectedLog.response.statusCode}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Response Time</div>
                    <div className={`text-sm font-mono ${
                      selectedLog.response.duration > 2000 ? 'text-orange-400' : 'text-white'
                    }`}>
                      {formatDuration(selectedLog.response.duration)}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-2">Headers</div>
                  <div className="bg-[#1f1f28] rounded p-3 space-y-1 max-h-32 overflow-y-auto">
                    {Object.entries(selectedLog.response.headers).map(([key, value]) => (
                      <div key={key} className="text-xs font-mono">
                        <span className="text-green-400">{key}:</span>{' '}
                        <span className="text-gray-300">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-2">Body</div>
                  <pre className="bg-[#1f1f28] rounded p-3 text-xs font-mono text-gray-300 overflow-x-auto max-h-64 overflow-y-auto">
                    {selectedLog.response.body}
                  </pre>
                </div>
              </div>
            </div>

            {/* [4] Assertion Result */}
            {selectedLog.assertions && selectedLog.assertions.length > 0 && (
              <div className="bg-[#13131a] border border-[#1f1f28] rounded-xl p-4">
                <h3 className="text-white text-sm mb-3 flex items-center gap-2">
                  <Zap size={16} className="text-purple-400" />
                  Assertion Results
                </h3>
                <div className="space-y-2">
                  {selectedLog.assertions.map((assertion) => (
                    <div
                      key={assertion.id}
                      className={`rounded-lg p-3 ${
                        assertion.passed
                          ? 'bg-green-500/5 border border-green-500/20'
                          : 'bg-red-500/5 border border-red-500/20'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {assertion.passed ? (
                          <CheckCircle2 size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="text-xs text-white mb-1">
                            <span className="font-medium">{assertion.type}</span>
                            {' '}
                            <code className="text-xs bg-[#1f1f28] px-1.5 py-0.5 rounded font-mono">
                              {assertion.fieldPath}
                            </code>
                          </div>
                          {!assertion.passed && (
                            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                              <div>
                                <div className="text-gray-500 mb-1">Expected</div>
                                <code className="text-green-400 bg-[#1f1f28] px-2 py-1 rounded block font-mono">
                                  {assertion.expected}
                                </code>
                              </div>
                              <div>
                                <div className="text-gray-500 mb-1">Actual</div>
                                <code className="text-red-400 bg-[#1f1f28] px-2 py-1 rounded block font-mono">
                                  {assertion.actual}
                                </code>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      ) : (
        <aside className="w-[520px] bg-[#0a0a0f] border-l border-[#1f1f28] flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-20 h-20 bg-[#13131a] rounded-full flex items-center justify-center mx-auto mb-4">
              <FileJson size={32} className="text-gray-500" />
            </div>
            <h3 className="text-white text-lg mb-2">Select a log to view details</h3>
            <p className="text-gray-500 text-sm">Click on any row in the table to see full request and response</p>
          </div>
        </aside>
      )}
    </div>
  );
}