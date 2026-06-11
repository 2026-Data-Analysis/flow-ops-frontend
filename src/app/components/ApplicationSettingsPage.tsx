import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    ChevronRight,
    GitBranch,
    Github,
    Loader2,
    Plus,
    Save,
    Star,
    Trash2,
    TriangleAlert,
} from 'lucide-react';
import {
    flowOpsApi,
    rememberAppId,
    rememberAppTitle,
    rememberProjectId,
    type RepositoryResponse,
} from '../api/flowOpsClient';
import { useTestContext } from '../contexts/TestContext';

const REGISTERED_REPOSITORIES_KEY = 'flowOps.registeredRepositories';

interface ApplicationRepository {
    id: number;
    projectId: number;
    appId: number;
    title: string;
    fullName: string;
    repositoryUrl?: string;
    defaultBranch?: string;
    connectionStatus?: string;
    autoSyncEnabled?: boolean;
}

const readStoredRepositories = (): ApplicationRepository[] => {
    try {
        const parsed = JSON.parse(localStorage.getItem(REGISTERED_REPOSITORIES_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeStoredRepositories = (repositories: ApplicationRepository[]) => {
    localStorage.setItem(REGISTERED_REPOSITORIES_KEY, JSON.stringify(repositories));
};

const normalizeRepository = (
    repository: RepositoryResponse,
    storedRepositories: ApplicationRepository[],
): ApplicationRepository | null => {
    const stored = storedRepositories.find(
        (item) => item.id === repository.id || item.fullName === repository.fullName,
    );
    const appId = repository.appId || stored?.appId;
    if (!appId) return null;

    return {
        id: repository.id,
        projectId: repository.projectId,
        appId,
        title: repository.appTitle || stored?.title || repository.fullName.split('/').pop() || repository.fullName,
        fullName: repository.fullName,
        repositoryUrl: repository.repositoryUrl || stored?.repositoryUrl,
        defaultBranch: repository.defaultBranch || stored?.defaultBranch,
        connectionStatus: repository.connectionStatus || stored?.connectionStatus || 'ACTIVE',
        autoSyncEnabled: repository.autoSyncEnabled ?? stored?.autoSyncEnabled ?? true,
    };
};

export function ApplicationSettingsPage() {
    const navigate = useNavigate();
    const { activeApplication, setActiveApplication } = useTestContext();
    const [repositories, setRepositories] = useState<ApplicationRepository[]>(() => readStoredRepositories());
    const [selectedRepositoryId, setSelectedRepositoryId] = useState<number | null>(null);
    const [draftTitles, setDraftTitles] = useState<Record<number, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [pendingId, setPendingId] = useState<number | null>(null);
    const [autoSyncPendingId, setAutoSyncPendingId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ApplicationRepository | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);

    const activeRepository = useMemo(
        () => repositories.find((repository) => repository.appId === activeApplication.appId),
        [activeApplication.appId, repositories],
    );
    const selectedRepository = useMemo(
        () => repositories.find((repository) => repository.id === selectedRepositoryId) || null,
        [repositories, selectedRepositoryId],
    );

    useEffect(() => {
        let active = true;

        const loadRepositories = async () => {
            setIsLoading(true);
            setApiError(null);
            const storedRepositories = readStoredRepositories();
            setRepositories(storedRepositories);

            try {
                const project = await flowOpsApi.ensureProject();
                rememberProjectId(project.id);
                const backendRepositories = await flowOpsApi.listRepositories(project.id);
                const normalized = backendRepositories
                    .map((repository) => normalizeRepository(repository, storedRepositories))
                    .filter(Boolean) as ApplicationRepository[];

                if (active && normalized.length > 0) {
                    setRepositories(normalized);
                    writeStoredRepositories(normalized);
                }
            } catch (error) {
                if (active) {
                    setApiError(
                        error instanceof Error
                            ? `${error.message} Stored registration history is shown instead.`
                            : 'Repository history API is unavailable. Stored registration history is shown instead.',
                    );
                }
            } finally {
                if (active) setIsLoading(false);
            }
        };

        loadRepositories();

        return () => {
            active = false;
        };
    }, [activeApplication.appId]);

    // Auto-selection intentionally disabled: user should choose a repository manually.

    const updateRepositoryState = (nextRepositories: ApplicationRepository[]) => {
        setRepositories(nextRepositories);
        writeStoredRepositories(nextRepositories);
    };

    const handleTitleChange = (repositoryId: number, title: string) => {
        setDraftTitles((current) => ({ ...current, [repositoryId]: title }));
    };

    const handleSaveTitle = async (repository: ApplicationRepository) => {
        const nextTitle = (draftTitles[repository.id] ?? repository.title).trim();
        if (!nextTitle) return;

        setPendingId(repository.id);
        setNotice(null);
        try {
            await flowOpsApi.updateApp(repository.appId, { name: nextTitle, title: nextTitle });
            await flowOpsApi
                .updateRepository(repository.projectId, repository.id, { appTitle: nextTitle })
                .catch(() => undefined);
        } catch (error) {
            setApiError(error instanceof Error ? error.message : 'Application title update API failed.');
        } finally {
            const nextRepositories = repositories.map((item) =>
                item.id === repository.id ? { ...item, title: nextTitle } : item,
            );
            updateRepositoryState(nextRepositories);
            setDraftTitles((current) => {
                const { [repository.id]: _removed, ...rest } = current;
                return rest;
            });
            if (repository.appId === activeApplication.appId) {
                rememberAppTitle(nextTitle);
                setActiveApplication({ appId: repository.appId, title: nextTitle });
            }
            setNotice('Application title saved.');
            setPendingId(null);
        }
    };

    const handleSaveSelectedRepository = async () => {
        if (!selectedRepository) return;
        const nextTitle = (draftTitles[selectedRepository.id] ?? selectedRepository.title).trim();
        if (!nextTitle) return;

        await handleSaveTitle(selectedRepository);
    };

    const handleSetMain = async (repository: ApplicationRepository) => {
        setPendingId(repository.id);
        setNotice(null);
        try {
            await flowOpsApi.setMainApp(repository.appId, { title: repository.title });
        } catch (error) {
            setApiError(
                error instanceof Error ? error.message : 'Main application API failed. Local setting was updated.',
            );
        } finally {
            rememberAppId(repository.appId);
            rememberAppTitle(repository.title);
            setActiveApplication({ appId: repository.appId, title: repository.title });
            setNotice(`${repository.title} is now the main application.`);
            setPendingId(null);
        }
    };

    const handleAutoSyncChange = async (repository: ApplicationRepository, autoSyncEnabled: boolean) => {
        const previousRepositories = repositories;
        const optimisticRepositories = repositories.map((item) =>
            item.id === repository.id ? { ...item, autoSyncEnabled } : item,
        );
        setAutoSyncPendingId(repository.id);
        setApiError(null);
        setNotice(null);
        updateRepositoryState(optimisticRepositories);

        try {
            const updated = await flowOpsApi.updateRepositoryAutoSync(repository.projectId, repository.id, autoSyncEnabled);
            const nextRepositories = optimisticRepositories.map((item) =>
                item.id === repository.id
                    ? {
                          ...item,
                          autoSyncEnabled: updated.autoSyncEnabled ?? autoSyncEnabled,
                          connectionStatus: updated.connectionStatus || item.connectionStatus,
                          defaultBranch: updated.defaultBranch || item.defaultBranch,
                      }
                    : item,
            );
            updateRepositoryState(nextRepositories);
            setNotice(`Auto Sync ${autoSyncEnabled ? 'enabled' : 'disabled'}.`);
        } catch (error) {
            updateRepositoryState(previousRepositories);
            setApiError(error instanceof Error ? error.message : 'Auto Sync update API failed.');
        } finally {
            setAutoSyncPendingId(null);
        }
    };

    const handleDeleteApplication = async (repository: ApplicationRepository) => {
        setPendingId(repository.id);
        setNotice(null);
        setApiError(null);

        try {
            await flowOpsApi.deleteApp(repository.appId);
            const nextRepositories = repositories.filter((item) => item.appId !== repository.appId);
            updateRepositoryState(nextRepositories);
            if (repository.appId === activeApplication.appId) {
                if (nextRepositories[0]) {
                    rememberAppId(nextRepositories[0].appId);
                    rememberAppTitle(nextRepositories[0].title);
                    setActiveApplication({ appId: nextRepositories[0].appId, title: nextRepositories[0].title });
                } else {
                    localStorage.removeItem('flowOps.appId');
                    localStorage.removeItem('flowOps.appTitle');
                    setActiveApplication({ appId: 1, title: 'Production API' });
                }
            }
            setSelectedRepositoryId(nextRepositories[0]?.id ?? null);
            setNotice('Application deleted.');
            setDeleteTarget(null);
        } catch (error) {
            setApiError(error instanceof Error ? error.message : 'Application delete API failed.');
        } finally {
            setPendingId(null);
        }
    };

    const selectedDraftTitle = selectedRepository
        ? (draftTitles[selectedRepository.id] ?? selectedRepository.title)
        : '';
    const selectedIsMain = selectedRepository?.appId === activeApplication.appId;
    const selectedHasTitleChange = selectedRepository ? selectedDraftTitle.trim() !== selectedRepository.title : false;
    const selectedIsPending = selectedRepository ? pendingId === selectedRepository.id : false;

    return (
        <div className="relative flex-1 min-h-0 overflow-hidden bg-[#060609] flex flex-col lg:flex-row">
            <aside
                className={`bg-[#0a0a0f] border-b border-[#1f1f28] flex flex-col transition-all duration-300 lg:border-b-0 ${
                    selectedRepository ? 'w-full flex-1 lg:flex-none lg:w-96 lg:border-r' : 'w-full flex-1'
                }`}
            >
                <div className="flow-page-header">
                    <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                        <span>Settings</span>
                        <ChevronRight size={13} />
                        <span>Application</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="flow-page-title truncate">
                                {activeRepository?.title || activeApplication.title}
                            </h1>
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                                    Main repository
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-green-400" />
                                    GitHub connected
                                </span>
                            </div>
                        </div>
                        {isLoading && <Loader2 size={18} className="mt-1 animate-spin text-gray-400" />}
                    </div>
                    {(notice || apiError) && (
                        <div className="mt-4 space-y-2">
                            {notice && (
                                <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs text-green-300">
                                    <CheckCircle2 size={14} />
                                    {notice}
                                </div>
                            )}
                            {apiError && (
                                <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
                                    <TriangleAlert size={14} />
                                    {apiError}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-b border-[#1f1f28] p-4 sm:p-6">
                    <h2 className="mb-1 text-lg font-semibold text-white">Registered Repositories</h2>
                    <p className="text-sm text-gray-500">
                        Select the main repository used for this application and manage connected repositories.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoading ? (
                        <div className="rounded-lg border border-[#1f1f28] bg-[#13131a] px-4 py-6 text-center text-sm text-gray-500">
                            Loading repositories...
                        </div>
                    ) : repositories.length === 0 ? (
                        <div className="rounded-lg border border-[#1f1f28] bg-[#13131a] px-4 py-6 text-center text-sm text-gray-500">
                            No registered repositories.
                        </div>
                    ) : (
                        repositories.map((repository) => {
                            const isMain = repository.appId === activeApplication.appId;
                            const isSelected = selectedRepository?.id === repository.id;

                            return (
                                <button
                                    key={repository.id}
                                    type="button"
                                    onClick={() => setSelectedRepositoryId(repository.id)}
                                    className={`group relative w-full rounded-xl p-4 text-left transition-all ${
                                        isSelected
                                            ? 'border border-blue-500/40 bg-[#13131a] shadow-lg'
                                            : 'border border-[#1f1f28] bg-[#13131a] hover:border-[#2f2f38]'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                                            <Github size={23} className="text-white" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex min-w-0 items-center gap-2">
                                                <span className="truncate font-semibold text-white">
                                                    {repository.title}
                                                </span>
                                                {isMain && (
                                                    <span className="rounded border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-xs text-blue-300">
                                                        Main
                                                    </span>
                                                )}
                                            </div>
                                            <div className="truncate font-mono text-xs text-gray-500">
                                                {repository.fullName}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <ChevronRight size={18} className="flex-shrink-0 text-blue-400" />
                                        )}
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <div className="rounded-lg border border-[#1f1f28] bg-[#0a0a0f] p-2">
                                            <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
                                                <GitBranch size={12} />
                                                Branch
                                            </div>
                                            <div className="truncate text-xs font-medium text-white">
                                                {repository.defaultBranch || 'Not set'}
                                            </div>
                                        </div>
                                        <div className="rounded-lg border border-[#1f1f28] bg-[#0a0a0f] p-2">
                                            <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
                                                <CheckCircle2 size={12} />
                                                Status
                                            </div>
                                            <div className="truncate text-xs font-medium text-white">
                                                {repository.connectionStatus || 'ACTIVE'}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                <div className="sticky bottom-0 border-t border-[#1f1f28] bg-[#0a0a0f] p-4">
                    <button
                        type="button"
                        onClick={() => navigate('/app/registration')}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-white transition-colors hover:bg-blue-700"
                    >
                        <Plus size={18} />
                        Add Repository
                    </button>
                </div>
            </aside>

            {selectedRepository && (
                <main className="absolute inset-0 z-20 overflow-y-auto bg-[#060609] p-4 shadow-2xl shadow-black/40 sm:p-6 lg:static lg:z-auto lg:flex-1 lg:border-l lg:border-[#1f1f28] lg:shadow-none">
                    <div className="mx-auto max-w-4xl space-y-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <div className="mb-1 flex min-w-0 items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedRepositoryId(null);
                                        }}
                                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#1f1f28] bg-[#0a0a0f] text-gray-400 transition-colors hover:border-blue-500/30 hover:text-white"
                                        title="Back to repositories"
                                        aria-label="Back to repositories"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <h2 className="flow-page-title truncate">Repository Details</h2>
                                </div>
                                <p className="text-sm text-gray-500">Manage repository configuration</p>
                            </div>
                            {selectedIsMain && (
                                <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-300">
                                    <Star size={14} />
                                    Main repository
                                </span>
                            )}
                        </div>

                        <div className="rounded-xl border border-[#1f1f28] bg-[#0a0a0f] p-4 sm:p-6">
                            <div className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm text-gray-400">Display Title</label>
                                    <input
                                        value={selectedDraftTitle}
                                        onChange={(event) =>
                                            handleTitleChange(selectedRepository.id, event.target.value)
                                        }
                                        className="w-full rounded-lg border border-[#1f1f28] bg-[#13131a] px-4 py-3 text-white outline-none transition-colors placeholder:text-gray-600 focus:border-blue-500/30"
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        This title will be shown in the header instead of the repository name.
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm text-gray-400">GitHub Repository</label>
                                    <div className="flex items-center gap-3 rounded-lg border border-[#1f1f28] bg-[#13131a] px-4 py-3 font-mono text-sm text-white">
                                        <Github size={18} className="text-gray-400" />
                                        <span className="truncate">{selectedRepository.fullName}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm text-gray-400">Default Branch</label>
                                    <div className="flex items-center gap-3 rounded-lg border border-[#1f1f28] bg-[#13131a] px-4 py-3 font-mono text-sm text-white">
                                        <GitBranch size={18} className="text-gray-400" />
                                        <span>{selectedRepository.defaultBranch || 'Not set'}</span>
                                    </div>
                                </div>

                                <div className="border-t border-[#1f1f28] pt-5">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <div className="text-white">Main Repository</div>
                                            <div className="text-sm text-gray-500">
                                                Set as the primary repository for this application
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleSetMain(selectedRepository)}
                                            disabled={selectedIsPending || selectedIsMain}
                                            className={`inline-flex h-9 w-16 flex-shrink-0 items-center rounded-full p-1 transition-colors disabled:cursor-not-allowed ${
                                                selectedIsMain ? 'bg-blue-600' : 'bg-[#2f2f38] hover:bg-[#3a3a44]'
                                            } ${selectedIsMain ? 'justify-end' : 'justify-start'}`}
                                            title={selectedIsMain ? 'Main repository' : 'Set as main repository'}
                                        >
                                            <span className="h-7 w-7 rounded-full bg-white shadow-sm transition-transform" />
                                        </button>
                                    </div>
                                </div>

                                <div className="border-t border-[#1f1f28] pt-5">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <div className="text-white">Auto Sync</div>
                                            <div className="text-sm text-gray-500">
                                                Automatically refresh API inventory from GitHub merge pushes
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleAutoSyncChange(
                                                    selectedRepository,
                                                    !(selectedRepository.autoSyncEnabled ?? true),
                                                )
                                            }
                                            disabled={
                                                selectedIsPending ||
                                                autoSyncPendingId === selectedRepository.id ||
                                                selectedRepository.connectionStatus !== 'ACTIVE'
                                            }
                                            className={`inline-flex h-9 w-16 flex-shrink-0 items-center rounded-full p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                                selectedRepository.autoSyncEnabled ?? true
                                                    ? 'justify-end bg-blue-600'
                                                    : 'justify-start bg-[#2f2f38] hover:bg-[#3a3a44]'
                                            }`}
                                            title={
                                                selectedRepository.connectionStatus === 'ACTIVE'
                                                    ? 'Toggle Auto Sync'
                                                    : 'Auto Sync requires an active GitHub connection'
                                            }
                                        >
                                            {autoSyncPendingId === selectedRepository.id ? (
                                                <Loader2 size={18} className="mx-auto animate-spin text-white" />
                                            ) : (
                                                <span className="h-7 w-7 rounded-full bg-white shadow-sm" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(selectedRepository)}
                                disabled={selectedIsPending}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300 transition-colors hover:border-red-500/30 hover:bg-red-500/15 disabled:opacity-50"
                            >
                                <Trash2 size={18} />
                                Delete Application
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveSelectedRepository}
                                disabled={selectedIsPending || !selectedHasTitleChange || !selectedDraftTitle.trim()}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {selectedIsPending ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Save size={18} />
                                )}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </main>
            )}

            {deleteTarget && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-xl border border-[#1f1f28] bg-[#0a0a0f] p-6 shadow-2xl shadow-black/40">
                        <div className="mb-4 flex items-start gap-3">
                            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10">
                                <TriangleAlert size={20} className="text-red-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Delete application?</h3>
                                <p className="mt-2 text-sm leading-6 text-gray-400">
                                    This will delete {deleteTarget.title} and its FlowOps data, including environments,
                                    repositories, API inventory, test cases, scenarios, and execution history.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                disabled={pendingId === deleteTarget.id}
                                className="rounded-lg border border-[#1f1f28] bg-[#13131a] px-4 py-2 text-sm text-gray-300 transition-colors hover:text-white disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteApplication(deleteTarget)}
                                disabled={pendingId === deleteTarget.id}
                                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {pendingId === deleteTarget.id && <Loader2 size={15} className="animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
