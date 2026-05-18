const API_BASE_URL =
  import.meta.env.VITE_FLOW_OPS_API_BASE_URL?.replace(/\/$/, '') ||
  (import.meta.env.DEV ? '/flow-ops-api' : 'https://flow-ops-server.onrender.com');

export const DEFAULT_APP_ID = Number(import.meta.env.VITE_FLOW_OPS_APP_ID || localStorage.getItem('flowOps.appId') || 1);
export const DEFAULT_REQUESTER = import.meta.env.VITE_FLOW_OPS_REQUESTER || 'qa.engineer@flowops.dev';
const DEFAULT_PROJECT_NAME = import.meta.env.VITE_FLOW_OPS_PROJECT_NAME || 'FlowOps Workspace';

export function getDefaultAppId() {
  return Number(import.meta.env.VITE_FLOW_OPS_APP_ID || localStorage.getItem('flowOps.appId') || 1);
}

export interface ApiResponse<T> {
  success: boolean;
  code?: string;
  message?: string;
  data: T;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
export type TestLevel = 'SMOKE' | 'SANITY' | 'REGRESSION' | 'FULL';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ApiEndpointListItemResponse {
  id: number;
  method: HttpMethod;
  path: string;
  domainTag?: string;
  controllerName?: string;
  deprecated?: boolean;
  testCaseCount?: number;
  latestExecutionTime?: string;
  coveragePercentage?: number;
}

export interface ApiEndpointDetailResponse extends ApiEndpointListItemResponse {
  appId: number;
  requestSchema?: unknown;
  responseSchema?: unknown;
  createdAt?: string;
  updatedAt?: string;
}

export interface EnvironmentResponse {
  id: number;
  appId: number;
  repositoryId?: number;
  name: string;
  branchName?: string;
  baseUrl: string;
  authType: 'NONE' | 'BASIC' | 'BEARER' | 'API_KEY' | 'OAUTH2';
  authConfigured?: boolean;
  authConfig?: unknown;
  headers?: unknown;
  defaultTestLevel: TestLevel;
  lastRunAt?: string;
  coverage?: number;
}

export interface CreateAppRequest {
  name: string;
  repoUrl?: string;
  specSource?: string;
  defaultBranch?: string;
  branches?: string[];
}

export interface AppDetailResponse extends CreateAppRequest {
  id: number;
  title?: string;
  main?: boolean;
  primary?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface ProjectResponse {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
}

export interface RepositoryResponse {
  id: number;
  projectId: number;
  appId?: number;
  appTitle?: string;
  fullName: string;
  repositoryUrl?: string;
  defaultBranch?: string;
  connectionStatus?: 'ACTIVE' | 'DISCONNECTED' | 'ERROR';
  branches?: Array<{ name?: string; branchName?: string; defaultBranch?: boolean }>;
  scanResults?: ScanResultResponse[];
}

export interface BranchResponse {
  name: string;
  isDefault?: boolean;
  selected?: boolean;
}

export interface ScanResultResponse {
  branchName: string;
  detectedEndpointCount: number;
  specToolName?: string;
  specToolVersion?: string;
  methodEndpointCounts?: Record<string, number>;
  frameworkName?: string;
  frameworkVersion?: string;
  restControllerCount?: number;
}

export interface ApiInventoryResponse {
  id: number;
  projectId: number;
  repositoryId?: number;
  method: HttpMethod | 'TRACE';
  endpointPath: string;
  requestSchema?: unknown;
  responseSchema?: unknown;
  operationId?: string;
  domainTag?: string;
  branchName?: string;
  summary?: string;
  sourceType?: 'OPENAPI' | 'MANUAL';
  status?: 'ACTIVE' | 'DEPRECATED';
  editStatus?: 'AUTO' | 'EDITED';
  specVersion?: string;
  authRequired?: boolean;
  testLevels?: TestLevel[];
  totalTestCount?: number;
  coveragePercentage?: number;
  successRate?: number;
  updatedAt?: string;
  modifiedAt?: string;
  lastModifiedAt?: string;
  createdAt?: string;
}

export interface ApiInventoryBranchSummaryResponse {
  branchName: string;
  totalApiCount?: number;
  averageCoverage?: number;
  totalTestCount?: number;
}

export interface ApiInventoryListResponse {
  defaultBranchName?: string;
  branchSummaries?: ApiInventoryBranchSummaryResponse[];
  items: ApiInventoryResponse[];
}

export interface ExecutionStepLogResponse {
  id: number;
  executionId?: number;
  testCaseId?: number;
  executedAt?: string;
  caseName?: string;
  step?: string;
  method?: HttpMethod;
  endpoint?: string;
  success?: boolean;
  status?: 'SUCCESS' | 'FAILED' | 'RUNNING';
  responseCode?: number;
  requestBody?: unknown;
  responseBody?: unknown;
  errorMessage?: string;
  assertionResults?: unknown;
  validationResults?: unknown;
  durationMs?: number;
  startedAt?: string;
  endedAt?: string;
}

export interface ExecutionDetailResponse {
  id: number;
  appId: number;
  environmentId: number;
  environmentName?: string;
  executionType?: 'API' | 'API_BATCH' | 'TEST_CASE' | 'SCENARIO';
  testLevel?: TestLevel;
  status: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'PARTIAL_FAILED' | 'FAILED' | 'CANCELED';
  executedAt?: string;
  caseName?: string;
  totalCount?: number;
  passedCount?: number;
  failedCount?: number;
  avgDurationMs?: number;
  durationMs?: number;
  endpoint?: string;
  body?: unknown;
  response?: unknown;
  statusCode?: number;
  responseTimeMs?: number;
  errorMessage?: string;
  createdBy?: string;
  timeline?: ExecutionStepLogResponse[];
}

export interface TestCaseResponse {
  id: number;
  apiId?: number;
  apiInventoryId?: number;
  draftId?: number;
  name?: string;
  title?: string;
  active?: boolean;
  version?: number;
  type?: string;
  testLevel?: TestLevel;
  description?: string;
  expectedResult?: string;
  expectedSpec?: string;
  requestPreview?: unknown;
  requestSpec?: string;
  assertionSpec?: string;
  validationRules?: string[] | unknown;
  role?: string;
  userRole?: string;
  stateCondition?: string;
  dataVariant?: string;
  updatedAt?: string;
  createdAt?: string;
  selectedEndpoint?: {
    id?: number;
    method?: HttpMethod;
    path?: string;
    domainTag?: string;
    controllerName?: string;
  };
}

export interface ScenarioSummaryResponse {
  id: number;
  name: string;
  description?: string;
  type?: string;
  steps?: number;
  updatedAt?: string;
}

export interface ScenarioDetailResponse {
  id: number;
  appId: number;
  name: string;
  description?: string;
  type?: string;
  steps?: Array<{
    id: number;
    stepOrder: number;
    apiId?: number;
    endpoint?: {
      id?: number;
      method?: HttpMethod;
      path?: string;
      domainTag?: string;
      controllerName?: string;
    };
    label?: string;
    requestConfig?: string;
    extractRules?: string;
    validationRules?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestGenerationResponse {
  id: number;
  appId?: number;
  environmentId?: number;
  requestedBy?: string;
  selectedApiIds?: number[];
  contextSummary?: string;
  currentCoverage?: number;
  status?: 'REQUESTED' | 'GENERATING' | 'COMPLETED' | 'FAILED' | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestGenerationDraftResponse {
  id?: number;
  draftId?: number;
  apiId?: number;
  apiInventoryId?: number;
  name?: string;
  title?: string;
  description?: string;
  type?: string;
  testLevel?: TestLevel;
  userRole?: string;
  role?: string;
  stateCondition?: string;
  edgeState?: string;
  edgeStates?: string[] | string;
  dataVariant?: string;
  requestSpec?: string;
  requestPreview?: unknown;
  expectedResult?: string;
  assertionSpec?: string;
  validationRules?: string[] | unknown;
}

export interface CreateTestGenerationRequest {
  appId: number;
  environmentId: number;
  requestedBy: string;
  selectedApiIds: number[];
  contextSummary?: string;
  currentCoverage?: number;
}

export interface SaveTestGenerationDraftRequest {
  testCases: Array<{
    draftId: number;
    name: string;
    expectedResult: string;
    description?: string;
    type?: string;
    testLevel?: TestLevel;
    userRole?: string;
    stateCondition?: string;
    dataVariant?: string;
    requestSpec?: string;
    assertionSpec?: string;
  }>;
}

export interface AiAgentBaseRequest {
  requestId: string;
  requestedBy: string;
  project: {
    projectId?: number;
    appId: number;
    appName?: string;
  };
  environment?: {
    environmentId?: number;
    name?: string;
    baseUrl?: string;
    defaultTestLevel?: TestLevel;
  } | Record<string, unknown>;
  metadata: {
    language?: 'ko' | 'en' | string;
    createdAt: string;
    source: 'MANUAL' | 'INTERNAL';
  };
}

export interface AiAgentApiInput {
  apiId?: number;
  endpoint_id: string;
  method: string;
  path: string;
  domainTag?: string;
  request_body_schema?: object;
  response_schema?: object;
  authRequired?: boolean;
  deprecated?: boolean;
}

export interface AiTestCaseGenerationRequest extends AiAgentBaseRequest {
  agent: 'TEST_CASE_GENERATOR';
  generationContext: {
    generationId?: number;
    mode: 'SELECTED_APIS' | 'FROM_FAILURE';
    testLevel: string;
    currentCoverage?: number;
    targetCoverage?: number;
    contextSummary?: string;
  };
  apis: AiAgentApiInput[];
  existingTestCases?: Array<any>;
  failureContext?: object;
}

export interface AiTestCaseDraftResponse {
  apiId?: number;
  endpoint_id?: string;
  title: string;
  description?: string;
  type: string;
  userRole?: string;
  stateCondition?: string;
  dataVariant?: string;
  requestSpec: string;
  expectedSpec: string;
  assertionSpec: string;
  duplicate: boolean;
  testLevel?: TestLevel;
}

export interface AiTestCaseGenerationResponse {
  drafts: AiTestCaseDraftResponse[];
}

export interface AiScenarioBuildRequest extends AiAgentBaseRequest {
  agent: 'SCENARIO_BUILDER';
  scenarioContext: {
    appId: number;
    user_intent: string;
    mode: 'NATURAL_LANGUAGE' | 'RECOMMEND';
    testLevel?: string;
    businessDomain?: string;
  };
  apis: Array<Pick<AiAgentApiInput, 'endpoint_id' | 'method' | 'path' | 'request_body_schema' | 'response_schema'>>;
  existingScenarios?: Array<any>;
}

export interface AiScenarioBuildResponse {
  name: string;
  description?: string;
  type: string;
  meta?: {
    rationale?: string;
  };
  steps: Array<{
    order: number;
    endpoint_id: string;
    name: string;
    static_payload?: string;
    chained_variables?: string;
    expected_assertions?: string;
  }>;
}

export interface AiLogAnalysisResponse {
  diagnosis: string;
  failureCategory: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  likelyCauses?: string[];
  recommendedActions?: string[];
  reproduction?: {
    method?: string;
    path?: string;
    body?: object;
    expectedStatusCode?: number;
  };
  suggestedTestCases?: Array<{
    title?: string;
    type?: string;
    expectedSpec?: string;
  }>;
}

export interface AiTestStrategyClassifyRequest extends AiAgentBaseRequest {
  agent?: 'TEST_STRATEGY_CLASSIFIER';
  drafts: Array<Record<string, unknown>>;
}

export interface AiTestStrategyClassifyResponse {
  drafts: Array<{
    testLevel: TestLevel;
  }>;
}

function toQuery(params: Record<string, unknown>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  const text = await response.text();
  let payload: any;
  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    payload = { message: text };
  }

  if (!response.ok) {
    const message = payload?.message || response.statusText || 'API request failed';
    throw new Error(message);
  }

  return payload;
}

async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const response = await promise;
  if (response.success === false) {
    throw new Error(response.message || response.code || 'API request failed');
  }
  return response.data;
}

export const flowOpsApi = {
  listProjects: () => unwrap(request<ApiResponse<ProjectResponse[]>>('/projects')),

  createProject: (body: CreateProjectRequest) =>
    unwrap(request<ApiResponse<ProjectResponse>>('/projects', { method: 'POST', body: JSON.stringify(body) })),

  ensureProject: async () => {
    const projects = await flowOpsApi.listProjects();
    const activeProject = projects.find((project) => project.status !== 'ARCHIVED') || projects[0];
    if (activeProject) {
      rememberProjectId(activeProject.id);
      return activeProject;
    }

    const project = await flowOpsApi.createProject({
      name: DEFAULT_PROJECT_NAME,
      description: 'API QA automation workspace',
    });
    rememberProjectId(project.id);
    return project;
  },

  createApp: (body: CreateAppRequest) =>
    unwrap(request<ApiResponse<AppDetailResponse>>('/apps', { method: 'POST', body: JSON.stringify(body) })),

  getApp: (appId = DEFAULT_APP_ID) => unwrap(request<ApiResponse<AppDetailResponse>>(`/apps/${appId}`)),

  updateApp: (appId: number, body: Partial<CreateAppRequest> & { title?: string; main?: boolean }) =>
    unwrap(
      request<ApiResponse<AppDetailResponse>>(`/apps/${appId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    ),

  setMainApp: (appId: number, body: { title?: string } = {}) =>
    unwrap(
      request<ApiResponse<AppDetailResponse>>(`/apps/${appId}/main`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    ),

  listApis: (appId = DEFAULT_APP_ID, params: Record<string, unknown> = {}) =>
    unwrap(
      request<ApiResponse<PageResponse<ApiEndpointListItemResponse>>>(
        `/apps/${appId}/apis${toQuery({ page: 0, size: 100, ...params })}`,
      ),
    ),

  getApiDetail: (apiId: number) => unwrap(request<ApiResponse<ApiEndpointDetailResponse>>(`/apis/${apiId}`)),

  listInventories: (projectId: number, params: Record<string, unknown> = {}) =>
    unwrap(
      request<ApiResponse<ApiInventoryListResponse>>(
        `/projects/${projectId}/api-inventories${toQuery(params)}`,
      ),
    ),

  listEnvironments: (appId = DEFAULT_APP_ID) =>
    unwrap(request<ApiResponse<EnvironmentResponse[]>>(`/apps/${appId}/environments`)),

  createEnvironment: (appId: number, body: Partial<EnvironmentResponse>) =>
    unwrap(
      request<ApiResponse<EnvironmentResponse>>(`/apps/${appId}/environments`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ),

  updateEnvironment: (environmentId: number, body: Partial<EnvironmentResponse>) =>
    unwrap(
      request<ApiResponse<EnvironmentResponse>>(`/environments/${environmentId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    ),

  testConnection: (environmentId: number) =>
    unwrap(request<ApiResponse<unknown>>(`/environments/${environmentId}/test-connection`, { method: 'POST' })),

  registerRepository: (projectId: number, body: { fullName: string; appId?: number; selectedBranches?: string[] }) =>
    unwrap(
      request<ApiResponse<RepositoryResponse>>(`/projects/${projectId}/repositories`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ),

  listRepositories: (projectId: number) =>
    unwrap(request<ApiResponse<RepositoryResponse[]>>(`/projects/${projectId}/repositories`)),

  updateRepository: (
    projectId: number,
    repositoryId: number,
    body: Partial<Pick<RepositoryResponse, 'appId' | 'appTitle' | 'fullName' | 'defaultBranch' | 'connectionStatus'>>,
  ) =>
    unwrap(
      request<ApiResponse<RepositoryResponse>>(`/projects/${projectId}/repositories/${repositoryId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    ),

  deleteRepository: (projectId: number, repositoryId: number) =>
    unwrap(
      request<ApiResponse<void>>(`/projects/${projectId}/repositories/${repositoryId}`, {
        method: 'DELETE',
      }),
    ),

  listRepositoryBranches: (projectId: number, repositoryId: number) =>
    unwrap(
      request<ApiResponse<BranchResponse[]>>(`/projects/${projectId}/repositories/${repositoryId}/branches`),
    ),

  scanRepository: (projectId: number, repositoryId: number, branchNames: string[]) =>
    unwrap(
      request<ApiResponse<ScanResultResponse[]>>(`/projects/${projectId}/repositories/${repositoryId}/scan`, {
        method: 'POST',
        body: JSON.stringify({ branchNames }),
      }),
    ),

  runApis: (body: {
    appId: number;
    environmentId: number;
    apiIds: number[];
    executionMode: 'RUN_EXISTING' | 'GENERATE_AND_RUN';
    testLevel?: TestLevel;
    createdBy: string;
  }) =>
    unwrap(
      request<ApiResponse<ExecutionDetailResponse>>('/executions/run-apis', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ),

  createExecution: (body: Record<string, unknown>) =>
    unwrap(
      request<ApiResponse<ExecutionDetailResponse>>('/executions', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ),

  listExecutions: (appId = DEFAULT_APP_ID, params: Record<string, unknown> = {}) =>
    unwrap(
      request<ApiResponse<PageResponse<ExecutionDetailResponse>>>(
        `/apps/${appId}/executions${toQuery({ page: 0, size: 100, ...params })}`,
      ),
    ),

  listTestCases: (appId = DEFAULT_APP_ID, params: Record<string, unknown> = {}) =>
    unwrap(
      request<ApiResponse<PageResponse<TestCaseResponse>>>(
        `/apps/${appId}/test-cases${toQuery({ page: 0, size: 100, ...params })}`,
      ),
    ),

  listTestCasesByApi: (apiId: number) =>
    unwrap(request<ApiResponse<TestCaseResponse[]>>(`/apis/${apiId}/test-cases`)),

  createTestCase: (appId: number, body: Partial<TestCaseResponse> & Record<string, unknown>) =>
    unwrap(
      request<ApiResponse<TestCaseResponse>>(`/apps/${appId}/test-cases`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ),

  createTestGeneration: (body: CreateTestGenerationRequest) =>
    unwrap(
      request<ApiResponse<TestGenerationResponse>>('/test-generations', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ),

  getTestGeneration: (generationId: number) =>
    unwrap(request<ApiResponse<TestGenerationResponse>>(`/test-generations/${generationId}`)),

  listTestGenerationDrafts: (generationId: number) =>
    unwrap(request<ApiResponse<TestGenerationDraftResponse[]>>(`/test-generations/${generationId}/drafts`)),

  saveTestGenerationDrafts: (generationId: number, body: SaveTestGenerationDraftRequest) =>
    unwrap(
      request<ApiResponse<TestCaseResponse[] | { testCases?: TestCaseResponse[]; saved?: TestCaseResponse[] }>>(
        `/test-generations/${generationId}/save`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      ),
    ),

  generateAiTestCases: (body: AiTestCaseGenerationRequest) =>
    request<AiTestCaseGenerationResponse>('/ai/agents/test-cases/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  buildAiScenario: (body: AiScenarioBuildRequest) =>
    request<AiScenarioBuildResponse>('/ai/agents/scenarios/build', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  analyzeAiLogs: (body: Record<string, unknown>) =>
    request<AiLogAnalysisResponse>('/ai/agents/logs/analyze', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  classifyAiTestStrategy: (body: AiTestStrategyClassifyRequest) =>
    request<AiTestStrategyClassifyResponse>('/ai/agents/test-strategy/classify', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  runQuickTest: (environmentId: number, body: { domainTags?: string[]; createdBy: string }) =>
    unwrap(
      request<ApiResponse<ExecutionDetailResponse>>(`/environments/${environmentId}/quick-test`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ),

  listScenarios: (appId = DEFAULT_APP_ID) =>
    unwrap(request<ApiResponse<ScenarioSummaryResponse[]>>(`/apps/${appId}/scenarios`)),

  getScenario: (scenarioId: number) =>
    unwrap(request<ApiResponse<ScenarioDetailResponse>>(`/scenarios/${scenarioId}`)),

  getTestCase: (testCaseId: number) =>
    unwrap(request<ApiResponse<TestCaseResponse>>(`/test-cases/${testCaseId}`)),

  updateTestCase: (testCaseId: number, body: Partial<TestCaseResponse> & Record<string, unknown>) =>
    unwrap(
      request<ApiResponse<TestCaseResponse>>(`/test-cases/${testCaseId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    ),

  deleteTestCase: (testCaseId: number) =>
    unwrap(request<ApiResponse<void>>(`/test-cases/${testCaseId}`, { method: 'DELETE' })),

  setTestCaseActive: (testCaseId: number, active: boolean) =>
    unwrap(
      request<ApiResponse<TestCaseResponse>>(`/test-cases/${testCaseId}`, {
        method: 'PATCH',
        body: JSON.stringify({ active }),
      }),
    ),

  runTestCases: (body: {
    appId: number;
    environmentId: number;
    testCaseIds?: number[];
    testLevel?: TestLevel;
    createdBy: string;
  }) =>
    unwrap(
      request<ApiResponse<ExecutionDetailResponse>>('/executions/run-test-cases', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ),

  runScenario: (body: {
    appId: number;
    environmentId: number;
    scenarioId?: number;
    scenarioIds?: number[];
    testLevel?: TestLevel;
    createdBy: string;
  }) =>
    unwrap(
      request<ApiResponse<ExecutionDetailResponse>>('/executions/run-scenario', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ),

  rerunExecution: (executionId: number) =>
    unwrap(request<ApiResponse<ExecutionDetailResponse>>(`/executions/${executionId}/rerun`, { method: 'POST' })),

  rerunFailedExecution: (executionId: number) =>
    unwrap(request<ApiResponse<ExecutionDetailResponse>>(`/executions/${executionId}/rerun-failed`, { method: 'POST' })),

  getExecution: (executionId: number) =>
    unwrap(request<ApiResponse<ExecutionDetailResponse>>(`/executions/${executionId}`)),
};

export function rememberAppId(appId: number) {
  localStorage.setItem('flowOps.appId', String(appId));
}

export function rememberAppTitle(title: string) {
  localStorage.setItem('flowOps.appTitle', title);
  window.dispatchEvent(new Event('flowOps.applicationChanged'));
}

export function rememberProjectId(projectId: number) {
  localStorage.setItem('flowOps.projectId', String(projectId));
}
