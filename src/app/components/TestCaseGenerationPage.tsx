import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Search,
  X,
  Filter,
  CheckCircle2,
  TrendingUp,
  Check,
  Sparkles,
  Play,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
  FileText,
  Clock,
  Save,
  Trash2,
  Loader2
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
  riskLevel?: string;
  testLevel?: TestLevel;
  apiId: string;
  endpointName?: string;
  apiMethod?: ApiEndpoint['method'];
  apiPath?: string;
  apiDomain?: string;
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
  expectedStatusCodes?: number[];
  errorStatusCodes?: number[];
  errorCodes?: string[];
  executionMethod?: ApiEndpoint['method'];
  executionEndpoint?: string;
}

const REGISTERED_REPOSITORIES_KEY = 'flowOps.registeredRepositories';
const EXPECTED_SPEC_PLACEHOLDER = `{
  "status": 201,
  "body": {
    "status": "created"
  }
}`;


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

const testLevelColors = {
  SMOKE: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Smoke' },
  SANITY: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', label: 'Sanity' },
  REGRESSION: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Regression' },
  FULL: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', label: 'Full' },
};

const riskLevelColors = {
  HIGH: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'High risk' },
  MEDIUM: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', label: 'Medium risk' },
  LOW: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', label: 'Low risk' },
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

const normalizeNumberList = (value?: unknown) =>
  Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : undefined;

const normalizeStringList = (value?: unknown) =>
  Array.isArray(value) ? value.map(String).filter((item) => item.length > 0) : undefined;

const renderStatusMetadata = (test: Pick<TestCase, 'expectedStatusCodes' | 'errorStatusCodes' | 'errorCodes'>) => {
  const groups = [
    { label: 'Expected status', values: test.expectedStatusCodes, color: 'text-green-300 border-green-500/20 bg-green-500/10' },
    { label: 'Error status', values: test.errorStatusCodes, color: 'text-red-300 border-red-500/20 bg-red-500/10' },
    { label: 'Error codes', values: test.errorCodes, color: 'text-yellow-300 border-yellow-500/20 bg-yellow-500/10' },
  ];
  const visibleGroups = groups.filter((group) => group.values !== undefined);

  if (visibleGroups.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {visibleGroups.map((group) => (
        <div key={group.label} className="rounded-lg border border-[#1f1f28] bg-[#13131a] p-3">
          <div className="mb-2 text-xs text-gray-500">{group.label}</div>
          <div className="flex flex-wrap gap-1.5">
            {group.values && group.values.length > 0 ? (
              group.values.map((value) => (
                <span key={`${group.label}-${value}`} className={`rounded border px-2 py-0.5 text-xs font-mono ${group.color}`}>
                  {value}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500">None</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const generationStillRunning = (status?: string | null) => {
  const normalized = String(status || '').toUpperCase();
  return ['REQUESTED', 'QUEUED', 'PROCESSING', 'GENERATING', 'IN_PROGRESS', 'RUNNING', 'PENDING'].includes(normalized);
};

const formatDomainLabel = (domain: string) => (domain === '__empty__' || !domain ? 'Unassigned' : domain);

const normalizeTestLevel = (value?: TestLevel | string) => String(value || '').toUpperCase();

const resolveTestApiMeta = (test: TestCase, apis: ApiEndpoint[]) => {
  const api = apis.find((item) => item.id === test.apiId);
  return {
    method: api?.method || test.apiMethod,
    path: api?.path || test.apiPath || 'Unlinked API',
    domain: api?.domain || test.apiDomain || '',
  };
};

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
  apiMethod: testCase.selectedEndpoint?.method && testCase.selectedEndpoint.method !== 'TRACE'
    ? testCase.selectedEndpoint.method as ApiEndpoint['method']
    : undefined,
  apiPath: testCase.selectedEndpoint?.path,
  apiDomain: testCase.selectedEndpoint?.domainTag?.trim() || undefined,
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
  expectedStatusCodes: normalizeNumberList(testCase.expectedStatusCodes),
  errorStatusCodes: normalizeNumberList(testCase.errorStatusCodes),
  errorCodes: normalizeStringList(testCase.errorCodes),
  executionMethod: testCase.executionMethod,
  executionEndpoint: testCase.executionEndpoint,
});

const normalizeDraft = (draft: TestGenerationDraftResponse): TestCase => {
  const draftId = Number(draft.draftId ?? draft.id);
  const stateCondition = Array.isArray(draft.edgeStates)
    ? draft.edgeStates.join(', ')
    : draft.stateCondition || draft.edgeState || draft.edgeStates;
  const requestSpec = draft.requestSpec || stringifySpec(draft.request) || stringifySpec(draft.requestPreview);
  const expectedSpec = draft.expectedResult || draft.expectedSpec || stringifySpec(draft.expected);
  const assertionSpec = draft.assertionSpec || stringifySpec(draft.assertion) || (Array.isArray(draft.validationRules)
    ? JSON.stringify({ assertions: draft.validationRules }, null, 2)
    : stringifySpec(draft.validationRules));

  return {
    id: `draft-${Number.isFinite(draftId) ? draftId : crypto.randomUUID()}`,
    draftId: Number.isFinite(draftId) ? draftId : undefined,
    name: draft.name || draft.title || `AI Draft #${Number.isFinite(draftId) ? draftId : ''}`.trim(),
    type: mapBackendType(draft.type),
    backendType: draft.type,
    riskLevel: draft.risk_level,
    testLevel: draft.testLevel,
    apiId: String(draft.selectedEndpoint?.id || draft.apiId || draft.apiInventoryId || ''),
    endpointName: draft.endpointName,
    apiMethod: draft.selectedEndpoint?.method && draft.selectedEndpoint.method !== 'TRACE'
      ? draft.selectedEndpoint.method as ApiEndpoint['method']
      : draft.request?.method && draft.request.method !== 'TRACE'
        ? draft.request.method as ApiEndpoint['method']
        : undefined,
    apiPath: draft.selectedEndpoint?.path || draft.request?.endpoint,
    apiDomain: draft.selectedEndpoint?.domainTag?.trim() || undefined,
    role: draft.userRole || draft.role,
    stateCondition,
    dataVariant: draft.dataVariant,
    status: draft.duplicate ? 'duplicate' : 'new',
    description: draft.description,
    expectedResult: expectedSpec,
    requestPreview: requestSpec,
    requestSpec,
    assertionSpec,
    validationRules: Array.isArray(draft.validationRules)
      ? draft.validationRules.map(String)
      : undefined,
    expectedStatusCodes: normalizeNumberList(draft.expectedStatusCodes),
    errorStatusCodes: normalizeNumberList(draft.errorStatusCodes),
    errorCodes: normalizeStringList(draft.errorCodes),
    executionMethod: draft.executionMethod || (draft.request?.method && draft.request.method !== 'TRACE' ? draft.request.method as ApiEndpoint['method'] : undefined),
    executionEndpoint: draft.executionEndpoint || draft.request?.endpoint,
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
  const [selectedExistingTestIds, setSelectedExistingTestIds] = useState<string[]>([]);
  const [isDeletingTests, setIsDeletingTests] = useState(false);
  const [isLoadingExistingTests, setIsLoadingExistingTests] = useState(false);
  const [editingExistingTestId, setEditingExistingTestId] = useState<string | null>(null);
  const [existingSearchQuery, setExistingSearchQuery] = useState('');
  const [existingDomainFilter, setExistingDomainFilter] = useState('all');
  const [existingMethodFilter, setExistingMethodFilter] = useState('all');
  const [existingTestLevelFilter, setExistingTestLevelFilter] = useState('all');
  const [existingTypeFilter, setExistingTypeFilter] = useState('all');
  const [showExistingFilters, setShowExistingFilters] = useState(false);

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
    setExistingDomainFilter('all');
    setSelectedExistingTestIds([]);
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
  const hasEmptyExistingDomain = existingTests.some((test) => !resolveTestApiMeta(test, apis).domain);
  const existingDomains = [
    'all',
    ...Array.from(
      new Set(
        existingTests
          .map((test) => resolveTestApiMeta(test, apis).domain)
          .filter(Boolean),
      ),
    ),
    ...(hasEmptyExistingDomain ? ['__empty__'] : []),
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

  const filteredExistingTests = existingTests.filter((test) => {
    const apiMeta = resolveTestApiMeta(test, apis);
    const query = existingSearchQuery.trim().toLowerCase();
    const apiDomain = apiMeta.domain;
    const matchesSearch =
      !query ||
      test.name.toLowerCase().includes(query) ||
      (test.description || '').toLowerCase().includes(query) ||
      (test.backendType || test.type).toLowerCase().includes(query) ||
      apiMeta.path.toLowerCase().includes(query) ||
      apiDomain.toLowerCase().includes(query);
    const matchesDomain =
      existingDomainFilter === 'all' ||
      (existingDomainFilter === '__empty__' ? !apiDomain : apiDomain === existingDomainFilter);
    const matchesMethod = existingMethodFilter === 'all' || apiMeta.method === existingMethodFilter;
    const matchesTestLevel =
      existingTestLevelFilter === 'all' ||
      normalizeTestLevel(test.testLevel) === existingTestLevelFilter;
    const matchesType = existingTypeFilter === 'all' || test.type === existingTypeFilter;
    return matchesSearch && matchesDomain && matchesMethod && matchesTestLevel && matchesType;
  });

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
    const appId = mainApplicationId ?? activeApplication.appId;
    const apiIds = apiIdsForGeneration
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
    if (!appId) {
      setSaveMessage('Select an App before generating tests.');
      return;
    }
    if (apiIds.length === 0) {
      setSaveMessage('Select APIs from a branch/environment source.');
      return;
    }

    setIsGenerating(true);
    setRightPanelMode('hidden');
    setGenerationId(null);
    setGenerationStatus(null);
    setSaveMessage(null);

    const contextSummary = [
      `${apiIds.length} selected APIs`,
    ].join(' | ');

    try {
      console.info('[TestCaseGeneration] requesting backend generation', {
        appId,
        environmentId: selectedEnvironment?.id,
        selectedApiIds: apiIds,
        contextSummary,
      });
      const generation = await flowOpsApi.createTestGeneration({
        appId,
        environmentId: selectedEnvironment?.id,
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
      businessRules: [],
      edgeCases: [],
      dataConstraints: [],
    });
    navigate('/execution/run');
  };

  const toggleTestEdit = (testId: string) => {
    setExpandedTestId(expandedTestId === testId ? null : testId);
    if (expandedTestId === testId) setEditingExistingTestId(null);
  };

  const toggleExistingTestSelection = (testId: string) => {
    setSelectedExistingTestIds(prev =>
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  const handleDeleteSelectedExisting = async () => {
    if (selectedExistingTestIds.length === 0) return;
    if (!window.confirm(`선택한 ${selectedExistingTestIds.length}개 테스트케이스를 삭제하시겠습니까?`)) return;
    setIsDeletingTests(true);
    await Promise.all(
      selectedExistingTestIds.map(id => flowOpsApi.deleteTestCase(Number(id)).catch(() => null))
    );
    setExistingTests(prev => prev.filter(t => !selectedExistingTestIds.includes(t.id)));
    setSelectedExistingTestIds([]);
    setIsDeletingTests(false);
  };

  const handleRunSelectedExisting = () => {
    const selected = existingTests.filter(t => selectedExistingTestIds.includes(t.id));
    const apiData = selected.map(t => {
      const api = apis.find(a => a.id === t.apiId);
      return { id: t.id, name: t.name, endpoint: api?.path || '', method: (api?.method || 'GET') as any };
    });
    setSelectedAPIs(apiData);
    navigate('/execution/run', {
      state: {
        selectedTestCaseIds: selectedExistingTestIds.map(Number),
        selectedTestCases: selected.map((test) => ({ id: Number(test.id), name: test.name })),
      },
    });
  };

  const handleSaveExistingTestEdit = async (test: TestCase) => {
    try {
      await flowOpsApi.updateTestCase(Number(test.id), {
        name: test.name,
        description: test.description,
        expectedResult: test.expectedResult,
        expectedSpec: test.expectedResult,
        type: test.backendType || test.type,
        testLevel: test.testLevel,
        userRole: test.role,
        stateCondition: test.stateCondition,
        dataVariant: test.dataVariant,
        requestSpec: test.requestSpec || test.requestPreview,
        assertionSpec: test.assertionSpec,
      });
      setEditingExistingTestId(null);
      setExistingTests(prev => prev.map(t => t.id === test.id ? { ...t, isEdited: false } : t));
    } catch (error) {
      alert(error instanceof Error ? error.message : '저장에 실패했습니다.');
    }
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
    const appId = mainApplicationId ?? activeApplication.appId;
    const testsToSave = generatedTests.filter((test) => selectedGeneratedTestIds.includes(test.id));
    if (testsToSave.length === 0) return;
    if (!appId) {
      setSaveMessage('Select an App before saving test cases.');
      return;
    }

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
            appId,
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
              expectedSpec: test.expectedResult?.trim() || '',
              assertionSpec: test.assertionSpec,
            })),
          })
        : [];

      const saved = Array.isArray(result) ? result : result.testCases || result.saved || [];
      const savedApiIds = Array.from(
        new Set([
          ...backendDraftsToSave.map((test) => Number(test.apiId)),
          ...(!Array.isArray(result) && Array.isArray(result.apiIds) ? result.apiIds.map(Number) : []),
        ].filter((apiId) => Number.isFinite(apiId) && apiId > 0)),
      );
      const refreshedSaved = saved.length
        ? saved
        : (
            await Promise.all(
              savedApiIds.map((apiId) =>
                flowOpsApi.listTestCasesByApi(apiId).catch(() => [] as TestCaseResponse[]),
              ),
            )
          ).flat();
      const normalizedSaved = refreshedSaved.length
        ? refreshedSaved.map(normalizeTestCase)
        : backendDraftsToSave.map((test) => ({ ...test, status: 'existing' as const }));
      const createdDirectDrafts = await Promise.all(
        demoTestsToSave.map((test) =>
          flowOpsApi.createTestCase(appId, {
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
            expectedSpec: test.expectedResult?.trim() || '',
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

  // Calculate stats
  const existingCount = existingTests.filter(t => selectedApiIdsForGeneration.includes(t.apiId)).length;
  const newCount = generatedTests.filter(t => t.status === 'new').length;
  const duplicateCount = generatedTests.filter(t => t.status === 'duplicate').length;
  const allExistingTestsSelected =
    filteredExistingTests.length > 0 &&
    filteredExistingTests.every((test) => selectedExistingTestIds.includes(test.id));
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
                <label className="flex items-center gap-2 text-xs text-gray-500">
                  API Source
                  <select
                    aria-label="API inventory source"
                    value={selectedEnvironmentId}
                    onChange={(e) => setSelectedEnvironmentId(e.target.value)}
                    className="px-3 py-2 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/30"
                  >
                    <option value="all">All API inventory sources</option>
                    {environments.map((environment) => (
                      <option key={environment.id} value={String(environment.id)}>
                        {environment.branchName ? `${environment.branchName} / ` : ''}
                        {environment.name}
                      </option>
                    ))}
                  </select>
                </label>
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
                <p className="text-gray-500 text-sm">Select APIs from a branch/environment source. Generated test cases are saved at the App level.</p>
              </div>

              {selectedExistingTestIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="text-sm text-blue-300">{selectedExistingTestIds.length} selected</span>
                  <button
                    type="button"
                    onClick={handleRunSelectedExisting}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    <Play size={16} />
                    Run
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSelectedExisting}
                    disabled={isDeletingTests}
                    className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-[#13131a] px-5 py-2.5 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDeletingTests ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    Delete
                  </button>
                </div>
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

              {selectedApiIdsForGeneration.length > 0 && generatedTests.length === 0 && !isGenerating && (
                <button
                  onClick={() => handleGenerateTests()}
                  disabled={isGenerating}
                  className="scenario-ai-action flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isGenerating ? <Clock size={18} className="animate-pulse" /> : <Sparkles size={18} />}
                  {isGenerating ? 'Generating...' : `Generate for Selected APIs (${selectedApiIdsForGeneration.length})`}
                </button>
              )}

              {(generatedTests.length > 0 || isGenerating) && (
                <button
                  onClick={handleRunGeneratedTests}
                  disabled={isGenerating}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-colors ${
                    isGenerating
                      ? 'cursor-not-allowed bg-[#13131a] text-gray-500 ring-1 ring-[#1f1f28]'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
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
                                      {test.riskLevel && riskLevelColors[test.riskLevel as keyof typeof riskLevelColors] && (
                                        <span className={`text-xs px-2 py-1 rounded ${riskLevelColors[test.riskLevel as keyof typeof riskLevelColors].bg} ${riskLevelColors[test.riskLevel as keyof typeof riskLevelColors].text} ${riskLevelColors[test.riskLevel as keyof typeof riskLevelColors].border} border`}>
                                          {riskLevelColors[test.riskLevel as keyof typeof riskLevelColors].label}
                                        </span>
                                      )}
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
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                      <div>
                                        <label className="block text-xs text-gray-500 mb-2">Test Level</label>
                                        <select value={test.testLevel || ''} onChange={(e) => updateTestCase(test.id, { testLevel: e.target.value ? e.target.value as TestLevel : undefined })} className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30">
                                          <option value="">Source default</option>
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
                                    <div>
                                      <label className="block text-xs text-gray-500 mb-2">Expected Spec</label>
                                      <textarea value={test.expectedResult || ''} onChange={(e) => updateTestCase(test.id, { expectedResult: e.target.value })} rows={5} placeholder={EXPECTED_SPEC_PLACEHOLDER} className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-xs font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500/30 resize-none" />
                                    </div>
                                    {renderStatusMetadata(test)}
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
                <div className="border-b border-[#1f1f28]">
                  <div className="p-5">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-white font-semibold">Previously saved test cases for this App</h3>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {filteredExistingTests.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedExistingTestIds((prev) =>
                                allExistingTestsSelected
                                  ? prev.filter((id) => !filteredExistingTests.some((test) => test.id === id))
                                  : Array.from(new Set([...prev, ...filteredExistingTests.map((test) => test.id)])),
                              )
                            }
                            className="flex items-center gap-2 rounded-lg border border-[#1f1f28] bg-[#13131a] px-3 py-2 text-xs text-gray-400 transition-all hover:border-blue-500/30 hover:text-white"
                          >
                            <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              allExistingTestsSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-500 hover:border-blue-500'
                            }`}>
                              {allExistingTestsSelected && <Check size={14} className="text-white" />}
                            </span>
                            Select visible
                          </button>
                        )}
                        <span className="text-xs text-gray-500">
                          {filteredExistingTests.length} of {existingTests.length} test cases
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Search test cases, endpoints, domains..."
                          value={existingSearchQuery}
                          onChange={(e) => setExistingSearchQuery(e.target.value)}
                          className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/30"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowExistingFilters(!showExistingFilters)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                            showExistingFilters
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-[#13131a] border border-[#1f1f28] text-gray-400 hover:text-white'
                          }`}
                        >
                          <Filter size={14} />
                          Filters
                        </button>

                        {showExistingFilters && (
                          <>
                            <select
                              value={existingMethodFilter}
                              onChange={(e) => setExistingMethodFilter(e.target.value)}
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
                              value={existingTestLevelFilter}
                              onChange={(e) => setExistingTestLevelFilter(e.target.value)}
                              className="px-4 py-2 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/30"
                            >
                              <option value="all">All Test Levels</option>
                              <option value="SMOKE">Smoke</option>
                              <option value="SANITY">Sanity</option>
                              <option value="REGRESSION">Regression</option>
                              <option value="FULL">Full</option>
                            </select>
                            <select
                              value={existingTypeFilter}
                              onChange={(e) => setExistingTypeFilter(e.target.value)}
                              className="px-4 py-2 bg-[#13131a] border border-[#1f1f28] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/30"
                            >
                              <option value="all">All Types</option>
                              <option value="success">Success</option>
                              <option value="validation">Validation</option>
                              <option value="auth">Authorization</option>
                              <option value="performance">Performance</option>
                              <option value="edge">Edge</option>
                              <option value="error">Error</option>
                            </select>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#1f1f28] px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {existingDomains.map((domain) => (
                        <button
                          key={domain}
                          type="button"
                          onClick={() => setExistingDomainFilter(domain)}
                          title={domain === 'all' ? 'All Domains' : formatDomainLabel(domain)}
                          className={`max-w-full px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                            existingDomainFilter === domain
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
                </div>

                {isLoadingApis ? (
                  <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10">
                      <Loader2 size={24} className="animate-spin text-blue-400" />
                    </div>
                    <h3 className="mb-2 text-white font-semibold">Loading test cases</h3>
                    <p className="max-w-md text-sm text-gray-500">
                      Fetching saved test cases and matching them with the selected environment.
                    </p>

                    <div className="mt-8 grid w-full max-w-3xl gap-3">
                      {[0, 1, 2].map((item) => (
                        <div key={item} className="rounded-xl border border-[#1f1f28] bg-[#13131a] p-5">
                          <div className="mb-4 flex items-center gap-3">
                            <div className="h-4 w-4 rounded border border-[#2f2f38] bg-[#1f1f28]" />
                            <div className="h-5 w-20 rounded bg-[#1f1f28]" />
                            <div className="h-5 w-16 rounded bg-[#1f1f28]" />
                            <div className="h-4 w-44 rounded bg-[#1f1f28]" />
                          </div>
                          <div className="mb-3 h-3 w-3/4 rounded bg-[#1f1f28]" />
                          <div className="h-3 w-1/2 rounded bg-[#1f1f28]" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : existingTests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <FileText size={32} className="text-gray-600 mb-3" />
                    <p className="text-gray-500 text-sm">No saved test cases yet</p>
                    <p className="text-gray-600 text-xs mt-1">Use Generate Test Cases to create and save new tests.</p>
                  </div>
                ) : filteredExistingTests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <FileText size={32} className="text-gray-600 mb-3" />
                    <p className="text-gray-500 text-sm">No matching test cases</p>
                    <p className="text-gray-600 text-xs mt-1">Try adjusting the search, domain, or filters.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#1f1f28]">
                    {filteredExistingTests.map((test) => {
                      const isExpanded = expandedTestId === test.id;
                      const isEditing = editingExistingTestId === test.id;
                      const isSelected = selectedExistingTestIds.includes(test.id);
                      const testLevel = normalizeTestLevel(test.testLevel);
                      const levelColor = testLevelColors[testLevel as keyof typeof testLevelColors];
                      const apiMeta = resolveTestApiMeta(test, apis);
                      return (
                        <div key={test.id} className={`bg-[#0a0a0f] overflow-hidden transition-colors ${isSelected ? 'bg-blue-500/5' : ''}`}>
                          <div className="w-full p-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between hover:bg-[#0d0d12] transition-colors">
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExistingTestSelection(test.id);
                              }}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-500 hover:border-blue-500'
                              }`}
                              aria-label={isSelected ? 'Deselect test case' : 'Select test case'}
                            >
                              {isSelected && <Check size={14} className="text-white" />}
                            </button>
                            {/* Main info — clickable for expand */}
                            <button
                              type="button"
                              onClick={() => toggleTestEdit(test.id)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded ${typeColors[test.type].bg} ${typeColors[test.type].text} ${typeColors[test.type].border} border`}>
                                  {typeColors[test.type].label}
                                </span>
                                {apiMeta.method && (
                                  <span className={`${methodColors[apiMeta.method].bg} ${methodColors[apiMeta.method].text} ${methodColors[apiMeta.method].border} border px-2 py-0.5 rounded text-xs font-semibold font-mono`}>
                                    {apiMeta.method}
                                  </span>
                                )}
                                {levelColor && (
                                  <span className={`text-xs px-2 py-1 rounded border ${levelColor.bg} ${levelColor.text} ${levelColor.border}`}>
                                    {levelColor.label}
                                  </span>
                                )}
                                <span
                                  title={formatDomainLabel(apiMeta.domain)}
                                  className="max-w-[12rem] truncate px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs rounded"
                                >
                                  {formatDomainLabel(apiMeta.domain)}
                                </span>
                              </div>
                              <div className="text-white text-sm font-medium">{test.name}</div>
                              <div className="mt-1 text-xs text-gray-500 font-mono">{apiMeta.path}</div>
                            </button>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <button type="button" onClick={() => toggleTestEdit(test.id)}>
                                {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                              </button>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="border-t border-[#1f1f28] p-4 bg-[#0d0d12] space-y-4">
                              {/* Name */}
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Name</div>
                                {isEditing ? (
                                  <input
                                    className="w-full bg-[#13131a] border border-[#1f1f28] focus:border-blue-500/50 rounded-lg px-3 py-2 text-sm text-white outline-none"
                                    value={test.name}
                                    onChange={e => updateTestCase(test.id, { name: e.target.value })}
                                  />
                                ) : (
                                  <div className="text-sm text-gray-300">{test.name}</div>
                                )}
                              </div>
                              {/* Description */}
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Description</div>
                                {isEditing ? (
                                  <textarea
                                    className="w-full bg-[#13131a] border border-[#1f1f28] focus:border-blue-500/50 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
                                    rows={2}
                                    value={test.description || ''}
                                    onChange={e => updateTestCase(test.id, { description: e.target.value })}
                                  />
                                ) : (
                                  test.description && <div className="text-sm text-gray-300">{test.description}</div>
                                )}
                              </div>
                              {/* Expected Result */}
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Expected Spec</div>
                                {isEditing ? (
                                  <textarea
                                    className="w-full bg-[#13131a] border border-[#1f1f28] focus:border-blue-500/50 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none resize-none placeholder-gray-600"
                                    rows={5}
                                    placeholder={EXPECTED_SPEC_PLACEHOLDER}
                                    value={test.expectedResult || ''}
                                    onChange={e => updateTestCase(test.id, { expectedResult: e.target.value })}
                                  />
                                ) : (
                                  test.expectedResult && <div className="text-sm text-gray-300">{test.expectedResult}</div>
                                )}
                              </div>
                              {renderStatusMetadata(test)}
                              {test.testLevel && (
                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Test Level</div>
                                  {isEditing ? (
                                    <select
                                      className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500/50"
                                      value={test.testLevel || ''}
                                      onChange={e => updateTestCase(test.id, { testLevel: e.target.value as any })}
                                    >
                                      <option value="">-</option>
                                      <option value="SMOKE">SMOKE</option>
                                      <option value="SANITY">SANITY</option>
                                      <option value="REGRESSION">REGRESSION</option>
                                      <option value="FULL">FULL</option>
                                    </select>
                                  ) : (
                                    <div className="text-xs text-white font-mono">{test.testLevel || '-'}</div>
                                  )}
                                </div>
                              </div>
                              )}
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
                                </div>)}
                              {/* Edit/Save buttons */}
                              <div className="flex items-center gap-2 pt-1 border-t border-[#1f1f28]">
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveExistingTestEdit(test)}
                                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                                    >
                                      <Save size={13} />
                                      저장
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setEditingExistingTestId(null); setExistingTests(prev => prev.map(t => t.id === test.id ? { ...t, isEdited: false } : t)); }}
                                      className="px-4 py-2 bg-[#1f1f28] hover:bg-[#2a2a38] text-gray-400 hover:text-white text-xs rounded-lg transition-colors"
                                    >
                                      취소
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setEditingExistingTestId(test.id)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1f1f28] hover:bg-[#2a2a38] text-gray-400 hover:text-white text-xs rounded-lg transition-colors"
                                  >
                                    수정
                                  </button>
                                )}
                              </div>
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

                            <div>
                              <label className="block text-xs text-gray-500 mb-2">Expected Spec</label>
                              <textarea
                                value={test.expectedResult}
                                onChange={(e) => updateTestCase(test.id, { expectedResult: e.target.value })}
                                rows={5}
                                placeholder={EXPECTED_SPEC_PLACEHOLDER}
                                className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-xs font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500/30 resize-none"
                              />
                            </div>
                            {renderStatusMetadata(test)}

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

                        <div>
                          <label className="block text-xs text-gray-500 mb-2">Expected Spec</label>
                          <textarea
                            value={test.expectedResult}
                            onChange={(e) => updateTestCase(test.id, { expectedResult: e.target.value })}
                            rows={5}
                            placeholder={EXPECTED_SPEC_PLACEHOLDER}
                            className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-xs font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500/30 resize-none"
                          />
                        </div>
                        {renderStatusMetadata(test)}

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
