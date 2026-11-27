# TODO — Online Student Examination Portal

## 1. Static React/Vite foundation and GitHub Pages deployment
- [x] Build a complete, clean, modular React + Vite + Tailwind CSS codebase; use Lucide React for icons and Recharts for dashboard improvement graphs.
- [x] Use `HashRouter` from `react-router-dom` so routes such as `/#/admin` and `/#/dashboard` do not return 404 errors on GitHub Pages.
- [x] Set `base: './'` in `vite.config.js` for GitHub Pages compatibility.
- [ ] Store Appwrite config keys `VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID`, `VITE_APPWRITE_DB_ID`, and collection IDs in local `.env`; include a `.env.example` template.
- [x] Do not use Appwrite Storage; camera/microphone access and audio/video recording are not part of this portal.
- [x] Include a README with step-by-step GitHub Pages deployment instructions and Appwrite setup instructions.
- [x] Include a README step to add the GitHub Pages hostname (for example, `username.github.io`) as a Web Platform in Appwrite Console so CORS does not block requests.

## 2. Appwrite authentication, collections, compact data and permissions
- [x] Student Login (`/#/`): students enter Student ID and Password; student accounts are created manually by the admin in the Appwrite Dashboard. Map `Student ID` to `${studentId.trim().toLowerCase()}@exam.local` for Appwrite Email/Password authentication.
- [x] Before `account.createEmailPasswordSession()`, run `await account.deleteSession('current').catch(() => {})` so a stale browser session cannot block a new login.
- [x] Admin Login (`/#/admin/login`): use a standard Email & Password form, do not auto-append `@exam.local`, and verify the logged-in Appwrite user has label `admin`.
- [x] Protect all student routes so unauthenticated users are redirected to `/#/`; protect all `/#/admin/*` routes.
- [x] Define `exams` collection attributes: `t` (required String, Exam Title), `d` (required Integer, duration in minutes), `q` (required String, max 65000 chars, compact JSON array shaped like `[{"q":"Question text","o":["Opt1","Opt2","Opt3","Opt4"],"c":0}]` where `c` is the 0-based correct-option index 0–3), `p` (Boolean, default false), and `ts` (Integer creation Unix timestamp).
- [x] Define `attempts` collection attributes: `uid` (required String, Student ID), `eid` (required String, exam document ID), `et` (required String, cached Exam Title), `a` (required String, compact JSON array of selected option indices such as `[0,2,-1,1]`, with -1 meaning unanswered), `s` (required Integer, score with +1 for each correct answer and 0 for wrong or unanswered), `tot` (required Integer, total possible marks equal to number of questions), `trm` (Boolean, default false and true when terminated due to tab-switching/fullscreen exit), and `ts` (required Integer submission Unix timestamp).
- [x] Enable Document Security on `attempts`. When creating an attempt, set document permissions to `[Permission.read(Role.user(currentUserId)), Permission.read(Role.label('admin')), Permission.delete(Role.label('admin'))]` so students can view only their own records.
- [x] Configure collection permissions as documented in README: `exams` Read for `users`, Create/Update/Delete for `label:admin`; `attempts` Create for `users`, Read & Delete for `label:admin`; document security remains enabled on `attempts`.
- [x] Include required database indexes, including `uid` on `attempts` and `p` on `exams`, in README instructions.
- [x] On `listDocuments()` calls for `exams` and `attempts`, always pass `Query.limit(100)` or paginate so Appwrite's default 25-document limit cannot hide exams or history.
- [x] Store lowercase Student ID (extracted from `user.email.split('@')[0]`) in `attempts.uid` for display/queries; use Appwrite `user.id` for `Role.user(user.id)` document permissions.
- [x] Keep the Appwrite endpoint, project ID, database ID, collection IDs, and any required public configuration out of hard-coded credentials; never ship a privileged API key to the browser.

## 3. Student login, navigation and portal pages
- [x] Pre-login homepage `/#/` displays only a clean, modern Student Login screen asking for Student ID and Password, includes a subtle Admin Login link to `/#/admin/login`, redirects successful student login to `/#/home`, and shows a clear error for invalid credentials.
- [x] After student login, provide persistent top navigation: Home (`/#/home`), Dashboard (`/#/dashboard`), Exams (`/#/exams`), Previous Exams (`/#/history`), and Logout (destroys the Appwrite session).
- [x] Home (`/#/home`) displays an “About the Examination Portal” section explaining exam rules, fullscreen/tab-switch policy, and how the portal works, accompanied by clean educational placeholder images.
- [x] Dashboard (`/#/dashboard`) displays KPI cards for Total Exams Taken, Average Score (%), Highest Score, and Improvement Trend (% change across tests); a Recharts Line/Bar chart plots score percentages over time; and a quick list shows recent test results.
- [x] Exams (`/#/exams`) lists all Published exams (`p === true`) the student has not yet attempted.
- [x] Cross-check `attempts`: if an attempt record exists for `(uid, eid)`, whether completed normally or terminated, do not allow another start; show it as Completed or Locked.
- [x] Previous Exams (`/#/history`) lists all past exams attempted by the student with date, score, percentage, and Completed/Terminated status.
- [x] Clicking a history item fetches its `exams` document by `eid` and opens Detailed Result Review with every question, the student's marked answer, the correct answer, and color coding: Green = Correct, Red = Wrong, Gray = Unanswered.
- [x] If an exam was deleted by an admin, preserve/display the saved score and show a notice that the question paper is no longer available.

## 4. Live exam, fullscreen enforcement, answer navigation, scoring and review
- [x] Live Exam route `/#/exam/:examId` validates on direct page load that the exam is published and no `attempts` record exists for `(uid, eid)`; if an attempt exists, immediately redirect to `/#/history`.
- [x] Do not request camera or microphone permissions and do not record media.
- [x] Show a brief rules-confirmation screen before starting. On “Begin Test,” immediately trigger `document.documentElement.requestFullscreen()` and start the countdown based on exam duration `d`.
- [x] Display one question at a time in the main panel with four selectable radio/card options.
- [x] Show a numbered question-palette sidebar for every question (`1, 2, 3, ... N`) that permits direct jumps. Visually highlight the current question, answered questions (for example green), and unanswered questions (for example gray).
- [x] Provide Previous and Next buttons below the question. Disable Previous on Question 1. On the final question, replace Next with a Submit Exam button.
- [x] Provide a persistent Submit Exam action in the exam header/sidebar so a student can submit early from any question. Clicking it opens a custom React confirmation modal (never native `window.confirm` or `window.alert`, as they trigger `window.blur`) showing the number answered versus unanswered before finalizing.
- [x] Marking scheme is +1 mark for each correct answer and 0 marks for wrong or unanswered questions; there is no negative marking.
- [x] Listen for `visibilitychange` (`document.hidden === true`), `window.blur`, `fullscreenchange` (exiting fullscreen), and `beforeunload` (page refresh/close).
- [x] If the student switches tabs, minimizes the browser, or exits fullscreen, immediately stop the exam and auto-submit selected answers so far, set `trm: true` in the `attempts` record to prevent re-attempt, and display a clear warning banner that the exam was terminated due to a tab/fullscreen violation.
- [x] During an active exam, disable right-click context menu, copy, paste, and text selection.
- [x] When the timer reaches `00:00`, submit immediately without waiting for confirmation.
- [x] On submission or termination, exit fullscreen, calculate score, and save the compact record to `attempts`.
- [x] Immediately after manual/early submission, timer expiry, or termination, display total marks (for example `14 / 20`), Total Correct, Total Wrong, Total Unanswered, and a complete question-by-question answer review showing each question, the student's marked answer (or “Unanswered”), and the correct answer, color-coded Green = Correct, Red = Wrong, Gray = Unanswered.
- [x] Use an `isSubmittingRef` lock to guarantee submission happens once and prevent duplicate Appwrite records when blur, visibilitychange, fullscreenchange or timer expiry fire simultaneously.
- [x] Attach `fullscreenchange` and `blur` anti-cheat listeners only after `requestFullscreen()` resolves. Before normal `document.exitFullscreen()`, remove/disable all anti-cheat listeners so normal submission does not set `trm: true`.
- [x] Mirror answer state into `answersRef.current` and read it inside event listeners and timer callbacks to prevent stale React closures.

## 5. Admin portal and exam/result management
- [x] Provide dedicated Admin Login (`/#/admin/login`) with Email & Password authentication and protect all `/#/admin/*` routes.
- [x] Admin Dashboard (`/#/admin/dashboard`) includes Create Exam and Manage Exams & Results tabs.
- [x] Create Exam fields include Exam Name, Exam Duration (in minutes), and Total Number of Questions.
- [x] Entering Total Number of Questions dynamically renders exactly that number of question cards (not fewer or a fixed sample); each card contains Question Text input, four Option inputs (A, B, C, D), and a Correct Option radio/dropdown selector.
- [x] Validate that every required field is filled and duration is greater than 0 before allowing publish.
- [x] “Publish Exam” serializes questions in compact JSON format and saves to `exams` with `p: true`.
- [x] Manage Exams & Results lists all created exams with Publish/Unpublish toggle and Delete action.
- [x] Manage Exams & Results shows student attempts, scores and termination flags.

## 6. Documentation, visual system and security disclosures
- [x] README provides step-by-step Appwrite Cloud Free Tier setup, database/collections/attributes/indexes, Document Security, collection permissions, manually created student accounts, admin `admin` label, Appwrite Web Platform/CORS, local `.env` configuration, and GitHub Pages deployment.
- [x] README explains that a static browser client exposing `c` in readable exam JSON and client-side anti-cheat cannot provide tamper-proof high-stakes exam integrity; do not misrepresent the client-side behavior as secure proctoring.
- [x] Apply the approved Swiss academic editorial visual direction, responsive navigation/layout, keyboard-accessible focus, reduced-motion support, calm status colors, and readable student/admin workflows.
- [x] Include planned educational home imagery and clear loading, error, empty, completed, locked, terminated, and deleted-paper states.
