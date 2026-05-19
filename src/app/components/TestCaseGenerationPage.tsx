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
  Clock,
  Save
} from 'lucide-react';
import { useTestContext } from '../contexts/TestContext';
import {
  DEFAULT_REQUESTER,
  flowOpsApi,
  type ApiInventoryResponse,
  type EnvironmentResponse,
  type RepositoryResponse,
  type TestCaseResponse,
  type TestGenerationDraftResponse,
  type TestLevel,
} from '../api/flowOpsClient';
import { filterEnvironmentsForBranchScope, filterInventoryForEnvironment, findDefaultBranchEnvironment, inventoryQueryParamsForScope } from '../utils/environmentScope';

interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  path: string;
  domain: string;
  coverage: number;
  testCount: number;
  lastUpdated: string;
  repositoryId?: number;
  branchName?: string;
  requestSchema?: unknown;
  responseSchema?: unknown;
}

interface TestCase {
  id: string;
  draftId?: number;
  name: string;
  type: 'success' | 'validation' | 'auth' | 'performance' | 'edge' | 'error';
  backendType?: string;
  testLevel?: TestLevel;
  apiId: string;
  role?: string;
  stateCondition?: string;
  dataVariant?: string;
  status?: 'new' | 'duplicate' | 'existing';
  isEdited?: boolean;
  description?: string;
  expectedResult?: string;
  requestPreview?: string;
  requestSpec?: string;
  assertionSpec?: string;
  validationRules?: string[];
}

const userRoles = ['Admin', 'User', 'Guest', 'Moderator'];
const stateConditions = ['Logged In', 'Token Expired', 'Valid Token', 'Resource Exists', 'Rate Limited'];
const dataVariants = ['Valid Input', 'Invalid Input', 'Boundary Value', 'Null / Empty'];
const REGISTERED_REPOSITORIES_KEY = 'flowOps.registeredRepositories';


const methodColors = {
  GET: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  POST: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  PUT: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  DELETE: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  PATCH: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  OPTIONS: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  HEAD: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
};

const typeColors = {
  success: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', label: 'Success' },
  validation: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', label: 'Validation' },
  auth: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Authorization' },
  performance: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', label: 'Performance' },
  edge: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', label: 'Edge' },
  error: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Error' },
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

const mapBackendType = (type?: string): TestCase['type'] => {
  const normalized = (type || '').toLowerCase();
  if (normalized.includes('auth')) return 'auth';
  if (normalized.includes('performance') || normalized.includes('load') || normalized.includes('latency')) return 'performance';
  if (normalized.includes('edge') || normalized.includes('boundary')) return 'edge';
  if (normalized.includes('error') || normalized.includes('negative')) return 'error';
  if (normalized.includes('validation') || normalized.includes('invalid')) return 'validation';
  return 'success';
};

const stringifySpec = (value?: unknown) => {
  if (value === undefined || value === null || value === '') return undefined;
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const generationStillRunning = (status?: string | null) => {
  const normalized = String(status || '').toUpperCase();
  return ['REQUESTED', 'QUEUED', 'GENERATING', 'IN_PROGRESS', 'RUNNING', 'PENDING'].includes(normalized);
};

const formatDomainLabel = (domain: string) => (domain === '__empty__' || !domain ? 'Unassigned' : domain);

type StoredRegisteredRepository = RepositoryResponse & {
  title?: string;
  selectedBranches?: string[];
};

const readStoredRepositories = (): StoredRegisteredRepository[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(REGISTERED_REPOSITORIES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const titleForAppId = (appId: number, repositories: RepositoryResponse[], storedRepositories: StoredRegisteredRepository[]) => {
  const repository = repositories.find((item) => item.appId === appId);
  const stored = storedRepositories.find((item) => item.appId === appId);
  return repository?.appTitle || stored?.title || stored?.appTitle || repository?.fullName?.split('/').pop() || stored?.fullName?.split('/').pop() || `Application ${appId}`;
};

const mergeRepositoryScope = (repository: RepositoryResponse | undefined, stored: StoredRegisteredRepository | undefined) => ({
  ...stored,
  ...repository,
  defaultBranch: repository?.defaultBranch || stored?.defaultBranch,
  selectedBranches: stored?.selectedBranches,
});

const normalizeApiInventory = (inventory: ApiInventoryResponse): ApiEndpoint => {
  return {
    id: String(inventory.id),
    method: (inventory.method === 'TRACE' ? 'GET' : inventory.method) as ApiEndpoint['method'],
    path: inventory.endpointPath,
    domain: inventory.domainTag?.trim() || '',
    coverage: Math.round(inventory.coveragePercentage ?? 0),
    testCount: inventory.totalTestCount ?? 0,
    lastUpdated: formatRelativeTime(inventory.updatedAt || inventory.modifiedAt || inventory.lastModifiedAt || inventory.createdAt),
    repositoryId: inventory.repositoryId,
    branchName: inventory.branchName,
    requestSchema: inventory.requestSchema,
    responseSchema: inventory.responseSchema,
  };
};

const normalizeTestCase = (testCase: TestCaseResponse): TestCase => ({
  id: String(testCase.id),
  draftId: testCase.draftId,
  name: testCase.name || testCase.title || `Test Case #${testCase.id}`,
  type: mapBackendType(testCase.type),
  backendType: testCase.type,
  testLevel: testCase.testLevel,
  apiId: String(testCase.apiId || testCase.apiInventoryId || testCase.selectedEndpoint?.id || ''),
  role: testCase.userRole || testCase.role,
  stateCondition: testCase.stateCondition,
  dataVariant: testCase.dataVariant,
  status: 'existing',
  description: testCase.description,
  expectedResult: testCase.expectedResult || testCase.expectedSpec,
  requestPreview: stringifySpec(testCase.requestPreview),
  requestSpec: testCase.requestSpec,
  assertionSpec: testCase.assertionSpec,
  validationRules: Array.isArray(testCase.validationRules)
    ? testCase.validationRules.map(String)
    : undefined,
});

const normalizeDraft = (draft: TestGenerationDraftResponse): TestCase => {
  const draftId = Number(draft.draftId ?? draft.id);
  const stateCondition = Array.isArray(draft.edgeStates)
    ? draft.edgeStates.join(', ')
    : draft.stateCondition || draft.edgeState || draft.edgeStates;
  const requestSpec = draft.requestSpec || stringifySpec(draft.requestPreview);
  const assertionSpec = draft.assertionSpec || (Array.isArray(draft.validationRules)
    ? JSON.stringify({ assertions: draft.validationRules }, null, 2)
    : stringifySpec(draft.validationRules));

  return {
    id: `draft-${Number.isFinite(draftId) ? draftId : crypto.randomUUID()}`,
    draftId: Number.isFinite(draftId) ? draftId : undefined,
    name: draft.name || draft.title || `AI Draft #${Number.isFinite(draftId) ? draftId : ''}`.trim(),
    type: mapBackendType(draft.type),
    backendType: draft.type,
    testLevel: draft.testLevel,
    apiId: String(draft.apiId || draft.apiInventoryId || ''),
    role: draft.userRole || draft.role,
    stateCondition,
    dataVariant: draft.dataVariant,
    status: draft.duplicate ? 'duplicate' : 'new',
    description: draft.description,
    expectedResult: draft.expectedResult,
    requestPreview: requestSpec,
    requestSpec,
    assertionSpec,
    validationRules: Array.isArray(draft.validationRules)
      ? draft.validationRules.map(String)
      : undefined,
  };
};

export function TestCaseGenerationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeApplication, setSelectedAPIs, setTestContext } = useTestContext();

  // Modal & API Selection
  const [showApiModal, setShowApiModal] = useState(false);
  const [apis, setApis] = useState<ApiEndpoint[]>([]);
  const [isLoadingApis, setIsLoadingApis] = useState(true);
  const [isProjectLoading, setIsProjectLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [mainApplicationId, setMainApplicationId] = useState<number | null>(null);
  const [activeRepositoryId, setActiveRepositoryId] = useState<number | null>(null);
  const [environments, setEnvironments] = useState<EnvironmentResponse[]>([]);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('all');
  const [selectedApiId, setSelectedApiId] = useState<string | null>(null);
  const [selectedApiIdsForGeneration, setSelectedApiIdsForGeneration] = useState<string[]>([]);
  const [pendingApiIdsForGeneration, setPendingApiIdsForGeneration] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [expandedGeneratedApiIds, setExpandedGeneratedApiIds] = useState<string[]>([]);

  // Context Builder State
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Admin', 'User']);
  const [selectedStates, setSelectedStates] = useState<string[]>(['Logged In', 'Token Expired']);
  const [selectedDataVariants, setSelectedDataVariants] = useState<string[]>(['Valid Input', 'Invalid Input']);

  // Tests State
  const [existingTests, setExistingTests] = useState<TestCase[]>([]);
  const [generatedTests, setGeneratedTests] = useState<TestCase[]>([]);
  const [selectedGeneratedTestIds, setSelectedGeneratedTestIds] = useState<string[]>([]);
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [isSavingTests, setIsSavingTests] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  // Panel State
  const [rightPanelMode, setRightPanelMode] = useState<'existing' | 'comparison' | 'generated' | 'hidden'>('hidden');

  useEffect(() => {
    let active = true;

    flowOpsApi
      .ensureProject()
      .then(async (project) => {
        const mainApplication = await flowOpsApi.resolveMainApplication();
        const repositories = await flowOpsApi.listRepositories(project.id).catch(() => [] as RepositoryResponse[]);
        const storedRepositories = readStoredRepositories();
        let selectedApplication = mainApplication;
        let items = await flowOpsApi.listEnvironments(mainApplication.appId).catch(() => [] as EnvironmentResponse[]);
        console.info('[TestCaseGeneration] environment candidates', {
          resolvedMainApplication: mainApplication,
          activeApplication,
          selectedApplication,
          environmentCount: items.length,
          environments: items.map((environment) => ({
            id: environment.id,
            appId: environment.appId,
            name: environment.name,
            branchName: environment.branchName,
            repositoryId: environment.repositoryId,
          })),
        });
        return { project, selectedApplication, items, repositories, storedRepositories };
      })
      .then(({ project, selectedApplication, items, repositories, storedRepositories }) => {
        if (!active) return;
        const mainRepository =
          mergeRepositoryScope(
            repositories.find((repository) => repository.appId === selectedApplication.appId),
            storedRepositories.find((repository) => repository.appId === selectedApplication.appId),
          );

        setProjectId(project.id);
        setMainApplicationId(selectedApplication.appId);
        setActiveRepositoryId(mainRepository?.id ? Number(mainRepository.id) : null);
        const scopedItems = filterEnvironmentsForBranchScope(items, mainRepository);
        setEnvironments(scopedItems);
        setSelectedEnvironmentId(String(findDefaultBranchEnvironment(scopedItems, mainRepository?.defaultBranch)?.id ?? 'all'));
      })
      .catch((error) => {
        if (!active) return;
        setProjectId(null);
        setActiveRepositoryId(null);
        setEnvironments([]);
        setApiError(error instanceof Error ? error.message : 'Failed to load project settings.');
      })
      .finally(() => {
        if (active) setIsProjectLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeApplication.appId, activeApplication.title]);

  useEffect(() => {
    let active = true;
    const selectedEnvironment =
      selectedEnvironmentId === 'all'
        ? null
        : environments.find((environment) => String(environment.id) === selectedEnvironmentId) || null;

    if (!projectId) {
      if (!isProjectLoading) {
        // Project loading finished but no project found — show empty state
        setApis([]);
        setExistingTests([]);
        setIsLoadingApis(false);
      }
      // Still loading project — keep isLoadingApis true
      return;
    }

    setIsLoadingApis(true);
    setSelectedApiId(null);
    setSelectedApiIdsForGeneration([]);
    setPendingApiIdsForGeneration([]);
    setGeneratedTests([]);
    setSelectedGeneratedTestIds([]);
    setExpandedGeneratedApiIds([]);
    setSelectedDomain('all');
    const scopedRepositoryId = selectedEnvironment?.repositoryId ?? activeRepositoryId;
    if (!scopedRepositoryId) {
      setApis([]);
      setExistingTests([]);
      setApiError('No repository is linked to the selected application.');
      setIsLoadingApis(false);
      return;
    }

    const params = inventoryQueryParamsForScope(selectedEnvironment, activeRepositoryId);

    flowOpsApi
      .listInventories(projectId, params)
      .then(async (inventory) => {
        if (!active) return;
        const scopedInventory = filterInventoryForEnvironment(inventory.items, selectedEnvironment, scopedRepositoryId);
        const normalized = scopedInventory.map(normalizeApiInventory);
        setApis(normalized);
        setApiError(null);

        const testCases = await Promise.all(
          normalized
            .map((api) => Number(api.id))
            .filter((apiId) => Number.isFinite(apiId) && apiId > 0)
            .map((apiId) => flowOpsApi.listTestCasesByApi(apiId).catch(() => [] as TestCaseResponse[])),
        );
        if (active) setExistingTests(testCases.flat().map(normalizeTestCase));

        const requestedApiId = location.state?.selectedApiId ? String(location.state.selectedApiId) : null;
        if (requestedApiId && normalized.some((api) => api.id === requestedApiId)) {
          setSelectedApiId(requestedApiId);
          setSelectedApiIdsForGeneration([requestedApiId]);
          setRightPanelMode('existing');
        }
      })
      .catch((error) => {
        if (!active) return;
        setApis([]);
        setExistingTests([]);
        setApiError(error instanceof Error ? error.message : 'Failed to load APIs.');
      })
      .finally(() => {
        if (active) setIsLoadingApis(false);
      });

    return () => {
      active = false;
    };
  }, [projectId, activeRepositoryId, isProjectLoading, selectedEnvironmentId, environments, location.state]);

  const selectedApi = selectedApiId ? apis.find(a => a.id === selectedApiId) : null;
  const currentApiTests = existingTests.filter(t => t.apiId === selectedApiId);

  const hasEmptyDomain = apis.some((api) => !api.domain);
  const domains = [
    'all',
    ...Array.from(new Set(apis.map((api) => api.domain).filter(Boolean))),
    ...(hasEmptyDomain ? ['__empty__'] : []),
  ];
  const selectedEnvironment = selectedEnvironmentId === 'all'
    ? null
    : environments.find((environment) => String(environment.id) === selectedEnvironmentId) || null;

  const filterApi = (api: ApiEndpoint, query: string) => {
    const matchesSearch =
      api.path.toLowerCase().includes(query.toLowerCase()) ||
      api.domain.toLowerCase().includes(query.toLowerCase());
    const matchesDomain =
      selectedDomain === 'all' ||
      (selectedDomain === '__empty__' ? !api.domain : api.domain === selectedDomain);
    const matchesMethod = methodFilter === 'all' || api.method === methodFilter;
    return matchesSearch && matchesDomain && matchesMethod;
  };

  const filteredApisForModal = apis.filter((api) => filterApi(api, searchQuery));

  const filteredApisForBrowse = apis.filter((api) => filterApi(api, apiSearchQuery));

  const toggleApiSelectionForGeneration = (apiId: string) => {
    setPendingApiIdsForGeneration(prev =>
      prev.includes(apiId) ? prev.filter(id => id !== apiId) : [...prev, apiId]
    );
  };

  const handleApiClick = (apiId: string) => {
    setSelectedApiId(apiId);
    toggleApiSelectionForGeneration(apiId);
  };

  const handleGenerateTests = async (apiIdsForGeneration = selectedApiIdsForGeneration) => {
    const apiIds = apiIdsForGeneration
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
    if (apiIds.length === 0) return;

    setIsGenerating(true);
    setRightPanelMode('hidden');
    setGenerationId(null);
    setGenerationStatus(null);
    setSaveMessage(null);

    const contextSummary = [
      `${apiIds.length} selected APIs`,
      `roles: ${selectedRoles.join(', ') || 'backend defaults'}`,
      `edge states: ${selectedStates.join(', ') || 'backend defaults'}`,
      `data variants: ${selectedDataVariants.join(', ') || 'backend defaults'}`,
    ].join(' | ');

    try {
      const environmentId = selectedEnvironment?.id ?? environments[0]?.id;
      if (!environmentId) {
        throw new Error('Select an environment before generating tests.');
      }

      console.info('[TestCaseGeneration] requesting backend generation', {
        appId: mainApplicationId ?? activeApplication.appId,
        environmentId,
        selectedApiIds: apiIds,
        contextSummary,
      });
      const generation = await flowOpsApi.createTestGeneration({
        appId: mainApplicationId ?? activeApplication.appId,
        environmentId,
        requestedBy: DEFAULT_REQUESTER,
        selectedApiIds: apiIds,
        contextSummary,
        currentCoverage,
      });
      setGenerationId(generation.id);
      setGenerationStatus(generation.status || 'REQUESTED');
      setSaveMessage('AI is generating test case drafts. This can take a little while.');

      let status = await flowOpsApi.getTestGeneration(generation.id).catch(() => generation);
      let drafts = await flowOpsApi.listTestGenerationDrafts(generation.id).catch(() => [] as TestGenerationDraftResponse[]);

      for (let attempt = 0; attempt < 20 && drafts.length === 0 && generationStillRunning(status.status || generation.status); attempt += 1) {
        setGenerationStatus(status.status || generation.status || 'GENERATING');
        setSaveMessage(`Generating drafts... checked ${attempt + 1} time${attempt === 0 ? '' : 's'}.`);
        await wait(2500);
        status = await flowOpsApi.getTestGeneration(generation.id).catch(() => status);
        drafts = await flowOpsApi.listTestGenerationDrafts(generation.id).catch(() => [] as TestGenerationDraftResponse[]);
      }

      console.info('[TestCaseGeneration] backend generation response', {
        generation,
        status,
        draftCount: drafts.length,
        drafts,
      });

      setGenerationStatus(status.status || generation.status || null);
      const backendTests = drafts.map(normalizeDraft).filter((test) => apiIdsForGeneration.includes(test.apiId));
      setGeneratedTests(backendTests);
      setSelectedGeneratedTestIds(backendTests.map((test) => test.id));
      setExpandedGeneratedApiIds(apiIdsForGeneration);
      if (backendTests.length > 0) {
        setSaveMessage(null);
      } else if (generationStillRunning(status.status || generation.status)) {
        setSaveMessage('Generation is still running. Try Generate again in a moment to refresh drafts.');
      } else {
        setSaveMessage(status.status === 'FAILED' ? 'Backend test generation failed.' : 'Backend test generation returned no drafts.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate test cases.';

      setGeneratedTests([]);
      setSelectedGeneratedTestIds([]);
      setExpandedGeneratedApiIds([]);
      setSaveMessage(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmApiSelection = () => {
    const confirmedApiIds = pendingApiIdsForGeneration;
    setShowApiModal(false);
    setSelectedApiIdsForGeneration(confirmedApiIds);
    if (confirmedApiIds.length > 0) {
      handleGenerateTests(confirmedApiIds);
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

  const toggleGeneratedTestSelection = (testId: string) => {
    setSelectedGeneratedTestIds((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId],
    );
  };

  const toggleGeneratedApiSelection = (apiTests: TestCase[]) => {
    const ids = apiTests.map((test) => test.id);
    const allSelected = ids.every((id) => selectedGeneratedTestIds.includes(id));
    setSelectedGeneratedTestIds((prev) =>
      allSelected ? prev.filter((id) => !ids.includes(id)) : Array.from(new Set([...prev, ...ids])),
    );
  };

  const handleSaveSelectedTests = async () => {
    const testsToSave = generatedTests.filter((test) => selectedGeneratedTestIds.includes(test.id));
    if (testsToSave.length === 0) return;

    const invalidTest = testsToSave.find((test) => !test.name.trim());
    if (invalidTest) {
      setSaveMessage('Name is required before saving.');
      return;
    }

    setIsSavingTests(true);
    setSaveMessage(null);
    try {
      const backendDraftsToSave = testsToSave.filter((test) => test.draftId);
      const demoTestsToSave = testsToSave.filter((test) => !test.draftId);
      const result = generationId && backendDraftsToSave.length > 0
        ? await flowOpsApi.saveTestGenerationDrafts(generationId, {
            testCases: backendDraftsToSave.map((test) => ({
              draftId: test.draftId as number,
              name: test.name.trim(),
              description: test.description,
              type: test.backendType,
              testLevel: test.testLevel,
              userRole: test.role,
              stateCondition: test.stateCondition,
              dataVariant: test.dataVariant,
              requestSpec: test.requestSpec || test.requestPreview,
              expectedResult: test.expectedResult?.trim() || '',
              assertionSpec: test.assertionSpec,
            })),
          })
        : [];

      const saved = Array.isArray(result) ? result : result.testCases || result.saved || [];
      const normalizedSaved = saved.length
        ? saved.map(normalizeTestCase)
        : backendDraftsToSave.map((test) => ({ ...test, status: 'existing' as const }));
      const createdDirectDrafts = await Promise.all(
        demoTestsToSave.map((test) =>
          flowOpsApi.createTestCase(mainApplicationId ?? activeApplication.appId, {
            apiId: Number(test.apiId),
            name: test.name.trim(),
            title: test.name.trim(),
            description: test.description,
            type: test.backendType || test.type,
            testLevel: test.testLevel,
            userRole: test.role,
            stateCondition: test.stateCondition,
            dataVariant: test.dataVariant,
            requestSpec: test.requestSpec || test.requestPreview,
            expectedResult: test.expectedResult?.trim() || '',
            assertionSpec: test.assertionSpec,
          }).catch(() => null),
        ),
      );
      const normalizedDemoSaved = demoTestsToSave.map((test, index) => {
        const created = createdDirectDrafts[index];
        return created
          ? normalizeTestCase(created as TestCaseResponse)
          : { ...test, id: `saved-${test.id}`, status: 'existing' as const };
      });
      setExistingTests((prev) => [...normalizedSaved, ...normalizedDemoSaved, ...prev]);
      setGeneratedTests([]);
      setSelectedGeneratedTestIds([]);
      setExpandedGeneratedApiIds([]);
      setGenerationId(null);
      setGenerationStatus(null);
      setRightPanelMode('hidden');
      const savedCount = normalizedSaved.length + normalizedDemoSaved.length;
      setSaveMessage(`${savedCount} test case${savedCount === 1 ? '' : 's'} saved.`);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Failed to save selected test cases.');
    } finally {
      setIsSavingTests(false);
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
  const selectedGeneratedApis = apis.filter((api) => selectedApiIdsForGeneration.includes(api.id));
  const toggleGeneratedApi = (apiId: string) => {
    setExpandedGeneratedApiIds((prev) =>
      prev.includes(apiId) ? prev.filter((id) => id !== apiId) : [...prev, apiId],
    );
  };

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
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={selectedEnvironmentId}
                  onChange={(e) => setSelectedEnvironmentId(e.target.value)}
                  className="px-3 py-2 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/30"
                >
                  <option value="all">All Environments</option>
                  {environments.map((environment) => (
                    <option key={environment.id} value={String(environment.id)}>
                      {environment.name}
                      {environment.branchName ? ` (${environment.branchName})` : ''}
                    </option>
                  ))}
                </select>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="px-3 py-2 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/30"
                >
                  <option value="all">All Methods</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
                {domains.map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => setSelectedDomain(domain)}
                    className={`max-w-full px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      selectedDomain === domain
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'text-gray-400 hover:text-white hover:bg-[#13131a]'
                    }`}
                  >
                    <span className="block max-w-[10rem] truncate">
                      {domain === 'all' ? 'All Domains' : formatDomainLabel(domain)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {filteredApisForModal.map((api) => (
                  <div
                    key={api.id}
                    onClick={() => toggleApiSelectionForGeneration(api.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      pendingApiIdsForGeneration.includes(api.id)
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-[#13131a] border-[#1f1f28] hover:border-[#2f2f38]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        pendingApiIdsForGeneration.includes(api.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-500'
                      }`}>
                        {pendingApiIdsForGeneration.includes(api.id) && <Check size={14} className="text-white" />}
                      </div>

                      <span className={`${methodColors[api.method].bg} ${methodColors[api.method].text} ${methodColors[api.method].border} border px-2 py-1 rounded text-xs font-semibold font-mono`}>
                        {api.method}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="text-white font-mono text-sm mb-1">{api.path}</div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">{formatDomainLabel(api.domain)}</span>
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
                {pendingApiIdsForGeneration.length} API{pendingApiIdsForGeneration.length !== 1 ? 's' : ''} selected
              </div>
                <button
                  onClick={handleConfirmApiSelection}
                  disabled={pendingApiIdsForGeneration.length === 0 || isGenerating}
                  className="scenario-ai-action flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {isGenerating ? <Clock size={18} className="animate-pulse" /> : <Sparkles size={18} />}
                {isGenerating ? 'Generating...' : 'Generate for Selected APIs'}
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

              {false && generatedTests.length > 0 && (
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => {
                  setPendingApiIdsForGeneration(selectedApiIdsForGeneration);
                  setShowApiModal(true);
                }}
                disabled={isGenerating}
                className="scenario-ai-action flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {isGenerating ? <Clock size={20} className="animate-pulse" /> : <Sparkles size={20} />}
                <span className="font-semibold">
                  {isGenerating ? 'Generating...' : generatedTests.length > 0 ? 'Add APIs' : 'Generate Test Cases'}
                </span>
              </button>

              {selectedApiIdsForGeneration.length > 0 && generatedTests.length === 0 && (
                <button
                  onClick={() => handleGenerateTests()}
                  disabled={isGenerating}
                  className="scenario-ai-action flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isGenerating ? <Clock size={18} className="animate-pulse" /> : <Sparkles size={18} />}
                  {isGenerating ? 'Generating...' : `Generate for Selected APIs (${selectedApiIdsForGeneration.length})`}
                </button>
              )}

              {generatedTests.length > 0 && (
                <button
                  onClick={handleRunGeneratedTests}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors"
                >
                  <Play size={18} />
                  Run Generated Tests
                </button>
              )}
            </div>

            {isGenerating && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-5">
                <div className="flex items-start gap-3">
                  <Clock size={20} className="mt-0.5 flex-shrink-0 animate-pulse text-blue-300" />
                  <div>
                    <div className="text-sm font-semibold text-blue-100">Generating test case drafts</div>
                    <div className="mt-1 text-sm text-blue-200/80">
                      {saveMessage || 'Waiting for the backend AI generation job to finish.'}
                    </div>
                    {generationId && (
                      <div className="mt-2 text-xs text-blue-200/60">
                        Generation #{generationId}{generationStatus ? ` · ${generationStatus}` : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!isGenerating && generatedTests.length === 0 && saveMessage && (
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
                {saveMessage}
              </div>
            )}

            {generatedTests.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-white text-lg font-semibold">Generated for Selected APIs</h2>
                  <p className="text-gray-500 text-sm">Open an API to review context, comparison, coverage, and editable generated cases.</p>
                </div>
                <div className="flex flex-col gap-3 rounded-xl border border-[#1f1f28] bg-[#0a0a0f] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-gray-400">
                    <span className="text-white font-semibold">{selectedGeneratedTestIds.length}</span> of {generatedTests.length} generated test cases selected
                    {generationId && (
                      <span className="ml-2 text-xs text-gray-500">
                        Generation #{generationId}{generationStatus ? ` · ${generationStatus}` : ''}
                      </span>
                    )}
                    {saveMessage && <div className="mt-1 text-xs text-blue-300">{saveMessage}</div>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedGeneratedTestIds(generatedTests.map((test) => test.id))}
                      className="px-3 py-2 rounded-lg border border-[#1f1f28] bg-[#13131a] text-sm text-gray-300 hover:text-white"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedGeneratedTestIds([])}
                      className="px-3 py-2 rounded-lg border border-[#1f1f28] bg-[#13131a] text-sm text-gray-300 hover:text-white"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSelectedTests}
                      disabled={
                        selectedGeneratedTestIds.length === 0 ||
                        isSavingTests
                      }
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save size={16} />
                      {isSavingTests ? 'Saving...' : 'Save Selected'}
                    </button>
                  </div>
                </div>

                {selectedGeneratedApis.map((api) => {
                  const apiGeneratedTests = generatedTests.filter((test) => test.apiId === api.id);
                  const apiExistingCount = existingTests.filter((test) => test.apiId === api.id).length;
                  const apiNewCount = apiGeneratedTests.filter((test) => test.status === 'new').length;
                  const apiDuplicateCount = apiGeneratedTests.filter((test) => test.status === 'duplicate').length;
                  const apiProjectedCoverage = Math.min(100, api.coverage + apiNewCount * 3);
                  const isExpanded = expandedGeneratedApiIds.includes(api.id);
                  const apiMatrixData = selectedRoles.map(role => ({
                    role,
                    cells: selectedStates.flatMap(state =>
                      selectedDataVariants.map(variant => {
                        const hasExisting = existingTests.some(
                          t => t.apiId === api.id && t.role === role && t.stateCondition === state && t.dataVariant === variant
                        );
                        const hasGenerated = apiGeneratedTests.some(
                          t => t.role === role && t.stateCondition === state && t.dataVariant === variant
                        );
                        return { state, variant, hasExisting, hasGenerated, isMissing: !hasExisting && !hasGenerated };
                      })
                    ),
                  }));

                  return (
                    <div key={api.id} className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleGeneratedApi(api.id)}
                        className="w-full p-5 flex items-center gap-4 text-left hover:bg-[#0d0d12] transition-colors"
                      >
                        <span className={`${methodColors[api.method].bg} ${methodColors[api.method].text} ${methodColors[api.method].border} border px-2.5 py-1 rounded text-xs font-semibold font-mono`}>
                          {api.method}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-mono text-sm truncate">{api.path}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">
                              {formatDomainLabel(api.domain)}
                            </span>
                            <span>{apiGeneratedTests.length} generated tests</span>
                            <span>{api.coverage}% to {apiProjectedCoverage}% coverage</span>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-[#1f1f28] p-5 flex flex-col gap-5">
                          <div className="order-2">
                            <h3 className="text-white mb-3 flex items-center gap-2"><BarChart3 size={18} className="text-blue-400" />Test Comparison</h3>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                              <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4"><div className="text-xs text-gray-500 mb-1">Existing</div><div className="text-2xl text-white font-semibold">{apiExistingCount}</div></div>
                              <div className="bg-[#13131a] border border-green-500/20 rounded-lg p-4"><div className="text-xs text-gray-500 mb-1">New</div><div className="text-2xl text-green-400 font-semibold">{apiNewCount}</div></div>
                              <div className="bg-[#13131a] border border-yellow-500/20 rounded-lg p-4"><div className="text-xs text-gray-500 mb-1">Duplicates</div><div className="text-2xl text-yellow-400 font-semibold">{apiDuplicateCount}</div></div>
                            </div>
                          </div>

                          <div className="order-3">
                            <h3 className="text-white mb-3 flex items-center gap-2"><BarChart3 size={18} className="text-blue-400" />Coverage Matrix</h3>
                            <div className="overflow-x-auto">
                              <table className="w-max min-w-full border-separate border-spacing-x-1 border-spacing-y-1">
                                <thead>
                                  <tr>
                                    <th className="sticky left-0 z-10 w-28 bg-[#0a0a0f] pr-3 text-left align-bottom text-xs font-medium text-gray-500">Role</th>
                                    {selectedStates.flatMap(state => selectedDataVariants.map(variant => (
                                      <th key={`${api.id}-${state}-${variant}`} className="w-14 max-w-14 align-bottom text-center text-[10px] font-medium leading-tight text-gray-500">
                                        <div className="mx-auto flex h-10 w-12 items-end justify-center break-words" title={`${state} / ${variant}`}>
                                          {state.slice(0, 4)}/{variant.slice(0, 4)}
                                        </div>
                                      </th>
                                    )))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {apiMatrixData.map((row) => (
                                    <tr key={`${api.id}-${row.role}`}>
                                      <td className="sticky left-0 z-10 w-28 bg-[#0a0a0f] pr-3 text-sm font-medium text-white">{row.role}</td>
                                      {row.cells.map((cell, idx) => (
                                        <td key={idx} className="h-12 w-14 min-w-14 p-1 align-middle">
                                          <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-lg ${cell.hasGenerated ? 'bg-green-500/20 border-2 border-green-500/40' : cell.hasExisting ? 'bg-blue-500/20 border-2 border-blue-500/40' : 'bg-red-500/10 border-2 border-red-500/20'}`}>
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
                          </div>

                          <div className="order-1 space-y-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <h3 className="text-white font-semibold">Generated Test Cases</h3>
                              <button
                                type="button"
                                onClick={() => toggleGeneratedApiSelection(apiGeneratedTests)}
                                className="flex items-center gap-2 rounded-lg border border-[#1f1f28] bg-[#13131a] px-3 py-2 text-sm text-gray-300 hover:text-white"
                              >
                                <Check size={14} />
                                {apiGeneratedTests.every((test) => selectedGeneratedTestIds.includes(test.id)) ? 'Clear API Tests' : 'Select API Tests'}
                              </button>
                            </div>
                            {apiGeneratedTests.map((test) => (
                              <div key={test.id} className="bg-[#13131a] border border-[#1f1f28] rounded-lg overflow-hidden">
                                <div className="w-full p-4 flex items-start gap-3 hover:bg-[#1a1a22]">
                                  <button
                                    type="button"
                                    onClick={() => toggleGeneratedTestSelection(test.id)}
                                    className={`mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 ${
                                      selectedGeneratedTestIds.includes(test.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-500 hover:border-blue-500'
                                    }`}
                                    aria-label="Select generated test case"
                                  >
                                    {selectedGeneratedTestIds.includes(test.id) && <Check size={14} className="text-white" />}
                                  </button>
                                <button type="button" onClick={() => toggleTestEdit(test.id)} className="flex-1 text-left flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className={`text-xs px-2 py-1 rounded ${typeColors[test.type].bg} ${typeColors[test.type].text} ${typeColors[test.type].border} border`}>{typeColors[test.type].label}</span>
                                      {test.isEdited && <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">Edited</span>}
                                    </div>
                                    <div className="text-white text-sm font-medium">{test.name}</div>
                                  </div>
                                  {expandedTestId === test.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                                </button>
                                </div>
                                {expandedTestId === test.id && (
                                  <div className="border-t border-[#1f1f28] p-4 bg-[#0d0d12] space-y-4">
                                    <div>
                                      <label className="block text-xs text-gray-500 mb-2">Test Case Name</label>
                                      <input value={test.name} onChange={(e) => updateTestCase(test.id, { name: e.target.value })} className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30" />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-500 mb-2">Description</label>
                                      <textarea value={test.description || ''} onChange={(e) => updateTestCase(test.id, { description: e.target.value })} rows={3} className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 resize-none" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                      <div>
                                        <label className="block text-xs text-gray-500 mb-2">User Role</label>
                                        <input value={test.role || ''} onChange={(e) => updateTestCase(test.id, { role: e.target.value })} className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30" />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-500 mb-2">Test Level</label>
                                        <select value={test.testLevel || ''} onChange={(e) => updateTestCase(test.id, { testLevel: e.target.value ? e.target.value as TestLevel : undefined })} className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30">
                                          <option value="">Environment default</option>
                                          <option value="SMOKE">SMOKE</option>
                                          <option value="SANITY">SANITY</option>
                                          <option value="REGRESSION">REGRESSION</option>
                                          <option value="FULL">FULL</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-500 mb-2">Type</label>
                                        <input value={test.backendType || ''} onChange={(e) => updateTestCase(test.id, { backendType: e.target.value, type: mapBackendType(e.target.value) })} placeholder="HAPPY_PATH" className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/30" />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                      <div>
                                        <label className="block text-xs text-gray-500 mb-2">Edge States</label>
                                        <textarea value={test.stateCondition || ''} onChange={(e) => updateTestCase(test.id, { stateCondition: e.target.value })} rows={2} className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 resize-none" />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-500 mb-2">Data Variant</label>
                                        <textarea value={test.dataVariant || ''} onChange={(e) => updateTestCase(test.id, { dataVariant: e.target.value })} rows={2} className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 resize-none" />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-500 mb-2">Expected Result</label>
                                      <textarea value={test.expectedResult || ''} onChange={(e) => updateTestCase(test.id, { expectedResult: e.target.value })} rows={3} className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 resize-none" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                      <div>
                                        <label className="block text-xs text-gray-500 mb-2">Request Spec</label>
                                        <textarea value={test.requestSpec || test.requestPreview || ''} onChange={(e) => updateTestCase(test.id, { requestSpec: e.target.value, requestPreview: e.target.value })} rows={5} className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-blue-500/30 resize-none" />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-500 mb-2">Assertion Spec</label>
                                        <textarea value={test.assertionSpec || ''} onChange={(e) => updateTestCase(test.id, { assertionSpec: e.target.value })} rows={5} className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-blue-500/30 resize-none" />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!isGenerating && generatedTests.length === 0 && (
              <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl overflow-hidden">
                <div className="p-5 border-b border-[#1f1f28] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-white font-semibold">Saved Test Cases</h3>
                    <p className="text-gray-500 text-sm">
                      Previously saved test cases for {selectedEnvironment?.name || 'all environments'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">{existingTests.length} test cases</span>
                </div>

                {existingTests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <FileText size={32} className="text-gray-600 mb-3" />
                    <p className="text-gray-500 text-sm">No saved test cases yet</p>
                    <p className="text-gray-600 text-xs mt-1">Use Generate Test Cases to create and save new tests.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#1f1f28]">
                    {existingTests.map((test) => {
                      const api = apis.find((item) => item.id === test.apiId);
                      const isExpanded = expandedTestId === test.id;
                      return (
                        <div key={test.id} className="bg-[#0a0a0f] overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleTestEdit(test.id)}
                            className="w-full p-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between hover:bg-[#0d0d12] transition-colors text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded ${typeColors[test.type].bg} ${typeColors[test.type].text} ${typeColors[test.type].border} border`}>
                                  {typeColors[test.type].label}
                                </span>
                                {api && (
                                  <span className={`${methodColors[api.method].bg} ${methodColors[api.method].text} ${methodColors[api.method].border} border px-2 py-0.5 rounded text-xs font-semibold font-mono`}>
                                    {api.method}
                                  </span>
                                )}
                              </div>
                              <div className="text-white text-sm font-medium">{test.name}</div>
                              <div className="mt-1 text-xs text-gray-500 font-mono">{api?.path || 'Unlinked API'}</div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="text-xs text-gray-500">
                                {[test.role, test.stateCondition, test.dataVariant].filter(Boolean).join(' / ') || 'No context'}
                              </span>
                              {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="border-t border-[#1f1f28] p-4 bg-[#0d0d12] space-y-4">
                              {test.description && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Description</div>
                                  <div className="text-sm text-gray-300">{test.description}</div>
                                </div>
                              )}
                              {test.expectedResult && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Expected Result</div>
                                  <div className="text-sm text-gray-300">{test.expectedResult}</div>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {test.testLevel && (
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Test Level</div>
                                    <div className="text-xs text-white font-mono">{test.testLevel}</div>
                                  </div>
                                )}
                                {test.role && (
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">User Role</div>
                                    <div className="text-xs text-white">{test.role}</div>
                                  </div>
                                )}
                                {test.stateCondition && (
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">State Condition</div>
                                    <div className="text-xs text-white">{test.stateCondition}</div>
                                  </div>
                                )}
                                {test.dataVariant && (
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">Data Variant</div>
                                    <div className="text-xs text-white">{test.dataVariant}</div>
                                  </div>
                                )}
                              </div>
                              {test.requestPreview && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Request Spec</div>
                                  <pre className="bg-[#13131a] rounded-lg p-3 text-xs text-gray-300 font-mono overflow-x-auto max-h-40 overflow-y-auto">{test.requestPreview}</pre>
                                </div>
                              )}
                              {test.assertionSpec && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Assertion Spec</div>
                                  <pre className="bg-[#13131a] rounded-lg p-3 text-xs text-gray-300 font-mono overflow-x-auto max-h-40 overflow-y-auto">{test.assertionSpec}</pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* API Endpoints Section */}
            {false && generatedTests.length === 0 && (
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
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="px-3 py-1.5 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/30"
                  >
                    <option value="all">All Methods</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                  {domains.map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => setSelectedDomain(domain)}
                      className={`max-w-full px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        selectedDomain === domain
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'text-gray-400 hover:text-white hover:bg-[#13131a]'
                      }`}
                    >
                      <span className="block max-w-[12rem] truncate">
                        {domain === 'all' ? 'All Domains' : formatDomainLabel(domain)}
                      </span>
                    </button>
                  ))}
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
                            {formatDomainLabel(api.domain)}
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
            )}

            {selectedApiIdsForGeneration.length > 0 && generatedTests.length === 0 && (
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
