import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { 
  Sparkles,
  X,
  Minimize2,
  Send,
  Wand2,
  AlertCircle,
  Lightbulb,
  Code,
  Activity,
  FileSearch,
  CheckCircle2,
  Layers,
  Loader2
} from 'lucide-react';
import {
  flowOpsApi,
  rememberAppId,
  rememberAppTitle,
  type AiOrchestratorFormField,
  type AiOrchestratorResult,
} from '../api/flowOpsClient';
import { useTestContext } from '../contexts/TestContext';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface ActiveForm {
  type: string;
  fields: AiOrchestratorFormField[];
  values: Record<string, string | boolean>;
}

interface PendingConfirmation {
  result: AiOrchestratorResult;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}

interface PageContext {
  page: string;
  title: string;
  quickActions: QuickAction[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const getPageContext = (pathname: string): PageContext => {
  if (pathname.includes('/qc/api')) {
    return {
      page: 'API Management',
      title: 'API: POST /api/v1/auth/login',
      quickActions: [
        { id: 'generate-tests', label: 'Generate test cases', icon: <Wand2 size={14} /> },
        { id: 'edge-cases', label: 'Suggest edge cases', icon: <Lightbulb size={14} /> },
        { id: 'security-check', label: 'Security best practices', icon: <AlertCircle size={14} /> },
      ],
    };
  } else if (pathname.includes('/qc/testcase')) {
    return {
      page: 'Test Case Generation',
      title: 'Test Cases for Login API',
      quickActions: [
        { id: 'improve-tests', label: 'Improve this test case', icon: <Wand2 size={14} /> },
        { id: 'negative-cases', label: 'Add negative cases', icon: <AlertCircle size={14} /> },
        { id: 'assertion-help', label: 'Help with assertions', icon: <CheckCircle2 size={14} /> },
      ],
    };
  } else if (pathname.includes('/qc/scenario')) {
    return {
      page: 'Scenario Builder',
      title: 'Scenario: User Authentication Flow',
      quickActions: [
        { id: 'suggest-next', label: 'Suggest next step', icon: <Lightbulb size={14} /> },
        { id: 'check-vars', label: 'Check missing variables', icon: <Code size={14} /> },
        { id: 'optimize-flow', label: 'Optimize flow', icon: <Layers size={14} /> },
      ],
    };
  } else if (pathname.includes('/execution/history')) {
    return {
      page: 'Execution History',
      title: 'Recent Executions',
      quickActions: [
        { id: 'explain-failure', label: 'Why did this fail?', icon: <AlertCircle size={14} /> },
        { id: 'explain-assertion', label: 'Explain broken assertion', icon: <Code size={14} /> },
        { id: 'fix-suggestion', label: 'Suggest fix', icon: <Wand2 size={14} /> },
      ],
    };
  } else if (pathname.includes('/reports/logs')) {
    return {
      page: 'Logs',
      title: 'Execution Logs',
      quickActions: [
        { id: 'recurring-errors', label: 'Find recurring errors', icon: <FileSearch size={14} /> },
        { id: 'summarize-failures', label: 'Summarize failures', icon: <Activity size={14} /> },
        { id: 'pattern-analysis', label: 'Analyze patterns', icon: <Lightbulb size={14} /> },
      ],
    };
  } else if (pathname.includes('/execution/run')) {
    return {
      page: 'Test Execution',
      title: 'Running Tests',
      quickActions: [
        { id: 'monitor-help', label: 'Monitor live results', icon: <Activity size={14} /> },
        { id: 'quick-debug', label: 'Quick debug tips', icon: <Wand2 size={14} /> },
        { id: 'performance-tips', label: 'Performance tips', icon: <Lightbulb size={14} /> },
      ],
    };
  } else if (pathname.includes('/app/registration')) {
    return {
      page: 'App Registration',
      title: 'Application Setup',
      quickActions: [
        { id: 'github-help', label: 'GitHub integration help', icon: <Code size={14} /> },
        { id: 'best-practices', label: 'Setup best practices', icon: <Lightbulb size={14} /> },
        { id: 'config-help', label: 'Config guidance', icon: <Wand2 size={14} /> },
      ],
    };
  } else if (pathname.includes('/app/environment')) {
    return {
      page: 'Environment Settings',
      title: 'Environment Configuration',
      quickActions: [
        { id: 'env-optimize', label: 'Optimize env setup', icon: <Wand2 size={14} /> },
        { id: 'env-security', label: 'Security checks', icon: <AlertCircle size={14} /> },
        { id: 'env-best-practices', label: 'Best practices', icon: <Lightbulb size={14} /> },
      ],
    };
  } else if (pathname.includes('/reports/summary')) {
    return {
      page: 'Reports Dashboard',
      title: 'Analytics Overview',
      quickActions: [
        { id: 'insights', label: 'Generate insights', icon: <Lightbulb size={14} /> },
        { id: 'trends', label: 'Analyze trends', icon: <Activity size={14} /> },
        { id: 'recommendations', label: 'Recommendations', icon: <Wand2 size={14} /> },
      ],
    };
  } else if (pathname.includes('/devops/incidents')) {
    return {
      page: 'Incident Dashboard',
      title: 'DevOps Monitoring',
      quickActions: [
        { id: 'incident-summary', label: 'Summarize incidents', icon: <Activity size={14} /> },
        { id: 'root-cause', label: 'Find root causes', icon: <FileSearch size={14} /> },
        { id: 'mitigation-steps', label: 'Suggest mitigation', icon: <Wand2 size={14} /> },
      ],
    };
  } else if (pathname.includes('/devops/analysis')) {
    return {
      page: 'Error Analysis',
      title: 'AI-Powered RCA',
      quickActions: [
        { id: 'analyze-logs', label: 'Analyze log patterns', icon: <FileSearch size={14} /> },
        { id: 'find-similar', label: 'Find similar incidents', icon: <Layers size={14} /> },
        { id: 'impact-assessment', label: 'Impact assessment', icon: <AlertCircle size={14} /> },
      ],
    };
  } else if (pathname.includes('/devops/response')) {
    return {
      page: 'Response Assistant',
      title: 'Incident Communication',
      quickActions: [
        { id: 'improve-message', label: 'Improve messaging', icon: <Wand2 size={14} /> },
        { id: 'translate-technical', label: 'Simplify technical terms', icon: <Lightbulb size={14} /> },
        { id: 'escalation-guide', label: 'Escalation guidance', icon: <AlertCircle size={14} /> },
      ],
    };
  } else if (pathname.includes('/devops/timeline')) {
    return {
      page: 'Timeline',
      title: 'Incident Timeline',
      quickActions: [
        { id: 'timeline-insights', label: 'Timeline insights', icon: <Activity size={14} /> },
        { id: 'lessons-learned', label: 'Lessons learned', icon: <Lightbulb size={14} /> },
        { id: 'postmortem-template', label: 'Generate postmortem', icon: <Wand2 size={14} /> },
      ],
    };
  }

  return {
    page: 'Dashboard',
    title: 'FlowOps',
    quickActions: [
      { id: 'getting-started', label: 'Getting started', icon: <Lightbulb size={14} /> },
      { id: 'best-practices', label: 'Best practices', icon: <CheckCircle2 size={14} /> },
      { id: 'help', label: 'Help & tips', icon: <Wand2 size={14} /> },
    ],
  };
};

const mockAIResponses: Record<string, string> = {
  'generate-tests': 'I\'ll help you generate comprehensive test cases for this API. Based on the endpoint POST /api/v1/auth/login, I suggest:\n\n✅ Success Cases:\n• Valid credentials\n• Email case insensitivity\n\n❌ Validation Cases:\n• Missing email field\n• Missing password field\n• Invalid email format\n• Empty password\n\n🔒 Security Cases:\n• SQL injection attempts\n• XSS in email field\n• Rate limiting check\n\nWould you like me to generate these test cases now?',
  'edge-cases': 'Here are important edge cases to test:\n\n🔍 Input Variations:\n• Very long email (>255 chars)\n• Special characters in password\n• Unicode characters\n• Leading/trailing whitespace\n\n⚡ Boundary Conditions:\n• Minimum password length\n• Maximum password length\n• Concurrent login attempts\n\n🛡️ Security Edge Cases:\n• Already logged in user\n• Expired session token reuse\n• Case sensitivity checks',
  'improve-tests': 'I can help improve your test case! Here are some suggestions:\n\n📊 Add More Assertions:\n• Verify response time < 500ms\n• Check token expiry field exists\n• Validate user object structure\n\n🔧 Enhance Request:\n• Add unique request IDs\n• Include timestamp headers\n\n✨ Better Naming:\nRename "Test 1" → "Login_ValidCredentials_Returns200WithToken"',
  'negative-cases': 'Let\'s add comprehensive negative test cases:\n\n❌ Authentication Failures:\n• Wrong password\n• Non-existent email\n• Disabled account\n• Unverified email\n\n⚠️ Validation Errors:\n• Malformed JSON\n• Missing Content-Type header\n• NULL values\n\n🚫 Rate Limiting:\n• Exceeded login attempts\n• IP-based throttling',
  'suggest-next': 'Based on your current scenario flow, I suggest these next steps:\n\n1️⃣ Add Error Handling:\n• Test what happens if login fails\n• Add retry logic\n\n2️⃣ Extend User Journey:\n• Fetch user profile after login\n• Update user settings\n• Test logout flow\n\n3️⃣ Add Validation:\n• Verify token is used in subsequent requests\n• Check token refresh mechanism',
  'check-vars': 'I found these potential variable issues:\n\n⚠️ Missing Variables:\n• {{userId}} - referenced but not extracted from login response\n• {{authToken}} - used in step 3 but not set\n\n✅ Properly Set:\n• {{baseUrl}}\n• {{email}}\n\n💡 Suggestion:\nAdd extraction in "Login" step:\n```json\n"extract": {\n  "userId": "data.user.id",\n  "authToken": "data.token"\n}\n```',
  'explain-failure': 'Let me analyze this failure:\n\n🔴 Root Cause:\nExpected status 400 (validation error) but received 500 (server error)\n\n📊 Analysis:\n• The API should return 400 for missing email field\n• Instead, server crashed with 500\n• This indicates the API lacks proper input validation\n\n🔧 Recommendations:\n1. File a bug report - API should validate before processing\n2. Update test to expect 500 temporarily\n3. Add retry logic for 5xx errors\n\n💡 This is a real API bug, not a test issue!',
  'explain-assertion': 'Breaking down the failed assertion:\n\n❌ Failed Assertion:\n```\nField: error.code\nExpected: "MISSING_FIELD"\nActual: "INTERNAL_ERROR"\n```\n\n🔍 What This Means:\n• Your test expected a validation error\n• But the API returned a server error instead\n• The API didn\'t validate input before processing\n\n🎯 Action Items:\n• This is likely an API bug\n• Backend needs to add validation middleware\n• Your test caught a real issue!',
  'recurring-errors': 'I found these recurring patterns in your logs:\n\n🔴 Most Common Failures (Last 24h):\n1. Status 500 on /api/v1/auth/login - 12 occurrences\n   → Missing input validation\n\n2. Timeout on /api/v1/posts - 8 occurrences\n   → Slow database queries\n\n3. Status 401 on /api/v1/users/:id - 5 occurrences\n   → Token expiry issues\n\n📈 Trends:\n• 500 errors increased 40% today\n• Staging env has 3x more failures than dev\n\n💡 Priority: Fix login validation ASAP',
  'summarize-failures': 'Here\'s your failure summary for the last 24 hours:\n\n📊 Overview:\n• Total Executions: 147\n• Failed: 23 (15.6%)\n• Success Rate: 84.4%\n\n🔴 Top Failure Reasons:\n1. Server Errors (500) - 12 failures\n2. Timeouts (>5s) - 6 failures\n3. Assertion Failures - 5 failures\n\n⚡ Affected APIs:\n• POST /api/v1/auth/login - 12 failures\n• POST /api/v1/posts - 6 failures\n• GET /api/v1/users/:id - 5 failures\n\n🎯 Action Required:\n→ Urgent: Fix login endpoint validation',
  'incident-summary': 'Here\'s a summary of your current incidents:\n\n🚨 Critical Issues:\n• Database connection timeout - 23 min duration\n• High latency in auth service - ongoing\n\n⚠️ Key Metrics:\n• Total Errors: 1,284 (↓12% vs yesterday)\n• Critical Errors: 45 (↑8%)\n• Affected APIs: 12\n• MTTR: 24 minutes\n\n📊 Top Impact:\n1. /api/v1/auth/login - 45 failures\n2. /api/v1/users - 32 failures\n\n💡 Recommendation:\nAddress database pool exhaustion immediately',
  'root-cause': 'Based on my analysis of the incident logs:\n\n🔍 Root Cause Analysis:\n\n**Primary Cause:**\nDatabase connection pool exhaustion (max: 10 connections)\n\n**Contributing Factors:**\n1. Unoptimized SELECT * queries\n2. Missing indexes on user table\n3. No connection timeout configured\n4. Increased traffic after v2.4.1 deployment\n\n**Evidence:**\n• Slow query logs show 2.5s response times\n• All 10 connections were stuck\n• Traffic increased 40% after deployment\n\n🎯 Recommended Actions:\n→ Immediate: Restart service\n→ Short-term: Increase pool to 25\n→ Long-term: Optimize queries + add monitoring',
  'mitigation-steps': 'Here are recommended mitigation steps:\n\n⚡ Immediate Actions (0-5 min):\n1. Restart auth-service deployment\n   kubectl rollout restart deployment/auth-service\n2. Monitor error rates in real-time\n3. Alert customer support team\n\n🔧 Short-term Fixes (5-30 min):\n1. Increase connection pool size to 25\n2. Add connection timeout (30s)\n3. Enable query logging\n\n🛡️ Long-term Solutions:\n1. Optimize slow queries\n2. Add database indexes\n3. Implement read replicas\n4. Set up connection pool monitoring\n5. Create runbook for similar incidents',
  'analyze-logs': 'I\'ve analyzed the log patterns:\n\n📊 Log Analysis Results:\n\n**Error Distribution:**\n• Connection timeouts: 67% of errors\n• Query timeouts: 23%\n• Other: 10%\n\n**Timeline Pattern:**\n• 14:30 - First latency spike\n• 14:32 - Error surge begins\n• 14:35 - Critical threshold reached\n• 14:42 - Manual intervention\n\n**Correlation Found:**\n• Deployment at 14:15\n• Traffic spike at 14:28\n• First error at 14:30\n\n💡 Pattern suggests deployment introduced a performance regression',
  'find-similar': 'I found similar incidents in your history:\n\n🔄 Similar Incidents:\n\n**Incident #1247 (Mar 28, 2026)**\n• Database timeout in payment service\n• Duration: 18 minutes\n• Same root cause: pool exhaustion\n• Resolution: Increased pool size\n\n**Incident #1189 (Mar 15, 2026)**\n• Connection pool issues in user service\n• Duration: 31 minutes\n• Fixed by: Query optimization\n\n**Common Pattern:**\nAll 3 incidents occurred after deployments with increased query complexity\n\n💡 Recommendation:\nImplement pre-deployment query performance testing',
  'impact-assessment': 'Here\'s the impact assessment:\n\n📊 User Impact:\n• Affected users: ~245 (2% of active users)\n• Failed requests: 1,284\n• Avg disruption time: 23 minutes\n\n💰 Business Impact:\n• Estimated revenue loss: ~$890\n• Support tickets created: 47\n• Social media mentions: 12 complaints\n\n🎯 Service Impact:\n• Authentication: 100% failure rate (23 min)\n• User management: 60% degraded\n• Other services: Minimal impact\n\n⚠️ Severity Classification:\n**P0 - Critical**\nCore authentication was completely unavailable',
  'improve-message': 'I can help improve your incident message:\n\n✅ Improvements to make:\n\n**Current Issues:**\n• Too technical for customers\n• Missing clear action items\n• No empathy statement\n\n**Suggested Changes:**\n\n1. Start with empathy:\n   "We understand this disruption was frustrating..."\n\n2. Simplify technical terms:\n   "database issue" instead of "connection pool exhaustion"\n\n3. Add concrete timelines:\n   "Fully resolved as of 2:55 PM UTC"\n\n4. Offer compensation (if applicable):\n   "We\'re extending all trials by 24 hours"\n\n5. End with commitment:\n   "We\'ve implemented safeguards to prevent this"',
  'translate-technical': 'Here\'s a simplified version:\n\n🔄 Technical → Customer-Friendly:\n\n**Instead of:**\n"Database connection pool exhaustion due to unoptimized queries"\n\n**Say:**\n"Our database was handling more requests than expected, causing slow response times"\n\n**Instead of:**\n"Implemented connection timeout and increased pool size"\n\n**Say:**\n"We\'ve improved our system to handle higher traffic"\n\n**Instead of:**\n"MTTR was 23 minutes"\n\n**Say:**\n"We resolved the issue within 23 minutes"\n\n💡 Rule: Focus on impact and resolution, not technical details',
  'escalation-guide': 'Here\'s your escalation guide:\n\n📋 When to Escalate:\n\n🚨 Escalate Immediately if:\n• Issue persists >30 minutes\n• Revenue impact >$10K/hour\n• P0/Critical severity\n• Customer VIPs affected\n• Security breach suspected\n\n👥 Escalation Path:\n1. Team Lead (first 15 min)\n2. Engineering Manager (after 30 min)\n3. VP Engineering + CTO (after 1 hour)\n4. CEO (customer-facing crisis)\n\n📞 How to Escalate:\n1. Use #incident-response Slack\n2. Page on-call via PagerDuty\n3. Include: severity, impact, attempts made\n\n✅ This Incident:\nRecommend escalating to Database Team Lead now',
  'timeline-insights': 'Key insights from the timeline:\n\n⏱️ Timeline Analysis:\n\n**Detection Performance:**\n• Time to Detect: 6 minutes (Good)\n• First error → Alert: 3 minutes\n\n**Response Performance:**\n• Time to Respond: 3 minutes (Excellent)\n• Alert → First action: 3 minutes\n\n**Resolution Performance:**\n• Time to Resolve: 17 minutes (Good)\n• Total incident duration: 23 minutes\n\n🎯 Efficiency Metrics:\n• 74% of time spent on resolution\n• 26% on detection/response\n\n💡 Improvement Opportunities:\n• Faster detection: Add predictive alerts\n• Faster resolution: Create runbooks',
  'lessons-learned': 'Here are the key lessons from this incident:\n\n📚 Lessons Learned:\n\n**What Went Well:**\n✅ Quick detection (6 min)\n✅ Immediate team mobilization\n✅ Clear communication channels\n✅ Effective root cause identification\n\n**What Needs Improvement:**\n⚠️ Pre-deployment testing missed this\n⚠️ No automatic pool size scaling\n⚠️ Missing connection pool monitoring\n⚠️ No automated rollback triggered\n\n**Action Items:**\n1. Add load testing to CI/CD pipeline\n2. Implement auto-scaling for connection pools\n3. Set up Grafana dashboard for DB metrics\n4. Create automated rollback rules\n5. Document this in runbook\n\n💡 Schedule postmortem meeting for tomorrow',
  'postmortem-template': 'I\'ve generated a postmortem template:\n\n# Incident Postmortem\n## Database Connection Timeout - Apr 3, 2026\n\n### Summary\nService: Authentication\nDuration: 23 minutes (14:32 - 14:55 UTC)\nSeverity: P0 - Critical\nImpact: ~245 users unable to login\n\n### Timeline\n• 14:15 - v2.4.1 deployed\n• 14:30 - Latency increase detected\n• 14:32 - Error spike begins\n• 14:35 - PagerDuty alert\n• 14:42 - Service restarted\n• 14:48 - Pool size increased\n• 14:55 - Incident resolved\n\n### Root Cause\nConnection pool size (10) insufficient for post-deployment load\n\n### Resolution\n1. Emergency service restart\n2. Increased pool to 25\n3. Added connection timeout\n\n### Prevention\n[ ] Load testing in CI/CD\n[ ] Connection pool monitoring\n[ ] Auto-scaling rules',
};

const REGISTERED_REPOSITORIES_KEY = 'flowOps.registeredRepositories';

const DEFAULT_APPLICATION_FORM_FIELDS: AiOrchestratorFormField[] = [
  { name: 'title', label: 'Application title', type: 'text', required: true, placeholder: 'FlowOps Admin' },
  {
    name: 'mainRepository',
    label: 'Main repository',
    type: 'url',
    required: true,
    placeholder: 'https://github.com/org/flowops-admin',
  },
  { name: 'autoSync', label: 'Auto sync', type: 'checkbox', defaultValue: true },
];

const fieldLabel = (field: AiOrchestratorFormField) =>
  field.label || field.name.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());

const initialFieldValue = (field: AiOrchestratorFormField): string | boolean => {
  if (field.type === 'checkbox') return Boolean(field.defaultValue);
  return typeof field.defaultValue === 'string' ? field.defaultValue : '';
};

const normalizeRepositoryFullName = (value: string) => {
  const normalized = value
    .trim()
    .replace(/^https:\/\/github\.com\//, '')
    .replace(/^http:\/\/github\.com\//, '')
    .replace(/\.git$/, '');
  const [owner, name, ...rest] = normalized.split('/').filter(Boolean);
  if (!owner || !name || rest.length > 0) return null;
  return `${owner}/${name}`;
};

const rememberRegisteredRepository = (repository: {
  id: number;
  projectId: number;
  appId: number;
  title: string;
  fullName: string;
  repositoryUrl?: string;
  defaultBranch?: string;
  selectedBranches?: string[];
  connectionStatus?: string;
}) => {
  const existing = JSON.parse(localStorage.getItem(REGISTERED_REPOSITORIES_KEY) || '[]') as Array<typeof repository>;
  const next = [
    repository,
    ...existing.filter((item) => item.id !== repository.id && item.fullName !== repository.fullName),
  ];
  localStorage.setItem(REGISTERED_REPOSITORIES_KEY, JSON.stringify(next));
};

const routeFromAction = (result: AiOrchestratorResult) => result.action?.route || result.route;

const isApiInventoryPrompt = (prompt: string) =>
  /api|endpoint|inventory|명세|상세|상세조회|조회/i.test(prompt);

const extractKeywordFromPrompt = (prompt: string) =>
  prompt
    .replace(/api/gi, '')
    .replace(/상세조회|상세|조회|명세|보여줘|알려줘/g, '')
    .trim();

const messageFromResult = (result: AiOrchestratorResult) => {
  if (result.message) return result.message;
  if (result.status === 'collect_input') return '필요한 정보를 입력해 주세요.';
  if (result.status === 'redirect') return '요청하신 화면으로 이동할게요.';
  if (result.status === 'need_validation') return '실행 전에 입력값을 검증할게요.';
  return '요청을 처리할 준비가 됐습니다.';
};

export function AIAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeApplication, setActiveApplication } = useTestContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: '👋 Hi! I\'m your FlowOps Assistant. I can help you generate test cases, debug failures, and improve your testing workflows. What would you like to do?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeForm, setActiveForm] = useState<ActiveForm | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const context = getPageContext(location.pathname);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const appendAiMessage = (content: string) => {
    const aiMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      type: 'ai',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiMessage]);
  };

  const buildOrchestratorContext = (extraContext: Record<string, unknown> = {}) => ({
    userId: localStorage.getItem('flowOps.userId') || 'user_123',
    workspaceId: localStorage.getItem('flowOps.workspaceId') || 'workspace_123',
    currentRoute: location.pathname,
    activeApplication,
    ...extraContext,
  });

  const executeCreateApplication = async (values: Record<string, unknown>) => {
    const title = String(values.title || values.name || '').trim();
    const repositoryValue = String(values.mainRepository || values.repositoryUrl || values.repoUrl || '').trim();
    const fullName = normalizeRepositoryFullName(repositoryValue);

    if (!title) throw new Error('Application title is required.');
    if (!fullName) throw new Error('Main repository must be owner/repository or a GitHub repository URL.');

    const project = await flowOpsApi.ensureProject();
    const app = await flowOpsApi.createApp({
      name: title,
      repoUrl: `https://github.com/${fullName}`,
    });
    await flowOpsApi.setMainApp(app.id, { title }).catch(() => undefined);
    const repository = await flowOpsApi.registerRepository(project.id, { fullName, appId: app.id });

    rememberAppId(app.id);
    rememberAppTitle(title);
    setActiveApplication({ appId: app.id, title });
    rememberRegisteredRepository({
      id: repository.id,
      projectId: project.id,
      appId: app.id,
      title,
      fullName,
      repositoryUrl: repository.repositoryUrl || `https://github.com/${fullName}`,
      defaultBranch: repository.defaultBranch,
      selectedBranches: [],
      connectionStatus: repository.connectionStatus || 'ACTIVE',
    });

    if (values.autoSync === true) {
      const branches = await flowOpsApi.listRepositoryBranches(project.id, repository.id).catch(() => []);
      const defaultBranch = branches.find((branch) => branch.selected || branch.isDefault || branch.defaultBranch);
      const branchName = defaultBranch?.name || defaultBranch?.branchName || repository.defaultBranch;
      if (branchName) {
        await flowOpsApi.scanRepository(project.id, repository.id, [branchName]).catch(() => []);
      }
    }

    return { appId: app.id, title, projectId: project.id, repositoryId: repository.id };
  };

  const routeApiInventory = async (values: Record<string, unknown>, prompt = '') => {
    const projectIdFromPayload = Number(values.projectId || values.project_id);
    const inventoryId = values.inventoryId || values.inventory_id || values.apiInventoryId;
    const rawKeyword =
      values.keyword ||
      values.searchKeyword ||
      values.searchQuery ||
      values.query ||
      values.endpointPath ||
      extractKeywordFromPrompt(prompt);
    const keyword = String(rawKeyword || '').trim();

    if (inventoryId) {
      navigate('/qc/api', {
        state: {
          projectId: Number.isFinite(projectIdFromPayload) ? projectIdFromPayload : undefined,
          inventoryId: String(inventoryId),
          selectedApiId: String(inventoryId),
          searchQuery: keyword,
        },
      });
      appendAiMessage('Opening the saved API inventory detail.');
      return;
    }

    if (!keyword) {
      navigate('/qc/api');
      appendAiMessage('I need an inventoryId for a direct detail view. Opening the API inventory list instead.');
      return;
    }

    const project =
      Number.isFinite(projectIdFromPayload)
        ? { id: projectIdFromPayload }
        : await flowOpsApi.ensureProject();
    const inventory = await flowOpsApi.listInventories(project.id, { keyword }).catch(() => ({ items: [] }));
    const normalizedKeyword = keyword.toLowerCase();
    const matches = inventory.items.filter((item) =>
      [item.endpointPath, item.operationId, item.summary, item.domainTag]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedKeyword)),
    );

    if (matches.length === 1) {
      navigate('/qc/api', {
        state: {
          projectId: project.id,
          inventoryId: matches[0].id,
          selectedApiId: matches[0].id,
          searchQuery: keyword,
        },
      });
      appendAiMessage(`Opening API inventory detail for ${matches[0].endpointPath}.`);
      return;
    }

    navigate('/qc/api', { state: { projectId: project.id, searchQuery: keyword } });
    appendAiMessage(
      matches.length > 1
        ? `I found ${matches.length} matching APIs. Please select one from the filtered inventory list.`
        : 'I could not find an exact API match. Opening the inventory list with your search keyword.',
    );
  };

  const executeApplicationAction = async (result: AiOrchestratorResult) => {
    const action = result.action;
    const actionType = action?.type;
    const payload = { ...(result.payload || {}), ...(action?.payload || {}) };
    const resourceType = action?.resourceType || result.resourceType || payload.resourceType;

    if (
      resourceType === 'api_inventory' ||
      actionType === 'view_api_inventory' ||
      actionType === 'open_api_inventory_detail' ||
      actionType === 'search_api_inventory'
    ) {
      await routeApiInventory(payload);
      return;
    }

    if (actionType === 'open_form') {
      const fields = action?.form?.fields?.length ? action.form.fields : DEFAULT_APPLICATION_FORM_FIELDS;
      setActiveForm({
        type: action.form?.type || 'application_create',
        fields,
        values: Object.fromEntries(fields.map((field) => [field.name, initialFieldValue(field)])),
      });
      return;
    }

    if (actionType === 'redirect' || result.status === 'redirect') {
      const route = routeFromAction(result);
      if (route) navigate(route, { state: action?.payload || result.payload });
      return;
    }

    if (actionType === 'create_application') {
      const created = await executeCreateApplication(payload);
      appendAiMessage(`Application "${created.title}" was created and selected.`);
      navigate('/app/settings', { state: created });
      return;
    }

    if (actionType === 'update_application') {
      const appId = Number(payload.appId || activeApplication.appId);
      const title = typeof payload.title === 'string' ? payload.title.trim() : undefined;
      const updated = await flowOpsApi.updateApp(appId, {
        ...payload,
        title,
        name: title,
      });
      const nextTitle = updated.title || updated.name || title || activeApplication.title;
      rememberAppTitle(nextTitle);
      setActiveApplication({ appId: updated.id || appId, title: nextTitle });
      appendAiMessage(`Application "${nextTitle}" was updated.`);
      return;
    }

    if (actionType === 'delete_application') {
      const appId = Number(payload.appId || activeApplication.appId);
      await flowOpsApi.deleteApp(appId);
      appendAiMessage('Application was deleted.');
      navigate('/app/settings');
      return;
    }

    appendAiMessage(`Ready to execute action: ${actionType || 'unknown'}.`);
  };

  const handleOrchestratorResult = async (result: AiOrchestratorResult) => {
    appendAiMessage(messageFromResult(result));

    if (result.requiresUserConfirmation) {
      setPendingConfirmation({
        result,
        title: result.confirmation?.title || 'Confirm action',
        message: result.confirmation?.message || 'Do you want to continue?',
        confirmText: result.confirmation?.confirmText || 'Confirm',
        cancelText: result.confirmation?.cancelText || 'Cancel',
      });
      return;
    }

    if (result.status === 'collect_input') {
      const fields = result.action?.form?.fields?.length
        ? result.action.form.fields
        : DEFAULT_APPLICATION_FORM_FIELDS;
      setActiveForm({
        type: result.action?.form?.type || 'application_create',
        fields,
        values: Object.fromEntries(fields.map((field) => [field.name, initialFieldValue(field)])),
      });
      return;
    }

    if (result.status === 'need_validation' || result.status === 'ready' || result.status === 'redirect') {
      await executeApplicationAction(result);
    }
  };

  const sendToOrchestrator = async (userPrompt: string, extraContext: Record<string, unknown> = {}) => {
    setActionError(null);
    setIsTyping(true);
    try {
      const result = await flowOpsApi.orchestrateChat({
        project_id: 'ecommerce-backend',
        user_prompt: userPrompt,
        context: buildOrchestratorContext(extraContext),
      });
      await handleOrchestratorResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI orchestrator request failed.';
      if (message.includes('no actionable result') && isApiInventoryPrompt(userPrompt)) {
        await routeApiInventory({ keyword: extractKeywordFromPrompt(userPrompt) }, userPrompt);
        setActionError(null);
        return;
      }
      appendAiMessage(message);
      setActionError(message);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setActiveForm(null);
    void sendToOrchestrator(content.trim());
  };

  const handleQuickAction = (actionId: string) => {
    const action = context.quickActions.find(a => a.id === actionId);
    if (!action) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: action.label,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const response = mockAIResponses[actionId] || `I'll help you with "${action.label}". Let me analyze your current setup...`;
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response,
        timestamp: new Date(),
        suggestions: actionId === 'generate-tests' ? ['Generate Now', 'Customize Cases'] : undefined,
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1200);
  };

  const handleFormValueChange = (fieldName: string, value: string | boolean) => {
    setActiveForm((current) => {
      if (!current) return current;
      return {
        ...current,
        values: {
          ...current.values,
          [fieldName]: value,
        },
      };
    });
  };

  const handleFormSubmit = () => {
    if (!activeForm) return;
    const missingField = activeForm.fields.find(
      (field) => field.required && field.type !== 'checkbox' && !String(activeForm.values[field.name] ?? '').trim(),
    );
    if (missingField) {
      setActionError(`${fieldLabel(missingField)} is required.`);
      return;
    }
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'user',
        content: 'Application creation information submitted.',
        timestamp: new Date(),
      },
    ]);
    const submittedForm = activeForm;
    setActiveForm(null);
    void sendToOrchestrator('application 생성 정보를 입력했습니다.', {
      formSubmission: {
        type: submittedForm.type,
        values: submittedForm.values,
      },
    });
  };

  const handleConfirmAction = () => {
    if (!pendingConfirmation) return;
    const confirmedResult = pendingConfirmation.result;
    setPendingConfirmation(null);
    setIsTyping(true);
    executeApplicationAction(confirmedResult)
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Action execution failed.';
        appendAiMessage(message);
        setActionError(message);
      })
      .finally(() => setIsTyping(false));
  };

  const handleToggle = () => {
    if (isOpen && !isMinimized) {
      setIsOpen(false);
    } else if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Floating Button */}
      {(!isOpen || isMinimized) && (
        <button
          onClick={handleToggle}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center z-50 group"
          title="FlowOps Assistant"
        >
          <Sparkles size={24} className="group-hover:scale-110 transition-transform" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#060609] animate-pulse"></div>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && !isMinimized && (
        <div className="responsive-ai-panel fixed bottom-6 right-6 w-[420px] h-[70vh] bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl shadow-2xl z-50 flex flex-col animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 backdrop-blur rounded-full flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <div className="text-white font-medium">FlowOps Assistant</div>
                <div className="text-blue-200 text-xs truncate max-w-[240px]">{context.title}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleMinimize}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                title="Minimize"
              >
                <Minimize2 size={16} className="text-white" />
              </button>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                title="Close"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  {message.type === 'ai' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <Sparkles size={12} className="text-white" />
                      </div>
                      <span className="text-xs text-gray-400">FlowOps Assistant</span>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl p-3 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-[#13131a] text-gray-200 rounded-tl-sm border border-[#1f1f28]'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                    
                    {/* Suggestion Buttons */}
                    {message.suggestions && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {message.type === 'user' && (
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <span className="text-xs text-gray-500">You</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <Sparkles size={12} className="text-white" />
                    </div>
                    <span className="text-xs text-gray-400">QC Assistant</span>
                  </div>
                  <div className="bg-[#13131a] border border-[#1f1f28] rounded-2xl rounded-tl-sm p-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeForm && (
              <div className="rounded-xl border border-blue-500/20 bg-[#111827] p-4">
                <div className="mb-3 text-sm font-medium text-white">Application form</div>
                <div className="space-y-3">
                  {activeForm.fields.map((field) => (
                    <label key={field.name} className="block text-xs text-gray-400">
                      <span className="mb-1 block">{fieldLabel(field)}</span>
                      {field.type === 'checkbox' ? (
                        <span className="flex items-center gap-2 rounded-lg border border-[#1f1f28] bg-[#0a0a0f] px-3 py-2 text-gray-200">
                          <input
                            type="checkbox"
                            checked={Boolean(activeForm.values[field.name])}
                            onChange={(event) => handleFormValueChange(field.name, event.target.checked)}
                            className="h-4 w-4 accent-blue-600"
                          />
                          Enabled
                        </span>
                      ) : field.type === 'select' && field.options?.length ? (
                        <select
                          value={String(activeForm.values[field.name] ?? '')}
                          onChange={(event) => handleFormValueChange(field.name, event.target.value)}
                          className="w-full rounded-lg border border-[#1f1f28] bg-[#0a0a0f] px-3 py-2 text-sm text-white focus:border-blue-500/30 focus:outline-none"
                        >
                          <option value="">Select...</option>
                          {field.options.map((option) => (
                            <option key={String(option.value)} value={String(option.value)}>
                              {option.label || String(option.value)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === 'url' ? 'url' : 'text'}
                          required={field.required}
                          value={String(activeForm.values[field.name] ?? '')}
                          onChange={(event) => handleFormValueChange(field.name, event.target.value)}
                          placeholder={field.placeholder}
                          className="w-full rounded-lg border border-[#1f1f28] bg-[#0a0a0f] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500/30 focus:outline-none"
                        />
                      )}
                    </label>
                  ))}
                </div>
                {actionError && (
                  <div className="mt-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
                    {actionError}
                  </div>
                )}
                <button
                  onClick={handleFormSubmit}
                  disabled={isTyping}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isTyping && <Loader2 size={14} className="animate-spin" />}
                  Submit
                </button>
              </div>
            )}

            {pendingConfirmation && (
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                <div className="text-sm font-medium text-white">{pendingConfirmation.title}</div>
                <div className="mt-1 text-xs leading-5 text-yellow-100">{pendingConfirmation.message}</div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleConfirmAction}
                    disabled={isTyping}
                    className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {pendingConfirmation.confirmText}
                  </button>
                  <button
                    onClick={() => setPendingConfirmation(null)}
                    disabled={isTyping}
                    className="flex-1 rounded-lg border border-[#2a2a34] px-3 py-2 text-sm text-gray-200 hover:bg-[#1f1f28] disabled:opacity-50"
                  >
                    {pendingConfirmation.cancelText}
                  </button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="border-t border-[#1f1f28] p-3 bg-[#0d0d12]">
            <div className="text-xs text-gray-400 mb-2">Quick Actions:</div>
            <div className="flex flex-wrap gap-2">
              {context.quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#13131a] border border-[#1f1f28] hover:border-blue-500/30 hover:bg-blue-500/5 text-gray-300 hover:text-white rounded-lg text-xs transition-all"
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-[#1f1f28] p-4 bg-[#0d0d12]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 bg-[#13131a] border border-[#1f1f28] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/30 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
            <div className="text-xs text-gray-500 mt-2">Press Enter to send</div>
          </div>
        </div>
      )}

      {/* Minimized State */}
      {isOpen && isMinimized && (
        <div className="responsive-ai-minimized fixed bottom-6 right-6 bg-[#0a0a0f] border border-[#1f1f28] rounded-xl shadow-xl p-3 z-50 flex items-center gap-3 animate-slide-up">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white text-sm font-medium">FlowOps Assistant</div>
            <div className="text-gray-400 text-xs">{context.page}</div>
          </div>
          <button
            onClick={handleToggle}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#13131a] rounded-lg transition-colors ml-2"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>
      )}
    </>
  );
}
