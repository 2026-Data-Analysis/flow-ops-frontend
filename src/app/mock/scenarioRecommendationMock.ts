type ApiInventory = {
  id: number;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'TRACE';
  endpointPath: string;
  operationId?: string;
  domainTag?: string;
  updatedAt?: string;
  createdAt?: string;
};

type ScenarioStep = {
  id: string;
  order: number;
  apiId?: number;
  label: string;
  apiEndpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  extractedVars: Array<{ id: string; name: string; jsonPath: string }>;
  validationRules?: string[];
  stopOnFail: boolean;
};

type ScenarioTemplate = {
  id: string;
  title: string;
  description: string;
  type: 'happy-path' | 'edge-case' | 'failure-recovery';
  reason: string;
  recommendationReason?: string;
  reasonType: 'critical' | 'risk' | 'coverage';
  steps: ScenarioStep[];
  lastUpdated?: string;
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

const toScenarioMethod = (method: ApiInventory['method']): ScenarioStep['method'] =>
  (method === 'TRACE' || method === 'OPTIONS' || method === 'HEAD' ? 'GET' : method) as ScenarioStep['method'];

const createStep = (
  id: string,
  order: number,
  label: string,
  method: ScenarioStep['method'],
  apiEndpoint: string,
  options: Partial<ScenarioStep> = {},
): ScenarioStep => ({
  id,
  order,
  label,
  method,
  apiEndpoint,
  extractedVars: [],
  validationRules: ['Status code validation', 'Response schema check'],
  stopOnFail: order === 1,
  ...options,
});

const findApi = (items: ApiInventory[], ...keywords: string[]) =>
  items.find((api) => {
    const haystack = `${api.method} ${api.endpointPath} ${api.operationId || ''} ${api.domainTag || ''}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  });

export const buildScenariosFromApis = (items: ApiInventory[]): ScenarioTemplate[] => {
  if (items.length < 2) return [];

  const login = findApi(items, 'login', 'auth');
  const user = findApi(items, 'user', 'profile');
  const cart = findApi(items, 'cart');
  const order = findApi(items, 'order');
  const payment = findApi(items, 'payment');
  const product = findApi(items, 'product', 'item');

  const checkoutApis = [cart, product, payment, order].filter(Boolean) as ApiInventory[];
  const authApis = [login, user].filter(Boolean) as ApiInventory[];
  const fallbackApis = items.slice(0, 4);

  const createApiSteps = (apis: ApiInventory[], prefix: string) =>
    apis.map((api, index) =>
      createStep(
        `${prefix}-${api.id}`,
        index + 1,
        api.operationId || `${api.method} ${api.endpointPath}`,
        toScenarioMethod(api.method),
        api.endpointPath,
        {
          apiId: api.id,
          extractedVars: index === 0 ? [{ id: `${prefix}-id`, name: 'resourceId', jsonPath: '$.id' }] : [],
          validationRules: ['Status code validation', 'Response schema check', index > 0 ? 'Uses variables from previous step' : 'Extracts reusable response data'],
        },
      ),
    );

  const recommended = [
    checkoutApis.length >= 3 && {
      id: 'recommend-inventory-checkout-flow',
      title: 'Checkout Scenario - Happy Path',
      description: 'Create a cart, add an item, and submit an order as one end-to-end customer flow.',
      type: 'happy-path' as const,
      reason: 'Critical revenue journey spans cart, inventory, and payment APIs',
      recommendationReason: 'Critical revenue journey spans cart, inventory, and payment APIs',
      reasonType: 'critical' as const,
      lastUpdated: formatRelativeTime(checkoutApis[0].updatedAt || checkoutApis[0].createdAt),
      steps: createApiSteps(checkoutApis, 'inventory-checkout'),
    },
    authApis.length >= 2 && {
      id: 'recommend-auth-inventory-flow',
      title: 'Authentication and Profile Flow',
      description: 'Login and access the user profile in sequence.',
      type: 'happy-path' as const,
      reason: 'Token propagation and user state changes should be tested across dependent APIs',
      recommendationReason: 'Token propagation and user state changes should be tested across dependent APIs',
      reasonType: 'coverage' as const,
      lastUpdated: formatRelativeTime(authApis[0].updatedAt || authApis[0].createdAt),
      steps: createApiSteps(authApis, 'auth-inventory'),
    },
    {
      id: 'recommend-cross-api-regression',
      title: 'Cross-API Regression Scenario',
      description: 'Chain multiple discovered APIs to verify shared state, variable extraction, and dependent response contracts.',
      type: 'edge-case' as const,
      reason: 'Generated from backend API inventory to cover endpoints together instead of in isolation',
      recommendationReason: 'Generated from backend API inventory to cover endpoints together instead of in isolation',
      reasonType: 'coverage' as const,
      lastUpdated: formatRelativeTime(fallbackApis[0]?.updatedAt || fallbackApis[0]?.createdAt),
      steps: createApiSteps(fallbackApis, 'cross-api'),
    },
  ].filter(Boolean) as ScenarioTemplate[];

  return recommended.slice(0, 4);
};
