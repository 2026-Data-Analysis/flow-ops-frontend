import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeScenarioForSave } from '../src/app/utils/scenarioSave';
import type { ApiInventoryResponse, OrchestratorScenario } from '../src/app/api/flowOpsClient';

const inventory = [
  { id: 11, method: 'POST', endpointPath: '/api/v1/auth/signup' },
  { id: 22, method: 'GET', endpointPath: '/api/v1/users/me' },
] as ApiInventoryResponse[];

const oldScenario = {
  scenario_id: 'old-1',
  name: 'Signup flow',
  description: 'Creates a new user',
  type: 'HAPPY_PATH',
  test_level: 'SANITY',
  steps: [
    {
      order: 1,
      endpoint_id: 'POST:/api/v1/auth/signup',
      name: 'New signup',
      static_payload: { email: 'a@example.com' },
      static_params: { tenantId: 't1' },
      expected_status_code: 201,
      expected_assertions: ['id'],
    },
  ],
  meta: {},
} as OrchestratorScenario;

const newScenario = {
  scenario_id: 'new-1',
  name: 'Profile flow',
  description: null,
  steps: [
    {
      order: 1,
      apiId: 'GET:/api/v1/users/me',
      title: 'Read profile',
      requestSpec: { method: 'GET', path: '/api/v1/users/me', queryParams: { expand: 'roles' } },
      expectedSpec: { statusCode: 200 },
      assertionSpec: { bodyContains: ['email'] },
    },
  ],
  meta: { type: 'HAPPY_PATH', test_level: 'SMOKE' },
} as OrchestratorScenario;

test('orchestrator scenario result exposes individual and bulk save buttons', () => {
  const source = readFileSync('src/app/components/OrchestratorAgent.tsx', 'utf8');
  assert.match(source, /전체 저장하기/);
  assert.match(source, /onSave=\{\(\) => void saveScenario/);
});

test('individual scenario save button calls the scenario save API', () => {
  const source = readFileSync('src/app/components/OrchestratorAgent.tsx', 'utf8');
  assert.match(source, /flowOpsApi\.createScenario\(payload\)/);
});

test('bulk scenario save calls save for every unsaved scenario', () => {
  const source = readFileSync('src/app/components/OrchestratorAgent.tsx', 'utf8');
  assert.match(source, /Promise\.allSettled\(targets\.map\(\(\{ scenario, key \}\) => saveScenario\(scenario, key\)\)\)/);
});

test('old step response is normalized for the backend scenario DTO', () => {
  const payload = normalizeScenarioForSave(oldScenario, inventory, { appId: 1 });
  assert.equal(payload.name, 'Signup flow');
  assert.equal(payload.type, 'HAPPY_PATH');
  assert.equal(payload.testLevel, 'SANITY');
  assert.equal(payload.steps[0].apiId, 11);
  assert.deepEqual(payload.steps[0].requestSpec, {
    body: { email: 'a@example.com' },
    pathParams: { tenantId: 't1' },
    queryParams: {},
  });
  assert.deepEqual(payload.steps[0].expectedSpec, { statusCode: 201 });
  assert.deepEqual(payload.steps[0].assertionSpec, { bodyContains: ['id'] });
});

test('new step response is normalized for the backend scenario DTO', () => {
  const payload = normalizeScenarioForSave(newScenario, inventory, { appId: 1 });
  assert.equal(payload.name, 'Profile flow');
  assert.equal(payload.testLevel, 'SMOKE');
  assert.equal(payload.steps[0].apiId, 22);
  assert.deepEqual(payload.steps[0].requestSpec, {
    method: 'GET',
    path: '/api/v1/users/me',
    queryParams: { expand: 'roles' },
  });
  assert.deepEqual(payload.steps[0].expectedSpec, { statusCode: 200 });
  assert.deepEqual(payload.steps[0].assertionSpec, { bodyContains: ['email'] });
});

test('save buttons are disabled while saving or after save', () => {
  const source = readFileSync('src/app/components/OrchestratorAgent.tsx', 'utf8');
  assert.match(source, /disabled=\{saveState\?\.saving \|\| saveState\?\.saved\}/);
  assert.match(source, /disabled=\{hasPendingSave \|\| unsavedCount === 0\}/);
});

test('save success displays saved status', () => {
  const source = readFileSync('src/app/components/OrchestratorAgent.tsx', 'utf8');
  assert.match(source, /저장됨/);
  assert.match(source, /setSavedIds/);
});

test('save failure displays an error message', () => {
  const source = readFileSync('src/app/components/OrchestratorAgent.tsx', 'utf8');
  assert.match(source, /시나리오 저장에 실패했습니다\./);
  assert.match(source, /setSaveErrors/);
});

test('scenario list is refreshed after a successful save', () => {
  const source = readFileSync('src/app/components/ScenarioBuilderPage.tsx', 'utf8');
  assert.match(source, /flowOps\.scenariosChanged/);
  assert.match(source, /loadSavedScenarios\(\)/);
});

test('scenario save does not call apis by apiId and does not treat unknown numeric apiId as an endpoint PK', () => {
  const source = readFileSync('src/app/utils/scenarioSave.ts', 'utf8');
  assert.doesNotMatch(source, /\/apis\/\$\{/);
  assert.throws(
    () => normalizeScenarioForSave({
      ...newScenario,
      steps: [{ ...newScenario.steps[0], apiId: '2246', requestSpec: undefined }],
    } as OrchestratorScenario, inventory, { appId: 1 }),
    /Unable to resolve scenario step endpoint: 2246/,
  );
});
