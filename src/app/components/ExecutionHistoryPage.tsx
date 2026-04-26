import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { 
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Code,
  FileJson,
  Activity,
  Zap,
  Calendar,
  X,
  Layers
} from 'lucide-react';

interface ExecutionRecord {
  id: string;
  name: string;
  type: 'api' | 'scenario';
  environment: 'dev' | 'staging' | 'prod';
  status: 'success' | 'failed' | 'partial';
  timestamp: string;
  duration: number; // in milliseconds
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  steps: ExecutionStep[];
}

interface ExecutionStep {
  id: string;
  order: number;
  name: string;
  apiMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  apiPath: string;
  status: 'success' | 'failed';
  duration: number;
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
  assertions: AssertionResult[];
  errorMessage?: string;
}

interface AssertionResult {
  id: string;
  type: string;
  fieldPath: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const mockExecutions: ExecutionRecord[] = [
  {
    id: 'exec_001',
    name: 'User Authentication Flow',
    type: 'scenario',
    environment: 'staging',
    status: 'success',
    timestamp: '2026-04-01 14:32:15',
    duration: 2345,
    totalSteps: 3,
    passedSteps: 3,
    failedSteps: 0,
    steps: [
      {
        id: 's1',
        order: 1,
        name: 'Login - Get Auth Token',
        apiMethod: 'POST',
        apiPath: '/api/v1/auth/login',
        status: 'success',
        duration: 245,
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
        id: 's2',
        order: 2,
        name: 'Create New Post',
        apiMethod: 'POST',
        apiPath: '/api/v1/posts',
        status: 'success',
        duration: 134,
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
        assertions: [
          { id: 'a3', type: 'equals', fieldPath: 'response.status', expected: '201', actual: '201', passed: true },
        ],
      },
      {
        id: 's3',
        order: 3,
        name: 'Get Post Details',
        apiMethod: 'GET',
        apiPath: '/api/v1/posts/post_456',
        status: 'success',
        duration: 89,
        request: {
          method: 'GET',
          url: 'https://staging.api.example.com/api/v1/posts/post_456',
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
        response: {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: '{\n  "success": true,\n  "data": {\n    "id": "post_456",\n    "title": "Test Post",\n    "content": "Test content"\n  }\n}',
          duration: 89,
        },
        assertions: [],
      },
    ],
  },
  {
    id: 'exec_002',
    name: 'Login API Test',
    type: 'api',
    environment: 'prod',
    status: 'failed',
    timestamp: '2026-04-01 11:15:32',
    duration: 567,
    totalSteps: 2,
    passedSteps: 1,
    failedSteps: 1,
    steps: [
      {
        id: 's4',
        order: 1,
        name: 'Login - Success Case',
        apiMethod: 'POST',
        apiPath: '/api/v1/auth/login',
        status: 'success',
        duration: 198,
        request: {
          method: 'POST',
          url: 'https://api.example.com/api/v1/auth/login',
          headers: {
            'Content-Type': 'application/json',
          },
          body: '{\n  "email": "test@example.com",\n  "password": "password123"\n}',
        },
        response: {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: '{\n  "success": true,\n  "data": {\n    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."\n  }\n}',
          duration: 198,
        },
        assertions: [
          { id: 'a4', type: 'equals', fieldPath: 'response.status', expected: '200', actual: '200', passed: true },
        ],
      },
      {
        id: 's5',
        order: 2,
        name: 'Login - Missing Field',
        apiMethod: 'POST',
        apiPath: '/api/v1/auth/login',
        status: 'failed',
        duration: 369,
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
          { id: 'a5', type: 'equals', fieldPath: 'response.status', expected: '400', actual: '500', passed: false },
          { id: 'a6', type: 'equals', fieldPath: 'error.code', expected: 'MISSING_FIELD', actual: 'INTERNAL_ERROR', passed: false },
        ],
        errorMessage: 'Expected status 400 but received 500. Server error instead of validation error.',
      },
    ],
  },
  {
    id: 'exec_003',
    name: 'E2E Order Flow',
    type: 'scenario',
    environment: 'staging',
    status: 'partial',
    timestamp: '2026-03-31 18:42:10',
    duration: 4521,
    totalSteps: 5,
    passedSteps: 4,
    failedSteps: 1,
    steps: [],
  },
];

const methodColors = {
  GET: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  POST: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  PUT: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  DELETE: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  PATCH: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

export function ExecutionHistoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [executions, setExecutions] = useState<ExecutionRecord[]>(mockExecutions);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(
    searchParams.get('id') || 'exec_001'
  );
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const selectedExecution = selectedExecutionId
    ? executions.find(e => e.id === selectedExecutionId)
    : null;

  const filteredExecutions = executions.filter(exec => {
    const matchesSearch = 
      exec.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEnv = environmentFilter === 'all' || exec.environment === environmentFilter;
    const matchesStatus = statusFilter === 'all' || exec.status === statusFilter;
    const matchesType = typeFilter === 'all' || exec.type === typeFilter;
    return matchesSearch && matchesEnv && matchesStatus && matchesType;
  });

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const handleRerun = () => {
    alert('Re-running execution...');
  };

  const handleRerunFailed = () => {
    alert('Re-running failed steps only...');
  };

  const handleOpenInBuilder = () => {
    if (selectedExecution?.type === 'scenario') {
      navigate('/qc/scenario');
    } else {
      navigate('/qc/testcase');
    }
  };

  const handleClosePanel = () => {
    setSelectedExecutionId(null);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="flex-1 overflow-hidden bg-[#060609] flex">
      {/* Left Panel: Execution List */}
      <aside className={`bg-[#0a0a0f] border-r border-[#1f1f28] flex flex-col transition-all duration-300 ${
        selectedExecutionId ? 'w-[480px]' : 'flex-1'
      }`}>
        <div className="p-6 border-b border-[#1f1f28] space-y-4">
          <div>
            <h2 className="text-white text-lg mb-1">Execution History</h2>
            <p className="text-gray-500 text-sm">{executions.length} past executions</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search executions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/30"
            />
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showFilters ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-[#13131a] border border-[#1f1f28] text-gray-400 hover:text-white'
              }`}
            >
              <Filter size={14} />
              Filters
            </button>
            
            {showFilters && (
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={environmentFilter}
                  onChange={(e) => setEnvironmentFilter(e.target.value)}
                  className="bg-[#13131a] border border-[#1f1f28] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/30"
                >
                  <option value="all">All Env</option>
                  <option value="dev">Dev</option>
                  <option value="staging">Staging</option>
                  <option value="prod">Prod</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#13131a] border border-[#1f1f28] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/30"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="partial">Partial</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-[#13131a] border border-[#1f1f28] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/30"
                >
                  <option value="all">All Types</option>
                  <option value="api">API</option>
                  <option value="scenario">Scenario</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Execution List */}
        <div className="flex-1 overflow-y-auto">
          {filteredExecutions.length === 0 ? (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-[#13131a] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity size={32} className="text-gray-500" />
                </div>
                <h3 className="text-white text-lg mb-2">No executions yet</h3>
                <p className="text-gray-500 text-sm mb-4">Run your first test to see results here</p>
                <button
                  onClick={() => navigate('/execution/run')}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Play size={16} />
                  Run Test
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#1f1f28]">
              {filteredExecutions.map((execution) => (
                <div
                  key={execution.id}
                  onClick={() => setSelectedExecutionId(execution.id)}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedExecutionId === execution.id
                      ? 'bg-[#13131a] border-l-2 border-l-blue-500'
                      : 'hover:bg-[#13131a] border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {execution.status === 'success' && (
                        <CheckCircle2 size={20} className="text-green-400" />
                      )}
                      {execution.status === 'failed' && (
                        <XCircle size={20} className="text-red-400" />
                      )}
                      {execution.status === 'partial' && (
                        <AlertTriangle size={20} className="text-orange-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name & Type */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-white text-sm truncate">{execution.name}</div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                          execution.type === 'scenario'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {execution.type}
                        </span>
                      </div>

                      {/* Environment & Timestamp */}
                      <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full ${
                          execution.environment === 'prod'
                            ? 'bg-green-500/10 text-green-400'
                            : execution.environment === 'staging'
                            ? 'bg-orange-500/10 text-orange-400'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {execution.environment}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {execution.timestamp}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-green-400">
                          <CheckCircle2 size={12} />
                          <span>{execution.passedSteps}</span>
                        </div>
                        {execution.failedSteps > 0 && (
                          <div className="flex items-center gap-1 text-red-400">
                            <XCircle size={12} />
                            <span>{execution.failedSteps}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock size={12} />
                          <span>{formatDuration(execution.duration)}</span>
                        </div>
                      </div>
                    </div>

                    {selectedExecutionId === execution.id && (
                      <ChevronRight size={18} className="text-blue-400 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Right Panel: Execution Detail */}
      {selectedExecution ? (
        <main className="flex-1 overflow-y-auto bg-[#060609] animate-slide-in">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-white text-xl mb-1">{selectedExecution.name}</h2>
                <p className="text-gray-500 text-sm">Execution Details</p>
              </div>
              <button
                onClick={handleClosePanel}
                className="flex items-center justify-center w-8 h-8 bg-[#13131a] border border-[#1f1f28] hover:border-red-500/30 hover:bg-red-500/5 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                title="Close panel"
              >
                <X size={16} />
              </button>
            </div>

            {/* [1] Summary Section */}
            <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
              <h3 className="text-white mb-4 flex items-center gap-2">
                <Activity size={18} className="text-blue-400" />
                Execution Summary
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Environment</div>
                  <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                    selectedExecution.environment === 'prod'
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : selectedExecution.environment === 'staging'
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {selectedExecution.environment}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Type</div>
                  <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                    selectedExecution.type === 'scenario'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {selectedExecution.type}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#13131a] rounded-lg p-4">
                  <div className="text-gray-400 text-xs mb-2">Total Steps</div>
                  <div className="text-white text-2xl font-semibold">{selectedExecution.totalSteps}</div>
                </div>
                <div className="bg-[#13131a] rounded-lg p-4">
                  <div className="text-gray-400 text-xs mb-2">Passed</div>
                  <div className="text-green-400 text-2xl font-semibold">{selectedExecution.passedSteps}</div>
                </div>
                <div className="bg-[#13131a] rounded-lg p-4">
                  <div className="text-gray-400 text-xs mb-2">Failed</div>
                  <div className="text-red-400 text-2xl font-semibold">{selectedExecution.failedSteps}</div>
                </div>
                <div className="bg-[#13131a] rounded-lg p-4">
                  <div className="text-gray-400 text-xs mb-2">Duration</div>
                  <div className="text-white text-2xl font-semibold">{formatDuration(selectedExecution.duration)}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRerun}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <RotateCcw size={16} />
                Re-run Execution
              </button>
              {selectedExecution.failedSteps > 0 && (
                <button
                  onClick={handleRerunFailed}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Play size={16} />
                  Run Failed Steps Only
                </button>
              )}
              <button
                onClick={handleOpenInBuilder}
                className="flex items-center gap-2 bg-[#13131a] border border-[#1f1f28] hover:border-blue-500/30 hover:bg-blue-500/5 text-white px-4 py-2 rounded-lg transition-all"
              >
                <ExternalLink size={16} />
                Open in Builder
              </button>
            </div>

            {/* [2] Step Timeline */}
            {selectedExecution.steps.length > 0 ? (
              <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
                <h3 className="text-white mb-4 flex items-center gap-2">
                  <Zap size={18} className="text-blue-400" />
                  Step Timeline
                </h3>

                <div className="space-y-0">
                  {selectedExecution.steps.map((step, index) => (
                    <div key={step.id}>
                      {/* Step Card */}
                      <div
                        onClick={() => toggleStep(step.id)}
                        className={`relative rounded-xl p-4 cursor-pointer transition-all ${
                          step.status === 'failed'
                            ? 'bg-red-500/5 border-2 border-red-500/20 hover:border-red-500/30'
                            : 'bg-[#13131a] border-2 border-[#1f1f28] hover:border-[#2f2f38]'
                        }`}
                      >
                        {/* Step Number Badge */}
                        <div className={`absolute -left-3 top-4 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold z-10 border-2 border-[#060609] ${
                          step.status === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {step.order}
                        </div>

                        <div className="flex items-start gap-4 ml-3">
                          <div className="flex-1">
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`${methodColors[step.apiMethod].bg} ${methodColors[step.apiMethod].text} ${methodColors[step.apiMethod].border} border px-2.5 py-1 rounded text-xs font-semibold font-mono`}>
                                {step.apiMethod}
                              </span>
                              {step.status === 'success' ? (
                                <CheckCircle2 size={16} className="text-green-400" />
                              ) : (
                                <XCircle size={16} className="text-red-400" />
                              )}
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock size={12} />
                                {formatDuration(step.duration)}
                              </span>
                            </div>

                            {/* Name & API */}
                            <div className="text-white mb-1">{step.name}</div>
                            <div className="text-sm text-gray-500 font-mono">{step.apiPath}</div>

                            {/* Error Message */}
                            {step.status === 'failed' && step.errorMessage && (
                              <div className="mt-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                                  <div className="text-xs text-red-400">{step.errorMessage}</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Expand Icon */}
                          {expandedSteps.has(step.id) ? (
                            <ChevronUp size={20} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={20} className="text-gray-400" />
                          )}
                        </div>

                        {/* [3] Step Detail (Expandable) */}
                        {expandedSteps.has(step.id) && (
                          <div className="mt-4 ml-3 space-y-4 border-t border-[#1f1f28] pt-4">
                            {/* Request */}
                            <div>
                              <h4 className="text-white text-sm mb-3 flex items-center gap-2">
                                <Code size={16} className="text-blue-400" />
                                Request
                              </h4>
                              <div className="bg-[#1f1f28] rounded-lg p-4 space-y-3">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">URL</div>
                                  <div className="text-sm text-white font-mono break-all">{step.request.url}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-2">Headers</div>
                                  <div className="bg-[#13131a] rounded p-3 space-y-1">
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
                                    <div className="text-xs text-gray-500 mb-2">Body</div>
                                    <pre className="bg-[#13131a] rounded p-3 text-xs font-mono text-gray-300 overflow-x-auto">
                                      {step.request.body}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Response */}
                            <div>
                              <h4 className="text-white text-sm mb-3 flex items-center gap-2">
                                <FileJson size={16} className="text-green-400" />
                                Response
                              </h4>
                              <div className="bg-[#1f1f28] rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Status Code</div>
                                    <div className={`text-sm font-mono font-semibold ${
                                      step.response.statusCode >= 200 && step.response.statusCode < 300
                                        ? 'text-green-400'
                                        : 'text-red-400'
                                    }`}>
                                      {step.response.statusCode}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Response Time</div>
                                    <div className="text-sm text-white font-mono">{formatDuration(step.response.duration)}</div>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-2">Headers</div>
                                  <div className="bg-[#13131a] rounded p-3 space-y-1">
                                    {Object.entries(step.response.headers).map(([key, value]) => (
                                      <div key={key} className="text-xs font-mono">
                                        <span className="text-green-400">{key}:</span>{' '}
                                        <span className="text-gray-300">{value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-2">Body</div>
                                  <pre className="bg-[#13131a] rounded p-3 text-xs font-mono text-gray-300 overflow-x-auto max-h-64 overflow-y-auto">
                                    {step.response.body}
                                  </pre>
                                </div>
                              </div>
                            </div>

                            {/* Assertion Results */}
                            {step.assertions.length > 0 && (
                              <div>
                                <h4 className="text-white text-sm mb-3 flex items-center gap-2">
                                  <Zap size={16} className="text-purple-400" />
                                  Assertion Results
                                </h4>
                                <div className="space-y-2">
                                  {step.assertions.map((assertion) => (
                                    <div
                                      key={assertion.id}
                                      className={`rounded-lg p-4 ${
                                        assertion.passed
                                          ? 'bg-green-500/5 border border-green-500/20'
                                          : 'bg-red-500/5 border border-red-500/20'
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        {assertion.passed ? (
                                          <CheckCircle2 size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                                        ) : (
                                          <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                          <div className="text-sm text-white mb-2">
                                            <span className="font-medium">{assertion.type}</span>
                                            {' '}
                                            <code className="text-xs bg-[#13131a] px-2 py-0.5 rounded font-mono">
                                              {assertion.fieldPath}
                                            </code>
                                          </div>
                                          {!assertion.passed && (
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                              <div>
                                                <div className="text-gray-500 mb-1">Expected</div>
                                                <code className="text-green-400 bg-[#13131a] px-2 py-1 rounded block font-mono">
                                                  {assertion.expected}
                                                </code>
                                              </div>
                                              <div>
                                                <div className="text-gray-500 mb-1">Actual</div>
                                                <code className="text-red-400 bg-[#13131a] px-2 py-1 rounded block font-mono">
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
                        )}
                      </div>

                      {/* Connection Line */}
                      {index < selectedExecution.steps.length - 1 && (
                        <div className="flex items-center justify-center py-2">
                          <div className={`w-0.5 h-6 ${
                            step.status === 'failed' ? 'bg-red-500/50' : 'bg-blue-500/50'
                          }`}></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-12 text-center">
                <Layers size={48} className="text-gray-600 mx-auto mb-4" />
                <h3 className="text-white mb-2">No step details available</h3>
                <p className="text-gray-500 text-sm">This execution doesn't have detailed step information</p>
              </div>
            )}
          </div>
        </main>
      ) : (
        <main className="flex-1 overflow-y-auto bg-[#060609] flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-[#13131a] rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity size={32} className="text-gray-500" />
            </div>
            <h3 className="text-white text-lg mb-2">Select an execution to view details</h3>
            <p className="text-gray-500 text-sm">Choose an execution from the list to see timeline and results</p>
          </div>
        </main>
      )}
    </div>
  );
}
