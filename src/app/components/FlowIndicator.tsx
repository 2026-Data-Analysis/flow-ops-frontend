import { useLocation } from 'react-router';
import { Sparkles, Play, BarChart3, RefreshCw } from 'lucide-react';

const flowSteps = [
  { label: 'Generate', icon: Sparkles, paths: ['/qc/testcase', '/qc/scenario'] },
  { label: 'Execute', icon: Play, paths: ['/execution/run'] },
  { label: 'Analyze', icon: BarChart3, paths: ['/monitoring/incidents', '/monitoring/logs', '/monitoring/response'] },
  { label: 'Improve', icon: RefreshCw, paths: [] },
];

export function FlowIndicator() {
  const location = useLocation();

  const currentStepIndex = flowSteps.findIndex(step =>
    step.paths.some(path => location.pathname === path)
  );

  return (
    <div className="responsive-flow bg-[#0a0a0f] border-b border-[#1f1f28] px-6 py-3">
      <div className="responsive-flow-inner flex items-center justify-between max-w-3xl mx-auto">
        {flowSteps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          const isImprove = step.label === 'Improve';

          return (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'flow-step-active bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                      : isCompleted
                      ? 'flow-step-completed bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : isImprove && currentStepIndex === 2
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse'
                      : 'bg-[#13131a] text-gray-500 border border-[#1f1f28]'
                  }`}
                >
                  <Icon size={16} />
                </div>
                <span
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? 'flow-step-active-label text-white'
                      : isCompleted
                      ? 'flow-step-completed-label text-blue-400'
                      : isImprove && currentStepIndex === 2
                      ? 'text-purple-400'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {index < flowSteps.length - 1 && (
                <div
                  className={`flex-1 h-[2px] mx-4 transition-all ${
                    isCompleted
                      ? 'flow-step-line-completed bg-blue-500'
                      : index === currentStepIndex && isImprove === false
                      ? 'flow-step-line-active bg-gradient-to-r from-blue-500 to-[#1f1f28]'
                      : 'bg-[#1f1f28]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
