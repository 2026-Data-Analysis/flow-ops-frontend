import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  AppWindow,
  SlidersHorizontal,
  Settings,
  FlaskConical,
  Box,
  Workflow,
  Play,
  Menu,
  AlertTriangle,
  Search,
  MessageSquare
} from 'lucide-react';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuData: MenuSection[] = [
  {
    title: 'Setup',
    items: [
      { label: 'Registration', icon: <AppWindow size={18} />, path: '/app/registration' },
      { label: 'Application Settings', icon: <SlidersHorizontal size={18} />, path: '/app/settings' },
      { label: 'Environment Settings', icon: <Settings size={18} />, path: '/app/environment' },
      { label: 'API Management', icon: <Box size={18} />, path: '/qc/api' },
    ],
  },
  {
    title: 'Generate',
    items: [
      { label: 'Test Case Generation', icon: <FlaskConical size={18} />, path: '/qc/testcase' },
      { label: 'Scenario Builder', icon: <Workflow size={18} />, path: '/qc/scenario' },
    ],
  },
  {
    title: 'Execute',
    items: [
      { label: 'Run Tests', icon: <Play size={18} />, path: '/execution/run' },
    ],
  },
  {
    title: 'Analyze',
    items: [
      { label: 'Incident Dashboard', icon: <AlertTriangle size={18} />, path: '/monitoring/incidents' },
      { label: 'Execution History', icon: <Search size={18} />, path: '/monitoring/history' },
      { label: 'Response Assistant', icon: <MessageSquare size={18} />, path: '/monitoring/response' },
    ],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Setup': true,
    'Generate': true,
    'Execute': true,
    'Analyze': true,
  });

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <aside
      className={`h-screen bg-[#0a0a0f] border-r border-[#1f1f28] flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#1f1f28]">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FlaskConical size={18} className="text-white" />
            </div>
            <span className="text-white font-semibold">FlowOps</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-[#1f1f28] rounded-md transition-colors text-gray-400 hover:text-white"
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {menuData.map((section) => (
          <div key={section.title} className="mb-6">
            {!isCollapsed && (
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-gray-500 hover:text-gray-300 transition-colors mb-1"
              >
                <span className="text-xs uppercase tracking-wider font-medium">
                  {section.title}
                </span>
                {expandedSections[section.title] ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
            )}

            {(isCollapsed || expandedSections[section.title]) && (
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      location.pathname === item.path
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'text-gray-400 hover:text-white hover:bg-[#1f1f28]'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className={location.pathname === item.path ? 'text-blue-400' : ''}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="text-sm">{item.label}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-[#1f1f28]">
          <div className="text-xs text-gray-500">
            <div>Version 2.4.1</div>
            <div className="mt-1">© 2026 FlowOps</div>
          </div>
        </div>
      )}
    </aside>
  );
}
