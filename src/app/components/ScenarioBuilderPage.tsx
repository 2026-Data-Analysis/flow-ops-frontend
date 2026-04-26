import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Play,
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

const recommendedScenarios: ScenarioTemplate[] = [
  {
    id: '1',
    title: 'User Authentication Flow',
    description: 'Complete user login and profile fetch workflow',
    type: 'happy-path',
    reason: 'Critical path - Most common user entry point',
    reasonType: 'critical',
    lastUpdated: '2 hours ago',
    steps: [
      {
        id: 's1',
        order: 1,
        label: 'Login',
        apiEndpoint: '/api/v1/auth/login',
        method: 'POST',
        requestConfig: '{\n  "username": "{{username}}",\n  "password": "{{password}}"\n}',
        extractedVars: [
          { id: 'v1', name: 'authToken', jsonPath: 'data.token' },
          { id: 'v2', name: 'userId', jsonPath: 'data.user.id' },
        ],
        validationRules: ['Status code 200', 'Token exists', 'User ID exists'],
        stopOnFail: true,
      },
      {
        id: 's2',
        order: 2,
        label: 'Get User Profile',
        apiEndpoint: '/api/v1/users/{{userId}}',
        method: 'GET',
        extractedVars: [],
        validationRules: ['Status code 200', 'Profile data structure valid'],
        stopOnFail: false,
      },
    ],
  },
  {
    id: '2',
    title: 'Post Creation with Authentication',
    description: 'Login → Create post → Verify post exists',
    type: 'happy-path',
    reason: 'Critical path - Core content creation workflow',
    reasonType: 'critical',
    lastUpdated: '5 hours ago',
    steps: [
      {
        id: 's3',
        order: 1,
        label: 'Login',
        apiEndpoint: '/api/v1/auth/login',
        method: 'POST',
        extractedVars: [
          { id: 'v3', name: 'authToken', jsonPath: 'data.token' },
        ],
        stopOnFail: true,
      },
      {
        id: 's4',
        order: 2,
        label: 'Create Post',
        apiEndpoint: '/api/v1/posts',
        method: 'POST',
        extractedVars: [
          { id: 'v4', name: 'postId', jsonPath: 'data.id' },
        ],
        stopOnFail: true,
      },
      {
        id: 's5',
        order: 3,
        label: 'Verify Post',
        apiEndpoint: '/api/v1/posts/{{postId}}',
        method: 'GET',
        extractedVars: [],
        stopOnFail: false,
      },
    ],
  },
  {
    id: '3',
    title: 'Token Expiration Handling',
    description: 'Simulate expired token and automatic refresh',
    type: 'edge-case',
    reason: 'High failure risk - Token management issues common',
    reasonType: 'risk',
    lastUpdated: '1 day ago',
    steps: [
      {
        id: 's6',
        order: 1,
        label: 'Login',
        apiEndpoint: '/api/v1/auth/login',
        method: 'POST',
        extractedVars: [
          { id: 'v5', name: 'authToken', jsonPath: 'data.token' },
        ],
        stopOnFail: true,
      },
      {
        id: 's7',
        order: 2,
        label: 'Wait for Expiration',
        apiEndpoint: '/api/v1/wait',
        method: 'GET',
        extractedVars: [],
        stopOnFail: false,
      },
      {
        id: 's8',
        order: 3,
        label: 'Access Protected Resource',
        apiEndpoint: '/api/v1/users/profile',
        method: 'GET',
        extractedVars: [],
        stopOnFail: false,
      },
    ],
  },
  {
    id: '4',
    title: 'API Rate Limit Recovery',
    description: 'Test rate limit response and retry logic',
    type: 'failure-recovery',
    reason: 'Missing coverage - Rate limiting not tested',
    reasonType: 'coverage',
    lastUpdated: '3 days ago',
    steps: [
      {
        id: 's9',
        order: 1,
        label: 'Trigger Rate Limit',
        apiEndpoint: '/api/v1/posts',
        method: 'GET',
        extractedVars: [],
        stopOnFail: false,
      },
      {
        id: 's10',
        order: 2,
        label: 'Verify 429 Response',
        apiEndpoint: '/api/v1/posts',
        method: 'GET',
        extractedVars: [],
        stopOnFail: false,
      },
      {
        id: 's11',
        order: 3,
        label: 'Wait and Retry',
        apiEndpoint: '/api/v1/posts',
        method: 'GET',
        extractedVars: [],
        stopOnFail: false,
      },
    ],
  },
];

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

export function ScenarioBuilderPage() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<ScenarioTemplate[]>(recommendedScenarios);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiScenarios, setAiScenarios] = useState<ScenarioTemplate[]>(recommendedScenarios);
  const [customScenarioInput, setCustomScenarioInput] = useState('');
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);

  const selectedScenario = selectedScenarioId ? scenarios.find(s => s.id === selectedScenarioId) : null;

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

  const handleAiGenerateConfirm = () => {
    const selectedAiScenarios = aiScenarios.filter(s => s.isSelected);
    setScenarios([...scenarios, ...selectedAiScenarios.map(s => ({ ...s, isSelected: false }))]);
    setShowAiModal(false);
    setAiScenarios(aiScenarios.map(s => ({ ...s, isSelected: false })));
  };

  const toggleAiScenarioSelection = (scenarioId: string) => {
    setAiScenarios(prev =>
      prev.map(s => s.id === scenarioId ? { ...s, isSelected: !s.isSelected } : s)
    );
  };

  const handleCustomScenarioCreate = () => {
    // In real app, this would call AI to generate scenario from natural language
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
    setShowCustomModal(false);
    setCustomScenarioInput('');
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
    <div className="flex-1 overflow-hidden bg-[#060609] grid" style={{ gridTemplateColumns: selectedScenarioId ? '1fr 600px' : '1fr' }}>
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
              {aiScenarios.map((scenario) => {
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
                disabled={aiScenarios.filter(s => s.isSelected).length === 0}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
                Add Selected Scenarios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scenario Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl w-full max-w-2xl">
            <div className="p-6 border-b border-[#1f1f28] flex items-center justify-between">
              <h2 className="text-white text-xl font-semibold">Create Custom Scenario</h2>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-2 hover:bg-[#1f1f28] rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm text-gray-400 mb-3">
                Describe your scenario in natural language
              </label>
              <textarea
                value={customScenarioInput}
                onChange={(e) => setCustomScenarioInput(e.target.value)}
                placeholder="E.g., Test user registration flow with email verification and profile setup..."
                className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/30 resize-none"
                rows={6}
              />
              <div className="mt-2 text-xs text-gray-500">
                AI will generate scenario steps based on your description
              </div>
            </div>

            <div className="p-6 border-t border-[#1f1f28] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 bg-[#13131a] border border-[#1f1f28] hover:border-[#2f2f38] text-white rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomScenarioCreate}
                disabled={!customScenarioInput.trim()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Sparkles size={16} />
                Generate Scenario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Panel: Scenario List */}
      <main className="flex flex-col overflow-hidden bg-[#060609]">
        {/* Header */}
        <div className="bg-[#0a0a0f] border-b border-[#1f1f28] px-8 py-6">
          <div className="flex items-center justify-between mb-6">
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
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
            >
              <Sparkles size={20} />
              Generate Scenarios (AI)
            </button>

            <button
              onClick={() => setShowCustomModal(true)}
              className="flex items-center gap-2 bg-[#13131a] border border-[#1f1f28] hover:border-blue-500/30 text-white px-6 py-3 rounded-lg transition-all"
            >
              <Plus size={20} />
              Custom Scenario
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
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-2">
            {filteredScenarios.map((scenario) => {
              const TypeIcon = typeColors[scenario.type].icon;
              const ReasonIcon = reasonColors[scenario.reasonType].icon;
              return (
                <div
                  key={scenario.id}
                  onClick={() => handleSelectScenario(scenario.id)}
                  className={`group bg-[#0a0a0f] border rounded-xl p-5 cursor-pointer transition-all hover:border-blue-500/30 ${
                    selectedScenarioId === scenario.id ? 'border-blue-500/50 bg-blue-500/5' : 'border-[#1f1f28]'
                  }`}
                >
                  <div className="flex items-center gap-4">
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
                      <div className="flex items-center gap-3 mb-2">
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

                      <div className="flex items-center gap-3">
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
        <aside className="bg-[#0a0a0f] border-l border-[#1f1f28] flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-[#1f1f28]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={selectedScenario.title}
                  onChange={(e) => updateScenario({ title: e.target.value })}
                  className="text-white text-xl font-semibold bg-transparent border-b border-transparent hover:border-[#1f1f28] focus:border-blue-500/30 focus:outline-none px-2 -mx-2"
                />
                <Edit3 size={16} className="text-gray-500" />
              </div>
              <button
                onClick={() => setSelectedScenarioId(null)}
                className="p-2 hover:bg-[#1f1f28] rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3">
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
                                <span className="text-gray-500">→</span>
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
