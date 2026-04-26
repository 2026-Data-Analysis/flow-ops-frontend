import { useState } from 'react';
import { 
  Plus,
  Copy,
  Trash2,
  Save,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Code,
  Settings,
  Target,
  X,
  ChevronDown,
  FileJson
} from 'lucide-react';

interface TestCase {
  id: string;
  name: string;
  type: 'success' | 'error' | 'edge';
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body: string;
  expectedStatus: number;
  assertions: Assertion[];
}

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface Assertion {
  id: string;
  type: 'exists' | 'equals' | 'contains' | 'regex' | 'type' | 'range';
  field: string;
  operator?: string;
  value?: string;
  enabled: boolean;
}

const mockTestCases: TestCase[] = [
  {
    id: '1',
    name: 'Success - Get User',
    type: 'success',
    headers: [
      { id: 'h1', key: 'Accept', value: 'application/json', enabled: true },
    ],
    params: [
      { id: 'p1', key: 'id', value: '123', enabled: true },
    ],
    body: '',
    expectedStatus: 200,
    assertions: [
      { id: 'a1', type: 'exists', field: 'data.id', enabled: true },
      { id: 'a2', type: 'equals', field: 'data.email', value: 'user@example.com', enabled: true },
      { id: 'a3', type: 'type', field: 'data.createdAt', value: 'string', enabled: true },
    ],
  },
  {
    id: '2',
    name: 'Error - Missing Field',
    type: 'error',
    headers: [
      { id: 'h2', key: 'Content-Type', value: 'application/json', enabled: true },
    ],
    params: [],
    body: '{\n  "email": "test@example.com"\n}',
    expectedStatus: 400,
    assertions: [
      { id: 'a4', type: 'exists', field: 'error.code', enabled: true },
      { id: 'a5', type: 'equals', field: 'error.code', value: 'MISSING_FIELD', enabled: true },
      { id: 'a6', type: 'contains', field: 'error.message', value: 'required', enabled: true },
    ],
  },
  {
    id: '3',
    name: 'Error - Unauthorized',
    type: 'error',
    headers: [],
    params: [],
    body: '',
    expectedStatus: 401,
    assertions: [
      { id: 'a7', type: 'exists', field: 'error', enabled: true },
      { id: 'a8', type: 'equals', field: 'error.code', value: 'UNAUTHORIZED', enabled: true },
    ],
  },
  {
    id: '4',
    name: 'Error - Invalid Type',
    type: 'error',
    headers: [
      { id: 'h3', key: 'Content-Type', value: 'application/json', enabled: true },
    ],
    params: [],
    body: '{\n  "email": "invalid-email",\n  "age": "not-a-number"\n}',
    expectedStatus: 422,
    assertions: [
      { id: 'a9', type: 'equals', field: 'error.code', value: 'VALIDATION_ERROR', enabled: true },
    ],
  },
];

const assertionTypes = [
  { value: 'exists', label: 'Field Exists', description: 'Check if field is present' },
  { value: 'equals', label: 'Equals', description: 'Field equals exact value' },
  { value: 'contains', label: 'Contains', description: 'Field contains substring' },
  { value: 'regex', label: 'Regex Match', description: 'Match against pattern' },
  { value: 'type', label: 'Type Check', description: 'Validate data type' },
  { value: 'range', label: 'Number Range', description: 'Value within range' },
];

const typeOptions = ['string', 'number', 'boolean', 'array', 'object', 'null'];

export function TestCaseBuilderPage() {
  const [testCases, setTestCases] = useState<TestCase[]>(mockTestCases);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('1');
  const [showBodyEditor, setShowBodyEditor] = useState(false);

  const selectedCase = testCases.find(tc => tc.id === selectedCaseId);

  const updateTestCase = (updates: Partial<TestCase>) => {
    setTestCases(cases =>
      cases.map(tc => (tc.id === selectedCaseId ? { ...tc, ...updates } : tc))
    );
  };

  const addTestCase = () => {
    const newCase: TestCase = {
      id: Date.now().toString(),
      name: 'New Test Case',
      type: 'success',
      headers: [],
      params: [],
      body: '',
      expectedStatus: 200,
      assertions: [],
    };
    setTestCases([...testCases, newCase]);
    setSelectedCaseId(newCase.id);
  };

  const duplicateTestCase = (caseId: string) => {
    const caseToDuplicate = testCases.find(tc => tc.id === caseId);
    if (caseToDuplicate) {
      const newCase: TestCase = {
        ...caseToDuplicate,
        id: Date.now().toString(),
        name: `${caseToDuplicate.name} (Copy)`,
      };
      setTestCases([...testCases, newCase]);
      setSelectedCaseId(newCase.id);
    }
  };

  const deleteTestCase = (caseId: string) => {
    if (testCases.length === 1) {
      alert('Cannot delete the last test case');
      return;
    }
    setTestCases(cases => cases.filter(tc => tc.id !== caseId));
    if (selectedCaseId === caseId) {
      setSelectedCaseId(testCases[0].id);
    }
  };

  const addItem = (type: 'headers' | 'params') => {
    if (!selectedCase) return;
    const newItem: KeyValuePair = {
      id: Date.now().toString(),
      key: '',
      value: '',
      enabled: true,
    };
    updateTestCase({ [type]: [...selectedCase[type], newItem] });
  };

  const updateItem = (type: 'headers' | 'params', id: string, updates: Partial<KeyValuePair>) => {
    if (!selectedCase) return;
    updateTestCase({
      [type]: selectedCase[type].map(item => (item.id === id ? { ...item, ...updates } : item)),
    });
  };

  const deleteItem = (type: 'headers' | 'params', id: string) => {
    if (!selectedCase) return;
    updateTestCase({
      [type]: selectedCase[type].filter(item => item.id !== id),
    });
  };

  const addAssertion = () => {
    if (!selectedCase) return;
    const newAssertion: Assertion = {
      id: Date.now().toString(),
      type: 'exists',
      field: '',
      enabled: true,
    };
    updateTestCase({ assertions: [...selectedCase.assertions, newAssertion] });
  };

  const updateAssertion = (id: string, updates: Partial<Assertion>) => {
    if (!selectedCase) return;
    updateTestCase({
      assertions: selectedCase.assertions.map(a => (a.id === id ? { ...a, ...updates } : a)),
    });
  };

  const deleteAssertion = (id: string) => {
    if (!selectedCase) return;
    updateTestCase({
      assertions: selectedCase.assertions.filter(a => a.id !== id),
    });
  };

  const handleRunTest = () => {
    alert('Running test case...');
  };

  const handleSave = () => {
    alert('Test cases saved successfully!');
  };

  if (!selectedCase) return null;

  return (
    <div className="flex-1 overflow-hidden bg-[#060609] flex flex-col">
      {/* Top: Selected API Info */}
      <div className="bg-[#0a0a0f] border-b border-[#1f1f28] px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded text-sm font-semibold font-mono">
                GET
              </span>
              <div>
                <div className="text-white font-mono text-sm">/api/v1/users/:id</div>
                <div className="text-xs text-gray-500">UserController.getUserById</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunTest}
              className="flex items-center gap-2 bg-[#13131a] border border-[#1f1f28] hover:border-green-500/30 hover:bg-green-500/5 text-white px-4 py-2 rounded-lg transition-all"
            >
              <Play size={16} />
              Run Test
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Save size={16} />
              Save All
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left: Test Case List */}
        <aside className="w-80 bg-[#0a0a0f] border-r border-[#1f1f28] flex flex-col">
          <div className="p-4 border-b border-[#1f1f28]">
            <h2 className="text-white mb-1">Test Cases</h2>
            <p className="text-gray-500 text-xs">{testCases.length} test scenarios</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {testCases.map((testCase) => (
              <div
                key={testCase.id}
                onClick={() => setSelectedCaseId(testCase.id)}
                className={`group relative rounded-lg p-3 cursor-pointer transition-all ${
                  selectedCaseId === testCase.id
                    ? 'bg-[#13131a] border border-blue-500/30'
                    : 'bg-[#13131a] border border-[#1f1f28] hover:border-[#2f2f38]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {testCase.type === 'success' && <CheckCircle2 size={16} className="text-green-400" />}
                    {testCase.type === 'error' && <XCircle size={16} className="text-red-400" />}
                    {testCase.type === 'edge' && <AlertCircle size={16} className="text-orange-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm mb-1">{testCase.name}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">{testCase.assertions.length} assertions</span>
                      <span className="text-gray-600">•</span>
                      <span className={`${
                        testCase.expectedStatus >= 200 && testCase.expectedStatus < 300
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}>
                        {testCase.expectedStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateTestCase(testCase.id);
                    }}
                    className="p-1 bg-[#1f1f28] hover:bg-[#2f2f38] rounded text-gray-400 hover:text-white transition-colors"
                    title="Duplicate"
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTestCase(testCase.id);
                    }}
                    className="p-1 bg-[#1f1f28] hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-[#1f1f28]">
            <button
              onClick={addTestCase}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Add Test Case
            </button>
          </div>
        </aside>

        {/* Right: Test Case Editor */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Test Case Name & Type */}
            <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Test Case Name</label>
                  <input
                    type="text"
                    value={selectedCase.name}
                    onChange={(e) => updateTestCase({ name: e.target.value })}
                    className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Type</label>
                  <select
                    value={selectedCase.type}
                    onChange={(e) => updateTestCase({ type: e.target.value as any })}
                    className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/30 transition-colors"
                  >
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                    <option value="edge">Edge Case</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 1: Request */}
            <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
              <h3 className="text-white mb-4 flex items-center gap-2">
                <Code size={18} className="text-blue-400" />
                Request Configuration
              </h3>

              {/* Headers */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-gray-400">Headers</label>
                  <button
                    onClick={() => addItem('headers')}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
                {selectedCase.headers.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-xs bg-[#13131a] rounded-lg">
                    No headers configured
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedCase.headers.map((header) => (
                      <div
                        key={header.id}
                        className="grid grid-cols-[auto_1fr_2fr_auto] gap-2 bg-[#13131a] border border-[#1f1f28] rounded-lg p-2 items-center"
                      >
                        <input
                          type="checkbox"
                          checked={header.enabled}
                          onChange={(e) => updateItem('headers', header.id, { enabled: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                        />
                        <input
                          type="text"
                          value={header.key}
                          onChange={(e) => updateItem('headers', header.id, { key: e.target.value })}
                          className="bg-transparent border-none text-white text-sm focus:outline-none px-2 py-1 font-mono"
                          placeholder="Key"
                        />
                        <input
                          type="text"
                          value={header.value}
                          onChange={(e) => updateItem('headers', header.id, { value: e.target.value })}
                          className="bg-transparent border-none text-white text-sm focus:outline-none px-2 py-1 font-mono"
                          placeholder="Value"
                        />
                        <button
                          onClick={() => deleteItem('headers', header.id)}
                          className="p-1.5 hover:bg-red-500/10 rounded text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Params */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-gray-400">Parameters</label>
                  <button
                    onClick={() => addItem('params')}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
                {selectedCase.params.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-xs bg-[#13131a] rounded-lg">
                    No parameters configured
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedCase.params.map((param) => (
                      <div
                        key={param.id}
                        className="grid grid-cols-[auto_1fr_2fr_auto] gap-2 bg-[#13131a] border border-[#1f1f28] rounded-lg p-2 items-center"
                      >
                        <input
                          type="checkbox"
                          checked={param.enabled}
                          onChange={(e) => updateItem('params', param.id, { enabled: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                        />
                        <input
                          type="text"
                          value={param.key}
                          onChange={(e) => updateItem('params', param.id, { key: e.target.value })}
                          className="bg-transparent border-none text-white text-sm focus:outline-none px-2 py-1 font-mono"
                          placeholder="Key"
                        />
                        <input
                          type="text"
                          value={param.value}
                          onChange={(e) => updateItem('params', param.id, { value: e.target.value })}
                          className="bg-transparent border-none text-white text-sm focus:outline-none px-2 py-1 font-mono"
                          placeholder="Value"
                        />
                        <button
                          onClick={() => deleteItem('params', param.id)}
                          className="p-1.5 hover:bg-red-500/10 rounded text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Body */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-gray-400">Request Body</label>
                  <button
                    onClick={() => setShowBodyEditor(!showBodyEditor)}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <FileJson size={14} />
                    {showBodyEditor ? 'Hide' : 'Show'} Editor
                  </button>
                </div>
                {showBodyEditor && (
                  <textarea
                    value={selectedCase.body}
                    onChange={(e) => updateTestCase({ body: e.target.value })}
                    rows={8}
                    className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/30 transition-colors font-mono text-sm resize-none"
                    placeholder='{\n  "key": "value"\n}'
                  />
                )}
              </div>
            </div>

            {/* Section 2: Expected Result */}
            <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
              <h3 className="text-white mb-4 flex items-center gap-2">
                <Target size={18} className="text-blue-400" />
                Expected Result
              </h3>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Expected Status Code</label>
                <select
                  value={selectedCase.expectedStatus}
                  onChange={(e) => updateTestCase({ expectedStatus: parseInt(e.target.value) })}
                  className="w-full bg-[#13131a] border border-[#1f1f28] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/30 transition-colors font-mono"
                >
                  <option value="200">200 - OK</option>
                  <option value="201">201 - Created</option>
                  <option value="204">204 - No Content</option>
                  <option value="400">400 - Bad Request</option>
                  <option value="401">401 - Unauthorized</option>
                  <option value="403">403 - Forbidden</option>
                  <option value="404">404 - Not Found</option>
                  <option value="422">422 - Unprocessable Entity</option>
                  <option value="500">500 - Internal Server Error</option>
                </select>
              </div>
            </div>

            {/* Section 3: Assertion Builder */}
            <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white flex items-center gap-2">
                  <Settings size={18} className="text-blue-400" />
                  Assertion Builder
                </h3>
                <button
                  onClick={addAssertion}
                  className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Plus size={16} />
                  Add Assertion
                </button>
              </div>

              {selectedCase.assertions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm bg-[#13131a] rounded-lg">
                  No assertions defined. Click "Add Assertion" to create validation rules.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedCase.assertions.map((assertion, index) => (
                    <div
                      key={assertion.id}
                      className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={assertion.enabled}
                          onChange={(e) => updateAssertion(assertion.id, { enabled: e.target.checked })}
                          className="w-4 h-4 mt-3 rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                        />
                        <div className="flex-1 space-y-3">
                          {/* Row 1: Assertion Type */}
                          <div>
                            <label className="block text-xs text-gray-500 mb-1.5">Assertion Type</label>
                            <select
                              value={assertion.type}
                              onChange={(e) => updateAssertion(assertion.id, { type: e.target.value as any })}
                              className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 transition-colors"
                            >
                              {assertionTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label} - {type.description}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Row 2: Field Path */}
                          <div>
                            <label className="block text-xs text-gray-500 mb-1.5">Response Field Path</label>
                            <input
                              type="text"
                              value={assertion.field}
                              onChange={(e) => updateAssertion(assertion.id, { field: e.target.value })}
                              className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 transition-colors font-mono"
                              placeholder="e.g., data.user.email or error.code"
                            />
                          </div>

                          {/* Row 3: Value (conditional) */}
                          {(assertion.type === 'equals' || assertion.type === 'contains' || assertion.type === 'regex') && (
                            <div>
                              <label className="block text-xs text-gray-500 mb-1.5">
                                {assertion.type === 'regex' ? 'Pattern' : 'Expected Value'}
                              </label>
                              <input
                                type="text"
                                value={assertion.value || ''}
                                onChange={(e) => updateAssertion(assertion.id, { value: e.target.value })}
                                className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 transition-colors font-mono"
                                placeholder={assertion.type === 'regex' ? '^[a-z]+$' : 'expected value'}
                              />
                            </div>
                          )}

                          {/* Type Check */}
                          {assertion.type === 'type' && (
                            <div>
                              <label className="block text-xs text-gray-500 mb-1.5">Expected Type</label>
                              <select
                                value={assertion.value || 'string'}
                                onChange={(e) => updateAssertion(assertion.id, { value: e.target.value })}
                                className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 transition-colors"
                              >
                                {typeOptions.map((type) => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Range Check */}
                          {assertion.type === 'range' && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1.5">Min Value</label>
                                <input
                                  type="number"
                                  value={assertion.value?.split(',')[0] || ''}
                                  onChange={(e) => {
                                    const max = assertion.value?.split(',')[1] || '';
                                    updateAssertion(assertion.id, { value: `${e.target.value},${max}` });
                                  }}
                                  className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1.5">Max Value</label>
                                <input
                                  type="number"
                                  value={assertion.value?.split(',')[1] || ''}
                                  onChange={(e) => {
                                    const min = assertion.value?.split(',')[0] || '';
                                    updateAssertion(assertion.id, { value: `${min},${e.target.value}` });
                                  }}
                                  className="w-full bg-[#1f1f28] border border-[#2f2f38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/30 transition-colors"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => deleteAssertion(assertion.id)}
                          className="p-1.5 hover:bg-red-500/10 rounded text-gray-500 hover:text-red-400 transition-colors mt-2"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
