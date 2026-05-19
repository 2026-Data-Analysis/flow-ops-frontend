import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
    Plus,
    Copy,
    Trash2,
    Save,
    Zap,
    ArrowLeft,
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
    Eye,
} from 'lucide-react';
import {
    DEFAULT_REQUESTER,
    flowOpsApi,
    rememberAppId,
    rememberAppTitle,
    type EnvironmentResponse,
} from '../api/flowOpsClient';

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
        headers: Object.entries(headers).map(([key, value], index) => ({
            id: `${env.id}-${index}`,
            key,
            value: String(value),
        })),
        color: 'from-blue-500 to-cyan-500',
        defaultTestLevel: (env.defaultTestLevel?.toLowerCase() as Environment['defaultTestLevel']) || 'smoke',
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
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [mainAppId, setMainAppId] = useState<number | null>(null);
    const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [runningQuickTest, setRunningQuickTest] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [headersJsonText, setHeadersJsonText] = useState('{}');
    const [headersJsonError, setHeadersJsonError] = useState<string | null>(null);

    const selectedEnv = selectedEnvId ? environments.find((env) => env.id === selectedEnvId) : null;

    useEffect(() => {
        let active = true;

        const loadMainApplicationEnvironments = async () => {
            setIsLoading(true);
            setApiError(null);

            try {
                const mainApplication = await flowOpsApi.resolveMainApplication();
                const items = await flowOpsApi.listEnvironments(mainApplication.appId);
                const normalized = items.map(normalizeEnvironment);
                if (!active) return;

                setMainAppId(mainApplication.appId);
                rememberAppId(mainApplication.appId);
                rememberAppTitle(mainApplication.title);
                setEnvironments(normalized.length > 0 ? normalized : []);
                setSelectedEnvId(normalized[0]?.id ?? null);
                setApiError(null);
            } catch (error) {
                if (!active) return;
                setEnvironments([]);
                setSelectedEnvId(null);
                setApiError(error instanceof Error ? error.message : 'Failed to load environments.');
            } finally {
                if (!active) return;
                setIsLoading(false);
            }
        };

        loadMainApplicationEnvironments();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!selectedEnv) {
            setHeadersJsonText('{}');
            setHeadersJsonError(null);
            return;
        }
        setHeadersJsonText(
            JSON.stringify(
                Object.fromEntries(selectedEnv.headers.filter((header) => header.key).map((header) => [header.key, header.value])),
                null,
                2,
            ),
        );
        setHeadersJsonError(null);
    }, [selectedEnvId]);

    const updateEnvironment = (updates: Partial<Environment>) => {
        setEnvironments((envs) => envs.map((env) => (env.id === selectedEnvId ? { ...env, ...updates } : env)));
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
        const envToDuplicate = environments.find((e) => e.id === envId);
        if (envToDuplicate) {
            const newEnv: Environment = {
                ...envToDuplicate,
                id: Date.now().toString(),
                name: `${envToDuplicate.name} (Copy)`,
                headers: envToDuplicate.headers.map((h) => ({ ...h, id: Date.now() + Math.random().toString() })),
                lastTestStatus: undefined,
                lastRunTime: undefined,
            };
            setEnvironments([...environments, newEnv]);
            setSelectedEnvId(newEnv.id);
        }
    };

    const deleteEnvironment = (envId: string) => {
        if (environments.length === 1) return;
        const nextEnvironments = environments.filter((e) => e.id !== envId);
        setEnvironments(nextEnvironments);
        if (selectedEnvId === envId) {
            setSelectedEnvId(nextEnvironments[0]?.id ?? null);
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
            headers: selectedEnv.headers.map((h) => (h.id === id ? { ...h, ...updates } : h)),
        });
    };

    const deleteHeader = (id: string) => {
        if (!selectedEnv) return;
        updateEnvironment({
            headers: selectedEnv.headers.filter((h) => h.id !== id),
        });
    };

    const updateHeadersFromJson = (value: string) => {
        setHeadersJsonText(value);
        try {
            const parsed = value.trim() ? JSON.parse(value) : {};
            if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
                throw new Error('Headers must be a JSON object.');
            }
            setHeadersJsonError(null);
            updateEnvironment({
                headers: Object.entries(parsed).map(([key, headerValue], index) => ({
                    id: `${selectedEnvId || 'new'}-json-${index}`,
                    key,
                    value: String(headerValue),
                })),
            });
        } catch (error) {
            setHeadersJsonError(error instanceof Error ? error.message : 'Invalid JSON object.');
        }
    };

    const handleSave = async () => {
        if (!selectedEnv) return;
        setIsSaving(true);
        setApiError(null);
        try {
            const body = serializeEnvironment(selectedEnv);
            const id = Number(selectedEnv.id);
            const saved =
                Number.isFinite(id) && id < 1000000000000
                    ? await flowOpsApi.updateEnvironment(id, body as any)
                    : await flowOpsApi.createEnvironment(
                          mainAppId ?? (await flowOpsApi.resolveMainApplication()).appId,
                          body as any,
                      );
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

    return (
        <div className="relative flex-1 min-h-0 overflow-hidden bg-[#060609] flex flex-col lg:flex-row">
            {/* Left: Environment List */}
            <aside
                className={`bg-[#0a0a0f] border-b border-[#1f1f28] flex flex-col transition-all duration-300 lg:border-b-0 ${
                    selectedEnvId ? 'w-full flex-1 lg:flex-none lg:w-96 lg:border-r' : 'w-full flex-1'
                }`}
            >
                <div className="p-4 border-b border-[#1f1f28] sm:p-6">
                    <h2 className="text-white text-lg mb-1">Environments</h2>
                    <p className="text-gray-500 text-sm">Automation hubs for your testing workflow</p>
                    {apiError && (
                        <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
                            Backend unavailable: {apiError}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoading ? (
                        <div className="rounded-lg border border-[#1f1f28] bg-[#13131a] px-4 py-6 text-center text-sm text-gray-500">
                            Loading environments...
                        </div>
                    ) : environments.length === 0 ? (
                        <div className="rounded-lg border border-[#1f1f28] bg-[#13131a] px-4 py-6 text-center text-sm text-gray-500">
                            No environments found.
                        </div>
                    ) : (
                        environments.map((env) => (
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
                                    <div
                                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${env.color} flex items-center justify-center flex-shrink-0`}
                                    >
                                        <Globe size={24} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-semibold mb-1">{env.name}</div>
                                        <div className="text-xs text-gray-500 truncate font-mono">
                                            {env.baseUrl || 'No URL set'}
                                        </div>
                                    </div>
                                    {selectedEnvId === env.id && (
                                        <ChevronRight size={18} className="text-blue-400 flex-shrink-0" />
                                    )}
                                </div>

                                {/* Status Row */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full ${
                                                env.authType === 'bearer'
                                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                    : env.authType === 'apiKey'
                                                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                      : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                            }`}
                                        >
                                            {env.authType === 'bearer'
                                                ? 'Bearer'
                                                : env.authType === 'apiKey'
                                                  ? 'API Key'
                                                  : 'No Auth'}
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
                                        <div className="text-xs text-white font-medium">{env.coverage || 0}%</div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
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
                        ))
                    )}
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
            {selectedEnv && (
                <main className="absolute inset-0 z-20 overflow-y-auto bg-[#060609] p-4 shadow-2xl shadow-black/40 sm:p-6 lg:static lg:z-auto lg:flex-1 lg:border-l lg:border-[#1f1f28] lg:shadow-none">
                    <div className="max-w-5xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <div className="mb-1 flex min-w-0 items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedEnvId(null)}
                                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#1f1f28] bg-[#0a0a0f] text-gray-400 transition-colors hover:border-blue-500/30 hover:text-white"
                                        title="Back to environments"
                                        aria-label="Back to environments"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <h1 className="text-white text-2xl flex min-w-0 flex-wrap items-center gap-3 break-words">
                                        {selectedEnv.name}
                                        <span
                                            className={`text-xs px-3 py-1 rounded-full ${
                                                selectedEnv.lastTestStatus === 'success'
                                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                    : selectedEnv.lastTestStatus === 'failed'
                                                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                      : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                            }`}
                                        >
                                            {selectedEnv.lastTestStatus ? selectedEnv.lastTestStatus : 'Not tested'}
                                        </span>
                                    </h1>
                                </div>
                                <p className="text-gray-500 text-sm">
                                    Configure automation triggers and testing strategies
                                </p>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex w-full items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 sm:w-auto"
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
                        <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-4 sm:p-6">
                            <h3 className="text-white mb-4 flex items-center gap-2">
                                <Settings size={18} className="text-blue-400" />
                                Configuration
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                        placeholder="https://api.example.com or http://localhost:8080"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        The backend normalizes missing schemes and falls back to http://localhost:8080 when empty.
                                    </p>
                                </div>

                                {selectedEnv.authType !== 'none' && (
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">
                                            {selectedEnv.authType === 'bearer' ? 'Bearer Token' : 'API Key'}
                                        </label>
                                        <div className="relative">
                                            <Key
                                                size={16}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                                            />
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
                                        <label className="text-sm text-gray-400">Headers JSON</label>
                                        <button
                                            onClick={addHeader}
                                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            <Plus size={14} />
                                            Add Header
                                        </button>
                                    </div>
                                    <textarea
                                        value={headersJsonText}
                                        onChange={(e) => updateHeadersFromJson(e.target.value)}
                                        rows={5}
                                        className={`mb-3 w-full rounded-lg border bg-[#13131a] px-4 py-3 font-mono text-sm text-white transition-colors focus:outline-none ${
                                            headersJsonError
                                                ? 'border-red-500/40 focus:border-red-500/60'
                                                : 'border-[#1f1f28] focus:border-blue-500/30'
                                        }`}
                                        placeholder={'{\n  "Authorization": "Bearer token",\n  "X-Tenant-Id": "flowops"\n}'}
                                    />
                                    {headersJsonError && (
                                        <div className="mb-3 text-xs text-red-400">{headersJsonError}</div>
                                    )}
                                    {selectedEnv.headers.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500 text-xs bg-[#13131a] border border-[#1f1f28] rounded-lg">
                                            No headers defined
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedEnv.headers.map((header) => (
                                                <div
                                                    key={header.id}
                                                    className="grid grid-cols-1 gap-2 bg-[#13131a] border border-[#1f1f28] rounded-lg p-2 sm:flex sm:items-center"
                                                >
                                                    <input
                                                        type="text"
                                                        value={header.key}
                                                        onChange={(e) =>
                                                            updateHeader(header.id, { key: e.target.value })
                                                        }
                                                        className="min-w-0 flex-1 bg-transparent border-none text-white text-sm focus:outline-none px-2 py-1 font-mono"
                                                        placeholder="Key"
                                                    />
                                                    <span className="hidden text-gray-600 sm:inline">:</span>
                                                    <input
                                                        type="text"
                                                        value={header.value}
                                                        onChange={(e) =>
                                                            updateHeader(header.id, { value: e.target.value })
                                                        }
                                                        className="min-w-0 flex-[2] bg-transparent border-none text-white text-sm focus:outline-none px-2 py-1 font-mono"
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

                        {/* C. Automation Triggers */}
                        <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-4 sm:p-6">
                            <h3 className="text-white mb-4 flex items-center gap-2">
                                <Zap size={18} className="text-blue-400" />
                                Automation Triggers
                            </h3>
                            <div className="space-y-3">
                                <div
                                    onClick={() =>
                                        updateEnvironment({
                                            triggers: {
                                                ...selectedEnv.triggers,
                                                onPRMerge: !selectedEnv.triggers.onPRMerge,
                                            },
                                        })
                                    }
                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                        selectedEnv.triggers.onPRMerge
                                            ? 'border-blue-500/30 bg-blue-500/5'
                                            : 'border-[#1f1f28] hover:border-[#2f2f38] bg-[#13131a]'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <GitPullRequest
                                                size={20}
                                                className={
                                                    selectedEnv.triggers.onPRMerge ? 'text-blue-400' : 'text-gray-500'
                                                }
                                            />
                                            <div>
                                                <div
                                                    className={`font-medium mb-0.5 ${selectedEnv.triggers.onPRMerge ? 'text-white' : 'text-gray-400'}`}
                                                >
                                                    On PR Merge
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Run tests when a pull request is merged
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                selectedEnv.triggers.onPRMerge
                                                    ? 'bg-blue-500 border-blue-500'
                                                    : 'border-gray-500'
                                            }`}
                                        >
                                            {selectedEnv.triggers.onPRMerge && (
                                                <Check size={14} className="text-white" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    onClick={() =>
                                        updateEnvironment({
                                            triggers: {
                                                ...selectedEnv.triggers,
                                                onDeploy: !selectedEnv.triggers.onDeploy,
                                            },
                                        })
                                    }
                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                        selectedEnv.triggers.onDeploy
                                            ? 'border-blue-500/30 bg-blue-500/5'
                                            : 'border-[#1f1f28] hover:border-[#2f2f38] bg-[#13131a]'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <Rocket
                                                size={20}
                                                className={
                                                    selectedEnv.triggers.onDeploy ? 'text-blue-400' : 'text-gray-500'
                                                }
                                            />
                                            <div>
                                                <div
                                                    className={`font-medium mb-0.5 ${selectedEnv.triggers.onDeploy ? 'text-white' : 'text-gray-400'}`}
                                                >
                                                    On Deploy
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Run tests after deployment completes
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                selectedEnv.triggers.onDeploy
                                                    ? 'bg-blue-500 border-blue-500'
                                                    : 'border-gray-500'
                                            }`}
                                        >
                                            {selectedEnv.triggers.onDeploy && (
                                                <Check size={14} className="text-white" />
                                            )}
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
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <CalendarClock
                                                size={20}
                                                className={
                                                    selectedEnv.triggers.onSchedule ? 'text-blue-400' : 'text-gray-500'
                                                }
                                            />
                                            <div>
                                                <div
                                                    className={`font-medium mb-0.5 ${selectedEnv.triggers.onSchedule ? 'text-white' : 'text-gray-400'}`}
                                                >
                                                    On Schedule
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Run tests on a recurring schedule
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            onClick={() =>
                                                updateEnvironment({
                                                    triggers: {
                                                        ...selectedEnv.triggers,
                                                        onSchedule: !selectedEnv.triggers.onSchedule,
                                                    },
                                                })
                                            }
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                                                selectedEnv.triggers.onSchedule
                                                    ? 'bg-blue-500 border-blue-500'
                                                    : 'border-gray-500'
                                            }`}
                                        >
                                            {selectedEnv.triggers.onSchedule && (
                                                <Check size={14} className="text-white" />
                                            )}
                                        </div>
                                    </div>
                                    {selectedEnv.triggers.onSchedule && (
                                        <div className="pl-0 sm:pl-8">
                                            <label className="block text-xs text-gray-400 mb-2">Cron Expression</label>
                                            <input
                                                type="text"
                                                value={selectedEnv.triggers.scheduleExpression || ''}
                                                onChange={(e) =>
                                                    updateEnvironment({
                                                        triggers: {
                                                            ...selectedEnv.triggers,
                                                            scheduleExpression: e.target.value,
                                                        },
                                                    })
                                                }
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
                        <div
                            className={`bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-4 sm:p-6 transition-opacity ${
                                selectedEnv.triggers.onPRMerge ||
                                selectedEnv.triggers.onDeploy ||
                                selectedEnv.triggers.onSchedule
                                    ? 'opacity-100'
                                    : 'opacity-40 pointer-events-none select-none'
                            }`}
                        >
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
                                        <div
                                            className={`font-medium ${selectedEnv.triggerScope === 'all' ? 'text-white' : 'text-gray-400'}`}
                                        >
                                            All APIs
                                        </div>
                                        <div
                                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                selectedEnv.triggerScope === 'all'
                                                    ? 'border-blue-500'
                                                    : 'border-gray-500'
                                            }`}
                                        >
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
                                        <div
                                            className={`font-medium ${selectedEnv.triggerScope === 'selected' ? 'text-white' : 'text-gray-400'}`}
                                        >
                                            Selected APIs
                                        </div>
                                        <div
                                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                selectedEnv.triggerScope === 'selected'
                                                    ? 'border-blue-500'
                                                    : 'border-gray-500'
                                            }`}
                                        >
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
                                        <div
                                            className={`font-medium ${selectedEnv.triggerScope === 'tags' ? 'text-white' : 'text-gray-400'}`}
                                        >
                                            By Tag
                                        </div>
                                        <div
                                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                selectedEnv.triggerScope === 'tags'
                                                    ? 'border-blue-500'
                                                    : 'border-gray-500'
                                            }`}
                                        >
                                            {selectedEnv.triggerScope === 'tags' && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Test APIs with specific tags
                                        {selectedEnv.tags.length > 0 && (
                                            <span className="ml-1">
                                                ({selectedEnv.tags.map((t) => `#${t}`).join(', ')})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* E. Execution Mode */}
                        <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-4 sm:p-6">
                            <h3 className="text-white mb-4 flex items-center gap-2">
                                <Play size={18} className="text-blue-400" />
                                Execution Mode
                            </h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div
                                    onClick={() => updateEnvironment({ executionMode: 'existing' })}
                                    className={`p-5 rounded-lg border-2 cursor-pointer transition-all ${
                                        selectedEnv.executionMode === 'existing'
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : 'border-[#1f1f28] hover:border-blue-500/30 bg-[#13131a]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <Play
                                            size={20}
                                            className={
                                                selectedEnv.executionMode === 'existing'
                                                    ? 'text-blue-400'
                                                    : 'text-gray-500'
                                            }
                                        />
                                        <div
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                selectedEnv.executionMode === 'existing'
                                                    ? 'border-blue-500'
                                                    : 'border-gray-500'
                                            }`}
                                        >
                                            {selectedEnv.executionMode === 'existing' && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        className={`font-medium mb-1 ${selectedEnv.executionMode === 'existing' ? 'text-white' : 'text-gray-400'}`}
                                    >
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
                                        <Sparkles
                                            size={20}
                                            className={
                                                selectedEnv.executionMode === 'generate'
                                                    ? 'text-purple-400'
                                                    : 'text-gray-500'
                                            }
                                        />
                                        <div
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                selectedEnv.executionMode === 'generate'
                                                    ? 'border-blue-500'
                                                    : 'border-gray-500'
                                            }`}
                                        >
                                            {selectedEnv.executionMode === 'generate' && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        className={`font-medium mb-1 ${selectedEnv.executionMode === 'generate' ? 'text-white' : 'text-gray-400'}`}
                                    >
                                        Generate + Run Tests
                                    </div>
                                    <div className="text-xs text-gray-500">AI generates tests then executes</div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
            )}
        </div>
    );
}
