import { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AIAssistant } from './AIAssistant';
import { FlowIndicator } from './FlowIndicator';
import { TestProvider } from '../contexts/TestContext';

export function Layout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <TestProvider>
      <div className="dark h-screen flex overflow-hidden bg-[#060609]">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar />
          <FlowIndicator />
          <Outlet />
        </div>
        <AIAssistant />
      </div>
    </TestProvider>
  );
}