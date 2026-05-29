import { useState, useRef, useEffect } from 'react';
import {
  Bot,
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
} from 'lucide-react';
import {
  flowOpsApi,
  type IncidentAgentData,
  type RootCause,
  type OrchestratorTestCaseData,
  type OrchestratorTestCaseDraft,
} from '../api/flowOpsClient';

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStatus = 'running' | 'done' | 'error';

interface AgentTask {
  type: 'log-analysis' | 'test-generation';
  status: AgentStatus;
  incidentData?: IncidentAgentData;
  testData?: OrchestratorTestCaseData;
  summary?: string;
  errorMessage?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tasks?: AgentTask[];
  formType?: 'log-analysis' | 'test-generation' | 'both';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  label,
  type,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type: string;
  placeholder?: string;
  value: string;
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
  formMsgId,
  onSubmit,
  onCancel,
}: {
  formMsgId: string;
  onSubmit: (data: LogFormData, msgId: string) => void;
  onCancel: (msgId: string) => void;
}) {
  const [form, setForm] = useState<LogFormData>({
    project_id: '',
    user_prompt: '',
    service_name: '',
    occurred_at: localNow(),
    raw_log: '',
  });

  const set =
    (key: keyof LogFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const canSubmit = form.user_prompt.trim() && form.service_name.trim() && form.raw_log.trim();

  return (
    <div className="mt-2 bg-[#13131a] border border-violet-500/20 rounded-xl p-3.5 space-y-2.5">
      <p className="text-xs font-semibold text-violet-300 uppercase tracking-wider">로그 분석 정보 입력</p>
      <FormField
        label="서비스 이름 *"
        type="text"
        placeholder="예: auth-service"
        value={form.service_name}
        onChange={set('service_name')}
      />
      <FormField
        label="분석 요청 *"
        type="text"
        placeholder="예: 로그인 실패 원인을 분석해줘"
        value={form.user_prompt}
        onChange={set('user_prompt')}
      />
      <FormField label="발생 시각" type="datetime-local" value={form.occurred_at} onChange={set('occurred_at')} />
      <div>
        <label className="block text-xs text-gray-400 mb-1">로그 원문 *</label>
        <textarea
          value={form.raw_log}
          onChange={set('raw_log')}
          placeholder="ERROR: Connection timeout at line 42..."
          rows={4}
          className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 resize-none font-mono"
        />
      </div>
      <FormField
        label="프로젝트 ID (선택)"
        type="text"
        placeholder="예: my-project"
        value={form.project_id}
        onChange={set('project_id')}
      />
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => canSubmit && onSubmit(form, formMsgId)}
          disabled={!canSubmit}
          className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2 text-xs font-semibold transition-colors"
        >
          분석 시작
        </button>
        <button
          onClick={() => onCancel(formMsgId)}
          className="px-4 bg-[#1f1f28] hover:bg-[#2a2a35] text-gray-300 rounded-lg py-2 text-xs transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
}

// ─── Test Case Form ───────────────────────────────────────────────────────────

function TestCaseFormCard({
  formMsgId,
  onSubmit,
  onCancel,
}: {
  formMsgId: string;
  onSubmit: (data: TestFormData, msgId: string) => void;
  onCancel: (msgId: string) => void;
}) {
  const [form, setForm] = useState<TestFormData>({
    project_id: '',
    user_prompt: '',
    base_url: 'https://',
    env_name: 'staging',
    method: 'POST',
    path: '',
    summary: '',
    auth_type: 'bearer',
    request_body_schema: '',
    response_schema: '',
  });

  const set =
    (key: keyof TestFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const canSubmit = form.user_prompt.trim() && form.base_url.trim() && form.env_name.trim() && form.path.trim();

  return (
    <div className="mt-2 bg-[#13131a] border border-indigo-500/20 rounded-xl p-3.5 space-y-2.5">
      <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">테스트 케이스 생성 정보 입력</p>
      <FormField
        label="생성 요청 *"
        type="text"
        placeholder="예: 주문 API에 대한 테스트 케이스 만들어줘"
        value={form.user_prompt}
        onChange={set('user_prompt')}
      />
      <FormField
        label="Base URL *"
        type="text"
        placeholder="https://api.example.com"
        value={form.base_url}
        onChange={set('base_url')}
      />
      <FormField
        label="환경 이름 *"
        type="text"
        placeholder="예: staging"
        value={form.env_name}
        onChange={set('env_name')}
      />
      <div className="border border-[#2a2a35] rounded-lg p-2.5 space-y-2">
        <p className="text-xs text-gray-400 font-medium">엔드포인트</p>
        <div className="flex gap-2">
          <div className="w-24 shrink-0">
            <label className="block text-xs text-gray-400 mb-1">메서드</label>
            <select
              value={form.method}
              onChange={set('method')}
              className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
            >
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <FormField label="경로 *" type="text" placeholder="/api/v1/orders" value={form.path} onChange={set('path')} />
          </div>
        </div>
        <FormField
          label="요약 (선택)"
          type="text"
          placeholder="예: 주문 생성"
          value={form.summary}
          onChange={set('summary')}
        />
        <div>
          <label className="block text-xs text-gray-400 mb-1">인증 타입</label>
          <select
            value={form.auth_type}
            onChange={set('auth_type')}
            className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
          >
            {['bearer', 'basic', 'api_key', 'none'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">요청 바디 스키마 (선택, JSON)</label>
          <textarea
            value={form.request_body_schema}
            onChange={set('request_body_schema')}
            placeholder='{"type":"object","properties":{...}}'
            rows={3}
            className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 resize-none font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">응답 스키마 (선택, JSON)</label>
          <textarea
            value={form.response_schema}
            onChange={set('response_schema')}
            placeholder='{"type":"object","properties":{...}}'
            rows={2}
            className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 resize-none font-mono"
          />
        </div>
      </div>
      <FormField
        label="프로젝트 ID (선택)"
        type="text"
        placeholder="예: my-project"
        value={form.project_id}
        onChange={set('project_id')}
      />
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => canSubmit && onSubmit(form, formMsgId)}
          disabled={!canSubmit}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2 text-xs font-semibold transition-colors"
        >
          생성 시작
        </button>
        <button
          onClick={() => onCancel(formMsgId)}
          className="px-4 bg-[#1f1f28] hover:bg-[#2a2a35] text-gray-300 rounded-lg py-2 text-xs transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
}

// ─── Combined Form (동시 실행) ─────────────────────────────────────────────────

function BothFormCard({
  formMsgId,
  onSubmit,
  onCancel,
}: {
  formMsgId: string;
  onSubmit: (data: BothFormData, msgId: string) => void;
  onCancel: (msgId: string) => void;
}) {
  const [form, setForm] = useState<BothFormData>({
    project_id: '',
    log_user_prompt: '',
    service_name: '',
    occurred_at: localNow(),
    raw_log: '',
    test_user_prompt: '',
    base_url: 'https://',
    env_name: 'staging',
    method: 'POST',
    path: '',
    summary: '',
  });

  const set =
    (key: keyof BothFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const canSubmit =
    form.log_user_prompt.trim() &&
    form.service_name.trim() &&
    form.raw_log.trim() &&
    form.test_user_prompt.trim() &&
    form.base_url.trim() &&
    form.path.trim();

  return (
    <div className="mt-2 bg-[#13131a] border border-amber-500/20 rounded-xl p-3.5 space-y-3">
      <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">동시 실행 정보 입력</p>
      <FormField
        label="프로젝트 ID (선택)"
        type="text"
        placeholder="예: my-project"
        value={form.project_id}
        onChange={set('project_id')}
      />

      <div className="border border-violet-500/20 rounded-lg p-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-violet-600 rounded flex items-center justify-center shrink-0">
            <FileSearch size={9} className="text-white" />
          </div>
          <p className="text-xs font-medium text-violet-300">로그 분석 정보</p>
        </div>
        <FormField
          label="서비스 이름 *"
          type="text"
          placeholder="예: auth-service"
          value={form.service_name}
          onChange={set('service_name')}
        />
        <FormField
          label="분석 요청 *"
          type="text"
          placeholder="예: 로그인 실패 원인을 분석해줘"
          value={form.log_user_prompt}
          onChange={set('log_user_prompt')}
        />
        <FormField label="발생 시각" type="datetime-local" value={form.occurred_at} onChange={set('occurred_at')} />
        <div>
          <label className="block text-xs text-gray-400 mb-1">로그 원문 *</label>
          <textarea
            value={form.raw_log}
            onChange={set('raw_log')}
            placeholder="ERROR: Connection timeout..."
            rows={3}
            className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 resize-none font-mono"
          />
        </div>
      </div>

      <div className="border border-indigo-500/20 rounded-lg p-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-indigo-600 rounded flex items-center justify-center shrink-0">
            <TestTube2 size={9} className="text-white" />
          </div>
          <p className="text-xs font-medium text-indigo-300">테스트 케이스 생성 정보</p>
        </div>
        <FormField
          label="생성 요청 *"
          type="text"
          placeholder="예: 주문 API 테스트 케이스 만들어줘"
          value={form.test_user_prompt}
          onChange={set('test_user_prompt')}
        />
        <FormField
          label="Base URL *"
          type="text"
          placeholder="https://api.example.com"
          value={form.base_url}
          onChange={set('base_url')}
        />
        <FormField
          label="환경 이름 *"
          type="text"
          placeholder="예: staging"
          value={form.env_name}
          onChange={set('env_name')}
        />
        <div className="flex gap-2">
          <div className="w-24 shrink-0">
            <label className="block text-xs text-gray-400 mb-1">메서드</label>
            <select
              value={form.method}
              onChange={set('method')}
              className="w-full bg-[#0d0d12] border border-[#2a2a35] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
            >
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <FormField label="경로 *" type="text" placeholder="/api/v1/orders" value={form.path} onChange={set('path')} />
          </div>
        </div>
        <FormField
          label="요약 (선택)"
          type="text"
          placeholder="엔드포인트 설명"
          value={form.summary}
          onChange={set('summary')}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => canSubmit && onSubmit(form, formMsgId)}
          disabled={!canSubmit}
          className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2 text-xs font-semibold transition-all"
        >
          동시 실행 시작
        </button>
        <button
          onClick={() => onCancel(formMsgId)}
          className="px-4 bg-[#1f1f28] hover:bg-[#2a2a35] text-gray-300 rounded-lg py-2 text-xs transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
}

// ─── Incident Result View ─────────────────────────────────────────────────────

function TabBtn({
  active,
  onClick,
  activeClass,
  children,
}: {
  active: boolean;
  onClick: () => void;
  activeClass: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
        active ? activeClass : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function RootCauseCard({ cause }: { cause: RootCause }) {
  const [expanded, setExpanded] = useState(false);

  const severityStyle =
    cause.severity === 'HIGH'
      ? 'bg-red-500/20 text-red-400 border-red-500/30'
      : cause.severity === 'MEDIUM'
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        : 'bg-green-500/20 text-green-400 border-green-500/30';

  return (
    <div className="bg-[#0d0d12] border border-[#2a2a35] rounded-lg p-3">
      <div className="flex items-start gap-2 mb-2">
        <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${severityStyle}`}>
          {cause.severity}
        </span>
        <p className="text-xs text-gray-200 leading-relaxed">{cause.summary}</p>
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
      >
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

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1 bg-[#0d0d12] rounded-lg p-1">
        <TabBtn
          active={tab === 'causes'}
          onClick={() => setTab('causes')}
          activeClass="bg-violet-600/80 text-white"
        >
          원인 분석 ({data.root_causes.length})
        </TabBtn>
        <TabBtn
          active={tab === 'internal'}
          onClick={() => setTab('internal')}
          activeClass="bg-blue-600/80 text-white"
        >
          내부 보고서
        </TabBtn>
        <TabBtn
          active={tab === 'external'}
          onClick={() => setTab('external')}
          activeClass="bg-emerald-600/80 text-white"
        >
          외부 공지
        </TabBtn>
      </div>

      {tab === 'causes' && (
        <div className="space-y-2">
          {data.root_causes.map((cause, i) => (
            <RootCauseCard key={i} cause={cause} />
          ))}
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

function TestCaseDraftCard({ draft, index }: { draft: OrchestratorTestCaseDraft; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const typeStyle = DRAFT_TYPE_STYLE[draft.type] ?? 'bg-gray-500/20 text-gray-400';
  const caseStyle = CASE_TYPE_STYLE[draft.test_case_type] ?? 'bg-gray-500/10 text-gray-500';

  return (
    <div
      className={`bg-[#0d0d12] border rounded-lg p-2.5 ${
        draft.duplicate ? 'border-amber-500/20 opacity-60' : 'border-[#2a2a35]'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="text-[10px] text-gray-600 shrink-0 mt-0.5 font-mono">
          TC-{String(index + 1).padStart(3, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-200 leading-snug">{draft.title}</p>
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${typeStyle}`}>{draft.type}</span>
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${caseStyle}`}>{draft.test_case_type}</span>
            <span className="text-[9px] text-gray-500 bg-[#1f1f28] px-1.5 py-0.5 rounded">
              {draft.expectedSpec.statusCode}
            </span>
            {draft.duplicate && (
              <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">중복</span>
            )}
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="shrink-0 text-gray-500 hover:text-gray-300">
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-[#2a2a35] space-y-2 text-xs">
          <p className="text-gray-400 leading-relaxed">{draft.description}</p>
          {draft.requestSpec.body !== null && draft.requestSpec.body !== undefined && (
            <div>
              <p className="text-[10px] text-gray-500 mb-1">요청 바디</p>
              <pre className="bg-[#060609] rounded p-2 text-[10px] text-gray-300 overflow-x-auto font-mono whitespace-pre-wrap">
                {JSON.stringify(draft.requestSpec.body, null, 2)}
              </pre>
            </div>
          )}
          {draft.assertionSpec.bodyContains.length > 0 && (
            <p className="text-[10px] text-gray-500">
              검증: {draft.assertionSpec.bodyContains.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function TestCaseResultView({ data }: { data: OrchestratorTestCaseData }) {
  const unique = data.drafts.filter((d) => !d.duplicate).length;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>{data.drafts.length}개 생성</span>
        {data.drafts.some((d) => d.duplicate) && (
          <span className="text-amber-400">({data.drafts.length - unique}개 중복)</span>
        )}
      </div>
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
        {data.drafts.map((draft, i) => (
          <TestCaseDraftCard key={i} draft={draft} index={i} />
        ))}
      </div>
    </div>
  );
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: AgentTask }) {
  const isLog = task.type === 'log-analysis';
  const isRunning = task.status === 'running';
  const isDone = task.status === 'done';
  const isError = task.status === 'error';

  const borderCls = isError
    ? 'border-red-500/30 bg-red-500/5'
    : isDone && isLog
      ? 'border-violet-500/30 bg-violet-500/5'
      : isDone
        ? 'border-indigo-500/30 bg-indigo-500/5'
        : isLog
          ? 'border-violet-500/20 bg-violet-500/5'
          : 'border-indigo-500/20 bg-indigo-500/5';

  return (
    <div className={`flex-1 min-w-0 rounded-xl border p-3 ${borderCls}`}>
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
            isLog ? 'bg-violet-600' : 'bg-indigo-600'
          }`}
        >
          {isLog ? <FileSearch size={11} className="text-white" /> : <TestTube2 size={11} className="text-white" />}
        </div>
        <span className="text-xs font-medium text-gray-300 truncate">
          {isLog ? 'Log Analysis Agent' : 'Test Case Agent'}
        </span>
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
            {[0, 150, 300].map((delay, i) => (
              <span
                key={i}
                className="w-1 h-1 bg-gray-500 rounded-full inline-block animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </span>
        </div>
      )}

      {isDone && isLog && task.incidentData && <IncidentResultView data={task.incidentData} />}
      {isDone && !isLog && task.testData && <TestCaseResultView data={task.testData} />}
      {isError && <p className="text-xs text-red-400">{task.errorMessage ?? '에이전트 오류가 발생했습니다.'}</p>}
    </div>
  );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

function ActionButton({
  icon,
  label,
  colorClass,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 flex items-center justify-center gap-1.5 border rounded-lg py-1.5 px-2 text-xs font-medium transition-all bg-[#13131a] disabled:opacity-40 disabled:cursor-not-allowed ${colorClass}`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const INIT_MESSAGE: Message = {
  id: 'init',
  role: 'assistant',
  content:
    '👋 안녕하세요! 저는 Orchestrator Agent입니다.\n\n여러 AI 에이전트를 조율하여 아래 세 가지 작업을 수행할 수 있습니다:\n\n• 🔍 로그 분석 — 에러 패턴 감지 및 원인 분석\n• 🧪 테스트 케이스 생성 — API 엔드포인트 테스트 자동 생성\n• ⚡ 동시 실행 — 두 작업을 병렬로 처리\n\n아래 버튼을 선택해 주세요.',
};

export function OrchestratorAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INIT_MESSAGE]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, isMinimized]);

  const hasActiveForm = messages.some((m) => m.formType !== undefined);

  const updateTask = (msgId: string, type: AgentTask['type'], updates: Partial<AgentTask>) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id !== msgId
          ? m
          : { ...m, tasks: m.tasks?.map((t) => (t.type === type ? { ...t, ...updates } : t)) },
      ),
    );
  };

  const replaceFormWithTasks = (formMsgId: string, userContent: string, tasks: AgentTask[]): string => {
    const taskMsgId = `task-${Date.now()}`;
    const routingText =
      tasks.length > 1
        ? '병렬 실행을 시작합니다 — 두 에이전트를 동시에 가동합니다...'
        : tasks[0].type === 'log-analysis'
          ? 'Log Analysis Agent로 요청을 라우팅합니다...'
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
    const userContent = `로그 분석 요청: [${formData.service_name}] ${formData.user_prompt}`;
    const taskMsgId = replaceFormWithTasks(formMsgId, userContent, [{ type: 'log-analysis', status: 'running' }]);

    try {
      const response = await flowOpsApi.dispatchOrchestrator({
        project_id: formData.project_id || 'default',
        user_prompt: formData.user_prompt,
        context: {
          service_name: formData.service_name,
          occurred_at: new Date(formData.occurred_at).toISOString(),
          raw_log: formData.raw_log,
        },
      });
      const result = response.data.agent_results.find((r) => r.agent_type === 'incident');
      if (result?.success && result.data) {
        updateTask(taskMsgId, 'log-analysis', {
          status: 'done',
          incidentData: result.data as IncidentAgentData,
          summary: response.data.summary,
        });
      } else {
        updateTask(taskMsgId, 'log-analysis', {
          status: 'error',
          errorMessage: result?.error_message ?? '분석 중 오류가 발생했습니다.',
        });
      }
    } catch (e) {
      updateTask(taskMsgId, 'log-analysis', {
        status: 'error',
        errorMessage: e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestFormSubmit = async (formData: TestFormData, formMsgId: string) => {
    const endpointId = `${formData.method}:${formData.path}`;
    const userContent = `테스트 케이스 생성 요청: [${formData.method} ${formData.path}] ${formData.user_prompt}`;
    const taskMsgId = replaceFormWithTasks(formMsgId, userContent, [{ type: 'test-generation', status: 'running' }]);

    try {
      const response = await flowOpsApi.dispatchOrchestratorTest({
        project_id: formData.project_id || 'default',
        user_prompt: formData.user_prompt,
        context: {
          base_url: formData.base_url,
          env_name: formData.env_name,
          api_inventory: {
            project_id: formData.project_id || 'default',
            endpoints: [
              {
                endpoint_id: endpointId,
                path: formData.path,
                method: formData.method,
                ...(formData.summary ? { summary: formData.summary } : {}),
                ...(formData.auth_type !== 'none' ? { auth: { type: formData.auth_type } } : {}),
                ...(parseJsonSafe(formData.request_body_schema)
                  ? { request_body_schema: parseJsonSafe(formData.request_body_schema) }
                  : {}),
                ...(parseJsonSafe(formData.response_schema)
                  ? { response_schema: parseJsonSafe(formData.response_schema) }
                  : {}),
              },
            ],
          },
        },
      });
      const result = response.data.agent_results.find((r) => r.agent_type === 'testcase');
      if (result?.success && result.data) {
        updateTask(taskMsgId, 'test-generation', {
          status: 'done',
          testData: result.data as OrchestratorTestCaseData,
          summary: response.data.summary,
        });
      } else {
        updateTask(taskMsgId, 'test-generation', {
          status: 'error',
          errorMessage: result?.error_message ?? '생성 중 오류가 발생했습니다.',
        });
      }
    } catch (e) {
      updateTask(taskMsgId, 'test-generation', {
        status: 'error',
        errorMessage: e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBothFormSubmit = async (formData: BothFormData, formMsgId: string) => {
    const userContent = `동시 실행: 로그 분석 [${formData.service_name}] + 테스트 케이스 [${formData.method} ${formData.path}]`;
    const taskMsgId = replaceFormWithTasks(formMsgId, userContent, [
      { type: 'log-analysis', status: 'running' },
      { type: 'test-generation', status: 'running' },
    ]);

    const runLog = flowOpsApi
      .dispatchOrchestrator({
        project_id: formData.project_id || 'default',
        user_prompt: formData.log_user_prompt,
        context: {
          service_name: formData.service_name,
          occurred_at: new Date(formData.occurred_at).toISOString(),
          raw_log: formData.raw_log,
        },
      })
      .then((response) => {
        const result = response.data.agent_results.find((r) => r.agent_type === 'incident');
        if (result?.success && result.data) {
          updateTask(taskMsgId, 'log-analysis', {
            status: 'done',
            incidentData: result.data as IncidentAgentData,
            summary: response.data.summary,
          });
        } else {
          updateTask(taskMsgId, 'log-analysis', {
            status: 'error',
            errorMessage: result?.error_message ?? '분석 중 오류가 발생했습니다.',
          });
        }
      })
      .catch((e: unknown) => {
        updateTask(taskMsgId, 'log-analysis', {
          status: 'error',
          errorMessage: e instanceof Error ? e.message : '오류 발생',
        });
      });

    const runTest = flowOpsApi
      .dispatchOrchestratorTest({
        project_id: formData.project_id || 'default',
        user_prompt: formData.test_user_prompt,
        context: {
          base_url: formData.base_url,
          env_name: formData.env_name,
          api_inventory: {
            project_id: formData.project_id || 'default',
            endpoints: [
              {
                endpoint_id: `${formData.method}:${formData.path}`,
                path: formData.path,
                method: formData.method,
                ...(formData.summary ? { summary: formData.summary } : {}),
                auth: { type: 'bearer' },
              },
            ],
          },
        },
      })
      .then((response) => {
        const result = response.data.agent_results.find((r) => r.agent_type === 'testcase');
        if (result?.success && result.data) {
          updateTask(taskMsgId, 'test-generation', {
            status: 'done',
            testData: result.data as OrchestratorTestCaseData,
            summary: response.data.summary,
          });
        } else {
          updateTask(taskMsgId, 'test-generation', {
            status: 'error',
            errorMessage: result?.error_message ?? '생성 중 오류가 발생했습니다.',
          });
        }
      })
      .catch((e: unknown) => {
        updateTask(taskMsgId, 'test-generation', {
          status: 'error',
          errorMessage: e instanceof Error ? e.message : '오류 발생',
        });
      });

    await Promise.all([runLog, runTest]);
    setIsProcessing(false);
  };

  const handleActionClick = (mode: 'log-analysis' | 'test-generation' | 'both') => {
    if (isProcessing || hasActiveForm) return;
    const formId = `form-${Date.now()}`;
    const content =
      mode === 'log-analysis'
        ? '분석할 로그 정보를 입력해 주세요.'
        : mode === 'test-generation'
          ? '테스트 케이스를 생성할 API 정보를 입력해 주세요.'
          : '로그 분석과 테스트 케이스 생성에 필요한 정보를 입력해 주세요.';
    setMessages((prev) => [...prev, { id: formId, role: 'assistant', content, formType: mode }]);
  };

  const handleCancelForm = (formMsgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== formMsgId));
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isProcessing) return;
    setInput('');
    const lower = text.toLowerCase();
    const wantsLog =
      lower.includes('로그') || lower.includes('분석') || lower.includes('log') || lower.includes('에러');
    const wantsTest =
      lower.includes('테스트') || lower.includes('생성') || lower.includes('test') || lower.includes('케이스');
    if (wantsLog && wantsTest) {
      handleActionClick('both');
    } else if (wantsLog) {
      handleActionClick('log-analysis');
    } else if (wantsTest) {
      handleActionClick('test-generation');
    } else {
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', content: text },
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: '아래 버튼으로 원하는 작업을 선택하거나, "로그 분석", "테스트 생성" 등의 키워드를 포함해 입력해 주세요.',
        },
      ]);
    }
  };

  return (
    <>
      {/* Floating button */}
      {(!isOpen || isMinimized) && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white rounded-full shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300 flex items-center justify-center z-50 group"
          title="Orchestrator Agent"
        >
          <Bot size={24} className="group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#060609] animate-pulse" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-6 right-6 w-[440px] h-[72vh] min-h-[500px] bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-4 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-none mb-0.5">Orchestrator Agent</p>
                <p className="text-violet-200 text-xs">Multi-agent coordinator</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                title="최소화"
              >
                <Minimize2 size={15} className="text-white" />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                title="닫기"
              >
                <X size={15} className="text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[95%] min-w-0 w-full">
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center shrink-0">
                        <Bot size={11} className="text-white" />
                      </div>
                      <span className="text-xs text-gray-400">Orchestrator</span>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white rounded-tr-sm'
                        : 'bg-[#13131a] border border-[#1f1f28] text-gray-200 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {msg.formType === 'log-analysis' && (
                    <LogAnalysisFormCard
                      formMsgId={msg.id}
                      onSubmit={handleLogFormSubmit}
                      onCancel={handleCancelForm}
                    />
                  )}
                  {msg.formType === 'test-generation' && (
                    <TestCaseFormCard
                      formMsgId={msg.id}
                      onSubmit={handleTestFormSubmit}
                      onCancel={handleCancelForm}
                    />
                  )}
                  {msg.formType === 'both' && (
                    <BothFormCard formMsgId={msg.id} onSubmit={handleBothFormSubmit} onCancel={handleCancelForm} />
                  )}

                  {msg.tasks && msg.tasks.length > 0 && (
                    <div className={`mt-2.5 flex gap-2 ${msg.tasks.length > 1 ? 'flex-row' : 'flex-col'}`}>
                      {msg.tasks.map((task) => (
                        <TaskCard key={task.type} task={task} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Action buttons */}
          <div className="border-t border-[#1f1f28] bg-[#0d0d12] px-3 pt-2.5 pb-2 shrink-0">
            <p className="text-xs text-gray-500 mb-2">액션 선택:</p>
            <div className="flex gap-2">
              <ActionButton
                icon={<FileSearch size={13} />}
                label="로그 분석"
                colorClass="text-violet-300 border-violet-500/20 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-200"
                onClick={() => handleActionClick('log-analysis')}
                disabled={isProcessing || hasActiveForm}
              />
              <ActionButton
                icon={<TestTube2 size={13} />}
                label="테스트 생성"
                colorClass="text-indigo-300 border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-200"
                onClick={() => handleActionClick('test-generation')}
                disabled={isProcessing || hasActiveForm}
              />
              <ActionButton
                icon={<Zap size={13} />}
                label="동시 실행"
                colorClass="text-amber-300 border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-200"
                onClick={() => handleActionClick('both')}
                disabled={isProcessing || hasActiveForm}
              />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-[#1f1f28] bg-[#0d0d12] px-3 pb-3 pt-2 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="직접 입력하세요..."
                disabled={isProcessing}
                className="flex-1 bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/40 disabled:opacity-50 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="w-9 h-9 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-1.5">Enter로 전송</p>
          </div>
        </div>
      )}

      {/* Minimized bar */}
      {isOpen && isMinimized && (
        <div className="fixed bottom-6 right-6 bg-[#0a0a0f] border border-[#1f1f28] rounded-xl shadow-xl px-3 py-2.5 z-50 flex items-center gap-3 animate-slide-up">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-full flex items-center justify-center shrink-0">
            <Bot size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium leading-none mb-0.5">Orchestrator Agent</p>
            <p className="text-gray-400 text-xs">Multi-agent coordinator</p>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="w-7 h-7 flex items-center justify-center hover:bg-[#13131a] rounded-lg transition-colors ml-1"
            title="펼치기"
          >
            <ChevronUp size={15} className="text-gray-400" />
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setIsMinimized(false);
            }}
            className="w-7 h-7 flex items-center justify-center hover:bg-[#13131a] rounded-lg transition-colors"
            title="닫기"
          >
            <X size={15} className="text-gray-400" />
          </button>
        </div>
      )}
    </>
  );
}
