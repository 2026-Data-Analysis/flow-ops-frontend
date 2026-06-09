import { ChevronRight, ChevronUp } from 'lucide-react';
import type { IncidentRootCause } from '../api/flowOpsClient';
import { getSeverityClassName } from '../utils/incidentAnalysis';

interface IncidentRootCauseListProps {
  causes: IncidentRootCause[];
  expandedIndex?: number | null;
  onToggle?: (index: number) => void;
  compact?: boolean;
}

export function IncidentRootCauseList({
  causes,
  expandedIndex,
  onToggle,
  compact = false,
}: IncidentRootCauseListProps) {
  if (causes.length === 0) return null;

  return (
    <div className={compact ? 'space-y-3' : 'space-y-2'}>
      {causes.map((cause, index) => {
        const isExpanded = expandedIndex === undefined || expandedIndex === index;
        const severityClassName = getSeverityClassName(cause.severity);
        const key = `${cause.summary}-${index}`;

        if (!onToggle) {
          return (
            <div key={key} className="rounded-lg border border-[#1f1f28] bg-[#0a0a0f] p-3">
              <div className="mb-2 flex items-start gap-2">
                <span className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${severityClassName}`}>
                  {cause.severity}
                </span>
                <div className="text-sm font-medium text-white">{cause.summary}</div>
              </div>
              <RootCauseDetails cause={cause} compact={compact} />
            </div>
          );
        }

        return (
          <div key={key} className="overflow-hidden rounded-lg border border-[#1f1f28] bg-[#13131a]">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#1f1f28]"
              onClick={() => onToggle(index)}
            >
              <span className={`flex-shrink-0 rounded border px-2 py-0.5 text-xs font-semibold ${severityClassName}`}>
                {cause.severity}
              </span>
              <span className="flex-1 text-sm font-medium text-white">{cause.summary}</span>
              {isExpanded ? (
                <ChevronUp size={15} className="flex-shrink-0 text-gray-500" />
              ) : (
                <ChevronRight size={15} className="flex-shrink-0 text-gray-500" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t border-[#1f1f28] px-4 pb-4 pt-3">
                <RootCauseDetails cause={cause} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RootCauseDetails({ cause, compact = false }: { cause: IncidentRootCause; compact?: boolean }) {
  const textClassName = compact ? 'text-xs leading-5' : 'text-sm';

  return (
    <div className="space-y-3">
      {cause.suggested_fix && (
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-gray-500">Suggested Fix</div>
          <p className={`${textClassName} text-gray-300`}>{cause.suggested_fix}</p>
        </div>
      )}
      {cause.evidence?.length > 0 && (
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-gray-500">Evidence</div>
          <ul className="space-y-1">
            {cause.evidence.map((item, index) => (
              <li key={`${item}-${index}`} className={`${compact ? 'text-xs leading-5' : 'text-xs'} text-gray-400`}>
                - {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
