import { useEffect, useMemo, useState } from 'react';
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
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router';
import { useTestContext } from '../contexts/TestContext';
import { flowOpsApi, getDefaultAppId, type ExecutionDetailResponse } from '../api/flowOpsClient';

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

interface Incident {
  id: string;
  title: string;
  severity: keyof typeof severityColors;
  status: keyof typeof statusColors;
  api: string;
  time: string;
  recurring: boolean;
}

const incidentPageSizeOptions = [5, 10, 20];

export function IncidentDashboard() {
  const navigate = useNavigate();
  const { executionResults } = useTestContext();
  const [dateRange, setDateRange] = useState('24h');
  const [environment, setEnvironment] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [dashboardTrendData, setDashboardTrendData] = useState<{ id: string; date: string; passed: number; failed: number; total: number }[]>([]);
  const [dashboardErrorTrendData, setDashboardErrorTrendData] = useState<{ id: string; time: string; errors: number }[]>([]);
  const [dashboardErrorTypeData, setDashboardErrorTypeData] = useState<{ id: string; name: string; value: number; color: string }[]>([]);
  const [dashboardErrorByEnvData, setDashboardErrorByEnvData] = useState<{ id: string; env: string; errors: number }[]>([]);
  const [dashboardTopFailingApis, setDashboardTopFailingApis] = useState<{ id: string; api: string; failures: number; percentage: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [incidentPage, setIncidentPage] = useState(1);
  const [incidentPageSize, setIncidentPageSize] = useState(10);

  const handleIncidentClick = (incidentId: string) => {
    navigate(`/monitoring/logs?incident=${incidentId}`);
  };


  useEffect(() => {
    let active = true;
    setIsLoading(true);
    flowOpsApi
      .listExecutions(getDefaultAppId())
      .then((page) => {
        if (!active) return;
        const executions = page.content;
        if (executions.length === 0) {
          setIncidents([]);
          setApiError(null);
          return;
        }

        const failedExecutions = executions.filter((execution) => !['SUCCESS', 'QUEUED', 'RUNNING'].includes(execution.status));
        const passed = executions.filter((execution) => execution.status === 'SUCCESS').length;
        const failed = failedExecutions.length;
        const total = executions.length;
        const nextIncidents = failedExecutions.map((execution) => ({
          id: String(execution.id),
          title: execution.errorMessage || `${execution.status} in ${execution.caseName || execution.endpoint || 'execution'}`,
          severity: execution.status === 'FAILED' ? 'high' : 'medium',
          status: execution.status === 'CANCELED' ? 'resolved' : 'investigating',
          api: execution.endpoint || execution.caseName || 'Unknown API',
          time: execution.executedAt || 'Never',
          recurring: failedExecutions.filter((item) => item.endpoint && item.endpoint === execution.endpoint).length > 1,
        } satisfies Incident));
        const envCounts = Array.from(
          failedExecutions.reduce((map, execution) => {
            const key = execution.environmentName || String(execution.environmentId || 'Unknown');
            map.set(key, (map.get(key) || 0) + 1);
            return map;
          }, new Map<string, number>()),
        ).map(([env, errors], index) => ({ id: `env-${index}`, env, errors }));
        const apiCounts = Array.from(
          failedExecutions.reduce((map, execution) => {
            const key = execution.endpoint || execution.caseName || 'Unknown API';
            map.set(key, (map.get(key) || 0) + 1);
            return map;
          }, new Map<string, number>()),
        )
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([api, failures], index) => ({ id: `api-${index}`, api, failures, percentage: failed ? Math.round((failures / failed) * 100) : 0 }));

        setIncidents(nextIncidents);
        setDashboardTrendData([{ id: 'current', date: 'Current', passed, failed, total }]);
        setDashboardErrorTrendData([{ id: 'current-errors', time: 'Current', errors: failed }]);
        setDashboardErrorTypeData([
          { id: 'failed', name: 'Failed', value: failedExecutions.filter((execution) => execution.status === 'FAILED').length, color: '#ef4444' },
          { id: 'partial', name: 'Partial', value: failedExecutions.filter((execution) => execution.status === 'PARTIAL_FAILED').length, color: '#f97316' },
          { id: 'canceled', name: 'Canceled', value: failedExecutions.filter((execution) => execution.status === 'CANCELED').length, color: '#eab308' },
        ]);
        setDashboardErrorByEnvData(envCounts);
        setDashboardTopFailingApis(apiCounts);
        setApiError(null);
      })
      .catch((error) => {
        if (!active) return;
        setIncidents([]);
        setApiError(error instanceof Error ? error.message : 'Failed to load dashboard data.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Calculate summary stats
  const latestTrend = dashboardTrendData[dashboardTrendData.length - 1] || { total: 0, passed: 0, failed: 0 };
  const totalTests = latestTrend.total;
  const totalPassed = latestTrend.passed;
  const totalFailed = latestTrend.failed;
  const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';
  const filteredIncidents = useMemo(
    () =>
      severityFilter === 'all'
        ? incidents
        : incidents.filter((incident) => incident.severity === severityFilter),
    [incidents, severityFilter],
  );
  const incidentTotalPages = Math.max(1, Math.ceil(filteredIncidents.length / incidentPageSize));
  const normalizedIncidentPage = Math.min(incidentPage, incidentTotalPages);
  const incidentStartIndex = (normalizedIncidentPage - 1) * incidentPageSize;
  const incidentEndIndex = Math.min(incidentStartIndex + incidentPageSize, filteredIncidents.length);
  const paginatedIncidents = filteredIncidents.slice(incidentStartIndex, incidentEndIndex);

  useEffect(() => {
    setIncidentPage(1);
  }, [severityFilter, incidentPageSize]);

  useEffect(() => {
    if (incidentPage > incidentTotalPages) {
      setIncidentPage(incidentTotalPages);
    }
  }, [incidentPage, incidentTotalPages]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#060609]">
      {/* Header */}
      <div className="flow-page-header">
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

        <div className="flow-page-header-row mb-4">
          <div>
            <h1 className="flow-page-title">Incident Dashboard</h1>
          </div>

          {/* Filters */}
          <div className="responsive-filters flow-page-actions">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#13131a] border border-[#1f1f28] rounded-lg hover:bg-[#1a1a22] transition-colors">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-300">{dateRange}</span>
              <ChevronDown size={16} className="text-gray-500" />
            </button>

            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="px-4 py-2 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm font-medium text-gray-300 hover:bg-[#1a1a22] transition-colors"
            >
              <option value="all">All Environments</option>
              <option value="prod">Production</option>
              <option value="staging">Staging</option>
              <option value="dev">Development</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm font-medium text-gray-300 hover:bg-[#1a1a22] transition-colors"
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
      <div className="p-4 space-y-6 sm:p-6 lg:p-8">
        {/* Test Summary KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="responsive-header flex items-center justify-between mb-4">
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
          </div>

          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="responsive-header flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Activity size={20} className="text-blue-400" />
              </div>
            </div>
            <div className="text-3xl text-white font-semibold mb-1">{totalTests.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Tests</div>
          </div>

          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="responsive-header flex items-center justify-between mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <XCircle size={20} className="text-red-400" />
              </div>
            </div>
            <div className="text-3xl text-white font-semibold mb-1">{totalFailed}</div>
            <div className="text-sm text-gray-500">Failed Tests</div>
          </div>

          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="responsive-header flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock size={20} className="text-orange-400" />
              </div>
            </div>
            <div className="text-3xl text-white font-semibold mb-1">24m</div>
            <div className="text-sm text-gray-500">Avg Duration</div>
          </div>
        </div>

        {/* Error Metrics KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Total Errors</span>
              <AlertCircle size={18} className="text-gray-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{totalFailed}</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingDown size={14} className="text-green-400" />
              <span className="text-green-400 font-medium">12%</span>
            </div>
          </div>

          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Critical Errors</span>
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{incidents.filter((incident) => incident.severity === 'critical').length}</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp size={14} className="text-red-400" />
              <span className="text-red-400 font-medium">8%</span>
            </div>
          </div>

          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Recurring</span>
              <Activity size={18} className="text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{incidents.filter((incident) => incident.recurring).length}</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp size={14} className="text-orange-400" />
              <span className="text-orange-400 font-medium">5%</span>
            </div>
          </div>

          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Failure Rate</span>
              <Activity size={18} className="text-gray-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{totalTests > 0 ? ((totalFailed / totalTests) * 100).toFixed(1) : '0.0'}%</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingDown size={14} className="text-green-400" />
              <span className="text-green-400 font-medium">1.2%</span>
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
            </div>
          </div>

          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Affected APIs</span>
              <Activity size={18} className="text-gray-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{dashboardTopFailingApis.length}</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp size={14} className="text-red-400" />
              <span className="text-red-400 font-medium">3</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Test Trend Over Time */}
          <div className="xl:col-span-2 bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <h3 className="text-lg font-semibold text-white mb-4">Test Results Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dashboardTrendData}>
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
                  data={dashboardErrorTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dashboardErrorTypeData.map((entry) => (
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
              {dashboardErrorTypeData.map((item) => (
                <div key={`legend-${item.name}`} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Errors by Environment & Top Failing APIs */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Errors by Environment */}
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 hover:border-[#2f2f38] transition-all">
            <h3 className="text-lg font-semibold text-white mb-4">Errors by Environment</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dashboardErrorByEnvData}>
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
              {dashboardTopFailingApis.map((api) => (
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
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-white">Recent Incidents</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                {filteredIncidents.length === 0 ? '0 incidents' : `${incidentStartIndex + 1}-${incidentEndIndex} of ${filteredIncidents.length}`}
              </span>
              <select
                value={incidentPageSize}
                onChange={(event) => setIncidentPageSize(Number(event.target.value))}
                className="rounded-lg border border-[#1f1f28] bg-[#13131a] px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-[#1a1a22]"
                aria-label="Incidents per page"
              >
                {incidentPageSizeOptions.map((size) => (
                  <option key={size} value={size}>{size} / page</option>
                ))}
              </select>
            </div>
          </div>
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
                {paginatedIncidents.map((incident) => (
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
                {!isLoading && paginatedIncidents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                      No incidents found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t border-[#1f1f28] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-gray-500">
              Page {normalizedIncidentPage} of {incidentTotalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIncidentPage((page) => Math.max(1, page - 1))}
                disabled={normalizedIncidentPage === 1}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-[#1f1f28] bg-[#13131a] px-3 text-xs font-medium text-gray-300 transition-colors hover:bg-[#1a1a22] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setIncidentPage((page) => Math.min(incidentTotalPages, page + 1))}
                disabled={normalizedIncidentPage === incidentTotalPages}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-[#1f1f28] bg-[#13131a] px-3 text-xs font-medium text-gray-300 transition-colors hover:bg-[#1a1a22] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
