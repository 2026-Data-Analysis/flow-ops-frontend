import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Activity,
  Calendar,
  Filter,
  Download,
  ExternalLink,
  Clock,
  AlertTriangle
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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

const mockExecutions: ExecutionRecord[] = [
  {
    id: 'exec_001',
    date: '2026-04-01',
    time: '14:23:15',
    environment: 'Staging',
    testLevel: 'Smoke',
    total: 45,
    passed: 43,
    failed: 2,
    duration: 12450,
    status: 'completed',
  },
  {
    id: 'exec_002',
    date: '2026-04-01',
    time: '11:15:32',
    environment: 'Production',
    testLevel: 'Regression',
    total: 156,
    passed: 148,
    failed: 8,
    duration: 45780,
    status: 'completed',
  },
  {
    id: 'exec_003',
    date: '2026-03-31',
    time: '18:42:10',
    environment: 'Staging',
    testLevel: 'Full Suite',
    total: 234,
    passed: 220,
    failed: 14,
    duration: 68920,
    status: 'completed',
  },
  {
    id: 'exec_004',
    date: '2026-03-31',
    time: '15:20:45',
    environment: 'Development',
    testLevel: 'Smoke',
    total: 42,
    passed: 38,
    failed: 4,
    duration: 8340,
    status: 'partial',
  },
  {
    id: 'exec_005',
    date: '2026-03-30',
    time: '09:05:22',
    environment: 'Production',
    testLevel: 'Sanity',
    total: 89,
    passed: 89,
    failed: 0,
    duration: 21560,
    status: 'completed',
  },
];

const trendData = [
  { date: 'Mar 25', passed: 142, failed: 8, total: 150 },
  { date: 'Mar 26', passed: 156, failed: 6, total: 162 },
  { date: 'Mar 27', passed: 178, failed: 12, total: 190 },
  { date: 'Mar 28', passed: 165, failed: 5, total: 170 },
  { date: 'Mar 29', passed: 188, failed: 7, total: 195 },
  { date: 'Mar 30', passed: 201, failed: 4, total: 205 },
  { date: 'Mar 31', passed: 198, failed: 11, total: 209 },
  { date: 'Apr 01', passed: 215, failed: 10, total: 225 },
];

const failureDistribution = [
  { name: 'Authentication', value: 12, color: '#ef4444' },
  { name: 'Validation', value: 8, color: '#f97316' },
  { name: 'Timeout', value: 5, color: '#f59e0b' },
  { name: 'Server Error', value: 3, color: '#eab308' },
  { name: 'Other', value: 2, color: '#84cc16' },
];

export function ReportsDashboardPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('7d');
  const [selectedEnv, setSelectedEnv] = useState('all');

  // Calculate metrics
  const totalTests = mockExecutions.reduce((sum, exec) => sum + exec.total, 0);
  const totalPassed = mockExecutions.reduce((sum, exec) => sum + exec.passed, 0);
  const totalFailed = mockExecutions.reduce((sum, exec) => sum + exec.failed, 0);
  const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0';
  const avgDuration = mockExecutions.length > 0 
    ? Math.round(mockExecutions.reduce((sum, exec) => sum + exec.duration, 0) / mockExecutions.length / 1000)
    : 0;

  // Previous period for comparison (mock)
  const prevSuccessRate = 92.3;
  const successRateDiff = parseFloat(successRate) - prevSuccessRate;

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
            <div className="mt-3 text-xs text-gray-600">{mockExecutions.length} executions</div>
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

          {/* Failure Distribution - Pie Chart */}
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
            <div className="mb-6">
              <h3 className="text-white mb-1">Failure Distribution</h3>
              <p className="text-gray-500 text-sm">By error category</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={failureDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {failureDistribution.map((entry, index) => (
                    <Cell key={`failure-cell-${entry.name}-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#13131a',
                    border: '1px solid #1f1f28',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {failureDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-gray-400">{item.name}</span>
                  </div>
                  <span className="text-white font-medium">{item.value}</span>
                </div>
              ))}
            </div>
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
                {mockExecutions.map((execution) => {
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
              Showing <span className="text-white font-medium">1-5</span> of{' '}
              <span className="text-white font-medium">127</span> executions
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