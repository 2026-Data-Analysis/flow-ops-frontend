import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { 
  CheckCircle2, 
  XCircle,
  Download,
  RefreshCw,
  AlertCircle,
  Clock,
  MinusCircle,
  GitBranch,
  Shield,
  Target,
  Zap,
  AlertOctagon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface QCItem {
  id: string;
  scenario: string;
  preconditions: string;
  steps: string;
  expectedResult: string;
  actualResult: string;
  status: 'passed' | 'failed' | 'blocked';
  severity: 'critical' | 'high' | 'medium' | 'low';
  owner: string;
}

interface DomainSection {
  domain: string;
  items: QCItem[];
}

export function QCChecklist() {
  const [selectedApp, setSelectedApp] = useState('main-product');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('develop');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Branch policy configurations
  const branchPolicies = {
    'feature/*': {
      name: 'Feature Validation',
      purpose: 'Validate individual feature functionality before integration',
      scope: 'Feature-specific tests and unit-level validations',
      execution: 'On push to feature branch',
      failureHandling: 'Block merge; notify developer',
      color: 'purple',
      checksCount: 12
    },
    'develop': {
      name: 'Integration Validation',
      purpose: 'Validate merged features work together correctly',
      scope: 'Core flows and cross-domain checks',
      execution: 'On merge to develop',
      failureHandling: 'Alert team; create incident ticket',
      color: 'blue',
      checksCount: 47
    },
    'staging': {
      name: 'Pre-Production Validation',
      purpose: 'Comprehensive validation before production release',
      scope: 'Full regression suite + performance tests',
      execution: 'On merge to staging',
      failureHandling: 'Block production deployment',
      color: 'orange',
      checksCount: 89
    },
    'main': {
      name: 'Production Monitoring',
      purpose: 'Continuous monitoring and smoke tests on live environment',
      scope: 'Critical path monitoring + health checks',
      execution: 'Post-deployment and continuous',
      failureHandling: 'Immediate alert; auto-rollback if critical',
      color: 'green',
      checksCount: 28
    }
  };

  const currentPolicy = branchPolicies[selectedBranch];
  
  const qcData: DomainSection[] = [
    {
      domain: 'Authentication',
      items: [
        {
          id: 'AUTH-001',
          scenario: 'User Login with Valid Credentials',
          preconditions: 'User account exists in database; User is not logged in',
          steps: '1. Navigate to login page\n2. Enter valid email\n3. Enter valid password\n4. Click "Login" button',
          expectedResult: 'User is redirected to dashboard; Session token is created; User profile loads correctly',
          actualResult: 'User successfully logged in and redirected to dashboard within 0.8s',
          status: 'passed',
          severity: 'critical',
          owner: 'Sarah Chen'
        },
        {
          id: 'AUTH-002',
          scenario: 'Login with Invalid Credentials',
          preconditions: 'User is on login page',
          steps: '1. Navigate to login page\n2. Enter invalid email/password combination\n3. Click "Login" button',
          expectedResult: 'Error message displayed: "Invalid credentials"; User remains on login page; No session created',
          actualResult: 'Error message displayed correctly; User stays on login page',
          status: 'passed',
          severity: 'high',
          owner: 'Sarah Chen'
        },
        {
          id: 'AUTH-003',
          scenario: 'Password Reset Flow',
          preconditions: 'User account exists; User has access to registered email',
          steps: '1. Click "Forgot Password"\n2. Enter registered email\n3. Submit request\n4. Check email for reset link\n5. Click reset link\n6. Enter new password\n7. Confirm new password\n8. Submit',
          expectedResult: 'Reset email sent within 30s; Reset link valid for 1 hour; Password successfully updated; User can login with new password',
          actualResult: 'Reset email delayed by 2 minutes; Link works but confirmation unclear',
          status: 'failed',
          severity: 'high',
          owner: 'Sarah Chen'
        },
        {
          id: 'AUTH-004',
          scenario: 'Session Timeout After Inactivity',
          preconditions: 'User is logged in; Session timeout set to 30 minutes',
          steps: '1. Login to application\n2. Leave browser idle for 30 minutes\n3. Attempt to interact with application',
          expectedResult: 'User is logged out automatically; Redirect to login page with timeout message',
          status: 'blocked',
          actualResult: 'Testing blocked - awaiting session management update',
          severity: 'medium',
          owner: 'Marcus Kim'
        }
      ]
    },
    {
      domain: 'Payment',
      items: [
        {
          id: 'PAY-001',
          scenario: 'Credit Card Payment Processing',
          preconditions: 'User has items in cart; Payment gateway is accessible; Test credit card available',
          steps: '1. Proceed to checkout\n2. Enter shipping information\n3. Select credit card payment\n4. Enter test card: 4242 4242 4242 4242\n5. Enter valid expiry and CVV\n6. Submit payment',
          expectedResult: 'Payment processed within 3s; Order confirmation displayed; Confirmation email sent; Order appears in order history',
          actualResult: 'Payment processed in 2.3s; All confirmations working',
          status: 'passed',
          severity: 'critical',
          owner: 'Alex Torres'
        },
        {
          id: 'PAY-002',
          scenario: 'Payment Failure Handling',
          preconditions: 'User at checkout; Invalid card available for testing',
          steps: '1. Proceed to checkout\n2. Enter invalid/declined card\n3. Submit payment',
          expectedResult: 'Clear error message displayed; Cart items preserved; User can retry payment; No duplicate charges',
          actualResult: 'Error message unclear - shows "Payment failed" without details',
          status: 'failed',
          severity: 'high',
          owner: 'Alex Torres'
        },
        {
          id: 'PAY-003',
          scenario: 'Multiple Currency Support',
          preconditions: 'Application supports USD, EUR, GBP; User location set',
          steps: '1. Change currency selector\n2. Add items to cart\n3. Verify pricing in selected currency\n4. Complete checkout',
          expectedResult: 'Prices converted accurately; Payment processed in correct currency; Receipt shows correct currency',
          actualResult: 'Currency conversion accurate; Payment successful',
          status: 'passed',
          severity: 'medium',
          owner: 'Alex Torres'
        },
        {
          id: 'PAY-004',
          scenario: 'Refund Processing',
          preconditions: 'Completed order exists; Order is eligible for refund',
          steps: '1. Navigate to order history\n2. Select order\n3. Request refund\n4. Confirm refund request\n5. Verify refund status',
          expectedResult: 'Refund request submitted; Admin notified; Refund processed within 5-7 business days; Customer notified of refund status',
          actualResult: 'Testing blocked - refund API integration incomplete',
          status: 'blocked',
          severity: 'high',
          owner: 'Alex Torres'
        }
      ]
    },
    {
      domain: 'Order',
      items: [
        {
          id: 'ORD-001',
          scenario: 'Add Items to Cart',
          preconditions: 'User browsing product catalog; Products have inventory',
          steps: '1. Browse to product page\n2. Select product options (size, color, etc.)\n3. Click "Add to Cart"\n4. Verify cart count updates',
          expectedResult: 'Product added to cart; Cart count increments; Toast notification shown; Cart total updates correctly',
          actualResult: 'All functionality working as expected',
          status: 'passed',
          severity: 'critical',
          owner: 'Jennifer Wu'
        },
        {
          id: 'ORD-002',
          scenario: 'Cart Persistence Across Sessions',
          preconditions: 'User has items in cart; User is logged in',
          steps: '1. Add items to cart\n2. Logout\n3. Close browser\n4. Reopen browser\n5. Login again\n6. Check cart',
          expectedResult: 'Cart items persist after logout/login; Quantities preserved; Cart total accurate',
          actualResult: 'Cart items persisted correctly',
          status: 'passed',
          severity: 'high',
          owner: 'Jennifer Wu'
        },
        {
          id: 'ORD-003',
          scenario: 'Order History Display',
          preconditions: 'User has completed at least one order',
          steps: '1. Navigate to "My Orders"\n2. View order list\n3. Click on specific order\n4. View order details',
          expectedResult: 'All orders displayed in chronological order; Order details accurate; Tracking information visible; Invoice downloadable',
          actualResult: 'Order list correct but date sorting inconsistent',
          status: 'failed',
          severity: 'medium',
          owner: 'Jennifer Wu'
        },
        {
          id: 'ORD-004',
          scenario: 'Inventory Management on Checkout',
          preconditions: 'Product with limited inventory (qty: 5)',
          steps: '1. Add 3 units to cart\n2. Proceed to checkout\n3. During checkout, another user purchases 3 units\n4. Complete checkout',
          expectedResult: 'System detects insufficient inventory; User notified of inventory change; Cart updated; User can adjust order or cancel',
          actualResult: 'Inventory check working correctly',
          status: 'passed',
          severity: 'high',
          owner: 'Jennifer Wu'
        }
      ]
    },
    {
      domain: 'Search',
      items: [
        {
          id: 'SRC-001',
          scenario: 'Basic Keyword Search',
          preconditions: 'Product catalog loaded; Search index up to date',
          steps: '1. Enter search term in search bar\n2. Press Enter or click Search\n3. Review results',
          expectedResult: 'Results returned within 1s; Relevant products displayed first; Result count shown; Filters available',
          actualResult: 'Search returns results in 0.6s; Relevance algorithm working',
          status: 'passed',
          severity: 'high',
          owner: 'David Park'
        },
        {
          id: 'SRC-002',
          scenario: 'Search with Filters',
          preconditions: 'Search results displayed; Multiple filter options available',
          steps: '1. Perform search\n2. Apply price range filter\n3. Apply category filter\n4. Apply brand filter\n5. Verify results update',
          expectedResult: 'Results filtered correctly; Multiple filters work together; Filter count updates; Clear filters option available',
          actualResult: 'Filters working but combination of 3+ filters causes slow response (3.2s)',
          status: 'failed',
          severity: 'medium',
          owner: 'David Park'
        },
        {
          id: 'SRC-003',
          scenario: 'Search Autocomplete',
          preconditions: 'User typing in search field',
          steps: '1. Start typing product name\n2. Observe autocomplete suggestions\n3. Click on suggestion\n4. Verify navigation',
          expectedResult: 'Suggestions appear after 2 characters; Suggestions relevant to input; Clicking suggestion navigates to product/search',
          actualResult: 'Autocomplete working as expected',
          status: 'passed',
          severity: 'medium',
          owner: 'David Park'
        },
        {
          id: 'SRC-004',
          scenario: 'No Results Handling',
          preconditions: 'User searches for non-existent product',
          steps: '1. Enter search term with no matches\n2. Submit search\n3. Review results page',
          expectedResult: 'Friendly "no results" message displayed; Suggestions for alternative searches; Popular products shown; Search tips provided',
          actualResult: 'No results page incomplete - missing alternative suggestions',
          status: 'failed',
          severity: 'low',
          owner: 'David Park'
        }
      ]
    },
    {
      domain: 'Notification',
      items: [
        {
          id: 'NOT-001',
          scenario: 'Email Notification on Order Confirmation',
          preconditions: 'User has valid email address; Order placed successfully',
          steps: '1. Complete checkout process\n2. Verify order confirmation\n3. Check email inbox\n4. Verify email content',
          expectedResult: 'Email sent within 2 minutes; Email contains order details; Email formatted correctly; Links in email work',
          actualResult: 'Email sent immediately; All content correct',
          status: 'passed',
          severity: 'high',
          owner: 'Maria Lopez'
        },
        {
          id: 'NOT-002',
          scenario: 'Push Notification for Order Updates',
          preconditions: 'User has app installed; Push notifications enabled',
          steps: '1. Place order\n2. Order status changes (processing, shipped, delivered)\n3. Verify push notifications received',
          expectedResult: 'Push notification sent for each status change; Notification contains relevant details; Tapping notification opens app to order details',
          actualResult: 'Notifications sent but "delivered" status notification missing',
          status: 'failed',
          severity: 'medium',
          owner: 'Maria Lopez'
        },
        {
          id: 'NOT-003',
          scenario: 'In-App Notification Center',
          preconditions: 'User logged in; Multiple notifications available',
          steps: '1. Navigate to notification center\n2. View notification list\n3. Mark notifications as read\n4. Delete notifications',
          expectedResult: 'All notifications displayed in chronological order; Read/unread status tracked; Delete functionality works; Notification count updates',
          actualResult: 'All functionality working correctly',
          status: 'passed',
          severity: 'medium',
          owner: 'Maria Lopez'
        }
      ]
    }
  ];

  // Calculate overall statistics
  const allItems = qcData.flatMap(section => section.items);
  const overallStats = {
    total: allItems.length,
    passed: allItems.filter(item => item.status === 'passed').length,
    failed: allItems.filter(item => item.status === 'failed').length,
    blocked: allItems.filter(item => item.status === 'blocked').length,
    lastRun: '2 hours ago'
  };

  // Get domain-specific statistics
  const getDomainStats = (domainName: string) => {
    const section = qcData.find(s => s.domain === domainName);
    if (!section) return { total: 0, passed: 0, failed: 0, blocked: 0 };
    
    return {
      total: section.items.length,
      passed: section.items.filter(item => item.status === 'passed').length,
      failed: section.items.filter(item => item.status === 'failed').length,
      blocked: section.items.filter(item => item.status === 'blocked').length,
    };
  };

  // Get active domain data
  const getActiveData = () => {
    if (activeTab === 'all') {
      return { items: allItems, stats: overallStats };
    }
    const section = qcData.find(s => s.domain.toLowerCase() === activeTab);
    if (!section) return { items: [], stats: { total: 0, passed: 0, failed: 0, blocked: 0 } };
    
    const stats = getDomainStats(section.domain);
    return { items: section.items, stats };
  };

  const activeData = getActiveData();

  const getStatusIcon = (status: QCItem['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="size-4 text-green-600" />;
      case 'failed':
        return <XCircle className="size-4 text-red-600" />;
      case 'blocked':
        return <MinusCircle className="size-4 text-orange-600" />;
    }
  };

  const getStatusBadge = (status: QCItem['status']) => {
    const styles = {
      passed: 'bg-green-50 text-green-700 border-green-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
      blocked: 'bg-orange-50 text-orange-700 border-orange-200'
    };
    return (
      <Badge variant="outline" className={styles[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: QCItem['severity']) => {
    const styles = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-slate-100 text-slate-700 border-slate-300'
    };
    return (
      <Badge variant="outline" className={styles[severity]}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">QC Checklist</h1>
          <p className="text-sm md:text-base text-slate-600 mt-1">Comprehensive quality assurance testing documentation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 md:flex-none text-sm">
            <RefreshCw className="size-4 mr-2" />
            <span className="hidden sm:inline">Run Tests</span>
            <span className="sm:hidden">Run</span>
          </Button>
          <Button variant="outline" className="flex-1 md:flex-none text-sm">
            <Download className="size-4 mr-2" />
            <span className="hidden sm:inline">Export Report</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      {/* App Selector - Responsive */}
      <div>
        <Select value={selectedApp} onValueChange={setSelectedApp}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="main-product">Main Product App</SelectItem>
            <SelectItem value="customer-portal">Customer Portal</SelectItem>
            <SelectItem value="admin-dashboard">Admin Dashboard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Branch Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Branch for QC Policy
        </label>
        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="feature/*">
              <div className="flex items-center gap-2">
                <GitBranch className="size-4" />
                <span>feature/* - Feature Branches</span>
              </div>
            </SelectItem>
            <SelectItem value="develop">
              <div className="flex items-center gap-2">
                <GitBranch className="size-4" />
                <span>develop - Development Branch</span>
              </div>
            </SelectItem>
            <SelectItem value="staging">
              <div className="flex items-center gap-2">
                <GitBranch className="size-4" />
                <span>staging - Staging Branch</span>
              </div>
            </SelectItem>
            <SelectItem value="main">
              <div className="flex items-center gap-2">
                <GitBranch className="size-4" />
                <span>main - Production Branch</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Branch Policy Summary Banner */}
      <Card className={`border-0 shadow-lg overflow-hidden bg-gradient-to-br ${
        currentPolicy.color === 'purple' ? 'from-purple-50 to-indigo-50' :
        currentPolicy.color === 'blue' ? 'from-blue-50 to-cyan-50' :
        currentPolicy.color === 'orange' ? 'from-orange-50 to-amber-50' :
        'from-green-50 to-emerald-50'
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                currentPolicy.color === 'purple' ? 'bg-purple-600' :
                currentPolicy.color === 'blue' ? 'bg-blue-600' :
                currentPolicy.color === 'orange' ? 'bg-orange-600' :
                'bg-green-600'
              }`}>
                <Shield className="size-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-bold text-slate-900">{currentPolicy.name}</h3>
                  <Badge className={`${
                    currentPolicy.color === 'purple' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                    currentPolicy.color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    currentPolicy.color === 'orange' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    'bg-green-100 text-green-700 border-green-200'
                  } font-mono`}>
                    {selectedBranch}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">Active QC policy configuration for this branch</p>
              </div>
            </div>
            <Badge className="bg-white/80 text-slate-700 border-slate-300 px-3 py-1 text-sm">
              {currentPolicy.checksCount} checks configured
            </Badge>
          </div>

          {/* Policy Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Purpose */}
            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className={`size-4 ${
                  currentPolicy.color === 'purple' ? 'text-purple-600' :
                  currentPolicy.color === 'blue' ? 'text-blue-600' :
                  currentPolicy.color === 'orange' ? 'text-orange-600' :
                  'text-green-600'
                }`} />
                <h4 className="font-semibold text-slate-900 text-sm">Validation Purpose</h4>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{currentPolicy.purpose}</p>
            </div>

            {/* Scope */}
            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className={`size-4 ${
                  currentPolicy.color === 'purple' ? 'text-purple-600' :
                  currentPolicy.color === 'blue' ? 'text-blue-600' :
                  currentPolicy.color === 'orange' ? 'text-orange-600' :
                  'text-green-600'
                }`} />
                <h4 className="font-semibold text-slate-900 text-sm">Test Scope</h4>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{currentPolicy.scope}</p>
            </div>

            {/* Execution */}
            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className={`size-4 ${
                  currentPolicy.color === 'purple' ? 'text-purple-600' :
                  currentPolicy.color === 'blue' ? 'text-blue-600' :
                  currentPolicy.color === 'orange' ? 'text-orange-600' :
                  'text-green-600'
                }`} />
                <h4 className="font-semibold text-slate-900 text-sm">Execution Timing</h4>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{currentPolicy.execution}</p>
            </div>

            {/* Failure Handling */}
            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertOctagon className={`size-4 ${
                  currentPolicy.color === 'purple' ? 'text-purple-600' :
                  currentPolicy.color === 'blue' ? 'text-blue-600' :
                  currentPolicy.color === 'orange' ? 'text-orange-600' :
                  'text-green-600'
                }`} />
                <h4 className="font-semibold text-slate-900 text-sm">Failure Handling</h4>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{currentPolicy.failureHandling}</p>
            </div>
          </div>

          {/* Additional Info Banner */}
          <div className={`mt-4 p-3 rounded-lg border ${
            currentPolicy.color === 'purple' ? 'bg-purple-100/50 border-purple-200' :
            currentPolicy.color === 'blue' ? 'bg-blue-100/50 border-blue-200' :
            currentPolicy.color === 'orange' ? 'bg-orange-100/50 border-orange-200' :
            'bg-green-100/50 border-green-200'
          }`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`size-4 mt-0.5 ${
                currentPolicy.color === 'purple' ? 'text-purple-700' :
                currentPolicy.color === 'blue' ? 'text-blue-700' :
                currentPolicy.color === 'orange' ? 'text-orange-700' :
                'text-green-700'
              }`} />
              <p className="text-xs text-slate-700">
                <span className="font-semibold">Policy Overview:</span> This policy ensures quality standards are met for the <span className="font-mono">{selectedBranch}</span> branch. 
                {currentPolicy.color === 'blue' && ' Tests run automatically when features are merged to validate integration points.'}
                {currentPolicy.color === 'purple' && ' Quick validation before integration to catch issues early.'}
                {currentPolicy.color === 'orange' && ' Comprehensive pre-release validation before production deployment.'}
                {currentPolicy.color === 'green' && ' Continuous monitoring ensures production stability.'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Overall Summary Statistics - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <Card className="p-4 md:p-5 border-0 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-slate-600">Total QC Items</p>
              <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{overallStats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-5 border-0 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-slate-600">Passed</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600 mt-1">{overallStats.passed}</p>
            </div>
            <div className="p-2 md:p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="size-5 md:size-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-5 border-0 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-slate-600">Failed</p>
              <p className="text-2xl md:text-3xl font-bold text-red-600 mt-1">{overallStats.failed}</p>
            </div>
            <div className="p-2 md:p-3 bg-red-100 rounded-lg">
              <XCircle className="size-5 md:size-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-5 border-0 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-slate-600">Blocked</p>
              <p className="text-2xl md:text-3xl font-bold text-orange-600 mt-1">{overallStats.blocked}</p>
            </div>
            <div className="p-2 md:p-3 bg-orange-100 rounded-lg">
              <MinusCircle className="size-5 md:size-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-5 border-0 shadow-md col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-slate-600">Last Run</p>
              <p className="text-lg md:text-xl font-bold text-slate-900 mt-1">{overallStats.lastRun}</p>
            </div>
            <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
              <Clock className="size-5 md:size-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Domain Tabs */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="border-b border-slate-200">
          <div className="flex px-2">
            {/* All Domains Tab */}
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-4 font-medium text-sm transition-colors relative ${
                activeTab === 'all'
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>All Domains</span>
                {overallStats.failed > 0 && (
                  <Badge className="bg-red-100 text-red-700 border-red-200">
                    {overallStats.failed}
                  </Badge>
                )}
              </div>
              {activeTab === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>

            {/* Domain Tabs */}
            {qcData.map((section) => {
              const stats = getDomainStats(section.domain);
              const tabKey = section.domain.toLowerCase();
              
              return (
                <button
                  key={section.domain}
                  onClick={() => setActiveTab(tabKey)}
                  className={`px-6 py-4 font-medium text-sm transition-colors relative ${
                    activeTab === tabKey
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{section.domain}</span>
                    {stats.failed > 0 && (
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        {stats.failed}
                      </Badge>
                    )}
                  </div>
                  {activeTab === tabKey && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Domain Summary Stats */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-8">
            <div>
              <span className="text-sm text-slate-600">Total: </span>
              <span className="text-sm font-semibold text-slate-900">{activeData.stats.total}</span>
            </div>
            <div>
              <span className="text-sm text-slate-600">Passed: </span>
              <span className="text-sm font-semibold text-green-700">{activeData.stats.passed}</span>
            </div>
            <div>
              <span className="text-sm text-slate-600">Failed: </span>
              <span className="text-sm font-semibold text-red-700">{activeData.stats.failed}</span>
            </div>
            <div>
              <span className="text-sm text-slate-600">Blocked: </span>
              <span className="text-sm font-semibold text-orange-700">{activeData.stats.blocked}</span>
            </div>
          </div>
        </div>

        {/* Desktop Table View - Hidden on mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 lg:px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider lg:w-24">
                  QC ID
                </th>
                <th className="px-3 lg:px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider lg:w-48">
                  Test Scenario
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-40">
                  Preconditions
                </th>
                <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-44">
                  Steps
                </th>
                <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-44">
                  Expected Result
                </th>
                <th className="px-3 lg:px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider lg:w-44">
                  Actual Result
                </th>
                <th className="px-3 lg:px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider lg:w-24">
                  Status
                </th>
                <th className="px-3 lg:px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider lg:w-24">
                  Severity
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-32">
                  Owner
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {activeData.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 lg:px-4 py-3 lg:py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="font-mono text-xs lg:text-sm font-medium text-slate-900">
                        {item.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 lg:px-4 py-3 lg:py-4">
                    <p className="text-xs lg:text-sm font-medium text-slate-900">{item.scenario}</p>
                  </td>
                  <td className="hidden lg:table-cell px-4 py-4">
                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                      {item.preconditions}
                    </p>
                  </td>
                  <td className="hidden xl:table-cell px-4 py-4">
                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                      {item.steps}
                    </p>
                  </td>
                  <td className="hidden xl:table-cell px-4 py-4">
                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                      {item.expectedResult}
                    </p>
                  </td>
                  <td className="px-3 lg:px-4 py-3 lg:py-4">
                    <p className={`text-xs whitespace-pre-line leading-relaxed ${
                      item.status === 'passed' ? 'text-green-700' :
                      item.status === 'failed' ? 'text-red-700' :
                      'text-orange-700'
                    }`}>
                      {item.actualResult}
                    </p>
                  </td>
                  <td className="px-3 lg:px-4 py-3 lg:py-4">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-3 lg:px-4 py-3 lg:py-4">
                    {getSeverityBadge(item.severity)}
                  </td>
                  <td className="hidden lg:table-cell px-4 py-4">
                    <p className="text-sm text-slate-900">{item.owner}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View - Shown only on mobile */}
        <div className="md:hidden divide-y divide-slate-200">
          {activeData.items.map((item) => (
            <div key={item.id} className="p-4 bg-white">
              {/* Card Header - Always visible */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-2 flex-1">
                  {getStatusIcon(item.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-slate-900">{item.id}</span>
                      {getSeverityBadge(item.severity)}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 leading-tight">{item.scenario}</h3>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(item.status)}
                </div>
              </div>

              {/* Quick Summary */}
              <div className="space-y-2 mb-3">
                <div>
                  <p className="text-xs font-medium text-slate-700 mb-0.5">Owner:</p>
                  <p className="text-xs text-slate-600">{item.owner}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700 mb-0.5">Actual Result:</p>
                  <p className={`text-xs leading-relaxed ${
                    item.status === 'passed' ? 'text-green-700' :
                    item.status === 'failed' ? 'text-red-700' :
                    'text-orange-700'
                  }`}>
                    {item.actualResult}
                  </p>
                </div>
              </div>

              {/* Expand Button */}
              <button
                onClick={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
                className="flex items-center gap-2 text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors"
              >
                {expandedCard === item.id ? (
                  <>
                    <ChevronUp className="size-4" />
                    <span>Hide Details</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-4" />
                    <span>Show Details</span>
                  </>
                )}
              </button>

              {/* Expanded Details */}
              {expandedCard === item.id && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-1">Preconditions:</p>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {item.preconditions}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-1">Steps:</p>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {item.steps}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-1">Expected Result:</p>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {item.expectedResult}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}