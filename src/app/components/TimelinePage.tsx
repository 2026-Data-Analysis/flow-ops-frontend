import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
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

export function TimelinePage() {
  const [selectedIncident, setSelectedIncident] = useState<string>('');
  const [dateRange, setDateRange] = useState('24h');
  const [zoomLevel, setZoomLevel] = useState(1);
  const events: TimelineEvent[] = [];

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
              <option value="">No incidents available</option>
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
                <div className="text-2xl font-bold text-gray-900">—</div>
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
                <div className="text-2xl font-bold text-gray-900">—</div>
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
                <div className="text-2xl font-bold text-gray-900">—</div>
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
                <div className="text-2xl font-bold text-gray-900">{events.length}</div>
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
              {events.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Activity size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-gray-600">No timeline events</p>
                  <p className="text-sm text-gray-400 mt-1">Incident events will appear here when available</p>
                </div>
              ) : events.map((event, index) => {
                const config = eventConfig[event.type];
                const Icon = config.icon;
                const isCritical = index >= 2 && index <= 6;

                return (
                  <div key={event.id} className="relative pl-16">
                    <div className="absolute left-0 top-0 w-12 text-right">
                      <span className="text-sm font-semibold text-gray-700">{event.time}</span>
                    </div>
                    <div className={`absolute left-[18px] w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center z-10 shadow-sm`}>
                      <Icon size={20} className={config.iconColor} />
                    </div>
                    {isCritical && (
                      <div className="absolute left-0 top-0 bottom-0 w-12 bg-red-50 opacity-30 -ml-4"></div>
                    )}
                    <div className={`p-4 rounded-xl border-2 ${config.cardBorder} ${config.cardBg} ${isCritical ? 'shadow-md' : 'shadow-sm'}`}>
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
                    {index < events.length - 1 && (
                      <div className={`absolute left-6 top-10 w-0.5 h-6 ${config.lineColor}`}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
