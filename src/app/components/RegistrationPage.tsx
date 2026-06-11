import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Github, 
  CheckCircle2, 
  Search,
  GitBranch,
  FileCode,
  Loader2,
  ChevronDown,
  Lock,
  Unlock,
  Calendar,
  Check
} from 'lucide-react';
import {
  DEFAULT_ENVIRONMENT_BASE_URL,
  flowOpsApi,
  rememberAppId,
  rememberAppTitle,
  type ScanResultResponse,
} from '../api/flowOpsClient';
import { useTestContext } from '../contexts/TestContext';

interface Repository {
  id: string;
  fullName: string;
  name: string;
  owner: string;
  visibility: 'public' | 'private' | 'external';
  lastUpdated: string;
}

const REGISTERED_REPOSITORIES_KEY = 'flowOps.registeredRepositories';

interface StoredRegisteredRepository {
  id: number;
  projectId: number;
  appId: number;
  title: string;
  fullName: string;
  repositoryUrl?: string;
  defaultBranch?: string;
  selectedBranches?: string[];
  connectionStatus?: string;
}

const rememberRegisteredRepository = (repository: StoredRegisteredRepository) => {
  const existing = JSON.parse(localStorage.getItem(REGISTERED_REPOSITORIES_KEY) || '[]') as StoredRegisteredRepository[];
  const next = [
    repository,
    ...existing.filter((item) => item.id !== repository.id && item.fullName !== repository.fullName),
  ];
  localStorage.setItem(REGISTERED_REPOSITORIES_KEY, JSON.stringify(next));
};

const parseRepository = (fullName: string): Repository | null => {
  const normalized = fullName.trim().replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '');
  const [owner, name, ...rest] = normalized.split('/').filter(Boolean);
  if (!owner || !name || rest.length > 0) return null;
  return {
    id: `${owner}/${name}`,
    fullName: `${owner}/${name}`,
    owner,
    name,
    visibility: 'external',
    lastUpdated: 'External repository',
  };
};

const uniqueBranchNames = (branches: Array<string | undefined>) =>
  Array.from(new Set(branches.map((branch) => branch?.trim()).filter((branch): branch is string => Boolean(branch))));

const environmentNameForBranch = (branch: string) => {
  if (branch.length <= 30) return branch;
  const leafName = branch.split('/').filter(Boolean).pop();
  return (leafName || branch).slice(0, 30);
};

const syncSelectedBranchEnvironments = async (
  appId: number,
  repositoryId: number,
  branchNames: string[],
) => {
  const existingEnvironments = await flowOpsApi.listEnvironments(appId).catch(() => []);
  const normalizedRepositoryEnvironments = existingEnvironments.filter(
    (environment) => !environment.repositoryId || environment.repositoryId === repositoryId,
  );

  await Promise.all(
    branchNames.map(async (branchName) => {
      const existing = normalizedRepositoryEnvironments.find(
        (environment) => environment.branchName === branchName || environment.name === branchName,
      );

      if (!existing) {
        await flowOpsApi.createEnvironment(appId, {
          name: environmentNameForBranch(branchName),
          branchName,
          repositoryId,
          baseUrl: DEFAULT_ENVIRONMENT_BASE_URL,
          authType: 'NONE',
          defaultTestLevel: 'SMOKE',
          defaultTestLevelSource: 'MANUAL',
        } as any);
        return;
      }

      if (!existing.repositoryId || existing.branchName !== branchName) {
        await flowOpsApi.updateEnvironment(existing.id, {
          name: existing.name || environmentNameForBranch(branchName),
          branchName,
          repositoryId,
          baseUrl: existing.baseUrl || DEFAULT_ENVIRONMENT_BASE_URL,
          authType: existing.authType || 'NONE',
          defaultTestLevel: existing.defaultTestLevel || 'SMOKE',
          defaultTestLevelSource: 'MANUAL',
        } as any);
      }
    }),
  );
};

export function RegistrationPage() {
  const navigate = useNavigate();
  const { setActiveApplication } = useTestContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [customBranch, setCustomBranch] = useState('');
  const [repoFullName, setRepoFullName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [registeredProjectId, setRegisteredProjectId] = useState<number | null>(null);
  const [registeredAppId, setRegisteredAppId] = useState<number | null>(null);
  const [registeredRepositoryId, setRegisteredRepositoryId] = useState<number | null>(null);
  const [scanResults, setScanResults] = useState<ScanResultResponse[]>([]);
  const [selectedResultBranch, setSelectedResultBranch] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const steps = [
    { number: 1, label: 'Connect GitHub', completed: isGithubConnected },
    { number: 2, label: 'Select Repository', completed: selectedRepo !== null },
    { number: 3, label: 'Scan API', completed: scanComplete },
  ];

  const externalRepo = parseRepository(searchQuery);
  const filteredRepos = externalRepo ? [externalRepo] : [];

  const resetScanState = () => {
    setScanComplete(false);
    setScanResults([]);
    setSelectedResultBranch(null);
    setRegisteredProjectId(null);
    setRegisteredAppId(null);
    setRegisteredRepositoryId(null);
  };

  const handleGithubConnect = () => {
    setIsGithubConnected(true);
    setTimeout(() => setCurrentStep(2), 500);
  };

  const branchSelectionOrDefault = () => {
    return uniqueBranchNames(selectedBranches);
  };

  const handleRepoSelect = async (repo: Repository) => {
    setRepoFullName(repo.fullName);
    if (!repo) {
      setApiError('Repository must be formatted as owner/repository or https://github.com/owner/repository.');
      return;
    }
    setApiError(null);
    resetScanState();
    setSelectedRepo(repo);
    setSelectedBranches([]);
    setAvailableBranches([]);
    setShowRepoDropdown(false);
    setTimeout(() => setCurrentStep(3), 500);
    setIsLoadingBranches(true);
    try {
      const app = await flowOpsApi.createApp({
        name: repo.name,
        repoUrl: `https://github.com/${repo.fullName}`,
      });
      rememberAppId(app.id);
      rememberAppTitle(repo.name);
      setActiveApplication({ appId: app.id, title: repo.name });
      setRegisteredAppId(app.id);
      await flowOpsApi.setMainApp(app.id, { title: repo.name }).catch(() => undefined);

      const project = await flowOpsApi.ensureProject();
      setRegisteredProjectId(project.id);

      const repository = await flowOpsApi.registerRepository(project.id, {
        fullName: repo.fullName,
        appId: app.id,
      });
      rememberRegisteredRepository({
        id: repository.id,
        projectId: project.id,
        appId: app.id,
        title: repo.name,
        fullName: repo.fullName,
        repositoryUrl: repository.repositoryUrl || `https://github.com/${repo.fullName}`,
        defaultBranch: repository.defaultBranch,
        selectedBranches: [],
        connectionStatus: repository.connectionStatus || 'ACTIVE',
      });
      setRegisteredRepositoryId(repository.id);

      const branches = await flowOpsApi.listRepositoryBranches(project.id, repository.id);
      const branchNames = uniqueBranchNames(branches.map((branch) => branch.name || branch.branchName));
      const selectedFromApi = uniqueBranchNames(
        branches
          .filter((branch) => branch.selected || branch.isDefault || branch.defaultBranch)
          .map((branch) => branch.name || branch.branchName),
      );
      setAvailableBranches(branchNames);
      setSelectedBranches(selectedFromApi);
      rememberRegisteredRepository({
        id: repository.id,
        projectId: project.id,
        appId: app.id,
        title: repo.name,
        fullName: repo.fullName,
        repositoryUrl: repository.repositoryUrl || `https://github.com/${repo.fullName}`,
        defaultBranch: repository.defaultBranch || selectedFromApi[0] || branchNames[0],
        selectedBranches: selectedFromApi,
        connectionStatus: repository.connectionStatus || 'ACTIVE',
      });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Branch list request failed.');
      setAvailableBranches([]);
      setSelectedBranches([]);
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const handleScan = async () => {
    if (!selectedRepo) return;
    const branchesForRegistration = branchSelectionOrDefault();
    if (branchesForRegistration.length === 0) {
      setApiError('Select at least one branch before scanning.');
      return;
    }
    setSelectedBranches(branchesForRegistration);
    setIsScanning(true);
    setApiError(null);
    try {
      const fullName = selectedRepo.fullName;
      let appId = registeredAppId;
      let projectId = registeredProjectId;
      let repositoryId = registeredRepositoryId;

      if (!projectId) {
        const project = await flowOpsApi.ensureProject();
        setRegisteredProjectId(project.id);
        projectId = project.id;
      }

      if (!appId) {
        const app = await flowOpsApi.createApp({
          name: selectedRepo.name,
          repoUrl: `https://github.com/${fullName}`,
          defaultBranch: branchesForRegistration[0],
          branches: branchesForRegistration,
        });
        rememberAppId(app.id);
        rememberAppTitle(selectedRepo.name);
        setActiveApplication({ appId: app.id, title: selectedRepo.name });
        setRegisteredAppId(app.id);
        appId = app.id;
      }

      await flowOpsApi.setMainApp(appId, { title: selectedRepo.name }).catch(() => undefined);

      if (!repositoryId) {
        const repository = await flowOpsApi.registerRepository(projectId, {
          fullName,
          appId,
          selectedBranches: branchesForRegistration,
        });
        await flowOpsApi.setMainApp(appId, { title: selectedRepo.name }).catch((error) => {
          console.warn('[Registration] failed to set main app after repository registration', error);
        });
        rememberRegisteredRepository({
          id: repository.id,
          projectId,
          appId,
          title: selectedRepo.name,
          fullName,
          repositoryUrl: repository.repositoryUrl || `https://github.com/${fullName}`,
          defaultBranch: repository.defaultBranch || branchesForRegistration[0],
          selectedBranches: branchesForRegistration,
          connectionStatus: repository.connectionStatus || 'ACTIVE',
        });
        setRegisteredRepositoryId(repository.id);
        repositoryId = repository.id;
      } else {
        rememberRegisteredRepository({
          id: repositoryId,
          projectId,
          appId,
          title: selectedRepo.name,
          fullName,
          repositoryUrl: `https://github.com/${fullName}`,
          defaultBranch: branchesForRegistration[0],
          selectedBranches: branchesForRegistration,
          connectionStatus: 'ACTIVE',
        });
      }

      await syncSelectedBranchEnvironments(appId, repositoryId, branchesForRegistration);
      const results = await flowOpsApi.scanRepository(projectId, repositoryId, branchesForRegistration);
      setScanResults(results);
      setSelectedResultBranch(results[0]?.branchName || branchesForRegistration[0] || null);
      setIsScanning(false);
      setScanComplete(true);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Repository scan failed.');
      setScanResults([]);
      setIsScanning(false);
      setScanComplete(false);
    }
  };

  const handleGenerateInventory = () => {
    navigate('/qc/api');
  };

  const selectedScanResult =
    scanResults.find((result) => result.branchName === selectedResultBranch) ||
    scanResults[0];

  const toggleBranch = (branch: string) => {
    setSelectedBranches((prev) => {
      if (prev.includes(branch)) {
        return prev.filter((item) => item !== branch);
      }
      return [...prev, branch];
    });
  };

  const addCustomBranch = () => {
    const branch = customBranch.trim();
    if (!branch) return;
    setSelectedBranches((prev) => (prev.includes(branch) ? prev : [...prev, branch]));
    setAvailableBranches((prev) => (prev.includes(branch) ? prev : [...prev, branch]));
    setCustomBranch('');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#060609] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-white text-2xl mb-1">Application Registration</h1>
        </div>

        {/* Step Progress Indicator */}
        <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl px-8 py-7">
          <div className="grid grid-cols-[1fr_96px_1fr_96px_1fr] items-start">
            {steps.map((step, index) => (
              <Fragment key={step.number}>
                <div className="flex flex-col items-center text-center">
                  <div className="h-10 flex items-center justify-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        step.completed
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : currentStep === step.number
                          ? 'border-blue-500 text-blue-500 bg-blue-500/10'
                          : 'border-[#1f1f28] text-gray-500 bg-[#13131a]'
                      }`}
                    >
                      {step.completed ? (
                        <Check size={20} />
                      ) : (
                        <span className="font-semibold">{step.number}</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`mt-3 min-h-10 text-sm leading-5 ${
                      step.completed || currentStep === step.number
                        ? 'text-white'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 mt-5 transition-all ${
                      step.completed ? 'bg-blue-500' : 'bg-[#1f1f28]'
                    }`}
                  />
                )}
              </Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: GitHub Connection */}
        <div
          className={`bg-[#0a0a0f] border rounded-xl p-6 transition-all ${
            currentStep >= 1 ? 'border-[#1f1f28]' : 'border-[#1f1f28] opacity-50'
          }`}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-white text-lg mb-1">Connect GitHub</h2>
            </div>
            {isGithubConnected && (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                <CheckCircle2 size={16} />
                Connected
              </div>
            )}
          </div>

          {!isGithubConnected ? (
            <button
              onClick={handleGithubConnect}
              className="flex items-center gap-3 bg-[#13131a] border border-[#1f1f28] rounded-lg px-6 py-3 text-white hover:border-blue-500/30 hover:bg-blue-500/5 transition-all w-full justify-center"
            >
              <Github size={20} />
              <span>Connect GitHub Account</span>
            </button>
          ) : (
            <div className="flex items-center gap-4 bg-[#13131a] border border-[#1f1f28] rounded-lg px-6 py-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Github size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">GitHub Repository Access</div>
              </div>
              <CheckCircle2 size={20} className="text-green-400" />
            </div>
          )}
        </div>

        {/* Step 2: Repository Selection */}
        <div
          className={`bg-[#0a0a0f] border rounded-xl p-6 transition-all ${
            currentStep >= 2 ? 'border-[#1f1f28]' : 'border-[#1f1f28] opacity-50'
          }`}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-white text-lg mb-1">Select Repository</h2>
            </div>
            {selectedRepo && (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                <CheckCircle2 size={16} />
                Selected
              </div>
            )}
          </div>

          <div className="space-y-4">
            {apiError && !scanComplete && (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
                {apiError}
              </div>
            )}

            {/* Repository Dropdown */}
            <div className="relative">
              <button
                onClick={() => currentStep >= 2 && setShowRepoDropdown(!showRepoDropdown)}
                disabled={currentStep < 2}
                className="w-full flex items-center justify-between bg-[#13131a] border border-[#1f1f28] rounded-lg px-4 py-3 text-white hover:border-[#2f2f38] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedRepo ? (
                  <div className="flex items-center gap-3">
                    <FileCode size={18} className="text-blue-400" />
                    <div className="text-left">
                      <div className="text-sm">{selectedRepo.fullName}</div>
                      <div className="text-xs text-gray-500">{selectedRepo.lastUpdated}</div>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500">Select a repository...</span>
                )}
                <ChevronDown size={18} className="text-gray-500" />
              </button>

              {showRepoDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-[#13131a] border border-[#1f1f28] rounded-lg shadow-xl overflow-hidden">
                  {/* Search */}
                  <div className="p-3 border-b border-[#1f1f28]">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        placeholder="owner/repository or https://github.com/owner/repository"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSelectedRepo(null);
                          resetScanState();
                          setApiError(null);
                        }}
                        className="w-full bg-[#0a0a0f] border border-[#1f1f28] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/30"
                      />
                    </div>
                  </div>

                  {/* Repository List */}
                  <div className="max-h-64 overflow-y-auto">
                    {filteredRepos.map((repo) => (
                      <button
                        key={repo.id}
                        onClick={() => handleRepoSelect(repo)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1f1f28] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileCode size={16} className="text-blue-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">
                              {repo.fullName}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                {repo.visibility === 'private' ? (
                                  <Lock size={12} />
                                ) : (
                                  <Unlock size={12} />
                                )}
                                {repo.visibility}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {repo.lastUpdated}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    {searchQuery.trim() && filteredRepos.length === 0 && (
                      <div className="px-4 py-3 text-sm text-yellow-300">
                        Use owner/repository format.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Branch Selection */}
            {selectedRepo && (
              <div className="relative">
                <label className="block text-sm text-gray-400 mb-2">Branches</label>
                <button
                  onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                  disabled={isLoadingBranches}
                  className="w-full flex items-center justify-between bg-[#13131a] border border-[#1f1f28] rounded-lg px-4 py-3 text-white hover:border-[#2f2f38] transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    {isLoadingBranches ? (
                      <Loader2 size={16} className="text-blue-400 animate-spin" />
                    ) : (
                      <GitBranch size={16} className="text-gray-400" />
                    )}
                    <span className="text-sm">
                      {isLoadingBranches
                        ? 'Loading branches...'
                        : selectedBranches.length > 0
                        ? selectedBranches.join(', ')
                        : 'Select branches'}
                    </span>
                  </div>
                  <ChevronDown size={18} className="text-gray-500" />
                </button>

                {showBranchDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-[#13131a] border border-[#1f1f28] rounded-lg shadow-xl overflow-hidden">
                    <div className="p-3 border-b border-[#1f1f28]">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customBranch}
                          onChange={(event) => setCustomBranch(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              addCustomBranch();
                            }
                          }}
                          placeholder="Add branch name"
                          className="flex-1 bg-[#0a0a0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/30"
                        />
                        <button
                          onClick={addCustomBranch}
                          disabled={!customBranch.trim()}
                          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    {[...new Set([...availableBranches, ...selectedBranches])].map((branch) => (
                      <button
                        key={branch}
                        onClick={() => toggleBranch(branch)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1f1f28] transition-colors text-left"
                      >
                        <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                          selectedBranches.includes(branch)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-500'
                        }`}>
                          {selectedBranches.includes(branch) && <Check size={12} className="text-white" />}
                        </span>
                        <span className="text-sm text-white">{branch}</span>
                      </button>
                    ))}
                    {!isLoadingBranches && availableBranches.length === 0 && selectedBranches.length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        No branches returned from the repository API.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedRepo && !scanComplete && (
            <button
              onClick={handleScan}
              disabled={isScanning || isLoadingBranches}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isScanning ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Scanning Repository...
                </>
              ) : (
                'Scan Repository'
              )}
            </button>
          )}
        </div>

        {/* Step 3: Scan Results */}
        {scanComplete && (
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-white text-lg mb-1">Scan Results</h2>
              </div>
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                <CheckCircle2 size={16} />
                Complete
              </div>
            </div>

            {apiError && (
              <div className="mb-6 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
                Backend scan failed: {apiError}
              </div>
            )}

            {scanResults.length > 0 && (
              <div className="mb-6 flex items-center gap-2 overflow-x-auto">
                {scanResults.map((result) => (
                  <button
                    key={result.branchName}
                    onClick={() => setSelectedResultBranch(result.branchName)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      (selectedResultBranch || scanResults[0]?.branchName) === result.branchName
                        ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                        : 'border-[#1f1f28] bg-[#13131a] text-gray-400 hover:text-white'
                    }`}
                  >
                    <GitBranch size={14} />
                    {result.branchName}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* OpenAPI Detection */}
              <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-sm text-gray-400">OpenAPI Specification</div>
                  <CheckCircle2 size={18} className="text-green-400" />
                </div>
                <div className="text-white font-medium mb-1">{selectedScanResult?.specToolName || 'Detected'}</div>
                <div className="text-xs text-gray-500">
                  {selectedScanResult?.specToolVersion
                    ? `Version ${selectedScanResult.specToolVersion}`
                    : 'Version not reported'}
                </div>
                <div className="mt-3 text-xs text-blue-400">
                  {selectedScanResult?.detectedEndpointCount ?? 0} endpoints found
                </div>
              </div>

              {/* Framework Detection */}
              <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-sm text-gray-400">Framework</div>
                  <CheckCircle2 size={18} className="text-green-400" />
                </div>
                <div className="text-white font-medium mb-1">{selectedScanResult?.frameworkName || 'Unknown'}</div>
                <div className="text-xs text-gray-500">
                  {selectedScanResult?.frameworkVersion ? `Version ${selectedScanResult.frameworkVersion}` : 'No version reported'}
                </div>
                <div className="mt-3 text-xs text-blue-400">
                  REST Controllers: {selectedScanResult?.restControllerCount ?? 0}
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4 mb-6">
              <div className="text-sm text-white mb-3">Detected Endpoints</div>
              <div className="space-y-2">
                {Object.entries(selectedScanResult?.methodEndpointCounts || {}).map(([method, count]) => (
                  <div key={method} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{method} endpoints</span>
                    <span className="text-white font-mono">{count}</span>
                  </div>
                ))}
                {!selectedScanResult?.methodEndpointCounts && (
                  <div className="text-xs text-gray-500">No method summary returned.</div>
                )}
              </div>
            </div>

            {/* Generate Inventory CTA */}
            <button
              onClick={handleGenerateInventory}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              Generate API Inventory
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
