import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

// Mock data for the dashboard
const stats = [
  { label: 'Total Tests', value: '1,247', change: '+12%', icon: <Activity size={20} />, trend: 'up' },
  { label: 'Passed', value: '1,089', change: '+8%', icon: <CheckCircle2 size={20} />, trend: 'up' },
  { label: 'Failed', value: '42', change: '-3%', icon: <XCircle size={20} />, trend: 'down' },
  { label: 'Avg Duration', value: '2.4s', change: '-12%', icon: <Clock size={20} />, trend: 'down' },
];

const recentTests = [
  { id: 'TC-1234', name: 'User Authentication API', status: 'passed', duration: '1.8s', time: '2 min ago', endpoint: '/api/v1/auth/login' },
  { id: 'TC-1235', name: 'Payment Gateway Integration', status: 'passed', duration: '3.2s', time: '5 min ago', endpoint: '/api/v1/payment/checkout' },
  { id: 'TC-1236', name: 'Order Management System', status: 'failed', duration: '2.1s', time: '8 min ago', endpoint: '/api/v1/orders/create' },
  { id: 'TC-1237', name: 'Inventory Update Service', status: 'passed', duration: '1.5s', time: '12 min ago', endpoint: '/api/v1/inventory/update' },
  { id: 'TC-1238', name: 'Customer Profile Retrieval', status: 'warning', duration: '4.8s', time: '15 min ago', endpoint: '/api/v1/customers/:id' },
  { id: 'TC-1239', name: 'Email Notification Service', status: 'passed', duration: '2.3s', time: '18 min ago', endpoint: '/api/v1/notifications/email' },
];

const apiEndpoints = [
  { name: 'Auth Service', tests: 45, coverage: 92, status: 'healthy' },
  { name: 'Payment Gateway', tests: 38, coverage: 88, status: 'healthy' },
  { name: 'Order Management', tests: 67, coverage: 76, status: 'warning' },
  { name: 'Inventory System', tests: 52, coverage: 94, status: 'healthy' },
  { name: 'Customer Portal', tests: 41, coverage: 81, status: 'healthy' },
];

export function MainContent() {
  return (
    <main className="flex-1 overflow-y-auto bg-[#060609] p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-white text-2xl mb-1">API Management</h1>
          <p className="text-gray-500 text-sm">Monitor and manage your API test cases and execution history</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-5 hover:border-[#2f2f38] transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                  {stat.icon}
                </div>
                <span className={`text-xs font-medium ${
                  stat.trend === 'up' ? 'text-green-400' : 'text-orange-400'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main Grid - List + Detail Pattern */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Recent Tests List */}
          <div className="lg:col-span-2">
            <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1f1f28]">
                <h2 className="text-white">Recent Test Executions</h2>
                <p className="text-sm text-gray-500 mt-1">Latest test runs across all environments</p>
              </div>
              <div className="divide-y divide-[#1f1f28]">
                {recentTests.map((test) => (
                  <div
                    key={test.id}
                    className="px-5 py-4 hover:bg-[#13131a] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-500 font-mono">{test.id}</span>
                          {test.status === 'passed' && (
                            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={12} />
                              Passed
                            </span>
                          )}
                          {test.status === 'failed' && (
                            <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                              <XCircle size={12} />
                              Failed
                            </span>
                          )}
                          {test.status === 'warning' && (
                            <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                              <AlertTriangle size={12} />
                              Warning
                            </span>
                          )}
                        </div>
                        <div className="text-white mb-1 group-hover:text-blue-400 transition-colors">
                          {test.name}
                        </div>
                        <div className="text-sm text-gray-500 font-mono truncate">
                          {test.endpoint}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm text-white mb-1">{test.duration}</div>
                        <div className="text-xs text-gray-500">{test.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-[#1f1f28] bg-[#0a0a0f]">
                <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                  View all executions
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Right: API Endpoints Panel */}
          <div className="lg:col-span-1">
            <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1f1f28]">
                <h2 className="text-white">API Endpoints</h2>
                <p className="text-sm text-gray-500 mt-1">Test coverage by service</p>
              </div>
              <div className="p-5 space-y-4">
                {apiEndpoints.map((endpoint) => (
                  <div
                    key={endpoint.name}
                    className="p-4 bg-[#13131a] border border-[#1f1f28] rounded-lg hover:border-[#2f2f38] transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white text-sm">{endpoint.name}</span>
                      {endpoint.status === 'healthy' && (
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                      )}
                      {endpoint.status === 'warning' && (
                        <div className="w-2 h-2 bg-orange-400 rounded-full" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>{endpoint.tests} tests</span>
                      <span>{endpoint.coverage}% coverage</span>
                    </div>
                    <div className="w-full bg-[#1f1f28] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          endpoint.coverage >= 90
                            ? 'bg-green-500'
                            : endpoint.coverage >= 80
                            ? 'bg-blue-500'
                            : 'bg-orange-500'
                        }`}
                        style={{ width: `${endpoint.coverage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-[#1f1f28] bg-[#0a0a0f]">
                <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                  Manage endpoints
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="mt-6 bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-5">
              <h3 className="text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-2.5 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm text-white hover:border-blue-500/20 hover:bg-blue-500/5 transition-all">
                  Generate Test Cases
                </button>
                <button className="w-full text-left px-4 py-2.5 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm text-white hover:border-blue-500/20 hover:bg-blue-500/5 transition-all">
                  Create Scenario
                </button>
                <button className="w-full text-left px-4 py-2.5 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm text-white hover:border-blue-500/20 hover:bg-blue-500/5 transition-all">
                  View Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
