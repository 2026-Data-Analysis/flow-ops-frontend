import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { MainContent } from './components/MainContent';
import { RegistrationPage } from './components/RegistrationPage';
import { EnvironmentSettingsPage } from './components/EnvironmentSettingsPage';
import { ApiManagementPage } from './components/ApiManagementPage';
import { ScenarioBuilderPage } from './components/ScenarioBuilderPage';
import { TestExecutionPage } from './components/TestExecutionPage';
import { TestCaseGenerationPage } from './components/TestCaseGenerationPage';
import { ExecutionListPage } from './components/ExecutionListPage';
import { LogDetailPage } from './components/LogDetailPage';
import { IncidentDashboard } from './components/IncidentDashboard';
import { ResponseAssistantPage } from './components/ResponseAssistantPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: TestCaseGenerationPage },
      { path: 'app/registration', Component: RegistrationPage },
      { path: 'app/environment', Component: EnvironmentSettingsPage },
      { path: 'qc/api', Component: ApiManagementPage },
      { path: 'qc/testcase', Component: TestCaseGenerationPage },
      { path: 'qc/scenario', Component: ScenarioBuilderPage },
      { path: 'execution/run', Component: TestExecutionPage },
      { path: 'monitoring/incidents', Component: IncidentDashboard },
      { path: 'monitoring/history', Component: ExecutionListPage },
      { path: 'monitoring/logs/:runId', Component: LogDetailPage },
      { path: 'monitoring/response', Component: ResponseAssistantPage },
    ],
  },
]);