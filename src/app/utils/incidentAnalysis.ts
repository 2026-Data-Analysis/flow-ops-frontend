export const getSeverityClassName = (severity?: string) => {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'HIGH':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'MEDIUM':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export const parseMaybeJson = (value?: string) => {
  if (!value) return undefined;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};
