import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Settings,
  Edit,
  GitBranch,
  Shield,
  Zap,
  Bell,
  AlertTriangle,
  X,
  Save,
  CheckCircle2,
  Target,
  Clock,
  AlertOctagon
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface PolicyConfig {
  branch: string;
  policyName: string;
  trigger: string;
  validationScope: string;
  autoRun: boolean;
  notification: string;
  failureAction: string;
  description: string;
  checksCount: number;
  color: string;
}

export function QCPolicySettings() {
  const [policies, setPolicies] = useState<PolicyConfig[]>([
    {
      branch: 'feature/*',
      policyName: 'Feature Validation',
      trigger: 'On Push',
      validationScope: 'Feature-specific tests only',
      autoRun: true,
      notification: 'Developer only',
      failureAction: 'Block merge',
      description: 'Quick validation to catch issues early in feature development before integration',
      checksCount: 12,
      color: 'purple'
    },
    {
      branch: 'develop',
      policyName: 'Integration Validation',
      trigger: 'On Merge',
      validationScope: 'Core flows + cross-domain checks',
      autoRun: true,
      notification: 'Team + Slack',
      failureAction: 'Create incident ticket',
      description: 'Comprehensive validation to ensure merged features work together correctly',
      checksCount: 47,
      color: 'blue'
    },
    {
      branch: 'staging',
      policyName: 'Release Readiness',
      trigger: 'On Merge + Scheduled',
      validationScope: 'Full regression suite + performance',
      autoRun: true,
      notification: 'Team + Email + Slack',
      failureAction: 'Block production deployment',
      description: 'Complete pre-production validation including regression, performance, and security tests',
      checksCount: 89,
      color: 'orange'
    },
    {
      branch: 'main',
      policyName: 'Production Monitoring',
      trigger: 'Continuous',
      validationScope: 'Critical path + health checks',
      autoRun: true,
      notification: 'All + PagerDuty',
      failureAction: 'Alert + Auto-rollback if critical',
      description: 'Real-time monitoring and smoke tests to ensure production stability',
      checksCount: 28,
      color: 'green'
    }
  ]);

  const [editingPolicy, setEditingPolicy] = useState<PolicyConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleEditPolicy = (policy: PolicyConfig) => {
    setEditingPolicy({ ...policy });
    setIsEditing(true);
  };

  const handleSavePolicy = () => {
    if (editingPolicy) {
      setPolicies(policies.map(p => 
        p.branch === editingPolicy.branch ? editingPolicy : p
      ));
      setIsEditing(false);
      setEditingPolicy(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingPolicy(null);
  };

  const getBranchColor = (branch: string) => {
    const policy = policies.find(p => p.branch === branch);
    if (!policy) return 'slate';
    const colors = {
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      green: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[policy.color] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Settings className="size-5 md:size-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">QC Policy Settings</h1>
          </div>
          <p className="text-sm md:text-base text-slate-600">Configure quality control policies for each branch</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="gap-2 w-full sm:w-auto">
            <Shield className="size-4" />
            Import Policy
          </Button>
          <Button variant="outline" className="gap-2 w-full sm:w-auto">
            <Save className="size-4" />
            Export Policy
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-0 shadow-sm bg-blue-50 border-l-4 border-l-blue-600">
        <div className="p-3 md:p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 md:size-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm md:text-base font-semibold text-blue-900 mb-1">Branch-Based Quality Control</h3>
              <p className="text-xs md:text-sm text-blue-800 leading-relaxed">
                Each branch can have its own QC policy with specific validation rules, triggers, and failure handling. 
                Policies are automatically applied when code is pushed or merged to the corresponding branch.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Policy Configuration Table - Responsive */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-200">
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Policy Name
                </th>
                <th className="hidden lg:table-cell px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Trigger
                </th>
                <th className="hidden xl:table-cell px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Validation Scope
                </th>
                <th className="hidden md:table-cell px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Auto-run
                </th>
                <th className="hidden xl:table-cell px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Notification
                </th>
                <th className="hidden xl:table-cell px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Failure Action
                </th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {policies.map((policy) => (
                <tr key={policy.branch} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-2">
                      <GitBranch className="size-3 md:size-4 text-slate-500 flex-shrink-0" />
                      <Badge variant="outline" className={`font-mono text-xs ${getBranchColor(policy.branch)}`}>
                        {policy.branch}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <div>
                      <p className="text-sm md:text-base font-semibold text-slate-900">{policy.policyName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{policy.checksCount} checks configured</p>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-3 md:px-6 py-3 md:py-4">
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs">
                      {policy.trigger}
                    </Badge>
                  </td>
                  <td className="hidden xl:table-cell px-3 md:px-6 py-3 md:py-4">
                    <p className="text-sm text-slate-700">{policy.validationScope}</p>
                  </td>
                  <td className="hidden md:table-cell px-3 md:px-6 py-3 md:py-4">
                    <Badge variant="outline" className={
                      policy.autoRun 
                        ? 'bg-green-50 text-green-700 border-green-200 text-xs' 
                        : 'bg-slate-100 text-slate-600 border-slate-200 text-xs'
                    }>
                      {policy.autoRun ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          <span>Enabled</span>
                        </div>
                      ) : (
                        'Disabled'
                      )}
                    </Badge>
                  </td>
                  <td className="hidden xl:table-cell px-3 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-1.5">
                      <Bell className="size-3.5 text-slate-500" />
                      <span className="text-sm text-slate-700">{policy.notification}</span>
                    </div>
                  </td>
                  <td className="hidden xl:table-cell px-3 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-1.5">
                      <AlertOctagon className="size-3.5 text-orange-600" />
                      <span className="text-sm text-slate-700">{policy.failureAction}</span>
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditPolicy(policy)}
                      className="gap-1.5 text-xs"
                    >
                      <Edit className="size-3 md:size-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Policy Summary Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {policies.map((policy) => (
          <Card key={policy.branch} className={`border-0 shadow-md overflow-hidden bg-gradient-to-br ${
            policy.color === 'purple' ? 'from-purple-50 to-indigo-50' :
            policy.color === 'blue' ? 'from-blue-50 to-cyan-50' :
            policy.color === 'orange' ? 'from-orange-50 to-amber-50' :
            'from-green-50 to-emerald-50'
          }`}>
            <div className="p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 md:p-2 rounded-lg ${
                  policy.color === 'purple' ? 'bg-purple-600' :
                  policy.color === 'blue' ? 'bg-blue-600' :
                  policy.color === 'orange' ? 'bg-orange-600' :
                  'bg-green-600'
                }`}>
                  <Shield className="size-3 md:size-4 text-white" />
                </div>
                <Badge variant="outline" className={`font-mono text-xs ${getBranchColor(policy.branch)}`}>
                  {policy.branch}
                </Badge>
              </div>
              <h3 className="text-sm md:text-base font-bold text-slate-900 mb-1">{policy.policyName}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{policy.description}</p>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Checks</span>
                  <span className="font-semibold text-slate-900">{policy.checksCount}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Policy Side Panel */}
      {isEditing && editingPolicy && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-2xl shadow-2xl overflow-y-auto">
            {/* Panel Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-6 z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${
                    editingPolicy.color === 'purple' ? 'bg-purple-600' :
                    editingPolicy.color === 'blue' ? 'bg-blue-600' :
                    editingPolicy.color === 'orange' ? 'bg-orange-600' :
                    'bg-green-600'
                  }`}>
                    <Shield className="size-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Edit Policy Configuration</h2>
                    <p className="text-sm text-slate-600">Configure QC policy for {editingPolicy.branch}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCancelEdit}
                  className="gap-2"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="p-8 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Target className="size-5 text-indigo-600" />
                  Basic Information
                </h3>
                <div className="space-y-4 bg-slate-50 p-5 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Branch
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-300">
                      <GitBranch className="size-4 text-slate-500" />
                      <span className="font-mono font-semibold text-slate-900">{editingPolicy.branch}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Policy Name
                    </label>
                    <input
                      type="text"
                      value={editingPolicy.policyName}
                      onChange={(e) => setEditingPolicy({ ...editingPolicy, policyName: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editingPolicy.description}
                      onChange={(e) => setEditingPolicy({ ...editingPolicy, description: e.target.value })}
                      rows={3}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Trigger Configuration */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Zap className="size-5 text-indigo-600" />
                  Trigger Configuration
                </h3>
                <div className="space-y-4 bg-slate-50 p-5 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Execution Trigger
                    </label>
                    <Select 
                      value={editingPolicy.trigger} 
                      onValueChange={(value) => setEditingPolicy({ ...editingPolicy, trigger: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="On Push">On Push</SelectItem>
                        <SelectItem value="On Merge">On Merge</SelectItem>
                        <SelectItem value="On Merge + Scheduled">On Merge + Scheduled</SelectItem>
                        <SelectItem value="Continuous">Continuous</SelectItem>
                        <SelectItem value="Manual">Manual Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingPolicy.autoRun}
                        onChange={(e) => setEditingPolicy({ ...editingPolicy, autoRun: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Enable Auto-run</span>
                    </label>
                    <p className="text-xs text-slate-600 mt-1 ml-6">
                      Automatically execute QC checks when trigger conditions are met
                    </p>
                  </div>
                </div>
              </div>

              {/* Validation Scope */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Shield className="size-5 text-indigo-600" />
                  Validation Scope
                </h3>
                <div className="space-y-4 bg-slate-50 p-5 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Test Scope
                    </label>
                    <Select 
                      value={editingPolicy.validationScope} 
                      onValueChange={(value) => setEditingPolicy({ ...editingPolicy, validationScope: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Feature-specific tests only">Feature-specific tests only</SelectItem>
                        <SelectItem value="Core flows + cross-domain checks">Core flows + cross-domain checks</SelectItem>
                        <SelectItem value="Full regression suite + performance">Full regression suite + performance</SelectItem>
                        <SelectItem value="Critical path + health checks">Critical path + health checks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Number of Checks
                    </label>
                    <input
                      type="number"
                      value={editingPolicy.checksCount}
                      onChange={(e) => setEditingPolicy({ ...editingPolicy, checksCount: parseInt(e.target.value) || 0 })}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Bell className="size-5 text-indigo-600" />
                  Notification Settings
                </h3>
                <div className="space-y-4 bg-slate-50 p-5 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Notification Recipients
                    </label>
                    <Select 
                      value={editingPolicy.notification} 
                      onValueChange={(value) => setEditingPolicy({ ...editingPolicy, notification: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Developer only">Developer only</SelectItem>
                        <SelectItem value="Team + Slack">Team + Slack</SelectItem>
                        <SelectItem value="Team + Email + Slack">Team + Email + Slack</SelectItem>
                        <SelectItem value="All + PagerDuty">All + PagerDuty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Failure Handling */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <AlertOctagon className="size-5 text-indigo-600" />
                  Failure Handling
                </h3>
                <div className="space-y-4 bg-slate-50 p-5 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Action on Failure
                    </label>
                    <Select 
                      value={editingPolicy.failureAction} 
                      onValueChange={(value) => setEditingPolicy({ ...editingPolicy, failureAction: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Block merge">Block merge</SelectItem>
                        <SelectItem value="Create incident ticket">Create incident ticket</SelectItem>
                        <SelectItem value="Block production deployment">Block production deployment</SelectItem>
                        <SelectItem value="Alert + Auto-rollback if critical">Alert + Auto-rollback if critical</SelectItem>
                        <SelectItem value="Alert only (allow continue)">Alert only (allow continue)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-600 mt-2">
                      Define what happens when QC checks fail for this branch
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-8 py-6">
              <div className="flex items-center justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  className="gap-2"
                >
                  <X className="size-4" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSavePolicy}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                >
                  <Save className="size-4" />
                  Save Policy
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}