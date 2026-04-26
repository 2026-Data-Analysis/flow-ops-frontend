import { useState } from 'react';
import { 
  AlertTriangle,
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  service: string;
}

const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: '2026-04-03 14:32:15',
    level: 'error',
    message: 'Database connection timeout after 30s',
    service: 'auth-service',
  },
  {
    id: '2',
    timestamp: '2026-04-03 14:32:12',
    level: 'warn',
    message: 'Slow query detected: SELECT * FROM users WHERE...',
    service: 'db-service',
  },
  {
    id: '3',
    timestamp: '2026-04-03 14:32:10',
    level: 'error',
    message: 'Failed to acquire connection from pool',
    service: 'db-service',
  },
  {
    id: '4',
    timestamp: '2026-04-03 14:32:05',
    level: 'info',
    message: 'Attempting database connection retry (3/5)',
    service: 'auth-service',
  },
];

const logLevelColors = {
  error: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  warn: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

export function ErrorAnalysisPage() {
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(mockLogs[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasAnalysis(true);
    }, 2000);
  };

  return (
    <div className="flex-1 overflow-hidden bg-gray-50 flex">
      {/* Left Panel - Log List */}
      <aside className="w-[380px] bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Logs</h2>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select 
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-blue-300"
            >
              <option value="all">All Severity</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
            </select>
            
            <button className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
              <Filter size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {mockLogs.map((log) => (
            <div
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedLog?.id === log.id
                  ? 'bg-blue-50 border-blue-200 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${logLevelColors[log.level].bg} ${logLevelColors[log.level].text} border ${logLevelColors[log.level].border}`}>
                  {log.level}
                </span>
                <span className="text-xs text-gray-500">{log.timestamp}</span>
              </div>
              <p className="text-sm text-gray-900 font-medium mb-1 line-clamp-2">{log.message}</p>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="px-2 py-0.5 bg-gray-100 rounded-md font-mono">{log.service}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Right Panel - Detail & Analysis */}
      <main className="flex-1 overflow-y-auto">
        {selectedLog ? (
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Error Analysis</h1>
                <p className="text-gray-600">AI-powered root cause analysis and recommendations</p>
              </div>
              
              <button 
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Run AI Analysis
                  </>
                )}
              </button>
            </div>

            {/* Log Detail */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Log Details</h3>
              <div className="bg-gray-900 rounded-xl p-6 font-mono text-sm overflow-x-auto">
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500">timestamp:</span>
                    <span className="text-blue-400 ml-2">{selectedLog.timestamp}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">level:</span>
                    <span className={`ml-2 ${
                      selectedLog.level === 'error' ? 'text-red-400' :
                      selectedLog.level === 'warn' ? 'text-yellow-400' :
                      'text-blue-400'
                    }`}>{selectedLog.level}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">service:</span>
                    <span className="text-green-400 ml-2">{selectedLog.service}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">message:</span>
                    <span className="text-white ml-2">{selectedLog.message}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-800">
                    <span className="text-gray-500">stack_trace:</span>
                    <div className="text-gray-400 ml-2 mt-1">
                      <div>  at DatabasePool.acquire (pool.js:124:15)</div>
                      <div>  at AuthService.validateUser (auth.js:87:23)</div>
                      <div>  at async LoginController.handle (login.js:42:18)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Analysis Results */}
            {hasAnalysis && (
              <div className="space-y-6 animate-slide-in">
                {/* Summary */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={20} className="text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">AI Analysis Summary</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    Database connection pool exhaustion detected in the authentication service. The connection timeout 
                    indicates that all available connections are in use or stuck, preventing new authentication requests 
                    from being processed.
                  </p>
                </div>

                {/* Root Cause */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={20} className="text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Root Cause</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                      <h4 className="font-semibold text-orange-900 mb-2">Primary Cause</h4>
                      <p className="text-sm text-orange-800">
                        Connection pool size (max: 10) is insufficient for current load. Slow queries are holding 
                        connections for extended periods.
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <h4 className="font-semibold text-blue-900 mb-2">Contributing Factors</h4>
                      <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>Unoptimized SELECT * query on users table</li>
                        <li>Missing index on frequently queried columns</li>
                        <li>No connection timeout configured</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Evidence Logs */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Evidence Logs</h3>
                  <div className="space-y-2">
                    {mockLogs.slice(0, 3).map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500 font-mono">{log.timestamp}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${logLevelColors[log.level].bg} ${logLevelColors[log.level].text}`}>
                              {log.level}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 font-mono">{log.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impact & Priority */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact Scope</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Affected APIs</span>
                        <span className="text-sm font-semibold text-gray-900">3 endpoints</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Failed Requests</span>
                        <span className="text-sm font-semibold text-gray-900">1,284</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Affected Users</span>
                        <span className="text-sm font-semibold text-gray-900">~245</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Duration</span>
                        <span className="text-sm font-semibold text-gray-900">23 minutes</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Assessment</h3>
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 border-4 border-red-200 mb-3">
                          <span className="text-3xl font-bold text-red-700">P0</span>
                        </div>
                        <p className="text-sm font-medium text-gray-700">Critical Priority</p>
                        <p className="text-xs text-gray-500 mt-1">Immediate action required</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommended Actions */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900 mb-1">Immediate Fix</h4>
                        <p className="text-sm text-green-800 mb-2">
                          Restart the auth-service to clear stuck connections and restore service
                        </p>
                        <code className="text-xs bg-green-900 text-green-100 px-3 py-1.5 rounded-lg block font-mono">
                          kubectl rollout restart deployment/auth-service
                        </code>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <Clock size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Short-term Fix</h4>
                        <p className="text-sm text-blue-800">
                          Increase database connection pool size from 10 to 25 connections
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <AlertCircle size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-purple-900 mb-1">Long-term Solution</h4>
                        <ul className="text-sm text-purple-800 space-y-1">
                          <li>• Optimize slow queries and add missing indexes</li>
                          <li>• Implement connection timeout (30s)</li>
                          <li>• Add connection pool monitoring and alerts</li>
                          <li>• Consider implementing read replicas for heavy queries</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!hasAnalysis && !isAnalyzing && (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 text-center">
                <Sparkles size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Yet</h3>
                <p className="text-gray-600 mb-6">Click "Run AI Analysis" to generate insights and recommendations</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Search size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Log Entry</h3>
              <p className="text-gray-600">Choose a log from the left panel to view details and analysis</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
