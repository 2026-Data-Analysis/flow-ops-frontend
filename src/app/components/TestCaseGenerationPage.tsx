import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Search,
  X,
  CheckCircle2,
  TrendingUp,
  Check,
  Sparkles,
  Play,
  ArrowRight,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  BarChart3,
  FileText,
  Clock
} from 'lucide-react';
import { useTestContext } from '../contexts/TestContext';

interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  domain: string;
  coverage: number;
  testCount: number;
  lastUpdated: string;
}

interface TestCase {
  id: string;
  name: string;
  type: 'success' | 'validation' | 'auth' | 'edge' | 'error';
  apiId: string;
  role?: string;
  stateCondition?: string;
  dataVariant?: string;
  status?: 'new' | 'duplicate' | 'existing';
  isEdited?: boolean;
  description?: string;
  expectedResult?: string;
  requestPreview?: string;
  validationRules?: string[];
}

const mockApis: ApiEndpoint[] = [
  { id: '1', method: 'POST', path: '/api/v1/auth/login', domain: 'Auth', coverage: 65, testCount: 12, lastUpdated: '2 hours ago' },
  { id: '2', method: 'POST', path: '/api/v1/auth/register', domain: 'Auth', coverage: 45, testCount: 8, lastUpdated: '1 day ago' },
  { id: '3', method: 'POST', path: '/api/v1/posts', domain: 'Post', coverage: 80, testCount: 15, lastUpdated: '3 hours ago' },
  { id: '4', method: 'GET', path: '/api/v1/posts/:id', domain: 'Post', coverage: 72, testCount: 10, lastUpdated: '5 hours ago' },
  { id: '5', method: 'PUT', path: '/api/v1/posts/:id', domain: 'Post', coverage: 55, testCount: 9, lastUpdated: '1 day ago' },
  { id: '6', method: 'DELETE', path: '/api/v1/posts/:id', domain: 'Post', coverage: 90, testCount: 6, lastUpdated: '12 hours ago' },
  { id: '7', method: 'GET', path: '/api/v1/users/:id', domain: 'User', coverage: 68, testCount: 11, lastUpdated: '4 hours ago' },
];

const mockExistingTests: TestCase[] = [
  {
    id: 'e1',
    name: 'Login - Admin Success',
    type: 'success',
    apiId: '1',
    role: 'Admin',
    stateCondition: 'Valid Token',
    dataVariant: 'Valid Input',
    status: 'existing',
    description: 'Validates successful admin login with correct credentials',
    expectedResult: 'Returns 200 with auth token and user data',
    requestPreview: '{\n  "username": "admin@test.com",\n  "password": "***"\n}',
    validationRules: ['Status code 200', 'Token present', 'User data structure valid'],
  },
  {
    id: 'e2',
    name: 'Login - Invalid Password',
    type: 'validation',
    apiId: '1',
    role: 'User',
    stateCondition: 'Valid Token',
    dataVariant: 'Invalid Input',
    status: 'existing',
    description: 'Validates error handling for incorrect password',
    expectedResult: 'Returns 401 with error message',
    requestPreview: '{\n  "username": "user@test.com",\n  "password": "wrong"\n}',
    validationRules: ['Status code 401', 'Error message present'],
  },
  {
    id: 'e3',
    name: 'Create Post - Success',
    type: 'success',
    apiId: '3',
    role: 'User',
    stateCondition: 'Logged In',
    dataVariant: 'Valid Input',
    status: 'existing',
    description: 'Creates a new post with valid data',
    expectedResult: 'Returns 201 with created post',
    validationRules: ['Status code 201', 'Post ID present'],
  },
];

const userRoles = ['Admin', 'User', 'Guest', 'Moderator'];
const stateConditions = ['Logged In', 'Token Expired', 'Valid Token', 'Resource Exists', 'Rate Limited'];
const dataVariants = ['Valid Input', 'Invalid Input', 'Boundary Value', 'Null / Empty'];

const methodColors = {
  GET: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  POST: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  PUT: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  DELETE: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  PATCH: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

const typeColors = {
  success: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', label: 'Success' },
  validation: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', label: 'Validation' },
  auth: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Auth' },
  edge: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', label: 'Edge' },
  error: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Error' },
};

export function TestCaseGenerationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSelectedAPIs, setTestContext } = useTestContext();

  // Modal & API Selection
  const [showApiModal, setShowApiModal] = useState(false);
  const [apis] = useState<ApiEndpoint[]>(mockApis);
  const [selectedApiId, setSelectedApiId] = useState<string | null>(null);
  const [selectedApiIdsForGeneration, setSelectedApiIdsForGeneration] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiSearchQuery, setApiSearchQuery] = useState('');

  // Context Builder State
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Admin', 'User']);
  const [selectedStates, setSelectedStates] = useState<string[]>(['Logged In', 'Token Expired']);
  const [selectedDataVariants, setSelectedDataVariants] = useState<string[]>(['Valid Input', 'Invalid Input']);

  // Tests State
  const [existingTests, setExistingTests] = useState<TestCase[]>(mockExistingTests);
  const [generatedTests, setGeneratedTests] = useState<TestCase[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  // Panel State
  const [rightPanelMode, setRightPanelMode] = useState<'existing' | 'comparison' | 'generated' | 'hidden'>('hidden');

  const selectedApi = selectedApiId ? apis.find(a => a.id === selectedApiId) : null;
  const currentApiTests = existingTests.filter(t => t.apiId === selectedApiId);

  const filteredApisForModal = apis.filter(api =>
    api.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    api.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredApisForBrowse = apis.filter(api =>
    api.path.toLowerCase().includes(apiSearchQuery.toLowerCase()) ||
    api.domain.toLowerCase().includes(apiSearchQuery.toLowerCase())
  );

  const toggleApiSelectionForGeneration = (apiId: string) => {
    setSelectedApiIdsForGeneration(prev =>
      prev.includes(apiId) ? prev.filter(id => id !== apiId) : [...prev, apiId]
    );
  };

  const handleApiClick = (apiId: string) => {
    setSelectedApiId(apiId);
    setRightPanelMode('existing');
  };

  const handleGenerateTests = () => {
    setIsGenerating(true);
    setRightPanelMode('comparison');

    setTimeout(() => {
      const newTests: TestCase[] = [];
      selectedApiIdsForGeneration.forEach((apiId) => {
        selectedRoles.forEach((role) => {
          selectedStates.forEach((state) => {
            selectedDataVariants.forEach((variant) => {
              const isDuplicate = existingTests.some(
                t => t.apiId === apiId && t.role === role && t.stateCondition === state && t.dataVariant === variant
              );

              if (!isDuplicate || Math.random() > 0.5) {
                newTests.push({
                  id: `g${Date.now()}${Math.random()}`,
                  name: `${role} - ${state} - ${variant}`,
                  type: variant === 'Valid Input' ? 'success' : 'validation',
                  apiId,
                  role,
                  stateCondition: state,
                  dataVariant: variant,
                  status: isDuplicate ? 'duplicate' : 'new',
                  description: `Test case for ${role} with ${state} and ${variant}`,
                  expectedResult: variant === 'Valid Input' ? 'Success response' : 'Validation error',
                  requestPreview: '{\n  "username": "test@example.com",\n  "password": "***"\n}',
                  validationRules: ['Status code validation', 'Response schema check', 'Error message format'],
                });
              }
            });
          });
        });
      });
      setGeneratedTests(newTests);
      setIsGenerating(false);
    }, 2000);
  };

  const handleConfirmApiSelection = () => {
    setShowApiModal(false);
    if (selectedApiIdsForGeneration.length > 0) {
      handleGenerateTests();
    }
  };

  const handleRunGeneratedTests = () => {
    const selectedApiData = apis.filter(api => selectedApiIdsForGeneration.includes(api.id)).map(api => ({
      id: api.id,
      name: api.path,
      endpoint: api.path,
      method: api.method,
    }));

    setSelectedAPIs(selectedApiData);
    setTestContext({
      businessRules: selectedRoles,
      edgeCases: selectedStates,
      dataConstraints: selectedDataVariants,
    });
    navigate('/execution/run');
  };

  const toggleTestEdit = (testId: string) => {
    setExpandedTestId(expandedTestId === testId ? null : testId);
  };

  const updateTestCase = (testId: string, updates: Partial<TestCase>) => {
    if (rightPanelMode === 'existing') {
      setExistingTests(prev =>
        prev.map(t => t.id === testId ? { ...t, ...updates, isEdited: true } : t)
      );
    } else {
      setGeneratedTests(prev =>
        prev.map(t => t.id === testId ? { ...t, ...updates, isEdited: true } : t)
      );
    }
  };

  // Matrix data
  const matrixData = selectedRoles.map(role => ({
    role,
    cells: selectedStates.flatMap(state =>
      selectedDataVariants.map(variant => {
        const hasExisting = existingTests.some(
          t => selectedApiIdsForGeneration.includes(t.apiId) && t.role === role && t.stateCondition === state && t.dataVariant === variant
        );
        const hasGenerated = generatedTests.some(
          t => t.role === role && t.stateCondition === state && t.dataVariant === variant
        );
        return {
          state,
          variant,
          hasExisting,
          hasGenerated,
          isMissing: !hasExisting && !hasGenerated,
        };
      })
    ),
  }));

  // Calculate stats
  const existingCount = existingTests.filter(t => selectedApiIdsForGeneration.includes(t.apiId)).length;
  const newCount = generatedTests.filter(t => t.status === 'new').length;
  const duplicateCount = generatedTests.filter(t => t.status === 'duplicate').length;
  const currentCoverage = selectedApiIdsForGeneration.length > 0
    ? Math.round(apis.filter(a => selectedApiIdsForGeneration.includes(a.id)).reduce((sum, a) => sum + a.coverage, 0) / selectedApiIdsForGeneration.length)
    : 0;
  const projectedCoverage = Math.min(100, currentCoverage + newCount * 3);

  return (
    <div className="flex-1 overflow-hidden bg-[#060609] flex flex-col">
      {/* API Selection Modal */}
      {showApiModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-[#1f1f28]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-xl font-semibold">Select APIs to Generate Tests</h2>
                <button
                  onClick={() => setShowApiModal(false)}
                  className="p-2 hover:bg-[#1f1f28] rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search APIs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/30"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {filteredApisForModal.map((api) => (
                  <div
                    key={api.id}
                    onClick={() => toggleApiSelectionForGeneration(api.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedApiIdsForGeneration.includes(api.id)
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-[#13131a] border-[#1f1f28] hover:border-[#2f2f38]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedApiIdsForGeneration.includes(api.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-500'
                      }`}>
                        {selectedApiIdsForGeneration.includes(api.id) && <Check size={14} className="text-white" />}
                      </div>

                      <span className={`${methodColors[api.method].bg} ${methodColors[api.method].text} ${methodColors[api.method].border} border px-2 py-1 rounded text-xs font-semibold font-mono`}>
                        {api.method}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="text-white font-mono text-sm mb-1">{api.path}</div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">{api.domain}</span>
                          <span className={`text-xs font-medium ${
                            api.coverage >= 80 ? 'text-green-400' :
                            api.coverage >= 60 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {api.coverage}% coverage
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-[#1f1f28] flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {selectedApiIdsForGeneration.length} API{selectedApiIdsForGeneration.length !== 1 ? 's' : ''} selected
              </div>
              <button
                onClick={handleConfirmApiSelection}
                disabled={selectedApiIdsForGeneration.length === 0}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles size={18} />
                Generate for Selected APIs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="responsive-detail-grid flex-1 overflow-hidden grid" style={{ gridTemplateColumns: rightPanelMode === 'hidden' ? '1fr' : '1fr 480px' }}>
        {/* Center Main Panel */}
        <main className="overflow-y-auto bg-[#060609]">
          <div className="p-8 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-white text-2xl font-semibold mb-1">AI Test Generation</h1>
                <p className="text-gray-500 text-sm">Generate, browse, and manage test cases</p>
              </div>

              {generatedTests.length > 0 && (
                <button
                  onClick={() => setRightPanelMode(prev => prev === 'comparison' ? 'generated' : 'comparison')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#13131a] border border-[#1f1f28] hover:border-blue-500/30 text-white rounded-lg transition-all text-sm"
                >
                  {rightPanelMode === 'comparison' ? (
                    <>
                      <FileText size={16} />
                      View Test Cases
                    </>
                  ) : (
                    <>
                      <BarChart3 size={16} />
                      Compare Results
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Primary CTA */}
            <button
              onClick={() => setShowApiModal(true)}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-4 rounded-xl transition-colors"
            >
              <Sparkles size={20} />
              <span className="font-semibold">Generate Test Cases</span>
            </button>

            {/* API Endpoints Section */}
            <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl overflow-hidden">
              <div className="p-5 border-b border-[#1f1f28]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">API Endpoints</h3>
                  <span className="text-xs text-gray-500">{apis.length} endpoints</span>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search endpoints..."
                    value={apiSearchQuery}
                    onChange={(e) => setApiSearchQuery(e.target.value)}
                    className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/30"
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {filteredApisForBrowse.map((api) => (
                  <div
                    key={api.id}
                    onClick={() => handleApiClick(api.id)}
                    className={`p-4 border-b border-[#1f1f28] last:border-b-0 cursor-pointer transition-all ${
                      selectedApiId === api.id
                        ? 'bg-blue-500/10'
                        : 'hover:bg-[#0d0d12]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`${methodColors[api.method].bg} ${methodColors[api.method].text} ${methodColors[api.method].border} border px-2.5 py-1 rounded text-xs font-semibold font-mono`}>
                        {api.method}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="text-white font-mono text-sm mb-1">{api.path}</div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">
                            {api.domain}
                          </span>
                          <span className={`font-medium ${
                            api.coverage >= 80 ? 'text-green-400' :
                            api.coverage >= 60 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {api.coverage}% coverage
                          </span>
                          <span className="text-gray-500">{api.testCount} tests</span>
                          <span className="text-gray-600 flex items-center gap-1">
                            <Clock size={10} />
                            {api.lastUpdated}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedApiIdsForGeneration.length > 0 && (
              <>
                {/* Horizontal Condition Bar */}
                <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb size={16} className="text-purple-400" />
                    <span className="text-sm text-gray-400">
                      AI recommends context combinations based on endpoint purpose and existing coverage
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">User Role</label>
                      <select
                        multiple
                        value={selectedRoles}
                        onChange={(e) => setSelectedRoles(Array.from(e.target.selectedOptions, option => option.value))}
                        className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 h-32"
                      >
                        {userRoles.map(role => (
                          <option key={role} value={role} className="py-1">{role}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Data Variants</label>
                      <select
                        multiple
                        value={selectedDataVariants}
                        onChange={(e) => setSelectedDataVariants(Array.from(e.target.selectedOptions, option => option.value))}
                        className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 h-32"
                      >
                        {dataVariants.map(variant => (
                          <option key={variant} value={variant} className="py-1">{variant}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">State Conditions</label>
                      <select
                        multiple
                        value={selectedStates}
                        onChange={(e) => setSelectedStates(Array.from(e.target.selectedOptions, option => option.value))}
                        className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 h-32"
                      >
                        {stateConditions.map(state => (
                          <option key={state} value={state} className="py-1">{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* AI Context Summary */}
                {generatedTests.length > 0 && (
                  <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles size={18} className="text-purple-400" />
                      <h3 className="text-white font-semibold">AI Context Summary</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400 mb-1">Detected User Roles</div>
                        <div className="text-white">{selectedRoles.join(', ')}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">Edge States Identified</div>
                        <div className="text-white">{selectedStates.join(', ')}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">Input Variants</div>
                        <div className="text-white">{selectedDataVariants.join(', ')}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">Expected Generation Scope</div>
                        <div className="text-white">{generatedTests.length} test cases</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Test Matrix */}
                {generatedTests.length > 0 && (
                  <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
                    <h3 className="text-white mb-4 flex items-center gap-2">
                      <BarChart3 size={18} className="text-blue-400" />
                      Coverage Matrix
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left text-xs text-gray-500 pb-3 pr-4 font-medium">Role</th>
                            {selectedStates.flatMap(state =>
                              selectedDataVariants.map(variant => (
                                <th key={`${state}-${variant}`} className="text-center text-xs text-gray-500 pb-3 px-2 font-medium">
                                  <div className="truncate max-w-[80px]" title={`${state} / ${variant}`}>
                                    {state.slice(0, 5)}/{variant.slice(0, 5)}
                                  </div>
                                </th>
                              ))
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {matrixData.map((row) => (
                            <tr key={row.role}>
                              <td className="text-sm text-white py-2 pr-4 font-medium">{row.role}</td>
                              {row.cells.map((cell, idx) => (
                                <td key={idx} className="p-1">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                                    cell.hasGenerated ? 'bg-green-500/20 border-2 border-green-500/40' :
                                    cell.hasExisting ? 'bg-blue-500/20 border-2 border-blue-500/40' :
                                    'bg-red-500/10 border-2 border-red-500/20'
                                  }`}>
                                    {cell.hasGenerated && <Sparkles size={16} className="text-green-400" />}
                                    {!cell.hasGenerated && cell.hasExisting && <CheckCircle2 size={16} className="text-blue-400" />}
                                    {cell.isMissing && <AlertCircle size={16} className="text-red-400" />}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-6 flex items-center gap-6 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500/20 border-2 border-blue-500/40 rounded"></div>
                        <span className="text-gray-400">Existing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500/20 border-2 border-green-500/40 rounded"></div>
                        <span className="text-gray-400">AI Generated</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500/10 border-2 border-red-500/20 rounded"></div>
                        <span className="text-gray-400">Missing</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Right Side Panel */}
        {rightPanelMode !== 'hidden' && (
          <aside className="bg-[#0a0a0f] border-l border-[#1f1f28] flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-[#1f1f28] flex items-center justify-between">
              <h3 className="text-white font-semibold">
                {rightPanelMode === 'existing' && 'Existing Test Cases'}
                {rightPanelMode === 'comparison' && 'Test Comparison'}
                {rightPanelMode === 'generated' && 'Generated Test Cases'}
              </h3>
              <button
                onClick={() => setRightPanelMode('hidden')}
                className="p-1.5 hover:bg-[#1f1f28] rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {rightPanelMode === 'existing' ? (
              /* Existing Test Cases View */
              <div className="flex-1 overflow-y-auto p-5">
                {selectedApi && (
                  <div className="mb-4 p-3 bg-[#13131a] border border-[#1f1f28] rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Selected API</div>
                    <div className="flex items-center gap-2">
                      <span className={`${methodColors[selectedApi.method].bg} ${methodColors[selectedApi.method].text} ${methodColors[selectedApi.method].border} border px-2 py-0.5 rounded text-xs font-semibold font-mono`}>
                        {selectedApi.method}
                      </span>
                      <span className="text-white text-sm font-mono">{selectedApi.path}</span>
                    </div>
                  </div>
                )}

                {currentApiTests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText size={32} className="text-gray-600 mb-3" />
                    <p className="text-gray-500 text-sm">No test cases yet</p>
                    <p className="text-gray-600 text-xs mt-1">Generate tests to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentApiTests.map((test) => (
                      <div
                        key={test.id}
                        className="bg-[#13131a] border border-[#1f1f28] rounded-lg overflow-hidden"
                      >
                        <div
                          onClick={() => toggleTestEdit(test.id)}
                          className="p-4 cursor-pointer hover:bg-[#1a1a22] transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs px-2 py-1 rounded ${typeColors[test.type].bg} ${typeColors[test.type].text} ${typeColors[test.type].border} border`}>
                                  {typeColors[test.type].label}
                                </span>
                                {test.isEdited && (
                                  <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                                    Edited
                                  </span>
                                )}
                              </div>
                              <div className="text-white text-sm font-medium">{test.name}</div>
                            </div>
                            {expandedTestId === test.id ? (
                              <ChevronUp size={18} className="text-gray-400 flex-shrink-0 ml-2" />
                            ) : (
                              <ChevronDown size={18} className="text-gray-400 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </div>

                        {expandedTestId === test.id && (
                          <div className="border-t border-[#1f1f28] p-4 bg-[#0d0d12] space-y-4">
                            <div>
                              <label className="block text-xs text-gray-500 mb-2">Test Case Name</label>
                              <input
                                type="text"
                                value={test.name}
                                onChange={(e) => updateTestCase(test.id, { name: e.target.value })}
                                className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-500 mb-2">Description</label>
                              <textarea
                                value={test.description}
                                onChange={(e) => updateTestCase(test.id, { description: e.target.value })}
                                className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 resize-none"
                                rows={3}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-2">User Role</label>
                                <div className="text-white text-sm bg-[#1f1f28] rounded-lg px-3 py-2">{test.role}</div>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-2">State</label>
                                <div className="text-white text-sm bg-[#1f1f28] rounded-lg px-3 py-2">{test.stateCondition}</div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs text-gray-500 mb-2">Data Variant</label>
                              <div className="text-white text-sm bg-[#1f1f28] rounded-lg px-3 py-2">{test.dataVariant}</div>
                            </div>

                            <div>
                              <label className="block text-xs text-gray-500 mb-2">Expected Result</label>
                              <input
                                type="text"
                                value={test.expectedResult}
                                onChange={(e) => updateTestCase(test.id, { expectedResult: e.target.value })}
                                className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30"
                              />
                            </div>

                            {test.requestPreview && (
                              <div>
                                <label className="block text-xs text-gray-500 mb-2">Request Preview</label>
                                <pre className="bg-[#1f1f28] rounded-lg px-3 py-2 text-white text-xs font-mono overflow-x-auto">
                                  {test.requestPreview}
                                </pre>
                              </div>
                            )}

                            {test.validationRules && test.validationRules.length > 0 && (
                              <div>
                                <label className="block text-xs text-gray-500 mb-2">Validation Rules</label>
                                <div className="space-y-1">
                                  {test.validationRules.map((rule, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                                      <CheckCircle2 size={12} className="text-green-400" />
                                      {rule}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : rightPanelMode === 'comparison' ? (
              /* Comparison View */
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-1">Current Coverage</div>
                    <div className="text-2xl text-white font-semibold">{currentCoverage}%</div>
                  </div>
                  <div className="bg-[#13131a] border border-green-500/20 rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-1">After Generation</div>
                    <div className="text-2xl text-green-400 font-semibold">{projectedCoverage}%</div>
                  </div>
                </div>

                <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Existing Tests</span>
                    <span className="text-white font-semibold">{existingCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-gray-400">New Tests</span>
                    </div>
                    <span className="text-green-400 font-semibold">{newCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-sm text-gray-400">Duplicates</span>
                    </div>
                    <span className="text-yellow-400 font-semibold">{duplicateCount}</span>
                  </div>
                </div>

                <button
                  onClick={handleRunGeneratedTests}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  <Play size={18} />
                  Run Generated Tests
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              /* Generated Test Cases View */
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {generatedTests.map((test) => (
                  <div
                    key={test.id}
                    className="bg-[#13131a] border border-[#1f1f28] rounded-lg overflow-hidden"
                  >
                    <div
                      onClick={() => toggleTestEdit(test.id)}
                      className="p-4 cursor-pointer hover:bg-[#1a1a22] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded ${typeColors[test.type].bg} ${typeColors[test.type].text} ${typeColors[test.type].border} border`}>
                              {typeColors[test.type].label}
                            </span>
                            {test.status === 'new' && (
                              <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded">
                                New
                              </span>
                            )}
                            {test.isEdited && (
                              <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                                Edited
                              </span>
                            )}
                          </div>
                          <div className="text-white text-sm font-medium">{test.name}</div>
                        </div>
                        {expandedTestId === test.id ? (
                          <ChevronUp size={18} className="text-gray-400 flex-shrink-0 ml-2" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-400 flex-shrink-0 ml-2" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        API: {apis.find(a => a.id === test.apiId)?.path}
                      </div>
                    </div>

                    {expandedTestId === test.id && (
                      <div className="border-t border-[#1f1f28] p-4 bg-[#0d0d12] space-y-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-2">Test Case Name</label>
                          <input
                            type="text"
                            value={test.name}
                            onChange={(e) => updateTestCase(test.id, { name: e.target.value })}
                            className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 mb-2">Description</label>
                          <textarea
                            value={test.description}
                            onChange={(e) => updateTestCase(test.id, { description: e.target.value })}
                            className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 resize-none"
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-2">User Role</label>
                            <div className="text-white text-sm bg-[#1f1f28] rounded-lg px-3 py-2">{test.role}</div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-2">State</label>
                            <div className="text-white text-sm bg-[#1f1f28] rounded-lg px-3 py-2">{test.stateCondition}</div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 mb-2">Data Variant</label>
                          <div className="text-white text-sm bg-[#1f1f28] rounded-lg px-3 py-2">{test.dataVariant}</div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 mb-2">Expected Result</label>
                          <input
                            type="text"
                            value={test.expectedResult}
                            onChange={(e) => updateTestCase(test.id, { expectedResult: e.target.value })}
                            className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30"
                          />
                        </div>

                        {test.requestPreview && (
                          <div>
                            <label className="block text-xs text-gray-500 mb-2">Request Preview</label>
                            <pre className="bg-[#1f1f28] rounded-lg px-3 py-2 text-white text-xs font-mono overflow-x-auto">
                              {test.requestPreview}
                            </pre>
                          </div>
                        )}

                        {test.validationRules && test.validationRules.length > 0 && (
                          <div>
                            <label className="block text-xs text-gray-500 mb-2">Validation Rules</label>
                            <div className="space-y-1">
                              {test.validationRules.map((rule, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                                  <CheckCircle2 size={12} className="text-green-400" />
                                  {rule}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
