import type {
  ApiInventoryResponse,
  OrchestratorScenario,
  OrchestratorScenarioStep,
  TestLevel,
} from '../api/flowOpsClient';

type SaveScenarioType = 'HAPPY_PATH' | 'EDGE_CASE' | 'FAILURE_RECOVERY' | string;

export interface ScenarioSavePayload {
  appId: number;
  environmentId?: number;
  name: string;
  description?: string;
  type?: SaveScenarioType;
  recommendationReason?: string;
  testLevel?: TestLevel | string | null;
  estimatedRisk?: string | null;
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
    requestSpec?: unknown;
    expectedSpec?: unknown;
    assertionSpec?: unknown;
    duplicate?: boolean;
  }>;
}

const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function normalizeHttpMethod(value?: unknown) {
  if (typeof value !== 'string') return undefined;
  const method = value.trim().toUpperCase();
  return HTTP_METHODS.has(method) ? method : undefined;
}

function splitMethodEndpoint(value?: unknown) {
  if (typeof value !== 'string') return {};
  const trimmed = value.trim();
  const match = trimmed.match(/^([A-Z]+)\s*[: ]\s*(\/.*)$/i);
  if (!match) return {};
  const method = normalizeHttpMethod(match[1]);
  return method ? { method, endpoint: match[2].trim() } : {};
}

function normalizeEndpointPath(value?: unknown) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || normalizeHttpMethod(trimmed)) return undefined;
  const split = splitMethodEndpoint(trimmed);
  if (split.endpoint) return split.endpoint;
  if (trimmed.startsWith('/')) return trimmed;
  try {
    const url = new URL(trimmed);
    return `${url.pathname}${url.search}`;
  } catch {
    const slashIndex = trimmed.indexOf('/');
    return slashIndex >= 0 ? trimmed.slice(slashIndex) : undefined;
  }
}

function scenarioTypeForSave(scenario: OrchestratorScenario): SaveScenarioType {
  const flexible = scenario as OrchestratorScenario & {
    type?: string;
    test_level?: string;
    meta?: OrchestratorScenario['meta'] & { type?: string };
  };
  return flexible.type ?? flexible.meta?.type ?? 'HAPPY_PATH';
}

function scenarioTestLevelForSave(scenario: OrchestratorScenario) {
  const flexible = scenario as OrchestratorScenario & {
    test_level?: string;
    meta?: OrchestratorScenario['meta'] & { test_level?: string };
  };
  return flexible.test_level ?? flexible.meta?.test_level ?? 'SANITY';
}

function scenarioEndpointCandidates(step: OrchestratorScenarioStep): string[] {
  const requestSpec = step.requestSpec ?? {};
  const direct = [step.endpoint_id, step.apiId].filter(Boolean).map(String);
  const requestMethod = normalizeHttpMethod(requestSpec.method);
  const requestPath = normalizeEndpointPath(requestSpec.path);
  const methodPath = requestMethod && requestPath ? [`${requestMethod}:${requestPath}`] : [];
  return [...direct, ...methodPath];
}

export function resolveInventoryForScenarioStep(
  step: OrchestratorScenarioStep,
  inventories: ApiInventoryResponse[],
) {
  const candidates = scenarioEndpointCandidates(step);

  for (const key of candidates) {
    const normalizedKey = key.trim();
    const split = splitMethodEndpoint(normalizedKey);
    const pathOnly = normalizeEndpointPath(normalizedKey);

    const match = inventories.find((item) => {
      const flexible = item as ApiInventoryResponse & {
        inventoryId?: string | number;
        endpoint_id?: string;
        endpointId?: string;
        path?: string;
      };
      const inventoryId = String(flexible.id ?? flexible.inventoryId ?? '');
      const endpointId = flexible.endpoint_id ?? flexible.endpointId;
      const path = flexible.endpointPath ?? flexible.path;
      const method = String(flexible.method || '').toUpperCase();
      const methodPath = method && path ? `${method}:${path}` : undefined;

      return (
        inventoryId === normalizedKey ||
        endpointId === normalizedKey ||
        methodPath === normalizedKey ||
        (split.method && split.endpoint && method === split.method && path === split.endpoint) ||
        (pathOnly && path === pathOnly)
      );
    });

    if (match) return match;
  }

  return null;
}

export function normalizeScenarioForSave(
  scenario: OrchestratorScenario,
  inventories: ApiInventoryResponse[],
  options: { appId: number; environmentId?: number } = { appId: 1 },
): ScenarioSavePayload {
  const meta = scenario.meta ?? {};
  const steps = asArray<OrchestratorScenarioStep>(scenario.steps)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((step, index) => {
      const inventory = resolveInventoryForScenarioStep(step, inventories);
      if (!inventory?.id) {
        const endpointId = step.endpoint_id ?? step.apiId ?? step.requestSpec?.path ?? `step ${index + 1}`;
        throw new Error(`Unable to resolve scenario step endpoint: ${endpointId}`);
      }

      return {
        stepOrder: step.order ?? index + 1,
        apiId: inventory.id,
        label: step.name ?? step.title ?? `Step ${index + 1}`,
        stepId: step.step_id,
        ref: step.ref,
        chainedVariables: asArray<unknown>(step.chained_variables),
        requestSpec: step.requestSpec ?? {
          body: step.static_payload ?? null,
          pathParams: step.static_params ?? {},
          queryParams: {},
        },
        expectedSpec: step.expectedSpec ?? {
          statusCode: step.expected_status_code ?? null,
        },
        assertionSpec: step.assertionSpec ?? {
          bodyContains: step.expected_assertions ?? [],
        },
        duplicate: false,
      };
    });

  return {
    appId: options.appId,
    ...(options.environmentId !== undefined ? { environmentId: options.environmentId } : {}),
    name: scenario.name,
    description: scenario.description ?? undefined,
    type: scenarioTypeForSave(scenario),
    recommendationReason: meta.rationale ?? undefined,
    testLevel: scenarioTestLevelForSave(scenario),
    estimatedRisk: meta.estimated_risk ?? null,
    source: 'AI',
    steps,
  };
}
