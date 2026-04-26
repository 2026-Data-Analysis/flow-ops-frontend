import { ChevronDown, User } from 'lucide-react';
import { useTestContext } from '../contexts/TestContext';

export function TopBar() {
  const { environment, setEnvironment } = useTestContext();

  return (
    <header className="responsive-topbar h-16 bg-[#0a0a0f] border-b border-[#1f1f28] flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Project Selector */}
        <div className="flex items-center gap-2 bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-2 hover:border-[#2f2f38] transition-colors cursor-pointer min-w-[200px] max-sm:min-w-0">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center text-white text-xs font-semibold">
            P
          </div>
          <span className="text-white text-sm flex-1">Production API</span>
          <ChevronDown size={16} className="text-gray-500" />
        </div>

        {/* Environment Badge */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="relative group">
            <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
              <span className={`w-2 h-2 rounded-full ${
                environment === 'dev' ? 'bg-yellow-500' :
                environment === 'staging' ? 'bg-blue-500' :
                'bg-green-500'
              }`}></span>
              <span className="capitalize">{environment}</span>
              <ChevronDown size={12} />
            </button>

            {/* Dropdown */}
            <div className="absolute top-full left-0 mt-2 bg-[#13131a] border border-[#1f1f28] rounded-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button
                onClick={() => setEnvironment('dev')}
                className="w-full px-4 py-2 text-xs text-left hover:bg-[#1f1f28] transition-colors flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span className="text-gray-300">Dev</span>
              </button>
              <button
                onClick={() => setEnvironment('staging')}
                className="w-full px-4 py-2 text-xs text-left hover:bg-[#1f1f28] transition-colors flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-gray-300">Staging</span>
              </button>
              <button
                onClick={() => setEnvironment('prod')}
                className="w-full px-4 py-2 text-xs text-left hover:bg-[#1f1f28] transition-colors flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-gray-300">Prod</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* User Profile */}
        <div className="flex items-center gap-2 bg-[#13131a] border border-[#1f1f28] rounded-lg px-3 py-2 hover:border-[#2f2f38] transition-colors cursor-pointer">
          <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <ChevronDown size={16} className="text-gray-500" />
        </div>
      </div>
    </header>
  );
}
