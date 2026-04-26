Redesign the Test Case Generation page of FlowOps as an AI-first test generation workflow.

The page should feel clean, focused, and structured around:
1. selecting APIs,
2. letting AI infer generation context,
3. reviewing generated test cases,
4. editing test case info,
5. checking coverage through a matrix.

Use a dark modern DevOps-style SaaS UI.

--------------------------------------------------
LAYOUT
--------------------------------------------------

Use a 3-panel layout:

[Center Main Builder Panel] | [Right Side Panel for Generated Test Cases]

The API selection should NOT always occupy the main page as a checklist.
Instead, API selection happens only when the user clicks the main CTA.

Keep the top progress flow:
Generate → Execute → Analyze → Improve

--------------------------------------------------
TOP ACTION / API SELECTION
--------------------------------------------------

At the top of the center panel, place a primary button:

"Generate Test Cases"

When the user clicks this button:
- open a modal / alert-style selection dialog
- show searchable API list inside the modal
- allow multi-select with checkboxes
- include API method, path, domain, and current coverage in the modal list
- include confirm button: "Generate for Selected APIs"

This API selection must feel lightweight and task-focused.

Do NOT show persistent API checkboxes on the main page.

--------------------------------------------------
CENTER MAIN BUILDER PANEL
--------------------------------------------------

After APIs are selected, show an AI-assisted context builder.

1. Horizontal condition bar at the top of the builder
Arrange these in one horizontal row, like the reference intent:

- User Role
- Data Variants
- State Conditions

Each one should appear as a labeled dropdown, not as chip groups.

Examples:
- User Role (multi-select dropdown)
- Data Variants (dropdown or multi-select dropdown)
- State Conditions (dropdown or multi-select dropdown)

The labels should be compact and aligned horizontally.

Important:
These conditions are primarily delegated to AI.
So the UI should communicate:
- AI will recommend or infer suitable combinations
- user can optionally adjust dropdown selections

Add a helper text such as:
"AI recommends context combinations based on endpoint purpose and existing coverage."

2. AI Context Summary section
Below the horizontal dropdown row, show a concise AI-generated summary such as:
- detected likely user roles
- likely edge states
- recommended input variants
- expected generation scope

This should feel like a smart assistant recommendation block.

3. Test Matrix at the bottom of the center panel
Place a Test Matrix section in the lower part of the center panel.

The matrix should visualize generated coverage across dimensions such as:
- User Role
- State
- Data Variant

Use a grid/table style.
Highlight:
- covered combinations
- missing combinations
- AI-recommended combinations
- duplicated or overlapping combinations

The matrix should be visual and easy to scan.

--------------------------------------------------
RIGHT SIDE PANEL: GENERATED TEST CASES
--------------------------------------------------

The right panel should be a persistent side panel dedicated to generated test cases.

1. Generated Test Case List
Show generated test cases as a vertical list.

Each test case item should include:
- test case title
- status badge or type badge
- related API
- small metadata summary

Examples of badges:
- Success
- Validation
- Edge
- Error
- AI Generated
- Edited

2. Expand / Toggle behavior
Each list item should have a toggle / accordion behavior.

When toggled open:
- show Test Case Info inside the side panel
- reveal editable fields

3. Editable Test Case Info
Info should be editable inline.

Fields may include:
- test case name
- description
- user role
- state condition
- data variant
- expected result
- request preview
- validation rules / assertions

This info panel should feel like a side inspector.

4. Interaction behavior
- Clicking a test case highlights it
- Opening one case reveals its detail
- Multiple cases may optionally be collapsed/expanded
- Edited cases should display an "edited" badge

--------------------------------------------------
USER EXPERIENCE GOAL
--------------------------------------------------

The workflow should be:

1. Click "Generate Test Cases"
2. Select APIs in modal
3. AI suggests conditions through dropdown-based context builder
4. Generated test cases appear in right side panel
5. User opens each case with toggle
6. User reviews / edits info
7. User checks overall combination coverage in the Test Matrix

--------------------------------------------------
DESIGN DIRECTION
--------------------------------------------------

- dark theme
- minimal but premium DevOps SaaS feel
- strong information hierarchy
- clean spacing
- compact but readable labels
- right panel should feel like an inspector drawer
- matrix should feel analytical, not decorative

Avoid:
- persistent bulky checkbox lists in the main page
- chip-heavy condition selection blocks
- moving to another page for case review
- overly complex form-heavy experience

Focus on:
AI-assisted generation, quick review, editable case detail, and matrix-based coverage visibility.
Enhance the Test Comparison panel behavior with flexible visibility.

--------------------------------------------------
TEST COMPARISON PANEL BEHAVIOR
--------------------------------------------------

1. Make Test Comparison a collapsible panel:

- Add close (X) button at top-right of the panel
- Add minimize / collapse toggle

---

2. Panel States:

A. Default (after generation)
- Show Test Comparison (coverage before vs after, new/duplicate/missing)

B. Closed state
- Panel completely hidden
- Center builder expands to full width
- Floating button or small tab to reopen

C. Reopened state
- Show Test Comparison again without losing data

---

3. Switch to Generated Test Cases:

When user clicks "View Generated Cases" or selects a test case:
→ Replace Test Comparison panel with Generated Test Cases panel

---

4. Smart Behavior:

- If user starts editing test cases:
  → auto-hide or minimize comparison panel

- If user regenerates tests:
  → reopen comparison panel automatically

---

5. Add Toggle Button:

At top of center panel:
- "Compare Results" toggle button
→ shows / hides Test Comparison panel

---

Goal:
Allow users to switch between:
- analysis mode (comparison)
- inspection mode (test case review)

without friction