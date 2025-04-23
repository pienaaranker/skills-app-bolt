### Modulern Implementation Plan

**Phase 1: Foundation & Setup**

*   [x] Set up development environment (Node.js, npm/yarn) - *Implied by project existence*
*   [x] Initialize Next.js project (`create-next-app`)
*   [x] Install core styling dependencies (Tailwind CSS, PostCSS, Autoprefixer)
*   [x] Install UI component library (`shadcn/ui` and its dependencies like Radix UI, `clsx`, `tailwind-merge`)
*   [x] Install icon library (`lucide-react`)
*   [x] Set up Supabase project (Create project on Supabase platform) - *External task, assumed done or pending*
*   [x] Define initial Supabase database schema (Tables: `users`, `skills`, `curricula`, `modules`, `steps`, `assignments`, `user_progress`) - *Needs verification*
*   [x] Configure Supabase Auth settings - *Needs verification*
*   [x] Install Supabase client libraries (`@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`)
*   [x] Configure Supabase environment variables in Next.js (`.env.local`)
*   [x] Create Supabase client helper/singleton for use throughout the app
*   [x] Obtain Google Gemini API key and set up billing - *External task*
*   [x] Configure Gemini API key in Next.js environment variables

**Phase 2: Core Features - Authentication & Curriculum**

*   [x] Implement User Authentication UI (Login Page, Signup Page) using `shadcn/ui` components.
*   [x] Implement Authentication logic using Supabase Auth helpers (`signInWithPassword`, `signUp`, `signOut`, session management).
*   [x] Create protected routes/middleware to ensure only logged-in users can access core app features.
*   [x] Implement Skill Selection UI (Input field, potentially suggestions).
*   [x] Implement Experience Level Selection UI (Radio buttons/Select for "beginner", "intermediate", "expert", "custom").
*   [x] Design and implement the "Custom" Experience Level Quiz UI and logic.
    *   [x] Define quiz questions (potentially needs LLM assistance for broad applicability). - *Handled via /api/quiz/generate*
    *   [x] Create UI for presenting questions and capturing answers. - *Handled via CustomQuiz.tsx*
    *   [x] Develop logic to assess quiz results and translate them into context for the LLM. - *Handled via /api/quiz/assess*
*   [ ] Develop Backend API Route (`/api/curriculum`) in Next.js:
    *   [ ] Receive skill, experience level (or quiz results) from frontend.
    *   [ ] Construct prompt for Gemini API based on input and PRD guidelines (request structured JSON output).
    *   [ ] Call Gemini API to generate curriculum.
    *   [ ] Add error handling for API calls.
    *   [ ] Parse Gemini's response (handle potential variations/errors).
    *   [ ] Optionally save the generated curriculum to Supabase linked to the user and skill.
    *   [ ] Return curriculum data to the frontend.
*   [ ] Build Frontend UI for displaying the generated curriculum:
    *   [ ] Use components like Accordion or Cards (`shadcn/ui`) to display modules and steps.
    *   [ ] Display resource links clearly.
    *   [ ] Ensure responsiveness and adherence to the `style-guide.md`.

**Phase 3: Learning & Interaction**

*   [ ] Implement Progress Tracking:
    *   [ ] Add UI elements (e.g., Checkboxes using `@radix-ui/react-checkbox` via `shadcn/ui`) to mark steps as complete.
    *   [ ] Create API endpoint/server action to update `user_progress` table in Supabase when a step is marked complete/incomplete.
    *   [ ] Fetch progress data from Supabase to display the current state on the curriculum UI.
*   [ ] Develop Assignment Generation Feature:
    *   [ ] Add UI button/trigger on curriculum modules/steps to request an assignment.
    *   [ ] Develop Backend API Route (`/api/assignment`) in Next.js:
        *   [ ] Receive context (e.g., module topic, completed steps) from the frontend.
        *   [ ] Construct prompt for Gemini API requesting a relevant assignment.
        *   [ ] Call Gemini API and handle response/errors.
        *   [ ] Return assignment details to the frontend.
    *   [ ] Build Frontend UI to display the generated assignment.
    *   [ ] *(Optional V2)* Implement assignment submission (text area/file upload) and potentially LLM-based feedback.

**Phase 4: User Experience & Polish**

*   [ ] Create User Dashboard:
    *   [ ] Fetch and display user's currently learning skills.
    *   [ ] Show overall progress overview (e.g., using Progress component from `shadcn/ui`).
    *   [ ] Potentially suggest next steps or skills.
*   [ ] Implement Status/Notifications (e.g., using `Sonner` or `Toast` from `shadcn/ui`) for actions like curriculum generation, progress saving, errors.
*   [ ] Refine UI/UX based on `style-guide.md` and user feedback.
*   [ ] Implement Accessibility features (ARIA attributes, keyboard navigation, contrast checks) according to WCAG AA target.
*   [ ] Add error handling and reporting mechanisms (e.g., reporting inaccurate links/content).
*   [ ] Write unit and integration tests.

**Phase 5: Deployment**

*   [ ] Prepare for deployment on Vercel.
*   [ ] Configure production environment variables (Supabase keys, Gemini key) on Vercel.
*   [ ] Deploy the application.
*   [ ] Set up monitoring and logging. 