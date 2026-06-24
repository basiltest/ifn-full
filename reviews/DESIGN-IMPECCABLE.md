# IFN — Per-Page Design Rating (impeccable: critique + audit)

**Date:** 2026-06-20  ·  **Pages:** 21  ·  **Site average:** **79/100**  ·  **Method:** one design-reviewer agent per page scoring 8 dimensions against the impeccable rubric (WCAG contrast, hierarchy, typography, layout/responsive, motion + reduced-motion, accessibility, UX copy/states, AI-slop & absolute bans).

## Leaderboard

| # | Page | Route | Score | Weakest | Verdict |
|---|---|---|---|---|---|
| 1 | **Problem Hub** | `/problem-hub` | 86 | A11y 7/10 | A genuinely solid, product-first feed with best-in-class state and copy handling; held back from ship-grade only by a nested-interactive role=link ARIA flaw and sub-44px vote targets. |
| 2 | **UserProfile** | `/u/:id` | 84 | Layout 7/10 | A dense, honest members-only profile with excellent state and modal accessibility; held back from ship-grade only by sub-spec touch targets and two too-small status badges. |
| 3 | **Settings** | `/settings` | 84 | Contrast 8/10 | Solid, honest, product-register settings page with real optimistic feedback and good a11y; held back by a badge that never renders (unfetched member_type), a native window.confirm where a styled modal exists, and a split sign-out mental model. |
| 4 | **Admin Panel** | `/admin` | 84 | Contrast 7/10 | Solid, task-efficient admin surface with exemplary modal/tablist accessibility and on-register restraint; main gaps are sub-12px status type, a few tinted-on-tint contrast risks, and an under-wired Combobox for keyboard/SR users. |
| 5 | **Login** | `/login` | 82 | A11y 6/10 | A clean, on-brand auth screen with excellent state/copy handling and zero slop, held back from ship-grade by missing landmark/h1 semantics and the absence of client-side field validation. |
| 6 | **ForgotPassword** | `/forgot-password` | 82 | A11y 6/10 | A clean, restrained, on-brand reset form with excellent anti-enumeration UX; held back only by missing h1/main landmarks, no client-side validation/aria wiring, and a couple of minor a11y polish gaps. |
| 7 | **ResetPassword** | `/reset-password` | 82 | A11y 6/10 | A clean, slop-free, state-complete recovery form that nails the institutional register; held back from ship-grade only by missing landmarks/h1, a conditionally-mounted alert region, and an unlabeled success icon. |
| 8 | **Idea Pipeline (student home)** | `/pipeline` | 82 | Contrast 7/10 | A dense, trustworthy founder-triage screen with exemplary empty/error/loading/draft states; held back from ship-grade only by missing focus rings on the list rows and a couple of marginal-contrast neutral chips. |
| 9 | **PipelineIdea (idea dossier)** | `/pipeline/:id` | 82 | A11y 6/10 | A dense, role-aware dossier that nails UX copy, state coverage, and slop avoidance; held back from ship-grade by native confirm() dialogs, color-as-sole-signal on the stepper, unlabeled rubric sliders, and borderline faint-text contrast on the paper surface. |
| 10 | **Directory** | `/directory` | 82 | A11y 6/10 | Solid, dense, on-brand directory with first-class loading/empty/error states and a genuinely accessible contact modal; held back from ship-grade by custom-dropdown ARIA gaps, a sub-4.5:1 placeholder token, and an error branch that discards its own better copy. |
| 11 | **Onboarding** | `/onboarding` | 79 | A11y 6/10 | A clean, on-brand activation screen with zero visual slop and good copy/state care, held back from ship-grade by accessibility gaps in the comboboxes, the raw checkbox, and form-level (vs field-level) validation. |
| 12 | **MentorReview** | `/mentor` | 79 | A11y 5/10 | A tight, task-focused mentor queue with excellent copy/state handling and zero slop; held back by missing focus rings, a non-semantic tablist, and an unlabeled filter. |
| 13 | **Feed (authed home)** | `/` | 78 | Motion 6/10 | Solid, low-slop product feed with excellent state coverage and modal a11y, held back from ship-grade by a malformed role=link card with nested interactives, a missing page heading/landmark, sub-44px touch targets, and partial reduced-motion coverage. |
| 14 | **Calendar** | `/calendar` | 78 | Contrast 6/10 | A composed, low-slop calendar with excellent modal a11y and human copy; held back from ship-grade by a theme-blind Hackathon chip color, cell-wide opacity dimming pill text, and sub-44px touch targets. |
| 15 | **Notifications** | `/notifications` | 78 | A11y 5/10 | A clean, role-aware, slop-free notification center that nails IA and state coverage but ships a fake (non-ARIA) tablist and an unconfirmed destructive delete that keep it short of accessible ship-grade. |
| 16 | **Register** | `/register` | 76 | A11y 5/10 | A clean, slop-free, well-written request form that nails the product's restrained register — but a keyboard-inaccessible file upload blocks the required-certificate path, and missing landmark/required-field semantics keep it short of ship-grade. |
| 17 | **Profile** | `/profile` | 76 | A11y 6/10 | A clean, on-brand members-only profile screen with solid state coverage and zero AI-slop, held back from ship-grade by unassociated form labels and a three-way-inconsistent About character limit. |
| 18 | **Team Acquisition** | `/team` | 74 | A11y 5/10 | Solid, on-brand members board with excellent copy/states and modal a11y, dragged to 'functional with gaps' by an invalid nested-button/anchor structure and native window.confirm dialogs. |
| 19 | **ProblemDetail** | `/problem-hub/:id` | 74 | A11y 5/10 | Clean, slop-free, content-first detail page with strong state handling, undermined by accessibility gaps (custom kebab without keyboard support, misused tablist, missing focus rings, unconfirmed solution delete) and sub-44px touch targets on a phone-first audience. |
| 20 | **Idea Autopsy Library** | `/autopsy-library` | 73 | A11y 5/10 | Clean, system-consistent case-study library that reads as 'product, not marketing' — but accessibility (unlinked labels, no modal focus trap, missing focus rings) and native alert()/confirm() copy hold it back from ship-grade. |
| 21 | **PostDetail** | `/post/:id` | 72 | A11y 4/10 | Functionally strong and visually on-brand with great optimistic/empty-state UX, but accessibility is the weak link — unlabeled inputs, ringless custom menus/buttons, a heading skip, and unconfirmed one-click deletes hold it back from ship-grade. |

## Site-wide signal

**Dimension averages (0-10):**

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8.4 | 7.6 | 7.9 | 7.6 | 8.2 | 6.1 | 8.1 | 9.5 |

**Weakest site-wide:** A11y (6.1), Contrast (7.6), Layout (7.6).

**P0 issues across the site (7):**

- **Register** — The file input is `className="hidden"` (display:none → removed from tab order) and the visible dropzone is a `<label htmlFor="cert">`, which is not keyboard-focusable/activatable. Keyboard and screen-reader users cannot open the file picker. For non-student-domain emails the certificate is REQUIRED (certRequired = !isStudentDomain), so those users cannot submit the form at all via keyboard. _(Register.jsx L179 `<input ... className="hidden" />` and L193-196 `<label htmlFor="cert" className="flex cursor-pointer...">`)_ → Make the trigger a real `<button type="button">` that calls `fileRef.current.click()`, or visually-hide the input with sr-only/clip (not display:none) so it stays in the tab order, and add focus-visible styling to the dropzone. Wire the hidden-input label so Enter/Space activates it.
- **PostDetail** — Comment delete and creator-update delete are one-click destructive with NO confirmation. deleteComment (line 425 'delete' button -> deleteComment) and deleteUpdate (line 356) fire immediately and permanently remove content via RLS/admin RPC. Inconsistent with deletePost which does window.confirm. The repo just added ConfirmModal.jsx but it is unused here. _(PostDetail.jsx lines 355-357 (deleteUpdate) and 424-426 (deleteComment))_ → Gate both deletes behind a confirmation (reuse the new ConfirmModal component, not window.confirm) — e.g. 'Delete this comment? This cannot be undone.' Match the post-delete pattern for consistency.
- **PostDetail** — Form inputs have no accessible name. The comment composer input (line 387-394) and the creator-update input (line 339-342) expose only a placeholder ('Add a comment' / 'Post an update...'); placeholders are not labels and vanish on input, so screen-reader and voice users get an unnamed text field. _(PostDetail.jsx line 387 (comment input) and line 339 (update input))_ → Add aria-label="Add a comment" / aria-label="Post an update" (or a visually-hidden <label>) to each input.
- **MentorReview** — The Tab() button (lines 158-169) and the 'mine' row buttons (line 131-135) are bare custom <button>s with no focus-visible ring. .btn focus styles are not applied here, so keyboard users get no visible focus indicator on the primary tab switcher or the clickable idea rows — the core navigation of the page is invisible to keyboard nav. _(MentorReview.jsx — Tab() className (no focus-visible:ring*) and <button className="block w-full p-4 text-left hover:bg-black/5"> at line 134)_ → Add focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-page to both the Tab button and the row button.
- **Team Acquisition** — Each board card is a <button> (line 118-122) that wraps two AuthorLink anchors (lines 124-127). A <button> may not contain an <a> — this is invalid HTML and produces undefined keyboard/AT behavior (nested interactive controls). Screen readers and tab order both break; clicking the name navigates while the parent also fires setDetail. _(TeamAcquisition.jsx line 118 (the card <button>) containing AuthorLink <Link> from AuthorLink.jsx line 7)_ → Make the card a non-interactive container (div with role/onClick is still nesting-illegal if children are interactive). Best: render the card as a <div>, put a visually-hidden or overlay <button>/<Link> for 'view detail', and keep AuthorLink as the only interactive child for the author. Or move author links out of the clickable surface (e.g. avatar+name as plain text in the card, full profile link only in the detail modal).
- **ProblemDetail** — Solution delete is destructive but fires immediately with no confirmation. deleteSolution() optimistically removes the row on a single click; problem delete and ProblemModal both use window.confirm, so this is inconsistent and dangerous (admins moderating others' content, members deleting their own). _(ProblemDetail.jsx line 362 (delete button) -> deleteSolution() line 147)_ → Gate deleteSolution behind a confirm() (or the existing ConfirmModal component the repo just added) mirroring deleteProblem's pattern, e.g. window.confirm('Delete this solution?').
- **ProblemDetail** — Kebab menu is a custom popup with no keyboard support: button lacks aria-expanded/aria-haspopup, the panel has no role=menu and its items are MenuItem buttons not menuitems, no Escape-to-close (only mousedown-outside), no focus move into menu or arrow-key nav. Keyboard/screen-reader users cannot reliably operate Edit/Close/Delete problem. _(ProblemDetail.jsx Kebab component lines 22-48)_ → Add aria-haspopup="menu" and aria-expanded={open} to the trigger; give the panel role="menu" and items role="menuitem"; add Escape key handling and move focus to the first item on open (reuse the focus-trap pattern from ModalShell).

**AI-slop / absolute-ban flags:** MemberTypeBadge uses tiny uppercase tracked text (text-[10px] uppercase tracking-wide) — acceptable as a single badge, not a per-section eyebrow, so not penalized heavily. ×1; Password field labels use text-xs font-bold uppercase tracking-wide (lines 200, 204) — borderline tiny-uppercase-label pattern, but confined to form labels rather than decorative section eyebrows. ×1; Two tiny uppercase tracked micro-labels (text-[11px]/text-xs font-bold uppercase tracking-wide text-muted) on 'How it works' (line 64) and AppField labels (line 261) — defensible as functional section/field headers, but they edge toward the eyebrow-on-every-section pattern; keep them only where they label real groups. ×1; Modal backdrop uses backdrop-blur-sm (ModalShell line 57) — standard scrim, not decorative content glassmorphism, so acceptable, but it is the one blur in play; ensure it stays off card surfaces. ×1; QA question labels rendered as tiny uppercase tracked eyebrows on every Q&A row (line 270) — borders on the 'eyebrow on every section' anti-pattern, though these are functional field labels not decorative. ×1; Several near-identical .card lists (Action items, Files, History all use 'card divide-y divide-line' with similar p-3 rows) — acceptable density for a dossier but edges toward repeated identical card grids. ×1; Minor: repeated identical card grid is acceptable here (it is a board), but the fixed h-52 + sm:grid-cols-2 is the only structural pattern — fine for the job, not slop. ×1; Modal scrim uses backdrop-blur-sm (mild glassmorphism) ×1; Tiny uppercase tracked badges (MemberTypeBadge and the 'Pinned' chip, text-[10px] font-bold uppercase tracking-wide) — acceptable as data labels, not section eyebrows, so minor. ×1; Pinned cards use border-accent/40 as a full-card accent border (line 110) — not a banned side-stripe (all four sides), but verify it reads as state, not decoration. ×1; No major slop. Minor: the bg-down/10 + border-down/20 'Why it failed' callout edges toward a templated alert-box pattern, but it is a full tinted box (not a >1px side-stripe accent) and is used purposefully, so it stays within bounds. ×1; Tiny 10px uppercase tracked labels (RoleBadge, Banned/Read-only) edge toward the eyebrow anti-pattern, but they carry real status text rather than decorative section labels — borderline, not a clear violation. ×1; Selected bulk-assign card uses border-accent/30 as an all-around emphasis border (not a left/right side-stripe) — acceptable, no ban hit. ×1

---

## Per-page detail

### Problem Hub — 86/100  `/problem-hub`

> A genuinely solid, product-first feed with best-in-class state and copy handling; held back from ship-grade only by a nested-interactive role=link ARIA flaw and sub-44px vote targets.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | 8 | 9 | 8 | 9 | 7 | 10 | 9 |

**Issues**

- `P1` **accessibility** — The card is role="link" tabIndex=0 but contains nested interactive descendants (AuthorLink anchors, upvote/downvote buttons). Interactive content nested inside an element with role=link is invalid ARIA and breaks AT navigation/announcement; screen-reader users get a link that also wraps buttons with no clear way to reach the destination vs. the inner controls. _(ProblemHub.jsx article (line 113-120) role="link" wrapping <AuthorLink> (122,127) and vote <button>s (157-173))_
  → **Fix:** Drop role=link off the article. Make the title a real <a>/<Link> (stretched-link pattern: an absolutely-positioned overlay link covering the card, z-indexed below the vote/author controls), or move navigation onto the <h3> title link and keep the card as a plain container. This removes the nested-interactive violation while preserving full-card click.
- `P1` **layoutSpacing** — Vote and author-avatar touch targets fall under the 44px (and even 36px) minimum. Upvote/downvote buttons are p-1.5 around a 20px icon (~32px box); the author avatar link is h-9 w-9 (36px). On a phone the two vote buttons sit adjacent inside a tight pill, raising mis-tap risk on the primary action of the page. _(ProblemHub.jsx vote buttons className 'rounded-full p-1.5' (lines 160,170); avatar AuthorLink 'h-9 w-9' (line 122))_
  → **Fix:** Bump vote buttons to p-2.5 (or min-h/min-w 44px) and add a little more horizontal gap between up/down on small screens; the pill can stay visually compact via negative-margin icon padding if density matters.
- `P2` **contrastColor** — The vote/solution pills use bg-page on a bg-card surface (#F7F5F2 chip on #FFFFFF card) — a ~1.04:1 fill that is nearly invisible in light mode, so the grouping it is meant to convey doesn't read; the controls look ungrouped. Not a text-contrast failure, but the affordance is lost. _(ProblemHub.jsx footer pills 'rounded-lg bg-page' (lines 156 and 175))_
  → **Fix:** Use bg-line/40 or bg-accent-soft (or a 1px border-line) for the pill so the group is visible against the card in both themes; verify the dark-mode equivalent (page #0C0C0D on card #18181B) is also distinguishable.
- `P2` **accessibility** — Optimistic vote state and score are not announced to assistive tech. The score span updates silently and there is no aria-pressed on the up/down toggle buttons, so a screen-reader user cannot tell their vote registered or which direction is active (color/fill is the only cue). _(ProblemHub.jsx vote <button> elements (157-173) and score <span> (164-166))_
  → **Fix:** Add aria-pressed={p.my_vote === 1} / {=== -1} to the up/down buttons and give the score span an aria-label like `{score} points` (and consider aria-live polite on it).
- `P2` **slopBans** — Modal backdrop uses decorative backdrop-blur-sm glassmorphism on the scrim. Minor and conventional for a dialog, but the product's 'issued, not branded' principle favors a flat scrim. _(ModalShell.jsx backdrop div 'bg-black/40 backdrop-blur-sm' (line 57))_
  → **Fix:** Consider dropping backdrop-blur-sm for a plain bg-black/40 (or /50) scrim to match the restrained, print-like register; also lighter on low-end mobile GPUs.

**Strengths:** Exemplary state coverage: loading skeletons that mirror the card layout, an error state with a Retry action, two distinct empty states (search-miss vs. never-posted with a 'Post the first problem' CTA), optimistic voting with proper rollback on failure, and a success flash on post.; Optimistic vote logic is correct and guarded: toggle-off support (prevVote === v -> 0), in-flight lock via voting state, and a clean revert in the catch block.; Strong modal accessibility via ModalShell: focus moves into the panel, Tab is trapped, Escape and backdrop both route through the dirty-guard (window.confirm discard), and focus returns to the opener on close — plus role=alert on save errors.; Disciplined register adherence: h1 in the display face (Bricolage) reserved for the page title while card titles stay in the body family, single-column max-w-2xl keeps thread prose at a readable measure, and no gradient text / side-stripes / hero-metric slop.; Color is never the sole signal where it matters: the Closed badge carries a text label, vote arrows fill (not just recolor), and tokens are explicitly engineered to hold AA in both light and dark.

**Quick wins:** Add aria-pressed to the up/down vote buttons and an aria-label to the score so the active vote and tally are announced.; Increase vote-button padding to meet a 44px touch target (p-2.5 or min-w/min-h).; Swap the footer pill fill from bg-page to bg-line/40 or add a border so the control grouping is visible on the card surface.; Replace article role=link with a stretched <Link> on the title to clear the nested-interactive ARIA violation.

**Slop flags:** Modal scrim uses backdrop-blur-sm (mild glassmorphism)

---

### UserProfile — 84/100  `/u/:id`

> A dense, honest members-only profile with excellent state and modal accessibility; held back from ship-grade only by sub-spec touch targets and two too-small status badges.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | 8 | 8 | 7 | 8 | 8 | 9 | 9 |

**Issues**

- `P1` **layoutSpacing** — Primary action buttons (Message / Edit profile / LinkedIn) use px-3 py-1.5 text-sm, yielding ~30px tall hit areas — below the 36-44px touch-target minimum. The Back button (text-sm, no padding) is even smaller. On mobile these are the page's only interactive controls and are hard to tap. _(UserProfile.jsx:90-100 (.btn-outline/.btn-primary with px-3 py-1.5) and :47/:61 (Back button))_
  → **Fix:** Bump action buttons to at least py-2 (or min-h-[40px]); give the Back button py-1.5 px-2 -ml-2 so its tap area reaches ~40px while staying visually flush.
- `P1` **typography** — Two status badges render at text-[10px] (incubation chip) and the MemberTypeBadge at text-[10px], both bold/uppercase. 10px uppercase is below comfortable legibility and the two badges sit adjacent in the same name row, compounding the strain. _(UserProfile.jsx:75 (incubation chip text-[10px]) and MemberTypeBadge.jsx:7 (text-[10px]))_
  → **Fix:** Raise to text-[11px] (matching PostCard's badge scale at :76/:79) and drop uppercase on at least one to reduce density; or convert MemberTypeBadge to a non-uppercase 11px chip.
- `P2` **accessibility** — Back uses navigate(-1); when a member opens /u/:id via a shared/deep link with no in-app history, this either dead-ends or leaves the app. There is no semantic <main>/landmark wrapper on the page either (relies on the app shell). _(UserProfile.jsx:47 and :61 onClick={() => navigate(-1)})_
  → **Fix:** Fall back to a known route (e.g. navigate(-1) only if window.history.length>1, else navigate('/directory')); confirm the app shell wraps this in a <main> landmark.
- `P2` **accessibility** — Avatar initial (h-16 w-16 grid initial) conveys identity visually but has no accessible name of its own; it relies entirely on the adjacent h1. Acceptable, but the colored incubation/member badges encode status by color+tiny text only. _(UserProfile.jsx:67-69 (avatar) and :75 (incubation badge))_
  → **Fix:** Add aria-hidden to the purely-decorative avatar initial; the text labels on badges already satisfy color-not-sole-signal, so no further change needed there.
- `P2` **contrastColor** — incubation chip and MemberTypeBadge are accent (navy #2C2A82 / dark blue #6E8BFF) on accent-soft. In light mode navy-on-#EAEAF7 passes; in dark mode #6E8BFF on #1A1E30 is borderline for 10px (small text needs 4.5:1) — worth verifying the brighter accent against the deep-blue soft surface at that size. _(UserProfile.jsx:75 / MemberTypeBadge.jsx:7 (text-accent on bg-accent-soft))_
  → **Fix:** Verify #6E8BFF on #1A1E30 hits 4.5:1 at 10-11px; if marginal, use a slightly brighter accent for badges in dark or increase size to reduce the contrast requirement.

**Strengths:** Exemplary state coverage: distinct loading skeleton, not-found card, empty-posts state, plus a fully-built ContactModal with optimistic sent confirmation and human error copy ('Could not reach the message service. Is send-contact deployed?').; ModalShell is a genuinely accessible dialog — focus moves in on open, Tab is trapped, Esc and backdrop both route through onRequestClose (so dirty-guards apply), focus returns to opener, with role=dialog/aria-modal/aria-labelledby wired correctly.; Density and clarity suit the product register: max-w-2xl keeps bio line-length readable, flex-wrap handles mobile gracefully, and the conditional action row (Edit when self, Message when contactable) keeps the UI honest to permissions.; Restrained slop profile — no gradient text, no side-stripe accents, no hero-metric template; the only divider is a legitimate 1px border-t, and badges are real status signals rather than decorative eyebrows.

**Quick wins:** Bump .btn-primary/.btn-outline on this page to py-2 and give the Back button a padded tap area (~40px).; Raise badge text from text-[10px] to text-[11px] to match PostCard's badge scale and improve legibility.; Add aria-hidden="true" to the decorative avatar initial div.; Guard navigate(-1) with a history-length check and fall back to the directory route for deep-linked visits.

---

### Settings — 84/100  `/settings`

> Solid, honest, product-register settings page with real optimistic feedback and good a11y; held back by a badge that never renders (unfetched member_type), a native window.confirm where a styled modal exists, and a split sign-out mental model.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | 8 | 8 | 8 | 8 | 8 | 8 | 9 |

**Issues**

- `P1` **uxCopyStates** — MemberTypeBadge is fed profile?.member_type, but the Supabase select on line 41 only fetches name, role, directory_visible, contactable, notification_prefs. member_type is never queried, so the badge always renders null. The Account card silently loses the member-type identity it was designed to show. _(Settings.jsx line 41 (.select) vs line 131 (<MemberTypeBadge type={profile?.member_type} />))_
  → **Fix:** Add member_type to the select string: .select('name, role, member_type, directory_visible, contactable, notification_prefs').
- `P1` **uxCopyStates** — signOutEverywhere and 'Sign out everywhere' button use window.confirm for a destructive action, but the codebase has a purpose-built ConfirmModal.jsx (untracked, in components). Native confirm() is unstyled, ignores theme, is not focus-trapped consistently, and clashes with the otherwise polished surface. Same applies to the lack of any success/redirect feedback after global sign-out. _(Settings.jsx line 106 window.confirm; button line 219)_
  → **Fix:** Replace window.confirm with the in-app ConfirmModal (role=dialog, focus trap, Escape) already present in the repo, matching the styled error/success patterns used elsewhere on the page.
- `P1` **uxCopyStates** — Two separate sign-out controls create confusion: 'Sign out everywhere' lives in the Security card (line 219) and a plain 'Log out' lives in a dedicated Session card at the bottom (line 238). The single-device log-out is buried below Appearance, far from the global sign-out it relates to, splitting one mental model across two cards. _(Settings.jsx Security section line 214-220 and Session section line 234-239)_
  → **Fix:** Co-locate both sign-out actions in one Session/Security block: primary 'Log out (this device)' plus secondary 'Sign out everywhere', so the user compares scope in one place.
- `P2` **accessibility** — The password form has no visible labels associated programmatically as <label for>; the field name lives in a <span> inside the <label> wrapper, which is acceptable, but there is no aria-live region tying pwError/pwOk to the inputs, and the inputs have no aria-invalid/aria-describedby on error. Screen-reader users editing the field won't have the error linked to the control. _(Settings.jsx lines 192-206)_
  → **Fix:** Add aria-invalid={!!pwError} to the password inputs and wire aria-describedby to the alert div's id so the validation message is announced in context.
- `P2` **accessibility** — Theme toggle and toggles generally rely on a tiny text 'On'/'Off' in the description plus aria-checked. Good. But the Appearance Dark mode toggle change is not announced (no status), and theme switch fires an immediate class toggle with no respect for an in-app reduced-motion concern for the sliding knob — minor, the slide is transform-based and short. _(Settings.jsx lines 224-232 and Toggle line 274 (translate transition))_
  → **Fix:** Acceptable as-is; optionally gate the knob transition under prefers-reduced-motion (the global CSS rule only covers animate-pop-in/fade-in, not the toggle's transition-transform).
- `P2` **contrastColor** — text-faint (#71748C light / #8C8D96 dark) is used for genuinely informational sentences ('Email and role are managed by IFN', 'You are hidden from the Directory'). Tokens are documented to pass 4.5:1, but faint is the floor; using it for actual instructions (not timestamps/placeholders) pushes the lowest-contrast token onto content the user must read. _(Settings.jsx line 139 and line 184 (text-faint))_
  → **Fix:** Use text-muted (a safer AA margin) for these instructional sentences and reserve text-faint for placeholders/timestamps as the token comment intends.
- `P2` **uxCopyStates** — Optimistic toggles roll back on error and flash 'Not saved', which is good, but the rollback gives no actionable message (why it failed, retry). The transient 2.5s 'Saved'/'Not saved' marker also disappears for keyboard/SR users before they may reach it, and is not in an aria-live polite region that persists. _(Settings.jsx flash() line 57-60; Row status spans line 254-255)_
  → **Fix:** Wrap the per-row status in an aria-live=polite container and keep 'Not saved' until the next interaction (not auto-dismissed), optionally with a Retry affordance.

**Strengths:** Genuinely optimistic UI done right: toggles update immediately, persist per-column, and roll back state on failure with a visible 'Not saved' marker (saveColumn/toggle* lines 62-84) — exactly the task-efficient pattern a settings page needs.; Strong accessibility foundations: custom Toggle uses role=switch + aria-checked + aria-label borrowed from the label, focus-visible ring with ring-offset-card, and disabled handling; password errors use role=alert, successes role=status.; Restrained, product-register design that honors PRODUCT.md: single max-w-2xl column, semantic <section>/<h2> per group, no gradients, no eyebrows, no hero metrics, no AI-slop card grid — chrome stays quiet.; Skeleton loading state for the account block (lines 122-126) instead of a spinner or layout shift, and disabled toggles during load.; Password validation messaging is human and specific ('Use at least 8 characters.', 'The two passwords do not match.') and the submit button reflects busy state.

**Quick wins:** Add member_type to the .select() so the MemberTypeBadge actually renders (one-word fix, restores intended identity display).; Swap window.confirm for the existing ConfirmModal on 'Sign out everywhere'.; Merge the lone Session 'Log out' card into the Security sign-out block so scope choices live together.; Switch the two text-faint instructional paragraphs to text-muted for a safer contrast margin.; Add aria-invalid + aria-describedby to the password inputs linking the role=alert message.

**Slop flags:** MemberTypeBadge uses tiny uppercase tracked text (text-[10px] uppercase tracking-wide) — acceptable as a single badge, not a per-section eyebrow, so not penalized heavily.; Password field labels use text-xs font-bold uppercase tracking-wide (lines 200, 204) — borderline tiny-uppercase-label pattern, but confined to form labels rather than decorative section eyebrows.

---

### Admin Panel — 84/100  `/admin`

> Solid, task-efficient admin surface with exemplary modal/tablist accessibility and on-register restraint; main gaps are sub-12px status type, a few tinted-on-tint contrast risks, and an under-wired Combobox for keyboard/SR users.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | 7 | 7 | 8 | 9 | 9 | 9 | 9 |

**Issues**

- `P1` **accessibility** — Combobox implements role=combobox/listbox with a visual highlight (hi index) but never sets aria-activedescendant on the input and never sets aria-selected to follow the keyboard highlight. Screen-reader users hear nothing as they arrow through options, and the highlighted row is not scrolled into view in the max-h-56 scroll container. _(web/src/components/Combobox.jsx — <input role="combobox"> (line 49) and <li role="option"> (line 69))_
  → **Fix:** Give each option an id and set aria-activedescendant={list[hi]?id} on the input; set aria-selected={i===hi}; on hi change call optionEl.scrollIntoView({block:'nearest'}).
- `P1` **contrastColor** — Status text rendered in token color over a same-hue tint at very small sizes risks falling under 4.5:1 / 3:1. text-down (#C81E32 light) on bg-down/10 and text-warnink (#7A5F00) on bg-warn/15 at 10px/11px are the borderline cases; the 10px Banned/Read-only badges and 10-11px pipeline chips are below the size where AA large-text relief applies, so they must clear 4.5:1. _(AdminPanel.jsx lines 285-286 (badges), 482/563-566 (pipeline chips text-[10px]/[11px]), waitingChip tones from lib/pipeline)_
  → **Fix:** Verify each tinted-on-tint pairing in both themes with a checker; bump the smallest status labels to text-[11px]/text-xs and/or darken the ink token used on tints (e.g. a dedicated -onTint variant) so 10-11px text clears 4.5:1.
- `P2` **typography** — Heavy reliance on sub-12px type for meaningful content, not just metadata: pipeline row IFN/gate/chips at text-[10px]/[11px], member sublines text-xs, and the autopsy root-cause body text at text-xs. Below 12px hurts scannability of the densest, most-used admin view. _(AdminPanel.jsx PipelineTab rows (lines 563-569), autopsy 'Why it failed' block (line 361))_
  → **Fix:** Promote primary row data (IFN tag, gate, title author) to text-xs/text-sm; reserve text-[10px] strictly for the stale/secondary chip, not for the row's identifying metadata.
- `P2` **accessibility** — Pipeline select-row checkbox is 16px (h-4 w-4), below the 36-44px touch target minimum; on the bulk-assign flow this is the primary repeated tap target on mobile/tablet. _(AdminPanel.jsx PipelineTab — <input type="checkbox" className="h-4 w-4"> (line 558))_
  → **Fix:** Wrap the checkbox in a min-h-9 min-w-9 grid place-items-center label so the hit area is >=36px while the visual box stays 16px.
- `P2` **hierarchy** — Six tabs on a max-w-3xl column wrap to two rows on tablet/mobile with no grouping; Members/Pipeline/Requests (queues) sit beside Add member/Settings (config) with equal weight, so the operator's most frequent 'inbox' tasks don't stand out from configuration. Count badges (Members N, Autopsies N) compete with the Requests pending dot. _(AdminPanel.jsx tablist (lines 249-256))_
  → **Fix:** Either order tabs by frequency (queues first, Settings/Add last) or visually separate the config tabs; consider a count chip on Requests too so the three queues read as one scannable group.
- `P2` **uxCopyStates** — CreateMemberTab copy() and RequestsTab copy() swallow clipboard failures silently (empty catch) — on a non-secure context or denied permission the user clicks Copy, sees no checkmark and no error, and the once-shown password may be lost. _(AdminPanel.jsx line 603 and 732 (empty catch {}))_
  → **Fix:** On catch, surface a small inline 'Copy failed — select and copy manually' message or auto-select the credential text so the password isn't silently unrecoverable.
- `P2` **accessibility** — Inconsistent labeling between the page-level tablist (full ARIA: id, aria-controls, roving tabindex, Home/End) and the PipelineTab sub-tablist, which omits aria-controls to its panel and only handles ArrowLeft/Right (no Home/End). Two tablists on one screen behave differently for keyboard users. _(AdminPanel.jsx PipelineTab inbox/all tabs (lines 486-500))_
  → **Fix:** Add aria-controls pointing at the results region and mirror the page tablist's key handling, or factor a shared Tabs primitive so both behave identically.

**Strengths:** Exemplary modal accessibility: ModalShell traps Tab, handles Escape, returns focus to the opener, and uses role=dialog/aria-modal/aria-labelledby; ConfirmModal centralizes destructive+audited confirmations with optional required reason.; Page tablist is a model implementation — roving tabindex, ArrowLeft/Right/Home/End, aria-selected, aria-controls, and focus moved via requestAnimationFrame; tabpanel is correctly wired.; Color is never the sole signal: role/status badges keep text labels, the Requests pending dot carries role=status + aria-label, matching the product's stated AA commitment.; Genuinely human empty/loading/error states throughout: ListSkeleton, 'Nothing needs your attention right now.', 'No pending autopsies to review. Good job!', and a consistent role=alert error banner pattern.; Design tokens are disciplined and theme-correct: faint/muted documented to pass 4.5:1 in both modes, disabled primary swapped to a flat neutral chip instead of faded navy, dark-mode black-hover overlay flipped to white — all on-register with 'issued, not branded'.; Motion is restrained and safe: only short fade/pop entrances, prefers-reduced-motion disables them, and no content is gated behind animation (renders fine headless).

**Quick wins:** Add aria-activedescendant + scrollIntoView to Combobox so keyboard option navigation is announced and visible.; Bump the smallest status labels (Banned/Read-only badges, pipeline chips) from text-[10px] to text-[11px]/text-xs and confirm tinted-on-tint pairs clear 4.5:1 in both themes.; Wrap the pipeline select checkbox in a min-h-9/min-w-9 label to reach a 36px touch target.; Replace the two empty clipboard catch blocks with an inline 'Copy failed' fallback so the once-shown password is never silently lost.; Add Home/End + aria-controls to the PipelineTab sub-tablist to match the page tablist.

**Slop flags:** Tiny 10px uppercase tracked labels (RoleBadge, Banned/Read-only) edge toward the eyebrow anti-pattern, but they carry real status text rather than decorative section labels — borderline, not a clear violation.; Selected bulk-assign card uses border-accent/30 as an all-around emphasis border (not a left/right side-stripe) — acceptable, no ban hit.

---

### Login — 82/100  `/login`

> A clean, on-brand auth screen with excellent state/copy handling and zero slop, held back from ship-grade by missing landmark/h1 semantics and the absence of client-side field validation.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | 8 | 8 | 8 | 9 | 6 | 8 | 10 |

**Issues**

- `P1` **accessibility** — No semantic landmark or h1: the page jumps straight to <h2> 'Back to the Network' with no <main> wrapper and no <h1>. Heading order starts at level 2, and there is no landmark for screen-reader/skip navigation. index.css even reserves font-display for h1 but this page never uses one. _(Login.jsx:75-79 — outer <div className="min-h-screen grid place-items-center"> and <h2 className="text-lg font-semibold">)_
  → **Fix:** Wrap the form region in <main> and promote the title to <h1 className="text-lg font-semibold"> (or add a visually-hidden h1). This also picks up the font-display + letter-spacing h1 styling already defined in index.css.
- `P1` **uxCopyStates** — noValidate disables native HTML validation and there is no client-side field validation: submitting empty email/password (with captcha off, the default in prod per captcha-turnstile memory) sends a blank request and relies entirely on a server round-trip to produce 'Incorrect email or password.' No inline 'Email is required' messaging, and inputs lack the required attribute. _(Login.jsx:77 (noValidate), :90-103 (email/password inputs have no required, no aria-invalid))_
  → **Fix:** Add a lightweight pre-submit check: if !email or !password, setError('Enter your email and password.') and focus the first empty field. Add aria-invalid on the offending input and aria-describedby pointing at the alert so the error is announced and tied to the field.
- `P2` **accessibility** — The PasswordInput show/hide toggle has no visible focus ring — it uses focus-visible:text-accent (a color change only) with focus-visible:outline-none. Color-only focus is a weak indicator and fails the color-not-sole-signal spirit; every other control in the app uses a ring. _(PasswordInput.jsx:22 — button className 'focus-visible:outline-none focus-visible:text-accent')_
  → **Fix:** Replace with focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 (drop the outline-none-only pattern) to match .btn focus treatment.
- `P2` **layoutSpacing** — 'Forgot password?' is a text-xs (12px) link whose hit area is just the text height (~16px) — well under the 36-44px touch target minimum, and it sits right-aligned at the edge where mis-taps are likely on mobile. _(Login.jsx:106-110 — <div className="mb-4 text-right"><Link className="text-xs ...">)_
  → **Fix:** Bump to text-sm and add padding (e.g. inline-block py-1 -my-1) to grow the tap target without disturbing layout.
- `P2` **hierarchy** — The error alert is rendered above the email field (top of form), so on a failed login the message can scroll out of view on short mobile viewports while the user is focused on the button at the bottom. Optimistic feedback (the alert) is far from the action. _(Login.jsx:82-86 — error block placed before inputs, button at :125)_
  → **Fix:** Consider rendering the alert just above the submit button, or scroll/focus the alert on error (alertRef.focus()) so it's seen and announced near the point of failure.

**Strengths:** Genuinely clean auth screen with zero AI-slop: no gradient text, no glassmorphism, no eyebrow labels, no side-stripe accents — a single centered card on textured paper, exactly matching the 'issued, not branded' product principle.; Excellent state coverage: distinct loading ('Signing in...'), rate-limit cooldown ('Try again in Ns') with a ticking timer, role=alert error region, and vendor error strings mapped to human copy via authErrors.js so GoTrue text never leaks to the user.; Thoughtful captcha lifecycle — single-use Turnstile tokens are reset on every failed attempt (resetCaptcha) so retries don't 400, and the widget is gated behind a sitekey kill switch with theme:'auto' to follow the app theme.; Strong reduced-motion handling: animate-pop-in is explicitly disabled under prefers-reduced-motion and no content is gated behind the animation (renders fully on headless), and the animation is transform/opacity only — no layout-property animation.; Inputs are properly labeled (htmlFor/id pairs), correct autoComplete tokens (email / current-password), and PasswordInput exposes an accessible, keyboard-reachable show/hide toggle with aria-pressed + aria-label.

**Quick wins:** Wrap the card in <main> and change <h2> to <h1> to fix heading order and gain the font-display title styling for free.; Add a pre-submit empty-field guard with focus management and aria-invalid/aria-describedby on the inputs.; Give the password show/hide toggle a real focus-visible ring instead of a color-only change.; Bump 'Forgot password?' to text-sm with vertical padding to reach a 36px+ touch target.

---

### ForgotPassword — 82/100  `/forgot-password`

> A clean, restrained, on-brand reset form with excellent anti-enumeration UX; held back only by missing h1/main landmarks, no client-side validation/aria wiring, and a couple of minor a11y polish gaps.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | 8 | 8 | 8 | 9 | 6 | 8 | 10 |

**Issues**

- `P1` **accessibility** — No page-level <h1> and no <main> landmark. Both the form and success states start at <h2> (ForgotPassword.jsx:40, :58), so the document has no top-level heading and no semantic main region. Screen-reader users get a heading hierarchy that skips h1, and there is no landmark to jump to. _(ForgotPassword.jsx:35-36, 54-56 (outer <div className="min-h-screen grid place-items-center">) and :40/:58 headings)_
  → **Fix:** Wrap the centered content in <main> and promote the card titles to <h1> (the page's sole heading), keeping the same visual classes (text-lg font-semibold).
- `P1` **uxCopyStates** — Form has noValidate but no client validation and the email input lacks required, so submitting an empty/garbage field fires supabase.auth.resetPasswordForEmail with an empty string. There is no inline field-level validation message and no aria-describedby tying the error alert to the input. _(ForgotPassword.jsx:56 (noValidate), :69-73 (input has no required / no aria-invalid / no aria-describedby))_
  → **Fix:** Add required + a lightweight pre-submit check (empty / no @) that sets a field error; give the input aria-invalid={!!error} and aria-describedby pointing at the alert's id so AT announces the association.
- `P2` **accessibility** — Loading state only swaps button text ('Sending...'); the button is not marked aria-busy and the disabled state is the sole programmatic signal. The success checkmark glyph '✓' (line 38) is exposed text with no aria-hidden, so it may be read literally. _(ForgotPassword.jsx:76-78 (button) and :37-39 (✓ glyph))_
  → **Fix:** Add aria-busy={loading} to the submit button and aria-hidden="true" to the decorative ✓ span (the adjacent 'Check your email' h-heading already conveys success).
- `P2` **layoutSpacing** — In the success state the user-entered email is echoed inline inside a max-w-sm card with no word-break (ForgotPassword.jsx:43). A long unbroken local-part/domain can overflow or stretch the card layout on mobile. _(ForgotPassword.jsx:43 <span className="font-semibold text-ink">{email}</span>)_
  → **Fix:** Add break-words (or break-all) to the span, or truncate, so a long email wraps inside the card.
- `P2` **contrastColor** — Error alert uses text-down on a bg-down/10 tint (ForgotPassword.jsx:62). In light mode down is rgb(200,30,50) on a ~10%-red-on-white tint; this is near the 4.5:1 line for small body text and not verified against the actual composited tint in either theme. _(ForgotPassword.jsx:62 (div role=alert: bg-down/10 text-down))_
  → **Fix:** Verify text-down/bg-down/10 hits >=4.5:1 in both themes; if marginal, darken the error text token (e.g. a dedicated --c-down-ink) for alert copy rather than reusing the saturated status color.

**Strengths:** Disciplined, slop-free: a single centered max-w-sm card, flat brand-navy button, no gradient text, no side-stripe accents, no eyebrow labels or hero metrics. Fully on-register for an issued, institutional product.; Strong UX on the security-sensitive path: non-enumerating success copy ('If an account exists for X...') and generic catch-all error message avoid account enumeration while staying human.; Error surfaced via role="alert"; input has a real <label htmlFor>, type=email, and autoComplete=email; focus-visible rings and prefers-reduced-motion are handled centrally in index.css.; Clear loading affordance (button disabled + 'Sending...') and a well-designed success state with a path back to login.

**Quick wins:** Add required + aria-invalid/aria-describedby to the email input and a pre-submit empty-check to avoid firing requests on blank input.; Wrap content in <main> and promote the card title to <h1> for landmark + heading hierarchy.; Add aria-busy={loading} to the submit button and aria-hidden to the decorative ✓ glyph.; Add break-words to the echoed {email} span in the success state to prevent overflow.

---

### ResetPassword — 82/100  `/reset-password`

> A clean, slop-free, state-complete recovery form that nails the institutional register; held back from ship-grade only by missing landmarks/h1, a conditionally-mounted alert region, and an unlabeled success icon.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | 8 | 8 | 8 | 9 | 6 | 8 | 10 |

**Issues**

- `P1` **accessibility** — No semantic landmark or H1. The page renders a bare div as root with the card heading as an h2 ("Set a new password"), so there is no <main> and no top-level heading on the document. A standalone auth route should expose a single <main> landmark and an h1. The design-token rule (h1 uses font-display) is also never exercised here, so this page is the only level-2 heading in the document tree. _(ResetPassword.jsx:43,59,75 (root <div className="min-h-screen...">) and the three <h2> headings (lines 45, 64, 78))_
  → **Fix:** Wrap each return in <main> and promote the card title to <h1> (the design system already styles h1 with font-display + tracking). Keeps one landmark + one top heading per the impeccable/PRODUCT a11y bar.
- `P1` **accessibility** — Error alert region is conditionally mounted, not aria-live. The <div role="alert"> at line 82 only renders after error is set, so it is inserted into the DOM rather than updated in place. Screen readers may miss the announcement on first error (and definitely on the inline validation errors at lines 19-20 which set the same node). role=alert on a freshly-inserted node is unreliable across SR/browser combos. _(ResetPassword.jsx:81-85 ({error && (<div role="alert" ...>)))_
  → **Fix:** Render a persistent <div role="alert" aria-live="assertive"> wrapper that is always in the DOM and only swap its text content, so changes are reliably announced. Also wire aria-invalid/aria-describedby on the two inputs to the message.
- `P1` **accessibility** — Success confirmation uses a bare checkmark glyph with no accessible text and color-only success signal. The green ✓ chip (line 61-63) is decorative text the SR will read as "check mark" with no role; the only status conveyed visually is the green tint. The heading "Password updated" carries the meaning but the icon itself is unlabeled noise. _(ResetPassword.jsx:61-63 (<div ... bg-success/15 text-success>✓</div>))_
  → **Fix:** Add aria-hidden="true" to the icon div so SRs skip it, and rely on the h1 for the announcement. Optionally move focus to the heading on done so the success is announced on the recovery flow.
- `P2` **uxCopyStates** — No client-side guard against submitting the user's existing password, despite the copy promising it ("Choose a password you have not used here before." line 79). Supabase will reject same-password with a raw API string surfaced verbatim via setError(updateError.message) (line 26), so the human-written copy promise is enforced only by an unstyled backend error message. _(ResetPassword.jsx:79 vs 24-27 (updateUser + raw updateError.message))_
  → **Fix:** Either soften the copy to not promise enforcement the client cannot check, or map known Supabase error codes (e.g. same_password) to a friendly message instead of passing message through raw.
- `P2` **uxCopyStates** — Password mismatch / length errors are only validated on submit, not inline, and there is no positive affordance (e.g. show-password toggle) on either field. For a recovery flow where the user is re-typing a brand-new password twice blind, the lack of a reveal toggle raises error rate. _(ResetPassword.jsx:89-93, 98-102 (both type="password" inputs))_
  → **Fix:** Add a show/hide toggle button inside the field (aria-pressed, 44px target) and consider live mismatch feedback once both fields are touched.
- `P2` **contrastColor** — Error text uses text-down on bg-down/10 with a border-down/30. In light mode down=rgb(200 30 50) on a 10%-of-down tint over white is comfortably AA, but in dark mode down=rgb(242 106 126) (a light pink) on bg-down/10 over the near-black card sits around the 4.5:1 line and the border-down/30 hairline is barely visible. Worth an explicit measurement. _(ResetPassword.jsx:82 (border-down/30 bg-down/10 text-down))_
  → **Fix:** Verify dark-mode text-down on the composited tint meets 4.5:1; if marginal, use a solid token for error text (the down token at full strength) rather than relying on the tinted stack.

**Strengths:** Zero AI-slop: no gradient text, no side-stripe accents, no glassmorphism, no hero-metric template, no uppercase tracked eyebrows. Flat brand-navy primary button and a single bordered card — exactly the 'issued, not branded' register PRODUCT.md asks for.; Genuinely complete state machine for a recovery route: loading (returns null while recovery session resolves), invalid/expired-link state with a recovery CTA to /forgot-password, busy state on the button ('Updating...'), explicit error state, and a distinct done/success screen. Most reset pages ship 2 of these 5.; Motion is purposeful and safe: animate-pop-in is a short 0.16s transform/opacity in, and prefers-reduced-motion is honored globally (index.css:114) so nothing is gated on animation — headless renders fully.; Correct form semantics on the inputs: htmlFor/id pairing on both labels, autoComplete="new-password", type="password", noValidate so custom messaging owns validation. btn focus-visible ring + ring-offset-page comes from the .btn token.; Disabled primary button is a neutral line/muted chip (not faded navy), avoiding the pale-purple low-contrast blob — a deliberate, well-reasoned token decision.

**Quick wins:** Add aria-hidden="true" to the ✓ icon div (line 61) — one attribute, removes SR noise.; Wrap each return body in <main> and promote the three card <h2> titles to <h1> to give the route a landmark + top heading (and finally exercise the font-display h1 token).; Make the error region persistent with aria-live="assertive" instead of conditionally mounting role=alert, so both inline-validation and API errors announce reliably.; Add a show/hide password toggle to reduce blind-retype errors on the confirm field.; Wire aria-invalid + aria-describedby from both inputs to the error message id.

---

### Idea Pipeline (student home) — 82/100  `/pipeline`

> A dense, trustworthy founder-triage screen with exemplary empty/error/loading/draft states; held back from ship-grade only by missing focus rings on the list rows and a couple of marginal-contrast neutral chips.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | 7 | 8 | 8 | 9 | 7 | 10 | 9 |

**Issues**

- `P1` **accessibility** — The pipeline list rows are raw <button> elements (Pipeline.jsx line 90-94) that do NOT apply the .btn class, so they inherit no focus-visible ring. Keyboard users tabbing through the list get only the default browser outline (often suppressed by the reset/tap-highlight rules) and cannot reliably see which idea is focused. These are the primary navigation targets on the page. _(Pipeline.jsx line 90-94, button className="block w-full p-4 text-left hover:bg-black/5")_
  → **Fix:** Add an explicit focus ring, e.g. focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-inset (or focus-visible:bg-accent-soft) so keyboard focus is visible on every row.
- `P1` **contrastColor** — The 'In mentor queue' and 'Done' chips use bg-line text-muted at text-[11px] font-semibold (waitingChip / STATES tones in pipeline.js). muted (#5B5D75 light / #A1A1AB dark) sits on the line tint (#E4E0D6 / #28282D), and at 11px this is below the 4.5:1 needed for small text — line is a very pale warm gray, eroding contrast versus the page white assumption. _(lib/pipeline.js WAITING['mentor-pool'].tone and WAITING.none.tone ('bg-line text-muted'), rendered at Pipeline.jsx line 101)_
  → **Fix:** Use a darker foreground on the neutral chip (text-ink instead of text-muted) or bump the chip background, and verify 'bg-line text-muted' at 11px against both themes with a contrast checker; the success/warn-ink chips already do this correctly.
- `P2` **layoutSpacing** — The chip remove button in MultiSelect (the X to deselect a sector) is a bare <button> wrapping a 12px icon with no padding, giving a touch target well under the 36-44px minimum. On mobile inside the application modal this is hard to hit accurately. _(MultiSelect.jsx line 40-47, <button aria-label={`Remove ${v}`}> with <X size={12} />)_
  → **Fix:** Add hit-area padding (e.g. p-0.5 -m-0.5 plus a larger tap zone) or increase to size 14 with padding so the interactive area reaches ~36px while keeping the visual chip compact.
- `P2` **accessibility** — The list of applications is a sequence of <button> rows with no enclosing heading or landmark; the page jumps from h1 'Idea Pipeline' straight to interactive rows, and the 'How it works' / list sections are unlabeled for screen-reader navigation. The empty-state Workflow icon (line 79) also lacks aria-hidden. _(Pipeline.jsx line 85 (list container) and line 79 (decorative Workflow icon))_
  → **Fix:** Wrap the list in a section with an sr-only or visible h2 (e.g. 'Your applications'), and add aria-hidden to decorative lucide icons (Workflow, Lock, Plus already convey via adjacent text).
- `P2` **uxCopyStates** — Submit failure path is solid but the disabled 'Apply' button when locked gives no on-hover/focus explanation tied to the button itself; the locked banner is separate, so a keyboard user landing on the disabled button has no programmatic reason (no aria-describedby/title) for why it is disabled. _(Pipeline.jsx line 50-52 (disabled={locked} Apply button) and line 82 (Apply now button))_
  → **Fix:** Add title/aria-describedby linking the disabled Apply buttons to the locked banner text so the reason is conveyed without relying on visual proximity.

**Strengths:** Exemplary state coverage: loading skeleton shaped like real content, empty state with a clear CTA and human copy, role=alert errors, a locked-submissions banner, per-account localStorage draft autosave, character counters, and explicit validation messaging ('Complete every field marked *.') — this is the 'earn trust at the edges' principle fully realized.; ModalShell is a genuinely accessible dialog: focus moves into the panel on open, Tab is trapped, Escape and backdrop both route through onRequestClose (so dirty-guards apply), and focus returns to the opener on unmount, with role=dialog/aria-modal/aria-labelledby wired correctly.; Status is never carried by color alone — every waiting/state chip ships a text label (Your move, With mentor, In mentor queue, Needs admin, Done), satisfying the product's no-color-only rule.; Strong product register discipline: h1 uses the display face (Bricolage) while UI labels stay in the body family, max-w-2xl keeps a task-dense single column, and the gate G1-G6 numbering is real product semantics rather than decorative scaffolding.; Information density is high but scannable: each row fronts the IFN tag, title (truncated safely with min-w-0 flex-1 truncate), state + waiting chips, and a 'in this gate {timeAgo}' line — exactly the founder's next-action triage view.

**Quick wins:** Add focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-inset to the list row buttons (Pipeline.jsx line 93).; Swap text-muted for text-ink on the neutral bg-line chips in pipeline.js so 11px chip text clears 4.5:1.; Add aria-hidden to the decorative Workflow icon (line 79) and give the MultiSelect remove-X a padded hit area.; Wrap the row list in a <section> with an sr-only h2 ('Your applications') to restore heading order after the h1.; Add title/aria-describedby to the disabled Apply buttons pointing at the locked-submissions explanation.

**Slop flags:** Two tiny uppercase tracked micro-labels (text-[11px]/text-xs font-bold uppercase tracking-wide text-muted) on 'How it works' (line 64) and AppField labels (line 261) — defensible as functional section/field headers, but they edge toward the eyebrow-on-every-section pattern; keep them only where they label real groups.; Modal backdrop uses backdrop-blur-sm (ModalShell line 57) — standard scrim, not decorative content glassmorphism, so acceptable, but it is the one blur in play; ensure it stays off card surfaces.

---

### PipelineIdea (idea dossier) — 82/100  `/pipeline/:id`

> A dense, role-aware dossier that nails UX copy, state coverage, and slop avoidance; held back from ship-grade by native confirm() dialogs, color-as-sole-signal on the stepper, unlabeled rubric sliders, and borderline faint-text contrast on the paper surface.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | 7 | 7 | 8 | 8 | 6 | 9 | 9 |

**Issues**

- `P1` **accessibility** — Destructive actions use native window.confirm() instead of an accessible in-app dialog. WithdrawButton (line 247), admin reject final (line 984), and admin deleteIdea (line 990) all gate on window.confirm. The repo already ships an accessible ConfirmModal.jsx (untracked, in git status) and a proper ModalShell, so this is inconsistent with the app's own a11y standard and offers no styled, focus-trapped confirmation. _(PipelineIdea.jsx:247, 984, 990 — window.confirm(...))_
  → **Fix:** Replace window.confirm calls with the existing ConfirmModal/ModalShell pattern so confirmation is role=dialog, focus-trapped, Escape-dismissable, and theme-consistent.
- `P1` **accessibility** — Range inputs in the mentor rubric have no programmatic association to a visible label and no aria-valuetext. The <label> wraps the row but the score number (line 573) is separate text, and a screen reader announces only the bare slider value with no min/max context per criterion is fine, but the 7 sliders share generic semantics and the numeric readout is visual-only. _(PipelineIdea.jsx:567-576 — <input type="range"> inside ReviewForm)_
  → **Fix:** Add aria-label={r.label} (or htmlFor/id) and aria-valuetext to each range input so the criterion name and score are announced; keep the visible number in sync.
- `P1` **contrastColor** — text-faint (#71748C light / #8C8D96 dark) is used at tiny sizes on tinted/page surfaces for load-bearing metadata: file meta 'G3 · 1.2MB · 2d ago' (line 782), action-item byline/outcome (line 678), and the empty Circle icon (line 674). On bg-page paper (#F7F5F2) faint sits ~4.3-4.4:1 — borderline/below 4.5:1 for these 11px texts, and the dark faint on bg-card is similarly tight. _(PipelineIdea.jsx:678, 782 — text-[11px] text-faint)_
  → **Fix:** Use text-muted (which clears 4.5:1 in both modes) for these metadata rows, or bump faint usage to >=12px and verify against the actual paper/card bg, not white.
- `P2` **accessibility** — The MEETING LOG badge (line 827) and meeting-thread accent ring (border-accent/40, line 824) signal meeting state, but the 10px badge is the only text cue; the all-caps 10px 'MEETING LOG' is very small. Also the gate stepper buttons (line 285) convey current state purely via color/ring (stepDotClass) with the gate number unchanged — state (your move / in review / approved / rejected) is color-only on the dot. _(PipelineIdea.jsx:285-296 GateBar dot; 827 MEETING LOG)_
  → **Fix:** Add an aria-label to each gate button describing its status (e.g. 'Gate 3, in review') and bump the meeting badge to 11px; status is currently color-as-sole-signal on the stepper despite the status line above carrying text.
- `P2` **typography** — Heavy reliance on near-identical small sizes for distinct roles: text-[11px] uppercase tracking-wide for QA labels (line 270), text-xs for section h3s (line 650), text-[10px] badge, text-[11px] faint meta — the type scale below 14px is crowded and the QA 'eyebrow' labels (uppercase tracked 11px) appear on every Q&A row, which reads as scaffolding. _(PipelineIdea.jsx:270 QA label; 650/764/818/870 section headings)_
  → **Fix:** Differentiate: make QA question labels sentence-case 12px semibold (drop uppercase tracking so they don't read as repeated eyebrows), and reserve one consistent size/weight for all section headings.
- `P2` **accessibility** — The page renders content directly into <div className="max-w-2xl"> with no <main>/landmark and the h1 is the only heading above a series of <h3> section headings (Action items, Files, Mentor thread, History) — heading levels skip h2. The 'Application' summary and card titles are <div>/<summary> font-bold, not headings. _(PipelineIdea.jsx:56 root div; 650/764/818/870 h3 with no intervening h2)_
  → **Fix:** Wrap the dossier in <main>, and either promote section headings to a consistent h2 or ensure the document outline doesn't skip from h1 to h3.
- `P2` **contrastColor** — JUST_UNLOCKED forward banner uses text-success on bg-success/10 with a leading ✓ glyph (line 123-124). success token (#0E7A52) on a 10%-alpha green wash over paper is acceptable but the small-weight tail text ('next: <task>.') is regular weight green at 14px — verify >=4.5:1; the accent/80 sub-line in the refine banner (line 137) is accent at 80% opacity which drops below AA. _(PipelineIdea.jsx:137 text-accent/80; 123 text-success)_
  → **Fix:** Use full-opacity text-accent (not accent/80) for the refine explainer sub-line, and confirm success-on-tint clears 4.5:1 at body weight.

**Strengths:** Exceptional UX copy and state coverage: every surface has a human empty state ('Real progress happens between meetings; track it here.'), explicit whose-move notes (WorkArea lines 333-338), revision feedback echoed inline, and a single resolved status line (line 84) that collapses gate+task+state instead of chip arithmetic — exactly the 'every role sees its job' principle.; Strong information architecture for a dense multi-role page: the Application <details> auto-collapses past G3 for founders but stays open for mentors (line 95), so later stages don't re-read like the first; history merges submissions/reviews/transitions chronologically and hides nothing.; Destructive actions are genuinely well-handled at the copy level — withdraw/delete spell out exactly what is removed ('submissions, reviews, files and thread... cannot be undone'), admin actions require an audited reason (line 969), and approve is correctly blocked while open action items remain (line 602 with explanatory title).; Avoids nearly all AI-slop bans: no gradient text, no hero-metric template, no decorative glass, no side-stripe accent borders, no numbered-section scaffolding. The accent-bordered admin/meeting cards use border-color tints, not >1px side stripes.; Modal flow delegates to the shared accessible ModalShell (focus trap, Escape, role=dialog, aria-modal, focus return), and error/alert banners consistently carry role="alert". Motion is limited to skeleton pulse + token transitions with prefers-reduced-motion honored in index.css.

**Quick wins:** Swap the three window.confirm() calls (lines 247, 984, 990) for the existing ConfirmModal — instant a11y + visual consistency win.; Change text-faint to text-muted on the file meta (line 782) and action byline (line 678) to clear 4.5:1 on the paper background.; Add aria-label to each rubric range input (line 572) and each gate stepper button (line 285) so status isn't color/position-only.; Drop the uppercase tracking on QA labels (line 270) so per-row labels stop reading as repeated eyebrows.; Wrap the dossier body in <main> (line 56) and normalize section headings to h2 to fix the h1→h3 outline skip.

**Slop flags:** QA question labels rendered as tiny uppercase tracked eyebrows on every Q&A row (line 270) — borders on the 'eyebrow on every section' anti-pattern, though these are functional field labels not decorative.; Several near-identical .card lists (Action items, Files, History all use 'card divide-y divide-line' with similar p-3 rows) — acceptable density for a dossier but edges toward repeated identical card grids.

---

### Directory — 82/100  `/directory`

> Solid, dense, on-brand directory with first-class loading/empty/error states and a genuinely accessible contact modal; held back from ship-grade by custom-dropdown ARIA gaps, a sub-4.5:1 placeholder token, and an error branch that discards its own better copy.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | 7 | 8 | 8 | 9 | 6 | 9 | 9 |

**Issues**

- `P1` **accessibility** — Filter dropdown trigger buttons expose no open/close state or popup semantics to assistive tech. The Dropdown button (components/Dropdown.jsx) toggles a custom menu but has no aria-expanded, aria-haspopup, or aria-controls, and the popup div has no role=menu / the MenuItem buttons no role=menuitem. The active selection is also conveyed only by color (bg-accent-soft text-accent) with no aria-current/aria-selected, so a screen-reader or colorblind user cannot tell which filter value is chosen. _(web/src/components/Dropdown.jsx — <button onClick> (lines 19-27) and MenuItem (lines 41-52))_
  → **Fix:** Add aria-haspopup="listbox" / aria-expanded={open} to the trigger button; give the panel role="listbox" (or menu) and each MenuItem role="option" with aria-selected={active}. Also wire keyboard nav (Arrow/Esc) since it is currently mouse-only (mousedown close, no Esc, no focus management).
- `P1` **contrastColor** — The --c-faint token (#71748C / 113,116,140) is used for the search placeholder ('Search by name or startup...', .input placeholder:text-faint) and the 'This is you' label. On white card (#FFF) it measures ~4.0:1 — below the 4.5:1 WCAG AA threshold the token comment explicitly claims to pass. Placeholder text is the canonical failure case here. _(web/src/pages/Directory.jsx input (line 76, placeholder) + 'This is you' span (line 156); token --c-faint in index.css line 15)_
  → **Fix:** Darken light-mode --c-faint to ~#5F6275 (95,98,117) to clear 4.5:1 on #FFF, or move placeholder/secondary labels to text-muted (#5B5D75 passes). Re-verify the search-icon too (text-faint, line 75) though icons only need 3:1.
- `P2` **accessibility** — No semantic landmark or list structure. The page root is a bare <div className="max-w-4xl"> with no <main>/<section>, and the member results are a grid of <div>s rather than a <ul>/<li>, so the count of results and 'list' affordance is invisible to screen readers. The skeleton/loading swap also has no aria-busy/aria-live, so a SR user gets no announcement when results arrive. _(web/src/pages/Directory.jsx — root div (line 70), results grid (line 108), loading branch (lines 99-102))_
  → **Fix:** Wrap content in a landmark (or rely on an app-level <main>), render results as <ul role="list"> with <li> cards, and add aria-live="polite" + aria-busy={loading} to the results region so loading→loaded and the empty state are announced.
- `P2` **uxCopyStates** — Two divergent error strings for the same surface: load() failures set a specific human message ('Could not load the directory. Check your connection and retry.') but the error branch always renders the generic GENERIC_ERR ('Something went wrong. Please try again.') instead of the stored `error` value. The carefully written message is computed then thrown away; togglePin failures also surface only the generic text. _(web/src/pages/Directory.jsx — error branch line 96 (renders {GENERIC_ERR}) vs error set on line 58)_
  → **Fix:** Render {error} in the error card instead of the constant GENERIC_ERR so the specific, more actionable copy actually shows.
- `P2` **layoutSpacing** — Filter row can become cramped/awkward on narrow mobile: four w-52 (13rem) dropdown triggers plus a Clear button in a flex-wrap row stack to near-full-width pills, and the avatar pin-toggle button (admin) shares a tight header row with name + badge + pinned chip on a 1-col card, risking truncation collisions on small phones. _(web/src/pages/Directory.jsx — filter row (line 79, gap-2 flex-wrap) and card header (lines 111-137))_
  → **Fix:** Confirm on a 360px viewport; consider narrower trigger min-width on mobile and ensure the name's truncate + badges don't push the admin pin button past the edge (the row already uses min-w-0/shrink-0 correctly, just verify in browser).

**Strengths:** Excellent state coverage for the page's job: distinct loading (6-card skeleton matching the real card shape), empty ('No members match these filters.'), and error-with-Retry branches — exactly the 'earn trust at the edges' principle in PRODUCT.md.; ContactModal + ModalShell are genuinely accessible: focus moves into panel on open, Tab is trapped, Escape and backdrop both route through onRequestClose, focus returns to opener, role=dialog/aria-modal/aria-labelledby all present, and a real success state ('Message sent') with privacy-explaining copy.; Restrained, on-brand visual system: navy accent, accent-soft chips with ring, flat cards, no gradients/glassmorphism/hero-metrics. Dense and scannable — design serves the directory task rather than decorating it.; Motion is minimal and safe: only skeleton pulse + modal pop-in, prefers-reduced-motion honored in index.css, no content gated behind reveal animations (renders fully on headless).; Search is debounced (300ms) and the active-filter Clear button only appears when a filter is set — efficient, low-friction filtering UX.

**Quick wins:** Render {error} instead of {GENERIC_ERR} in the error card (line 96) so the better copy actually appears.; Darken --c-faint in light mode (~#5F6275) so the search placeholder clears 4.5:1.; Add aria-haspopup + aria-expanded to the Dropdown trigger and aria-selected to active MenuItems.; Render the results grid as <ul role=list>/<li> and add aria-live=polite + aria-busy to announce loading→loaded.; Add Escape-to-close and arrow-key navigation to Dropdown (currently mouse-only).

**Slop flags:** Tiny uppercase tracked badges (MemberTypeBadge and the 'Pinned' chip, text-[10px] font-bold uppercase tracking-wide) — acceptable as data labels, not section eyebrows, so minor.; Pinned cards use border-accent/40 as a full-card accent border (line 110) — not a banned side-stripe (all four sides), but verify it reads as state, not decoration.

---

### Onboarding — 79/100  `/onboarding`

> A clean, on-brand activation screen with zero visual slop and good copy/state care, held back from ship-grade by accessibility gaps in the comboboxes, the raw checkbox, and form-level (vs field-level) validation.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | 8 | 8 | 7 | 8 | 6 | 7 | 10 |

**Issues**

- `P1` **accessibility** — Required inputs are not programmatically required. The asterisk in label text ("Full name *", "Region *") is the only required indicator; no input carries `required` or `aria-required`. Screen-reader and browser-native validation cannot surface which fields are mandatory, and validation only fires on submit. _(Onboarding.jsx lines 80,86,94,97 — Field labels + their <input>/<Combobox> children)_
  → **Fix:** Add `required aria-required="true"` to the name input and pass a `required` prop through Combobox to its inner <input>; keep the visual asterisk but wrap it in an aria-hidden span or add aria-label clarifying "required".
- `P1` **accessibility** — Combobox does not announce the keyboard-highlighted option. It tracks `hi` for arrow-key navigation and applies bg-accent-soft visually, but never sets `aria-activedescendant` on the combobox input, and options have no stable ids. Keyboard SR users hear nothing as they arrow through Region/Sector/Domain. _(Combobox.jsx lines 42-55 (input) and 68-80 (option <li>))_
  → **Fix:** Give each option an id (e.g. `${id}-opt-${i}`), set `aria-activedescendant={hi>=0 ? optId : undefined}` on the input, and ensure ids only exist when `id` prop is passed (Onboarding currently passes no `id` to any Combobox — add region/sector/domain ids).
- `P1` **accessibility** — The 'interested in incubation' control is a raw native checkbox with no themed focus-visible ring and a ~16px hit area, well under the 36-44px touch target floor, and it does not inherit the app's accent color. _(Onboarding.jsx lines 114-117 — <input type="checkbox">)_
  → **Fix:** Style with `accent-accent h-4 w-4 rounded focus-visible:ring-2 focus-visible:ring-accent/50` and enlarge the clickable label (already wrapping) with `py-1.5`; the wrapping <label> gives a larger hit area but verify the box itself is >=20px with adequate padding.
- `P2` **layoutSpacing** — Input vertical size (.input = py-2 text-sm) yields ~34-36px tall controls — at the bottom edge of the 36-44px touch-target guideline on mobile, and the dropdown chevron tap zone in Combobox is a 16px icon. _(index.css .input (line 103); Combobox.jsx line 56 ChevronDown size={16})_
  → **Fix:** Bump mobile control height to min-h-[40px] and expand the chevron hit area to a full-height padded button (e.g. absolute inset-y-0 right-0 w-9 flex items-center).
- `P2` **uxCopyStates** — All validation is a single top-of-form error string; there is no per-field error binding (aria-describedby) and the first invalid field is not focused on submit, so on a 9-field form the user must hunt for the offending field. _(Onboarding.jsx submit() lines 41-47 + error banner line 77)_
  → **Fix:** After setError, programmatically focus the first invalid field and/or render the message adjacent to that Field with aria-describedby; keep the role=alert banner as a summary.
- `P2` **hierarchy** — No <main> landmark or skip context — the page is a bare div with the h1 not inside a semantic main region (no app shell here makes this more visible to AT users landing fresh). _(Onboarding.jsx line 68 outer <div className="min-h-screen">)_
  → **Fix:** Wrap content in <main> and ensure the h1 is the single page heading (it is); optionally add aria-labelledby tying the form to the h1.

**Strengths:** Clean, restrained layout that genuinely serves the product register: one centered card, logical 2-col grid, no decorative chrome, no AI-slop patterns (no gradient text, side stripes, eyebrows, or hero metrics) — slopBans is a perfect 10.; Design tokens are disciplined and dark-mode-aware; faint/muted tokens are explicitly tuned to pass 4.5:1 (comments document the intent), disabled button is a flat neutral chip rather than faded navy, and focus-visible rings are defined on .btn and .input.; Good first-run UX touches: name is seeded from profile then editable, live char counters on About (x/160), email shown locked/disabled, error uses role=alert, and reassuring footer copy ('You can edit all of this later').; Combobox supports free-text entry plus filtering with full keyboard arrow/enter/escape handling and click-outside close — strong for region/sector/domain where canonical lists are incomplete.

**Quick wins:** Add `required aria-required` to mandatory inputs and pass it through Combobox so browser/SR validation works, not just submit-time JS.; Theme the incubation checkbox (accent-accent, focus ring, larger hit area).; Pass id props to the three Comboboxes and wire aria-activedescendant so keyboard highlight is announced.; Focus the first invalid field on failed submit so the single error banner is actionable.; Wrap the page body in a <main> landmark.

---

### MentorReview — 79/100  `/mentor`

> A tight, task-focused mentor queue with excellent copy/state handling and zero slop; held back by missing focus rings, a non-semantic tablist, and an unlabeled filter.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | 7 | 8 | 7 | 8 | 5 | 9 | 10 |

**Issues**

- `P0` **accessibility** — The Tab() button (lines 158-169) and the 'mine' row buttons (line 131-135) are bare custom <button>s with no focus-visible ring. .btn focus styles are not applied here, so keyboard users get no visible focus indicator on the primary tab switcher or the clickable idea rows — the core navigation of the page is invisible to keyboard nav. _(MentorReview.jsx — Tab() className (no focus-visible:ring*) and <button className="block w-full p-4 text-left hover:bg-black/5"> at line 134)_
  → **Fix:** Add focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-page to both the Tab button and the row button.
- `P1` **accessibility** — The two tabs are not exposed as a tablist. They are plain buttons with no role=tablist/role=tab, no aria-selected, and the content region has no role=tabpanel. Screen-reader users cannot perceive the My-ideas / Available-ideas relationship or which is active; active state is color+bg only. _(MentorReview.jsx lines 63-76 (tab container) and Tab() component)_
  → **Fix:** Wrap tabs in role="tablist", give each Tab role="tab" + aria-selected={active}, add role="tabpanel" with aria-label to the list region; at minimum add aria-pressed={active}.
- `P1` **accessibility** — The sector filter <select> (line 71) has no <label> and no aria-label. A screen reader announces it only as an unlabeled combobox; its purpose is carried solely by the visible 'All sectors' option. _(MentorReview.jsx line 71 — <select className="input ml-auto w-auto py-1.5 text-xs">)_
  → **Fix:** Add aria-label="Filter available ideas by sector" to the select.
- `P1` **layoutSpacing** — Touch targets below 36-44px. The 'Pick up this idea' btn-primary (line 109, px-3 py-1.5 text-xs) renders ~28-30px tall, and the sector select (py-1.5) is similarly short — these are the queue's primary actions and sit close to the timestamp on mobile. _(MentorReview.jsx line 109 (btn-primary py-1.5) and line 71 (select py-1.5))_
  → **Fix:** Bump the pick button to py-2 / min-h-[36px] and the select to py-2; keep text-xs for density but raise the hit area.
- `P2` **contrastColor** — The IFN tag chip uses text-muted on bg-line (lines 95, 137). In light mode muted (#5B5D75) on line (#E4E0D6) is ~3.7:1 — bold 11px clears the 3:1 large/bold floor but sits at the edge and reads faint for an identifier. Dark mode is fine. _(MentorReview.jsx lines 95 and 137 — <span className="... bg-line ... text-muted">{ifnTag(r.ifn)}</span>)_
  → **Fix:** Use text-ink for the IFN tag to lift the identifier in light mode.
- `P2` **motion** — The loading skeleton uses animate-pulse (PipelineSkeleton.jsx line 6) but the prefers-reduced-motion block in index.css (lines 114-119) only disables animate-pop-in and animate-fade-in — the pulse keeps animating for reduced-motion users. _(PipelineSkeleton.jsx line 6 vs index.css lines 114-119)_
  → **Fix:** Add .animate-pulse to the prefers-reduced-motion: reduce rule (animation: none).
- `P2` **hierarchy** — On 'mine' rows both the pipeline-state chip and the waiting chip can render; for refine/rejected states this reads redundantly (e.g. 'Refine & retry' state + 'Your move' waiting) and crowds the right edge on narrow widths against the truncated title. _(MentorReview.jsx lines 138-142)_
  → **Fix:** Suppress the waiting chip when the state chip already implies the turn, or cap to one status chip per row to reduce right-edge crowding on mobile.

**Strengths:** Exceptional state coverage: dedicated loading skeleton, two context-aware empty states (sector-specific vs global), human error copy, optimistic 'Picking...' button text, and a real race-condition message ('Someone else picked this idea first.') — the 'earn trust at the edges' principle delivered.; IA matches the mentor's job: My-ideas tab leads with urgency ('· N need you'), the queue auto-activates when there are no mentees, and rows surface tag, title, sector, author and 'in this gate Xd' for fast triage.; Zero AI-slop: no gradients, no eyebrows, no side-stripe accents, no hero metrics, no repeated identical card grids; chrome stays quiet and idea titles are the hero, per PRODUCT.md.; Clean token discipline: shared .card, .btn-primary, .input, divide-line, accent-soft chips and the centralized pipeline.js status maps (waitingChip/STATES) — one system, no one-off styling.; Status is never color-only: every waiting/state chip carries a text label (With mentor, Your move, Refine & retry), satisfying color-not-sole-signal.

**Quick wins:** Add focus-visible ring classes to the Tab button and the 'mine' row button (P0 keyboard fix, ~2 lines).; Add aria-label="Filter available ideas by sector" to the sector <select> (line 71).; Bump the 'Pick up this idea' button and sector select to py-2 / min-h-[36px] for touch targets.; Add aria-pressed={active} to the Tab buttons as a cheap a11y improvement short of a full tablist.; Add .animate-pulse to the prefers-reduced-motion rule in index.css.; Switch the IFN tag chip from text-muted to text-ink to lift the low-contrast identifier in light mode.

---

### Feed (authed home) — 78/100  `/`

> Solid, low-slop product feed with excellent state coverage and modal a11y, held back from ship-grade by a malformed role=link card with nested interactives, a missing page heading/landmark, sub-44px touch targets, and partial reduced-motion coverage.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | 7 | 8 | 7 | 6 | 6 | 9 | 10 |

**Issues**

- `P1` **accessibility** — PostCard is article role="link" tabIndex=0 with NO aria-label, and it contains real nested interactive elements: two AuthorLink <a> tags, two vote <button>s, and a comment span. A role=link element with focusable interactive descendants is invalid ARIA — screen readers announce the entire concatenated card body (author + timeAgo + title + tag chips + score) as the single link name, producing an enormous unusable accessible name, and nesting <a>/<button> inside role=link is a content model violation. _(PostCard.jsx:50-56 <article role="link" tabIndex={0}>)_
  → **Fix:** Drop role="link"/tabIndex from the article. Make the title an actual <Link> (or wrap a stretched-link <a> with aria-label={post.title} that the card pseudo-element covers), keep the vote/author controls as real siblings outside the link, so the card has one labeled navigation target plus independently focusable actions.
- `P1` **accessibility** — The page renders no <h1> and no <main> landmark — the Feed root is a bare <div>. The primary authed screen has no page heading, so heading-navigation and landmark-navigation skip it entirely. index.css styles h1 with font-display but no h1 exists here. _(Feed.jsx:233 root <div>)_
  → **Fix:** Wrap in <main> (if the shell doesn't already) and add a visible-or-sr-only <h1>Feed</h1> as the first heading so the document has a labeled top of the outline.
- `P1` **layoutSpacing** — Multiple touch targets fall below the 36-44px minimum: sort tabs (px-3.5 py-1.5 ≈30px tall), Top-window tabs (px-3 py-1.5 text-xs, even smaller), the active-filter chip remove button and CreatePostModal tag-remove button wrap only a 12px X icon with no padding, and PostCard vote buttons are p-1.5 around a 20px icon (~32px). On phones (students browse on mobile per PRODUCT.md) these are hard to hit. _(Feed.jsx:288/306 sort tabs; Feed.jsx:323 chip X; PostCard.jsx:104-122 vote buttons)_
  → **Fix:** Raise tab padding to py-2 and give icon-only buttons a min-h/min-w of 36px (e.g. p-2 with a 44px hit area via padding or an inset ::before). Keep visual size but expand the tap region.
- `P1` **motion** — prefers-reduced-motion is only honored for the two named keyframes (animate-pop-in/fade-in). It does NOT cover PostCard's hover:-translate-y-0.5 transform, the card hover shadow/border transition, or PollBlock's transition-[width] duration-500 on the result bars — which animates width, a layout property (reflow/jank) and ignores reduced-motion entirely. _(PostCard.jsx:55 hover:-translate-y-0.5; PollBlock.jsx:56 transition-[width] duration-500; index.css:114-119 reduced-motion block)_
  → **Fix:** Animate PollBlock bars with transform: scaleX() instead of width, and broaden the reduced-motion media query to also neutralize hover transforms and the width/transform transitions (e.g. * { transition-duration: 0.01ms !important }) under reduce.
- `P2` **contrastColor** — Status text colors over their own 10% tints need verification: text-success (#0E7A52) on bg-success/10 and text-warnink/text-success notices sit near the 4.5:1 boundary; in dark mode --c-success (52 199 142) as small text on bg-success/10 over #18181B is the riskier case. faint timestamps (113 116 140 light) are right at the 4.5:1 edge. _(Feed.jsx:340 notice text-success; Feed.jsx:273 text-warnink; PostCard.jsx:128 text-faint 'edited')_
  → **Fix:** Measure each token against its actual composited tint+surface in both themes; if any dips below 4.5:1 for body-size text, darken the light-mode success/warn-ink ink or raise the tint opacity so the contrast holds.
- `P2` **accessibility** — The sort and Top-window segmented controls use role="tablist"/role="tab" with aria-selected, but there are no associated tabpanels and the tabs are not keyboard-arrow navigable — this is really a single-select button group, so the tab pattern misleads AT users (arrow keys won't move between tabs, no panel relationship). _(Feed.jsx:281-313 role="tablist")_
  → **Fix:** Either implement the full tab pattern (roving tabindex + arrow-key handling) or switch to role="radiogroup"/role="radio" (or plain buttons with aria-pressed), which matches the actual filter-toggle behavior.
- `P2` **uxCopyStates** — CreatePollModal's backdrop/Esc close has no dirty-guard — it only blocks while busy, so a half-filled poll is discarded silently, unlike CreatePostModal which confirms via window.confirm. Inconsistent destructive-loss handling across the two composers. _(CreatePollModal.jsx:47 onRequestClose={() => !busy && onClose()})_
  → **Fix:** Mirror CreatePostModal: snapshot the initial form, and on close confirm 'Discard this poll?' when question/options/body are non-empty.

**Strengths:** Empty, loading, error, and locked states are all present and human ('No posts match this filter' with Clear filter vs. 'No posts yet' with Create post; skeletons shaped like real cards; retry on error; feed-locked banner with admin-vs-member copy) — exactly the 'earn trust at the edges' principle.; Optimistic voting with rollback and a visible 'Vote not saved. Try again.' alert; new-posts polling shows a non-intrusive banner instead of auto-injecting, respecting scroll position.; ModalShell is a genuinely solid a11y primitive: focus moves in on open, Tab is trapped, Esc and backdrop both route through the dirty-guard, focus returns to the opener.; Zero AI-slop: no gradient text, no eyebrow labels, no hero-metric template, no side-stripe accents, no decorative glass; chrome stays quiet and the posts carry the page, matching the 'issued, not branded' brand.; Disciplined token use throughout (accent/muted/faint/line, .input/.chip/.btn-*), so the page is consistent with the one-system design language and themes correctly in dark mode.

**Quick wins:** Add aria-label={post.title} to the PostCard navigation target so screen readers get a sane link name instead of the whole card body.; Bump sort/window tab padding to py-2 and pad icon-only remove/vote buttons to a 44px hit area.; Add an sr-only <h1>Feed</h1> and wrap the page in <main> for landmark/heading navigation.; Switch PollBlock result bars from transition-[width] to a transform: scaleX() animation and extend the prefers-reduced-motion block to cover hover transforms.; Give CreatePollModal the same dirty-guard confirm-on-close that CreatePostModal already has.

---

### Calendar — 78/100  `/calendar`

> A composed, low-slop calendar with excellent modal a11y and human copy; held back from ship-grade by a theme-blind Hackathon chip color, cell-wide opacity dimming pill text, and sub-44px touch targets.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | 6 | 7 | 7 | 9 | 7 | 8 | 10 |

**Issues**

- `P1` **contrastColor** — Hackathon event chips use a hardcoded `text-[#8a6d00]` (dark gold) that is theme-blind. In dark mode this dark gold sits on `bg-warn/20` over the near-black `#18181B` card, producing a dark-on-dark chip well under 4.5:1. The codebase already ships a `warnink` token (light #7A5F00 / dark #F0C866) designed exactly for readable text on warn tints, but it isn't used. _(web/src/lib/calendar.js typeClass() Hackathon case: `bg-warn/20 text-[#8a6d00]` (consumed by day-cell pills in Calendar.jsx line 127 and the detail chip line 178))_
  → **Fix:** Replace `text-[#8a6d00]` with the `text-warnink` token so the foreground flips per theme; verify the Hackathon pill against `bg-warn/20` over `--c-card` in both modes (>=4.5:1).
- `P1` **contrastColor** — Out-of-month day cells get `opacity-40` on the whole cell (Calendar.jsx line 117), which multiplies through to any event/deadline pill text and the date number inside them. A `text-muted` date or a `text-down` deadline label at 40% opacity drops far below 4.5:1, and events spanning month boundaries become unreadable rather than just de-emphasized. _(web/src/pages/Calendar.jsx line 117 `${inMonth ? '' : 'opacity-40'}`)_
  → **Fix:** Dim only the date number (e.g. apply muted color to the number, not the cell), or cap dimming so pill text stays readable; do not apply container opacity to cells that contain interactive event pills.
- `P2` **accessibility** — Today's cell is signaled only by accent color + a filled circle; there is no `aria-current="date"`. The date number remains readable so it is not strictly color-alone, but screen-reader users get no 'today' cue. Event type in day-cell pills is also conveyed by background color only (no type label/icon on events, unlike deadlines which carry a Flag). _(web/src/pages/Calendar.jsx lines 118-119 (today) and 124-131 (event pill, no type indicator))_
  → **Fix:** Add `aria-current="date"` to the today cell; add a small visually-hidden type label or a type dot+text to event pills so type isn't carried by hue alone.
- `P2` **layoutSpacing** — Touch targets below the 36-44px minimum: in-cell event/deadline pills are `py-0.5 text-[11px]` (~20px tall) and the 'Today' button is `px-3 py-1.5 text-xs` (~28px tall). On a 360px phone the 7-col grid gives ~48px-wide cells, so pills are both short and narrow, hard to tap accurately. _(web/src/pages/Calendar.jsx lines 127/136 (pills), line 102 (Today button))_
  → **Fix:** Bump the Today button to `py-2`; on mobile consider a list/agenda fallback below a breakpoint, or increase pill tap height; ensure pill hit area >=32px tall on touch.
- `P2` **uxCopyStates** — No empty-month affordance: a month with zero events and zero personal deadlines renders a silent empty 6-week grid with no copy. For an incubator calendar this misses the 'earn trust at the edges' principle — members can't tell the difference between 'nothing scheduled' and 'failed to load' once the error clears. _(web/src/pages/Calendar.jsx grid block lines 108-149 (no zero-state branch))_
  → **Fix:** When the visible range has no events/deadlines, render a quiet inline note (e.g. 'No events this month' for members, plus 'Add event' nudge for admins) above or within the grid.
- `P2` **uxCopyStates** — Destructive delete and discard-changes use native `window.confirm` (lines 75, 264) rather than the app's own ModalShell. It works and is accessible, but it breaks the 'issued, not branded' register and visual consistency the rest of the page maintains, and stacks an unstyled OS dialog over a styled modal. _(web/src/pages/Calendar.jsx line 75 deleteEvent, line 264 requestClose)_
  → **Fix:** Use the existing ConfirmModal component (present in the repo, web/src/components/ConfirmModal.jsx) for delete/discard confirmation to match the app shell.

**Strengths:** Modal accessibility is genuinely solid: ModalShell traps Tab, focuses the panel on open, returns focus to the opener on close, handles Escape, and backdrop click routes through the same onRequestClose so the dirty-guard applies everywhere.; Dirty-form guard is well built — initialRef snapshots state and only prompts to discard when something actually changed, with edit vs new copy differentiated.; Error/loading/validation copy is human and specific ('Could not load the calendar. Check your connection and retry.', 'End must be after start.'), error blocks carry role="alert", and the spinner is non-blocking inline.; Restraint matches the product register: no gradients, no glass, no eyebrow scaffolding, no side-stripe accents, no hero-metric template — clean zero slop.; Thoughtful detail: month title has min-w-[10ch] to prevent nav layout shift, '+N more' overflow handling, datepicker popup is fully re-themed to the app tokens for both modes, and personal deadlines are visually distinguished (dashed border + Flag) and privacy-labeled.

**Quick wins:** Swap `text-[#8a6d00]` for `text-warnink` in calendar.js typeClass Hackathon case to fix dark-mode contrast.; Add `aria-current="date"` to the today cell.; Replace `window.confirm` with the existing ConfirmModal for delete/discard.; Bump the 'Today' button to `py-2` for a compliant touch target.; Add a 'No events this month' inline empty state for months with no events or deadlines.

---

### Notifications — 78/100  `/notifications`

> A clean, role-aware, slop-free notification center that nails IA and state coverage but ships a fake (non-ARIA) tablist and an unconfirmed destructive delete that keep it short of accessible ship-grade.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | 8 | 8 | 8 | 7 | 5 | 7 | 10 |

**Issues**

- `P1` **accessibility** — The admin tab strip looks and behaves like a tablist but has no ARIA semantics. The three TabButtons (Needs action / All activity / Mine) are plain <button>s with no role="tablist"/role="tab", no aria-selected, and the rendered panels (NeedsAction / ActivityList) have no role="tabpanel" or aria-controls. There is also no roving-tabindex arrow-key navigation. Screen-reader users hear three unrelated buttons, not a tab group. _(Notifications.jsx lines 25-31 (tab container + TabButton, lines 39-50))_
  → **Fix:** Wrap the tabs in a div role="tablist" aria-label="Notification views"; give each TabButton role="tab", aria-selected={active}, id, and tabIndex={active?0:-1} with ArrowLeft/Right handlers; wrap each panel in role="tabpanel" with matching aria-labelledby.
- `P1` **uxCopyStates** — Delete is an irreversible destructive action fired immediately on click with no confirmation. A ConfirmModal component already exists in the repo (web/src/components/ConfirmModal.jsx) but is not used here, violating PRODUCT principle 5 ("moderation actions are written and designed with the same care as the happy path"). _(Notifications.jsx lines 186-188 (Delete button) -> remove(n) line 137)_
  → **Fix:** Gate remove(n) behind the existing ConfirmModal ("Delete this notification? This can't be undone.") before calling supabase.delete; keep the optimistic row removal after confirm.
- `P1` **accessibility** — TabButton is a raw <button> that does not use the .btn class, so it inherits no focus-visible:ring styling from the design system. Focus visibility falls back to whatever the browser default is and is inconsistent with every other button on the page (.btn-outline/.btn-primary have a defined ring-accent/50 ring). _(Notifications.jsx lines 41-46 (TabButton className))_
  → **Fix:** Add focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-page to the TabButton className (or compose it from .btn).
- `P2` **uxCopyStates** — markRead has no error handling: the supabase update is awaited but its error is ignored and the row is optimistically marked read regardless. If the write fails the UI lies (shows read while the DB stays unread), unlike remove() which surfaces GENERIC_ERR. _(Notifications.jsx lines 133-136 (markRead))_
  → **Fix:** Destructure { error } from the update, and on error setError(GENERIC_ERR) and skip / revert the optimistic setRows mutation, matching the pattern in remove().
- `P2` **layoutSpacing** — Inline action buttons are below the 44px touch target. The icon-only Open-post button (px-2.5 py-1.5, 14px icon) computes to roughly 28-30px tall, and the Approve/Reject/Review/Mark-read/Delete xs buttons at py-1.5 are about 28px — undersized for thumb use on the phones students use per PRODUCT. _(Notifications.jsx line 98 (ExternalLink button) and lines 96-101, 176-188 (xs action buttons))_
  → **Fix:** Bump small action buttons to min-h-9 (36px) or py-2, and give the icon-only button an aria-label="Open post" (title alone is not an accessible name) plus a min 36px hit area.
- `P2` **contrastColor** — Light-mode faint token (113 116 140) is engineered to just pass 4.5:1 on card white, but the "No linked item." hint and the row subtitle sit on bg-page/60 tinted surfaces (expanded drawer line 174) where the effective contrast dips toward the 4.5:1 floor and is no longer comfortably above it. _(Notifications.jsx line 190 (text-faint on bg-page/60) and line 174 drawer background)_
  → **Fix:** Use text-muted instead of text-faint for the "No linked item." hint, or render the drawer on bg-card rather than bg-page/60 so faint text keeps its tested >=4.5:1 margin.
- `P2` **motion** — The skeleton Loading list uses Tailwind's animate-pulse, but the prefers-reduced-motion block in index.css only disables .animate-pop-in and .animate-fade-in — the pulse keeps animating for users who requested reduced motion. _(Notifications.jsx line 204 (animate-pulse) vs index.css lines 114-119)_
  → **Fix:** Add animate-pulse to the prefers-reduced-motion: reduce rule (or swap the skeleton to a static dimmed state under reduced motion).

**Strengths:** Genuinely slop-free: no gradient text, glassmorphism, hero-metric blocks, uppercase eyebrows, side-stripe accents or numbered scaffolding. The icon-circle + title + subtitle row is restrained and on-brand ("issued, not branded").; Role-aware IA is excellent: admins get a Needs-action to-do queue with inline approve/reject, members get a single clean list — each role's next action is obvious, satisfying PRODUCT principle 3.; Every async surface has loading (skeleton that mirrors the real row), empty (human copy like "You're all caught up." / "Nothing needs you."), and error (role=alert with down-tinted styling) states.; Read/unread is not color-only — the accent dot is paired with font-weight (semibold vs normal), satisfying color-not-sole-signal.; Optimistic updates on review/mark-read/remove with a busy guard on the approve/reject buttons keep the queue feeling instant.; Disclosure rows correctly expose aria-expanded on the toggle button, and errors use role=alert.

**Quick wins:** Add focus-visible ring classes to TabButton so it matches the rest of the button system.; Add aria-label="Open post" to the icon-only ExternalLink button (line 98) — title is not an accessible name.; Swap text-faint -> text-muted for the "No linked item." hint (line 190).; Add animate-pulse to the prefers-reduced-motion rule in index.css.; Add error handling to markRead to match remove().

---

### Register — 76/100  `/register`

> A clean, slop-free, well-written request form that nails the product's restrained register — but a keyboard-inaccessible file upload blocks the required-certificate path, and missing landmark/required-field semantics keep it short of ship-grade.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | 7 | 8 | 8 | 9 | 5 | 9 | 10 |

**Issues**

- `P0` **accessibility** — The file input is `className="hidden"` (display:none → removed from tab order) and the visible dropzone is a `<label htmlFor="cert">`, which is not keyboard-focusable/activatable. Keyboard and screen-reader users cannot open the file picker. For non-student-domain emails the certificate is REQUIRED (certRequired = !isStudentDomain), so those users cannot submit the form at all via keyboard. _(Register.jsx L179 `<input ... className="hidden" />` and L193-196 `<label htmlFor="cert" className="flex cursor-pointer...">`)_
  → **Fix:** Make the trigger a real `<button type="button">` that calls `fileRef.current.click()`, or visually-hide the input with sr-only/clip (not display:none) so it stays in the tab order, and add focus-visible styling to the dropzone. Wire the hidden-input label so Enter/Space activates it.
- `P1` **accessibility** — No `<main>` landmark and no `<h1>`; the only heading is an `<h2>` ("Request access" / "Request received"), so the document has no top-level heading and the page is not wrapped in a main region. Screen-reader landmark/heading navigation lands on an orphaned h2. _(Register.jsx L130-131 outer `<div>`/`<form>`; L133 `<h2>`)_
  → **Fix:** Wrap the card in `<main>` and promote the page title to `<h1>` (index.css already styles h1 with font-display), or keep h2 but ensure an h1 exists in the app shell for this route.
- `P1` **contrastColor** — Hint/optional text uses `text-faint` (#71748C light / #8C8D96 dark) on `bg-page`/`bg-card`. The hints '(optional)', 'PDF, JPG, or PNG, up to 5 MB.', and 'Optional for @… emails.' sit right at the ~4.5:1 boundary — the dark-mode faint (#8C8D96) on card #18181B is ~4.6:1, but the file-name size sub-label and dropzone placeholder are at the same risk and there is no margin for the paper-grain background texture under them. _(Register.jsx L156/L170/L177 `(optional)` spans, L198-200 hint span, L194 dropzone `text-muted`)_
  → **Fix:** Use `text-muted` instead of `text-faint` for any persistent instructional copy (optional markers, file-type hint); reserve faint strictly for placeholders. Verify against the grained body background, not a flat swatch.
- `P2` **uxCopyStates** — Required fields are visually inconsistent: only the certificate shows a red `*`. Name, Email, and 'Registering as' are required (validated in handleSubmit) but carry no required indicator, while the optional phone/other fields are explicitly marked '(optional)'. The asymmetry is incomplete — a user can't tell name/email are mandatory until submit fails. _(Register.jsx L146/L151/L161 labels (no marker) vs L177 cert `*`)_
  → **Fix:** Mark all required fields consistently (asterisk or omit '(optional)' only) and add `required`/`aria-required` to the required inputs so assistive tech announces them.
- `P2` **accessibility** — The `role="alert"` error renders at the top of a tall form while the submit button is at the bottom. After a failed submit the focus stays on the button and the alert is offscreen on small viewports; it is announced but not scrolled into view, and focus is not moved to the first invalid field. _(Register.jsx L136-138 error block; validation returns in handleSubmit L72-76)_
  → **Fix:** On validation failure, move focus to the offending field (or to the alert via tabIndex={-1} + ref.focus()) so keyboard/SR users land on the problem.

**Strengths:** No AI slop whatsoever: flat solid navy button, no gradient text, no side-stripe accents, no eyebrows, no hero metrics, no glassmorphism — exactly the 'issued, not branded' register PRODUCT.md asks for.; Excellent UX-copy and state coverage: human error strings, network-failure message rewrite, single-use captcha re-mint on failure, honeypot, dynamic cert-required logic by email domain, and a genuinely warm success state that echoes the user's name and email.; Disabled submit is a flat neutral chip (bg-line/text-muted, opacity:1) rather than faded navy — a deliberate, correct contrast decision baked into the design system.; Motion is restrained and safe: only a 0.16s pop-in, prefers-reduced-motion zeroes it, no content is gated behind animation (renders fully on headless), no layout-property animation.

**Quick wins:** Swap the dropzone `<label>` trigger to a focusable control (button or sr-only-clipped input) so the file upload is keyboard-operable — unblocks the required-cert path.; Change persistent hint/optional copy from `text-faint` to `text-muted`; keep faint for placeholders only.; Add `required`/`aria-required` to name, email, and member_type and a consistent required marker.; Wrap in `<main>` and promote the title to `<h1>`.; Add `aria-busy={loading}` to the submit button.

---

### Profile — 76/100  `/profile`

> A clean, on-brand members-only profile screen with solid state coverage and zero AI-slop, held back from ship-grade by unassociated form labels and a three-way-inconsistent About character limit.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | 8 | 7 | 8 | 9 | 6 | 6 | 10 |

**Issues**

- `P1` **uxCopyStates** — The About field has three conflicting limits: the live counter and textarea hard-cap say 160 (line 191 label `About (${form.bio.length}/160)` and line 192 `maxLength={160}`), but the save() validator rejects only bio.length > 500 (line 70). The 500 check is dead code and the user is silently capped at 160 with no error, while the read view (line 70 in save) implies 500 is allowed. The mismatch is confusing and the validation message users would expect (about too long) can never fire. _(Profile.jsx lines 70, 191, 192)_
  → **Fix:** Pick one limit. If the product limit is 160, change the validator to `if (bio.length > 160) return setError('About must be 160 characters or fewer.')`; if it's 500, change both the counter label to /500 and maxLength={500}. Keep counter, hard-cap, and validator identical.
- `P1` **accessibility** — Form labels are not programmatically associated with their inputs. The Edit helper (lines 225-232) renders a bare `<label>` with no htmlFor, and the inputs/Combobox have no id. Combobox even accepts an `id` prop (Combobox.jsx line 7) wiring aria-controls, but Profile never passes one. Screen-reader users get unlabeled fields; clicking a label does not focus its input. _(Profile.jsx Edit() lines 225-232 + every input/Combobox/textarea (lines 161-193))_
  → **Fix:** Give Edit a generated id, set `htmlFor={id}` on the label, and pass `id` down to each input/textarea and to Combobox's id prop. Or wrap each control inside its <label> like the incubation checkbox already does (lines 196-200).
- `P2` **accessibility** — Combobox keyboard highlight is visual-only. The highlighted option (hi index, line 33-34) changes a background class but there is no aria-activedescendant on the input and options carry no id, so screen-reader users navigating with arrow keys hear no announcement of the highlighted choice. _(Combobox.jsx lines 42-55 (input) and 68-81 (options))_
  → **Fix:** Add an id to each <li role=option> (e.g. `${id}-opt-${i}`) and set `aria-activedescendant={hi>=0 ? id+'-opt-'+hi : undefined}` on the combobox input.
- `P2` **layoutSpacing** — The 'Edit profile' trigger is `px-3 py-1.5 text-xs` (line 135), roughly 28px tall — below the 36-44px touch-target minimum on the primary action that opens the whole edit flow. _(Profile.jsx line 135)_
  → **Fix:** Bump to at least py-2 / min-h-[36px], or keep text-xs but add min-h-9 so the tap area clears 36px on mobile.
- `P2` **uxCopyStates** — Edit mode has no LinkedIn validation parity with read view and no per-field inline errors — all validation errors collapse into one banner at the top of the details card (lines 142-144). After a save failure with a long form the user may not see the banner without scrolling, and there's no indication which field is at fault. _(Profile.jsx lines 65-70 (validation) + 142-144 (single error banner))_
  → **Fix:** Either focus the offending field on validation failure (ref + .focus()) or render the error adjacent to the field it concerns; at minimum scrollIntoView the banner on error.
- `P2` **typography** — Section heading 'Basic info' is `text-sm font-bold text-accent` (line 133) — same size as body text, distinguished only by color and weight. On a settings card this reads as a colored label rather than a heading, and accent-colored bold text is the only heading cue. _(Profile.jsx line 133)_
  → **Fix:** Use a slightly larger or all-caps-free heading token (e.g. text-base font-semibold text-ink) so heading vs. body has a size delta, not just color; reserve accent color for interactive elements.

**Strengths:** Clean, restrained two-card layout (identity rail + details) that matches the product's 'issued, not branded' register — no gradients, no glassmorphism, no eyebrow scaffolding, no side-stripe borders. slopBans is a clean 10.; Genuine state coverage: dedicated ProfileSkeleton matching the real layout, role=status success banner, role=alert error banner, disabled/empty button states ('No LinkedIn linked'), and 'Not set' fallbacks for empty fields.; Design tokens are used consistently (card, input, btn-* classes, muted/faint/ink) with no one-off styling; faint placeholder/disabled token is documented to pass 4.5:1 in both themes.; Sensible overflow handling — break-words and min-w-0 on identity name, startup, and field values prevent long strings from blowing out the fixed 280px rail.; Motion is correct: only the skeleton pulses, no content is gated behind a reveal animation, and prefers-reduced-motion is honored globally.

**Quick wins:** Unify the About limit across counter, maxLength, and validator (line 70 vs 191/192).; Wire htmlFor/id (or wrap-in-label) so every input and Combobox is programmatically labeled.; Pass an id to Combobox so its existing aria-controls wiring actually resolves.; Add min-h to the 'Edit profile' button to clear the 36px touch target.; scrollIntoView or focus the field on validation/save error so the top banner isn't missed.

---

### Team Acquisition — 74/100  `/team`

> Solid, on-brand members board with excellent copy/states and modal a11y, dragged to 'functional with gaps' by an invalid nested-button/anchor structure and native window.confirm dialogs.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | 9 | 8 | 7 | 8 | 5 | 8 | 9 |

**Issues**

- `P0` **accessibility** — Each board card is a <button> (line 118-122) that wraps two AuthorLink anchors (lines 124-127). A <button> may not contain an <a> — this is invalid HTML and produces undefined keyboard/AT behavior (nested interactive controls). Screen readers and tab order both break; clicking the name navigates while the parent also fires setDetail. _(TeamAcquisition.jsx line 118 (the card <button>) containing AuthorLink <Link> from AuthorLink.jsx line 7)_
  → **Fix:** Make the card a non-interactive container (div with role/onClick is still nesting-illegal if children are interactive). Best: render the card as a <div>, put a visually-hidden or overlay <button>/<Link> for 'view detail', and keep AuthorLink as the only interactive child for the author. Or move author links out of the clickable surface (e.g. avatar+name as plain text in the card, full profile link only in the detail modal).
- `P1` **uxCopyStates** — Destructive and discard confirmations use native window.confirm (delete role, withdraw, discard draft) — unstyled, off-theme, blocking, and inconsistent with the repo's own ConfirmModal component (web/src/components/ConfirmModal.jsx exists). _(TeamAcquisition.jsx lines 45, 61, 336, 422)_
  → **Fix:** Replace window.confirm with the app ConfirmModal for themed, accessible, focus-trapped confirmation matching the rest of the product surface.
- `P1` **layoutSpacing** — Cards are locked to h-52 (13rem) with overflow-hidden (line 121) but the loading skeleton (TeamCardSkeleton, line 275) has no fixed height and uses rounded-full chips vs the real card's rounded-md chips. Loading->loaded causes vertical layout shift and a visual style mismatch. _(TeamAcquisition.jsx line 121 vs lines 275-294)_
  → **Fix:** Give the skeleton the same h-52 and chip radius (rounded-md) as the real card so the grid does not jump and the placeholder reads as the same component.
- `P2` **accessibility** — Search input clears/results have no aria-live announcement of result count; debounced filtering silently swaps the grid. Sighted users see it, screen-reader users get no feedback that N roles now match. _(TeamAcquisition.jsx lines 84-92 (search) and 116 (grid))_
  → **Fix:** Add an aria-live=polite region announcing e.g. '{n} roles match' when debounced changes.
- `P2` **hierarchy** — Card footer status logic mixes a string ('Tap to view and apply', applicant count) with colored spans; 'Tap' copy assumes touch but this is laptop-primary per PRODUCT.md. _(TeamAcquisition.jsx lines 151-160)_
  → **Fix:** Use device-neutral copy ('View and apply') and keep status as a labeled chip so it is not color-only.
- `P2` **accessibility** — Skill-remove button inside the chip (line 392) sits inside the PostNeed modal which is fine, but the applicants modal LinkedIn link (line 509) and contact block rely on visual styling only; LinkedIn external link has no indication it opens a new tab for AT. _(TeamAcquisition.jsx line 509)_
  → **Fix:** Add an aria-label or visually-hidden 'opens in new tab' to the rel=noreferrer target=_blank link.

**Strengths:** Color tokens are genuinely AA-tuned in both light and dark (faint #71748C / #8C8D96 documented to pass 4.5:1 for placeholders/timestamps); no gray-on-tint failures.; ModalShell is a strong accessible primitive: focus moves in, Tab is trapped, Escape and backdrop both route through the dirty-guard, focus returns to opener, role=dialog + aria-labelledby wired.; Excellent UX copy and state coverage: human empty states ('No role needs match this search'), retriable error card, optimistic flash notices with role=status, dirty-discard guards, form validation messages, role=alert on errors.; Restraint matches PRODUCT.md 'issued, not branded': no gradient text, no glassmorphism accent, no side-stripe borders, no eyebrow spam, no hero-metric template. Clean institutional register.; Good information density and scannability for a board: avatar, author, closed badge, timeago, title, startup, skills, and contextual footer status all fit a compact card.

**Quick wins:** Give TeamCardSkeleton h-52 and rounded-md chips to kill the load layout shift and style mismatch.; Swap window.confirm calls for the existing ConfirmModal component.; Change 'Tap to view and apply' to 'View and apply' (laptop-primary audience).; Add aria-live result-count announcement to the search results region.; Add 'opens in new tab' affordance to the LinkedIn external link.

**Slop flags:** Minor: repeated identical card grid is acceptable here (it is a board), but the fixed h-52 + sm:grid-cols-2 is the only structural pattern — fine for the job, not slop.

---

### ProblemDetail — 74/100  `/problem-hub/:id`

> Clean, slop-free, content-first detail page with strong state handling, undermined by accessibility gaps (custom kebab without keyboard support, misused tablist, missing focus rings, unconfirmed solution delete) and sub-44px touch targets on a phone-first audience.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | 8 | 8 | 7 | 7 | 5 | 8 | 10 |

**Issues**

- `P0` **uxCopyStates** — Solution delete is destructive but fires immediately with no confirmation. deleteSolution() optimistically removes the row on a single click; problem delete and ProblemModal both use window.confirm, so this is inconsistent and dangerous (admins moderating others' content, members deleting their own). _(ProblemDetail.jsx line 362 (delete button) -> deleteSolution() line 147)_
  → **Fix:** Gate deleteSolution behind a confirm() (or the existing ConfirmModal component the repo just added) mirroring deleteProblem's pattern, e.g. window.confirm('Delete this solution?').
- `P0` **accessibility** — Kebab menu is a custom popup with no keyboard support: button lacks aria-expanded/aria-haspopup, the panel has no role=menu and its items are MenuItem buttons not menuitems, no Escape-to-close (only mousedown-outside), no focus move into menu or arrow-key nav. Keyboard/screen-reader users cannot reliably operate Edit/Close/Delete problem. _(ProblemDetail.jsx Kebab component lines 22-48)_
  → **Fix:** Add aria-haspopup="menu" and aria-expanded={open} to the trigger; give the panel role="menu" and items role="menuitem"; add Escape key handling and move focus to the first item on open (reuse the focus-trap pattern from ModalShell).
- `P1` **accessibility** — Sort control misuses the tablist ARIA pattern. role="tablist"/role="tab"/aria-selected announce tabs to AT but there is no tabpanel and no aria-controls; nothing is a tab — it is a sort selector. AT will promise panels that don't exist. _(ProblemDetail.jsx lines 288-301)_
  → **Fix:** Switch to role="radiogroup" with role="radio"+aria-checked, or drop the roles entirely and use a plain <button aria-pressed={...}> group with an aria-label on the wrapper.
- `P1` **accessibility** — Interactive controls outside .btn have no focus-visible ring. Vote up/down, the Kebab trigger, sort tabs, and the inline edit/delete text buttons rely on the UA default outline (often suppressed). The design system defines a focus-visible ring only on .btn, so these key actions fail visible-focus AA. _(ProblemDetail.jsx lines 34-40 (kebab), 263-279 (vote), 290-301 (sort), 360-362 (edit/delete))_
  → **Fix:** Add focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 (with rounded matching) to each bare button, or extract a shared icon-button class.
- `P1` **accessibility** — Review-note and inline edit fields lack programmatic labels. The ReviewForm note <input> has only a placeholder ('Review note (optional)') as its accessible name, and the solution-edit <textarea> has no label at all. Placeholder-as-label disappears on input and fails AA labeling. _(ProblemDetail.jsx line 460 (note input), line 369 (edit textarea); also composer textarea line 313)_
  → **Fix:** Add aria-label to each (e.g. aria-label="Review note", aria-label="Edit your solution", aria-label="Propose a solution") or a visually-hidden <label>.
- `P2` **layoutSpacing** — Several primary touch targets fall below the 44px (and even 36px) minimum on mobile: vote buttons and the kebab are p-1.5 on a 20px icon (~32px), sort tabs are px-3 py-1 (~28px tall), and the edit/delete inline links are body-size text with no padding (~16px). Easy to mis-tap on phones, which PRODUCT.md names as a primary device. _(ProblemDetail.jsx lines 266/276 (p-1.5), 295 (py-1 tabs), 360-362 (text links))_
  → **Fix:** Bump icon buttons to p-2 (>=40px), give sort tabs py-1.5, and replace the tiny edit/delete text links with min-h-[36px] padded hit areas (or move them into the Kebab on solutions).
- `P2` **motion** — The loading skeleton uses animate-pulse, which is not covered by the prefers-reduced-motion media query (only animate-pop-in / animate-fade-in are disabled). Users who request reduced motion still get a pulsing skeleton. _(ProblemDetail.jsx line 467 (animate-pulse) vs index.css lines 114-119)_
  → **Fix:** Add .animate-pulse to the prefers-reduced-motion: reduce block in index.css (set animation: none).
- `P2` **hierarchy** — Solution heading uses <h3> while the problem title is <h1>, skipping <h2>. The 'N Solutions' header (h3) and per-solution title (h4) create a non-sequential heading outline that hurts screen-reader navigation. _(ProblemDetail.jsx line 245 (h1), line 284 (h3), line 366 (h4))_
  → **Fix:** Promote the solutions header to <h2> and per-solution titles to <h3> for a contiguous outline.

**Strengths:** Zero AI-slop: no side-stripe accents, no gradient text, no decorative glassmorphism, no hero-metric template, no numbered section scaffolding — fully in line with PRODUCT.md's 'issued, not branded' principle.; Excellent state coverage: distinct loading skeleton, load-error with retry, not-found, empty-solutions, closed-problem and already-solved composer states, plus optimistic voting with rollback on failure and inline action-error alerts (role="alert").; Human, product-register copy throughout ('No solutions yet. Be the first.', 'This problem is closed. New solutions are turned off.', the re-review warning when editing a scored solution).; Disciplined design-token use (text-ink/muted/faint, bg-page/card, chip, accent-soft) means it themes correctly in dark mode and the documented faint token keeps muted/timestamp text at AA.; Modal flows (ProblemModal via ModalShell) have a real focus trap, Escape + backdrop close, focus restore, and a dirty-state discard guard — accessibility done right where ModalShell is used.

**Quick wins:** Add a confirm() to deleteSolution to match the existing problem-delete guard.; Add aria-label to the review-note input, inline edit textarea, and solution composer textarea.; Add aria-expanded/aria-haspopup to the Kebab trigger and Escape-to-close.; Add .animate-pulse to the prefers-reduced-motion block in index.css.; Add focus-visible ring utilities to the vote, kebab, and sort buttons.; Swap the sort tablist roles for aria-pressed buttons or a radiogroup.

---

### Idea Autopsy Library — 73/100  `/autopsy-library`

> Clean, system-consistent case-study library that reads as 'product, not marketing' — but accessibility (unlinked labels, no modal focus trap, missing focus rings) and native alert()/confirm() copy hold it back from ship-grade.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | 7 | 8 | 7 | 8 | 5 | 5 | 9 |

**Issues**

- `P1` **uxCopyStates** — Validation, success, and delete-failure feedback all use native browser alert() and window.confirm() (lines 65, 91, 102, 104). These are unstyled OS dialogs that break the institutional/trusted register, can't be themed for dark mode, and read as developer placeholders rather than product copy. The repo already has a ConfirmModal.jsx component (untracked in web/src/components) that should be used for the destructive delete. _(AutopsyLibrary.jsx — handleSubmit alert() L65/L91, deleteAutopsy window.confirm L102 + alert L104)_
  → **Fix:** Replace alert/confirm with the in-app ConfirmModal and inline form-error state (e.g. a red helper line under each invalid field plus an aria-live region), and surface submit success as a toast or inline banner.
- `P1` **accessibility** — Form labels are not programmatically associated with their inputs. The <label> elements (e.g. L307 'Project name *', L321 'Domain *', L337 'Total investment', L353 'The story') have no htmlFor and the paired <input> has no id, so screen readers and click-to-focus don't connect label to control. The Combobox-backed Category/sector label (L314) is likewise not linked to the combobox id. _(AutopsyLibrary.jsx — every label/input pair in the Share modal form (L304-374))_
  → **Fix:** Add matching id/htmlFor (or wrap each input inside its <label>), and pass htmlFor pointing at the Combobox id (autopsy-cat) for the Category field.
- `P1` **accessibility** — Modals have no focus management: opening a dialog does not move focus into it, there is no focus trap, and focus is not restored to the trigger on close. A keyboard or screen-reader user can tab out of the open dialog into the page behind it. Esc-to-close is handled but the role=dialog/aria-modal contract is otherwise incomplete. _(AutopsyLibrary.jsx — detail modal L220-287 and share modal L290-390)_
  → **Fix:** On open, focus the dialog container or first focusable element; trap Tab within the dialog; return focus to the invoking button on close. A small useFocusTrap hook shared across modals would cover both.
- `P1` **accessibility** — Action affordances rendered as bare buttons have no visible focus-visible ring. 'Read full autopsy →' (L205, text-accent hover:underline), 'Delete' (L197, text-faint), and the modal close X (L239) do not use the .btn class and inherit no focus styling, so keyboard focus is invisible on them. _(AutopsyLibrary.jsx — L197 Delete, L205 Read full autopsy, L239 close X)_
  → **Fix:** Add focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 (and rounded radius) to each, or route them through a shared link/icon-button class.
- `P2` **contrastColor** — The 'Why it failed' / 'Root cause' eyebrow is text-down at text-xs (small, ~12px) on a bg-down/10 tint (L172, L262). In light mode this is saturated red (#C81E32) on a ~10% red wash; small non-bold-enough red text on a same-hue tint sits near the 4.5:1 AA floor for normal-size text and is the classic gray/color-on-tinted risk. Dark-mode down (#F26A7E) on down/10 over near-black is safer. _(AutopsyLibrary.jsx — L172 and L262 span/h4 text-down on bg-down/10)_
  → **Fix:** Verify the light-mode ratio; if under 4.5:1, darken --c-down for this label or use text-ink for the value (already done) and a darker down for the eyebrow only.
- `P2` **layoutSpacing** — The Share modal's two-column rows use a fixed grid-cols-2 with no responsive collapse (L305, L319). Inside a max-w-lg dialog with p-6 on a narrow phone, two inputs plus a Combobox per row become cramped and the placeholders truncate. _(AutopsyLibrary.jsx — L305 and L319 grid grid-cols-2 gap-4)_
  → **Fix:** Use grid-cols-1 sm:grid-cols-2 so fields stack on small screens.
- `P2` **uxCopyStates** — The fetch error path only console.error's (L56) and then renders the generic empty state 'No autopsies found matching the criteria.' (L156). A network/RLS failure is indistinguishable from a genuinely empty library, so users see a misleading message with no retry. _(AutopsyLibrary.jsx — catch block L55-57 and empty render L155-156)_
  → **Fix:** Track an error state and render a distinct error message with a Retry button when fetch fails, separate from the true empty state.

**Strengths:** Clean, content-first list layout that suits the product register: bold project title, sector chip, a tinted 'Why it failed' callout, and capped 3-bullet lessons preview give strong scannability without decoration.; Disciplined use of the design system — card, chip, input, btn-primary/ghost tokens, line/muted/ink throughout; no one-off styling, matching PRODUCT.md principle 4.; Motion is restrained and correct: animate-fade-in/pop-in are short, and prefers-reduced-motion is honored in index.css with no content gated behind animation.; Permission-aware delete (autopsy.user_id === uid || isAdmin) and Esc-to-close wired for both overlays.; Largely slop-free: no gradient text, no decorative glassmorphism, no side-stripe accent borders, no repeated identical card grids, no tracked-eyebrow-on-every-section.

**Quick wins:** Add grid-cols-1 sm:grid-cols-2 to the two form rows (L305, L319) so fields stack on mobile.; Add id/htmlFor to every form label/input pair so labels are clickable and announced.; Add focus-visible ring classes to the Delete, 'Read full autopsy', and close X buttons.; Track an isError state so a failed fetch shows a distinct message + Retry instead of the empty-state copy.; Remove or implement the stale comment on L33-34 — it claims body scroll is locked while overlays are open, but no overflow lock exists (only the keydown listener is added).

**Slop flags:** No major slop. Minor: the bg-down/10 + border-down/20 'Why it failed' callout edges toward a templated alert-box pattern, but it is a full tinted box (not a >1px side-stripe accent) and is used purposefully, so it stays within bounds.

---

### PostDetail — 72/100  `/post/:id`

> Functionally strong and visually on-brand with great optimistic/empty-state UX, but accessibility is the weak link — unlabeled inputs, ringless custom menus/buttons, a heading skip, and unconfirmed one-click deletes hold it back from ship-grade.

| Hierarchy | Contrast | Type | Layout | Motion | A11y | Copy/States | Slop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | 8 | 8 | 7 | 7 | 4 | 7 | 9 |

**Issues**

- `P0` **uxCopyStates** — Comment delete and creator-update delete are one-click destructive with NO confirmation. deleteComment (line 425 'delete' button -> deleteComment) and deleteUpdate (line 356) fire immediately and permanently remove content via RLS/admin RPC. Inconsistent with deletePost which does window.confirm. The repo just added ConfirmModal.jsx but it is unused here. _(PostDetail.jsx lines 355-357 (deleteUpdate) and 424-426 (deleteComment))_
  → **Fix:** Gate both deletes behind a confirmation (reuse the new ConfirmModal component, not window.confirm) — e.g. 'Delete this comment? This cannot be undone.' Match the post-delete pattern for consistency.
- `P0` **accessibility** — Form inputs have no accessible name. The comment composer input (line 387-394) and the creator-update input (line 339-342) expose only a placeholder ('Add a comment' / 'Post an update...'); placeholders are not labels and vanish on input, so screen-reader and voice users get an unnamed text field. _(PostDetail.jsx line 387 (comment input) and line 339 (update input))_
  → **Fix:** Add aria-label="Add a comment" / aria-label="Post an update" (or a visually-hidden <label>) to each input.
- `P1` **accessibility** — Custom popup menus are not keyboard- or AT-accessible. The local Kebab (lines 21-47) and the imported Dropdown (Dropdown.jsx) close only on outside mousedown — no Escape handler, no aria-expanded on the trigger, no role=menu/menuitem, no focus move into/restore from the menu, no arrow-key navigation. MoreHorizontal trigger has aria-label but no expanded state. _(PostDetail.jsx Kebab (lines 33-44); web/src/components/Dropdown.jsx lines 19-37)_
  → **Fix:** Add aria-expanded={open} and aria-haspopup="menu" to triggers, role="menu" on the panel with role="menuitem" children, an Escape-to-close keydown, and focus the first item on open / restore focus to the trigger on close.
- `P1` **accessibility** — Most interactive controls lack a visible focus ring. The vote up/down buttons (lines 310-326), the Kebab trigger, and the inline 'delete' text buttons are raw <button>s with only hover styling; the design system's focus-visible:ring lives in the .btn class, which these do not use. Keyboard users cannot see focus. _(PostDetail.jsx lines 310-326 (vote), 33-39 (kebab), 356 & 425 (delete))_
  → **Fix:** Add focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 to these buttons (or wrap shared button styling into a utility).
- `P1` **accessibility** — Heading hierarchy skips a level. Page title is <h1> (line 286) but every section heading ('Updates from the creator' line 336, 'N Comments' line 368) is <h3> — there is no <h2>, breaking the document outline. _(PostDetail.jsx lines 286, 336, 368)_
  → **Fix:** Promote the section headings to <h2> (keep the small text styling via classes).
- `P2` **slopBans** — Comment composer re-implements the .input component inline instead of using the design system, and diverges from it: it uses placeholder:text-muted whereas .input uses placeholder:text-faint, and focus:border-accent without the ring the token provides. Violates the 'one system everywhere' principle and creates a one-off. _(PostDetail.jsx line 388 (className duplicating .input))_
  → **Fix:** Use className="input" (the update input on line 340 already does). Removes the placeholder-token divergence and restores the focus ring.
- `P2` **accessibility** — The 'delete' affordance on comments/updates is sub-touch-target and color-thin: lowercase text-faint text link, well under 36-44px tap height, relying on text size alone. _(PostDetail.jsx lines 356, 425)_
  → **Fix:** Give it padding (p-1 / min hit area) and an aria-label like 'Delete comment'; consider an icon-button affordance consistent with the kebab.
- `P2` **layoutSpacing** — On the creator-update form (line 338-344) the input + 'Add' button sit in a flex row with the input using .input (full width) next to a shrink-0 button; on very narrow phones the long placeholder 'Post an update...' plus button can crowd, and the button has no min width parity with the comment composer's stacked layout. Minor inconsistency between the two composers (one inline, one stacked). _(PostDetail.jsx lines 338-344 vs 386-407)_
  → **Fix:** Align the two composer patterns; verify the inline form at 320px width has comfortable spacing/touch targets.

**Strengths:** Excellent optimistic-update + rollback on voting (lines 98-119): immediate UI feedback with prevScore/prevVote restore and a human error message on failure ('Your vote was not saved. Try again.').; Thorough, human empty/error/loading states: skeleton while loading, distinct 'does not exist or was removed' vs generic retry error, 'No comments yet. Be the first.', 'No updates yet.', and a locked-comments notice — matches the product's 'earn trust at the edges' principle.; Clean, restrained visual register with no AI-slop: no gradient text, no glassmorphism, no side-stripe accents, no eyebrow labels or numbered scaffolding; chrome stays quiet and the post content is the hero.; Color is never the sole signal: success/poll badges carry text labels (#Success, Poll), pinned state shows a Pin icon + 'Pinned' text, vote state pairs color with fill.; Design tokens are used consistently (ink/muted/faint/accent/down) and the token file documents that faint passes 4.5:1 in both themes; status colors are defined per-mode for AA.

**Quick wins:** Add aria-label to the comment and update inputs (2 lines).; Change the comment composer input className to "input" to reuse the token and regain its focus ring + correct placeholder token.; Add focus-visible ring classes to the vote, kebab, and delete buttons.; Promote section headings from h3 to h2 to fix the outline.; Wrap comment/update deletes in a confirm (reuse ConfirmModal).

---

