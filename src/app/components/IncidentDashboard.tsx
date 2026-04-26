import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  Clock,
  Activity,
  Filter,
  Calendar,
  ChevronDown,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router';
import { useTestContext } from '../contexts/TestContext';

// Mock data
const errorTrendData = [
  { id: 't1', time: '00:00', errors: 12 },
  { id: 't2', time: '04:00', errors: 8 },
  { id: 't3', time: '08:00', errors: 24 },
  { id: 't4', time: '12:00', errors: 45 },
  { id: 't5', time: '16:00', errors: 32 },
  { id: 't6', time: '20:00', errors: 18 },
];

const errorTypeData = [
  { id: 'et1', name: 'Timeout', value: 35, color: '#ef4444' },
  { id: 'et2', name: '500 Error', value: 28, color: '#f97316' },
  { id: 'et3', name: '404 Not Found', value: 20, color: '#eab308' },
  { id: 'et4', name: 'Network', value: 17, color: '#3b82f6' },
];

const errorByEnvData = [
  { id: 'env1', env: 'Production', errors: 45 },
  { id: 'env2', env: 'Staging', errors: 28 },
  { id: 'env3', env: 'Development', errors: 12 },
];

const topFailingApis = [
  { id: 'api1', api: '/api/v1/users', failures: 45, percentage: 85 },
  { id: 'api2', api: '/api/v1/auth/login', failures: 32, percentage: 60 },
  { id: 'api3', api: '/api/v1/orders', failures: 28, percentage: 52 },
  { id: 'api4', api: '/api/v1/products', failures: 18, percentage: 34 },
];

// Summary Data (Reports 페이지에서 가져옴)
const trendData = [
  { id: 'td1', date: 'Mar 25', passed: 142, failed: 8, total: 150 },
  { id: 'td2', date: 'Mar 26', passed: 156, failed: 6, total: 162 },
  { id: 'td3', date: 'Mar 27', passed: 178, failed: 12, total: 190 },
  { id: 'td4', date: 'Mar 28', passed: 165, failed: 5, total: 170 },
  { id: 'td5', date: 'Mar 29', passed: 188, failed: 7, total: 195 },
  { id: 'td6', date: 'Mar 30', passed: 201, failed: 4, total: 205 },
  { id: 'td7', date: 'Mar 31', passed: 198, failed: 11, total: 209 },
  { id: 'td8', date: 'Apr 01', passed: 215, failed: 10, total: 225 },
];

interface Incident {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'resolved' | 'investigating' | 'unresolved';
  api: string;
  time: string;
  recurring: boolean;
}

const mockIncidents: Incident[] = [
  {
    id: '1',
    title: 'High latency in user authentication',
    severity: 'critical',
    status: 'unresolved',
    api: '/api/v1/auth/login',
    time: '5 min ago',
    recurring: true,
  },
  {
    id: '2',
    title: 'Database connection timeout',
    severity: 'high',
    status: 'investigating',
    api: '/api/v1/users',
    time: '12 min ago',
    recurring: false,
  },
  {
    id: '3',
    title: '500 Internal Server Error',
    severity: 'medium',
    status: 'investigating',
    api: '/api/v1/orders',
    time: '23 min ago',
    recurring: true,
  },
  {
    id: '4',
    title: 'API rate limit exceeded',
    severity: 'low',
    status: 'resolved',
    api: '/api/v1/products',
    time: '1 hour ago',
    recurring: false,
  },
];

const severityColors = {
  low: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

const statusColors = {
  resolved: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  investigating: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  unresolved: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

export function IncidentDashboard() {
  const navigate = useNavigate();
  const { executionResults } = useTestContext();
  const [dateRange, setDateRange] = useState('24h');
  const [environment, setEnvironment] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const handleIncidentClick = (incidentId: string) => {
    navigate(`/monitoring/logs?incident=${incidentId}`);
  };

  // Calculate summary stats
  const totalTests = trendData[trendData.length - 1].total;
  const totalPassed = trendData[trendData.length - 1].passed;
  const totalFailed = trendData[trendData.length - 1].failed;
  const successRate = ((totalPassed / totalTests) * 100).toFixed(1);

  return (
    <div className="flex-1 overflow-y-auto bg-[#060609]">
      {/* Header */}
      <div className="bg-[#0a0a0f] border-b border-[#1f1f28] px-8 py-6">
        {/* Context Banner */}
        {executionResults && (
          <div className="mb-4 flex items-center justify-between px-4 py-2 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 size={16} className="text-blue-400" />
              <span className="text-gray-300">
                Last execution: {executionResults.stats?.total || 0} tests run on{' '}
                <span className="text-white capitalize">{executionResults.environment}</span>
              </span>
            </div>
            <button
              onClick={() => navigate('/qc/testcase')}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <RefreshCw size={16} />
              Improve Tests
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Incident Dashboard</h1>
            <p className="text-gray-400">Monitor system health, test results, and track errors</p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#13131a] border border-[#1f1f28] rounded-xl hover:bg-[#1a1a22] transition-colors">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-300">{dateRange}</span>
              <ChevronDown size={16} className="text-gray-500" />
            </button>
            
            <select 
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="px-4 py-2 bg-[#13131a] border border-[#1f1f28] rounded-xl text-sm font-medium text-gray-300 hover:bg-[#1a1a22] transition-colors"
            >
              <option value="all">All Environments</option>
              <option value="prod">Production</option>
              <option value="staging">Staging</option>
              <option value="dev">Development</option>
            </select>
            
            <select 
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2 bg-[#13131a] border border-[#1f1f28] rounded-xl text-sm font-medium text-gray-300 hover:bg-[#1a1a22] transition-colors"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 space-y-6">
        {/* Test Summary KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 size={20} className="text-green-400" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-green-400">
                <TrendingUp size={14} />
                3.2%
              </div>
            </div>
            <div className="text-3xl text-white font-semibold mb-1">{successRate}%</div>
            <div className="text-sm text-gray-500">Success Rate</div>
            <div className="mt-3 text-xs text-gray-600">vs. previous period</div>
          </div>

          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Activity size={20} className="text-blue-400" />
              </div>
            </div>
            <div className="text-3xl text-white font-semibold mb-1">{totalTests.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Tests</div>
            <div className="mt-3 text-xs text-gray-600">{trendData.length} executions</div>
          </div>

          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
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

          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock size={20} className="text-orange-400" />
              </div>
            </div>
            <div className="text-3xl text-white font-semibold mb-1">24m</div>
            <div className="text-sm text-gray-500">Avg Duration</div>
            <div className="mt-3 text-xs text-gray-600">per test execution</div>
          </div>
        </div>

        {/* Error Metrics KPI Cards */}
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Total Errors</span>
              <AlertCircle size={18} className="text-gray-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">1,284</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingDown size={14} className="text-green-400" />
              <span className="text-green-400 font-medium">12%</span>
              <span className="text-gray-500">vs last period</span>
            </div>
          </div>

          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Critical Errors</span>
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">45</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp size={14} className="text-red-400" />
              <span className="text-red-400 font-medium">8%</span>
              <span className="text-gray-500">vs last period</span>
            </div>
          </div>

          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Recurring</span>
              <Activity size={18} className="text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">23</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp size={14} className="text-orange-400" />
              <span className="text-orange-400 font-medium">5%</span>
              <span className="text-gray-500">vs last period</span>
            </div>
          </div>

          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Failure Rate</span>
              <Activity size={18} className="text-gray-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">3.2%</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingDown size={14} className="text-green-400" />
              <span className="text-green-400 font-medium">1.2%</span>
              <span className="text-gray-500">vs last period</span>
            </div>
          </div>

          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">MTTR</span>
              <Clock size={18} className="text-gray-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">24m</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingDown size={14} className="text-green-400" />
              <span className="text-green-400 font-medium">18%</span>
              <span className="text-gray-500">vs last period</span>
            </div>
          </div>

          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Affected APIs</span>
              <Activity size={18} className="text-gray-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">12</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp size={14} className="text-red-400" />
              <span className="text-red-400 font-medium">3</span>
              <span className="text-gray-500">vs last period</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-6">
          {/* Test Trend Over Time */}
          <div className="col-span-2 bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <h3 className="text-lg font-semibold text-white mb-4">Test Results Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f28" />
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a0a0f', 
                    border: '1px solid #1f1f28', 
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="passed" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  name="Passed"
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  name="Failed"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Error Type Distribution */}
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <h3 className="text-lg font-semibold text-white mb-4">Error Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={errorTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {errorTypeData.map((entry) => (
                    <Cell key={`error-dist-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a0a0f', 
                    border: '1px solid #1f1f28', 
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {errorTypeData.map((item) => (
                <div key={`legend-${item.name}`} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Errors by Environment & Top Failing APIs */}
        <div className="grid grid-cols-2 gap-6">
          {/* Errors by Environment */}
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <h3 className="text-lg font-semibold text-white mb-4">Errors by Environment</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={errorByEnvData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f28" />
                <XAxis dataKey="env" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a0a0f', 
                    border: '1px solid #1f1f28', 
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff'
                  }} 
                />
                <Bar 
                  dataKey="errors" 
                  fill="#3b82f6" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Failing APIs */}
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <h3 className="text-lg font-semibold text-white mb-4">Top Failing APIs</h3>
            <div className="space-y-4">
              {topFailingApis.map((api) => (
                <div key={api.api}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300 font-mono">{api.api}</span>
                    <span className="text-sm font-semibold text-white">{api.failures}</span>
                  </div>
                  <div className="w-full bg-[#1f1f28] rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all" 
                      style={{ width: `${api.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Incidents Table */}
        <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Incidents</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f1f28]">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Incident</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Severity</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">API</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                </tr>
              </thead>
              <tbody>
                {mockIncidents.map((incident) => (
                  <tr 
                    key={incident.id} 
                    onClick={() => handleIncidentClick(incident.id)}
                    className={`border-b border-[#1f1f28] hover:bg-[#13131a] cursor-pointer transition-colors ${
                      incident.status === 'unresolved' ? 'bg-red-500/5' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className={incident.severity === 'critical' ? 'text-red-400' : 'text-orange-400'} />
                        <span className="text-sm font-medium text-gray-200">{incident.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${severityColors[incident.severity].bg} ${severityColors[incident.severity].text} border ${severityColors[incident.severity].border}`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[incident.status].bg} ${statusColors[incident.status].text} border ${statusColors[incident.status].border}`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-mono text-gray-300">{incident.api}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-400">{incident.time}</span>
                    </td>
                    <td className="py-4 px-4">
                      {incident.recurring && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          Recurring
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}