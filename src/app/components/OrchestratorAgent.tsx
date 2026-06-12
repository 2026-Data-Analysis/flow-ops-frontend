import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Sparkles,
  X,
  Minimize2,
  Send,
  FileSearch,
  TestTube2,
  Zap,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  GitBranch,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';
import {
  flowOpsApi,
  DEFAULT_APP_ID,
  getApiServerUrl,
  getStoredProjectIdForApp,
  type IncidentAgentData,
  type RootCause,
  type OrchestratorTestCaseData,
  type OrchestratorTestCaseDraft,
  type OrchestratorScenarioData,
  type OrchestratorScenario,
  type OrchestratorScenarioStep,
  type TestGenerationDraftResponse,
} from '../api/flowOpsClient';
import { useTestContext } from '../contexts/TestContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStatus = 'running' | 'done' | 'error';

interface AgentTask {
  type: 'log-analysis' | 'test-generation' | 'scenario-generation';
  status: AgentStatus;
  incidentData?: IncidentAgentData;
  testData?: OrchestratorTestCaseData;
  scenarioData?: OrchestratorScenarioData;
  summary?: string;
  errorMessage?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tasks?: AgentTask[];
  formType?: 'log-analysis' | 'test-generation' | 'scenario' | 'both';
}

interface LogFormData {
  project_id: string;
  user_prompt: string;
  service_name: string;
  occurred_at: string;
  raw_log: string;
}

interface TestFormData {
  project_id: string;
  user_prompt: string;
  base_url: string;
  env_name: string;
  method: string;
  path: string;
  summary: string;
  auth_type: string;
  request_body_schema: string;
  response_schema: string;
}

interface ScenarioEndpointRow {
  method: string;
  path: string;
  summary: string;
  auth_type: string;
}

interface ScenarioFormData {
  project_id: string;
  user_prompt: string;
  endpoints: ScenarioEndpointRow[];
}

interface BothFormData {
  project_id: string;
  log_user_prompt: string;
  service_name: string;
  occurred_at: string;
  raw_log: string;
  test_user_prompt: string;
  base_url: string;
  env_name: string;
  method: string;
  path: string;
  summary: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function localNow() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function parseJsonSafe(s: string): object | undefined {
  if (!s.trim()) return undefined;
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}

// ─── FormField ────────────────────────────────────────────────────────────────

function FormField({
  label, type, placeholder, value, onChange,
}: {
  label: string; type: string; placeholder?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
      />
    </div>
  );
}

// ─── Log Analysis Form ────────────────────────────────────────────────────────

function LogAnalysisFormCard({
  formMsgId, onSubmit, onCancel,
}: {
  formMsgId: string;
  onSubmit: (data: LogFormData, msgId: string) => void;
  onCancel: (msgId: string) => void;
}) {
  const [form, setForm] = useState<LogFormData>({
    project_id: '', user_prompt: '', service_name: '', occurred_at: localNow(), raw_log: '',
  });
  const set = (key: keyof LogFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));
  const ok = form.user_prompt.trim() && form.service_name.trim() && form.raw_log.trim();
  return (
    <div className="mt-2 bg-[#13131a] border border-violet-500/20 rounded-xl p-3.5 space-y-2.5">
      <p className="text-xs font-semibold text-violet-300 uppercase tracking-wider">로그 분석 정보 입력</p>
      <FormField label="서비스 이름 *" type="text" placeholder="예: auth-service" value={form.service_name} onChange={set('service_name')} />
      <FormField label="분석 요청 *" type="text" placeholder="예: 로그인 실패 원인을 분석해줘" value={form.user_prompt} onChange={set('user_prompt')} />
      <FormField label="발생 시각" type="datetime-local" value={form.occurred_at} onChange={set('occurred_at')} />
      <div>
        <label className="block text-xs text-gray-400 mb-1">로그 원문 *</label>
        <textarea value={form.raw_log} onChange={set('raw_log')} placeholder="ERROR: Connection timeout at line 42..." rows={4}
          className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 resize-none font-mono" />
      </div>
      <FormField label="프로젝트 ID (선택)" type="text" placeholder="예: my-project" value={form.project_id} onChange={set('project_id')} />
      <div className="flex gap-2 pt-1">
        <button onClick={() => ok && onSubmit(form, formMsgId)} disabled={!ok}
          className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2 text-xs font-semibold transition-colors">
          분석 시작
        </button>
        <button onClick={() => onCancel(formMsgId)}
          className="px-4 bg-[#1f1f28] hover:bg-[#2a2a35] text-gray-300 rounded-lg py-2 text-xs transition-colors">
          취소
        </button>
      </div>
    </div>
  );
}

// ─── Test Case Form ───────────────────────────────────────────────────────────

function TestCaseFormCard({
  formMsgId, onSubmit, onCancel,
}: {
  formMsgId: string;
  onSubmit: (data: TestFormData, msgId: string) => void;
  onCancel: (msgId: string) => void;
}) {
  const [form, setForm] = useState<TestFormData>({
    project_id: '', user_prompt: '', base_url: 'https://', env_name: 'staging',
    method: 'POST', path: '', summary: '', auth_type: 'bearer',
    request_body_schema: '', response_schema: '',
  });
  const set = (key: keyof TestFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));
  const ok = form.user_prompt.trim() && form.base_url.trim() && form.env_name.trim() && form.path.trim();
  return (
    <div className="mt-2 bg-[#13131a] border border-indigo-500/20 rounded-xl p-3.5 space-y-2.5">
      <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">테스트 케이스 생성 정보 입력</p>
      <FormField label="생성 요청 *" type="text" placeholder="예: 주문 API에 대한 테스트 케이스 만들어줘" value={form.user_prompt} onChange={set('user_prompt')} />
      <FormField label="Base URL *" type="text" placeholder="https://api.example.com" value={form.base_url} onChange={set('base_url')} />
      <FormField label="환경 이름 *" type="text" placeholder="예: staging" value={form.env_name} onChange={set('env_name')} />
      <div className="border border-[#2a2a35] rounded-lg p-2.5 space-y-2">
        <p className="text-xs text-gray-400 font-medium">엔드포인트</p>
        <div className="flex gap-2">
          <div className="w-24 shrink-0">
            <label className="block text-xs text-gray-400 mb-1">메서드</label>
            <select value={form.method} onChange={set('method')}
              className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50">
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <FormField label="경로 *" type="text" placeholder="/api/v1/orders" value={form.path} onChange={set('path')} />
          </div>
        </div>
        <FormField label="요약 (선택)" type="text" placeholder="예: 주문 생성" value={form.summary} onChange={set('summary')} />
        <div>
          <label className="block text-xs text-gray-400 mb-1">인증 타입</label>
          <select value={form.auth_type} onChange={set('auth_type')}
            className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50">
            {['bearer', 'basic', 'api_key', 'none'].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">요청 바디 스키마 (선택, JSON)</label>
          <textarea value={form.request_body_schema} onChange={set('request_body_schema')}
            placeholder='{"type":"object","properties":{...}}' rows={3}
            className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 resize-none font-mono" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">응답 스키마 (선택, JSON)</label>
          <textarea value={form.response_schema} onChange={set('response_schema')}
            placeholder='{"type":"object","properties":{...}}' rows={2}
            className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 resize-none font-mono" />
        </div>
      </div>
      <FormField label="프로젝트 ID (선택)" type="text" placeholder="예: my-project" value={form.project_id} onChange={set('project_id')} />
      <div className="flex gap-2 pt-1">
        <button onClick={() => ok && onSubmit(form, formMsgId)} disabled={!ok}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2 text-xs font-semibold transition-colors">
          생성 시작
        </button>
        <button onClick={() => onCancel(formMsgId)}
          className="px-4 bg-[#1f1f28] hover:bg-[#2a2a35] text-gray-300 rounded-lg py-2 text-xs transition-colors">
          취소
        </button>
      </div>
    </div>
  );
}

// ─── Scenario Form ───────────────────────────────────────────────────────────────

function ScenarioFormCard({
  formMsgId, onSubmit, onCancel,
}: {
  formMsgId: string;
  onSubmit: (data: ScenarioFormData, msgId: string) => void;
  onCancel: (msgId: string) => void;
}) {
  const [projectId, setProjectId] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [endpoints, setEndpoints] = useState<ScenarioEndpointRow[]>([
    { method: 'POST', path: '', summary: '', auth_type: 'bearer' },
  ]);

  const addEndpoint = () => {
    if (endpoints.length < 8)
      setEndpoints((p) => [...p, { method: 'GET', path: '', summary: '', auth_type: 'bearer' }]);
  };
  const removeEndpoint = (i: number) => setEndpoints((p) => p.filter((_, idx) => idx !== i));
  const updateEndpoint = (i: number, key: keyof ScenarioEndpointRow, val: string) =>
    setEndpoints((p) => p.map((e, idx) => (idx === i ? { ...e, [key]: val } : e)));

  const ok = userPrompt.trim() && endpoints.some((e) => e.path.trim());

  return (
    <div className="mt-2 bg-[#13131a] border border-teal-500/20 rounded-xl p-3.5 space-y-2.5">
      <p className="text-xs font-semibold text-teal-300 uppercase tracking-wider">시나리오 생성 정보 입력</p>
      <div>
        <label className="block text-xs text-gray-400 mb-1">생성 요청 *</label>
        <input type="text" value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="예: 회원가입 후 로그인하고 상품 주문까지 흐름을 시나리오로 만들어줘"
          className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 font-medium">엔드포인트 리스트</p>
          {endpoints.length < 8 && (
            <button onClick={addEndpoint}
              className="flex items-center gap-1 text-[10px] text-teal-400 hover:text-teal-300 transition-colors">
              <Plus size={11} /> 엔드포인트 추가
            </button>
          )}
        </div>
        {endpoints.map((ep, i) => (
          <div key={i} className="border border-[#2a2a35] rounded-lg p-2 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500 font-mono w-4 shrink-0">{i + 1}</span>
              <div className="w-20 shrink-0">
                <select value={ep.method} onChange={(e) => updateEndpoint(i, 'method', e.target.value)}
                  className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded px-1.5 py-1.5 text-xs text-white focus:outline-none">
                  {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <input type="text" value={ep.path} onChange={(e) => updateEndpoint(i, 'path', e.target.value)}
                placeholder="/api/v1/..."
                className="flex-1 bg-[#0d0d12] border border-[#2a2a35] rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50 font-mono" />
              {endpoints.length > 1 && (
                <button onClick={() => removeEndpoint(i)} className="text-gray-600 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
            <div className="flex gap-1.5 ml-5">
              <input type="text" value={ep.summary} onChange={(e) => updateEndpoint(i, 'summary', e.target.value)}
                placeholder="요약 (선택)"
                className="flex-1 bg-[#0d0d12] border border-[#2a2a35] rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none" />
              <select value={ep.auth_type} onChange={(e) => updateEndpoint(i, 'auth_type', e.target.value)}
                className="w-20 bg-[#0d0d12] border border-[#2a2a35] rounded px-1.5 py-1 text-xs text-white focus:outline-none">
                {['bearer', 'basic', 'api_key', 'none'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">프로젝트 ID (선택)</label>
        <input type="text" value={projectId} onChange={(e) => setProjectId(e.target.value)}
          placeholder="예: my-project"
          className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50" />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => ok && onSubmit({ project_id: projectId, user_prompt: userPrompt, endpoints }, formMsgId)}
          disabled={!ok}
          className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2 text-xs font-semibold transition-colors">
          시나리오 생성 시작
        </button>
        <button onClick={() => onCancel(formMsgId)}
          className="px-4 bg-[#1f1f28] hover:bg-[#2a2a35] text-gray-300 rounded-lg py-2 text-xs transition-colors">
          취소
        </button>
      </div>
    </div>
  );
}

// ─── Combined Form (동시 실행) ─────────────────────────────────────────────────

function BothFormCard({
  formMsgId, onSubmit, onCancel,
}: {
  formMsgId: string;
  onSubmit: (data: BothFormData, msgId: string) => void;
  onCancel: (msgId: string) => void;
}) {
  const [form, setForm] = useState<BothFormData>({
    project_id: '', log_user_prompt: '', service_name: '', occurred_at: localNow(), raw_log: '',
    test_user_prompt: '', base_url: 'https://', env_name: 'staging', method: 'POST', path: '', summary: '',
  });
  const set = (key: keyof BothFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));
  const ok = form.log_user_prompt.trim() && form.service_name.trim() && form.raw_log.trim()
    && form.test_user_prompt.trim() && form.base_url.trim() && form.path.trim();
  return (
    <div className="mt-2 bg-[#13131a] border border-amber-500/20 rounded-xl p-3.5 space-y-3">
      <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">동시 실행 정보 입력</p>
      <div>
        <label className="block text-xs text-gray-400 mb-1">프로젝트 ID (선택)</label>
        <input type="text" value={form.project_id} onChange={set('project_id')} placeholder="예: my-project"
          className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none" />
      </div>
      <div className="border border-violet-500/20 rounded-lg p-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-violet-600 rounded flex items-center justify-center shrink-0"><FileSearch size={9} className="text-white" /></div>
          <p className="text-xs font-medium text-violet-300">로그 분석</p>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">서비스 이름 *</label>
          <input type="text" value={form.service_name} onChange={set('service_name')} placeholder="예: auth-service"
            className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">분석 요청 *</label>
          <input type="text" value={form.log_user_prompt} onChange={set('log_user_prompt')} placeholder="예: 로그인 실패 원인 분석"
            className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">발생 시각</label>
          <input type="datetime-local" value={form.occurred_at} onChange={set('occurred_at')}
            className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">로그 원문 *</label>
          <textarea value={form.raw_log} onChange={set('raw_log')} placeholder="ERROR: Connection timeout..." rows={3}
            className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none resize-none font-mono" />
        </div>
      </div>
      <div className="border border-indigo-500/20 rounded-lg p-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-indigo-600 rounded flex items-center justify-center shrink-0"><TestTube2 size={9} className="text-white" /></div>
          <p className="text-xs font-medium text-indigo-300">테스트 케이스 생성</p>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">생성 요청 *</label>
          <input type="text" value={form.test_user_prompt} onChange={set('test_user_prompt')} placeholder="예: 주문 API 테스트 케이스"
            className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Base URL *</label>
          <input type="text" value={form.base_url} onChange={set('base_url')} placeholder="https://api.example.com"
            className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">환경 이름 *</label>
          <input type="text" value={form.env_name} onChange={set('env_name')} placeholder="예: staging"
            className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none" />
        </div>
        <div className="flex gap-2">
          <div className="w-24 shrink-0">
            <label className="block text-xs text-gray-400 mb-1">메서드</label>
            <select value={form.method} onChange={set('method')}
              className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-2 py-2 text-xs text-white focus:outline-none">
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">경로 *</label>
            <input type="text" value={form.path} onChange={set('path')} placeholder="/api/v1/orders"
              className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none font-mono" />
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => ok && onSubmit(form, formMsgId)} disabled={!ok}
          className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2 text-xs font-semibold transition-all">
          동시 실행 시작
        </button>
        <button onClick={() => onCancel(formMsgId)}
          className="px-4 bg-[#1f1f28] hover:bg-[#2a2a35] text-gray-300 rounded-lg py-2 text-xs transition-colors">
          취소
        </button>
      </div>
    </div>
  );
}

// ─── Incident Result View ─────────────────────────────────────────────────────

function RootCauseCard({ cause }: { cause: RootCause }) {
  const [expanded, setExpanded] = useState(false);
  const sev = cause.severity === 'HIGH'
    ? 'bg-red-500/20 text-red-400 border-red-500/30'
    : cause.severity === 'MEDIUM'
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      : 'bg-green-500/20 text-green-400 border-green-500/30';
  return (
    <div className="bg-[#0d0d12] border border-[#2a2a35] rounded-lg p-3">
      <div className="flex items-start gap-2 mb-2">
        <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${sev}`}>{cause.severity}</span>
        <p className="text-xs text-gray-200 leading-relaxed">{cause.summary}</p>
      </div>
      <button onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        {expanded ? '접기' : `증거 ${cause.evidence.length}건 · 권장 조치 보기`}
      </button>
      {expanded && (
        <div className="mt-2 space-y-2">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">증거</p>
            <ul className="space-y-1">
              {cause.evidence.map((e, i) => (
                <li key={i} className="text-xs text-gray-400 flex gap-1.5">
                  <span className="text-gray-600 shrink-0">•</span>
                  <span className="font-mono break-all">{e}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">권장 조치</p>
            <p className="text-xs text-gray-300">{cause.suggested_fix}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function IncidentResultView({ data }: { data: IncidentAgentData }) {
  const [tab, setTab] = useState<'causes' | 'internal' | 'external'>('causes');
  const tabs = [
    { key: 'causes' as const, label: `원인 분석 (${data.root_causes.length})`, cls: 'bg-violet-600/80 text-white' },
    { key: 'internal' as const, label: '내부 보고서', cls: 'bg-blue-600/80 text-white' },
    { key: 'external' as const, label: '외부 공지', cls: 'bg-emerald-600/80 text-white' },
  ];
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1 bg-[#0d0d12] rounded-lg p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t.key ? t.cls : 'text-gray-400 hover:text-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'causes' && (
        <div className="space-y-2">
          {data.root_causes.map((c, i) => <RootCauseCard key={i} cause={c} />)}
        </div>
      )}
      {tab === 'internal' && (
        <div className="bg-[#0d0d12] border border-[#2a2a35] rounded-lg p-3 text-xs text-gray-300 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto font-mono">
          {data.internal_report}
        </div>
      )}
      {tab === 'external' && (
        <div className="bg-[#0d0d12] border border-[#2a2a35] rounded-lg p-3 text-xs text-gray-300 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
          {data.external_notice}
        </div>
      )}
    </div>
  );
}

// ─── Test Case Result View ────────────────────────────────────────────────────

const DRAFT_TYPE_STYLE: Record<string, string> = {
  HAPPY_PATH: 'bg-green-500/20 text-green-400',
  VALIDATION: 'bg-blue-500/20 text-blue-400',
  AUTHORIZATION: 'bg-purple-500/20 text-purple-400',
  EDGE_CASE: 'bg-amber-500/20 text-amber-400',
  PERFORMANCE: 'bg-cyan-500/20 text-cyan-400',
  FAILURE_HANDLING: 'bg-red-500/20 text-red-400',
};
const CASE_TYPE_STYLE: Record<string, string> = {
  NORMAL: 'bg-green-500/10 text-green-500',
  EXCEPTION: 'bg-red-500/10 text-red-400',
  BOUNDARY: 'bg-amber-500/10 text-amber-400',
};
const TC_METHOD_COLOR: Record<string, string> = {
  GET: 'bg-green-500/20 text-green-400',
  POST: 'bg-blue-500/20 text-blue-400',
  PUT: 'bg-amber-500/20 text-amber-400',
  PATCH: 'bg-yellow-500/20 text-yellow-400',
  DELETE: 'bg-red-500/20 text-red-400',
};
const TEST_LEVEL_STYLE: Record<string, string> = {
  SMOKE: 'bg-red-500/20 text-red-400',
  SANITY: 'bg-yellow-500/20 text-yellow-400',
  REGRESSION: 'bg-blue-500/20 text-blue-400',
  FULL: 'bg-purple-500/20 text-purple-400',
};
const DRAFT_TYPE_LABEL: Record<string, string> = {
  HAPPY_PATH: 'Happy Path',
  VALIDATION: 'Validation',
  AUTHORIZATION: 'Authorization',
  EDGE_CASE: 'Edge Case',
  PERFORMANCE: 'Performance',
  FAILURE_HANDLING: 'Failure Handling',
};

// 에이전트가 success/auth/edge 등 자유로운 표기로 type을 내려주므로 표준 키로 정규화한다.
// 예: "success" / "Success" → HAPPY_PATH → "Happy Path"
const canonicalDraftType = (rawType?: string): string => {
  const normalized = String(rawType || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (!normalized) return '';
  if (normalized.includes('happy') || normalized.includes('success') || normalized === 'normal') return 'HAPPY_PATH';
  if (normalized.includes('auth')) return 'AUTHORIZATION';
  if (normalized.includes('perf') || normalized.includes('load') || normalized.includes('latency')) return 'PERFORMANCE';
  if (normalized.includes('edge') || normalized.includes('boundary')) return 'EDGE_CASE';
  if (normalized.includes('valid') || normalized.includes('invalid')) return 'VALIDATION';
  if (normalized.includes('fail') || normalized.includes('error') || normalized.includes('negative') || normalized.includes('exception')) return 'FAILURE_HANDLING';
  return normalized.toUpperCase();
};

const draftTypeLabel = (rawType?: string): string => {
  const key = canonicalDraftType(rawType);
  return DRAFT_TYPE_LABEL[key] ?? (rawType || '');
};

const draftTypeStyle = (rawType?: string): string =>
  DRAFT_TYPE_STYLE[canonicalDraftType(rawType)] ?? 'bg-gray-500/20 text-gray-400';

// 에이전트는 테스트 레벨 값을 risk_level로 내려주므로 testLevel이 없으면 risk_level을 사용한다.
const draftTestLevel = (draft: OrchestratorTestCaseDraft): string =>
  String(draft.testLevel || draft.risk_level || '').toUpperCase();

const parseJsonObject = (value: unknown): Record<string, unknown> | undefined => {
  if (!value) return undefined;
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== 'string') return undefined;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const draftRequestSpecObject = (draft: OrchestratorTestCaseDraft) =>
  parseJsonObject(draft.requestSpec) ??
  (typeof draft.requestSpec === 'object' && !Array.isArray(draft.requestSpec) ? draft.requestSpec : {});

const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

const normalizeHttpMethod = (value?: unknown) => {
  if (typeof value !== 'string') return undefined;
  const method = value.trim().toUpperCase();
  return HTTP_METHODS.has(method) ? method : undefined;
};

const splitMethodEndpoint = (value?: unknown) => {
  if (typeof value !== 'string') return {};
  const trimmed = value.trim();
  const match = trimmed.match(/^([A-Z]+)\s*[: ]\s*(\/.*)$/i);
  if (!match) return {};
  const method = normalizeHttpMethod(match[1]);
  return method ? { method, endpoint: match[2].trim() } : {};
};

const normalizeEndpointPath = (value?: unknown) => {
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
};

const isTestCaseAgentType = (agentType?: string) => {
  const normalized = String(agentType || '').toLowerCase().replace(/[\s_-]+/g, '');
  return normalized === 'testcase' || normalized === 'testcases' || normalized.includes('testcase');
};

const draftEndpointParts = (draft: OrchestratorTestCaseDraft) => {
  const requestSpec = draftRequestSpecObject(draft);
  const apiIdEndpoint = splitMethodEndpoint(draft.apiId);
  const endpointName = splitMethodEndpoint(draft.endpointName);

  const candidates = [
    {
      method: normalizeHttpMethod(draft.selectedEndpoint?.method),
      endpoint: normalizeEndpointPath(draft.selectedEndpoint?.path),
    },
    {
      method: normalizeHttpMethod(draft.request?.method),
      endpoint: normalizeEndpointPath(draft.request?.endpoint),
    },
    {
      method: normalizeHttpMethod(draft.executionMethod),
      endpoint: normalizeEndpointPath(draft.executionEndpoint),
    },
    {
      method: normalizeHttpMethod(endpointName.method),
      endpoint: normalizeEndpointPath(endpointName.endpoint),
    },
    {
      method: normalizeHttpMethod(requestSpec.method),
      endpoint: normalizeEndpointPath(requestSpec.endpoint),
    },
    {
      method: normalizeHttpMethod(apiIdEndpoint.method),
      endpoint: normalizeEndpointPath(apiIdEndpoint.endpoint),
    },
  ];

  return candidates.find((candidate) => candidate.method && candidate.endpoint) ?? candidates.find((candidate) => candidate.method) ?? {};
};

const draftGroupKey = (draft: OrchestratorTestCaseDraft) => {
  const endpoint = draftEndpointParts(draft);
  if (draft.selectedEndpoint?.id) return `api:${draft.selectedEndpoint.id}`;
  if (endpoint.method && endpoint.endpoint) return `${endpoint.method} ${endpoint.endpoint}`;
  return `draft:${draft.apiId || draft.id || draft.draftId || draft.title}`;
};

const draftEndpointLabel = (draft: OrchestratorTestCaseDraft) => {
  const endpoint = draftEndpointParts(draft);
  return endpoint.method && endpoint.endpoint ? `${endpoint.method} ${endpoint.endpoint}` : `API #${draft.apiId}`;
};

const draftMethod = (draft: OrchestratorTestCaseDraft) =>
  draftEndpointParts(draft).method || 'API';

const draftRequestBody = (draft: OrchestratorTestCaseDraft) => {
  const requestSpec = draftRequestSpecObject(draft);
  return draft.request?.body ?? requestSpec.body ?? {};
};

const draftRequestSpec = (draft: OrchestratorTestCaseDraft) =>
  ({
    ...draftRequestSpecObject(draft),
    method: draftEndpointParts(draft).method ?? draft.request?.method ?? draftRequestSpecObject(draft).method ?? splitMethodEndpoint(draft.apiId).method,
    endpoint: draftEndpointParts(draft).endpoint ?? draft.request?.endpoint ?? draftRequestSpecObject(draft).endpoint ?? splitMethodEndpoint(draft.apiId).endpoint,
    headers: draft.request?.headers,
    pathParams: draft.request?.pathParams ?? draftRequestSpecObject(draft).pathParams ?? {},
    queryParams: draft.request?.queryParams ?? draftRequestSpecObject(draft).queryParams ?? {},
    body: draftRequestBody(draft),
  });

const draftExpected = (draft: OrchestratorTestCaseDraft) =>
  draft.expected ?? parseJsonObject(draft.expectedSpec) ?? draft.expectedSpec ?? {};

const draftAssertion = (draft: OrchestratorTestCaseDraft) =>
  draft.assertion ?? parseJsonObject(draft.assertionSpec) ?? draft.assertionSpec ?? {};

const stringifySpecForSave = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '';
  return typeof value === 'string' ? value.trim() : JSON.stringify(value);
};

const buildOrchestratorDraftSavePayload = (draft: OrchestratorTestCaseDraft, draftId?: number) => {
  const expectedSpec = stringifySpecForSave(draft.expectedResult || draftExpected(draft));
  return {
    ...(draftId !== undefined ? { draftId } : {}),
    name: draft.title.trim(),
    title: draft.title.trim(),
    description: draft.description,
    type: draft.type,
    testLevel: draft.testLevel,
    userRole: draft.userRole ?? undefined,
    stateCondition: draft.stateCondition ?? undefined,
    dataVariant: draft.dataVariant ?? undefined,
    requestSpec: stringifySpecForSave(
      typeof draft.requestSpec === 'string' && !draft.request ? draft.requestSpec : draftRequestSpec(draft),
    ),
    expectedResult: expectedSpec,
    expectedSpec,
    assertionSpec: stringifySpecForSave(draftAssertion(draft)),
  };
};

const toObjectValue = (value: unknown, fallback: Record<string, unknown> = {}) =>
  parseJsonObject(value) ?? (value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : fallback);

const normalizeBackendDraftForOrchestrator = (draft: TestGenerationDraftResponse): OrchestratorTestCaseDraft => {
  const request = toObjectValue(draft.request);
  const requestSpec = toObjectValue(draft.requestSpec, request);
  const expected = toObjectValue(draft.expected ?? draft.expectedSpec ?? draft.expectedResult);
  const assertion = toObjectValue(draft.assertion ?? draft.assertionSpec);
  const draftId = Number(draft.draftId ?? draft.id);

  return {
    id: Number.isFinite(draftId) ? draftId : undefined,
    draftId: Number.isFinite(draftId) ? draftId : undefined,
    generationId: draft.generationId,
    apiId: String(draft.selectedEndpoint?.id ?? draft.apiId ?? draft.apiInventoryId ?? ''),
    endpointName: draft.endpointName,
    selectedEndpoint: draft.selectedEndpoint
      ? {
          id: draft.selectedEndpoint.id,
          method: String(draft.selectedEndpoint.method || ''),
          path: draft.selectedEndpoint.path,
          domainTag: draft.selectedEndpoint.domainTag,
          controllerName: draft.selectedEndpoint.controllerName,
        }
      : undefined,
    title: draft.title || draft.name || `Draft ${Number.isFinite(draftId) ? draftId : ''}`.trim(),
    description: draft.description || '',
    type: draft.type || 'HAPPY_PATH',
    risk_level: draft.risk_level,
    // 에이전트가 테스트 레벨 값을 risk_level로 내려주므로 testLevel이 비어 있으면 risk_level로 매핑한다.
    testLevel: draft.testLevel ?? draft.risk_level,
    userRole: draft.userRole || draft.role || null,
    stateCondition: draft.stateCondition || null,
    dataVariant: draft.dataVariant || null,
    requestSpec: {
      method: String(requestSpec.method || request.method || draft.executionMethod || draft.selectedEndpoint?.method || ''),
      endpoint: String(requestSpec.endpoint || request.endpoint || draft.executionEndpoint || draft.selectedEndpoint?.path || ''),
      pathParams: toObjectValue(requestSpec.pathParams),
      queryParams: toObjectValue(requestSpec.queryParams),
      body: request.body ?? requestSpec.body ?? {},
    },
    request: {
      method: String(request.method || requestSpec.method || draft.executionMethod || draft.selectedEndpoint?.method || ''),
      endpoint: String(request.endpoint || requestSpec.endpoint || draft.executionEndpoint || draft.selectedEndpoint?.path || ''),
      headers: toObjectValue(request.headers),
      pathParams: toObjectValue(request.pathParams ?? requestSpec.pathParams),
      queryParams: toObjectValue(request.queryParams ?? requestSpec.queryParams),
      body: request.body ?? requestSpec.body ?? {},
    },
    executionMethod: draft.executionMethod || String(request.method || requestSpec.method || draft.selectedEndpoint?.method || ''),
    executionEndpoint: draft.executionEndpoint || String(request.endpoint || requestSpec.endpoint || draft.selectedEndpoint?.path || ''),
    expected,
    assertion,
    expectedSpec: {
      statusCode: Number(expected.statusCode ?? 0),
      body: expected.body ?? {},
      errorMessage: typeof expected.errorMessage === 'string' ? expected.errorMessage : null,
    },
    assertionSpec: {
      statusCode: Number(assertion.statusCode ?? expected.statusCode ?? 0),
      bodyContains: Array.isArray(assertion.bodyContains) ? assertion.bodyContains.map(String) : [],
      headerContains: toObjectValue(assertion.headerContains) as Record<string, string>,
    },
    validationRules: draft.validationRules,
    expectedStatusCodes: draft.expectedStatusCodes,
    errorStatusCodes: draft.errorStatusCodes,
    errorCodes: draft.errorCodes,
    duplicate: Boolean(draft.duplicate),
    selectedForSave: (draft as { selectedForSave?: boolean }).selectedForSave,
    createdAt: (draft as { createdAt?: string }).createdAt,
  };
};

// 드래프트에 엔드포인트 경로가 없으면(예: apiId만 있는 경우) API 상세를 조회해
// selectedEndpoint(method/path)를 채워서 "API #2007" 대신 실제 엔드포인트명이 보이도록 한다.
const enrichDraftEndpoints = async (
  drafts: OrchestratorTestCaseDraft[],
): Promise<OrchestratorTestCaseDraft[]> => {
  const missingApiIds = new Set<number>();
  drafts.forEach((draft) => {
    if (draftEndpointParts(draft).endpoint) return;
    const apiId = Number(draft.selectedEndpoint?.id ?? draft.apiId);
    if (Number.isFinite(apiId) && apiId > 0) missingApiIds.add(apiId);
  });
  if (missingApiIds.size === 0) return drafts;

  const detailByApiId = new Map<number, { method: string; path: string }>();
  await Promise.all(
    Array.from(missingApiIds).map(async (apiId) => {
      try {
        const detail = await flowOpsApi.getApiDetail(apiId);
        if (detail?.path) {
          detailByApiId.set(apiId, { method: String(detail.method || ''), path: detail.path });
        }
      } catch (error) {
        console.warn('[OrchestratorAgent] failed to resolve endpoint for apiId', { apiId, error });
      }
    }),
  );
  if (detailByApiId.size === 0) return drafts;

  return drafts.map((draft) => {
    if (draftEndpointParts(draft).endpoint) return draft;
    const apiId = Number(draft.selectedEndpoint?.id ?? draft.apiId);
    const detail = detailByApiId.get(apiId);
    if (!detail) return draft;
    return {
      ...draft,
      selectedEndpoint: {
        ...draft.selectedEndpoint,
        id: draft.selectedEndpoint?.id ?? apiId,
        method: draft.selectedEndpoint?.method || detail.method,
        path: draft.selectedEndpoint?.path || detail.path,
      },
    };
  });
};

const hydrateTestCaseData = async (data: OrchestratorTestCaseData): Promise<OrchestratorTestCaseData> => {
  const generationId = Number(data.generationId);
  if (Array.isArray(data.drafts) && data.drafts.length > 0) {
    const drafts = await enrichDraftEndpoints(
      data.drafts.map((draft) => normalizeBackendDraftForOrchestrator(draft as TestGenerationDraftResponse)),
    );
    return {
      ...data,
      generationId: Number.isFinite(generationId) && generationId > 0 ? generationId : data.generationId,
      drafts,
    };
  }

  if (!Number.isFinite(generationId) || generationId <= 0) return data;

  const backendDrafts = await flowOpsApi
    .listTestGenerationDrafts(generationId)
    .catch((error) => {
      console.warn('[OrchestratorAgent] failed to hydrate test generation drafts', {
        generationId,
        error,
      });
      return [] as TestGenerationDraftResponse[];
    });

  if (backendDrafts.length === 0) return data;
  const drafts = await enrichDraftEndpoints(backendDrafts.map(normalizeBackendDraftForOrchestrator));
  return { ...data, generationId, drafts };
};

function TestCaseDraftRow({
  draft, index, checked, onToggle,
}: {
  draft: OrchestratorTestCaseDraft;
  index: number;
  checked: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const typeStyle = draftTypeStyle(draft.type);
  const testLevel = draftTestLevel(draft);
  const testLevelStyle = TEST_LEVEL_STYLE[testLevel] ?? 'bg-gray-500/10 text-gray-500';
  const requestBody = draftRequestBody(draft);
  const expected = draftExpected(draft);
  const assertion = draftAssertion(draft);
  const expectedObject = toObjectValue(expected);
  const assertionObject = toObjectValue(assertion);
  const statusCode = expectedObject.statusCode ?? assertionObject.statusCode;
  return (
    <div className={`bg-[#0d0d12] border rounded-lg p-2.5 ${draft.duplicate ? 'border-amber-500/20 opacity-60' : 'border-[#2a2a35]'}`}>
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="mt-0.5 shrink-0 accent-indigo-500 cursor-pointer"
        />
        <span className="text-[10px] text-gray-600 shrink-0 mt-0.5 font-mono">TC-{String(index + 1).padStart(3, '0')}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-200 leading-snug">{draft.title}</p>
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${typeStyle}`}>{draftTypeLabel(draft.type)}</span>
            {testLevel && <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${testLevelStyle}`}>{testLevel}</span>}
            {statusCode !== undefined && <span className="text-[9px] text-gray-500 bg-[#1f1f28] px-1.5 py-0.5 rounded">{statusCode}</span>}
            {draft.duplicate && <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">중복</span>}
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="shrink-0 text-gray-500 hover:text-gray-300">
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-[#2a2a35] space-y-2 text-xs ml-6">
          <p className="text-gray-400 leading-relaxed">{draft.description}</p>
          {requestBody !== null && requestBody !== undefined && (
            <div>
              <p className="text-[10px] text-gray-500 mb-1">요청 바디</p>
              <pre className="bg-[#060609] rounded p-2 text-[10px] text-gray-300 overflow-x-auto font-mono whitespace-pre-wrap">
                {JSON.stringify(requestBody, null, 2)}
              </pre>
            </div>
          )}
          <div>
            <p className="text-[10px] text-gray-500 mb-1">Expected</p>
            <pre className="bg-[#060609] rounded p-2 text-[10px] text-gray-300 overflow-x-auto font-mono whitespace-pre-wrap">
              {JSON.stringify(expected, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 mb-1">Assertion</p>
            <pre className="bg-[#060609] rounded p-2 text-[10px] text-gray-300 overflow-x-auto font-mono whitespace-pre-wrap">
              {JSON.stringify(assertion, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function TestCaseResultView({ data }: { data: OrchestratorTestCaseData }) {
  const navigate = useNavigate();

  const groups = useMemo(() => {
    const map = new Map<string, { draft: OrchestratorTestCaseDraft; globalIdx: number }[]>();
    data.drafts.forEach((d, i) => {
      const key = draftGroupKey(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ draft: d, globalIdx: i });
    });
    return Array.from(map.entries());
  }, [data.drafts]);

  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(data.drafts.map((_, i) => i)),
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(groups.map(([key]) => key)),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);

  const toggleDraft = (idx: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });

  const toggleGroup = (items: { globalIdx: number }[]) => {
    const allSel = items.every(({ globalIdx }) => selected.has(globalIdx));
    setSelected((prev) => {
      const next = new Set(prev);
      items.forEach(({ globalIdx }) => (allSel ? next.delete(globalIdx) : next.add(globalIdx)));
      return next;
    });
  };

  const toggleExpand = (key: string) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  const handleSave = async () => {
    const toSave = data.drafts.filter((_, i) => selected.has(i));
    if (!toSave.length) {
      setSaveError('Select at least one test case draft before saving.');
      return;
    }
    if (isSaving || isSaved) return;
    const generationId = Number(data.generationId);
    const appId = activeApplication.appId || DEFAULT_APP_ID;
    setIsSaving(true);
    setSaveError(null);
    try {
      const backendDrafts = toSave
        .map((draft) => ({ draft, draftId: Number(draft.draftId ?? draft.id) }))
        .filter((item) => Number.isFinite(item.draftId) && item.draftId > 0);

      if (Number.isFinite(generationId) && generationId > 0 && backendDrafts.length === toSave.length) {
        const body = {
          appId,
          testCases: backendDrafts.map(({ draft, draftId }) => buildOrchestratorDraftSavePayload(draft, draftId)),
        };
        console.info('[OrchestratorAgent] saving via test generation draft API', {
          generationId,
          appId,
          testCaseCount: body.testCases.length,
          testCases: body.testCases,
        });
        await flowOpsApi.saveTestGenerationDrafts(generationId, body);
      } else {
        console.info('[OrchestratorAgent] saving via direct test case API fallback', {
          generationId: data.generationId,
          appId,
          selectedCount: toSave.length,
          backendDraftCount: backendDrafts.length,
          drafts: toSave.map((draft) => ({
            id: draft.id,
            draftId: draft.draftId,
            apiId: draft.apiId,
            endpoint: draftEndpointLabel(draft),
          })),
        });
        await Promise.all(
          toSave.map((draft) => {
            const apiId = Number(draft.selectedEndpoint?.id ?? draft.apiId);
            return flowOpsApi.createTestCase(appId, {
              apiId,
              ...buildOrchestratorDraftSavePayload(draft),
            });
          }),
        );
      }
      console.info('[OrchestratorAgent] test case draft save completed');
      // 로딩 → 저장완료 상태를 노출한 뒤 테스트 케이스 목록으로 이동한다.
      setIsSaving(false);
      setSavedCount(toSave.length);
      setIsSaved(true);
      setTimeout(() => navigate('/qc/testcase'), 1200);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.');
      setIsSaving(false);
    }
  };

  const unique = data.drafts.filter((d) => !d.duplicate).length;
  const selectedCount = selected.size;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>{data.drafts.length}개 생성</span>
        {data.drafts.some((d) => d.duplicate) && (
          <span className="text-amber-400">({data.drafts.length - unique}개 중복)</span>
        )}
        <span className="ml-auto text-indigo-400 font-medium">{selectedCount}개 선택됨</span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
        {groups.map(([apiId, items]) => {
          const firstDraft = items[0]?.draft;
          const method = firstDraft ? draftMethod(firstDraft) : 'API';
          const endpointLabel = firstDraft ? draftEndpointLabel(firstDraft) : `API #${apiId}`;
          const isExpanded = expandedGroups.has(apiId);
          const allSel = items.every(({ globalIdx }) => selected.has(globalIdx));
          const partialSel = !allSel && items.some(({ globalIdx }) => selected.has(globalIdx));
          return (
            <div key={apiId} className="border border-[#2a2a35] rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-2.5 py-2 bg-[#13131a]">
                <input
                  type="checkbox"
                  checked={allSel}
                  ref={(el) => { if (el) el.indeterminate = partialSel; }}
                  onChange={() => toggleGroup(items)}
                  className="shrink-0 accent-indigo-500 cursor-pointer"
                />
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${TC_METHOD_COLOR[method] ?? 'bg-gray-500/20 text-gray-400'}`}>
                  {method}
                </span>
                <span className="text-xs text-gray-300 font-mono flex-1 truncate">{endpointLabel}</span>
                <span className="text-[10px] text-gray-500 shrink-0">{items.length}개</span>
                <button onClick={() => toggleExpand(apiId)} className="text-gray-500 hover:text-gray-300 shrink-0">
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
              {isExpanded && (
                <div className="p-2 space-y-1.5">
                  {items.map(({ draft, globalIdx }) => (
                    <TestCaseDraftRow
                      key={globalIdx}
                      draft={draft}
                      index={globalIdx}
                      checked={selected.has(globalIdx)}
                      onToggle={() => toggleDraft(globalIdx)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {saveError && <p className="text-xs text-red-400">{saveError}</p>}
      <button
        onClick={handleSave}
        disabled={selectedCount === 0 || isSaving || isSaved}
        className={`w-full mt-1 disabled:cursor-not-allowed text-white rounded-lg py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
          isSaved
            ? 'bg-green-600 disabled:opacity-100'
            : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40'
        }`}
      >
        {isSaved
          ? <><CheckCircle2 size={12} /> 저장완료 ({savedCount}개)</>
          : isSaving
            ? <><Loader2 size={12} className="animate-spin" /> 저장 중...</>
            : <><Save size={12} /> 저장하기 ({selectedCount}개)</>}
      </button>
    </div>
  );
}

// ─── Scenario Result View ────────────────────────────────────────────────────

const METHOD_COLOR: Record<string, string> = {
  GET: 'bg-green-500/20 text-green-400',
  POST: 'bg-blue-500/20 text-blue-400',
  PUT: 'bg-amber-500/20 text-amber-400',
  PATCH: 'bg-yellow-500/20 text-yellow-400',
  DELETE: 'bg-red-500/20 text-red-400',
};

function ScenarioStepRow({ step }: { step: OrchestratorScenarioStep }) {
  const [showDetail, setShowDetail] = useState(false);
  const colonIdx = step.endpoint_id.indexOf(':');
  const method = colonIdx > -1 ? step.endpoint_id.slice(0, colonIdx) : step.endpoint_id;
  const path = colonIdx > -1 ? step.endpoint_id.slice(colonIdx + 1) : '';
  const methodColor = METHOD_COLOR[method] ?? 'bg-gray-500/20 text-gray-400';
  return (
    <div className="bg-[#060609] rounded-lg px-2 py-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-gray-600 font-mono w-4 text-center shrink-0">{step.order}</span>
        <span className={`text-[9px] font-bold px-1 py-0.5 rounded shrink-0 ${methodColor}`}>{method}</span>
        <span className="text-[10px] text-gray-400 font-mono truncate flex-1">{path}</span>
        <span className="text-[9px] text-gray-500 bg-[#1f1f28] px-1.5 py-0.5 rounded shrink-0">{step.expected_status_code}</span>
        {step.chained_variables.length > 0 && (
          <span className="text-teal-500 text-[10px] shrink-0" title={`${step.chained_variables.length}개 쬀이닝`}>⇒</span>
        )}
        <button onClick={() => setShowDetail(!showDetail)} className="text-gray-600 hover:text-gray-400 shrink-0">
          {showDetail ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
      </div>
      <p className="text-[10px] text-gray-400 ml-6 mt-0.5 truncate">{step.name}</p>
      {showDetail && (
        <div className="ml-6 mt-1.5 space-y-1.5">
          {step.expected_assertions.length > 0 && (
            <div>
              <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">검증</p>
              {step.expected_assertions.map((a, i) => (
                <p key={i} className="text-[10px] text-gray-400 flex gap-1">
                  <span className="text-gray-600 shrink-0">•</span>{a}
                </p>
              ))}
            </div>
          )}
          {step.chained_variables.length > 0 && (
            <div>
              <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">쬀이닝</p>
              {step.chained_variables.map((v, i) => (
                <p key={i} className="text-[10px] text-teal-400/70 flex gap-1 flex-wrap font-mono">
                  <span>{v.source_step_ref}</span>
                  <span className="text-gray-600">→</span>
                  <span>{v.source_json_path}</span>
                  <span className="text-gray-600">→</span>
                  <span>{v.target_field}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: OrchestratorScenario }) {
  const [expanded, setExpanded] = useState(false);
  const riskStyle = scenario.meta.estimated_risk === 'HIGH'
    ? 'bg-red-500/20 text-red-400'
    : scenario.meta.estimated_risk === 'MEDIUM'
      ? 'bg-amber-500/20 text-amber-400'
      : 'bg-green-500/20 text-green-400';
  return (
    <div className="bg-[#0d0d12] border border-[#2a2a35] rounded-lg">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full p-2.5 flex items-start gap-2 text-left">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-200 font-medium leading-snug">{scenario.name}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{scenario.steps.length}개 스텝</p>
        </div>
        <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${riskStyle}`}>
          {scenario.meta.estimated_risk}
        </span>
        {expanded ? <ChevronUp size={12} className="text-gray-500 shrink-0 mt-0.5" /> : <ChevronDown size={12} className="text-gray-500 shrink-0 mt-0.5" />}
      </button>
      {expanded && (
        <div className="px-2.5 pb-2.5 border-t border-[#2a2a35] pt-2 space-y-2">
          {scenario.meta.rationale && (
            <p className="text-[10px] text-gray-400 leading-relaxed">{scenario.meta.rationale}</p>
          )}
          <div className="space-y-1">
            {scenario.steps.map((step) => <ScenarioStepRow key={step.step_id} step={step} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ScenarioResultView({ data }: { data: OrchestratorScenarioData }) {
  return (
    <div className="mt-2 space-y-2">
      <div className="text-xs text-gray-400">
        {data.scenarios.length}개 시나리오
        {data.used_endpoint_ids.length > 0 && (
          <span className="text-gray-500"> · API {data.used_endpoint_ids.length}개 사용</span>
        )}
      </div>
      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
        {data.scenarios.map((s) => <ScenarioCard key={s.scenario_id} scenario={s} />)}
      </div>
    </div>
  );
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: AgentTask }) {
  const isLog = task.type === 'log-analysis';
  const isScenario = task.type === 'scenario-generation';
  const isRunning = task.status === 'running';
  const isDone = task.status === 'done';
  const isError = task.status === 'error';

  const accent = isLog ? 'violet' : isScenario ? 'teal' : 'indigo';
  const borderCls = isError
    ? 'border-red-500/30 bg-red-500/5'
    : isDone
      ? `border-${accent}-500/30 bg-${accent}-500/5`
      : `border-${accent}-500/20 bg-${accent}-500/5`;

  const icon = isLog
    ? <FileSearch size={11} className="text-white" />
    : isScenario
      ? <GitBranch size={11} className="text-white" />
      : <TestTube2 size={11} className="text-white" />;

  const label = isLog ? 'Log Analysis Agent' : isScenario ? 'Scenario Agent' : 'Test Case Agent';
  const iconBg = isLog ? 'bg-violet-600' : isScenario ? 'bg-teal-600' : 'bg-indigo-600';

  return (
    <div className={`flex-1 min-w-0 rounded-xl border p-3 ${borderCls}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
        <span className="text-xs font-medium text-gray-300 truncate">{label}</span>
        <div className="ml-auto shrink-0">
          {isRunning && <Loader2 size={13} className="text-violet-400 animate-spin" />}
          {isDone && <CheckCircle2 size={13} className="text-green-400" />}
          {isError && <AlertCircle size={13} className="text-red-400" />}
        </div>
      </div>
      {task.summary && isDone && <p className="text-[11px] text-gray-400 mb-2">{task.summary}</p>}
      {isRunning && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span>처리 중</span>
          <span className="flex gap-0.5 mt-0.5">
            {[0, 150, 300].map((d, i) => (
              <span key={i} className="w-1 h-1 bg-gray-500 rounded-full inline-block animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </span>
        </div>
      )}
      {isDone && isLog && task.incidentData && <IncidentResultView data={task.incidentData} />}
      {isDone && task.type === 'test-generation' && task.testData && <TestCaseResultView data={task.testData} />}
      {isDone && isScenario && task.scenarioData && <ScenarioResultView data={task.scenarioData} />}
      {isError && <p className="text-xs text-red-400">{task.errorMessage ?? '에이전트 오류가 발생했습니다.'}</p>}
    </div>
  );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

function ActionButton({
  icon, label, colorClass, onClick, disabled,
}: {
  icon: React.ReactNode; label: string; colorClass: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center justify-center gap-1.5 border rounded-lg py-1.5 px-2 text-xs font-medium transition-all bg-[#13131a] disabled:opacity-40 disabled:cursor-not-allowed ${colorClass}`}>
      {icon}{label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const INIT_MESSAGE: Message = {
  id: 'init',
  role: 'assistant',
  content:
    '👋 안녕하세요! 저는 FlowOps Manager입니다.\n\n테스트 생성, 시나리오 구성, 로그 분석을 한곳에서 도와드릴게요.\n\n아래 버튼을 선택해 주세요.',
};

export function OrchestratorAgent() {
  const { activeApplication } = useTestContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INIT_MESSAGE]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isActionsCollapsed, setIsActionsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeAppIdRef = useRef(activeApplication.appId);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (isOpen && !isMinimized) setTimeout(() => inputRef.current?.focus(), 50); }, [isOpen, isMinimized]);
  useEffect(() => {
    activeAppIdRef.current = activeApplication.appId;
    setMessages([INIT_MESSAGE]);
    setInput('');
    setIsProcessing(false);
    setIsActionsCollapsed(false);
  }, [activeApplication.appId]);

  const hasActiveForm = messages.some((m) => m.formType !== undefined);

  const resolveCurrentProjectId = async () => {
    const storedProjectId = getStoredProjectIdForApp(activeApplication.appId);
    if (storedProjectId) return String(storedProjectId);
    const project = await flowOpsApi.ensureProject();
    return String(project.id);
  };

  const updateTask = (msgId: string, type: AgentTask['type'], updates: Partial<AgentTask>) =>
    setMessages((prev) =>
      prev.map((m) => m.id !== msgId ? m : { ...m, tasks: m.tasks?.map((t) => t.type === type ? { ...t, ...updates } : t) }),
    );

  const replaceFormWithTasks = (formMsgId: string, userContent: string, tasks: AgentTask[]): string => {
    const taskMsgId = `task-${Date.now()}`;
    const routingText = tasks.length > 1
      ? '병렬 실행을 시작합니다 — 두 에이전트를 동시에 가동합니다...'
      : tasks[0].type === 'log-analysis'
        ? 'Log Analysis Agent로 요청을 라우팅합니다...'
        : tasks[0].type === 'scenario-generation'
          ? 'Scenario Agent로 요청을 라우팅합니다...'
          : 'Test Case Agent로 요청을 라우팅합니다...';
    setMessages((prev) => [
      ...prev.filter((m) => m.id !== formMsgId),
      { id: `user-${Date.now()}`, role: 'user', content: userContent },
      { id: taskMsgId, role: 'assistant', content: routingText, tasks },
    ]);
    setIsProcessing(true);
    return taskMsgId;
  };

  const handleLogFormSubmit = async (formData: LogFormData, formMsgId: string) => {
    const projectId = formData.project_id || await resolveCurrentProjectId();
    const taskMsgId = replaceFormWithTasks(formMsgId,
      `로그 분석 요청: [${formData.service_name}] ${formData.user_prompt}`,
      [{ type: 'log-analysis', status: 'running' }]);
    try {
      const res = await flowOpsApi.dispatchOrchestrator({
        project_id: projectId,
        user_prompt: formData.user_prompt,
        context: { service_name: formData.service_name, occurred_at: new Date(formData.occurred_at).toISOString(), raw_log: formData.raw_log },
      });
      const r = res.data?.agent_results?.find((x) => x.agent_type === 'incident');
      if (r?.success && r.data) {
        updateTask(taskMsgId, 'log-analysis', { status: 'done', incidentData: r.data as IncidentAgentData, summary: res.data?.summary });
      } else {
        updateTask(taskMsgId, 'log-analysis', { status: 'error', errorMessage: r?.error_message ?? res.error_message ?? '분석 중 오류가 발생했습니다.' });
      }
    } catch (e) {
      updateTask(taskMsgId, 'log-analysis', { status: 'error', errorMessage: e instanceof Error ? e.message : '알 수 없는 오류' });
    } finally { setIsProcessing(false); }
  };

  const handleTestFormSubmit = async (formData: TestFormData, formMsgId: string) => {
    const projectId = formData.project_id || await resolveCurrentProjectId();
    const endpointId = `${formData.method}:${formData.path}`;
    const taskMsgId = replaceFormWithTasks(formMsgId,
      `테스트 케이스 생성 요청: [${formData.method} ${formData.path}] ${formData.user_prompt}`,
      [{ type: 'test-generation', status: 'running' }]);
    try {
      const res = await flowOpsApi.dispatchOrchestratorTest({
        project_id: projectId,
        user_prompt: formData.user_prompt,
        context: {
          base_url: formData.base_url, env_name: formData.env_name,
          api_inventory: {
            project_id: projectId,
            endpoints: [{
              endpoint_id: endpointId, path: formData.path, method: formData.method,
              ...(formData.summary ? { summary: formData.summary } : {}),
              ...(formData.auth_type !== 'none' ? { auth: { type: formData.auth_type } } : {}),
              ...(parseJsonSafe(formData.request_body_schema) ? { request_body_schema: parseJsonSafe(formData.request_body_schema) } : {}),
              ...(parseJsonSafe(formData.response_schema) ? { response_schema: parseJsonSafe(formData.response_schema) } : {}),
            }],
          },
        },
      });
      const r = res.data?.agent_results?.find((x) => isTestCaseAgentType(x.agent_type));
      if (r?.success && r.data) {
        const testData = await hydrateTestCaseData(r.data as OrchestratorTestCaseData);
        updateTask(taskMsgId, 'test-generation', { status: 'done', testData, summary: res.data?.summary });
      } else {
        updateTask(taskMsgId, 'test-generation', { status: 'error', errorMessage: r?.error_message ?? res.error_message ?? '생성 중 오류가 발생했습니다.' });
      }
    } catch (e) {
      updateTask(taskMsgId, 'test-generation', { status: 'error', errorMessage: e instanceof Error ? e.message : '알 수 없는 오류' });
    } finally { setIsProcessing(false); }
  };

  const handleScenarioFormSubmit = async (formData: ScenarioFormData, formMsgId: string) => {
    const projectId = formData.project_id || await resolveCurrentProjectId();
    const taskMsgId = replaceFormWithTasks(formMsgId,
      `시나리오 생성 요청: ${formData.user_prompt}`,
      [{ type: 'scenario-generation', status: 'running' }]);
    try {
      const res = await flowOpsApi.dispatchOrchestratorScenario({
        project_id: projectId,
        user_prompt: formData.user_prompt,
        context: {
          api_inventory: {
            project_id: projectId,
            endpoints: formData.endpoints
              .filter((e) => e.path.trim())
              .map((e) => ({
                endpoint_id: `${e.method}:${e.path}`,
                path: e.path,
                method: e.method,
                ...(e.summary ? { summary: e.summary } : {}),
                ...(e.auth_type !== 'none' ? { auth: { type: e.auth_type } } : {}),
              })),
          },
        },
      });
      const r = res.data?.agent_results?.find((x) => x.agent_type === 'scenario');
      if (r?.success && r.data) {
        updateTask(taskMsgId, 'scenario-generation', { status: 'done', scenarioData: r.data as OrchestratorScenarioData, summary: res.data?.summary });
      } else {
        updateTask(taskMsgId, 'scenario-generation', { status: 'error', errorMessage: r?.error_message ?? res.error_message ?? '생성 중 오류가 발생했습니다.' });
      }
    } catch (e) {
      updateTask(taskMsgId, 'scenario-generation', { status: 'error', errorMessage: e instanceof Error ? e.message : '알 수 없는 오류' });
    } finally { setIsProcessing(false); }
  };

  const handleBothFormSubmit = async (formData: BothFormData, formMsgId: string) => {
    const projectId = formData.project_id || await resolveCurrentProjectId();
    const taskMsgId = replaceFormWithTasks(formMsgId,
      `동시 실행: 로그 분석 [${formData.service_name}] + 테스트 케이스 [${formData.method} ${formData.path}]`,
      [{ type: 'log-analysis', status: 'running' }, { type: 'test-generation', status: 'running' }]);

    const runLog = flowOpsApi.dispatchOrchestrator({
      project_id: projectId,
      user_prompt: formData.log_user_prompt,
      context: { service_name: formData.service_name, occurred_at: new Date(formData.occurred_at).toISOString(), raw_log: formData.raw_log },
    }).then((res) => {
      const r = res.data?.agent_results?.find((x) => x.agent_type === 'incident');
      if (r?.success && r.data) updateTask(taskMsgId, 'log-analysis', { status: 'done', incidentData: r.data as IncidentAgentData, summary: res.data?.summary });
      else updateTask(taskMsgId, 'log-analysis', { status: 'error', errorMessage: r?.error_message ?? '오류' });
    }).catch((e: unknown) => updateTask(taskMsgId, 'log-analysis', { status: 'error', errorMessage: e instanceof Error ? e.message : '오류' }));

    const runTest = flowOpsApi.dispatchOrchestratorTest({
      project_id: projectId,
      user_prompt: formData.test_user_prompt,
      context: {
        base_url: formData.base_url, env_name: formData.env_name,
        api_inventory: {
          project_id: projectId,
          endpoints: [{ endpoint_id: `${formData.method}:${formData.path}`, path: formData.path, method: formData.method, ...(formData.summary ? { summary: formData.summary } : {}), auth: { type: 'bearer' } }],
        },
      },
    }).then((res) => {
      const r = res.data?.agent_results?.find((x) => isTestCaseAgentType(x.agent_type));
      if (r?.success && r.data) {
        void hydrateTestCaseData(r.data as OrchestratorTestCaseData).then((testData) =>
          updateTask(taskMsgId, 'test-generation', { status: 'done', testData, summary: res.data?.summary }),
        );
      }
      else updateTask(taskMsgId, 'test-generation', { status: 'error', errorMessage: r?.error_message ?? '오류' });
    }).catch((e: unknown) => updateTask(taskMsgId, 'test-generation', { status: 'error', errorMessage: e instanceof Error ? e.message : '오류' }));

    await Promise.all([runLog, runTest]);
    setIsProcessing(false);
  };

  const handleActionClick = (mode: 'log-analysis' | 'test-generation' | 'scenario' | 'both') => {
    if (isProcessing || hasActiveForm) return;
    const formId = `form-${Date.now()}`;
    const content = mode === 'log-analysis' ? '분석할 로그 정보를 입력해 주세요.'
      : mode === 'test-generation' ? '테스트 케이스를 생성할 API 정보를 입력해 주세요.'
      : mode === 'scenario' ? '시나리오를 생성할 API 엔드포인트 목록을 입력해 주세요.'
      : '로그 분석과 테스트 케이스 생성에 필요한 정보를 입력해 주세요.';
    setMessages((prev) => [...prev, { id: formId, role: 'assistant', content, formType: mode }]);
  };

  const handleCancelForm = (formMsgId: string) =>
    setMessages((prev) => prev.filter((m) => m.id !== formMsgId));

  // 프롬프트를 어떤 판단도 없이 그대로 오케스트레이터에 넘기고, 돌아온 agent 결과를 렌더링한다.
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isProcessing) return;
    const requestAppId = activeApplication.appId;
    setInput('');
    const taskMsgId = `task-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: text },
      { id: taskMsgId, role: 'assistant', content: '오케스트레이터에 요청을 전달합니다...' },
    ]);
    setIsProcessing(true);
    try {
      const projectId = await resolveCurrentProjectId();
      if (activeAppIdRef.current !== requestAppId) return;

      const payload = {
        project_id: projectId,
        user_prompt: text,
        user_intent: text,
        context: {
          user_intent: text,
          api_server_url: getApiServerUrl(),
          base_url: getApiServerUrl(),
          env_name: 'local',
          app_id: requestAppId,
        },
      };

      console.info('[OrchestratorAgent] chat payload', payload);

      const res = await flowOpsApi.chatOrchestrator(payload);
      if (activeAppIdRef.current !== requestAppId) return;
      const results = res.data?.agent_results ?? [];
      const summary = res.data?.summary;
      const tasks: AgentTask[] = await Promise.all(results.map(async (r) => {
        const type: AgentTask['type'] =
          r.agent_type === 'incident' ? 'log-analysis'
            : r.agent_type === 'scenario' ? 'scenario-generation'
              : isTestCaseAgentType(r.agent_type) ? 'test-generation'
              : 'test-generation';
        if (!r.success || !r.data) {
          return { type, status: 'error', errorMessage: r.error_message ?? '에이전트 처리 중 오류가 발생했습니다.' };
        }
        if (type === 'log-analysis') return { type, status: 'done', incidentData: r.data as IncidentAgentData, summary };
        if (type === 'scenario-generation') return { type, status: 'done', scenarioData: r.data as OrchestratorScenarioData, summary };
        const testData = await hydrateTestCaseData(r.data as OrchestratorTestCaseData);
        return { type, status: 'done', testData, summary };
      }));

      if (activeAppIdRef.current !== requestAppId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id !== taskMsgId
            ? m
            : tasks.length > 0
              ? { ...m, content: summary ?? '요청을 처리했습니다.', tasks }
              : { ...m, content: summary ?? res.error_message ?? '결과가 없습니다.' },
        ),
      );
    } catch (e) {
      if (activeAppIdRef.current !== requestAppId) return;
      const message = e instanceof Error ? e.message : '알 수 없는 오류';
      setMessages((prev) =>
        prev.map((m) => (m.id !== taskMsgId ? m : { ...m, content: `오류: ${message}` })),
      );
    } finally {
      if (activeAppIdRef.current === requestAppId) {
        setIsProcessing(false);
      }
    }
  };

  return (
    <>
      {(!isOpen || isMinimized) && (
        <button onClick={() => { setIsOpen(true); setIsMinimized(false); }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center z-50 group"
          title="FlowOps Manager">
          <Sparkles size={24} className="group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#060609] animate-pulse" />
        </button>
      )}

      {isOpen && !isMinimized && (
        <div className="fixed bottom-6 right-6 w-[440px] h-[72vh] min-h-[500px] bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-up">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-none mb-0.5">FlowOps Manager</p>
                <p className="text-blue-200 text-xs">Guides testing and incidents</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsMinimized(true)}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors" title="최소화">
                <Minimize2 size={15} className="text-white" />
              </button>
              <button onClick={() => { setIsOpen(false); setIsMinimized(false); }}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors" title="닫기">
                <X size={15} className="text-white" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[95%] min-w-0 w-full">
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                        <Sparkles size={11} className="text-white" />
                      </div>
                      <span className="text-xs text-gray-400">FlowOps</span>
                    </div>
                  )}
                  <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-tr-sm'
                      : 'bg-[#13131a] border border-[#1f1f28] text-gray-200 rounded-tl-sm'
                  }`}>{msg.content}</div>

                  {msg.formType === 'log-analysis' && (
                    <LogAnalysisFormCard formMsgId={msg.id} onSubmit={handleLogFormSubmit} onCancel={handleCancelForm} />
                  )}
                  {msg.formType === 'test-generation' && (
                    <TestCaseFormCard formMsgId={msg.id} onSubmit={handleTestFormSubmit} onCancel={handleCancelForm} />
                  )}
                  {msg.formType === 'scenario' && (
                    <ScenarioFormCard formMsgId={msg.id} onSubmit={handleScenarioFormSubmit} onCancel={handleCancelForm} />
                  )}
                  {msg.formType === 'both' && (
                    <BothFormCard formMsgId={msg.id} onSubmit={handleBothFormSubmit} onCancel={handleCancelForm} />
                  )}

                  {msg.tasks && msg.tasks.length > 0 && (
                    <div className={`mt-2.5 flex gap-2 ${msg.tasks.length > 1 ? 'flex-row' : 'flex-col'}`}>
                      {msg.tasks.map((task) => <TaskCard key={task.type} task={task} />)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-[#1f1f28] bg-[#0d0d12] px-3 pt-2.5 pb-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsActionsCollapsed((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-gray-300 transition-colors mb-2"
            >
              <span>액션 선택</span>
              {isActionsCollapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {!isActionsCollapsed && (
              <div className="grid grid-cols-2 gap-2">
                <ActionButton icon={<FileSearch size={13} />} label="로그 분석"
                  colorClass="text-blue-300 border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-200"
                  onClick={() => handleActionClick('log-analysis')} disabled={isProcessing || hasActiveForm} />
                <ActionButton icon={<TestTube2 size={13} />} label="테스트 생성"
                  colorClass="text-blue-300 border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-200"
                  onClick={() => handleActionClick('test-generation')} disabled={isProcessing || hasActiveForm} />
                <ActionButton icon={<GitBranch size={13} />} label="시나리오 생성"
                  colorClass="text-blue-300 border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-200"
                  onClick={() => handleActionClick('scenario')} disabled={isProcessing || hasActiveForm} />
                <ActionButton icon={<Zap size={13} />} label="동시 실행"
                  colorClass="text-blue-300 border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-200"
                  onClick={() => handleActionClick('both')} disabled={isProcessing || hasActiveForm} />
              </div>
            )}
          </div>

          <div className="border-t border-[#1f1f28] bg-[#0d0d12] px-3 pb-3 pt-2 shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
              <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="직접 입력하세요..." disabled={isProcessing}
                className="flex-1 bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/40 disabled:opacity-50 transition-colors" />
              <button type="submit" disabled={!input.trim() || isProcessing}
                className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors shrink-0">
                <Send size={15} />
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-1.5">Enter로 전송</p>
          </div>
        </div>
      )}

    </>
  );
}
