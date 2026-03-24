import { Link } from 'react-router';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  PlusCircle, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Activity,
  XCircle,
  Server,
  Rocket,
  AlertCircle,
  Send,
  Sparkles,
  GitBranch,
  Shield,
  Zap
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../components/ui/badge';

export function Dashboard() {
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your Manager Agent. I can help you understand your system status, investigate issues, and recommend actions. What would you like to know?',
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage = { role: 'user', content: inputMessage };
    setChatMessages([...chatMessages, userMessage]);
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        role: 'assistant',
        content: getAIResponse(inputMessage),
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 500);
    
    setInputMessage('');
  };

  const getAIResponse = (message: string) => {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('checkout') || lowerMsg.includes('slow')) {
      return '**Summary:** The /checkout endpoint is experiencing elevated response times (avg 2.3s vs normal 0.8s).\n\n**Recommended Actions:**\n1. Check database query performance on order creation\n2. Review recent deployment changes to payment processing\n3. Monitor traffic patterns for unusual spikes';
    } else if (lowerMsg.includes('login') || lowerMsg.includes('failed')) {
      return '**Summary:** Failed login attempts increased by 340% in the last 2 hours, primarily from IP range 203.0.113.0/24.\n\n**Recommended Actions:**\n1. Review security logs for potential brute force attack\n2. Consider implementing rate limiting on login endpoint\n3. Alert security team if pattern continues';
    } else if (lowerMsg.includes('deployment') || lowerMsg.includes('deploy')) {
      return '**Summary:** Latest deployment (v2.4.1) was successful. Changes affected checkout flow and user authentication.\n\n**Observed Impact:**\n- 15% faster page load times\n- 2 new API endpoints introduced\n- Minor increase in error rates (being monitored)';
    }
    return '**Summary:** All systems are operating within normal parameters. Your applications are healthy with minimal issues.\n\n**Recommended Actions:**\n1. Review the 2 open incidents for resolution\n2. Schedule QC review for Customer Portal\n3. Monitor checkout endpoint performance';
  };

  // Mock data for the dashboard
  const systemStatus = {
    service: 'healthy', // 'healthy' | 'warning' | 'critical'
    lastDeployment: '2 hours ago',
    qcRunStatus: 'completed',
    openIncidents: 2
  };

  // Branch-based QC policy data
  const validationMode = {
    branch: 'develop',
    policy: 'Integration Validation',
    scope: 'Core flows + cross-domain checks',
    lastExecution: '15 minutes ago',
    autoRun: true,
    checksExecuted: 47,
    coverage: '85%'
  };

  const qcOverview = {
    total: 47,
    passed: 43,
    failed: 4,
    failedItems: [
      { name: 'API Response Time Check', endpoint: '/api/checkout' },
      { name: 'Login Success Rate', endpoint: '/auth/login' },
      { name: 'Error Rate Threshold', app: 'Customer Portal' },
      { name: 'Database Connection Pool', app: 'Main Product App' }
    ]
  };

  const deploymentImpact = {
    version: 'v2.4.1',
    changedFiles: 23,
    affectedDomains: ['Checkout Flow', 'User Authentication', 'Payment Processing'],
    improvements: [
      '15% faster page load times',
      'Improved error handling',
      'Enhanced security measures'
    ],
    risks: [
      'Minor increase in API error rate (monitoring)'
    ]
  };

  const topIncidents = [
    {
      id: 1,
      title: 'Slow API response on /checkout',
      app: 'Main Product App',
      severity: 'medium',
      impact: 'User experience degraded, checkout taking 2.3s (normal: 0.8s)',
      time: '30 minutes ago',
    },
    {
      id: 2,
      title: 'Failed login attempts spike',
      app: 'Customer Portal',
      severity: 'high',
      impact: 'Potential security issue, 340% increase in failed attempts',
      time: '2 hours ago',
    },
    {
      id: 3,
      title: 'Database connection pool warning',
      app: 'Main Product App',
      severity: 'low',
      impact: 'Connection pool at 75% capacity, no user impact yet',
      time: '3 hours ago',
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Operations Dashboard</h1>
            <p className="text-slate-600 mt-1 text-sm md:text-base">AI-powered QA/QC monitoring for your applications</p>
          </div>
          <Link to="/register">
            <Button className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
              <PlusCircle className="size-4 mr-2" />
              Register New App
            </Button>
          </Link>
        </div>

        {/* Top Status Overview - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="p-4 md:p-5 border-0 shadow-md">
            <div className="flex items-center justify-between min-h-[60px]">
              <div>
                <p className="text-xs md:text-sm text-slate-600">Service Status</p>
                <p className={`text-xl md:text-2xl font-bold mt-1 ${
                  systemStatus.service === 'healthy' ? 'text-green-600' :
                  systemStatus.service === 'warning' ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {systemStatus.service === 'healthy' ? 'Healthy' :
                   systemStatus.service === 'warning' ? 'Warning' :
                   'Critical'}
                </p>
              </div>
              <div className={`p-2 md:p-3 rounded-lg flex items-center justify-center ${
                systemStatus.service === 'healthy' ? 'bg-green-100' :
                systemStatus.service === 'warning' ? 'bg-orange-100' :
                'bg-red-100'
              }`}>
                <Server className={`size-5 md:size-6 ${
                  systemStatus.service === 'healthy' ? 'text-green-600' :
                  systemStatus.service === 'warning' ? 'text-orange-600' :
                  'text-red-600'
                }`} />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-5 border-0 shadow-md">
            <div className="flex items-center justify-between min-h-[60px]">
              <div>
                <p className="text-xs md:text-sm text-slate-600">Last Deployment</p>
                <p className="text-xl md:text-2xl font-bold text-slate-900 mt-1">{systemStatus.lastDeployment}</p>
              </div>
              <div className="p-2 md:p-3 bg-blue-100 rounded-lg flex items-center justify-center">
                <Rocket className="size-5 md:size-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-5 border-0 shadow-md">
            <div className="flex items-center justify-between min-h-[60px]">
              <div>
                <p className="text-xs md:text-sm text-slate-600">QC Run Status</p>
                <p className="text-xl md:text-2xl font-bold text-green-600 mt-1 capitalize">{systemStatus.qcRunStatus}</p>
              </div>
              <div className="p-2 md:p-3 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="size-5 md:size-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-5 border-0 shadow-md">
            <div className="flex items-center justify-between min-h-[60px]">
              <div>
                <p className="text-xs md:text-sm text-slate-600">Open Incidents</p>
                <p className="text-xl md:text-2xl font-bold text-orange-600 mt-1">{systemStatus.openIncidents}</p>
              </div>
              <div className="p-2 md:p-3 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="size-5 md:size-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* AI Summary Card - Prioritized at top on all screens */}
        <Card className="p-4 md:p-6 border-0 shadow-md bg-gradient-to-br from-blue-50 to-slate-50">
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="p-2 md:p-3 bg-blue-600 rounded-lg flex-shrink-0">
              <Sparkles className="size-5 md:size-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-2">AI System Summary</h3>
              <p className="text-sm md:text-base text-slate-700 leading-relaxed">
                Your systems are mostly healthy with 2 active incidents requiring attention. 
                The Main Product App's checkout endpoint is responding slower than usual (2.3s vs 0.8s normal), 
                likely due to the recent deployment. The Customer Portal is seeing unusual login activity 
                that may indicate a security concern. Recent deployment (v2.4.1) has improved overall 
                performance by 15%, but we're monitoring a slight uptick in API errors. 
                <span className="font-medium text-blue-700"> Recommended: Investigate checkout performance and review security logs.</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Current Validation Mode Card - Responsive */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-blue-50">
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 md:mb-4">
              <div className="p-2 md:p-2.5 bg-indigo-600 rounded-lg flex-shrink-0">
                <Shield className="size-5 md:size-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900">Current Validation Mode</h3>
                <p className="text-xs md:text-sm text-slate-600">Active QC policy configuration</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              {/* Left Column */}
              <div className="space-y-3 md:space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="size-4 text-indigo-600" />
                    <p className="text-xs md:text-sm font-medium text-slate-700">Current Branch</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 font-mono text-xs md:text-sm">
                      {validationMode.branch}
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="size-4 text-indigo-600" />
                    <p className="text-xs md:text-sm font-medium text-slate-700">Active QC Policy</p>
                  </div>
                  <p className="text-sm md:text-base font-semibold text-slate-900">{validationMode.policy}</p>
                </div>
              </div>

              {/* Middle Column */}
              <div className="space-y-3 md:space-y-4">
                <div>
                  <p className="text-xs md:text-sm font-medium text-slate-700 mb-2">Validation Scope</p>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed">{validationMode.scope}</p>
                </div>

                <div>
                  <p className="text-xs md:text-sm font-medium text-slate-700 mb-2">Coverage</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: validationMode.coverage }}
                      />
                    </div>
                    <span className="text-xs md:text-sm font-semibold text-slate-900">{validationMode.coverage}</span>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3 md:space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="size-4 text-indigo-600" />
                    <p className="text-xs md:text-sm font-medium text-slate-700">Last Execution</p>
                  </div>
                  <p className="text-sm md:text-base font-semibold text-slate-900">{validationMode.lastExecution}</p>
                  <p className="text-xs text-slate-600 mt-1">{validationMode.checksExecuted} checks executed</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="size-4 text-indigo-600" />
                    <p className="text-xs md:text-sm font-medium text-slate-700">Auto-run Status</p>
                  </div>
                  <Badge className={validationMode.autoRun 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                  }>
                    {validationMode.autoRun ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Multi-column layout for large screens, stacked for smaller */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          {/* QC Overview - Takes 1 column on large screens */}
          <Card className="p-4 md:p-6 border-0 shadow-md xl:col-span-1">
            <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-4">QC Overview</h3>
            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-slate-900">{qcOverview.total}</p>
                <p className="text-xs md:text-sm text-slate-600 mt-1">Total Checks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-green-600">{qcOverview.passed}</p>
                <p className="text-xs md:text-sm text-slate-600 mt-1">Passed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-red-600">{qcOverview.failed}</p>
                <p className="text-xs md:text-sm text-slate-600 mt-1">Failed</p>
              </div>
            </div>
            
            {qcOverview.failed > 0 && (
              <div className="mt-4">
                <p className="text-xs md:text-sm font-medium text-slate-900 mb-3">Failed Checks:</p>
                <div className="space-y-2">
                  {qcOverview.failedItems.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                      <XCircle className="size-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-600 truncate">
                          {item.endpoint || item.app}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Deployment Impact Summary - Takes 2 columns on large screens */}
          <Card className="p-4 md:p-6 border-0 shadow-md xl:col-span-2">
            <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-4">Deployment Impact Summary</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs md:text-sm font-medium text-slate-900">Version {deploymentImpact.version}</span>
                  <span className="text-xs text-slate-600">{deploymentImpact.changedFiles} files changed</span>
                </div>
              </div>

              <div>
                <p className="text-xs md:text-sm font-medium text-slate-900 mb-2">Affected Domains:</p>
                <div className="flex flex-wrap gap-2">
                  {deploymentImpact.affectedDomains.map((domain, index) => (
                    <span key={index} className="px-2 md:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {domain}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs md:text-sm font-medium text-slate-900 mb-2">What Changed:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    {deploymentImpact.improvements.map((improvement, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs md:text-sm text-slate-700">{improvement}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {deploymentImpact.risks.map((risk, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <AlertCircle className="size-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs md:text-sm text-slate-700">{risk}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Incident Highlights - Responsive */}
        <Card className="p-4 md:p-6 border-0 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-semibold text-slate-900">Top Incidents</h3>
            <Link to="/incidents">
              <Button variant="ghost" size="sm" className="text-xs md:text-sm">View All</Button>
            </Link>
          </div>
          <div className="space-y-3">
            {topIncidents.map((incident) => (
              <div key={incident.id} className="p-3 md:p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      incident.severity === 'high' ? 'bg-red-100' :
                      incident.severity === 'medium' ? 'bg-orange-100' :
                      'bg-yellow-100'
                    }`}>
                      <AlertTriangle className={`size-4 md:size-5 ${
                        incident.severity === 'high' ? 'text-red-600' :
                        incident.severity === 'medium' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm md:text-base font-medium text-slate-900">{incident.title}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          incident.severity === 'high' ? 'bg-red-100 text-red-700' :
                          incident.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {incident.severity}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-slate-600 mb-1">{incident.app}</p>
                      <p className="text-xs md:text-sm text-slate-700 leading-relaxed">{incident.impact}</p>
                      <p className="text-xs text-slate-500 mt-2">{incident.time}</p>
                    </div>
                  </div>
                  <Link to="/incidents">
                    <Button variant="outline" size="sm" className="flex-shrink-0 text-xs md:text-sm w-full md:w-auto">
                      Investigate
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Right Sidebar - Manager Agent Chat - Hidden on tablet, shown on desktop */}
      <div className="hidden xl:flex xl:w-96 border-l border-slate-200 bg-white flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="size-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Manager Agent</h3>
              <p className="text-xs text-blue-100">AI-powered insights & recommendations</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-900'
              }`}>
                <p className="text-sm whitespace-pre-line">{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about your system..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <Button 
              onClick={handleSendMessage}
              className="bg-blue-600 hover:bg-blue-700 px-3"
              size="sm"
            >
              <Send className="size-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Try: "What's causing the slow checkout?" or "Tell me about the deployment"
          </p>
        </div>
      </div>
    </div>
  );
}