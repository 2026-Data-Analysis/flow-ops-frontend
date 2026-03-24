import { Link, useLocation, Outlet } from 'react-router';
import { 
  LayoutDashboard, 
  FileCheck, 
  AlertCircle, 
  BarChart3, 
  PlusCircle,
  Zap,
  Settings
} from 'lucide-react';
import { cn } from './ui/utils';

const navItems = [
  {
    name: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Application Registration',
    path: '/register',
    icon: PlusCircle,
  },
  {
    name: 'QC Checklist',
    path: '/checklist',
    icon: FileCheck,
  },
  {
    name: 'Incident Analysis',
    path: '/incidents',
    icon: AlertCircle,
  },
  {
    name: 'Reports',
    path: '/reports',
    icon: BarChart3,
  },
  {
    name: 'QC Policy Settings',
    path: '/settings',
    icon: Settings,
  },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {/* Sidebar - Responsive: full width on desktop, collapsed on tablet */}
      <aside className="w-64 lg:w-64 md:w-20 bg-white border-r border-slate-200 flex flex-col fixed h-screen">
        {/* Logo/Brand */}
        <div className="p-6 md:p-4 lg:p-6 border-b border-slate-200">
          <div className="flex items-center gap-2 md:justify-center lg:justify-start">
            <div className="p-2 bg-blue-600 rounded-lg flex-shrink-0">
              <Zap className="size-6" />
            </div>
            <div className="md:hidden lg:block">
              <h1 className="font-bold text-slate-900">QualityAI</h1>
              <p className="text-xs text-slate-500">Operations Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 md:p-2 lg:p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  'md:justify-center lg:justify-start md:px-2 lg:px-4',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
                title={item.name}
              >
                <Icon className="size-5 flex-shrink-0" />
                <span className="md:hidden lg:block">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 md:p-2 lg:p-4 border-t border-slate-200">
          <div className="p-3 md:p-2 lg:p-3 bg-slate-50 rounded-lg md:text-center lg:text-left">
            <p className="text-xs text-slate-600 md:hidden lg:block">
              <span className="font-medium">Pro Plan</span> • 3 apps monitored
            </p>
            <p className="text-xs text-slate-600 md:block lg:hidden font-medium">Pro</p>
          </div>
        </div>
      </aside>

      {/* Main Content - Responsive margins */}
      <main className="flex-1 ml-64 md:ml-20 lg:ml-64">
        <Outlet />
      </main>
    </div>
  );
}