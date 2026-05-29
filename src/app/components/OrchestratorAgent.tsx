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
} from 'lucide-react';

type ActionMode = 'log-analysis' | 'test-generation' | 'both';
type AgentStatus = 'running' | 'done' | 'error';

interface AgentTask {
  type: 'log-analysis' | 'test-generation';
  status: AgentStatus;
  result?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tasks?: AgentTask[];
}

const LOG_ANALYSIS_RESULT = `분석 완료 ✅

감지된 패턴:
• 최근 1시간 내 CONN_TIMEOUT 45건 발생
• 14:32 UTC 에러율 급증 (+340% vs 기준선)
• 원인: DB 커넥션 풀 고갈 (pool_size=10)

영향 받은 엔드포인트:
• POST /api/v1/auth/login — 38건 실패
• GET /api/v1/users/:id — 7건 실패

권장 조치:
커넥션 풀 25로 증가 및 타임아웃 미들웨어 추가`;

const TEST_GENERATION_RESULT = `테스트 케이스 생성 완료 ✅

POST /api/v1/auth/login — 8개 케이스:

✅ TC-001: 유효한 자격증명 → 200 OK + token
✅ TC-002: 잘못된 비밀번호 → 401 Unauthorized
✅ TC-003: 존재하지 않는 이메일 → 401 Unauthorized
✅ TC-004: 이메일 필드 누락 → 400 Bad Request
✅ TC-005: 비밀번호 필드 누락 → 400 Bad Request
✅ TC-006: 속도 제한 초과 → 429 Too Many Requests
✅ TC-007: SQL 인젝션 시도 → 400 Bad Request
✅ TC-008: 빈 비밀번호 문자열 → 400 Bad Request`;

export function OrchestratorAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content:
        '👋 안녕하세요! 저는 Orchestrator Agent입니다.\n\n여러 AI 에이전트를 조율하여 아래 세 가지 작업을 수행할 수 있습니다:\n\n• 🔍 로그 분석 — 에러 패턴 감지 및 원인 분석\n• 🧪 테스트 케이스 생성 — API 엔드포인트 테스트 자동 생성\n• ⚡ 동시 실행 — 두 작업을 병렬로 처리\n\n아래 버튼을 선택하거나 원하는 내용을 입력해 주세요.',
    },
  ]);
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

  const updateTask = (
    msgId: string,
    type: 'log-analysis' | 'test-generation',
    status: AgentStatus,
    result?: string,
  ) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id !== msgId
          ? m
          : {
              ...m,
              tasks: m.tasks?.map((t) =>
                t.type === type ? { ...t, status, result } : t,
              ),
            },
      ),
    );
  };

  const executeAction = (mode: ActionMode, userText: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
    };

    const tasks: AgentTask[] = [];
    if (mode === 'log-analysis' || mode === 'both') {
      tasks.push({ type: 'log-analysis', status: 'running' });
    }
    if (mode === 'test-generation' || mode === 'both') {
      tasks.push({ type: 'test-generation', status: 'running' });
    }

    const routingText =
      mode === 'both'
        ? '병렬 실행을 시작합니다 — 두 에이전트를 동시에 가동합니다...'
        : mode === 'log-analysis'
        ? 'Log Analysis Agent로 요청을 라우팅합니다...'
        : 'Test Case Agent로 요청을 라우팅합니다...';

    const msgId = `ai-${Date.now()}`;
    const aiMsg: Message = {
      id: msgId,
      role: 'assistant',
      content: routingText,
      tasks,
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setIsProcessing(true);

    const runLog = () =>
      new Promise<void>((res) =>
        setTimeout(() => {
          updateTask(msgId, 'log-analysis', 'done', LOG_ANALYSIS_RESULT);
          res();
        }, 2000),
      );

    const runTest = () =>
      new Promise<void>((res) =>
        setTimeout(() => {
          updateTask(msgId, 'test-generation', 'done', TEST_GENERATION_RESULT);
          res();
        }, 3200),
      );

    const afterAll = () => setIsProcessing(false);

    if (mode === 'log-analysis') runLog().then(afterAll);
    else if (mode === 'test-generation') runTest().then(afterAll);
    else Promise.all([runLog(), runTest()]).then(afterAll);
  };

  const handleActionClick = (mode: ActionMode) => {
    if (isProcessing) return;
    const labels: Record<ActionMode, string> = {
      'log-analysis': '로그 분석 요청',
      'test-generation': '테스트 케이스 생성 요청',
      both: '로그 분석 + 테스트 케이스 동시 요청',
    };
    executeAction(mode, labels[mode]);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isProcessing) return;
    setInput('');

    const lower = text.toLowerCase();
    const wantsLog =
      lower.includes('log') ||
      lower.includes('로그') ||
      lower.includes('분석') ||
      lower.includes('error') ||
      lower.includes('에러');
    const wantsTest =
      lower.includes('test') ||
      lower.includes('테스트') ||
      lower.includes('생성') ||
      lower.includes('generate') ||
      lower.includes('케이스');

    let mode: ActionMode | null = null;
    if (wantsLog && wantsTest) mode = 'both';
    else if (wantsLog) mode = 'log-analysis';
    else if (wantsTest) mode = 'test-generation';

    if (mode) {
      executeAction(mode, text);
    } else {
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', content: text },
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content:
            '아래 버튼으로 원하는 작업을 선택하거나, "로그 분석", "테스트 생성", "둘 다" 등의 키워드를 포함해 입력해 주세요.',
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
                <p className="text-white font-semibold text-sm leading-none mb-0.5">
                  Orchestrator Agent
                </p>
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
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[92%] min-w-0">
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

                  {/* Task cards */}
                  {msg.tasks && msg.tasks.length > 0 && (
                    <div
                      className={`mt-2.5 flex gap-2 ${
                        msg.tasks.length > 1 ? 'flex-row' : 'flex-col'
                      }`}
                    >
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
                disabled={isProcessing}
              />
              <ActionButton
                icon={<TestTube2 size={13} />}
                label="테스트 생성"
                colorClass="text-indigo-300 border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-200"
                onClick={() => handleActionClick('test-generation')}
                disabled={isProcessing}
              />
              <ActionButton
                icon={<Zap size={13} />}
                label="동시 실행"
                colorClass="text-amber-300 border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-200"
                onClick={() => handleActionClick('both')}
                disabled={isProcessing}
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
            <p className="text-white text-sm font-medium leading-none mb-0.5">
              Orchestrator Agent
            </p>
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

function TaskCard({ task }: { task: AgentTask }) {
  const isLog = task.type === 'log-analysis';
  const isRunning = task.status === 'running';
  const isDone = task.status === 'done';
  const isError = task.status === 'error';

  const borderCls =
    isError
      ? 'border-red-500/30 bg-red-500/5'
      : isDone && isLog
      ? 'border-violet-500/30 bg-violet-500/5'
      : isDone
      ? 'border-indigo-500/30 bg-indigo-500/5'
      : isLog
      ? 'border-violet-500/20 bg-violet-500/5'
      : 'border-indigo-500/20 bg-indigo-500/5';

  return (
    <div className={`flex-1 min-w-0 rounded-xl border p-3 transition-colors ${borderCls}`}>
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
            isLog ? 'bg-violet-600' : 'bg-indigo-600'
          }`}
        >
          {isLog ? (
            <FileSearch size={11} className="text-white" />
          ) : (
            <TestTube2 size={11} className="text-white" />
          )}
        </div>
        <span className="text-xs font-medium text-gray-300 truncate">
          {isLog ? 'Log Analysis Agent' : 'Test Case Agent'}
        </span>
        <div className="ml-auto shrink-0">
          {isRunning && (
            <Loader2 size={13} className="text-violet-400 animate-spin" />
          )}
          {isDone && <CheckCircle2 size={13} className="text-green-400" />}
          {isError && <AlertCircle size={13} className="text-red-400" />}
        </div>
      </div>

      <div className="text-xs">
        {isRunning && (
          <div className="flex items-center gap-1.5 text-gray-500">
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
        {isDone && task.result && (
          <div className="text-gray-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
            {task.result}
          </div>
        )}
        {isError && (
          <span className="text-red-400">에이전트 오류가 발생했습니다.</span>
        )}
      </div>
    </div>
  );
}

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
