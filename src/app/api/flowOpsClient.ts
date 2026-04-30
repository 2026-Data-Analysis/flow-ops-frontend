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
  operationId?: string;
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

  runQuickTest: (environmentId: number, body: { domainTags?: string[]; createdBy: string }) =>
    unwrap(
      request<ApiResponse<ExecutionDetailResponse>>(`/environments/${environmentId}/quick-test`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    ),
};

export function rememberAppId(appId: number) {
  localStorage.setItem('flowOps.appId', String(appId));
}

export function rememberProjectId(projectId: number) {
  localStorage.setItem('flowOps.projectId', String(projectId));
}
