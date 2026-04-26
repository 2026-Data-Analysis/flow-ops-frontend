import { useState } from 'react';
import { 
  Github, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  GitBranch,
  FileCode,
  Loader2,
  ChevronDown,
  Lock,
  Unlock,
  Calendar,
  Check
} from 'lucide-react';

interface Repository {
  id: string;
  name: string;
  visibility: 'public' | 'private';
  lastUpdated: string;
  owner: string;
}

const mockRepositories: Repository[] = [
  { id: '1', name: 'payment-service-api', visibility: 'private', lastUpdated: '2 days ago', owner: 'acme-corp' },
  { id: '2', name: 'user-authentication', visibility: 'private', lastUpdated: '5 days ago', owner: 'acme-corp' },
  { id: '3', name: 'order-management-system', visibility: 'private', lastUpdated: '1 week ago', owner: 'acme-corp' },
  { id: '4', name: 'inventory-service', visibility: 'public', lastUpdated: '3 days ago', owner: 'acme-corp' },
  { id: '5', name: 'notification-engine', visibility: 'private', lastUpdated: '2 weeks ago', owner: 'acme-corp' },
];

const mockBranches = ['main', 'develop', 'staging', 'feature/api-v2', 'hotfix/security-patch'];

export function RegistrationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  const steps = [
    { number: 1, label: 'Connect GitHub', completed: isGithubConnected },
    { number: 2, label: 'Select Repository', completed: selectedRepo !== null },
    { number: 3, label: 'Scan API', completed: scanComplete },
  ];

  const filteredRepos = mockRepositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGithubConnect = () => {
    setIsGithubConnected(true);
    setTimeout(() => setCurrentStep(2), 500);
  };

  const handleRepoSelect = (repo: Repository) => {
    setSelectedRepo(repo);
    setShowRepoDropdown(false);
    setTimeout(() => setCurrentStep(3), 500);
  };

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
    }, 2500);
  };

  const handleGenerateInventory = () => {
    // Action to generate API inventory
    alert('Generating API Inventory...');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#060609] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-white text-2xl mb-1">Application Registration</h1>
          <p className="text-gray-500 text-sm">Connect your repository and scan for API endpoints</p>
        </div>

        {/* Step Progress Indicator */}
        <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      step.completed
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : currentStep === step.number
                        ? 'border-blue-500 text-blue-500 bg-blue-500/10'
                        : 'border-[#1f1f28] text-gray-500 bg-[#13131a]'
                    }`}
                  >
                    {step.completed ? (
                      <Check size={20} />
                    ) : (
                      <span className="font-semibold">{step.number}</span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-sm ${
                      step.completed || currentStep === step.number
                        ? 'text-white'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-4 transition-all ${
                      step.completed ? 'bg-blue-500' : 'bg-[#1f1f28]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: GitHub Connection */}
        <div
          className={`bg-[#0a0a0f] border rounded-xl p-6 transition-all ${
            currentStep >= 1 ? 'border-[#1f1f28]' : 'border-[#1f1f28] opacity-50'
          }`}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-white text-lg mb-1">Connect GitHub</h2>
              <p className="text-gray-500 text-sm">Authorize access to your GitHub repositories</p>
            </div>
            {isGithubConnected && (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                <CheckCircle2 size={16} />
                Connected
              </div>
            )}
          </div>

          {!isGithubConnected ? (
            <button
              onClick={handleGithubConnect}
              className="flex items-center gap-3 bg-[#13131a] border border-[#1f1f28] rounded-lg px-6 py-3 text-white hover:border-blue-500/30 hover:bg-blue-500/5 transition-all w-full justify-center"
            >
              <Github size={20} />
              <span>Connect GitHub Account</span>
            </button>
          ) : (
            <div className="flex items-center gap-4 bg-[#13131a] border border-[#1f1f28] rounded-lg px-6 py-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Github size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">acme-corp</div>
                <div className="text-sm text-gray-500">github.com/acme-corp</div>
              </div>
              <CheckCircle2 size={20} className="text-green-400" />
            </div>
          )}
        </div>

        {/* Step 2: Repository Selection */}
        <div
          className={`bg-[#0a0a0f] border rounded-xl p-6 transition-all ${
            currentStep >= 2 ? 'border-[#1f1f28]' : 'border-[#1f1f28] opacity-50'
          }`}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-white text-lg mb-1">Select Repository</h2>
              <p className="text-gray-500 text-sm">Choose the repository you want to scan</p>
            </div>
            {selectedRepo && (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                <CheckCircle2 size={16} />
                Selected
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Repository Dropdown */}
            <div className="relative">
              <button
                onClick={() => currentStep >= 2 && setShowRepoDropdown(!showRepoDropdown)}
                disabled={currentStep < 2}
                className="w-full flex items-center justify-between bg-[#13131a] border border-[#1f1f28] rounded-lg px-4 py-3 text-white hover:border-[#2f2f38] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedRepo ? (
                  <div className="flex items-center gap-3">
                    <FileCode size={18} className="text-blue-400" />
                    <div className="text-left">
                      <div className="text-sm">{selectedRepo.owner}/{selectedRepo.name}</div>
                      <div className="text-xs text-gray-500">Updated {selectedRepo.lastUpdated}</div>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500">Select a repository...</span>
                )}
                <ChevronDown size={18} className="text-gray-500" />
              </button>

              {showRepoDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-[#13131a] border border-[#1f1f28] rounded-lg shadow-xl overflow-hidden">
                  {/* Search */}
                  <div className="p-3 border-b border-[#1f1f28]">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search repositories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0a0a0f] border border-[#1f1f28] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/30"
                      />
                    </div>
                  </div>

                  {/* Repository List */}
                  <div className="max-h-64 overflow-y-auto">
                    {filteredRepos.map((repo) => (
                      <button
                        key={repo.id}
                        onClick={() => handleRepoSelect(repo)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1f1f28] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileCode size={16} className="text-blue-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">
                              {repo.owner}/{repo.name}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                {repo.visibility === 'private' ? (
                                  <Lock size={12} />
                                ) : (
                                  <Unlock size={12} />
                                )}
                                {repo.visibility}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {repo.lastUpdated}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Branch Selection */}
            {selectedRepo && (
              <div className="relative">
                <label className="block text-sm text-gray-400 mb-2">Branch</label>
                <button
                  onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                  className="w-full flex items-center justify-between bg-[#13131a] border border-[#1f1f28] rounded-lg px-4 py-3 text-white hover:border-[#2f2f38] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <GitBranch size={16} className="text-gray-400" />
                    <span className="text-sm">{selectedBranch}</span>
                  </div>
                  <ChevronDown size={18} className="text-gray-500" />
                </button>

                {showBranchDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-[#13131a] border border-[#1f1f28] rounded-lg shadow-xl overflow-hidden">
                    {mockBranches.map((branch) => (
                      <button
                        key={branch}
                        onClick={() => {
                          setSelectedBranch(branch);
                          setShowBranchDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#1f1f28] transition-colors text-left"
                      >
                        <GitBranch size={14} className="text-gray-400" />
                        <span className="text-sm text-white">{branch}</span>
                        {branch === selectedBranch && (
                          <Check size={14} className="ml-auto text-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedRepo && !scanComplete && (
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isScanning ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Scanning Repository...
                </>
              ) : (
                'Scan Repository'
              )}
            </button>
          )}
        </div>

        {/* Step 3: Scan Results */}
        {scanComplete && (
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-white text-lg mb-1">Scan Results</h2>
                <p className="text-gray-500 text-sm">API detection completed successfully</p>
              </div>
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                <CheckCircle2 size={16} />
                Complete
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* OpenAPI Detection */}
              <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-sm text-gray-400">OpenAPI Specification</div>
                  <CheckCircle2 size={18} className="text-green-400" />
                </div>
                <div className="text-white font-medium mb-1">Detected</div>
                <div className="text-xs text-gray-500">openapi.yaml v3.0.1</div>
                <div className="mt-3 text-xs text-blue-400">47 endpoints found</div>
              </div>

              {/* Framework Detection */}
              <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-sm text-gray-400">Framework</div>
                  <CheckCircle2 size={18} className="text-green-400" />
                </div>
                <div className="text-white font-medium mb-1">Spring Boot</div>
                <div className="text-xs text-gray-500">Version 3.2.1</div>
                <div className="mt-3 text-xs text-blue-400">REST Controllers: 12</div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-[#13131a] border border-[#1f1f28] rounded-lg p-4 mb-6">
              <div className="text-sm text-white mb-3">Detected Endpoints</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">GET endpoints</span>
                  <span className="text-white font-mono">23</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">POST endpoints</span>
                  <span className="text-white font-mono">15</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">PUT endpoints</span>
                  <span className="text-white font-mono">6</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">DELETE endpoints</span>
                  <span className="text-white font-mono">3</span>
                </div>
              </div>
            </div>

            {/* Generate Inventory CTA */}
            <button
              onClick={handleGenerateInventory}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              Generate API Inventory
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
