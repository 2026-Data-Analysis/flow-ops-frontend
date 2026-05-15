import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Github, Loader2, Moon, Sun, User } from 'lucide-react';
import { useTestContext } from '../contexts/TestContext';
import {
  flowOpsApi,
  rememberAppId,
  rememberAppTitle,
  type RepositoryResponse,
} from '../api/flowOpsClient';

interface TopBarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const REGISTERED_REPOSITORIES_KEY = 'flowOps.registeredRepositories';

interface HeaderApplication {
  id: number;
  appId: number;
  projectId: number;
  title: string;
  fullName: string;
}

const readStoredApplications = (): HeaderApplication[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(REGISTERED_REPOSITORIES_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed
          .filter((item) => item?.appId && item?.id)
          .map((item) => ({
            id: Number(item.id),
            appId: Number(item.appId),
            projectId: Number(item.projectId || 0),
            title: String(item.title || item.appTitle || item.fullName?.split('/').pop() || 'Untitled Application'),
            fullName: String(item.fullName || 'Unknown repository'),
          }))
      : [];
  } catch {
    return [];
  }
};

const normalizeRepository = (
  repository: RepositoryResponse,
  storedApplications: HeaderApplication[],
): HeaderApplication | null => {
  const stored = storedApplications.find(
    (item) => item.id === repository.id || item.fullName === repository.fullName,
  );
  const appId = repository.appId || stored?.appId;
  if (!appId) return null;

  return {
    id: repository.id,
    appId,
    projectId: repository.projectId,
    title: repository.appTitle || stored?.title || repository.fullName.split('/').pop() || repository.fullName,
    fullName: repository.fullName,
  };
};

export function TopBar({ theme, onToggleTheme }: TopBarProps) {
  const { activeApplication, setActiveApplication } = useTestContext();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
  const [applications, setApplications] = useState<HeaderApplication[]>(() => readStoredApplications());
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [applicationError, setApplicationError] = useState<string | null>(null);

  useEffect(() => {
    const handleClickAway = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsAppMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, []);

  useEffect(() => {
    const syncStoredApplications = () => {
      setApplications(readStoredApplications());
    };

    window.addEventListener('flowOps.applicationChanged', syncStoredApplications);
    window.addEventListener('storage', syncStoredApplications);
    return () => {
      window.removeEventListener('flowOps.applicationChanged', syncStoredApplications);
      window.removeEventListener('storage', syncStoredApplications);
    };
  }, []);

  const loadApplications = async () => {
    setIsLoadingApplications(true);
    setApplicationError(null);
    const storedApplications = readStoredApplications();
    setApplications(storedApplications);

    try {
      const project = await flowOpsApi.ensureProject();
      const repositories = await flowOpsApi.listRepositories(project.id);
      const normalized = repositories
        .map((repository) => normalizeRepository(repository, storedApplications))
        .filter(Boolean) as HeaderApplication[];

      if (normalized.length > 0) {
        setApplications(normalized);
      }
    } catch (error) {
      setApplicationError(
        error instanceof Error
          ? `${error.message} Stored applications are shown.`
          : 'Application list API is unavailable. Stored applications are shown.',
      );
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const handleToggleApplicationMenu = () => {
    const nextOpen = !isAppMenuOpen;
    setIsAppMenuOpen(nextOpen);
    if (nextOpen) {
      loadApplications();
    }
  };

  const handleSelectApplication = async (application: HeaderApplication) => {
    setApplicationError(null);
    try {
      await flowOpsApi.setMainApp(application.appId, { title: application.title });
    } catch (error) {
      setApplicationError(
        error instanceof Error ? `${error.message} Local main application was updated.` : 'Main application API failed.',
      );
    } finally {
      rememberAppId(application.appId);
      rememberAppTitle(application.title);
      setActiveApplication({ appId: application.appId, title: application.title });
      setIsAppMenuOpen(false);
    }
  };

  return (
    <header className="responsive-topbar h-16 bg-[#0a0a0f] border-b border-[#1f1f28] flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Application Selector */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={handleToggleApplicationMenu}
            className="flex min-w-[220px] max-w-[280px] items-center gap-2 rounded-lg border border-[#1f1f28] bg-[#13131a] px-3 py-2 transition-colors hover:border-[#2f2f38] max-sm:min-w-0"
            aria-expanded={isAppMenuOpen}
            aria-haspopup="menu"
          >
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-semibold text-white">
              {activeApplication.title.charAt(0).toUpperCase() || 'A'}
            </div>
            <span className="flex-1 truncate text-left text-sm text-white">{activeApplication.title}</span>
            {isLoadingApplications && isAppMenuOpen ? (
              <Loader2 size={16} className="flex-shrink-0 animate-spin text-gray-500" />
            ) : (
              <ChevronDown size={16} className="flex-shrink-0 text-gray-500" />
            )}
          </button>

          {isAppMenuOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-[320px] overflow-hidden rounded-lg border border-[#1f1f28] bg-[#13131a] shadow-xl">
              <div className="border-b border-[#1f1f28] px-3 py-2">
                <div className="text-xs font-medium uppercase tracking-wider text-gray-500">Applications</div>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {isLoadingApplications && applications.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-gray-500">
                    <Loader2 size={16} className="animate-spin" />
                    Loading applications...
                  </div>
                ) : applications.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-gray-500">
                    No registered applications.
                  </div>
                ) : (
                  applications.map((application) => {
                    const isActive = application.appId === activeApplication.appId;

                    return (
                      <button
                        key={`${application.id}-${application.appId}`}
                        type="button"
                        onClick={() => handleSelectApplication(application)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          isActive ? 'bg-blue-500/10 text-blue-300' : 'text-gray-300 hover:bg-[#1f1f28] hover:text-white'
                        }`}
                        role="menuitem"
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#0a0a0f] text-gray-400">
                          <Github size={17} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{application.title}</div>
                          <div className="truncate font-mono text-xs text-gray-500">{application.fullName}</div>
                        </div>
                        {isActive && <Check size={16} className="flex-shrink-0 text-blue-300" />}
                      </button>
                    );
                  })
                )}
              </div>
              {applicationError && (
                <div className="border-t border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
                  {applicationError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1f1f28] bg-[#13131a] text-gray-400 transition-all hover:border-[#2f2f38] hover:text-white"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

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
