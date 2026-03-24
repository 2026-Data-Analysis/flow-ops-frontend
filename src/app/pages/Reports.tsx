import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { 
  Download,
  Rocket,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  GitCommit,
  FileText,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function Reports() {
  // Latest deployment data
  const latestDeployment = {
    version: 'v2.4.1',
    deployedAt: 'March 23, 2026 at 2:00 PM',
    deployedBy: 'DevOps Team',
    environment: 'Production',
    status: 'completed',
    duration: '8 minutes',
    summary: 'Enhanced payment processing logic and improved checkout flow performance. Added new error handling for edge cases and optimized database queries.',
    keyChanges: [
      {
        category: 'Payment Processing',
        description: 'Refactored payment authorization flow to reduce API calls',
        impact: 'high',
        files: 12
      },
      {
        category: 'Database Optimization',
        description: 'Added indexes to improve query performance on order tables',
        impact: 'medium',
        files: 5
      },
      {
        category: 'Error Handling',
        description: 'Enhanced error messages for better user experience',
        impact: 'low',
        files: 8
      },
      {
        category: 'UI Updates',
        description: 'Updated checkout button styling and loading states',
        impact: 'low',
        files: 3
      }
    ],
    issuesDetected: [
      {
        severity: 'high',
        issue: 'Slow API Response on /checkout',
        detectedAt: '2:30 PM',
        status: 'investigating'
      },
      {
        severity: 'medium',
        issue: 'Increased database connection pool usage',
        detectedAt: '2:45 PM',
        status: 'monitoring'
      }
    ]
  };

  // QC Execution data
  const qcExecution = {
    totalTests: 19,
    passed: 12,
    failed: 5,
    blocked: 2,
    executionTime: '4 minutes 32 seconds',
    lastRun: '2 hours ago',
    byDomain: [
      { domain: 'Authentication', passed: 2, failed: 1, blocked: 1, total: 4 },
      { domain: 'Payment', passed: 2, failed: 1, blocked: 1, total: 4 },
      { domain: 'Order', passed: 3, failed: 1, blocked: 0, total: 4 },
      { domain: 'Search', passed: 2, failed: 2, blocked: 0, total: 4 },
      { domain: 'Notification', passed: 3, failed: 0, blocked: 0, total: 3 }
    ]
  };

  // Incident history
  const incidentHistory = [
    {
      id: 'INC-001',
      title: 'Slow API Response on /checkout Endpoint',
      severity: 'high',
      status: 'investigating',
      detectedAt: 'Mar 23, 2:30 PM',
      resolvedAt: null,
      duration: '30 minutes (ongoing)',
      affectedUsers: 1247
    },
    {
      id: 'INC-002',
      title: 'Failed Login Attempts Spike',
      severity: 'high',
      status: 'resolved',
      detectedAt: 'Mar 23, 12:15 PM',
      resolvedAt: 'Mar 23, 1:00 PM',
      duration: '45 minutes',
      affectedUsers: 523
    },
    {
      id: 'INC-003',
      title: 'Slow Dashboard Load Times',
      severity: 'medium',
      status: 'resolved',
      detectedAt: 'Mar 22, 9:00 AM',
      resolvedAt: 'Mar 22, 10:15 AM',
      duration: '1 hour 15 minutes',
      affectedUsers: 89
    },
    {
      id: 'INC-004',
      title: 'Email Notification Delays',
      severity: 'low',
      status: 'resolved',
      detectedAt: 'Mar 21, 3:00 PM',
      resolvedAt: 'Mar 21, 5:00 PM',
      duration: '2 hours',
      affectedUsers: 34
    }
  ];

  // Postmortem for latest resolved incident
  const postmortem = {
    incidentId: 'INC-002',
    title: 'Failed Login Attempts Spike - Postmortem',
    date: 'March 23, 2026',
    timeline: [
      {
        time: '12:15 PM',
        event: 'Incident Detected',
        description: 'Monitoring alerts triggered for abnormal failed login rate (340% increase)'
      },
      {
        time: '12:20 PM',
        event: 'Investigation Started',
        description: 'Security team began reviewing logs and identified suspicious IP range'
      },
      {
        time: '12:35 PM',
        event: 'Mitigation Applied',
        description: 'Rate limiting implemented on login endpoint for suspicious IPs'
      },
      {
        time: '12:50 PM',
        event: 'Monitoring',
        description: 'Failed login rate returned to normal levels'
      },
      {
        time: '1:00 PM',
        event: 'Incident Resolved',
        description: 'Confirmed all systems operating normally, incident closed'
      }
    ],
    rootCause: 'Coordinated brute force attack from IP range 203.0.113.0/24 targeting common usernames. The authentication system was performing correctly, but the volume of attempts degraded service for legitimate users.',
    actionItems: [
      {
        priority: 'high',
        item: 'Implement permanent rate limiting on login endpoint',
        owner: 'Backend Team',
        dueDate: 'Mar 25',
        status: 'in-progress'
      },
      {
        priority: 'high',
        item: 'Add CAPTCHA for repeated failed login attempts',
        owner: 'Frontend Team',
        dueDate: 'Mar 28',
        status: 'planned'
      },
      {
        priority: 'medium',
        item: 'Set up automatic IP blocking for suspicious patterns',
        owner: 'Security Team',
        dueDate: 'Mar 30',
        status: 'planned'
      },
      {
        priority: 'low',
        item: 'Enhance monitoring alerts for authentication anomalies',
        owner: 'DevOps Team',
        dueDate: 'Apr 5',
        status: 'planned'
      }
    ]
  };

  const getSeverityConfig = (severity: string) => {
    const configs = {
      critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
      high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
      low: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' }
    };
    return configs[severity] || configs.medium;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      investigating: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
      monitoring: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
      resolved: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' }
    };
    return configs[status] || configs.investigating;
  };

  const getPriorityConfig = (priority: string) => {
    const configs = {
      high: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
      medium: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
      low: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' }
    };
    return configs[priority] || configs.medium;
  };

  const getActionStatusConfig = (status: string) => {
    const configs = {
      'in-progress': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      'planned': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
      'completed': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' }
    };
    return configs[status] || configs.planned;
  };

  const passRate = Math.round((qcExecution.passed / qcExecution.totalTests) * 100);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-600 mt-1">Deployment and QC execution reports</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="latest">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest Report</SelectItem>
              <SelectItem value="last-7">Last 7 Days</SelectItem>
              <SelectItem value="last-30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="size-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Latest Deployment Report */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="size-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">Latest Deployment Report</h2>
        </div>
        <Card className="border-0 shadow-md">
          <div className="p-6">
            {/* Deployment Header */}
            <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-slate-900">{latestDeployment.version}</h3>
                  <Badge variant="outline" className={`${getStatusConfig(latestDeployment.status).bg} ${getStatusConfig(latestDeployment.status).text} ${getStatusConfig(latestDeployment.status).border}`}>
                    {latestDeployment.status.charAt(0).toUpperCase() + latestDeployment.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">{latestDeployment.deployedAt}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Duration</p>
                <p className="text-lg font-semibold text-slate-900">{latestDeployment.duration}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="mb-6">
              <h4 className="font-semibold text-slate-900 mb-2">Summary</h4>
              <p className="text-slate-700 leading-relaxed">{latestDeployment.summary}</p>
            </div>

            {/* Key Changes */}
            <div className="mb-6">
              <h4 className="font-semibold text-slate-900 mb-3">Key Changes</h4>
              <div className="space-y-3">
                {latestDeployment.keyChanges.map((change, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <GitCommit className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-slate-900">{change.category}</h5>
                        <Badge variant="outline" className={`text-xs ${
                          change.impact === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                          change.impact === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {change.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{change.description}</p>
                      <p className="text-xs text-slate-500 mt-1">{change.files} files changed</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Issues Detected */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Issues Detected Post-Deployment</h4>
              <div className="space-y-3">
                {latestDeployment.issuesDetected.map((issue, index) => {
                  const severityConfig = getSeverityConfig(issue.severity);
                  const statusConfig = getStatusConfig(issue.status);
                  return (
                    <div key={index} className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <AlertTriangle className={`size-5 mt-0.5 flex-shrink-0 ${
                        issue.severity === 'high' ? 'text-orange-600' : 'text-yellow-600'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-slate-900">{issue.issue}</h5>
                          <Badge variant="outline" className={`${severityConfig.bg} ${severityConfig.text} ${severityConfig.border} text-xs`}>
                            {issue.severity}
                          </Badge>
                          <Badge variant="outline" className={`${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} text-xs`}>
                            {issue.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">Detected at {issue.detectedAt}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* QC Execution Report */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="size-5 text-green-600" />
          <h2 className="text-xl font-semibold text-slate-900">QC Execution Report</h2>
        </div>
        <Card className="border-0 shadow-md">
          <div className="p-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-6 mb-6 pb-6 border-b border-slate-200">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Tests</p>
                <p className="text-3xl font-bold text-slate-900">{qcExecution.totalTests}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Passed</p>
                <p className="text-3xl font-bold text-green-600">{qcExecution.passed}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-600">{qcExecution.failed}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Pass Rate</p>
                <p className="text-3xl font-bold text-slate-900">{passRate}%</p>
              </div>
            </div>

            {/* Domain Breakdown Chart */}
            <div className="mb-6">
              <h4 className="font-semibold text-slate-900 mb-4">Pass/Fail Breakdown by Domain</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={qcExecution.byDomain}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="domain" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar key="passed-bar" dataKey="passed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar key="failed-bar" dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar key="blocked-bar" dataKey="blocked" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Domain Details Table */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Detailed Results</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Domain
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Passed
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Failed
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Blocked
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Pass Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {qcExecution.byDomain.map((domain, index) => {
                      const domainPassRate = Math.round((domain.passed / domain.total) * 100);
                      return (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            {domain.domain}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {domain.total}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-700">
                            {domain.passed}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-red-700">
                            {domain.failed}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-orange-700">
                            {domain.blocked}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={
                              domainPassRate >= 80 ? 'bg-green-50 text-green-700 border-green-200' :
                              domainPassRate >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }>
                              {domainPassRate}%
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Incident History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="size-5 text-orange-600" />
          <h2 className="text-xl font-semibold text-slate-900">Incident History</h2>
        </div>
        <Card className="border-0 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Incident ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Detected
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Affected Users
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {incidentHistory.map((incident) => {
                  const severityConfig = getSeverityConfig(incident.severity);
                  const statusConfig = getStatusConfig(incident.status);
                  return (
                    <tr key={incident.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono font-medium text-slate-900">
                        {incident.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {incident.title}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`${severityConfig.bg} ${severityConfig.text} ${severityConfig.border}`}>
                          {incident.severity}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                          {incident.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {incident.detectedAt}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {incident.duration}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {incident.affectedUsers.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Postmortem Summary */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="size-5 text-slate-600" />
          <h2 className="text-xl font-semibold text-slate-900">Latest Postmortem</h2>
        </div>
        <Card className="border-0 shadow-md">
          <div className="p-6">
            {/* Postmortem Header */}
            <div className="mb-6 pb-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{postmortem.title}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
                  {postmortem.incidentId}
                </Badge>
                <span className="text-sm text-slate-600">{postmortem.date}</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-6">
              <h4 className="font-semibold text-slate-900 mb-4">Timeline</h4>
              <div className="space-y-0">
                {postmortem.timeline.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-600" />
                      {index < postmortem.timeline.length - 1 && (
                        <div className="w-0.5 h-16 bg-slate-200" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-900">{item.time}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-sm font-medium text-slate-700">{item.event}</span>
                      </div>
                      <p className="text-sm text-slate-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Root Cause */}
            <div className="mb-6">
              <h4 className="font-semibold text-slate-900 mb-3">Root Cause</h4>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-slate-700 leading-relaxed">{postmortem.rootCause}</p>
              </div>
            </div>

            {/* Action Items */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Action Items</h4>
              <div className="space-y-3">
                {postmortem.actionItems.map((action, index) => {
                  const priorityConfig = getPriorityConfig(action.priority);
                  const statusConfig = getActionStatusConfig(action.status);
                  return (
                    <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <CheckCircle2 className={`size-5 mt-0.5 flex-shrink-0 ${
                        action.status === 'completed' ? 'text-green-600' : 'text-slate-400'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border} text-xs`}>
                            {action.priority} priority
                          </Badge>
                          <Badge variant="outline" className={`${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} text-xs`}>
                            {action.status}
                          </Badge>
                        </div>
                        <p className="font-medium text-slate-900 mb-1">{action.item}</p>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <span>Owner: {action.owner}</span>
                          <span>•</span>
                          <span>Due: {action.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}