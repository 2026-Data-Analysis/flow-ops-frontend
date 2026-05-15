import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Activity,
  Calendar,
  Download,
  ExternalLink,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { flowOpsApi, getDefaultAppId, type ExecutionDetailResponse } from '../api/flowOpsClient';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ExecutionRecord {
  id: string;
  date: string;
  time: string;
  environment: string;
  testLevel: string;
  total: number;
  passed: number;
  failed: number;
  duration: number;
  status: 'completed' | 'failed' | 'partial';
}

const normalizeExecution = (exec: ExecutionDetailResponse): ExecutionRecord => {
  const ts = exec.executedAt ? new Date(exec.executedAt) : null;
  const total = exec.totalCount ?? 1;
  const passed = exec.passedCount ?? (exec.status === 'SUCCESS' ? total : 0);
  const failed = exec.failedCount ?? (total - passed);
  return {
    id: String(exec.id),
    date: ts ? ts.toLocaleDateString() : '',
    time: ts ? ts.toLocaleTimeString() : '',
    environment: exec.environmentName || String(exec.environmentId || ''),
    testLevel: exec.testLevel || '',
    total,
    passed,
    failed,
    duration: exec.durationMs || exec.responseTimeMs || exec.avgDurationMs || 0,
    status: exec.status === 'SUCCESS' ? 'completed' : exec.status === 'PARTIAL_FAILED' ? 'partial' : 'failed',
  };
};

const buildTrendData = (executions: ExecutionRecord[]) => {
  const byDate: Record<string, { passed: number; failed: number; total: number }> = {};
  for (const exec of executions) {
    if (!exec.date) continue;
    if (!byDate[exec.date]) byDate[exec.date] = { passed: 0, failed: 0, total: 0 };
    byDate[exec.date].passed += exec.passed;
    byDate[exec.date].failed += exec.failed;
    byDate[exec.date].total += exec.total;
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([date, values]) => ({ date, ...values }));
};

export function ReportsDashboardPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('7d');
  const [selectedEnv, setSelectedEnv] = useState('all');
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    flowOpsApi
      .listExecutions(getDefaultAppId())
      .then((page) => {
        if (!active) return;
        setExecutions(page.content.map(normalizeExecution));
      })
      .catch(() => {
        if (!active) return;
        setExecutions([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const trendData = buildTrendData(executions);

  // Calculate metrics
  const totalTests = executions.reduce((sum, exec) => sum + exec.total, 0);
  const totalPassed = executions.reduce((sum, exec) => sum + exec.passed, 0);
  const totalFailed = executions.reduce((sum, exec) => sum + exec.failed, 0);
  const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0';
  const avgDuration = executions.length > 0
    ? Math.round(executions.reduce((sum, exec) => sum + exec.duration, 0) / executions.length / 1000)
    : 0;

  const successRateDiff = 0; // no previous-period comparison without historical API

  const handleRowClick = (executionId: string) => {
    // Navigate to execution detail or logs
    navigate(`/execution/history?id=${executionId}`);
  };

  const handleExport = () => {
    alert('Exporting report...');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#060609] p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-white text-2xl mb-1">Test Reports Dashboard</h1>
            <p className="text-gray-500 text-sm">Analytics and insights from test execution history</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 transition-colors"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>

            {/* Environment Filter */}
            <select
              value={selectedEnv}
              onChange={(e) => setSelectedEnv(e.target.value)}
              className="bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 transition-colors"
            >
              <option value="all">All Environments</option>
              <option value="dev">Development</option>
              <option value="staging">Staging</option>
              <option value="prod">Production</option>
            </select>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-[#13131a] border border-[#1f1f28] hover:border-blue-500/30 hover:bg-blue-500/5 text-white px-4 py-2 rounded-lg transition-all"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Success Rate */}
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 size={20} className="text-green-400" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                successRateDiff >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {successRateDiff >= 0 ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                {Math.abs(successRateDiff).toFixed(1)}%
              </div>
            </div>
            <div className="text-3xl text-white font-semibold mb-1">{successRate}%</div>
            <div className="text-sm text-gray-500">Success Rate</div>
            <div className="mt-3 text-xs text-gray-600">vs. previous period</div>
          </div>

          {/* Total Tests */}
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Activity size={20} className="text-blue-400" />
              </div>
            </div>
            <div className="text-3xl text-white font-semibold mb-1">{totalTests.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Tests</div>
            <div className="mt-3 text-xs text-gray-600">{executions.length} executions</div>
          </div>

          {/* Failures */}
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <XCircle size={20} className="text-red-400" />
              </div>
            </div>
            <div className="text-3xl text-white font-semibold mb-1">{totalFailed}</div>
            <div className="text-sm text-gray-500">Failed Tests</div>
            <div className="mt-3 text-xs text-gray-600">
              {totalTests > 0 ? ((totalFailed / totalTests) * 100).toFixed(1) : '0'}% failure rate
            </div>
          </div>

          {/* Avg Duration */}
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Clock size={20} className="text-purple-400" />
              </div>
            </div>
            <div className="text-3xl text-white font-semibold mb-1">{avgDuration}s</div>
            <div className="text-sm text-gray-500">Avg Duration</div>
            <div className="mt-3 text-xs text-gray-600">per execution</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Trend - Line Chart */}
          <div className="lg:col-span-2 bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white mb-1">Test Execution Trend</h3>
                <p className="text-gray-500 text-sm">Daily test results over time</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-xs text-gray-400">Passed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <span className="text-xs text-gray-400">Failed</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f28" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280" 
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280" 
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#13131a',
                    border: '1px solid #1f1f28',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  key="line-passed"
                  type="monotone"
                  dataKey="passed"
                  stroke="#4ade80"
                  strokeWidth={2}
                  dot={{ fill: '#4ade80', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  key="line-failed"
                  type="monotone"
                  dataKey="failed"
                  stroke="#f87171"
                  strokeWidth={2}
                  dot={{ fill: '#f87171', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Failure Summary */}
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
            <div className="mb-6">
              <h3 className="text-white mb-1">Failure Summary</h3>
              <p className="text-gray-500 text-sm">Overall failure rate</p>
            </div>
            {totalTests > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Total Tests</span>
                  <span className="text-white font-semibold">{totalTests}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Passed</span>
                  <span className="text-green-400 font-semibold">{totalPassed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Failed</span>
                  <span className="text-red-400 font-semibold">{totalFailed}</span>
                </div>
                <div className="pt-2 border-t border-[#1f1f28]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 text-xs">Success Rate</span>
                    <span className="text-white text-xs">{successRate}%</span>
                  </div>
                  <div className="w-full bg-[#1f1f28] rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${successRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
                No data yet
              </div>
            )}
          </div>
        </div>

        {/* Recent Executions Table */}
        <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1f1f28]">
            <h3 className="text-white flex items-center gap-2">
              <Calendar size={18} className="text-blue-400" />
              Recent Executions
            </h3>
            <p className="text-gray-500 text-sm mt-1">Click a row to view detailed logs</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f1f28]">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Execution ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Environment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Test Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Results
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f28]">
                {executions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Activity size={32} className="text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">{isLoading ? 'Loading...' : 'No executions yet'}</p>
                    </td>
                  </tr>
                ) : null}
                {executions.map((execution) => {
                  const successRate = ((execution.passed / execution.total) * 100).toFixed(0);
                  return (
                    <tr
                      key={execution.id}
                      onClick={() => handleRowClick(execution.id)}
                      className="hover:bg-[#13131a] cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-blue-400 font-mono">{execution.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{execution.date}</div>
                        <div className="text-xs text-gray-500">{execution.time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          execution.environment === 'Production'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : execution.environment === 'Staging'
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {execution.environment}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-300">{execution.testLevel}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-green-400" />
                            <span className="text-sm text-white">{execution.passed}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <XCircle size={14} className="text-red-400" />
                            <span className="text-sm text-white">{execution.failed}</span>
                          </div>
                          <div className="ml-2 text-xs text-gray-500">
                            ({successRate}%)
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-300 font-mono">
                          {(execution.duration / 1000).toFixed(1)}s
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {execution.status === 'completed' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                            <CheckCircle2 size={12} />
                            Completed
                          </span>
                        )}
                        {execution.status === 'failed' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            <XCircle size={12} />
                            Failed
                          </span>
                        )}
                        {execution.status === 'partial' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            <AlertTriangle size={12} />
                            Partial
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(execution.id);
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-[#1f1f28] flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing <span className="text-white font-medium">{Math.min(executions.length, 5)}</span> of{' '}
              <span className="text-white font-medium">{executions.length}</span> executions
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm text-white hover:border-[#2f2f38] transition-colors disabled:opacity-50" disabled>
                Previous
              </button>
              <div className="flex items-center gap-1">
                <button className="px-3 py-1.5 bg-blue-600 border border-blue-500 rounded-lg text-sm text-white">
                  1
                </button>
                <button className="px-3 py-1.5 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm text-white hover:border-[#2f2f38] transition-colors">
                  2
                </button>
                <button className="px-3 py-1.5 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm text-white hover:border-[#2f2f38] transition-colors">
                  3
                </button>
              </div>
              <button className="px-3 py-1.5 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm text-white hover:border-[#2f2f38] transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}