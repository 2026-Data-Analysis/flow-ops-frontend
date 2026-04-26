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
  const [environment, setEnvironment] = useState<'dev' | 'staging' | 'prod'>('staging');
  const [testContext, setTestContext] = useState<TestContextType['testContext']>({});
  const [executionResults, setExecutionResults] = useState<any>(undefined);

  return (
    <TestContext.Provider
      value={{
        selectedAPIs,
        setSelectedAPIs,
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
