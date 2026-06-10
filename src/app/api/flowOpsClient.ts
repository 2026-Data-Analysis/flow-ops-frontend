const API_BASE_URL =
  import.meta.env.VITE_FLOW_OPS_API_BASE_URL?.replace(/\/$/, '') ||
  (import.meta.env.DEV ? '/flow-ops-api' : 'https://flow-ops-server.onrender.com');

export const DEFAULT_APP_ID = Number(import.meta.env.VITE_FLOW_OPS_APP_ID || localStorage.getItem('flowOps.appId') || 1);
export const DEFAULT_REQUESTER = import.meta.env.VITE_FLOW_OPS_REQUESTER || 'qa.engineer@flowops.dev';
const DEFAULT_PROJECT_NAME = import.meta.env.VITE_FLOW_OPS_PROJECT_NAME || 'FlowOps Workspace';
export const DEFAULT_ENVIRONMENT_BASE_URL =
  import.meta.env.VITE_FLOW_OPS_DEFAULT_ENVIRONMENT_BASE_URL || 'http://localhost:8080';

export function getDefaultAppId() {
  return Number(import.meta.env.VITE_FLOW_OPS_APP_ID || localStorage.getItem('flowOps.appId') || 1);
}

export function getStoredProjectIdForApp(appId = getDefaultAppId()) {
  try {
    const repositories = JSON.parse(localStorage.getItem('flowOps.registeredRepositories') || '[]');
    if (Array.isArray(repositories)) {
      const repository = repositories.find((item) => Number(item?.appId) === appId && Number(item?.projectId) > 0);
      if (repository) {
        return Number(repository.projectId);
      }
    }
  } catch {
    // Ignore malformed local storage and fall back to the remembered project below.
  }

  const rememberedProjectId = Number(localStorage.getItem('flowOps.projectId'));
  return Number.isFinite(rememberedProjectId) && rememberedProjectId > 0 ? rememberedProjectId : null;
}

// 오케스트레이터가 테스트케이스/시나리오를 생성할 때 대상 API 서버를 알 수 있도록
// 절대 URL을 돌려준다. (dev에서 API_BASE_URL이 상대경로면 현재 origin으로 보정)
export function getApiServerUrl() {
  const serverUrl = import.meta.env.VITE_FLOW_OPS_API_SERVER_URL?.replace(/\/$/, '');
  if (serverUrl) return serverUrl;
  if (/^https?:\/\//i.test(API_BASE_URL)) return API_BASE_URL;
  if (typeof window !== 'undefined') return `${window.location.origin}${API_BASE_URL}`;
  return API_BASE_URL;
}

export interface ApiResponse<T> {
  success: boolean;
  code?: string;
  errorCode?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  trace_id?: string | null;
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
  successRate?: number;
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
  defaultTestLevelSource?: 'MANUAL' | 'AI_RECOMMENDED';
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
  main?: boolean;
  primary?: boolean;
  fullName: string;
  repositoryUrl?: string;
  defaultBranch?: string;
  connectionStatus?: 'ACTIVE' | 'DISCONNECTED' | 'ERROR';
  branches?: Array<{ name?: string; branchName?: string; defaultBranch?: boolean; selected?: boolean }>;
  scanResults?: ScanResultResponse[];
}

export interface BranchResponse {
  name: string;
  branchName?: string;
  isDefault?: boolean;
  defaultBranch?: boolean;
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
  tearDownMode?: boolean;
  executionType?: 'API' | 'API_BATCH' | 'TEST_CASE' | 'SCENARIO';
  targetId?: number;
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
  startedAt?: string;
  endedAt?: string;
  createdAt?: string;
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
  expectedStatusCodes?: number[];
  errorStatusCodes?: number[];
  errorCodes?: string[];
  executionMethod?: HttpMethod;
  executionEndpoint?: string;
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
  environmentId?: number;
  name: string;
  description?: string;
  type?: string;
  steps?: number;
  updatedAt?: string;
  lastExecutedAt?: string;
}

export interface ScenarioDetailResponse {
  id: number;
  appId: number;
  environmentId?: number;
  name: string;
  description?: string;
  type?: string;
  lastExecutedAt?: string;
  steps?: Array<{
    id: number;
    stepId?: string;
    ref?: string;
    stepOrder: number;
    apiId?: number;
    endpoint?: {
      id?: number;
      method?: HttpMethod | string;
      path?: string;
      domainTag?: string;
      controllerName?: string;
    };
    label?: string;
    chainedVariables?: Array<{ name?: string; sourceStep?: string; source_step?: string; jsonPath?: string; json_path?: string }> | unknown[];
    type?: string | null;
    testLevel?: TestLevel | string | null;
    userRole?: string | null;
    stateCondition?: string | null;
    dataVariant?: string | null;
    requestSpec?: Record<string, unknown> | string | null;
    expectedSpec?: Record<string, unknown> | string | null;
    assertionSpec?: Record<string, unknown> | string | null;
    duplicate?: boolean;
    requestConfig?: string | null;
    extractRules?: string | null;
    validationRules?: string | null;
    expectedStatusCodes?: number[];
    errorStatusCodes?: number[];
    errorCodes?: string[];
    executionMethod?: HttpMethod;
    executionEndpoint?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScenarioRecommendationRequest {
  appId: number;
  environmentId?: number | null;
  goal?: string | null;
  scenarioType?: 'HAPPY_PATH' | 'EDGE_CASE' | 'FAILURE_RECOVERY' | string | null;
  testLevel?: TestLevel | string | null;
  businessDomain?: string | null;
  requestedBy: string;
  apiIds?: number[] | null;
  maxScenarios?: number | null;
  maxStepsPerScenario?: number | null;
}

export interface ScenarioRecommendationResponse {
  name: string;
  description?: string | null;
  type: 'HAPPY_PATH' | 'EDGE_CASE' | 'FAILURE_RECOVERY' | string;
  recommendationReason?: string | null;
  steps?: Array<{
    order?: number;
    stepOrder?: number;
    apiId?: number | string | null;
    aiApiId?: string | null;
    method?: HttpMethod | string | null;
    path?: string | null;
    title?: string;
    description?: string | null;
    type?: string | null;
    userRole?: string | null;
    stateCondition?: string | null;
    dataVariant?: string | null;
    label?: string;
    requestConfig?: string | null;
    extractRules?: string | null;
    validationRules?: string | null;
    requestSpec?: string | null;
    expectedSpec?: string | null;
    assertionSpec?: string | null;
  }>;
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
  endpointName?: string;
  name?: string;
  title?: string;
  description?: string;
  type?: string;
  risk_level?: string;
  testLevel?: TestLevel;
  userRole?: string;
  role?: string;
  stateCondition?: string;
  edgeState?: string;
  edgeStates?: string[] | string;
  dataVariant?: string;
  requestSpec?: string;
  request?: {
    method?: HttpMethod | string;
    endpoint?: string;
    headers?: Record<string, unknown>;
    pathParams?: Record<string, unknown>;
    queryParams?: Record<string, unknown>;
    body?: unknown;
  };
  requestPreview?: unknown;
  expected?: unknown;
  assertion?: unknown;
  expectedResult?: string;
  expectedSpec?: string;
  assertionSpec?: string;
  validationRules?: string[] | unknown;
  expectedStatusCodes?: number[];
  errorStatusCodes?: number[];
  errorCodes?: string[];
  executionMethod?: HttpMethod;
  executionEndpoint?: string;
  selectedEndpoint?: {
    id?: number;
    method?: HttpMethod | string;
    path?: string;
    domainTag?: string;
    controllerName?: string;
  };
  duplicate?: boolean;
}

export interface CreateTestGenerationRequest {
  appId: number;
  environmentId?: number;
  requestedBy: string;
  selectedApiIds: number[];
  contextSummary?: string;
  currentCoverage?: number;
}

export interface SaveTestGenerationDraftRequest {
  appId?: number;
  testCases: Array<{
    draftId: number;
    name: string;
    expectedResult: string;
    expectedSpec?: string;
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
  expectedStatusCodes?: number[];
  errorStatusCodes?: number[];
  errorCodes?: string[];
  executionMethod?: HttpMethod;
  executionEndpoint?: string;
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

export interface IncidentLogEntry {
  timestamp: string;
  level: string;
  message: string;
  logger: string;
  stack_trace?: string | null;
  extra?: Record<string, unknown>;
}

export interface IncidentFailureContext {
  test_case_id?: string;
  endpoint?: string;
  expected_status?: number;
  actual_status?: number;
  request_body?: unknown;
  response_body?: unknown;
  error_message?: string;
}

export interface IncidentAnalyzeRequest {
  project_id: string;
  service_name: string;
  occurred_at: string;
  raw_log: string;
  log_entries?: IncidentLogEntry[];
  failure_context?: IncidentFailureContext;
}

export interface IncidentRootCause {
  summary: string;
  severity: string;
  suggested_fix: string;
  evidence: string[];
}

export interface IncidentAnalyzeResponse {
  success: boolean;
  data: {
    root_causes: IncidentRootCause[];
    internal_report: string;
    external_notice: string;
  };
  error_code: string | null;
  error_message: string | null;
  trace_id: string;
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

export interface AiOrchestratorChatRequest {
  project_id: string;
  user_prompt: string;
  context?: Record<string, unknown>;
}

export interface AiOrchestratorFormField {
  name: string;
  label?: string;
  type?: 'text' | 'url' | 'checkbox' | 'select' | string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  options?: Array<{ label?: string; value: string | boolean | number }>;
}

export interface AiOrchestratorAction {
  type?: string;
  resourceType?: 'application' | 'api_inventory' | string;
  route?: string;
  payload?: Record<string, unknown>;
  form?: {
    type?: string;
    fields?: AiOrchestratorFormField[];
  };
}

export interface AiOrchestratorResult {
  status: 'collect_input' | 'redirect' | 'ready' | 'need_validation' | string;
  resourceType?: 'application' | 'api_inventory' | string;
  action?: AiOrchestratorAction;
  payload?: Record<string, unknown>;
  route?: string;
  confirmation?: {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
  };
  requiresUserConfirmation?: boolean;
  message?: string;
}

export interface AiOrchestratorChatDataPayload {
  dispatched_agents?: string[];
  agent_results?: Array<{
    agent_type?: string;
    success?: boolean;
    data?: AiOrchestratorResult;
    error_message?: string | null;
  }>;
  summary?: string;
}

export interface AiOrchestratorChatResponse {
  success?: boolean;
  data?: AiOrchestratorChatDataPayload;
  error_code?: string | null;
  error_message?: string | null;
  trace_id?: string | null;
  // 일부 AI 서버는 래퍼 없이 agent_results를 최상위에 둘 수 있어 호환을 위해 유지
  agent_results?: AiOrchestratorChatDataPayload['agent_results'];
}

// ─── Orchestrator Dispatch (멀티 에이전트 디스패치) ──────────────────────────────

export interface OrchestratorContext {
  service_name: string;
  occurred_at: string;
  raw_log: string;
}

export interface OrchestratorRequest {
  project_id: string;
  user_prompt: string;
  context: OrchestratorContext;
}

export type RootCauseSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface RootCause {
  summary: string;
  evidence: string[];
  severity: RootCauseSeverity;
  suggested_fix: string;
}

export interface IncidentAgentData {
  root_causes: RootCause[];
  internal_report: string;
  external_notice: string;
}

export interface OrchestratorTestEndpoint {
  endpoint_id: string;
  path: string;
  method: string;
  summary?: string;
  auth?: { type: string };
  request_body_schema?: object;
  response_schema?: object;
}

export interface OrchestratorTestApiInventory {
  project_id: string;
  endpoints: OrchestratorTestEndpoint[];
}

export interface OrchestratorTestContext {
  base_url: string;
  env_name: string;
  api_inventory?: OrchestratorTestApiInventory;
}

export interface OrchestratorTestRequest {
  project_id: string;
  user_prompt: string;
  context: OrchestratorTestContext;
}

export interface OrchestratorTestCaseDraft {
  id?: number;
  draftId?: number;
  apiId: string;
  endpointName?: string;
  selectedEndpoint?: {
    id?: number;
    method?: string;
    path?: string;
    domainTag?: string;
    controllerName?: string;
  };
  title: string;
  description: string;
  type: string;
  risk_level?: string;
  test_case_type?: string;
  testLevel?: TestLevel | string;
  userRole: string | null;
  stateCondition: string | null;
  dataVariant: string | null;
  requestSpec: {
    method: string;
    endpoint?: string;
    pathParams: Record<string, unknown>;
    queryParams: Record<string, unknown>;
    body: unknown;
  };
  request?: {
    method?: string;
    endpoint?: string;
    headers?: Record<string, unknown>;
    pathParams?: Record<string, unknown>;
    queryParams?: Record<string, unknown>;
    body?: unknown;
  };
  executionMethod?: string;
  executionEndpoint?: string;
  expected?: unknown;
  assertion?: unknown;
  expectedResult?: string;
  expectedSpec: {
    statusCode: number;
    body: unknown;
    errorMessage: string | null;
  } | string;
  assertionSpec: {
    statusCode: number;
    bodyContains: string[];
    headerContains: Record<string, string>;
  } | string;
  validationRules?: string[] | unknown;
  expectedStatusCodes?: number[];
  errorStatusCodes?: number[];
  errorCodes?: string[];
  duplicate: boolean;
}

export interface OrchestratorTestCaseData {
  requestId: string;
  generationId: string;
  drafts: OrchestratorTestCaseDraft[];
}

export interface OrchestratorScenarioEndpoint {
  endpoint_id: string;
  path: string;
  method: string;
  summary?: string;
  auth?: { type: string };
  request_body_schema?: object;
  response_schema?: object;
  parameters?: Array<{
    name: string;
    location: string;
    type: string;
    required: boolean;
  }>;
}

export interface OrchestratorScenarioApiInventory {
  project_id: string;
  endpoints: OrchestratorScenarioEndpoint[];
}

export interface OrchestratorScenarioContext {
  api_inventory: OrchestratorScenarioApiInventory;
}

export interface OrchestratorScenarioRequest {
  project_id: string;
  user_prompt: string;
  context: OrchestratorScenarioContext;
}

export interface OrchestratorChainedVariable {
  name: string;
  source: string;
  source_step_ref: string;
  source_json_path: string;
  literal_value: string | null;
  target_location: string;
  target_field: string;
  target_template: string | null;
}

export interface OrchestratorScenarioStep {
  step_id: string;
  ref: string;
  order: number;
  endpoint_id: string;
  name: string;
  description: string | null;
  static_payload: Record<string, unknown> | null;
  static_params: Record<string, unknown>;
  chained_variables: OrchestratorChainedVariable[];
  expected_status_code: number;
  expected_assertions: string[];
}

export interface OrchestratorScenarioMeta {
  rationale: string;
  coverage_gap: string | null;
  estimated_risk: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface OrchestratorScenario {
  scenario_id: string;
  name: string;
  description: string | null;
  steps: OrchestratorScenarioStep[];
  meta: OrchestratorScenarioMeta;
}

export interface OrchestratorScenarioData {
  scenarios: OrchestratorScenario[];
  used_endpoint_ids: string[];
}

export interface OrchestratorAgentResult {
  agent_type: string;
  success: boolean;
  data: IncidentAgentData | OrchestratorTestCaseData | OrchestratorScenarioData | null;
  error_message: string | null;
}

export interface OrchestratorApiResponse {
  success: boolean;
  data: {
    dispatched_agents: string[];
    agent_results: OrchestratorAgentResult[];
    summary: string;
  };
  error_code: string | null;
  error_message: string | null;
  trace_id: string;
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

  if (typeof text === 'string' && /<\/?[a-z][\s\S]*>/i.test(text) && payload?.message === text) {
    throw new Error(`API request failed (${response.status} ${response.statusText || 'Error'}). The server returned an HTML page instead of JSON.`);
  }

  if (!response.ok) {
    const rawMessage = payload?.message || response.statusText || 'API request failed';
    const message = typeof rawMessage === 'string' && /<\/?[a-z][\s\S]*>/i.test(rawMessage)
      ? `API request failed (${response.status} ${response.statusText || 'Error'}). The server returned an HTML page instead of JSON.`
      : rawMessage;
    console.error('[flowOpsApi] request failed', {
      path,
      status: response.status,
      statusText: response.statusText,
      payload,
    });
    throw new Error(message);
  }

  return payload;
}

async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const response = await promise;
  if (response == null) {
    return response as T;
  }
  if (response.success === false) {
    throw new Error(response.message || response.error_message || response.errorCode || response.error_code || response.code || 'API request failed');
  }
  return response.data ?? (response as T);
}

// ── Scenario V2 (AI scenario builder with full step spec) ──────────────────

export interface ScenarioV2Step {
  step_id?: string;
  stepId?: string;
  ref?: string;
  order?: number;
  stepOrder?: number;
  chained_variables?: Array<{ name: string; source_step: string; json_path: string }> | unknown;
  chainedVariables?: unknown[];
  apiId?: number | string;
  title?: string;
  name?: string;
  label?: string;
  description?: string | null;
  type?: string;
  test_case_type?: string | null;
  testLevel?: TestLevel | string | null;
  userRole?: string | null;
  stateCondition?: string | null;
  dataVariant?: string | null;
  requestSpec?: {
    method?: string;
    pathParams?: Record<string, unknown>;
    queryParams?: Record<string, unknown>;
    body?: Record<string, unknown>;
    [key: string]: unknown;
  } | null;
  expectedSpec?: {
    statusCode?: number;
    body?: unknown;
    errorMessage?: string | null;
    [key: string]: unknown;
  } | null;
  assertionSpec?: {
    statusCode?: number;
    bodyContains?: unknown[];
    bodyEquals?: Record<string, unknown>;
    headerContains?: Record<string, unknown>;
    [key: string]: unknown;
  } | null;
  duplicate?: boolean;
  static_payload?: unknown;
  static_params?: unknown;
  expected_status_code?: number | null;
  expected_assertions?: string[] | null;
  expectedStatusCodes?: number[];
  errorStatusCodes?: number[];
  errorCodes?: string[];
  executionMethod?: HttpMethod;
  executionEndpoint?: string;
}

export interface ScenarioV2Meta {
  rationale?: string;
  coverage_gap?: string;
  estimated_risk?: string;
}

export interface ScenarioV2 {
  scenario_id?: string;
  name?: string;
  description?: string | null;
  steps?: ScenarioV2Step[];
  meta?: ScenarioV2Meta;
}

export interface ScenarioV2GenerateRequest {
  appId: number;
  environmentId?: number | null;
  goal?: string;
  scenarioType?: string;
  testLevel?: string;
  businessDomain?: string;
  requestedBy?: string;
  apiIds?: number[];
  maxScenarios?: number | null;
  maxStepsPerScenario?: number | null;
}

export interface ScenarioV2GenerateResponse {
  success: boolean;
  data?: {
    scenarios?: ScenarioV2[];
    used_endpoint_ids?: string[];
  };
  error_code?: string;
  error_message?: string;
  trace_id?: string;
}

export const flowOpsApi = {
  listProjects: () => unwrap(request<ApiResponse<ProjectResponse[]>>('/projects')),

  createProject: (body: CreateProjectRequest) =>
    unwrap(request<ApiResponse<ProjectResponse>>('/projects', { method: 'POST', body: JSON.stringify(body) })),

  ensureProject: async () => {
    const projects = await flowOpsApi.listProjects();
    const normalizedDefaultName = DEFAULT_PROJECT_NAME.trim().toLowerCase();
    const activeProjects = projects.filter((project) => project.status !== 'ARCHIVED');
    const activeProject =
      activeProjects.find((project) => project.name?.trim().toLowerCase() === normalizedDefaultName) ||
      activeProjects.find((project) => project.slug === 'flowops-workspace') ||
      activeProjects.find((project) => project.name?.trim().toLowerCase().includes('flowops')) ||
      activeProjects[0] ||
      projects[0];
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

  resolveMainApplication: async () => {
    const project = await flowOpsApi.ensureProject();
    const repositories = await flowOpsApi.listRepositories(project.id).catch(() => [] as RepositoryResponse[]);
    const appIds = Array.from(
      new Set(repositories.map((repository) => repository.appId).filter((appId): appId is number => Boolean(appId))),
    );

    const repositoryMarkedMain = repositories.find((repository) => repository.main || repository.primary);
    if (repositoryMarkedMain?.appId) {
      return {
        appId: repositoryMarkedMain.appId,
        title: repositoryMarkedMain.appTitle || repositoryMarkedMain.fullName.split('/').pop() || 'Main Application',
      };
    }

    const appDetails = (
      await Promise.all(appIds.map((appId) => flowOpsApi.getApp(appId).catch(() => null)))
    ).filter(Boolean) as AppDetailResponse[];
    const mainApp =
      appDetails.find((app) => app.main || app.primary) ||
      appDetails.find((app) => app.id === getDefaultAppId()) ||
      appDetails[0];

    if (mainApp) {
      return {
        appId: mainApp.id,
        title: mainApp.title || mainApp.name || 'Main Application',
      };
    }

    const fallbackAppId = getDefaultAppId();
    const fallbackApp = await flowOpsApi.getApp(fallbackAppId);
    return {
      appId: fallbackApp.id,
      title: fallbackApp.title || fallbackApp.name || 'Main Application',
    };
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

  deleteApp: (appId: number) =>
    unwrap(request<ApiResponse<void>>(`/apps/${appId}`, { method: 'DELETE' })),

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

  getInventoryDetail: (projectId: number, inventoryId: number) =>
    unwrap(request<ApiResponse<ApiInventoryResponse>>(`/projects/${projectId}/api-inventories/${inventoryId}`)),

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
    tearDownMode?: boolean;
    createdBy: string;
  }) =>
    unwrap(
      request<ApiResponse<ExecutionDetailResponse>>('/executions/run-apis', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ),

  runBatchTests: (body: {
    appId: number;
    environmentId: number;
    apiIds?: number[];
    testCaseIds?: number[];
    testLevel?: TestLevel;
    tearDownMode?: boolean;
    createdBy: string;
  }) =>
    unwrap(
      request<ApiResponse<ExecutionDetailResponse>>('/executions/batch-tests', {
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

  listTestCases: async (appId = DEFAULT_APP_ID, params: Record<string, unknown> = {}) => {
    const apis = await flowOpsApi.listApis(appId, params);
    const testCases = (
      await Promise.all(
        apis.content
          .map((api) => api.id)
          .filter((apiId) => Number.isFinite(apiId) && apiId > 0)
          .map((apiId) => flowOpsApi.listTestCasesByApi(apiId).catch(() => [] as TestCaseResponse[])),
      )
    ).flat();

    return {
      content: testCases,
      page: 0,
      size: testCases.length,
      totalElements: testCases.length,
      totalPages: testCases.length > 0 ? 1 : 0,
      first: true,
      last: true,
    } satisfies PageResponse<TestCaseResponse>;
  },

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
      request<ApiResponse<TestCaseResponse[] | {
        testCases?: TestCaseResponse[];
        saved?: TestCaseResponse[];
        savedCount?: number;
        savedTestCaseIds?: number[];
        apiIds?: number[];
      }>>(
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

  analyzeIncident: (body: IncidentAnalyzeRequest) =>
    unwrap(request<ApiResponse<IncidentAnalyzeResponse>>('/ai/agents/incidents/analyze', {
      method: 'POST',
      body: JSON.stringify(body),
    })),

  classifyAiTestStrategy: (body: AiTestStrategyClassifyRequest) =>
    request<AiTestStrategyClassifyResponse>('/ai/agents/test-strategy/classify', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  dispatchOrchestrator: (body: OrchestratorRequest) =>
    request<OrchestratorApiResponse>('/api/v1/orchestrator/dispatch', { method: 'POST', body: JSON.stringify(body) }),

  dispatchOrchestratorTest: (body: OrchestratorTestRequest) =>
    request<OrchestratorApiResponse>('/api/v1/orchestrator/dispatch', { method: 'POST', body: JSON.stringify(body) }),

  dispatchOrchestratorScenario: (body: OrchestratorScenarioRequest) =>
    request<OrchestratorApiResponse>('/api/v1/orchestrator/dispatch', { method: 'POST', body: JSON.stringify(body) }),

  // 프롬프트를 그대로 오케스트레이터(AI)에 전달하고, 라우팅된 agent 결과 전체를 반환한다.
  // 응답은 dispatch와 동일한 { success, data: { dispatched_agents, agent_results, summary }, ... } 구조.
  chatOrchestrator: async (body: AiOrchestratorChatRequest): Promise<OrchestratorApiResponse> => {
    const response = await request<unknown>(
      '/ai/agents/orchestrator/chat',
      { method: 'POST', body: JSON.stringify(body) },
    );
    // { data: { data: { agent_results } } } 까지 중첩될 수 있어, agent_results를 가진
    // 레벨이 나올 때까지 data를 단계적으로 벗긴다.
    let cursor: Record<string, unknown> | undefined = response as Record<string, unknown>;
    for (let i = 0; i < 4 && cursor && typeof cursor === 'object'; i += 1) {
      const node = cursor as { data?: { agent_results?: unknown } };
      if (Array.isArray(node.data?.agent_results)) {
        return cursor as unknown as OrchestratorApiResponse;
      }
      cursor = (cursor as { data?: Record<string, unknown> }).data;
    }
    return (response as OrchestratorApiResponse);
  },

  orchestrateChat: async (body: AiOrchestratorChatRequest): Promise<AiOrchestratorResult> => {
    const response = await request<ApiResponse<AiOrchestratorChatResponse> | AiOrchestratorChatResponse>(
      '/ai/agents/orchestrator/chat',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );

    // 응답 구조 디버깅용 — 실제 오케스트레이터 응답 형태를 콘솔에서 확인할 수 있다.
    // eslint-disable-next-line no-console
    console.debug('[orchestrateChat] raw response', response);

    // 응답은 다음과 같이 최대 2단계까지 중첩될 수 있다:
    //   ApiResponse.data → OrchestratorChatResponse → OrchestratorChatDataPayload(agent_results)
    // 일부 AI 서버는 래퍼 없이 agent_results를 더 위 레벨에 둘 수도 있어 단계적으로 탐색한다.
    const levels: Array<Record<string, unknown> | undefined> = [];
    let cursor: unknown = response;
    for (let i = 0; i < 4 && cursor && typeof cursor === 'object'; i += 1) {
      const node = cursor as Record<string, unknown>;
      levels.push(node);
      cursor = node.data;
    }

    const payloadWithResults = levels.find(
      (level) => Array.isArray((level as { agent_results?: unknown } | undefined)?.agent_results),
    ) as AiOrchestratorChatDataPayload | undefined;

    const result = payloadWithResults?.agent_results?.find((entry) => entry?.data)?.data;
    if (result) {
      return result;
    }

    // agent_results의 actionable data가 없으면 summary/메시지라도 사용자에게 보여준다.
    const summaryLevel = levels.find(
      (level) => typeof (level as { summary?: unknown } | undefined)?.summary === 'string',
    ) as AiOrchestratorChatDataPayload | undefined;
    if (summaryLevel?.summary) {
      return { status: 'ready', message: summaryLevel.summary };
    }

    const errorLevel = levels.find(
      (level) => typeof (level as { error_message?: unknown } | undefined)?.error_message === 'string',
    ) as AiOrchestratorChatResponse | undefined;
    if (errorLevel?.error_message) {
      throw new Error(errorLevel.error_message);
    }

    throw new Error('AI orchestrator returned no actionable result.');
  },

  runQuickTest: (environmentId: number, body: { domainTags?: string[]; tearDownMode?: boolean; createdBy: string }) =>
    unwrap(
      request<ApiResponse<ExecutionDetailResponse>>(`/environments/${environmentId}/quick-test`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ),

  listScenarios: (appId = DEFAULT_APP_ID) =>
    unwrap(request<ApiResponse<ScenarioSummaryResponse[]>>(`/apps/${appId}/scenarios`)),

  listScenariosByEnvironment: (appId: number, environmentId?: number) =>
    unwrap(
      request<ApiResponse<ScenarioSummaryResponse[]>>(
        `/apps/${appId}/scenarios${environmentId !== undefined ? `?environmentId=${environmentId}` : ''}`,
      ),
    ),

  createScenario: (body: {
    appId: number;
    environmentId?: number;
    name: string;
    description?: string;
    type?: string;
    recommendationReason?: string;
    source?: 'AI' | 'MANUAL' | string;
    steps: Array<{
      stepOrder: number;
      apiId: number;
      label: string;
      stepId?: string;
      ref?: string;
      chainedVariables?: unknown[] | null;
      type?: string | null;
      testLevel?: TestLevel | string | null;
      userRole?: string | null;
      stateCondition?: string | null;
      dataVariant?: string | null;
      requestSpec?: unknown;
      expectedSpec?: unknown;
      assertionSpec?: unknown;
      duplicate?: boolean;
      requestConfig?: string | null;
      extractRules?: string | null;
      validationRules?: string | null;
    }>;
  }) =>
    unwrap(
      request<ApiResponse<ScenarioDetailResponse>>('/scenarios', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ),

  recommendScenarios: async (body: ScenarioRecommendationRequest) => {
    const response = await request<(ApiResponse<ScenarioRecommendationResponse[]> & { errorCode?: string | null }) | ScenarioRecommendationResponse[]>(
      '/scenarios/recommend',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
    if (Array.isArray(response)) return response;
    if (response.success === false) {
      throw new Error(response.message || response.errorCode || response.code || 'Scenario recommendation failed');
    }
    return response.data || [];
  },

  getScenario: (scenarioId: number) =>
    unwrap(request<ApiResponse<ScenarioDetailResponse>>(`/scenarios/${scenarioId}`)),

  deleteScenario: (scenarioId: number) =>
    unwrap(request<ApiResponse<void>>(`/scenarios/${scenarioId}`, { method: 'DELETE' })),

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
    tearDownMode?: boolean;
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
    tearDownMode?: boolean;
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

  generateScenarioV2: (body: ScenarioV2GenerateRequest) =>
    request<ApiResponse<ScenarioV2GenerateResponse>>('/scenarios/v2/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
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
  window.dispatchEvent(new Event('flowOps.projectChanged'));
}
