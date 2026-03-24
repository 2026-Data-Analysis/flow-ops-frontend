import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { 
  Upload, 
  Github, 
  MessageSquare, 
  Database, 
  CheckCircle2, 
  Zap,
  Shield,
  BarChart3
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function ApplicationRegistration() {
  const [formData, setFormData] = useState({
    appName: '',
    environment: '',
    baseUrl: '',
    apiSpec: null as File | null,
    repository: '',
    deploymentMethod: '',
    userFlows: '',
    notificationChannel: '',
  });

  const [connectedIntegrations, setConnectedIntegrations] = useState({
    github: false,
    slack: false,
    logs: false,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, apiSpec: e.target.files[0] });
    }
  };

  const toggleIntegration = (integration: 'github' | 'slack' | 'logs') => {
    setConnectedIntegrations({
      ...connectedIntegrations,
      [integration]: !connectedIntegrations[integration],
    });
  };

  const handleSubmit = (action: 'save' | 'generate') => {
    console.log('Form submitted:', action, formData);
    // Handle form submission
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Illustration & Info */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                <Zap className="size-4" />
                AI-Powered QA & Operations
              </div>
              <h1 className="text-4xl font-bold text-slate-900 leading-tight">
                Automated Quality Control for Modern Product Teams
              </h1>
              <p className="text-lg text-slate-600">
                Set up your application in minutes. Get instant QC checklists, post-deployment analysis, 
                and proactive incident monitoring—all without writing a single test.
              </p>
            </div>

            <Card className="overflow-hidden border-0 shadow-lg">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1497409988347-cbfaac2f0b12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9kdWN0JTIwbWFuYWdlbWVudCUyMHdvcmtmbG93JTIwZGFzaGJvYXJkfGVufDF8fHx8MTc3NDI1NTg3NXww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Dashboard workflow"
                className="w-full h-64 object-cover"
              />
            </Card>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle2 className="size-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Auto-Generated QC Checklists</h3>
                  <p className="text-sm text-slate-600">Get comprehensive test scenarios based on your app's specs</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="size-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Post-Deployment Analysis</h3>
                  <p className="text-sm text-slate-600">Monitor key metrics and catch issues before users do</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="size-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Intelligent Incident Monitoring</h3>
                  <p className="text-sm text-slate-600">Get alerts when user flows break or performance degrades</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="space-y-6">
            <Card className="p-8 shadow-xl border-0">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Register Your Application</h2>
                  <p className="text-slate-600 mt-1">
                    Connect your app to start automated QA and monitoring
                  </p>
                </div>

                {/* Application Name */}
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name *</Label>
                  <Input
                    id="appName"
                    placeholder="e.g., My Product Dashboard"
                    value={formData.appName}
                    onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                  />
                </div>

                {/* Environment */}
                <div className="space-y-2">
                  <Label htmlFor="environment">Environment *</Label>
                  <Select value={formData.environment} onValueChange={(value) => setFormData({ ...formData, environment: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="dev">Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Base URL */}
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL *</Label>
                  <Input
                    id="baseUrl"
                    placeholder="https://app.example.com"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  />
                </div>

                {/* API Spec Upload */}
                <div className="space-y-2">
                  <Label htmlFor="apiSpec">API Specification (OpenAPI/Swagger)</Label>
                  <div className="relative">
                    <Input
                      id="apiSpec"
                      type="file"
                      accept=".json,.yaml,.yml"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Upload className="size-4 text-slate-400" />
                    </div>
                  </div>
                  {formData.apiSpec && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="size-4" />
                      {formData.apiSpec.name}
                    </p>
                  )}
                </div>

                {/* Repository Connection */}
                <div className="space-y-2">
                  <Label htmlFor="repository">Repository URL</Label>
                  <div className="relative">
                    <Input
                      id="repository"
                      placeholder="https://github.com/yourorg/yourapp"
                      value={formData.repository}
                      onChange={(e) => setFormData({ ...formData, repository: e.target.value })}
                      className="pl-10"
                    />
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  </div>
                </div>

                {/* Deployment Method */}
                <div className="space-y-2">
                  <Label htmlFor="deploymentMethod">Deployment Method</Label>
                  <Select value={formData.deploymentMethod} onValueChange={(value) => setFormData({ ...formData, deploymentMethod: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select deployment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vercel">Vercel</SelectItem>
                      <SelectItem value="netlify">Netlify</SelectItem>
                      <SelectItem value="aws">AWS</SelectItem>
                      <SelectItem value="gcp">Google Cloud</SelectItem>
                      <SelectItem value="azure">Azure</SelectItem>
                      <SelectItem value="heroku">Heroku</SelectItem>
                      <SelectItem value="docker">Docker/Kubernetes</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Main User Flows */}
                <div className="space-y-2">
                  <Label htmlFor="userFlows">Main User Flows to Monitor *</Label>
                  <Textarea
                    id="userFlows"
                    placeholder="E.g., User signup → Email verification → First dashboard view → Create first project"
                    rows={4}
                    value={formData.userFlows}
                    onChange={(e) => setFormData({ ...formData, userFlows: e.target.value })}
                  />
                  <p className="text-xs text-slate-500">
                    Describe the critical paths users take through your app
                  </p>
                </div>

                {/* Notification Channel */}
                <div className="space-y-2">
                  <Label htmlFor="notificationChannel">Notification Channel *</Label>
                  <Select value={formData.notificationChannel} onValueChange={(value) => setFormData({ ...formData, notificationChannel: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="How should we notify you?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                      <SelectItem value="teams">Microsoft Teams</SelectItem>
                      <SelectItem value="webhook">Custom Webhook</SelectItem>
                      <SelectItem value="dashboard">Dashboard Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Optional Integrations */}
            <Card className="p-8 shadow-xl border-0 bg-slate-50">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Optional Integrations</h3>
                  <p className="text-sm text-slate-600">Connect additional services for enhanced monitoring</p>
                </div>

                <div className="grid gap-3">
                  {/* GitHub Integration */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Github className="size-5 text-slate-700" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">GitHub</p>
                        <p className="text-xs text-slate-600">Link commits to deployments</p>
                      </div>
                    </div>
                    <Button
                      variant={connectedIntegrations.github ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleIntegration('github')}
                    >
                      {connectedIntegrations.github ? (
                        <>
                          <CheckCircle2 className="size-4 mr-1" />
                          Connected
                        </>
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  </div>

                  {/* Slack Integration */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <MessageSquare className="size-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Slack</p>
                        <p className="text-xs text-slate-600">Get alerts in your channels</p>
                      </div>
                    </div>
                    <Button
                      variant={connectedIntegrations.slack ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleIntegration('slack')}
                    >
                      {connectedIntegrations.slack ? (
                        <>
                          <CheckCircle2 className="size-4 mr-1" />
                          Connected
                        </>
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  </div>

                  {/* Log Provider Integration */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Database className="size-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Log Provider</p>
                        <p className="text-xs text-slate-600">Connect Datadog, Sentry, or others</p>
                      </div>
                    </div>
                    <Button
                      variant={connectedIntegrations.logs ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleIntegration('logs')}
                    >
                      {connectedIntegrations.logs ? (
                        <>
                          <CheckCircle2 className="size-4 mr-1" />
                          Connected
                        </>
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => handleSubmit('save')}
              >
                Save Application
              </Button>
              <Button
                size="lg"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => handleSubmit('generate')}
              >
                Generate QC Checklist
                <Zap className="ml-2 size-4" />
              </Button>
            </div>

            <p className="text-xs text-center text-slate-500">
              By registering, you agree to automated monitoring of your application's public endpoints
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
