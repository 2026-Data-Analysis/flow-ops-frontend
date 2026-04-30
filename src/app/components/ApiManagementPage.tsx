import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  Filter,
  ChevronRight,
  Lock,
  TrendingUp,
  Clock,
  FileCode,
  Package,
  X,
  Sparkles,
  Play,
  Eye,
  CheckCircle2,
  XCircle,
  Target,
  BarChart3,
  Check
} from 'lucide-react';
import { flowOpsApi, type ApiEndpointDetailResponse, type ApiInventoryResponse } from '../api/flowOpsClient';
import { useTestContext } from '../contexts/TestContext';

interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  path: string;
  controller: string;
  status: 'auto' | 'edited';
  requiresAuth: boolean;
  domain: string;
  testLevel: 'smoke' | 'sanity' | 'regression' | 'full';
  coverage: number;
  testCount: number;
  lastUpdated: string;
  environments: ('dev' | 'staging' | 'prod')[];
}

const mockEndpoints: ApiEndpoint[] = [
  {
    id: '1',
    method: 'GET',
    path: '/api/v1/users',
    controller: 'UserController.getUsers',
    status: 'auto',
    requiresAuth: true,
    domain: 'User',
    testLevel: 'smoke',
    coverage: 85,
    testCount: 12,
    lastUpdated: '2 hours ago',
    environments: ['dev', 'staging', 'prod'],
  },
  {
    id: '2',
    method: 'POST',
    path: '/api/v1/users',
    controller: 'UserController.createUser',
    status: 'edited',
    requiresAuth: true,
    domain: 'User',
    testLevel: 'sanity',
    coverage: 72,
    testCount: 8,
    lastUpdated: '5 hours ago',
    environments: ['dev', 'staging'],
  },
  {
    id: '3',
    method: 'GET',
    path: '/api/v1/users/:id',
    controller: 'UserController.getUserById',
    status: 'auto',
    requiresAuth: true,
    domain: 'User',
    testLevel: 'regression',
    coverage: 90,
    testCount: 15,
    lastUpdated: '1 day ago',
    environments: ['dev', 'staging', 'prod'],
  },
  {
    id: '4',
    method: 'PUT',
    path: '/api/v1/users/:id',
    controller: 'UserController.updateUser',
    status: 'auto',
    requiresAuth: true,
    domain: 'User',
    testLevel: 'full',
    coverage: 65,
    testCount: 10,
    lastUpdated: '3 hours ago',
    environments: ['staging', 'prod'],
  },
  {
    id: '5',
    method: 'DELETE',
    path: '/api/v1/users/:id',
    controller: 'UserController.deleteUser',
    status: 'auto',
    requiresAuth: true,
    domain: 'User',
    testLevel: 'smoke',
    coverage: 95,
    testCount: 6,
    lastUpdated: '12 hours ago',
    environments: ['dev', 'staging', 'prod'],
  },
  {
    id: '6',
    method: 'POST',
    path: '/api/v1/auth/login',
    controller: 'AuthController.login',
    status: 'auto',
    requiresAuth: false,
    domain: 'Auth',
    testLevel: 'smoke',
    coverage: 100,
    testCount: 20,
    lastUpdated: '30 minutes ago',
    environments: ['dev', 'staging', 'prod'],
  },
  {
    id: '7',
    method: 'GET',
    path: '/api/v1/products',
    controller: 'ProductController.getProducts',
    status: 'edited',
    requiresAuth: false,
    domain: 'Product',
    testLevel: 'regression',
    coverage: 58,
    testCount: 7,
    lastUpdated: '6 hours ago',
    environments: ['dev', 'staging'],
  },
  {
    id: '8',
    method: 'PATCH',
    path: '/api/v1/products/:id/stock',
    controller: 'ProductController.updateStock',
    status: 'auto',
    requiresAuth: true,
    domain: 'Product',
    testLevel: 'full',
    coverage: 45,
    testCount: 5,
    lastUpdated: '1 day ago',
    environments: ['staging', 'prod'],
  },
  {
    id: '9',
    method: 'POST',
    path: '/api/v1/posts',
    controller: 'PostController.createPost',
    status: 'auto',
    requiresAuth: true,
    domain: 'Post',
    testLevel: 'sanity',
    coverage: 80,
    testCount: 11,
    lastUpdated: '4 hours ago',
    environments: ['dev', 'staging', 'prod'],
  },
  {
    id: '10',
    method: 'POST',
    path: '/api/v1/posts/:postId/like',
    controller: 'LikeController.likePost',
    status: 'auto',
    requiresAuth: true,
    domain: 'Like',
    testLevel: 'regression',
    coverage: 70,
    testCount: 9,
    lastUpdated: '8 hours ago',
    environments: ['dev', 'staging'],
  },
];

const methodColors = {
  GET: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  POST: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  PUT: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  DELETE: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  PATCH: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  OPTIONS: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  HEAD: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
};

const testLevelColors = {
  smoke: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  sanity: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  regression: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  full: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

const formatRelativeTime = (value?: string) => {
  if (!value) return 'Never';
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return value;
  const minutes = Math.max(1, Math.round((Date.now() - time) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.round(hours / 24)} days ago`;
};

const normalizeInventory = (inventory: ApiInventoryResponse): ApiEndpoint => ({
  id: String(inventory.id),
  method: (inventory.method === 'TRACE' ? 'GET' : inventory.method) as ApiEndpoint['method'],
  path: inventory.endpointPath,
  controller: inventory.operationId || inventory.summary || 'Inventory',
  status: inventory.editStatus === 'EDITED' || inventory.sourceType === 'MANUAL' ? 'edited' : 'auto',
  requiresAuth: Boolean(inventory.authRequired),
  domain: inventory.branchName || 'General',
  testLevel: (inventory.testLevels?.[0]?.toLowerCase() as ApiEndpoint['testLevel']) || 'smoke',
  coverage: Math.round(inventory.coveragePercentage ?? 0),
  testCount: inventory.totalTestCount ?? 0,
  lastUpdated: inventory.specVersion || 'Inventory',
  environments: ['dev', 'staging', 'prod'],
});

export function ApiManagementPage() {
  const navigate = useNavigate();
  const { setSelectedAPIs } = useTestContext();
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [apiDetails, setApiDetails] = useState<Record<string, ApiEndpointDetailResponse>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState<'all' | 'dev' | 'staging' | 'prod'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [testLevelFilter, setTestLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'auto' | 'edited'>('all');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedApiId, setSelectedApiId] = useState<string | null>(null);
  const [selectedApiIds, setSelectedApiIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    flowOpsApi
      .ensureProject()
      .then((project) => flowOpsApi.listInventories(project.id))
      .then((inventory) => {
        if (!active) return;
        setEndpoints(inventory.items.map(normalizeInventory));
        setApiError(null);
      })
      .catch((error) => {
        if (!active) return;
        setEndpoints([]);
        setApiError(error instanceof Error ? error.message : 'API 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Extract unique domains
  const domains = ['all', ...Array.from(new Set(endpoints.map(e => e.domain)))];

  const filteredEndpoints = endpoints.filter(endpoint => {
    const matchesSearch =
      endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.controller.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEnvironment = selectedEnvironment === 'all' || endpoint.environments.includes(selectedEnvironment);
    const matchesMethod = methodFilter === 'all' || endpoint.method === methodFilter;
    const matchesTestLevel = testLevelFilter === 'all' || endpoint.testLevel === testLevelFilter;
    const matchesSource = sourceFilter === 'all' || endpoint.status === sourceFilter;
    const matchesDomain = selectedDomain === 'all' || endpoint.domain === selectedDomain;
    return matchesSearch && matchesEnvironment && matchesMethod && matchesTestLevel && matchesSource && matchesDomain;
  });

  const handleApiClick = (apiId: string) => {
    setSelectedApiId(apiId);
    const endpoint = endpoints.find((api) => api.id === apiId);
    if (endpoint) {
      setSelectedAPIs([{ id: endpoint.id, name: endpoint.path, endpoint: endpoint.path, method: endpoint.method }]);
    }
  };

  const toggleApiSelection = (apiId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedApiIds(prev =>
      prev.includes(apiId) ? prev.filter(id => id !== apiId) : [...prev, apiId]
    );
  };

  const handleGenerateTests = () => {
    if (selectedApiId) {
      navigate('/qc/testcase', { state: { selectedApiId } });
    }
  };

  const handleRunTests = () => {
    if (selectedApiId) {
      const ids = selectedApiIds.length > 0 ? selectedApiIds : [selectedApiId];
      const selected = endpoints
        .filter((api) => ids.includes(api.id))
        .map((api) => ({ id: api.id, name: api.path, endpoint: api.path, method: api.method }));
      setSelectedAPIs(selected);
      navigate('/execution/run', { state: { selectedApiId, selectedApiIds: ids } });
    }
  };

  const handleViewLogs = () => {
    if (selectedApiId) {
      navigate('/monitoring/history');
    }
  };

  const selectedApi = selectedApiId ? endpoints.find(e => e.id === selectedApiId) : null;

  // Calculate summary stats
  const totalEndpoints = filteredEndpoints.length;
  const avgCoverage = filteredEndpoints.length > 0
    ? Math.round(filteredEndpoints.reduce((sum, e) => sum + e.coverage, 0) / filteredEndpoints.length)
    : 0;
  const totalTests = filteredEndpoints.reduce((sum, e) => sum + e.testCount, 0);

  return (
    <div className="responsive-detail-grid flex-1 overflow-hidden bg-[#060609] grid" style={{ gridTemplateColumns: selectedApiId ? '1fr 480px' : '1fr' }}>
      {/* Left Panel: API List */}
      <div className="flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#0a0a0f] border-b border-[#1f1f28] px-8 py-6">
          <div className="responsive-header flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">API Discovery</h1>
            <p className="text-gray-400">Find APIs and generate tests</p>
          </div>

          {/* Summary Stats */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-[#13131a] border border-[#1f1f28] rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Package size={14} className="text-gray-500" />
                <span className="text-xs text-gray-500">APIs</span>
              </div>
              <div className="text-xl text-white font-semibold">{totalEndpoints}</div>
            </div>

            <div className="px-4 py-2 bg-[#13131a] border border-[#1f1f28] rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-gray-500" />
                <span className="text-xs text-gray-500">Avg Coverage</span>
              </div>
              <div className="text-xl text-white font-semibold">{avgCoverage}%</div>
            </div>

            <div className="px-4 py-2 bg-[#13131a] border border-[#1f1f28] rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FileCode size={14} className="text-gray-500" />
                <span className="text-xs text-gray-500">Total Tests</span>
              </div>
              <div className="text-xl text-white font-semibold">{totalTests}</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search endpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/30"
            />
          </div>

          {/* Filters Row */}
          <div className="responsive-filters flex items-center gap-3">
            {selectedApiIds.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <span className="text-sm text-blue-400">
                  {selectedApiIds.length} API{selectedApiIds.length > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedApiIds([])}
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  Clear
                </button>
              </div>
            )}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                showFilters ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-[#13131a] border border-[#1f1f28] text-gray-400 hover:text-white'
              }`}
            >
              <Filter size={14} />
              Filters
            </button>

            {showFilters && (
              <>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="px-4 py-2 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/30"
                >
                  <option value="all">All Methods</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>

                <select
                  value={testLevelFilter}
                  onChange={(e) => setTestLevelFilter(e.target.value)}
                  className="px-4 py-2 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/30"
                >
                  <option value="all">All Test Levels</option>
                  <option value="smoke">Smoke</option>
                  <option value="sanity">Sanity</option>
                  <option value="regression">Regression</option>
                  <option value="full">Full</option>
                </select>

                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as any)}
                  className="px-4 py-2 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/30"
                >
                  <option value="all">All Sources</option>
                  <option value="auto">Auto-detected</option>
                  <option value="edited">Edited</option>
                </select>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Environment Tabs */}
      <div className="border-b border-[#1f1f28] bg-[#0a0a0f]">
        <div className="px-8 py-3">
          <div className="responsive-tabs flex items-center gap-2">
            <button
              onClick={() => setSelectedEnvironment('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedEnvironment === 'all'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#13131a]'
              }`}
            >
              All Environments
            </button>
            <button
              onClick={() => setSelectedEnvironment('dev')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                selectedEnvironment === 'dev'
                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#13131a]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              Dev
            </button>
            <button
              onClick={() => setSelectedEnvironment('staging')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                selectedEnvironment === 'staging'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#13131a]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Staging
            </button>
            <button
              onClick={() => setSelectedEnvironment('prod')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                selectedEnvironment === 'prod'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#13131a]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Prod
            </button>
          </div>
        </div>
      </div>

      {/* Domain Tabs */}
      <div className="border-b border-[#1f1f28] bg-[#0a0a0f]">
        <div className="px-8 py-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            {domains.map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedDomain === domain
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-[#13131a]'
                }`}
              >
                {domain === 'all' ? 'All Domains' : domain}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* API List */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {apiError && (
            <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
              Backend unavailable: {apiError}. Showing cached sample data.
            </div>
          )}
          {isLoading && (
            <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
              Loading APIs from FlowOps...
            </div>
          )}
          {filteredEndpoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-[#13131a] rounded-full flex items-center justify-center mb-4">
                <Package size={24} className="text-gray-500" />
              </div>
              <h3 className="text-white mb-2">No APIs found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredEndpoints.map((endpoint) => (
                <div
                  key={endpoint.id}
                  onClick={() => handleApiClick(endpoint.id)}
                  className={`group bg-[#0a0a0f] border rounded-xl p-5 cursor-pointer transition-all hover:border-blue-500/30 hover:bg-[#0d0d12] ${
                    selectedApiId === endpoint.id ? 'border-blue-500/50 bg-blue-500/5' : 'border-[#1f1f28]'
                  }`}
                >
                <div className="responsive-card-row flex items-start gap-4">
                    {/* Checkbox */}
                    <div
                      onClick={(e) => toggleApiSelection(endpoint.id, e)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedApiIds.includes(endpoint.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-500 hover:border-blue-500'
                      }`}
                    >
                      {selectedApiIds.includes(endpoint.id) && <Check size={14} className="text-white" />}
                    </div>

                    {/* Method Badge */}
                    <span
                      className={`${methodColors[endpoint.method].bg} ${methodColors[endpoint.method].text} ${methodColors[endpoint.method].border} border px-3 py-1.5 rounded-lg text-sm font-semibold font-mono flex-shrink-0`}
                    >
                      {endpoint.method}
                    </span>

                    {/* API Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-white font-mono truncate group-hover:text-blue-400 transition-colors">
                          {endpoint.path}
                        </div>
                        <span className="px-2 py-0.5 bg-[#1f1f28] text-gray-400 text-xs rounded-full flex-shrink-0">
                          {endpoint.domain}
                        </span>
                        {endpoint.requiresAuth && (
                          <Lock size={14} className="text-gray-500 flex-shrink-0" />
                        )}
                      </div>

                      <div className="text-xs text-gray-500 mb-3">{endpoint.controller}</div>

                      {/* Badges Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full ${
                            endpoint.status === 'auto'
                              ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {endpoint.status}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full capitalize ${testLevelColors[endpoint.testLevel].bg} ${testLevelColors[endpoint.testLevel].text} ${testLevelColors[endpoint.testLevel].border} border`}
                        >
                          {endpoint.testLevel}
                        </span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="responsive-metrics flex items-center gap-6 flex-shrink-0">
                      {/* Coverage */}
                      <div className="text-center">
                        <div className="flex items-center gap-1.5 mb-1">
                          <TrendingUp size={12} className="text-gray-500" />
                          <span className="text-xs text-gray-500">Coverage</span>
                        </div>
                        <div className={`text-lg font-semibold ${
                          endpoint.coverage >= 80 ? 'text-green-400' :
                          endpoint.coverage >= 60 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {endpoint.coverage}%
                        </div>
                      </div>

                      {/* Test Count */}
                      <div className="text-center">
                        <div className="flex items-center gap-1.5 mb-1">
                          <FileCode size={12} className="text-gray-500" />
                          <span className="text-xs text-gray-500">Tests</span>
                        </div>
                        <div className="text-lg text-white font-semibold">{endpoint.testCount}</div>
                      </div>

                      {/* Last Updated */}
                      <div className="text-center min-w-[100px]">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Clock size={12} className="text-gray-500" />
                          <span className="text-xs text-gray-500">Updated</span>
                        </div>
                        <div className="text-xs text-gray-400">{endpoint.lastUpdated}</div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight size={20} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Right Panel: API Detail */}
      {selectedApiId && selectedApi && (
        <aside className="bg-[#0a0a0f] border-l border-[#1f1f28] flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-[#1f1f28] flex items-center justify-between">
            <h3 className="text-white font-semibold">API Details</h3>
            <button
              onClick={() => setSelectedApiId(null)}
              className="p-1.5 hover:bg-[#1f1f28] rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* A. Basic Info */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Basic Information</div>
              <div className="bg-[#13131a] border border-[#1f1f28] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`${methodColors[selectedApi.method].bg} ${methodColors[selectedApi.method].text} ${methodColors[selectedApi.method].border} border px-3 py-1.5 rounded-lg text-sm font-semibold font-mono`}>
                    {selectedApi.method}
                  </span>
                  <span className="text-white font-mono text-sm flex-1">{selectedApi.path}</span>
                </div>
                <div className="pt-3 border-t border-[#1f1f28] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Controller</span>
                    <span className="text-xs text-white font-mono">{selectedApi.controller}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Domain</span>
                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded border border-purple-500/20">
                      {selectedApi.domain}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Auth Required</span>
                    {selectedApi.requiresAuth ? (
                      <Lock size={14} className="text-yellow-400" />
                    ) : (
                      <span className="text-xs text-gray-400">No</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* B. Test Overview */}
            {apiDetails[selectedApi.id] && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Schemas</div>
                <div className="bg-[#13131a] border border-[#1f1f28] rounded-xl p-4 space-y-3">
                  <pre className="max-h-32 overflow-auto text-xs text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(apiDetails[selectedApi.id].requestSchema || {}, null, 2)}
                  </pre>
                  <pre className="max-h-32 overflow-auto text-xs text-gray-300 whitespace-pre-wrap border-t border-[#1f1f28] pt-3">
                    {JSON.stringify(apiDetails[selectedApi.id].responseSchema || {}, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* B. Test Overview */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Test Overview</div>
              <div className="space-y-3">
                <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Total Test Cases</span>
                    <FileCode size={16} className="text-gray-500" />
                  </div>
                  <div className="text-2xl text-white font-semibold">{selectedApi.testCount}</div>
                </div>

                <div className="bg-[#13131a] border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Coverage</span>
                    <TrendingUp size={16} className="text-green-400" />
                  </div>
                  <div className={`text-2xl font-semibold ${
                    selectedApi.coverage >= 80 ? 'text-green-400' :
                    selectedApi.coverage >= 60 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {selectedApi.coverage}%
                  </div>
                </div>

                <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400 text-sm">Test Level</span>
                    <Target size={16} className="text-gray-500" />
                  </div>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm capitalize ${testLevelColors[selectedApi.testLevel].bg} ${testLevelColors[selectedApi.testLevel].text} ${testLevelColors[selectedApi.testLevel].border} border`}>
                    {selectedApi.testLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* C. Recent Execution Summary */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Recent Execution</div>
              <div className="bg-[#13131a] border border-[#1f1f28] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Last Run</span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-400" />
                    <span className="text-xs text-white">{selectedApi.lastUpdated}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Success Rate</span>
                  <span className="text-sm text-green-400 font-semibold">95%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedApi.status === 'auto'
                      ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {selectedApi.status}
                  </span>
                </div>
              </div>
            </div>

            {/* D. Quick Actions */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Quick Actions</div>
              <div className="space-y-2">
                <button
                  onClick={handleGenerateTests}
                  className="w-full flex items-center justify-start gap-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  <Sparkles size={18} />
                  <span className="font-medium">Generate Tests</span>
                </button>

                <button
                  onClick={handleRunTests}
                  className="w-full flex items-center justify-start gap-3 bg-[#13131a] border border-blue-500/20 hover:bg-blue-500/5 text-white px-4 py-3 rounded-lg transition-all"
                >
                  <Play size={18} className="text-blue-400" />
                  <span className="font-medium">Run Tests</span>
                </button>

                <button
                  onClick={handleViewLogs}
                  className="w-full flex items-center justify-start gap-3 bg-[#13131a] border border-[#1f1f28] hover:border-[#2f2f38] text-white px-4 py-3 rounded-lg transition-all"
                >
                  <Eye size={18} className="text-gray-400" />
                  <span className="font-medium">View Logs</span>
                </button>
              </div>
            </div>

            {/* E. Test Preview */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Sample Test Cases</div>
              <div className="space-y-2">
                {[
                  { name: 'Success - Valid User', type: 'auto', status: 'passed' },
                  { name: 'Error - Invalid ID', type: 'auto', status: 'passed' },
                  { name: 'Auth - Missing Token', type: 'edited', status: 'failed' },
                ].map((test, idx) => (
                  <div
                    key={idx}
                    className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm">{test.name}</span>
                      {test.status === 'passed' ? (
                        <CheckCircle2 size={14} className="text-green-400" />
                      ) : (
                        <XCircle size={14} className="text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        test.type === 'auto'
                          ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {test.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
