import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Play,
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  X,
  Search,
  Sparkles,
  TrendingUp,
  Shield,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  Clock,
  Zap
} from 'lucide-react';
import {
  flowOpsApi,
  getDefaultAppId,
  type ApiInventoryResponse,
  type EnvironmentResponse,
  type ScenarioDetailResponse,
} from '../api/flowOpsClient';

interface ScenarioTemplate {
  id: string;
  title: string;
  description: string;
  type: 'happy-path' | 'edge-case' | 'failure-recovery';
  reason: string;
  reasonType: 'critical' | 'risk' | 'coverage';
  steps: ScenarioStep[];
  isSelected?: boolean;
  lastUpdated?: string;
}

interface ScenarioStep {
  id: string;
  order: number;
  label: string;
  apiEndpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requestConfig?: string;
  extractedVars: ExtractedVariable[];
  validationRules?: string[];
  stopOnFail: boolean;
}

interface ExtractedVariable {
  id: string;
  name: string;
  jsonPath: string;
}

const methodColors = {
  GET: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  POST: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  PUT: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  DELETE: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  PATCH: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

const typeColors = {
  'happy-path': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', label: 'Happy Path', icon: CheckCircle2 },
  'edge-case': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', label: 'Edge Case', icon: AlertCircle },
  'failure-recovery': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', label: 'Failure Recovery', icon: Shield },
};

const reasonColors = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: TrendingUp },
  risk: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', icon: AlertTriangle },
  coverage: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: AlertCircle },
};

const RECOMMENDATION_DELAY_MS = 2000;

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

const toScenarioMethod = (method: ApiInventoryResponse['method']): ScenarioStep['method'] =>
  (method === 'TRACE' || method === 'OPTIONS' || method === 'HEAD' ? 'GET' : method) as ScenarioStep['method'];

const createStep = (
  id: string,
  order: number,
  label: string,
  method: ScenarioStep['method'],
  apiEndpoint: string,
  options: Partial<ScenarioStep> = {},
): ScenarioStep => ({
  id,
  order,
  label,
  method,
  apiEndpoint,
  extractedVars: [],
  validationRules: ['Status code validation', 'Response schema check'],
  stopOnFail: order === 1,
  ...options,
});


const findApi = (items: ApiInventoryResponse[], ...keywords: string[]) =>
  items.find((api) => {
    const haystack = `${api.method} ${api.endpointPath} ${api.operationId || ''} ${api.domainTag || ''}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  });

const buildScenariosFromApis = (items: ApiInventoryResponse[]): ScenarioTemplate[] => {
  if (items.length < 2) return [];

  const login = findApi(items, 'login', 'auth');
  const user = findApi(items, 'user', 'profile');
  const cart = findApi(items, 'cart');
  const order = findApi(items, 'order');
  const payment = findApi(items, 'payment');
  const product = findApi(items, 'product', 'item');

  const checkoutApis = [cart, product, payment, order].filter(Boolean) as ApiInventoryResponse[];
  const authApis = [login, user].filter(Boolean) as ApiInventoryResponse[];
  const fallbackApis = items.slice(0, 4);

  const createApiSteps = (apis: ApiInventoryResponse[], prefix: string) =>
    apis.map((api, index) =>
      createStep(
        `${prefix}-${api.id}`,
        index + 1,
        api.operationId || `${api.method} ${api.endpointPath}`,
        toScenarioMethod(api.method),
        api.endpointPath,
        {
          extractedVars: index === 0 ? [{ id: `${prefix}-id`, name: 'resourceId', jsonPath: '$.id' }] : [],
          validationRules: ['Status code validation', 'Response schema check', index > 0 ? 'Uses variables from previous step' : 'Extracts reusable response data'],
        },
      ),
    );

  const recommended = [
    checkoutApis.length >= 3 && {
      id: 'recommend-inventory-checkout-flow',
      title: 'Checkout Scenario - Happy Path',
      description: 'Create a cart, add an item, and submit an order as one end-to-end customer flow.',
      type: 'happy-path' as const,
      reason: 'Critical revenue journey spans cart, inventory, and payment APIs',
      reasonType: 'critical' as const,
      lastUpdated: formatRelativeTime(checkoutApis[0].updatedAt || checkoutApis[0].createdAt),
      steps: createApiSteps(checkoutApis, 'inventory-checkout'),
    },
    authApis.length >= 2 && {
      id: 'recommend-auth-inventory-flow',
      title: 'Authentication and Profile Flow',
      description: 'Login and access the user profile in sequence.',
      type: 'happy-path' as const,
      reason: 'Token propagation and user state changes should be tested across dependent APIs',
      reasonType: 'coverage' as const,
      lastUpdated: formatRelativeTime(authApis[0].updatedAt || authApis[0].createdAt),
      steps: createApiSteps(authApis, 'auth-inventory'),
    },
    {
      id: 'recommend-cross-api-regression',
      title: 'Cross-API Regression Scenario',
      description: 'Chain multiple discovered APIs to verify shared state, variable extraction, and dependent response contracts.',
      type: 'edge-case' as const,
      reason: 'Generated from backend API inventory to cover endpoints together instead of in isolation',
      reasonType: 'coverage' as const,
      lastUpdated: formatRelativeTime(fallbackApis[0]?.updatedAt || fallbackApis[0]?.createdAt),
      steps: createApiSteps(fallbackApis, 'cross-api'),
    },
  ].filter(Boolean) as ScenarioTemplate[];

  return recommended.slice(0, 4);
};

const normalizeScenarioDetail = (scenario: ScenarioDetailResponse): ScenarioTemplate => ({
  id: String(scenario.id),
  title: scenario.name,
  description: scenario.description || 'Saved scenario from backend',
  type:
    scenario.type === 'EDGE_CASE'
      ? 'edge-case'
      : scenario.type === 'FAILURE_RECOVERY'
      ? 'failure-recovery'
      : 'happy-path',
  reason: 'Saved scenario',
  reasonType: 'coverage',
  lastUpdated: formatRelativeTime(scenario.updatedAt || scenario.createdAt),
  steps: (scenario.steps || []).map((step, index) =>
    createStep(
      String(step.id),
      step.stepOrder || index + 1,
      step.label || step.endpoint?.path || `Step ${index + 1}`,
      toScenarioMethod(step.endpoint?.method || 'GET'),
      step.endpoint?.path || 'Unlinked API',
      {
        requestConfig: step.requestConfig,
        validationRules: step.validationRules ? [step.validationRules] : [],
      },
    ),
  ),
});

export function ScenarioBuilderPage() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<ScenarioTemplate[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiScenarios, setAiScenarios] = useState<ScenarioTemplate[]>([]);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [environments, setEnvironments] = useState<EnvironmentResponse[]>([]);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('all');
  const [customScenarioInput, setCustomScenarioInput] = useState('');
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);

  const selectedScenario = selectedScenarioId ? scenarios.find(s => s.id === selectedScenarioId) : null;

  useEffect(() => {
    let active = true;
    Promise.all([
      flowOpsApi.ensureProject(),
      flowOpsApi.listEnvironments(getDefaultAppId()).catch(() => [] as EnvironmentResponse[]),
    ])
      .then(([project, items]) => {
        if (!active) return;
        setProjectId(project.id);
        setEnvironments(items);
        if (items.length > 0 && selectedEnvironmentId === 'all') {
          setSelectedEnvironmentId(String(items[0].id));
        }
      })
      .catch((error) => {
        if (!active) return;
        setProjectId(null);
        setEnvironments([]);
        setApiError(error instanceof Error ? `${error.message} Showing demo scenario recommendations.` : 'Failed to load environments.');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const selectedEnvironment =
      selectedEnvironmentId === 'all'
        ? null
        : environments.find((environment) => String(environment.id) === selectedEnvironmentId) || null;

    if (!projectId) {
      setScenarios([]);
      setAiScenarios([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const params = selectedEnvironment
      ? {
          repositoryId: selectedEnvironment.repositoryId,
          branchName: selectedEnvironment.branchName,
        }
      : {};

    flowOpsApi
      .listInventories(projectId, params)
      .then(async (inventory) => {
        if (!active) return;
        const environmentApiIds = new Set(inventory.items.map((item) => item.id));
        const summaries = await flowOpsApi.listScenarios(getDefaultAppId()).catch(() => []);
        const details = await Promise.all(
          summaries.map((summary) => flowOpsApi.getScenario(summary.id).catch(() => null)),
        );
        const filteredDetails = details.filter((scenario): scenario is ScenarioDetailResponse => {
          if (!scenario) return false;
          if (!selectedEnvironment) return true;
          return (scenario.steps || []).some((step) => step.apiId && environmentApiIds.has(step.apiId));
        });

        setScenarios(filteredDetails.map(normalizeScenarioDetail));
        setAiScenarios(buildScenariosFromApis(inventory.items));
        setApiError(null);
      })
      .catch((error) => {
        if (!active) return;
        setScenarios([]);
        setAiScenarios([]);
        setApiError(error instanceof Error ? error.message : 'Failed to load scenarios.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [environments, projectId, selectedEnvironmentId]);

  useEffect(() => {
    if (!showAiModal) {
      setIsRecommendationLoading(false);
      return;
    }

    setIsRecommendationLoading(true);
    const timerId = setTimeout(() => {
      setIsRecommendationLoading(false);
    }, RECOMMENDATION_DELAY_MS);

    return () => clearTimeout(timerId);
  }, [showAiModal]);

  const filteredScenarios = scenarios.filter(scenario =>
    scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scenario.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleScenarioSelection = (scenarioId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedScenarioIds(prev =>
      prev.includes(scenarioId) ? prev.filter(id => id !== scenarioId) : [...prev, scenarioId]
    );
  };

  const handleSelectScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
  };

  const handleOpenRecommendations = () => {
    setShowAiModal(true);
  };

  const handleAiGenerateConfirm = () => {
    if (isRecommendationLoading) return;
    const selectedAiScenarios = aiScenarios.filter(s => s.isSelected);
    const savedScenarios = selectedAiScenarios.map((scenario, scenarioIndex) => {
      const savedId = `saved-${scenario.id}-${Date.now()}-${scenarioIndex}`;
      return {
        ...scenario,
        id: savedId,
        isSelected: false,
        lastUpdated: 'Just now',
        steps: scenario.steps.map((step, stepIndex) => ({
          ...step,
          id: `${savedId}-step-${stepIndex + 1}`,
          order: stepIndex + 1,
        })),
      };
    });
    setScenarios([...scenarios, ...savedScenarios]);
    if (savedScenarios[0]) {
      setSelectedScenarioId(savedScenarios[0].id);
    }
    setShowAiModal(false);
    setAiScenarios(aiScenarios.map(s => ({ ...s, isSelected: false })));
  };

  const toggleAiScenarioSelection = (scenarioId: string) => {
    setAiScenarios(prev =>
      prev.map(s => s.id === scenarioId ? { ...s, isSelected: !s.isSelected } : s)
    );
  };

  const handleAiCustomScenarioCreate = () => {
    if (!customScenarioInput.trim()) return;
    const newScenario: ScenarioTemplate = {
      id: `custom-${Date.now()}`,
      title: 'Custom Scenario',
      description: customScenarioInput,
      type: 'happy-path',
      reason: 'Custom user-defined scenario',
      reasonType: 'coverage',
      lastUpdated: 'Just now',
      steps: [],
    };
    setScenarios([...scenarios, newScenario]);
    setSelectedScenarioId(newScenario.id);
    setShowAiModal(false);
    setCustomScenarioInput('');
  };

  const handleManualScenarioCreate = () => {
    const newScenario: ScenarioTemplate = {
      id: `manual-${Date.now()}`,
      title: 'Untitled Manual Scenario',
      description: 'Build this scenario manually by adding and editing steps.',
      type: 'happy-path',
      reason: 'Manual scenario',
      reasonType: 'coverage',
      lastUpdated: 'Just now',
      steps: [],
    };
    setScenarios([...scenarios, newScenario]);
    setSelectedScenarioId(newScenario.id);
  };

  const handleRunScenario = (scenarioId: string) => {
    navigate('/execution/run', { state: { scenarioId } });
  };

  const handleRunSelected = () => {
    if (selectedScenarioIds.length > 0) {
      navigate('/execution/run', { state: { scenarioIds: selectedScenarioIds } });
    }
  };

  const updateScenario = (updates: Partial<ScenarioTemplate>) => {
    if (!selectedScenarioId) return;
    setScenarios(prev =>
      prev.map(s => s.id === selectedScenarioId ? { ...s, ...updates } : s)
    );
  };

  const addStep = () => {
    if (!selectedScenario) return;
    const newStep: ScenarioStep = {
      id: `step-${Date.now()}`,
      order: selectedScenario.steps.length + 1,
      label: 'New Step',
      apiEndpoint: '/api/v1/',
      method: 'GET',
      extractedVars: [],
      stopOnFail: false,
    };
    updateScenario({ steps: [...selectedScenario.steps, newStep] });
  };

  const deleteStep = (stepId: string) => {
    if (!selectedScenario) return;
    updateScenario({
      steps: selectedScenario.steps
        .filter(s => s.id !== stepId)
        .map((s, idx) => ({ ...s, order: idx + 1 }))
    });
  };

  const updateStep = (stepId: string, updates: Partial<ScenarioStep>) => {
    if (!selectedScenario) return;
    updateScenario({
      steps: selectedScenario.steps.map(s => s.id === stepId ? { ...s, ...updates } : s)
    });
  };

  const handleDragStart = (stepId: string) => {
    setDraggedStepId(stepId);
  };

  const handleDragOver = (e: React.DragEvent, targetStepId: string) => {
    e.preventDefault();
    if (!draggedStepId || !selectedScenario || draggedStepId === targetStepId) return;

    const draggedIdx = selectedScenario.steps.findIndex(s => s.id === draggedStepId);
    const targetIdx = selectedScenario.steps.findIndex(s => s.id === targetStepId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const newSteps = [...selectedScenario.steps];
    const [draggedStep] = newSteps.splice(draggedIdx, 1);
    newSteps.splice(targetIdx, 0, draggedStep);

    updateScenario({
      steps: newSteps.map((s, idx) => ({ ...s, order: idx + 1 }))
    });
  };

  const handleDragEnd = () => {
    setDraggedStepId(null);
  };

  return (
    <div className="responsive-detail-grid relative flex-1 overflow-hidden bg-[#060609] grid" style={{ gridTemplateColumns: '1fr' }}>
      {/* AI Generate Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-[#1f1f28] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles size={24} className="text-purple-400" />
                <h2 className="text-white text-xl font-semibold">AI-Recommended Scenarios</h2>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-2 hover:bg-[#1f1f28] rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <div className="bg-[#13131a] border border-[#1f1f28] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={18} className="text-purple-400" />
                  <h3 className="text-white font-semibold">Generate From Custom Prompt</h3>
                </div>
                <label className="block text-sm text-gray-400 mb-3">
                  Describe your scenario in natural language
                </label>
                <textarea
                  value={customScenarioInput}
                  onChange={(e) => setCustomScenarioInput(e.target.value)}
                  placeholder="E.g., Test user registration flow with email verification and profile setup..."
                  className="w-full bg-[#0a0a0f] border border-[#1f1f28] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/30 resize-none"
                  rows={4}
                />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleAiCustomScenarioCreate}
                    disabled={!customScenarioInput.trim()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <Sparkles size={16} />
                    Generate Custom Scenario
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-500 uppercase tracking-wider pt-2">Recommended Scenarios</div>

              {isRecommendationLoading && (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-[#1f1f28] bg-[#13131a] px-6 py-10 text-center">
                  <Sparkles size={32} className="mb-4 animate-pulse text-purple-400" />
                  <h3 className="mb-2 text-white font-semibold">Analyzing connected API flows</h3>
                  <p className="max-w-md text-sm text-gray-500">
                    Finding multi-step scenarios across authentication, cart, payment, and order APIs.
                  </p>
                </div>
              )}

              {!isRecommendationLoading && aiScenarios.map((scenario) => {
                const TypeIcon = typeColors[scenario.type].icon;
                const ReasonIcon = reasonColors[scenario.reasonType].icon;
                return (
                  <div
                    key={scenario.id}
                    onClick={() => toggleAiScenarioSelection(scenario.id)}
                    className={`p-5 rounded-xl border cursor-pointer transition-all ${
                      scenario.isSelected
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-[#13131a] border-[#1f1f28] hover:border-[#2f2f38]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                        scenario.isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-500'
                      }`}>
                        {scenario.isSelected && <Check size={14} className="text-white" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-white font-semibold">{scenario.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${typeColors[scenario.type].bg} ${typeColors[scenario.type].text} ${typeColors[scenario.type].border} border`}>
                            <TypeIcon size={12} />
                            {typeColors[scenario.type].label}
                          </span>
                          <span className="text-xs text-gray-500">{scenario.steps.length} steps</span>
                        </div>

                        <p className="text-sm text-gray-400 mb-3">{scenario.description}</p>

                        <div className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${reasonColors[scenario.reasonType].bg} ${reasonColors[scenario.reasonType].text} ${reasonColors[scenario.reasonType].border} border`}>
                          <ReasonIcon size={14} />
                          {scenario.reason}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-[#1f1f28] flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {aiScenarios.filter(s => s.isSelected).length} scenario{aiScenarios.filter(s => s.isSelected).length !== 1 ? 's' : ''} selected
              </div>
              <button
                onClick={handleAiGenerateConfirm}
                disabled={isRecommendationLoading || aiScenarios.filter(s => s.isSelected).length === 0}
                className="scenario-ai-action flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
                Add Selected Scenarios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Panel: Scenario List */}
      <main className="flex flex-col overflow-hidden bg-[#060609]">
        {/* Header */}
        <div className="bg-[#0a0a0f] border-b border-[#1f1f28] px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="responsive-header flex items-center justify-between mb-6">
            <div>
              <h1 className="text-white text-2xl font-semibold mb-1">Scenario Builder</h1>
              <p className="text-gray-500 text-sm">AI-powered multi-step API scenario testing</p>
            </div>

            {selectedScenarioIds.length > 0 && (
              <button
                onClick={handleRunSelected}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors"
              >
                <Play size={18} />
                Run Selected ({selectedScenarioIds.length})
              </button>
            )}
          </div>

          {/* Top Actions */}
          <div className="responsive-filters flex items-center gap-3 mb-4">
            <select
              value={selectedEnvironmentId}
              onChange={(e) => setSelectedEnvironmentId(e.target.value)}
              className="bg-[#13131a] border border-[#1f1f28] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/30"
            >
              <option value="all">All Environments</option>
              {environments.map((environment) => (
                <option key={environment.id} value={String(environment.id)}>
                  {environment.name}
                  {environment.branchName ? ` (${environment.branchName})` : ''}
                </option>
              ))}
            </select>

            <button
              onClick={handleOpenRecommendations}
              className="scenario-ai-action flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
            >
              <Sparkles size={20} />
              Generate Scenarios (AI)
            </button>

            <button
              onClick={handleManualScenarioCreate}
              className="flex items-center gap-2 bg-[#13131a] border border-[#1f1f28] hover:border-blue-500/30 text-white px-6 py-3 rounded-lg transition-all"
            >
              <Plus size={20} />
              Manual Scenario
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/30"
            />
          </div>
        </div>

        {/* Scenario List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="space-y-2">
            {filteredScenarios.length === 0 && (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-[#1f1f28] bg-[#0a0a0f] px-6 py-12 text-center">
                <Sparkles size={32} className="mb-3 text-purple-400" />
                <h3 className="mb-2 text-white font-semibold">No saved scenarios yet</h3>
                <p className="mb-5 max-w-md text-sm text-gray-500">
                  Add an AI-recommended scenario to save a multi-step API flow in Builder.
                </p>
                <button
                  type="button"
                  onClick={handleOpenRecommendations}
                  className="scenario-ai-action flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:from-purple-700 hover:to-blue-700"
                >
                  <Sparkles size={16} />
                  Open Recommendations
                </button>
              </div>
            )}
            {filteredScenarios.map((scenario) => {
              const TypeIcon = typeColors[scenario.type].icon;
              const ReasonIcon = reasonColors[scenario.reasonType].icon;
              return (
                <div
                  key={scenario.id}
                  onClick={() => handleSelectScenario(scenario.id)}
                  className={`scenario-list-card group bg-[#0a0a0f] border rounded-xl p-5 cursor-pointer transition-all hover:border-blue-500/30 ${
                    selectedScenarioId === scenario.id ? 'border-blue-500/50 bg-blue-500/5' : 'border-[#1f1f28]'
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    {/* Checkbox */}
                    <div
                      onClick={(e) => toggleScenarioSelection(scenario.id, e)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedScenarioIds.includes(scenario.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-500 hover:border-blue-500'
                      }`}
                    >
                      {selectedScenarioIds.includes(scenario.id) && <Check size={14} className="text-white" />}
                    </div>

                    {/* Scenario Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-white font-semibold">{scenario.title}</h3>
                        <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 ${typeColors[scenario.type].bg} ${typeColors[scenario.type].text} ${typeColors[scenario.type].border} border`}>
                          <TypeIcon size={12} />
                          {typeColors[scenario.type].label}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Zap size={12} />
                          {scenario.steps.length} steps
                        </span>
                      </div>

                      <p className="text-sm text-gray-400 mb-3">{scenario.description}</p>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded ${reasonColors[scenario.reasonType].bg} ${reasonColors[scenario.reasonType].text} ${reasonColors[scenario.reasonType].border} border`}>
                          <ReasonIcon size={12} />
                          {scenario.reason}
                        </div>
                        {scenario.lastUpdated && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={12} />
                            {scenario.lastUpdated}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunScenario(scenario.id);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <Play size={14} />
                        Run
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Right Panel: Scenario Detail */}
      {selectedScenarioId && selectedScenario && (
        <aside className="absolute inset-0 z-20 bg-[#0a0a0f] flex flex-col h-full overflow-hidden shadow-2xl shadow-black/40 xl:left-auto xl:w-1/2 xl:border-l xl:border-[#1f1f28]">
          {/* Header */}
          <div className="p-6 border-b border-[#1f1f28]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedScenarioId(null)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#1f1f28] bg-[#13131a] text-gray-400 transition-colors hover:border-blue-500/30 hover:text-white"
                  title="Back to scenarios"
                  aria-label="Back to scenarios"
                >
                  <ArrowLeft size={18} />
                </button>
                <input
                  type="text"
                  value={selectedScenario.title}
                  onChange={(e) => updateScenario({ title: e.target.value })}
                className="min-w-0 text-white text-xl font-semibold bg-transparent border-b border-transparent hover:border-[#1f1f28] focus:border-blue-500/30 focus:outline-none px-2 -mx-2"
                />
                <Edit3 size={16} className="text-gray-500" />
              </div>
              <button
                onClick={() => setSelectedScenarioId(null)}
                className="hidden p-2 hover:bg-[#1f1f28] rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedScenario.type}
                onChange={(e) => updateScenario({ type: e.target.value as any })}
                className="bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30"
              >
                <option value="happy-path">Happy Path</option>
                <option value="edge-case">Edge Case</option>
                <option value="failure-recovery">Failure Recovery</option>
              </select>

              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Zap size={14} />
                {selectedScenario.steps.length} steps
              </div>

              <div className="flex items-center gap-1.5 text-xs text-green-400 ml-auto">
                <Save size={12} />
                Auto-saved
              </div>
            </div>
          </div>

          {/* Execution Flow */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-4">
              <h3 className="text-white text-sm font-semibold mb-3">Execution Flow</h3>
              <p className="text-xs text-gray-500 mb-4">Drag to reorder steps</p>
            </div>

            <div className="space-y-3 relative">
              {selectedScenario.steps.map((step, index) => (
                <div key={step.id}>
                  <div
                    draggable
                    onDragStart={() => handleDragStart(step.id)}
                    onDragOver={(e) => handleDragOver(e, step.id)}
                    onDragEnd={handleDragEnd}
                    className={`bg-[#13131a] border border-[#1f1f28] rounded-lg overflow-hidden transition-all ${
                      draggedStepId === step.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="p-4 cursor-move hover:bg-[#1a1a22] transition-colors">
                      <div className="flex items-center gap-3">
                        <GripVertical size={16} className="text-gray-500 flex-shrink-0" />

                        <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-400 text-sm font-semibold">{step.order}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded font-mono ${methodColors[step.method].bg} ${methodColors[step.method].text} ${methodColors[step.method].border} border`}>
                              {step.method}
                            </span>
                            <span className="text-white text-sm font-medium">{step.label}</span>
                          </div>
                          <div className="text-xs text-gray-500 font-mono truncate">{step.apiEndpoint}</div>
                        </div>

                        <button
                          onClick={() => setExpandedStepId(expandedStepId === step.id ? null : step.id)}
                          className="p-1.5 hover:bg-[#1f1f28] rounded text-gray-400 hover:text-white transition-colors flex-shrink-0"
                        >
                          {expandedStepId === step.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        <button
                          onClick={() => deleteStep(step.id)}
                          className="p-1.5 hover:bg-red-500/10 rounded text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Step Editor */}
                    {expandedStepId === step.id && (
                      <div className="border-t border-[#1f1f28] p-4 bg-[#0d0d12] space-y-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-2">Label</label>
                          <input
                            type="text"
                            value={step.label}
                            onChange={(e) => updateStep(step.id, { label: e.target.value })}
                            className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-2">Method</label>
                            <select
                              value={step.method}
                              onChange={(e) => updateStep(step.id, { method: e.target.value as any })}
                              className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30"
                            >
                              <option value="GET">GET</option>
                              <option value="POST">POST</option>
                              <option value="PUT">PUT</option>
                              <option value="DELETE">DELETE</option>
                              <option value="PATCH">PATCH</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-500 mb-2">Stop on Fail</label>
                            <div className="flex items-center h-full">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={step.stopOnFail}
                                  onChange={(e) => updateStep(step.id, { stopOnFail: e.target.checked })}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-[#1f1f28] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 mb-2">API Endpoint</label>
                          <input
                            type="text"
                            value={step.apiEndpoint}
                            onChange={(e) => updateStep(step.id, { apiEndpoint: e.target.value })}
                            className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-blue-500/30"
                          />
                        </div>

                        {step.requestConfig && (
                          <div>
                            <label className="block text-xs text-gray-500 mb-2">Request Config</label>
                            <textarea
                              value={step.requestConfig}
                              onChange={(e) => updateStep(step.id, { requestConfig: e.target.value })}
                              className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-blue-500/30 resize-none"
                              rows={4}
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs text-gray-500 mb-2">Extract Variables</label>
                          <div className="space-y-2">
                            {step.extractedVars.map((v) => (
                              <div key={v.id} className="flex items-center gap-2 text-xs">
                                <span className="text-white font-mono">{v.name}</span>
                                <span className="text-gray-500">-</span>
                                <span className="text-gray-400 font-mono">{v.jsonPath}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {step.validationRules && step.validationRules.length > 0 && (
                          <div>
                            <label className="block text-xs text-gray-500 mb-2">Validation Rules</label>
                            <div className="space-y-1">
                              {step.validationRules.map((rule, idx) => (
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

                  {/* Connector Line */}
                  {index < selectedScenario.steps.length - 1 && (
                    <div className="flex items-center justify-center py-2">
                      <div className="w-px h-8 bg-gradient-to-b from-blue-500/50 to-blue-500/20"></div>
                    </div>
                  )}

                  {/* Add Step Button */}
                  {index < selectedScenario.steps.length - 1 && (
                    <div className="flex items-center justify-center -my-1 relative z-10">
                      <button
                        onClick={addStep}
                        className="flex items-center gap-1 px-3 py-1 bg-[#13131a] border border-[#1f1f28] hover:border-blue-500/30 text-gray-400 hover:text-white rounded-full transition-all text-xs"
                      >
                        <Plus size={12} />
                        Add Step
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add First/Last Step */}
            <div className="mt-4">
              <button
                onClick={addStep}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#13131a] border border-[#1f1f28] hover:border-blue-500/30 text-gray-400 hover:text-white rounded-lg transition-all"
              >
                <Plus size={16} />
                Add Step
              </button>
            </div>
          </div>

          {/* Run Action */}
          <div className="p-6 border-t border-[#1f1f28]">
            <button
              onClick={() => handleRunScenario(selectedScenario.id)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
            >
              <Play size={20} />
              Run Scenario
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

