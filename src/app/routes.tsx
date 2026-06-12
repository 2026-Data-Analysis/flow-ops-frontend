import { createBrowserRouter, isRouteErrorResponse, Navigate, useRouteError } from 'react-router';
import { Layout } from './components/Layout';
import { MainContent } from './components/MainContent';
import { RegistrationPage } from './components/RegistrationPage';
import { ApplicationSettingsPage } from './components/ApplicationSettingsPage';
import { EnvironmentSettingsPage } from './components/EnvironmentSettingsPage';
import { ApiManagementPage } from './components/ApiManagementPage';
import { ScenarioBuilderPage } from './components/ScenarioBuilderPage';
import { TestExecutionPage } from './components/TestExecutionPage';
import { TestCaseGenerationPage } from './components/TestCaseGenerationPage';
import { ExecutionListPage } from './components/ExecutionListPage';
import { LogDetailPage } from './components/LogDetailPage';
import { IncidentDashboard } from './components/IncidentDashboard';
import { ResponseAssistantPage } from './components/ResponseAssistantPage';

function RouteErrorBoundary() {
  const error = useRouteError();
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.stack || error.message
      : String(error ?? '');
  const showDetail = import.meta.env.DEV && detail;

  return (
    <div className="min-h-screen bg-[#060609] text-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-xl border border-red-500/20 bg-[#13131a] p-5 shadow-2xl">
        <p className="text-base font-semibold text-white">화면을 불러오는 중 문제가 발생했습니다.</p>
        <p className="mt-1 text-sm text-gray-400">잠시 후 다시 시도해주세요.</p>
        {showDetail && (
          <details className="mt-4 rounded-lg border border-[#2a2a35] bg-[#0d0d12] p-3 text-xs text-gray-400">
            <summary className="cursor-pointer text-gray-300">상세 오류</summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap font-mono">{detail}</pre>
          </details>
        )}
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      { index: true, Component: TestCaseGenerationPage },
      { path: 'app/registration', Component: RegistrationPage },
      { path: 'app/settings', Component: ApplicationSettingsPage },
      { path: 'app/environment', Component: EnvironmentSettingsPage },
      { path: 'qc/api', Component: ApiManagementPage },
      { path: 'qc/testcase', Component: TestCaseGenerationPage },
      { path: 'qc/scenario', Component: ScenarioBuilderPage },
      { path: 'execution/run', Component: TestExecutionPage },
      { path: 'monitoring/incidents', Component: IncidentDashboard },
      { path: 'monitoring/history', Component: ExecutionListPage },
      { path: 'monitoring/logs/:runId', Component: LogDetailPage },
      { path: 'monitoring/response', Component: ResponseAssistantPage },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
