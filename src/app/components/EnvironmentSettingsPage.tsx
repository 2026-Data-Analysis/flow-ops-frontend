import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Copy,
  Trash2,
  Save,
  Zap,
  ChevronRight,
  X,
  Check,
  Globe,
  Key,
  Shield,
  AlertCircle,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Play,
  Sparkles,
  GitPullRequest,
  Rocket,
  CalendarClock,
  Tag,
  Settings,
  Eye
} from 'lucide-react';
import { DEFAULT_REQUESTER, flowOpsApi, getDefaultAppId, type EnvironmentResponse } from '../api/flowOpsClient';

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}

interface Environment {
  id: string;
  name: string;
  baseUrl: string;
  authType: 'none' | 'bearer' | 'apiKey';
  token: string;
  headers: KeyValuePair[];
  color: string;

  // Test Automation
  defaultTestLevel: 'smoke' | 'sanity' | 'regression' | 'full';

  // Automation Triggers
  triggers: {
    onPRMerge: boolean;
    onDeploy: boolean;
    onSchedule: boolean;
    scheduleExpression?: string; // e.g., "0 */6 * * *" for every 6 hours
  };

  // Trigger Scope
  triggerScope: 'all' | 'selected' | 'tags';
  selectedAPIs: string[]; // API IDs
  tags: string[]; // e.g., ['auth', 'critical']

  // Execution Mode
  executionMode: 'existing' | 'generate';

  // Status
  lastTestStatus?: 'success' | 'failed' | 'running';
  lastRunTime?: string;
  coverage?: number;
}

const mockEnvironments: Environment[] = [
  {
    id: '1',
    name: 'Development',
    baseUrl: 'https://dev-api.acme.com',
    authType: 'bearer',
    token: 'dev_token_abc123xyz',
    headers: [
      { id: 'h1', key: 'Content-Type', value: 'application/json' },
      { id: 'h2', key: 'X-API-Version', value: 'v1' },
    ],
    color: 'from-yellow-500 to-amber-500',
    defaultTestLevel: 'smoke',
    triggers: {
      onPRMerge: true,
      onDeploy: false,
      onSchedule: false,
    },
    triggerScope: 'tags',
    selectedAPIs: [],
    tags: ['auth', 'critical'],
    executionMode: 'existing',
    lastTestStatus: 'success',
    lastRunTime: '2 hours ago',
    coverage: 45,
  },
  {
    id: '2',
    name: 'Staging',
    baseUrl: 'https://staging-api.acme.com',
    authType: 'bearer',
    token: 'staging_token_def456uvw',
    headers: [
      { id: 'h3', key: 'Content-Type', value: 'application/json' },
    ],
    color: 'from-blue-500 to-cyan-500',
    defaultTestLevel: 'regression',
    triggers: {
      onPRMerge: false,
      onDeploy: true,
      onSchedule: true,
      scheduleExpression: '0 */6 * * *',
    },
    triggerScope: 'all',
    selectedAPIs: [],
    tags: [],
    executionMode: 'generate',
    lastTestStatus: 'failed',
    lastRunTime: '15 minutes ago',
    coverage: 72,
  },
  {
    id: '3',
    name: 'Production',
    baseUrl: 'https://api.acme.com',
    authType: 'apiKey',
    token: 'prod_api_key_ghi789rst',
    headers: [
      { id: 'h4', key: 'Content-Type', value: 'application/json' },
      { id: 'h5', key: 'X-API-Version', value: 'v2' },
    ],
    color: 'from-green-500 to-emerald-500',
    defaultTestLevel: 'full',
    triggers: {
      onPRMerge: false,
      onDeploy: true,
      onSchedule: true,
      scheduleExpression: '0 0 * * *',
    },
    triggerScope: 'selected',
    selectedAPIs: ['1', '2', '3'],
    tags: [],
    executionMode: 'existing',
    lastTestStatus: 'success',
    lastRunTime: '1 day ago',
    coverage: 95,
  },
];

const parseObject = (value: unknown): Record<string, string> => {
  if (!value) return {};
  if (typeof value === 'object') return value as Record<string, string>;
  try {
    return JSON.parse(String(value));
  } catch {
    return {};
  }
};

const normalizeEnvironment = (env: EnvironmentResponse): Environment => {
  const headers = parseObject(env.headers);
  const authType = env.authType === 'API_KEY' ? 'apiKey' : env.authType === 'BEARER' ? 'bearer' : 'none';
  return {
    id: String(env.id),
    name: env.name,
    baseUrl: env.baseUrl || '',
    authType,
    token: typeof env.authConfig === 'string' ? env.authConfig : '',
    headers: Object.entries(headers).map(([key, value], index) => ({ id: `${env.id}-${index}`, key, value: String(value) })),
    color: 'from-blue-500 to-cyan-500',
    defaultTestLevel: env.defaultTestLevel?.toLowerCase() as Environment['defaultTestLevel'] || 'smoke',
    triggers: { onPRMerge: false, onDeploy: false, onSchedule: false },
    triggerScope: 'all',
    selectedAPIs: [],
    tags: [],
    executionMode: 'existing',
    lastTestStatus: undefined,
    lastRunTime: env.lastRunAt || undefined,
    coverage: env.coverage ? Math.round(env.coverage) : undefined,
  };
};

const serializeEnvironment = (env: Environment) => ({
  name: env.name,
  branchName: env.name.toLowerCase(),
  baseUrl: env.baseUrl,
  authType: env.authType === 'apiKey' ? 'API_KEY' : env.authType === 'bearer' ? 'BEARER' : 'NONE',
  authConfig: env.token,
  headers: Object.fromEntries(env.headers.filter((header) => header.key).map((header) => [header.key, header.value])),
  defaultTestLevel: env.defaultTestLevel.toUpperCase(),
  defaultTestLevelSource: 'MANUAL',
});

export function EnvironmentSettingsPage() {
  const navigate = useNavigate();
  const [environments, setEnvironments] = useState<Environment[]>(mockEnvironments);
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>('1');
  const [isSaving, setIsSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [runningQuickTest, setRunningQuickTest] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const selectedEnv = selectedEnvId ? environments.find(env => env.id === selectedEnvId) : null;

  useEffect(() => {
    flowOpsApi
      .listEnvironments(getDefaultAppId())
      .then((items) => {
        const normalized = items.map(normalizeEnvironment);
        if (normalized.length > 0) {
          setEnvironments(normalized);
          setSelectedEnvId(normalized[0].id);
        }
        setApiError(null);
      })
      .catch((error) => {
        setApiError(error instanceof Error ? error.message : '환경 목록을 불러오지 못했습니다.');
      });
  }, []);

  const updateEnvironment = (updates: Partial<Environment>) => {
    setEnvironments(envs =>
      envs.map(env => (env.id === selectedEnvId ? { ...env, ...updates } : env))
    );
  };

  const addEnvironment = () => {
    const newEnv: Environment = {
      id: Date.now().toString(),
      name: 'New Environment',
      baseUrl: '',
      authType: 'none',
      token: '',
      headers: [],
      color: 'from-purple-500 to-pink-500',
      defaultTestLevel: 'smoke',
      triggers: {
        onPRMerge: false,
        onDeploy: false,
        onSchedule: false,
      },
      triggerScope: 'all',
      selectedAPIs: [],
      tags: [],
      executionMode: 'existing',
    };
    setEnvironments([...environments, newEnv]);
    setSelectedEnvId(newEnv.id);
  };

  const duplicateEnvironment = (envId: string) => {
    const envToDuplicate = environments.find(e => e.id === envId);
    if (envToDuplicate) {
      const newEnv: Environment = {
        ...envToDuplicate,
        id: Date.now().toString(),
        name: `${envToDuplicate.name} (Copy)`,
        headers: envToDuplicate.headers.map(h => ({ ...h, id: Date.now() + Math.random().toString() })),
        lastTestStatus: undefined,
        lastRunTime: undefined,
      };
      setEnvironments([...environments, newEnv]);
      setSelectedEnvId(newEnv.id);
    }
  };

  const deleteEnvironment = (envId: string) => {
    if (environments.length === 1) return;
    setEnvironments(envs => envs.filter(e => e.id !== envId));
    if (selectedEnvId === envId) {
      setSelectedEnvId(environments[0].id);
    }
  };

  const addHeader = () => {
    if (!selectedEnv) return;
    const newHeader: KeyValuePair = {
      id: Date.now().toString(),
      key: '',
      value: '',
    };
    updateEnvironment({ headers: [...selectedEnv.headers, newHeader] });
  };

  const updateHeader = (id: string, updates: Partial<KeyValuePair>) => {
    if (!selectedEnv) return;
    updateEnvironment({
      headers: selectedEnv.headers.map(h => (h.id === id ? { ...h, ...updates } : h)),
    });
  };

  const deleteHeader = (id: string) => {
    if (!selectedEnv) return;
    updateEnvironment({
      headers: selectedEnv.headers.filter(h => h.id !== id),
    });
  };

  const handleSave = async () => {
    if (!selectedEnv) return;
    setIsSaving(true);
    setApiError(null);
    try {
      const body = serializeEnvironment(selectedEnv);
      const id = Number(selectedEnv.id);
      const saved = Number.isFinite(id) && id < 1000000000000
        ? await flowOpsApi.updateEnvironment(id, body as any)
        : await flowOpsApi.createEnvironment(getDefaultAppId(), body as any);
      const normalized = normalizeEnvironment(saved);
      setEnvironments((envs) => envs.map((env) => (env.id === selectedEnv.id ? normalized : env)));
      setSelectedEnvId(normalized.id);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : '환경 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedEnv) return;
    setTestingConnection(true);
    setApiError(null);
    try {
      await flowOpsApi.testConnection(Number(selectedEnv.id));
    } catch (error) {
      setApiError(error instanceof Error ? error.message : '연결 테스트에 실패했습니다.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleRunQuickTest = async () => {
    if (!selectedEnv) return;
    setRunningQuickTest(true);
    setApiError(null);
    try {
      await flowOpsApi.runQuickTest(Number(selectedEnv.id), { createdBy: DEFAULT_REQUESTER });
      updateEnvironment({
        lastTestStatus: 'success',
        lastRunTime: 'Just now',
      });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Quick Test 실행에 실패했습니다.');
    } finally {
      setRunningQuickTest(false);
    }
  };

  const handleViewExecution = () => {
    navigate('/execution/run');
  };

  const testLevelOptions = [
    { value: 'smoke', label: 'Smoke Tests', desc: 'Critical functionality only', color: 'text-red-400' },
    { value: 'sanity', label: 'Sanity Tests', desc: 'Basic feature validation', color: 'text-yellow-400' },
    { value: 'regression', label: 'Regression Tests', desc: 'Regular regression testing', color: 'text-blue-400' },
    { value: 'full', label: 'Full Suite', desc: 'Comprehensive testing', color: 'text-purple-400' },
  ];

  return (
    <div className="flex-1 overflow-hidden bg-[#060609] flex">
      {/* Left: Environment List */}
      <aside className={`bg-[#0a0a0f] border-r border-[#1f1f28] flex flex-col transition-all duration-300 ${
        selectedEnvId ? 'w-96' : 'flex-1'
      }`}>
        <div className="p-6 border-b border-[#1f1f28]">
          <h2 className="text-white text-lg mb-1">Environments</h2>
          <p className="text-gray-500 text-sm">Automation hubs for your testing workflow</p>
          {apiError && (
            <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
              Backend unavailable: {apiError}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {environments.map((env) => (
            <div
              key={env.id}
              onClick={() => setSelectedEnvId(env.id)}
              className={`group relative rounded-xl p-4 cursor-pointer transition-all ${
                selectedEnvId === env.id
                  ? 'bg-[#13131a] border border-blue-500/30 shadow-lg'
                  : 'bg-[#13131a] border border-[#1f1f28] hover:border-[#2f2f38]'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${env.color} flex items-center justify-center flex-shrink-0`}>
                  <Globe size={24} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold mb-1">{env.name}</div>
                  <div className="text-xs text-gray-500 truncate font-mono">{env.baseUrl || 'No URL set'}</div>
                </div>
                {selectedEnvId === env.id && (
                  <ChevronRight size={18} className="text-blue-400 flex-shrink-0" />
                )}
              </div>

              {/* Status Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    env.authType === 'bearer' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    env.authType === 'apiKey' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                    'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                  }`}>
                    {env.authType === 'bearer' ? 'Bearer' : env.authType === 'apiKey' ? 'API Key' : 'No Auth'}
                  </span>
                </div>
                {env.lastTestStatus && (
                  <div className="flex items-center gap-1">
                    {env.lastTestStatus === 'success' && (
                      <CheckCircle2 size={16} className="text-green-400" />
                    )}
                    {env.lastTestStatus === 'failed' && (
                      <XCircle size={16} className="text-red-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-lg p-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock size={12} className="text-gray-500" />
                    <span className="text-xs text-gray-500">Last Run</span>
                  </div>
                  <div className="text-xs text-white font-medium">
                    {env.lastRunTime || 'Never'}
                  </div>
                </div>

                <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-lg p-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp size={12} className="text-gray-500" />
                    <span className="text-xs text-gray-500">Coverage</span>
                  </div>
                  <div className="text-xs text-white font-medium">
                    {env.coverage || 0}%
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateEnvironment(env.id);
                  }}
                  className="p-1.5 bg-[#1f1f28] hover:bg-[#2f2f38] rounded text-gray-400 hover:text-white transition-colors"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteEnvironment(env.id);
                  }}
                  className="p-1.5 bg-[#1f1f28] hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[#1f1f28]">
          <button
            onClick={addEnvironment}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={18} />
            Add Environment
          </button>
        </div>
      </aside>

      {/* Right: Environment Detail */}
      {selectedEnv ? (
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-white text-2xl mb-1 flex items-center gap-3">
                  {selectedEnv.name}
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    selectedEnv.lastTestStatus === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    selectedEnv.lastTestStatus === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                  }`}>
                    {selectedEnv.lastTestStatus ? selectedEnv.lastTestStatus : 'Not tested'}
                  </span>
                </h1>
                <p className="text-gray-500 text-sm">Configure automation triggers and testing strategies</p>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Save size={16} className="animate-pulse" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>

            {/* A. Configuration */}
            <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
              <h3 className="text-white mb-4 flex items-center gap-2">
                <Settings size={18} className="text-blue-400" />
                Configuration
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Environment Name</label>
                    <input
                      type="text"
                      value={selectedEnv.name}
                      onChange={(e) => updateEnvironment({ name: e.target.value })}
                      className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/30 transition-colors"
                      placeholder="e.g., Development"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Auth Type</label>
                    <select
                      value={selectedEnv.authType}
                      onChange={(e) => updateEnvironment({ authType: e.target.value as any })}
                      className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/30 transition-colors"
                    >
                      <option value="none">None</option>
                      <option value="bearer">Bearer Token</option>
                      <option value="apiKey">API Key</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Base URL</label>
                  <input
                    type="text"
                    value={selectedEnv.baseUrl}
                    onChange={(e) => updateEnvironment({ baseUrl: e.target.value })}
                    className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/30 transition-colors font-mono text-sm"
                    placeholder="https://api.example.com"
                  />
                </div>

                {selectedEnv.authType !== 'none' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {selectedEnv.authType === 'bearer' ? 'Bearer Token' : 'API Key'}
                    </label>
                    <div className="relative">
                      <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="password"
                        value={selectedEnv.token}
                        onChange={(e) => updateEnvironment({ token: e.target.value })}
                        className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg pl-12 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500/30 transition-colors font-mono text-sm"
                        placeholder="Enter token or key"
                      />
                    </div>
                  </div>
                )}

                {/* Headers */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm text-gray-400">Headers</label>
                    <button
                      onClick={addHeader}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Plus size={14} />
                      Add Header
                    </button>
                  </div>
                  {selectedEnv.headers.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-xs bg-[#13131a] border border-[#1f1f28] rounded-lg">
                      No headers defined
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedEnv.headers.map((header) => (
                        <div
                          key={header.id}
                          className="flex items-center gap-2 bg-[#13131a] border border-[#1f1f28] rounded-lg p-2"
                        >
                          <input
                            type="text"
                            value={header.key}
                            onChange={(e) => updateHeader(header.id, { key: e.target.value })}
                            className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none px-2 py-1 font-mono"
                            placeholder="Key"
                          />
                          <span className="text-gray-600">:</span>
                          <input
                            type="text"
                            value={header.value}
                            onChange={(e) => updateHeader(header.id, { value: e.target.value })}
                            className="flex-[2] bg-transparent border-none text-white text-sm focus:outline-none px-2 py-1 font-mono"
                            placeholder="Value"
                          />
                          <button
                            onClick={() => deleteHeader(header.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* B. Test Strategy */}
            <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
              <h3 className="text-white mb-4 flex items-center gap-2">
                <Target size={18} className="text-blue-400" />
                Test Strategy
              </h3>
              <div>
                <label className="block text-sm text-gray-400 mb-3">Default Test Level</label>
                <div className="grid grid-cols-4 gap-3">
                  {testLevelOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => updateEnvironment({ defaultTestLevel: option.value as any })}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all min-w-0 ${
                        selectedEnv.defaultTestLevel === option.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-[#1f1f28] hover:border-blue-500/30 bg-[#13131a]'
                      }`}
                    >
                      <div className={`font-medium mb-1 whitespace-normal break-words ${
                        selectedEnv.defaultTestLevel === option.value ? option.color : 'text-white'
                      }`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500 whitespace-normal break-words">{option.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* C. Automation Triggers */}
            <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
              <h3 className="text-white mb-4 flex items-center gap-2">
                <Zap size={18} className="text-blue-400" />
                Automation Triggers
              </h3>
              <div className="space-y-3">
                <div
                  onClick={() => updateEnvironment({
                    triggers: { ...selectedEnv.triggers, onPRMerge: !selectedEnv.triggers.onPRMerge }
                  })}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedEnv.triggers.onPRMerge
                      ? 'border-blue-500/30 bg-blue-500/5'
                      : 'border-[#1f1f28] hover:border-[#2f2f38] bg-[#13131a]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GitPullRequest size={20} className={selectedEnv.triggers.onPRMerge ? 'text-blue-400' : 'text-gray-500'} />
                      <div>
                        <div className={`font-medium mb-0.5 ${selectedEnv.triggers.onPRMerge ? 'text-white' : 'text-gray-400'}`}>
                          On PR Merge
                        </div>
                        <div className="text-xs text-gray-500">Run tests when a pull request is merged</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedEnv.triggers.onPRMerge ? 'bg-blue-500 border-blue-500' : 'border-gray-500'
                    }`}>
                      {selectedEnv.triggers.onPRMerge && <Check size={14} className="text-white" />}
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => updateEnvironment({
                    triggers: { ...selectedEnv.triggers, onDeploy: !selectedEnv.triggers.onDeploy }
                  })}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedEnv.triggers.onDeploy
                      ? 'border-blue-500/30 bg-blue-500/5'
                      : 'border-[#1f1f28] hover:border-[#2f2f38] bg-[#13131a]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Rocket size={20} className={selectedEnv.triggers.onDeploy ? 'text-blue-400' : 'text-gray-500'} />
                      <div>
                        <div className={`font-medium mb-0.5 ${selectedEnv.triggers.onDeploy ? 'text-white' : 'text-gray-400'}`}>
                          On Deploy
                        </div>
                        <div className="text-xs text-gray-500">Run tests after deployment completes</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedEnv.triggers.onDeploy ? 'bg-blue-500 border-blue-500' : 'border-gray-500'
                    }`}>
                      {selectedEnv.triggers.onDeploy && <Check size={14} className="text-white" />}
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg border transition-all ${
                    selectedEnv.triggers.onSchedule
                      ? 'border-blue-500/30 bg-blue-500/5'
                      : 'border-[#1f1f28] bg-[#13131a]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <CalendarClock size={20} className={selectedEnv.triggers.onSchedule ? 'text-blue-400' : 'text-gray-500'} />
                      <div>
                        <div className={`font-medium mb-0.5 ${selectedEnv.triggers.onSchedule ? 'text-white' : 'text-gray-400'}`}>
                          On Schedule
                        </div>
                        <div className="text-xs text-gray-500">Run tests on a recurring schedule</div>
                      </div>
                    </div>
                    <div
                      onClick={() => updateEnvironment({
                        triggers: { ...selectedEnv.triggers, onSchedule: !selectedEnv.triggers.onSchedule }
                      })}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                        selectedEnv.triggers.onSchedule ? 'bg-blue-500 border-blue-500' : 'border-gray-500'
                      }`}
                    >
                      {selectedEnv.triggers.onSchedule && <Check size={14} className="text-white" />}
                    </div>
                  </div>
                  {selectedEnv.triggers.onSchedule && (
                    <div className="pl-8">
                      <label className="block text-xs text-gray-400 mb-2">Cron Expression</label>
                      <input
                        type="text"
                        value={selectedEnv.triggers.scheduleExpression || ''}
                        onChange={(e) => updateEnvironment({
                          triggers: { ...selectedEnv.triggers, scheduleExpression: e.target.value }
                        })}
                        className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 font-mono"
                        placeholder="0 */6 * * *"
                      />
                      <div className="mt-1 text-xs text-gray-500">
                        Example: "0 */6 * * *" runs every 6 hours
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* D. Trigger Scope */}
            <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
              <h3 className="text-white mb-4 flex items-center gap-2">
                <Target size={18} className="text-blue-400" />
                Trigger Scope
              </h3>
              <div className="space-y-3">
                <div
                  onClick={() => updateEnvironment({ triggerScope: 'all' })}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedEnv.triggerScope === 'all'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-[#1f1f28] hover:border-blue-500/30 bg-[#13131a]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`font-medium ${selectedEnv.triggerScope === 'all' ? 'text-white' : 'text-gray-400'}`}>
                      All APIs
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedEnv.triggerScope === 'all' ? 'border-blue-500' : 'border-gray-500'
                    }`}>
                      {selectedEnv.triggerScope === 'all' && (
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Test all registered APIs</div>
                </div>

                <div
                  onClick={() => updateEnvironment({ triggerScope: 'selected' })}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedEnv.triggerScope === 'selected'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-[#1f1f28] hover:border-blue-500/30 bg-[#13131a]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`font-medium ${selectedEnv.triggerScope === 'selected' ? 'text-white' : 'text-gray-400'}`}>
                      Selected APIs
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedEnv.triggerScope === 'selected' ? 'border-blue-500' : 'border-gray-500'
                    }`}>
                      {selectedEnv.triggerScope === 'selected' && (
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Test only specific APIs ({selectedEnv.selectedAPIs.length} selected)
                  </div>
                </div>

                <div
                  onClick={() => updateEnvironment({ triggerScope: 'tags' })}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedEnv.triggerScope === 'tags'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-[#1f1f28] hover:border-blue-500/30 bg-[#13131a]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`font-medium ${selectedEnv.triggerScope === 'tags' ? 'text-white' : 'text-gray-400'}`}>
                      By Tag
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedEnv.triggerScope === 'tags' ? 'border-blue-500' : 'border-gray-500'
                    }`}>
                      {selectedEnv.triggerScope === 'tags' && (
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Test APIs with specific tags
                    {selectedEnv.tags.length > 0 && (
                      <span className="ml-1">
                        ({selectedEnv.tags.map(t => `#${t}`).join(', ')})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* E. Execution Mode */}
            <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
              <h3 className="text-white mb-4 flex items-center gap-2">
                <Play size={18} className="text-blue-400" />
                Execution Mode
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => updateEnvironment({ executionMode: 'existing' })}
                  className={`p-5 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedEnv.executionMode === 'existing'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-[#1f1f28] hover:border-blue-500/30 bg-[#13131a]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Play size={20} className={selectedEnv.executionMode === 'existing' ? 'text-blue-400' : 'text-gray-500'} />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedEnv.executionMode === 'existing' ? 'border-blue-500' : 'border-gray-500'
                    }`}>
                      {selectedEnv.executionMode === 'existing' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                  </div>
                  <div className={`font-medium mb-1 ${selectedEnv.executionMode === 'existing' ? 'text-white' : 'text-gray-400'}`}>
                    Run Existing Tests
                  </div>
                  <div className="text-xs text-gray-500">Execute pre-configured test cases</div>
                </div>

                <div
                  onClick={() => updateEnvironment({ executionMode: 'generate' })}
                  className={`p-5 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedEnv.executionMode === 'generate'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-[#1f1f28] hover:border-blue-500/30 bg-[#13131a]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Sparkles size={20} className={selectedEnv.executionMode === 'generate' ? 'text-purple-400' : 'text-gray-500'} />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedEnv.executionMode === 'generate' ? 'border-blue-500' : 'border-gray-500'
                    }`}>
                      {selectedEnv.executionMode === 'generate' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                  </div>
                  <div className={`font-medium mb-1 ${selectedEnv.executionMode === 'generate' ? 'text-white' : 'text-gray-400'}`}>
                    Generate + Run Tests
                  </div>
                  <div className="text-xs text-gray-500">AI generates tests then executes</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="flex-1 flex items-center justify-center gap-2 bg-[#13131a] border border-[#1f1f28] hover:border-blue-500/30 hover:bg-blue-500/5 text-white px-4 py-3 rounded-lg transition-all disabled:opacity-50"
              >
                {testingConnection ? (
                  <>
                    <Zap size={18} className="animate-pulse" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    Test Connection
                  </>
                )}
              </button>

              <button
                onClick={handleRunQuickTest}
                disabled={runningQuickTest}
                className="flex-1 flex items-center justify-center gap-2 bg-[#13131a] border border-[#1f1f28] hover:border-blue-500/30 hover:bg-blue-500/5 text-white px-4 py-3 rounded-lg transition-all disabled:opacity-50"
              >
                {runningQuickTest ? (
                  <>
                    <Play size={18} className="animate-pulse" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Run Quick Test
                  </>
                )}
              </button>

              <button
                onClick={handleViewExecution}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <Eye size={18} />
                View Execution
              </button>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-[#13131a] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Globe size={32} className="text-gray-600" />
            </div>
            <h2 className="text-white text-xl mb-2">No Environment Selected</h2>
            <p className="text-gray-500 text-sm mb-6">
              Select an environment to configure automation triggers and testing strategies.
            </p>
            <button
              onClick={addEnvironment}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors mx-auto"
            >
              <Plus size={18} />
              Add Environment
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
