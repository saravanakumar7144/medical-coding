# Medical Coding AI Platform - System Guidelines

## Platform Overview
This is a comprehensive Medical Coding AI Assistant Platform with role-based dashboards and AI-powered automation throughout all workflows. The platform serves medical coding professionals, billing specialists, managers, and executives with personalized experiences.

**Platform Version:** v2.0 - Enhanced with unified Claims Inbox, gated workflows, and contextual AI Copilot

## Design System

### Color Palette
- **Primary Color:** #62d5e4 (Cyan) - Primary actions, active states, brand elements
- **Status Colors:**
  - Red: Critical/Urgent, denials, clearinghouse rejections
  - Orange: High priority, payer rejections
  - Yellow: Pending, warnings, medium priority
  - Blue: In progress, informational
  - Green: Completed, success, accepted
  - Purple: AI features, premium functionality, ERA exceptions
  - Cyan: Ready to bill, secondary actions

### Naming Conventions (Platform v2)
- Use **"Fresh"** instead of "New" for newly created items
- Component naming:
  - `SubmissionsAcknowledgments` (not Acknowledgments)
  - `PayersPlansFeeSchedules` (not FeeSschedules)
- Date format: **MM/DD/YY** with input mask and validation (US standard)

### AI-First Design Principles
- Every workflow includes AI assistance and automation
- Use gradient backgrounds (purple-to-cyan) for AI-powered features
- Include confidence scores, success predictions, and smart recommendations
- Add "sparkles" icon (✨) for AI features
- Show quick-action buttons for AI-generated content
- Provide contextual AI suggestions throughout workflows
- **NEW:** AI Copilot right rail with context-aware cards and diff previews

### Role-Based Experience
The platform supports multiple user roles with dedicated dashboards:
- **Medical Coder**: Fast coding, specificity hints, pre-submit checks
- **Claims Processor**: Triage rejects, fix fast, resubmit
- **Medical Biller**: ERA triage, refunds, denials end-actions, patient billing
- **Billing Specialist**: Revenue metrics, claims processing, payer performance
- **Manager**: Team performance, productivity oversight, quality metrics
- **Executive**: Strategic KPIs, financial performance, department analytics

## Key Features

### 1. Claims Inbox (NEW - Central Hub)
Unified view of all claims requiring attention with:
- **7 Filter Tabs:** All, Needs Attention, Rejected—Clearinghouse, Rejected—Payer, Denials, ERA Exceptions, Ready to Bill
- **Group by Date** toggle for temporal organization
- **Inline reasons** with reject/denial codes and short descriptions
- **Status chips:** Submitted, Processing, Accepted, Rejected, Denied, etc.
- **Row actions:** Open Claim, Upload/View Claim Form, Open ERA, Open Denial
- **Bulk actions:** Bulk Resubmit (same fix), Bulk Assign, Export CSV
- **Deep-linking:** Navigate directly to specific Claim Workspace sections
- **Priority badges:** Urgent, High, Medium, Low with color coding
- **Right-aligned amounts:** Billed, Allowed, Balance

### 2. Global Navigation
- **Quick Links Bar** (persistent): Claims Inbox, Acks, ERA, Denials, Reports, Search, Fresh Claim
- **Global Search** with faceted filters:
  - Patient Name
  - Date of Service (DOS)
  - Billed Amount
  - Account/Serial/Invoice Numbers
- **Keyboard Shortcuts:**
  - `/` - Global Search
  - `N` - Fresh Claim
  - `G + I` - Claims Inbox
  - `G + A` - Acknowledgments
  - `G + E` - ERA
  - `G + D` - Denials
  - `G + R` - Reports

### 3. Claim Workspace (Gated Flow)
9-step master-detail workflow with:
1. **Eligibility & Auth** (includes COB tab)
2. **Coding** (with Code Sales & Updates panel)
3. **Charge & Demo Entry** (+ Claim Form upload)
4. **Rules & Scrubbing** (blocking vs warning)
5. **Submit** (with Secondary Sub-Category)
6. **Acknowledgments** (CH vs Payer split)
7. **ERA & Payments** (mismatch categories + Refunds)
8. **Denials Workbench** (catalog, subtypes, End Actions)
9. **Patient Billing**

**Key Features:**
- **Status Timeline** pinned at top: Submitted → CH Rej → Fixed → Payer Rej → ERA Accept → Posted → Completed
- **Gating logic:** Disable Submit until Eligibility verified and Scrubbing clean
- **"Fix" links** from blockers to relevant sections
- **Deep-link anchors** from Claims Inbox to failing sections

### 4. AI-Powered Denials Workbench
- Smart prioritization by value, urgency, and success probability
- One-click auto-fix for correctable denials
- AI-generated appeal letters with supporting evidence
- Predictive success rates (65-95%)
- Pattern recognition across similar denials
- Simplified 3-step workflow: Analyze → Fix → Resolve
- **NEW:** Denial catalog (32 common types), subtypes, ERA preview, End Action picker
- **End Actions:** Resubmit, Bill Patient, Bill Secondary, Reprocess, Adjustment/Write-off
- **Limit-expired** defaults to write-off with note

### 5. Role-Based Dashboards
Each role receives a personalized home experience:
- Role-specific metrics and KPIs
- Quick access to common tasks
- AI-powered insights and recommendations
- Performance tracking with trends
- Actionable items requiring immediate attention

### 6. Enhanced AI Chatbot & Copilot
**Chatbot:**
- Context-aware medical coding responses
- ICD-10, CPT, HCPCS code lookups
- Denial resolution strategies with CARC/RARC guidance
- Appeal letter generation templates
- HCC/RAF scoring guidance
- Documentation improvement tips
- Quick reply suggestions for common queries
- Conversational interface with follow-up questions

**AI Copilot (NEW - Right Rail):**
Context-aware assistance with 8 capabilities:
1. **Explain & Fix (Acks)** - Summarize 999/277CA rejects with probable fixes
2. **Coding Assistant** - Suggest codes, specificity, impact on allowed/denial risk
3. **Prior-Auth Drafter** - Generate PA requests with attachment checklists
4. **COB Guidance** - Nudge Secondary payer configuration
5. **ERA Triage** - Auto-classify mismatch categories, propose Refunds
6. **Denials Playbooks** - Map denial codes to playbooks, pre-select End Actions
7. **Appeal/Letter Generator** - Editable drafts with merge fields
8. **Natural-Language Search** - Translate queries to filters

**Guardrails:**
- Diff preview before "Apply"
- Role-aware access control
- Citations where applicable

### 7. Workflow Automation
- Auto-populate data from previous entries
- Intelligent code suggestions based on documentation
- Automatic denial categorization
- Pre-filled appeal templates
- Smart routing based on priority
- Bulk actions for similar items

### 8. Enhanced Modules

#### Eligibility & Auth
- Per-service fields: Procedure Code, Service Name, DOS
- **COB tab:** Primary/Secondary payer selection
- Eligibility summary strip with plan, deductible, co-pay/co-ins

#### Acknowledgments (Split)
- **Rejected—Clearinghouse** tab
- **Rejected—Payer** tab
- Group by Date toggle
- Inline reason codes (999/277CA)
- Deep-link to Claim Workspace failing section

#### ERA & Payments
- **Mismatch categories:** Incorrect, Duplicate, Paid to other office, Paid to different account
- **Policy breakdown:** Deductible, Co-Pay, Co-Insurance
- **Refunds sub-tab:** Create, track, mark completed

#### Payers & Fee Schedules
- **Primary/Secondary** toggles in Add Payee
- Fee Schedule links in Denials Workbench context

#### Patient Billing
- **Ready to Bill** feed from ERA/denial outcomes
- Letter/email generation entry points

## UX Principles

### Simplified Workflows
- Clear 3-step maximum processes
- Visual progress indicators (Status Timeline)
- Inline help and tooltips
- Undo/redo capabilities
- Autosave functionality
- **Gating:** Disabled actions with explanatory tooltips + "Fix" links

### Visual Hierarchy
- Card-based layouts for information grouping
- Color-coded severity and status
- Prominent AI suggestions
- Clear call-to-action buttons
- Consistent spacing and alignment
- **Sticky headers** for tables
- **Right-aligned** financial amounts, **left-aligned** patient/payer info

### Responsive Feedback
- Loading states with progress indication
- Success/error toast notifications
- Inline validation messages
- Optimistic UI updates
- Smooth transitions and animations
- **Bulk operation** progress feedback
- **Diff previews** for AI-suggested changes

### Deep-Linking & Navigation
- Pass `claimId` + `section` params to Claim Workspace
- Anchor scroll to failing sections
- Breadcrumb trails
- Persistent Quick Links bar

## Component Patterns

### Stats Cards
```
┌─────────────────────┐
│ Icon    Label       │
│ 125    ↑ 12%       │
│ Metric  Change      │
└─────────────────────┘
```
- Use gradient backgrounds for emphasis
- Include trend indicators
- Show contextual comparisons

### Status Timeline
- Horizontal stepper with 7 steps
- Icons: Check (completed), Clock (current), Circle (pending), XCircle/AlertCircle (errors)
- Color coding: Green (completed), Cyan (current), Red (CH reject), Orange (Payer reject)
- Connector lines show progress

### AI Features
- Sparkles/Brain icon for identification
- Confidence percentage (85-98%)
- Predicted outcomes with success rates
- Quick action buttons
- Purple-cyan gradient backgrounds

### Action Buttons
- **Primary**: Cyan background (#62d5e4), white text
- **AI Actions**: Purple-to-cyan gradient
- **Dangerous**: Red background
- **Secondary**: White with gray border
- **"Fresh" Claim**: Cyan with PlusCircle icon

### Filters & Search
- Inline segmented controls (3-7 options for tabs)
- Search bar with icon
- Active state clearly indicated
- Reset/clear functionality
- **Faceted search** with popovers
- **Active filter badges** with X to remove

### Tables
- Sticky headers
- Checkboxes for bulk selection
- Inline actions (primary button + kebab menu)
- Color-coded status badges
- Group by Date support
- Pagination (20-50 items)
- Empty states with helpful messages

### Modals & Dialogs
- **Medical Records:** High-security banner, PHI masking, audit trail
- **Global Search:** Max-w-2xl, faceted filters
- **Diff Preview:** Side-by-side old/new, Confirm/Cancel actions

## Technical Implementation

### State Management
- React hooks for component state
- Props for parent-child communication
- Minimal state duplication
- Derived state when possible
- **Keyboard shortcut** state with timeout for multi-key combos

### Performance
- Lazy loading for heavy components
- Pagination for large datasets (20-50 items per page)
- Debounced search inputs
- Optimized re-renders
- **useMemo** for filtered/grouped data

### Mock Data Standards
- Realistic medical scenarios (E&M visits, procedures, diagnostics)
- Variety of denial types (CARC 11, 16, 59, 197, etc.)
- Variety of reject codes (AAA02, CO-16, etc.)
- Multiple payer types (Medicare, BCBS, Aetna, UHC, Cigna)
- Diverse severity levels (Urgent, High, Medium, Low)
- HCC and RAF examples
- Confidence scores 85-98%
- Success predictions 60-95%
- **US Dates:** MM/DD/YY format
- **Account/Invoice/Serial numbers** with realistic prefixes

## AI Response Guidelines

### Chatbot Responses
- Detailed, actionable information
- Medical coding best practices
- Step-by-step instructions when needed
- Code examples with descriptions
- References to guidelines
- 2-4 quick reply suggestions per response

### Copilot Suggestions Format
- Clear action statement
- Confidence level
- Expected outcome
- Estimated time to complete
- **Diff preview** capability
- **Apply button** with confirmation

## Security & Compliance

### Medical Records Access
- **High-security banner** in red
- **Role/permission gating** before access
- **PHI masking** by default (toggle with elevated access)
- **Audit trail:** Who accessed, when, duration
- **Access log view** for compliance

## Acceptance Criteria (Platform v2)

- ✅ **Claims Inbox:** Users can filter by tab, see inline reasons, group by date, bulk select, deep-link to claims
- ✅ **Claim Workspace:** Step gating prevents Submit with blockers; status timeline always visible
- ✅ **Eligibility/Auth/COB:** Per-service fields captured; COB tab persists with claim
- ✅ **Acks:** Distinct CH vs Payer lists; deep-link restores scroll & anchor
- ✅ **ERA & Payments:** Mismatch category required for exceptions; Refunds tab available
- ✅ **Denials WB:** Denial subtype captured; End Action required; write-off path for limit expired
- ✅ **Search & Quick Links:** Faceted search returns correct results; quick links jump to modules
- ✅ **AI Copilot:** At least 4 context cards visible; "apply" modifies UI state with diff preview

## Future Enhancements
- Auditor and Admin role dashboards
- Real-time team collaboration
- Advanced predictive analytics
- EHR system integration
- Mobile-responsive views
- Push notifications
- **Rollout Phase 3:** Bulk ops enhancements, advanced audit trail UIs, performance optimization, accessibility audit