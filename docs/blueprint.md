# Project Blueprint: Big Costa Conglomerate Website

This document provides a comprehensive technical overview of the Big Costa website. It details the technology stack, project structure, key features, and overall architecture.

## 1. Technology Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with CSS Variables for theming.
- **UI Components:** [ShadCN/UI](https://ui.shadcn.com/) - A collection of beautifully designed, accessible, and reusable components.
- **Backend & Database:** [Firebase](https://firebase.google.com/)
  - **Authentication:** Manages user login, registration, and roles.
  - **Firestore:** A NoSQL database for storing all dynamic content (projects, users, testimonials, etc.).
  - **Storage:** Used for hosting all user-uploaded images and files.
- **Form Management:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation.
- **Deployment:** Configured for a standard Node.js environment, compatible with platforms like Vercel or Firebase App Hosting.

---

## 2. Project Structure

The project follows a standard Next.js App Router structure.

```
.
├── src/
│   ├── app/                # Main application routes
│   │   ├── (public_routes) # e.g., /, /about-us, /projects
│   │   ├── dashboard/      # Protected routes for content management
│   │   └── layout.tsx      # Root layout with providers
│   ├── components/
│   │   ├── layout/         # Reusable layout components (Header, Footer)
│   │   ├── sections/       # Major homepage sections (Hero, Services, etc.)
│   │   └── ui/             # ShadCN UI components
│   ├── context/            # React Context providers (Auth, Theme)
│   ├── lib/                # Utility functions and Firebase configuration
│   └── hooks/              # Custom React hooks
├── public/                 # Static assets (images, videos, PDFs)
└── tailwind.config.ts    # Tailwind CSS configuration
```

---

## 3. Pages and Routing

The website is divided into public-facing pages and a protected dashboard for administration.

### 3.1. Public Pages

-   **`/` (Homepage)**: The main landing page that introduces all core divisions of the company. It features a hero section, company summary, service overview, project showcase, testimonials, and a contact form.
-   **`/about-us`**: Provides detailed information about the company's history, mission, vision, and showcases key business partners with embedded videos and downloadable profiles.
-   **`/services/construction`**: A dedicated page listing all construction-related services, from general contracting to specialized trades.
-   **`/services/home-solutions`**: Details the offerings of the "Big Costa Homes" division, including custom pantry cupboards and interior design.
-   **`/services/tech`**: Outlines the product categories for the "Big Costa Tech" retail division.
-   **`/projects`**: A full gallery showcasing all uploaded project images, with pagination for easy browsing.
-   **`/properties`**: A filterable listing page for all real estate properties, allowing users to search and view details.
-   **`/homes`**: A browsable catalog of home products, filterable by category.
-   **`/auth`**: A single page for user login and registration, with support for email/password and Google social sign-in.

### 3.2. Protected Dashboard

-   **`/dashboard`**: The central hub for all content management, accessible only to authenticated users with appropriate permissions.
-   **`/dashboard/roles`**: Allows `admin` and `developer` users to manage user roles and fine-grained permissions.
-   **`/dashboard/messages`**: An inbox for viewing and managing messages submitted through the public contact form.
-   **`/dashboard/events`**: A section for managing special event images displayed on the site.
-   **`/dashboard/submissions`**: An interface for agents and admins to review and chat with users about their property submissions.
-   **`/dashboard/projects/*`**: A group of pages for managing project categories, uploading new projects, and editing existing ones.
-   **`/dashboard/homes/*`**: A group of pages for managing home product categories and the products themselves.
-   **`/dashboard/properties/*`**: A group of pages for managing property categories and individual property listings.

---

## 4. Styling and UI

-   **Theming**: The site uses a powerful theming system managed in `src/app/globals.css`. It leverages CSS variables to define multiple themes (`default`, `theme-tech`, `theme-orange-black`). The theme can be switched dynamically using the theme toggle in the header.
-   **Component Library**: The UI is built with **ShadCN/UI**, providing a consistent and professional look and feel. All base components (buttons, cards, forms, etc.) are located in `src/components/ui`.
-   **Layout**: The main structure is defined by the `Header` and `Footer` components, which are shared across all pages. The homepage is composed of modular sections found in `src/components/sections`, such as:
    -   `Hero.tsx`: The main banner with a dynamic background.
    -   `WhoWeAre.tsx`: A brief company introduction.
    -   `VisionMission.tsx`: Highlights the company's core values.
    -   `Services.tsx`: Showcases the main business divisions.
    -   `Projects.tsx`: A curated gallery of featured projects.
    -   `Testimonials.tsx`: A carousel of client feedback.
    -   `Contact.tsx`: A contact form and information section.
-   **Animations**: Subtle animations are implemented using `AnimateOnScroll.tsx` to provide a smooth, engaging user experience as they scroll through pages.

---

## 5. Key Features & Architecture

### 5.1. Authentication and Role-Based Access Control (RBAC)

-   **Firebase Authentication** is used for user management.
-   The `AuthProvider` (`src/context/auth-provider.tsx`) is a critical component that wraps the entire application. It manages the user's session and retrieves their assigned `role` and `permissions` from Firestore.
-   The `role` (`admin`, `developer`, `agent`, `user`) provides broad access levels, while `permissions` (e.g., `canEditProjects`, `canViewMessages`) allow for fine-grained control over what a user can see and do in the dashboard.
-   This system is secure, as Firestore Security Rules on the backend enforce these roles and permissions for all database operations.

### 5.2. Content Management System (Dashboard)

-   The dashboard is a complete, custom-built CMS that allows authorized users to manage all dynamic content on the website without touching any code.
-   **Data Management**: Each section of the dashboard (Projects, Homes, Properties, etc.) allows for full CRUD (Create, Read, Update, Delete) operations.
-   **Image Uploads**: All image uploads are handled securely through Firebase Storage. The forms manage the upload process and then store the resulting image URL in Firestore.

### 5.3. Dynamic SEO and Metadata

-   The website is optimized for search engines.
-   **`sitemap.ts`**: Automatically generates a `sitemap.xml` file that lists all important pages, helping Google discover and index the site content.
-   **`robots.ts`**: Provides clear crawling instructions to search engine bots.
-   **Page-Specific Metadata**: Each page has unique and descriptive `title` and `description` tags to improve search ranking for relevant keywords.
-   **Structured Data (JSON-LD)**: The homepage includes structured data to help Google understand the site as a business entity, which can result in enhanced search result listings.

### 5.4. Property Submission & Chat System

-   **Submission Form**: Authenticated users can submit their properties for sale through a dedicated form. This form uploads property details and images.
-   **Chat Creation**: Upon submission, a new "chat room" is automatically created in Firestore, linking the user, their submission, and company agents.
-   **Real-time Chat**: Both the user (in their "My Chats" page) and the dashboard users (in "Submissions") can communicate in real-time through a dedicated chat interface. The system tracks read/unread status for messages.