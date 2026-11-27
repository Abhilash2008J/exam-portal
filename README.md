# Online Student Examination Portal

A static React/Vite exam portal for GitHub Pages. Student and administrator authentication, exam data, and attempt records are handled directly through the Appwrite Web SDK. The app uses `HashRouter` and `base: './'`, so it can be served below a GitHub Pages repository path.

The homepage study-desk photo is bundled locally for static hosting and credited to [Unsplash](https://unsplash.com/photos/desk-with-open-book-laptop-and-study-materials-HNjWq8WPyoY).

## 1. Requirements and local setup

Use Node.js 20 or newer and pnpm 11.25.0. Clone the repository, enable Corepack if needed, then install and run:

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

Fill in the Appwrite values in `.env` before attempting to authenticate. The app requires these Vite variables:

```dotenv
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DB_ID=your-database-id
VITE_APPWRITE_EXAMS_COLLECTION_ID=exams
VITE_APPWRITE_ATTEMPTS_COLLECTION_ID=attempts
```

The endpoint, project/database/collection IDs are public browser configuration, not secrets. Never put an Appwrite server API key in a `VITE_*` variable or the website repository. `.env` is ignored by Git; `.env.example` contains names only.

## 2. Appwrite Cloud setup

### Create a project and add Web Platforms

1. Create an Appwrite Cloud project and copy its Project ID and API endpoint into `.env`.
2. In **Overview → Add a platform → Web app**, add `localhost` for local development.
3. Add the GitHub Pages hostname as a second Web platform, for example `username.github.io`. For a project URL like `https://username.github.io/exam-portal/`, the Web platform hostname is `username.github.io` (no path). This is required to avoid browser CORS failures.
4. Enable Email/Password authentication in the Appwrite Auth settings.

### Create the database, collections and attributes

Create a database and set `VITE_APPWRITE_DB_ID` to its ID. Create two collections and set their IDs in `.env` (the suggested IDs below are `exams` and `attempts`). Use the attribute types/names exactly as shown; the compact keys are part of the application contract.

**`exams`**

| Key | Type | Required | Details |
| --- | --- | --- | --- |
| `t` | String | Yes | Exam title |
| `d` | Integer | Yes | Duration in minutes |
| `q` | String | Yes | Maximum 65,000 characters; compact question JSON, e.g. `[{"q":"Question text","o":["Opt1","Opt2","Opt3","Opt4"],"c":0}]`. `c` is the correct option index 0–3. |
| `p` | Boolean | No | Default `false`; `true` makes the exam visible to students |
| `ts` | Integer | No | Creation Unix timestamp in seconds |

Create a key index on `p` (ascending) so the published-exam query is supported.

**`attempts`**

| Key | Type | Required | Details |
| --- | --- | --- | --- |
| `uid` | String | Yes | Lowercase student ID (the part of the authenticated user's email before `@`) |
| `eid` | String | Yes | Exam document ID |
| `et` | String | Yes | Cached exam title, so history remains readable if the exam is deleted |
| `a` | String | Yes | Compact JSON selected-option indices; `-1` means unanswered, e.g. `[0,2,-1,1]` |
| `s` | Integer | Yes | Score: +1 per correct answer; wrong/unanswered = 0 |
| `tot` | Integer | Yes | Total possible marks; equals question count |
| `trm` | Boolean | No | Default `false`; `true` if tab/fullscreen violation terminated the attempt |
| `ts` | Integer | Yes | Submission Unix timestamp in seconds |

Create key indexes for `uid` (ascending), `ts` (descending), and a composite key index on `uid` ascending + `ts` descending, which supports the student's ordered history query. Also create an index on `eid` if you later add server-side duplicate-attempt checks.

### Collection permissions and document security

Set collection permissions as follows, replacing the labels with Appwrite's role selector for the `admin` label:

| Collection | Permissions |
| --- | --- |
| `exams` | Read: `users`; Create, Update, Delete: `label:admin` |
| `attempts` | Create: `users`; Read and Delete: `label:admin` |

Enable **Document Security** on `attempts`. Each created attempt includes document permissions:

```js
[
  Permission.read(Role.user(currentUserId)),
  Permission.read(Role.label('admin')),
  Permission.delete(Role.label('admin')),
]
```

This allows the owning student to read their own attempt; admins can read/delete records. Students cannot delete or read another student's document through these permissions.

### Create student and admin accounts

1. In Appwrite Auth, create each student account manually. Enter the student's email as `<student-id-in-lowercase>@exam.local`; the login page accepts the Student ID and applies that mapping automatically. Set a password and provide it to the student securely.
2. Create an administrator account with its real email address (admin login does **not** append `@exam.local`). Add the `admin` label to that Appwrite user using the Appwrite Console. The UI checks this label before showing the administrator workspace.
3. Do not share administrator credentials. Admins create, publish/unpublish, and delete exams from **Manage assessments**.

## 3. GitHub Pages deployment

This repository includes `.github/workflows/deploy-pages.yml`, which builds the static Vite output and deploys it to GitHub Pages on pushes to `main`.

1. Push the repository to GitHub and open **Settings → Pages**. Choose **GitHub Actions** as the build and deployment source.
2. Open **Settings → Secrets and variables → Actions → Variables** and add these public Vite build variables with the values from your Appwrite project: `VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID`, `VITE_APPWRITE_DB_ID`, `VITE_APPWRITE_EXAMS_COLLECTION_ID`, and `VITE_APPWRITE_ATTEMPTS_COLLECTION_ID`.
3. Push to `main` or run the `Deploy to GitHub Pages` workflow manually. The workflow injects those variables at build time; a static website cannot read GitHub Actions variables after deployment.
4. Confirm the Pages deployment URL and add its hostname (for example `username.github.io`) as a Web platform in Appwrite as described above.

For a one-off local build, create `.env` with the same values and run `pnpm build`; the generated static site is in `dist/`. The Vite base is deliberately `./` for relative asset loading on GitHub Pages.

## 4. Exam behavior and known integrity boundary

The exam screen starts only after the user confirms the rules and the browser grants fullscreen. It displays one question at a time, provides a palette and Previous/Next navigation, disables Previous on Question 1, and changes Next to **Submit Exam** on the final question. The student can submit early through the header/sidebar action and a custom confirmation dialog. Scores use +1 for correct and zero for wrong/unanswered. Timer expiry submits automatically; client-side tab/fullscreen/focus events terminate and save the attempt as `trm: true`. A guarded submit function prevents simultaneous browser events from creating duplicate attempt documents.

**This static-client architecture is not suitable as tamper-proof proctoring for high-stakes exams.** The requested `exams.q` document contains the correct option index and authenticated students can read that document, so they can inspect answer keys in developer tools/network traffic. Client-side scoring, one-attempt checks, and focus/fullscreen monitoring can also be modified or bypassed by a determined user. This implementation ships no privileged Appwrite key and does not claim to prevent those attacks. For high-stakes use, move answer keys to a private collection, have an authenticated Appwrite Function enforce one-attempt rules and score submissions server-side, and return only the authorized post-submission review. Consider a server-side timer/state model as well.

## 5. Build

```bash
pnpm build
```

The project has no server component; the `dist/` folder is the static site artifact.
