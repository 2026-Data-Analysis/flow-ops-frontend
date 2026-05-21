export interface NormalizedAssertionResult {
  id: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
  message?: string;
}

const stringifyValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const toAssertionArray = (value: unknown): unknown[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const nested = record.results || record.assertions || record.validationResults || record.assertionResults;
    if (Array.isArray(nested)) return nested;
    return [value];
  }
  return [];
};

export const normalizeAssertionResults = (...sources: unknown[]): NormalizedAssertionResult[] =>
  sources
    .flatMap(toAssertionArray)
    .map((item, index) => {
      const record = typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {};
      const name = record.name || record.type || record.assertionType || record.fieldPath || record.path || `Assertion ${index + 1}`;
      const passedValue = record.passed ?? record.success ?? record.result;

      return {
        id: String(record.id ?? index + 1),
        name: String(name),
        expected: stringifyValue(record.expected ?? record.expectedValue),
        actual: stringifyValue(record.actual ?? record.actualValue),
        passed: passedValue === true || String(passedValue).toUpperCase() === 'PASSED',
        message: record.message || record.errorMessage ? String(record.message || record.errorMessage) : undefined,
      };
    });

