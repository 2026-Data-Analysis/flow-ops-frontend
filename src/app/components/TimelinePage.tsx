import { useState } from 'react';
import { 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Zap,
  GitCommit,
  Bell,
  Wrench,
  Calendar,
  ChevronDown,
  TrendingUp
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  type: 'error' | 'deploy' | 'alert' | 'action' | 'resolved' | 'spike';
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

const mockEvents: TimelineEvent[] = [
  {
    id: '1',
    time: '14:55',
    title: 'Issue Resolved',
    description: 'Database connection pool restored to normal. All services operational.',
    type: 'resolved',
  },
  {
    id: '2',
    time: '14:48',
    title: 'Fix Deployed',
    description: 'Increased connection pool size to 25. Monitoring for stability.',
    type: 'action',
  },
  {
    id: '3',
    time: '14:42',
    title: 'Emergency Restart',
    description: 'Auth-service restarted to clear stuck connections.',
    type: 'action',
  },
  {
    id: '4',
    time: '14:38',
    title: 'Root Cause Identified',
    description: 'Connection pool exhaustion due to slow queries and insufficient pool size.',
    type: 'action',
  },
  {
    id: '5',
    time: '14:35',
    title: 'Critical Alert Triggered',
    description: 'PagerDuty alert sent to on-call engineer. Database team notified.',
    type: 'alert',
    severity: 'critical',
  },
  {
    id: '6',
    time: '14:32',
    title: 'Error Spike Detected',
    description: 'Sudden increase in connection timeout errors (12 → 45 errors/min).',
    type: 'spike',
    severity: 'high',
  },
  {
    id: '7',
    time: '14:30',
    title: 'Latency Increase',
    description: 'Database query response time increased from 50ms to 2.5s.',
    type: 'error',
    severity: 'medium',
  },
  {
    id: '8',
    time: '14:15',
    title: 'Deployment: v2.4.1',
    description: 'New feature release deployed to production. All health checks passed.',
    type: 'deploy',
  },
  {
    id: '9',
    time: '14:00',
    title: 'System Normal',
    description: 'All systems operating within normal parameters.',
    type: 'resolved',
  },
];

const eventConfig = {
  error: {
    icon: AlertTriangle,
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    lineColor: 'bg-red-200',
    cardBorder: 'border-red-200',
    cardBg: 'bg-red-50',
  },
  spike: {
    icon: TrendingUp,
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
    lineColor: 'bg-orange-200',
    cardBorder: 'border-orange-200',
    cardBg: 'bg-orange-50',
  },
  deploy: {
    icon: GitCommit,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    lineColor: 'bg-blue-200',
    cardBorder: 'border-blue-200',
    cardBg: 'bg-blue-50',
  },
  alert: {
    icon: Bell,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    lineColor: 'bg-purple-200',
    cardBorder: 'border-purple-200',
    cardBg: 'bg-purple-50',
  },
  action: {
    icon: Wrench,
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    lineColor: 'bg-yellow-200',
    cardBorder: 'border-yellow-200',
    cardBg: 'bg-yellow-50',
  },
  resolved: {
    icon: CheckCircle2,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    lineColor: 'bg-green-200',
    cardBorder: 'border-green-200',
    cardBg: 'bg-green-50',
  },
};

const severityBadges = {
  low: 'bg-blue-100 text-blue-700 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

const mockIncidents = [
  { id: '1', title: 'Database connection timeout - Apr 3, 2026' },
  { id: '2', title: 'API rate limit exceeded - Apr 2, 2026' },
  { id: '3', title: 'High latency spike - Apr 1, 2026' },
];

export function TimelinePage() {
  const [selectedIncident, setSelectedIncident] = useState(mockIncidents[0].id);
  const [dateRange, setDateRange] = useState('24h');
  const [zoomLevel, setZoomLevel] = useState(1);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Incident Timeline</h1>
            <p className="text-gray-600">Visual timeline of incident events and responses</p>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-3">
            <select 
              value={selectedIncident}
              onChange={(e) => setSelectedIncident(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {mockIncidents.map((incident) => (
                <option key={incident.id} value={incident.id}>{incident.title}</option>
              ))}
            </select>

            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              <Calendar size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{dateRange}</span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl">
              <span className="text-sm font-medium text-gray-700">Zoom:</span>
              <button 
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                className="px-2 py-1 hover:bg-gray-100 rounded text-gray-600"
              >
                −
              </button>
              <span className="text-sm text-gray-600 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
              <button 
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
                className="px-2 py-1 hover:bg-gray-100 rounded text-gray-600"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">23m</div>
                <div className="text-xs text-gray-600">Total Duration</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock size={20} className="text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">6m</div>
                <div className="text-xs text-gray-600">Time to Detect</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Wrench size={20} className="text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">17m</div>
                <div className="text-xs text-gray-600">Time to Resolve</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Activity size={20} className="text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">8</div>
                <div className="text-xs text-gray-600">Total Events</div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-gray-900">Event Timeline</h3>
            
            {/* Legend */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">Error</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Deploy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Action</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Resolved</span>
              </div>
            </div>
          </div>

          {/* Timeline Events */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {/* Events */}
            <div className="space-y-6">
              {mockEvents.map((event, index) => {
                const config = eventConfig[event.type];
                const Icon = config.icon;
                
                // Highlight critical section
                const isCritical = index >= 2 && index <= 6;

                return (
                  <div key={event.id} className="relative pl-16">
                    {/* Time marker */}
                    <div className="absolute left-0 top-0 w-12 text-right">
                      <span className="text-sm font-semibold text-gray-700">{event.time}</span>
                    </div>

                    {/* Icon */}
                    <div className={`absolute left-[18px] w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center z-10 shadow-sm`}>
                      <Icon size={20} className={config.iconColor} />
                    </div>

                    {/* Critical zone indicator */}
                    {isCritical && (
                      <div className="absolute left-0 top-0 bottom-0 w-12 bg-red-50 opacity-30 -ml-4"></div>
                    )}

                    {/* Event card */}
                    <div className={`p-4 rounded-xl border-2 ${config.cardBorder} ${config.cardBg} ${
                      isCritical ? 'shadow-md' : 'shadow-sm'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        {event.severity && (
                          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${severityBadges[event.severity]}`}>
                            {event.severity}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{event.description}</p>
                    </div>

                    {/* Connecting line with fade */}
                    {index < mockEvents.length - 1 && (
                      <div className={`absolute left-6 top-10 w-0.5 h-6 ${config.lineColor}`}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Critical Period Highlight */}
          <div className="mt-8 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">Critical Period: 14:32 - 14:48</h4>
                <p className="text-sm text-red-800">
                  Service degradation period with high error rates and user impact. Multiple mitigation actions taken.
                </p>
              </div>
            </div>
          </div>

          {/* Recovery Zone */}
          <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 mb-1">Recovery Period: 14:48 - 14:55</h4>
                <p className="text-sm text-green-800">
                  Gradual service restoration after implementing fixes. System returned to normal operation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Deployment Markers */}
        <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Deployments</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <GitCommit size={20} className="text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">v2.4.1 Release</div>
                  <div className="text-sm text-gray-600">Deployed at 14:15 UTC</div>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                Production
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <GitCommit size={20} className="text-gray-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">v2.4.0 Release</div>
                  <div className="text-sm text-gray-600">Deployed at 10:30 UTC</div>
                </div>
              </div>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200">
                Production
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
