import { lazy, Suspense, useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { FlowIndicator } from './FlowIndicator';
import { TestProvider } from '../contexts/TestContext';
import { allowMockData } from '../config/runtime';
import { OrchestratorAgent } from './OrchestratorAgent';

type ThemeMode = 'dark' | 'light';

const DevAIAssistant = allowMockData
  ? lazy(() => import('./AIAssistant').then((module) => ({ default: module.AIAssistant })))
  : null;

export function Layout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'dark';
    }

    return window.localStorage.getItem('flowops-theme') === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    const syncSidebar = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };

    syncSidebar();
    window.addEventListener('resize', syncSidebar);

    return () => window.removeEventListener('resize', syncSidebar);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('flowops-theme', theme);
  }, [theme]);

  return (
    <TestProvider>
      <div
        className={`${theme === 'dark' ? 'dark' : ''} h-screen flex overflow-hidden bg-[#060609]`}
        data-theme={theme}
      >
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar theme={theme} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
          <FlowIndicator />
          <Outlet />
        </div>
        <OrchestratorAgent />
        {DevAIAssistant && (
          <Suspense fallback={null}>
            <DevAIAssistant />
          </Suspense>
        )}
      </div>
    </TestProvider>
  );
}
