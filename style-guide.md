# Skill Learning App: Style Guide

## 1. Core Principles

The visual design of the Skill Learning App should embody the following principles:

* **Clarity:** Information should be presented clearly and logically. Users should easily understand where they are, what to do next, and how they are progressing.
* **Motivation:** The design should feel encouraging and positive, celebrating progress and making learning feel achievable and exciting.
* **Engagement:** Visual elements should draw users in and make interacting with the learning content enjoyable.
* **Trustworthiness:** The app should look professional and reliable, assuring users of the quality of the generated curricula.
* **Accessibility:** Design for inclusivity, ensuring the app is usable by people of all abilities.
* **Simplicity:** Avoid clutter. Focus on essential information and actions.

## 2. Color Palette

The palette aims for a balance of calm focus, energetic motivation, and clean readability.

* **Primary:** (Used for key actions, active states, branding)
    * `#4F46E5` (Indigo-600) - A vibrant, trustworthy blue/purple.
* **Secondary:** (Used for secondary buttons, complementary elements)
    * `#10B981` (Emerald-500) - An encouraging, positive green, often associated with success/completion.
* **Accent/Highlight:** (Used for progress bars, notifications, calls to action)
    * `#F59E0B` (Amber-500) - A bright, optimistic yellow/orange.
* **Neutrals:** (Used for backgrounds, text, borders, inactive states)
    * Background: `#FFFFFF` (White) / `#F9FAFB` (Gray-50)
    * Text (Primary): `#111827` (Gray-900)
    * Text (Secondary): `#6B7280` (Gray-500)
    * Borders/Dividers: `#E5E7EB` (Gray-200)
    * Disabled States: `#D1D5DB` (Gray-300) / `#9CA3AF` (Gray-400)
* **Status Colors:**
    * Success: `#10B981` (Emerald-500)
    * Warning: `#F59E0B` (Amber-500)
    * Error: `#EF4444` (Red-500)

*(Note: These are Tailwind CSS color names/values for reference)*

## 3. Typography

Readability is key for a learning app.

* **Primary Font:** Inter (Available via Google Fonts) - A clean, highly legible sans-serif suitable for UI text.
    * `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`
* **Headings:** Inter - Bold (600 or 700 weight). Use clear size hierarchy (e.g., h1: 30px, h2: 24px, h3: 20px).
* **Body Text:** Inter - Regular (400 weight). Base size: 16px. Line height: 1.5 or 1.6 for readability.
* **UI Elements (Buttons, Labels):** Inter - Medium (500 weight) or Semi-Bold (600 weight).

## 4. Iconography

Icons should be simple, clear, and consistent.

* **Style:** Line icons are preferred for a modern, clean look.
* **Library:** Use a consistent library like **Lucide Icons** (`lucide-react` for React/Next.js).
* **Usage:** Use icons sparingly to support understanding (e.g., for navigation, actions, status indicators), not just for decoration. Ensure icons have appropriate labels or tooltips for accessibility.

## 5. Imagery & Illustrations

* **Style:** Consider using simple, abstract shapes or subtle, friendly illustrations that relate to learning, growth, and achievement. Avoid overly complex or distracting visuals.
* **Purpose:** Use visuals to break up text, add personality, and reinforce positive actions (e.g., completing a module).
* **Placeholders:** Use clean, neutral placeholders when images or specific illustrations aren't available.

## 6. Layout & Spacing

Consistency creates a calm and predictable user experience.

* **Grid System:** Use a standard grid system (like Tailwind's default) for layout structure.
* **Spacing:** Use a consistent spacing scale based on a base unit (e.g., 4px or 8px). Apply this for margins, padding, and gaps between elements. (Tailwind's spacing scale is recommended).
* **White Space:** Be generous with white space to reduce clutter and improve focus.
* **Alignment:** Ensure elements are consistently aligned.

## 7. Component Styles

Apply consistent styling across common UI elements. Use rounded corners for a softer, modern feel.

* **Buttons:**
    * **Primary:** Primary color background, white text. Clear hover/active states (e.g., slightly darker background).
    * **Secondary:** Secondary color background or outline with secondary color text. Clear hover/active states.
    * **Tertiary/Link:** Minimal styling, often just colored text.
    * **General:** Use medium padding, rounded corners (e.g., `rounded-md` or `rounded-lg` in Tailwind). Ensure clear disabled states (neutral background/text).
* **Cards:**
    * Use for curriculum modules, steps, dashboard items.
    * White or light neutral background (`#FFFFFF` / `#F9FAFB`).
    * Subtle border (`border border-gray-200`) or light shadow (`shadow-sm` or `shadow-md`).
    * Rounded corners (`rounded-lg`).
    * Consistent internal padding.
* **Forms & Inputs:**
    * Clear, visible labels placed above inputs.
    * Consistent input height and padding.
    * Subtle border (`border-gray-300`).
    * Clear focus state (e.g., primary color ring/border).
    * Rounded corners (`rounded-md`).
    * Provide clear visual feedback for validation (success, error states using status colors).
* **Progress Indicators:**
    * **Progress Bars:** Use the Accent color (`#F59E0B`) or Secondary color (`#10B981`) for the fill. Clear background. Rounded corners. Consider subtle animations on update.
    * **Checkboxes/Radio Buttons:** Style consistently. Use the primary color for the checked state.
* **Modals/Dialogs:**
    * Use a backdrop overlay.
    * Clear separation from the background (shadow, border).
    * Consistent padding and structure (header, body, footer/actions).
    * Rounded corners.
* **Navigation:**
    * Clear visual distinction for the active link/page.
    * Intuitive placement (e.g., sidebar or top navigation).

## 8. Tone of Voice

* **Encouraging & Supportive:** Use positive language. Celebrate progress ("Great job!", "You've completed this step!").
* **Clear & Concise:** Avoid jargon. Be direct and easy to understand.
* **Action-Oriented:** Use clear calls to action (e.g., "Start Learning", "Next Step", "Generate Assignment").

## 9. Accessibility (WCAG AA Compliance Target)

* **Color Contrast:** Ensure sufficient contrast between text and background colors (use tools to check).
* **Keyboard Navigation:** All interactive elements must be navigable and operable using a keyboard.
* **Focus Indicators:** Ensure clear visual focus indicators for keyboard users.
* **Semantic HTML:** Use appropriate HTML tags (e.g., `<button>`, `<nav>`, `<main>`) for structure and accessibility.
* **ARIA Attributes:** Use ARIA attributes where necessary to enhance accessibility for screen readers.
* **Alternative Text:** Provide descriptive alt text for meaningful images.

---

This style guide provides a foundation for building a visually appealing, consistent, and user-friendly Skill Learning App. Refer back to it during development and design iterations.


