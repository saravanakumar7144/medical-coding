# Platform_v2.md

## Purpose

Upgrade the current platform without rewriting it from scratch. Align navigation and workflows for three primary personas (Medical Coder, Claims Processor, Medical Biller), tighten the end-to-end claim flow with gating, and add focused Gen-AI assist where it removes toil and accelerates outcomes.

⚠️ **This is an update plan.** Reuse existing screens/components and evolve them. Create new components only when called out.

---

## Global Information Architecture (IA) — updated

### Work
- **Claims Inbox** (All / Needs Attention / Rejected—Clearinghouse / Rejected—Payer / Denials / ERA Exceptions / Ready to Bill)

### Pre-Claim
- **Eligibility & Auth** (includes COB inside)

### Coding
- **Chart Coding**
- **Code Sales & Updates** (context panel)

### Build & Submit
- **Charge & Demo Entry** (incl. Claim Form)
- **Rules & Scrubbing** (client rules honored)
- **Submit** (with Secondary Sub-Category)
- **Acknowledgments** (999/277CA; CH vs Payer)

### Post-Submit
- **ERA & Payments** (mismatch categories; Refunds)
- **Denials Workbench** (catalog, subtypes, end actions)

### Patient & Payer
- **Patient Billing**
- **Payers & Payees** (Primary/Secondary; Fee Schedules)

### Intelligence
- **Reports & Analytics**
- **Dashboards by Role**

### Admin
- **Roles & Permissions** (Medical Records = high-security)

---

## Conventions & UX guardrails

- **US date input:** MM/DD/YY with input mask and validation.
- **Gated wizard inside Claim Workspace:** Submit stays disabled until pre-checks pass.
- **Status timeline stays visible:** Submitted → CH Rej → Fixed → Payer Rej → ERA Accept → Posted → Completed.
- **Quick Links bar always visible (top):** direct jump to major modules.
- **Global Search facets:** Name, DOS, Billed Amount, Account/Serial/Invoice.
- **Keyboard shortcuts:** / Search, G A Acks, G E ERA, G D Denials, N Fresh claim.

---

## Naming / polish fixes (quick wins)

- Rename component export `SubmissionsAcknowledments` → `SubmissionsAcknowledgments`.
- Rename component export `PayersPlansFeeSschedules` → `PayersPlansFeeSchedules`.
- Use the label **"Fresh"** instead of "New" where the UI denotes newly created claim items.

---

## 01. Claims Inbox (new central hub)

### Where to find
Start from existing Acknowledgments, Denials, and ERA list UIs; compose into a unified inbox.

**Suggested new component:** `src/components/claims-inbox.tsx` (wrapper) that renders existing list children.

### How to change
- Merge disparate tables into a single Inbox with tabs/filters:  
  **All | Needs Attention | Rejected—Clearinghouse | Rejected—Payer | Denials | ERA Exceptions | Ready to Bill**.
- Add **Group by Date** (toggle). Show inline reason (reject/denial code + short text).
- Add **Status chips** on each row: Submitted | Processing | Accepted | Rejected.
- Add **row actions:** "Open Claim", "Upload/View Claim Form", "Open ERA", "Open Denial".
- Add **bulk actions:** "Bulk Resubmit (same fix)", "Bulk Assign", "Export CSV".

### What it should look like
A single table with sticky header, tabbed filters on top, chips for status, right-aligned amounts (Billed/Allowed/Balance), and left-aligned patient/payer. Each row has a primary action ("Open Claim") and a kebab menu for secondary actions.

Quick Links bar (top) visible on this screen too.

### To-Do
- [ ] Create `claims-inbox.tsx` and mount it as the default landing page.
- [ ] Wire existing data providers into one unified datasource (keep mock data if that's what exists).
- [ ] Implement tabs, grouping, and chips (UI only; reuse existing computed statuses).
- [ ] Add row action to deep-link into Claim Workspace at the failing section (pass a section anchor param).

---

## 02. Claim Workspace (rewrite as gated flow, not a new screen)

### Where to find
`src/components/claim-workspace.tsx` (or `enhanced-claim-workspace.tsx` if present).

### How to change
Add left nav sub-tabs in this exact order:

1. **Eligibility & Auth** (includes COB tab)
2. **Coding** (with "Code Sales & Updates" panel)
3. **Charge & Demo Entry** (and Claim Form)
4. **Rules & Scrubbing**
5. **Submit** (with Secondary Sub-Category; "Fresh" where relevant)
6. **Acknowledgments** (CH vs Payer buckets; group by date; inline reasons)
7. **ERA & Payments** (Deductible/Co-Pay/Co-Ins; mismatch categories; Refunds)
8. **Denials Workbench** (catalog, subtypes, ERA context; End Action)
9. **Patient Billing**

Add **gating:** disable later tabs' critical actions if earlier tabs have blocking issues (e.g., Submit disabled until Scrubbing clean and Eligibility/Auth present).

Keep a **status timeline** pinned at the top.

### What it should look like
Master-detail layout: header with Patient, Payer(s), Account/Invoice IDs, DOS, billed/allowed/balance; left rail with numbered steps; main panel with each step; right rail reserved for AI Copilot.

### To-Do
- [ ] Add a stepper/left rail; preserve existing inner content, move into steps.
- [ ] Implement gating rules (UI only): show blockers, disable actions, provide "Fix" links.
- [ ] Add a persistent status timeline component.

---

## 03. Eligibility & Auth (+ COB inside)

### Where to find
`src/components/eligibility-authorizations.tsx` (and/or `enhanced-prior-auth.tsx`).

### How to change
- Add **per-service fields:** Procedure Code, Service Name, DOS.
- Add an inner **COB tab:** Primary/Secondary selection and capture of secondary payer details.
- Show a read-only **Eligibility summary** strip with plan, deductible, co-pay/co-ins.

### What it should look like
Two tabs: "Eligibility" and "Prior Authorization", plus a third "COB".

Each service line shows whether auth required and current status (Requested/Approved/Denied).

### To-Do
- [ ] Add per-service entry table + status chips.
- [ ] Add COB sub-tab and summary.

---

## 04. Coding (+ Code Sales & Updates panel)

### Where to find
`src/components/chart-coding.tsx`, `src/components/code-library.tsx`, `src/components/ai-suggestions.tsx`.

### How to change
- Keep current coding entry; add a right-side **"Code Sales & Updates"** panel: brief change notes, "impact on allowed" and "denial risk" hints.
- Maintain dx↔proc pointers and specificity hints.

### What it should look like
Two-pane layout: codes table on left, small info cards on right.

### To-Do
- [ ] Add info panel container and feed it with existing hints / mock "change notes".

---

## 05. Charge & Demo Entry (+ Claim Form)

### Where to find
`src/components/charge-entry.tsx` (if present) and claim form areas referenced in current UI.

### How to change
- Keep the existing fields; ensure **Claim Form** (CMS-1500/UB-04 metadata) is uploaded/viewable.
- Provide quick links to **Medical Records** (see Security).

### What it should look like
Demographics section, service lines, totals, with a "Claim Form" card that supports upload + preview.

### To-Do
- [ ] Add a "Claim Form" card with Upload/View.
- [ ] Add a link to open Medical Records (role-guarded).

---

## 06. Rules & Scrubbing (client rules honored)

### Where to find
`src/components/rules-scrubbing.tsx`.

### How to change
- Keep existing rule library; surface **blocking vs warning** categories.
- Provide **"Fix in place"** links to the relevant field/step.

### What it should look like
Alert list with badges (Blocker/Warning), jump-to anchors.

### To-Do
- [ ] Categorize rules visually and wire jump-to actions.

---

## 07. Submit (with Secondary Sub-Category)

### Where to find
`src/components/submissions-acknowledgments.tsx` (submit section).

### How to change
- Add **Sub-Category selector** for Secondary routing.
- Replace any "New" labels with **"Fresh"** per naming convention.
- Button state reflects gating (disabled with explanation when blocks exist).

### What it should look like
Compact panel: destination (Primary/Secondary), Sub-Category (when Secondary), submit button + preview.

### To-Do
- [ ] Add Secondary Sub-Category dropdown.
- [ ] Align labeling to "Fresh".

---

## 08. Acknowledgments (999/277CA; CH vs Payer)

### Where to find
`src/components/submissions-acknowledgments.tsx` and/or `src/components/real-time-claim-status.tsx`.

### How to change
- Split views into **Rejected—Clearinghouse** and **Rejected—Payer**.
- Add **Group by Date** and show **inline reason**.
- Primary action opens Claim Workspace pre-focused on the failing section.

### What it should look like
Two tabs + a unified table each; reason code + message is always visible.

### To-Do
- [ ] Create the two tabs and grouping toggle.
- [ ] Implement deep-link with anchor param back to Claim Workspace.

---

## 09. ERA & Payments (mismatch triage + Refunds)

### Where to find
`src/components/eras-payment-posting.tsx`.

### How to change
- Add **mismatch categories:** Incorrect, Duplicate, Paid to other office, Paid to different account.
- Show policy **Deductible / Co-Pay / Co-Insurance** breakdown.
- Add a **Refunds** sub-tab: create, track, and mark completed.

### What it should look like
ERA lines with patient responsibility cards; right-side drawer for exception categorization; Refunds tab with a small queue.

### To-Do
- [ ] Add exception category picker.
- [ ] Add Refunds tab + list.

---

## 10. Denials Workbench (catalog, subtypes, end actions)

### Where to find
`src/components/denials-workbench.tsx` (and/or `enhanced-denials-workbench.tsx`).

### How to change
- Add a **denials catalog** (e.g., 32 common types).
- Support **subtypes** (e.g., Non-covered under patient policy vs insurance policy).
- Embed **ERA preview** context panel.
- Add **End Action** picker: Resubmit, Bill Patient, Bill Secondary, Reprocess, Adjustment/Write-off. When limit expired, default to write-off with note.

### What it should look like
Three panes: list → details + ERA panel → end-action with required fields.

### To-Do
- [ ] Build subtype taxonomy and end-action picker.
- [ ] Wire a write-off path for "limit expired" case.

---

## 11. Patient Billing

### Where to find
`src/components/patient-billing.tsx`.

### How to change
- Display **Ready to Bill** items from ERA/denial outcomes.
- Provide **letter/email generation** entry points (hook to AI generator below).

### What it should look like
Queue list with balances, contact options, and history.

### To-Do
- [ ] Add Ready-to-Bill feed.
- [ ] Add "Generate Statement/Letter" entry points.

---

## 12. Payers & Payees (Primary/Secondary; Fee Schedules)

### Where to find
`src/components/payers-plans-fee-schedules.tsx`.

### How to change
- In **Add Payee**, expose Primary/Secondary options.
- Surface **Fee Schedule** link in Denials Workbench context.

### What it should look like
Simple settings form with radio toggles and a reference link section.

### To-Do
- [ ] Add Primary/Secondary toggles.
- [ ] Expose contextual Fee Schedule links.

---

## 13. Security & Medical Records (high-security)

### Where to find
Wherever "Medical Records" is linked (e.g., in Charge & Demo and Claim Workspace header).

### How to change
- Gate with **role/permission** and show **audit trail** (accessed by whom/when).
- **Mask PHI** by default in previews unless elevated access.

### What it should look like
Modal with red "High-Security" banner; masked fields toggled by permission.

### To-Do
- [ ] Add permission check and masking control.
- [ ] Add an access log view.

---

## 14. Global Search & Navigation

### Where to find
`src/components/sidebar.tsx`, `src/components/role-selector.tsx`, `src/App.tsx`.

### How to change
- Add **Global Search** with facets: Name, DOS, Billed Amount, Account/Serial/Invoice.
- Add **Quick Links bar** pinned on every page.
- (Optional, incremental) Introduce routing to make each step deep-linkable.

### What it should look like
Search input with a "Filters" popover; breadcrumb and quick links under the top app bar.

### To-Do
- [ ] Add search facets UI and wire to existing lists.
- [ ] Add Quick Links bar.

---

## 15. Gen-AI Copilot (right rail, contextual)

### Where to find
`src/components/ai-suggestions.tsx`, `src/components/ai-chatbot.tsx`.

### How to change
Consolidate into a **Copilot panel** that changes by context (Coding, Submit/Acks, ERA, Denials).

**Capabilities:**

1. **Explain & Fix (Acks):** summarize 999/277CA reject with probable fix; apply change with preview.
2. **Coding Assistant:** suggest codes, specificity, and impact on allowed/denial risk; cite "Code Sales & Updates".
3. **Prior-Auth Drafter:** draft PA request with attachment checklist (from per-service fields).
4. **COB Guidance:** nudge Secondary configuration when detected.
5. **ERA Triage:** auto-classify mismatch categories; propose Refund or correction.
6. **Denials Playbooks:** map denial codes to playbooks; pre-select End Action + required docs.
7. **Appeal/Patient Letter Generator:** produce editable drafts with merge fields.
8. **Natural-Language Search:** translate queries to filters and open the correct tab.

**Guardrails:** Diff preview, role-aware access, citations where applicable.

### What it should look like
Right rail with collapsible cards; each card has a short explanation, a suggested action, and an Apply button that returns the user to the exact field or performs the safe UI change.

### To-Do
- [ ] Create a single Copilot panel container and mount per-context cards.
- [ ] Implement "apply suggestion" flows as UI state changes with confirm dialogs.

---

## 16. Dashboards & Analytics (keep, re-point)

### Where to find
`src/components/reports-analytics.tsx`, `src/components/operational-dashboard*.tsx`.

### How to change
- Keep current visuals; **re-point tiles** to new buckets (e.g., "ERA Exceptions", "Rejected—Payer").
- Add **role-based landing dashboard** selection.

### To-Do
- [ ] Update tiles' data sources to new buckets.
- [ ] Map role → default landing (Coder, Claims, Biller).

---

## 17. Acceptance criteria (per area)

- **Claims Inbox:** Users can filter by tab, see inline reasons, group by date, bulk select, deep-link to claims.
- **Claim Workspace:** Step gating prevents Submit with blockers; status timeline always visible.
- **Eligibility/Auth/COB:** Per-service fields captured; COB tab persists with claim.
- **Acks:** Distinct CH vs Payer lists; deep-link restores scroll & anchor.
- **ERA & Payments:** Mismatch category required for exceptions; Refunds tab available.
- **Denials WB:** Denial subtype captured; End Action required; write-off path for limit expired.
- **Search & Quick Links:** Faceted search returns correct results; quick links jump to modules.
- **AI Copilot:** At least 4 context cards visible; "apply" modifies UI state with diff preview.

---

## 18. Rollout plan

### Phase 1 (MVP)
Claims Inbox, Claim Workspace gating, Acks split, ERA mismatch + Refunds, Denials WB end actions, Global Search/Quick Links, naming fixes.

### Phase 2 (Pilot)
Copilot panel with Explain & Fix (Acks), Coding Assistant, ERA Triage, Appeal generator; Security gating for Medical Records.

### Phase 3 (Production polish)
Bulk ops, audit trail UIs, performance passes, accessibility audit, dashboards re-point.
