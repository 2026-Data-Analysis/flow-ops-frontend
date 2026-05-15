import { createContext, useContext, useState, ReactNode } from 'react';

interface API {
  id: string;
  name: string;
  endpoint: string;
  method: string;
}

interface TestContextType {
  selectedAPIs: API[];
  setSelectedAPIs: (apis: API[]) => void;
  activeApplication: {
    appId: number;
    title: string;
  };
  setActiveApplication: (application: { appId: number; title: string }) => void;
  environment: 'dev' | 'staging' | 'prod';
  setEnvironment: (env: 'dev' | 'staging' | 'prod') => void;
  testContext: {
    businessRules?: string[];
    edgeCases?: string[];
    dataConstraints?: string[];
  };
  setTestContext: (context: TestContextType['testContext']) => void;
  executionResults?: any;
  setExecutionResults: (results: any) => void;
}

const TestContext = createContext<TestContextType | undefined>(undefined);

export function TestProvider({ children }: { children: ReactNode }) {
  const [selectedAPIs, setSelectedAPIs] = useState<API[]>([]);
  const [activeApplication, setActiveApplicationState] = useState(() => ({
    appId: Number(localStorage.getItem('flowOps.appId') || 1),
    title: localStorage.getItem('flowOps.appTitle') || 'Production API',
  }));
  const [environment, setEnvironment] = useState<'dev' | 'staging' | 'prod'>('staging');
  const [testContext, setTestContext] = useState<TestContextType['testContext']>({});
  const [executionResults, setExecutionResults] = useState<any>(undefined);

  const setActiveApplication = (application: { appId: number; title: string }) => {
    localStorage.setItem('flowOps.appId', String(application.appId));
    localStorage.setItem('flowOps.appTitle', application.title);
    setActiveApplicationState(application);
    window.dispatchEvent(new Event('flowOps.applicationChanged'));
  };

  return (
    <TestContext.Provider
      value={{
        selectedAPIs,
        setSelectedAPIs,
        activeApplication,
        setActiveApplication,
        environment,
        setEnvironment,
        testContext,
        setTestContext,
        executionResults,
        setExecutionResults,
      }}
    >
      {children}
    </TestContext.Provider>
  );
}

export function useTestContext() {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error('useTestContext must be used within a TestProvider');
  }
  return context;
}
