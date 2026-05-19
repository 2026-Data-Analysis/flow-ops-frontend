type ApiEndpoint = {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  path: string;
  requestSchema?: unknown;
};

type TestCase = {
  id: string;
  name: string;
  type: 'success' | 'validation' | 'auth' | 'performance' | 'edge' | 'error';
  backendType?: string;
  testLevel?: 'SMOKE' | 'SANITY' | 'REGRESSION' | 'FULL';
  apiId: string;
  role?: string;
  stateCondition?: string;
  dataVariant?: string;
  status?: 'new' | 'duplicate' | 'existing';
  description?: string;
  expectedResult?: string;
  requestPreview?: string;
  requestSpec?: string;
  assertionSpec?: string;
  validationRules?: string[];
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

const sampleForSchema = (schema: any): any => {
  if (!schema) return undefined;
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.enum?.length) return schema.enum[0];
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  if (type === 'string') return schema.format === 'email' ? 'test@example.com' : 'sample';
  if (type === 'integer' || type === 'number') return 1;
  if (type === 'boolean') return true;
  if (type === 'array') return [sampleForSchema(schema.items) ?? 'sample'];
  if (type === 'object' || schema.properties) {
    return Object.fromEntries(Object.entries(schema.properties || {}).map(([key, value]) => [key, sampleForSchema(value)]));
  }
  return schema;
};

const buildRequestDefaults = (schema?: unknown) => {
  const value = schema as any;
  if (!value) return undefined;
  if (value.pathParams || value.queryParams || value.headers || value.body) return value;
  return {
    pathParams: sampleForSchema(value.pathParamsSchema || value.parameters?.path) || {},
    queryParams: sampleForSchema(value.queryParamsSchema || value.parameters?.query) || {},
    headers: sampleForSchema(value.headersSchema || value.parameters?.header) || {},
    body: sampleForSchema(value.bodySchema || value.requestBody || value),
  };
};

export const buildMockGeneratedTests = (
  selectedApis: ApiEndpoint[],
  roles: string[],
  states: string[],
  variants: string[],
  existingTests: TestCase[],
): TestCase[] =>
  selectedApis.flatMap((api) => {
    const samples = [
      { role: roles[0] || 'User', state: states[0] || 'Logged In', variant: variants[0] || 'Valid Input', type: 'HAPPY_PATH' },
      { role: roles[1] || roles[0] || 'User', state: states[1] || 'Token Expired', variant: variants[1] || 'Invalid Input', type: 'VALIDATION' },
      { role: roles[0] || 'Admin', state: states[2] || 'Rate Limited', variant: variants[2] || 'Boundary Value', type: 'EDGE_CASE' },
    ];

    return samples.map((sample, index) => {
      const isDuplicate = existingTests.some(
        (existing) =>
          existing.apiId === api.id &&
          existing.role === sample.role &&
          existing.stateCondition === sample.state &&
          existing.dataVariant === sample.variant,
      );
      const requestSpec = JSON.stringify(
        buildRequestDefaults(api.requestSchema) || {
          method: api.method,
          path: api.path,
          ...(api.method === 'GET' || api.method === 'HEAD'
            ? { queryParams: { id: 'sample-id', includeMeta: true } }
            : { body: { sample: true, variant: sample.variant } }),
        },
        null,
        2,
      );

      return {
        id: `mock-${api.id}-${index}`,
        name: `${api.method} ${api.path} - ${sample.role} ${sample.variant}`,
        type: mapBackendType(sample.type),
        backendType: sample.type,
        testLevel: index === 0 ? 'SMOKE' : 'REGRESSION',
        apiId: api.id,
        role: sample.role,
        stateCondition: sample.state,
        dataVariant: sample.variant,
        status: isDuplicate ? 'duplicate' : 'new',
        description: `AI-generated draft to validate ${api.path} for ${sample.role} with ${sample.state}.`,
        expectedResult: JSON.stringify({ status: index === 0 ? 200 : 400 }, null, 2),
        requestPreview: requestSpec,
        requestSpec,
        assertionSpec: JSON.stringify({ status: index === 0 ? '2xx' : '4xx or documented error', schema: 'matches OpenAPI contract' }, null, 2),
        validationRules: ['Status code matches expectation', 'Response schema is valid', 'Error body is documented'],
      };
    });
  });
