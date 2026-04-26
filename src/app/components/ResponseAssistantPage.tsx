import { useState } from 'react';
import { 
  MessageSquare,
  Copy,
  Save,
  Send,
  Sparkles,
  Users,
  Mail,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

type AudienceType = 'internal' | 'customer' | 'cs';
type MessageType = 'report' | 'message' | 'fix-guide' | 'escalation';

const mockIncidents = [
  { id: '1', title: 'Database connection timeout' },
  { id: '2', title: 'High latency in authentication' },
  { id: '3', title: 'API rate limit exceeded' },
];

const mockTemplates = [
  {
    id: '1',
    title: 'Database Incident Template',
    category: 'Database',
    preview: 'Database connection issues detected...',
  },
  {
    id: '2',
    title: 'API Performance Degradation',
    category: 'Performance',
    preview: 'We are experiencing slower than normal...',
  },
  {
    id: '3',
    title: 'Service Downtime Notice',
    category: 'Downtime',
    preview: 'We are currently experiencing...',
  },
];

const initialContent = {
  internal: {
    report: `**Incident Report: Database Connection Timeout**

**Severity:** Critical (P0)
**Status:** Under Investigation
**Started:** April 3, 2026 at 14:32 UTC
**Duration:** 23 minutes (ongoing)

**Summary:**
Authentication service experiencing database connection pool exhaustion. All available connections are in use or stuck, preventing new authentication requests from processing.

**Impact:**
- Affected endpoints: 3
- Failed requests: 1,284
- Affected users: ~245
- Services impacted: auth-service, user-service

**Root Cause:**
Connection pool size (max: 10) insufficient for current load. Slow queries holding connections for extended periods.

**Immediate Actions Taken:**
1. Alerted on-call engineers
2. Initiated connection pool monitoring
3. Prepared rollback plan

**Next Steps:**
1. Restart auth-service to clear stuck connections
2. Increase connection pool size to 25
3. Optimize slow queries
4. Add connection timeout (30s)

**Team Assignment:**
- Lead: @john.doe
- Database: @jane.smith
- DevOps: @mike.wilson`,
    
    message: `**Team Update: Database Incident**

Hi team,

We're currently investigating a critical database connectivity issue affecting our authentication service.

**What's happening:**
- Database connection pool is exhausted
- Authentication requests are failing
- Impact: ~245 users, 23 minutes duration

**Current status:**
Our team is actively working on the issue. We've identified the root cause and are implementing fixes.

**Action items:**
- [ ] Restart auth-service (ETA: 5 min)
- [ ] Increase connection pool size
- [ ] Optimize database queries

Will update in 10 minutes.

Thanks,
DevOps Team`,
    
    'fix-guide': `**Temporary Fix Guide: Database Connection Timeout**

**For:** Engineering Team
**Incident:** Database connection pool exhaustion

**Quick Fix (5 minutes):**
\`\`\`bash
# 1. Restart the auth-service
kubectl rollout restart deployment/auth-service

# 2. Verify pods are running
kubectl get pods -l app=auth-service

# 3. Check logs
kubectl logs -f deployment/auth-service
\`\`\`

**Short-term Fix (30 minutes):**
1. Update connection pool configuration:
\`\`\`javascript
// config/database.js
pool: {
  min: 5,
  max: 25,  // Increased from 10
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000
}
\`\`\`

2. Deploy updated configuration
3. Monitor connection pool metrics

**Monitoring:**
- Dashboard: https://grafana.company.com/db-connections
- Alert: #ops-alerts Slack channel

**If issue persists:**
Contact: @database-team or page on-call engineer`,
    
    escalation: `**ESCALATION REQUIRED**

**Incident:** Database Connection Timeout
**Severity:** P0 - Critical
**Escalating To:** Database Team Lead, CTO

**Reason for Escalation:**
Initial fix attempts unsuccessful. Issue persisting beyond 30 minutes affecting customer authentication.

**Attempted Actions:**
✓ Restarted auth-service
✓ Increased connection pool size
✓ Reviewed slow query logs
✗ Issue still occurring

**Current Impact:**
- Users unable to login: ~245
- Revenue impact: ~$12K/hour
- Customer support tickets: 47 new tickets
- Social media mentions: 12 complaints

**Required Assistance:**
1. Database expert to review connection pool behavior
2. Approval for emergency database scaling
3. Decision on customer communication timing

**Urgency:** IMMEDIATE
**Contact:** DevOps Team - Slack #incident-response`
  },
  customer: {
    report: `**Service Status Update**

We wanted to inform you about a recent service interruption affecting login functionality.

**What happened:**
Between 14:32 and 14:55 UTC on April 3, some users experienced difficulties logging into their accounts due to a database connectivity issue.

**Impact:**
- Duration: 23 minutes
- Affected feature: User authentication
- Affected users: Less than 2% of active users

**Resolution:**
Our engineering team quickly identified and resolved the issue. All services are now operating normally.

**What we're doing:**
- Monitoring systems closely
- Implementing additional safeguards
- Improving our infrastructure to prevent similar issues

We apologize for any inconvenience. If you continue experiencing issues, please contact support@company.com.`,
    
    message: `Hi there,

We're currently experiencing some technical difficulties that may affect your ability to log in. Our team is actively working to resolve this as quickly as possible.

**What you might notice:**
- Slow login times
- Occasional login failures
- Session timeout errors

**What you can do:**
- Please wait a few minutes and try again
- Clear your browser cache if issues persist
- Use the "Forgot Password" option if needed

We expect to have this resolved within 15 minutes. We apologize for the inconvenience and appreciate your patience.

Best regards,
The Support Team`,
    
    'fix-guide': `**Troubleshooting: Login Issues**

If you're experiencing login problems, please try these steps:

**Step 1: Basic Troubleshooting**
1. Refresh your browser page
2. Clear your browser cache and cookies
3. Try using a different browser
4. Check if you're using the correct email/password

**Step 2: Account Recovery**
1. Click "Forgot Password" on the login page
2. Enter your registered email address
3. Check your inbox for reset instructions
4. Follow the link to create a new password

**Step 3: Alternative Access**
- Try accessing from a different device
- Use our mobile app as an alternative
- Contact support if issues persist

**Need Help?**
Email: support@company.com
Live Chat: Available on our website
Phone: 1-800-SUPPORT (Mon-Fri, 9AM-5PM)

We're here to help!`,
    
    escalation: `**Customer Communication - Service Disruption**

Dear Customer,

We're writing to inform you about a service disruption that occurred on April 3, 2026.

**Incident Summary:**
- Issue: Authentication service interruption
- Time: 14:32 - 14:55 UTC
- Duration: 23 minutes
- Impact: Login functionality

**What Happened:**
A database connectivity issue temporarily prevented some users from logging in. Our engineering team immediately identified and resolved the problem.

**Resolution:**
All services have been restored and are operating normally. We've implemented additional monitoring and safeguards.

**Your Action Required:**
None. Your account and data remain secure. Please contact us if you experience any ongoing issues.

**Commitment:**
We take service reliability seriously and are conducting a thorough review to prevent similar incidents.

Thank you for your understanding.

Sincerely,
Customer Success Team`
  },
  cs: {
    report: `**CS Team Brief: Database Incident**

**Quick Reference:**
- Issue: Database connection timeout
- Impact: Login failures for some users
- Status: RESOLVED
- Duration: 14:32 - 14:55 UTC (23 min)

**For Customer Inquiries:**

"We experienced a brief technical issue affecting login functionality between 2:32 PM and 2:55 PM UTC today. The issue has been fully resolved and all services are operating normally. Your account and data remain secure."

**Expected Questions:**

Q: "I can't log in. Is this the same issue?"
A: The original issue is resolved. Please try clearing your cache or using password reset. If problems persist, we'll escalate to technical support.

Q: "Was my data affected?"
A: No customer data was accessed, modified, or lost. This was purely a connectivity issue.

Q: "Will this happen again?"
A: Our team has implemented additional safeguards and monitoring to prevent similar issues.

**Escalation Path:**
- Technical issues → #tech-support
- Billing concerns → #billing-team
- VIP/Enterprise → Tag @cs-lead

**Ticket Template:**
Category: Service Disruption
Priority: Normal (unless ongoing)
Tags: database-incident, april-2026`,
    
    message: `**CS Alert: Active Incident**

📢 **HEADS UP TEAM**

We have an active incident affecting user logins.

**Key Points:**
- Issue: Database connection problems
- Started: 14:32 UTC
- Impact: Some users can't log in
- Status: Team is working on it
- ETA: 10-15 minutes

**How to Respond:**

✅ DO:
- Acknowledge the issue
- Tell them we're working on it
- Provide ETA if available
- Offer password reset as workaround

❌ DON'T:
- Give technical details
- Promise specific timelines
- Blame other teams
- Share internal docs

**Sample Response:**
"Thanks for reaching out! We're aware of a technical issue affecting logins and our team is actively working on it. We expect to have this resolved within 15 minutes. In the meantime, you can try clearing your cache or using the password reset option."

**Updates:**
Watch #cs-updates for real-time information

Questions? Ping @cs-lead`,
    
    'fix-guide': `**CS Response Guide: Login Issues**

**Triage Questions:**
1. When did you first notice the issue?
2. What error message do you see?
3. Have you tried a different browser/device?
4. Is this for personal or business account?

**First Response (1-2 min):**
"Thank you for contacting us. I understand you're having trouble logging in. Let me help you resolve this right away."

**Troubleshooting Steps:**
1. ✓ Verify email spelling
2. ✓ Check Caps Lock
3. ✓ Try password reset
4. ✓ Clear browser cache
5. ✓ Try different browser
6. ✓ Check account status

**If Steps Don't Work:**
→ Escalate to #tech-support with:
- User email
- Ticket number
- Error message/screenshot
- Steps already tried

**Response Time SLAs:**
- VIP/Enterprise: < 5 min
- Premium: < 15 min
- Standard: < 1 hour

**Follow-up:**
Send follow-up email 24 hours later to confirm resolution`,
    
    escalation: `**CS ESCALATION: Multiple Login Complaints**

**Escalating To:** Tech Support Lead, DevOps

**Situation:**
Receiving high volume of login-related tickets. May indicate ongoing technical issue.

**Metrics:**
- New tickets: 47 in last 30 minutes
- Avg volume: ~5/hour (940% increase)
- Common keywords: "can't login", "timeout", "error"
- Affected users: Mix of free and premium

**Sample Complaints:**
1. "Been trying for 20 minutes, keeps timing out"
2. "Says incorrect password but it's definitely right"
3. "Gets stuck on loading screen"

**CS Actions Taken:**
- Sent holding responses
- Escalated to tech support
- Created internal alert
- Preparing customer communication

**Request:**
- Status update for customer communication
- ETA for resolution
- Approved messaging for social media

**Impact on CS:**
- Team capacity: 85% handling this issue
- Wait times: Increased to 12 minutes
- Satisfaction risk: HIGH

**Priority:** URGENT
**Channel:** #incident-response`
  }
};

export function ResponseAssistantPage() {
  const [selectedIncident, setSelectedIncident] = useState(mockIncidents[0].id);
  const [audience, setAudience] = useState<AudienceType>('internal');
  const [messageType, setMessageType] = useState<MessageType>('report');
  const [content, setContent] = useState(initialContent.internal.report);
  const [copied, setCopied] = useState(false);

  const handleAudienceChange = (newAudience: AudienceType) => {
    setAudience(newAudience);
    setContent(initialContent[newAudience][messageType]);
  };

  const handleMessageTypeChange = (newType: MessageType) => {
    setMessageType(newType);
    setContent(initialContent[audience][newType]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-hidden bg-[#060609] flex">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Response Assistant</h1>
              <p className="text-gray-400">AI-generated communication for incidents</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-[#13131a] border border-[#1f1f28] hover:bg-[#1a1a22] text-gray-300 rounded-xl font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle2 size={16} className="text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy
                  </>
                )}
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-[#13131a] border border-[#1f1f28] hover:bg-[#1a1a22] text-gray-300 rounded-xl font-medium transition-colors">
                <Save size={16} />
                Save
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
                <Send size={16} />
                Share
              </button>
            </div>
          </div>

          {/* Selectors */}
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 space-y-4">
            {/* Incident Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Select Incident</label>
              <select 
                value={selectedIncident}
                onChange={(e) => setSelectedIncident(e.target.value)}
                className="w-full px-4 py-3 bg-[#13131a] border border-[#1f1f28] rounded-xl text-white font-medium focus:outline-none focus:border-blue-500/30"
              >
                {mockIncidents.map((incident) => (
                  <option key={incident.id} value={incident.id}>{incident.title}</option>
                ))}
              </select>
            </div>

            {/* Audience Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Target Audience</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleAudienceChange('internal')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    audience === 'internal'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-[#1f1f28] hover:border-[#2f2f38] bg-[#13131a]'
                  }`}
                >
                  <Users size={24} className={audience === 'internal' ? 'text-blue-400 mb-2' : 'text-gray-500 mb-2'} />
                  <div className={`font-medium ${audience === 'internal' ? 'text-blue-400' : 'text-gray-300'}`}>
                    Internal Team
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Engineering & DevOps</div>
                </button>

                <button
                  onClick={() => handleAudienceChange('customer')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    audience === 'customer'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-[#1f1f28] hover:border-[#2f2f38] bg-[#13131a]'
                  }`}
                >
                  <Mail size={24} className={audience === 'customer' ? 'text-blue-400 mb-2' : 'text-gray-500 mb-2'} />
                  <div className={`font-medium ${audience === 'customer' ? 'text-blue-400' : 'text-gray-300'}`}>
                    Customer
                  </div>
                  <div className="text-xs text-gray-500 mt-1">External users</div>
                </button>

                <button
                  onClick={() => handleAudienceChange('cs')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    audience === 'cs'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-[#1f1f28] hover:border-[#2f2f38] bg-[#13131a]'
                  }`}
                >
                  <MessageSquare size={24} className={audience === 'cs' ? 'text-blue-400 mb-2' : 'text-gray-500 mb-2'} />
                  <div className={`font-medium ${audience === 'cs' ? 'text-blue-400' : 'text-gray-300'}`}>
                    CS Team
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Support staff</div>
                </button>
              </div>
            </div>
          </div>

          {/* Message Type Tabs */}
          <div className="bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl">
            <div className="border-b border-[#1f1f28] px-6">
              <div className="flex gap-1 -mb-px">
                <button
                  onClick={() => handleMessageTypeChange('report')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    messageType === 'report'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-[#2f2f38]'
                  }`}
                >
                  Internal Report
                </button>
                <button
                  onClick={() => handleMessageTypeChange('message')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    messageType === 'message'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-[#2f2f38]'
                  }`}
                >
                  {audience === 'customer' ? 'Customer Message' : 'Team Update'}
                </button>
                <button
                  onClick={() => handleMessageTypeChange('fix-guide')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    messageType === 'fix-guide'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-[#2f2f38]'
                  }`}
                >
                  {audience === 'customer' ? 'Troubleshooting' : 'Fix Guide'}
                </button>
                <button
                  onClick={() => handleMessageTypeChange('escalation')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    messageType === 'escalation'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-[#2f2f38]'
                  }`}
                >
                  Escalation Note
                </button>
              </div>
            </div>

            {/* Content Editor */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-blue-400" />
                <span className="text-sm font-medium text-blue-400">AI Generated Content</span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[600px] px-4 py-3 bg-[#13131a] border border-[#1f1f28] rounded-xl text-gray-300 font-mono text-sm focus:outline-none focus:border-blue-500/30 resize-none"
                placeholder="Generated content will appear here..."
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}