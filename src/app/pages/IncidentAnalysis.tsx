import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { 
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Sparkles,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Zap
} from 'lucide-react';

export function IncidentAnalysis() {
  const [selectedIncident, setSelectedIncident] = useState('checkout-timeout');

  // Mock incident data
  const incidents = {
    'checkout-timeout': {
      id: 'INC-001',
      title: 'Slow API Response on /checkout Endpoint',
      status: 'investigating',
      severity: 'high',
      affectedDomain: 'Payment & Checkout',
      detectedAt: '2:30 PM',
      duration: '30 minutes',
      affectedUsers: 1247,
      timeline: [
        {
          time: '2:00 PM',
          event: 'Deployment v2.4.1',
          description: 'New payment processing logic deployed to production',
          type: 'deployment',
          status: 'completed'
        },
        {
          time: '2:15 PM',
          event: 'Normal Operation',
          description: 'All systems operating within normal parameters',
          type: 'normal',
          status: 'ok'
        },
        {
          time: '2:30 PM',
          event: 'Error Spike Detected',
          description: 'Response times jumped from 0.8s to 2.3s average',
          type: 'error',
          status: 'critical'
        },
        {
          time: '2:45 PM',
          event: 'Current State',
          description: 'Monitoring ongoing, team investigating database queries',
          type: 'current',
          status: 'investigating'
        }
      ],
      aiExplanation: `The /checkout endpoint is experiencing significantly slower response times following the v2.4.1 deployment. What should normally take about 0.8 seconds is now taking 2.3 seconds on average. This is affecting users during the checkout process, causing frustration and potentially abandoned carts. The issue started 15 minutes after the deployment went live, which strongly suggests the new code introduced a performance bottleneck. Based on monitoring data, the slowdown appears to be related to database operations, specifically when processing payment transactions.`,
      rootCauseCandidates: [
        {
          likelihood: 'high',
          cause: 'Unoptimized Database Query',
          explanation: 'The new payment processing code may include inefficient SQL queries that don\'t use proper indexes. This would cause the database to scan entire tables instead of using fast lookups.',
          evidence: 'Database CPU usage increased by 45% after deployment; Query execution time logs show payment-related queries taking 1.5s longer'
        },
        {
          likelihood: 'medium',
          cause: 'External Payment API Latency',
          explanation: 'The payment gateway integration might be experiencing delays or the new code might be making redundant API calls to the payment provider.',
          evidence: 'Payment gateway response times are within normal range, but we\'re making 3x more API calls per transaction than before'
        },
        {
          likelihood: 'low',
          cause: 'Increased Traffic Volume',
          explanation: 'Coincidental spike in checkout traffic overwhelming the system at the same time as the deployment.',
          evidence: 'Traffic volume is only 15% higher than normal, not enough to cause this level of degradation'
        }
      ],
      recommendedActions: [
        {
          priority: 'immediate',
          action: 'Review Database Query Performance',
          details: 'Check the query execution plan for payment-related database calls introduced in v2.4.1. Look for missing indexes or table scans.',
          owner: 'Database Team'
        },
        {
          priority: 'immediate',
          action: 'Reduce Payment API Calls',
          details: 'Audit the payment processing flow to identify and eliminate redundant API calls. Consider caching payment provider responses where appropriate.',
          owner: 'Backend Team'
        },
        {
          priority: 'high',
          action: 'Prepare Rollback Plan',
          details: 'Document rollback procedure for v2.4.1 in case optimization attempts don\'t resolve the issue within 1 hour.',
          owner: 'DevOps Team'
        },
        {
          priority: 'medium',
          action: 'Customer Communication',
          details: 'Prepare customer-facing status update explaining temporary checkout delays and expected resolution time.',
          owner: 'Customer Success'
        }
      ],
      logSummary: [
        {
          time: '2:45 PM',
          errorType: 'SlowQueryWarning',
          endpoint: '/api/checkout/process',
          count: 342,
          message: 'Query execution exceeded 2000ms threshold'
        },
        {
          time: '2:43 PM',
          errorType: 'DatabaseConnectionPoolWarning',
          endpoint: '/api/checkout/process',
          count: 127,
          message: 'Connection pool at 85% capacity'
        },
        {
          time: '2:40 PM',
          errorType: 'PaymentGatewayTimeout',
          endpoint: '/api/payment/authorize',
          count: 89,
          message: 'Payment authorization took longer than 3s'
        },
        {
          time: '2:38 PM',
          errorType: 'SlowQueryWarning',
          endpoint: '/api/checkout/validate',
          count: 234,
          message: 'Query execution exceeded 2000ms threshold'
        },
        {
          time: '2:35 PM',
          errorType: 'HTTPResponseSlow',
          endpoint: '/api/checkout/process',
          count: 456,
          message: 'Response time exceeded SLA of 1000ms'
        }
      ]
    }
  };

  const incident = incidents[selectedIncident];

  const getSeverityConfig = (severity: string) => {
    const configs = {
      critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-600' },
      high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', icon: 'text-orange-600' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', icon: 'text-yellow-600' },
      low: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-600' }
    };
    return configs[severity] || configs.medium;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      investigating: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
      resolved: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
      active: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' }
    };
    return configs[status] || configs.investigating;
  };

  const getPriorityConfig = (priority: string) => {
    const configs = {
      immediate: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
      high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' }
    };
    return configs[priority] || configs.medium;
  };

  const getLikelihoodConfig = (likelihood: string) => {
    const configs = {
      high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700 border-red-200' },
      medium: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700 border-orange-200' },
      low: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700 border-slate-200' }
    };
    return configs[likelihood] || configs.medium;
  };

  const severityConfig = getSeverityConfig(incident.severity);
  const statusConfig = getStatusConfig(incident.status);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Incident Analysis</h1>
          <p className="text-slate-600 mt-1">AI-powered incident investigation and root cause analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Report</Button>
          <Button className="bg-blue-600 hover:bg-blue-700">Mark Resolved</Button>
        </div>
      </div>

      {/* Incident Selector */}
      <div>
        <Select value={selectedIncident} onValueChange={setSelectedIncident}>
          <SelectTrigger className="w-96">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="checkout-timeout">{incident.title}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Incident Summary */}
      <Card className="border-0 shadow-md">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 ${severityConfig.bg} rounded-lg`}>
                <AlertTriangle className={`size-6 ${severityConfig.icon}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm text-slate-600">{incident.id}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-sm text-slate-600">Detected {incident.detectedAt}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">{incident.title}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                    {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                  </Badge>
                  <Badge variant="outline" className={`${severityConfig.bg} ${severityConfig.text} ${severityConfig.border}`}>
                    {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)} Severity
                  </Badge>
                  <Badge variant="outline">
                    {incident.affectedDomain}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-200">
            <div>
              <p className="text-sm text-slate-600 mb-1">Duration</p>
              <p className="text-xl font-semibold text-slate-900">{incident.duration}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Affected Users</p>
              <p className="text-xl font-semibold text-slate-900">{incident.affectedUsers.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Affected Domain</p>
              <p className="text-xl font-semibold text-slate-900">{incident.affectedDomain}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="border-0 shadow-md">
        <div className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="size-5 text-blue-600" />
            Incident Timeline
          </h3>
          <div className="space-y-0">
            {incident.timeline.map((item, index) => (
              <div key={index} className="flex gap-4">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    item.type === 'deployment' ? 'bg-blue-600' :
                    item.type === 'error' ? 'bg-red-600' :
                    item.type === 'current' ? 'bg-orange-600' :
                    'bg-green-600'
                  }`} />
                  {index < incident.timeline.length - 1 && (
                    <div className="w-0.5 h-20 bg-slate-200" />
                  )}
                </div>

                {/* Timeline Content */}
                <div className="flex-1 pb-6">
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
      </Card>

      {/* AI Explanation */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-slate-50">
        <div className="p-6">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Sparkles className="size-5 text-blue-600" />
            AI Explanation
          </h3>
          <p className="text-slate-700 leading-relaxed">
            {incident.aiExplanation}
          </p>
        </div>
      </Card>

      {/* Root Cause Candidates */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Lightbulb className="size-5 text-orange-600" />
          Root Cause Candidates
        </h3>
        <div className="grid gap-4">
          {incident.rootCauseCandidates.map((candidate, index) => {
            const likelihoodConfig = getLikelihoodConfig(candidate.likelihood);
            return (
              <Card key={index} className={`border ${likelihoodConfig.border} ${likelihoodConfig.bg}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={likelihoodConfig.badge}>
                          {candidate.likelihood.charAt(0).toUpperCase() + candidate.likelihood.slice(1)} Likelihood
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-2">{candidate.cause}</h4>
                      <p className="text-sm text-slate-700 mb-3">{candidate.explanation}</p>
                      <div className="bg-white/60 rounded-lg p-3 border border-slate-200">
                        <p className="text-xs font-medium text-slate-700 mb-1">Evidence:</p>
                        <p className="text-xs text-slate-600">{candidate.evidence}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recommended Actions */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Zap className="size-5 text-yellow-600" />
          Recommended Actions
        </h3>
        <div className="grid gap-3">
          {incident.recommendedActions.map((action, index) => {
            const priorityConfig = getPriorityConfig(action.priority);
            return (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={`${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}>
                          {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)} Priority
                        </Badge>
                        <span className="text-sm text-slate-600">• Assigned to: {action.owner}</span>
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-2">{action.action}</h4>
                      <p className="text-sm text-slate-600">{action.details}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Log Summary Table */}
      <Card className="border-0 shadow-md">
        <div className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="size-5 text-slate-600" />
            Log Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Error Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Endpoint
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {incident.logSummary.map((log, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                      {log.time}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {log.errorType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">
                      {log.endpoint}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-slate-900">{log.count}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}