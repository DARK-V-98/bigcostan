# Website Architecture & Feature Blueprint: Big Costa

This document provides a technical overview of the Big Costa website, detailing its architecture, technology stack, and core features.

## 1. Project Overview

The Big Costa website is a modern, full-stack web application designed to serve as the digital presence for a diversified conglomerate with divisions in Construction, Home Solutions, Properties, and Technology. It functions as a corporate brochure, project showcase, and a client interaction portal with a secure, role-based administrative dashboard.

## 2. Technology Stack

The application is built on a modern, robust, and scalable technology stack:

-   **Framework**: [Next.js](https://nextjs.org/) (with App Router) - For server-rendered React applications, enabling excellent performance and SEO.
-   **UI Library**: [React](https://react.dev/) - For building dynamic and interactive user interfaces.
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for rapid UI development.
-   **Component Library**: [ShadCN/UI](https://ui.shadcn.com/) - A collection of beautifully designed, accessible, and reusable components.
-   **Backend as a Service (BaaS)**: [Firebase](https://firebase.google.com/) - Used for authentication, database, and file storage.
-   **Form Management**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) - For robust and type-safe form handling and validation.

## 3. Core Features

### 3.1. Public-Facing Website

-   **Dynamic Homepage**: Features an animated hero section with images pulled from Firestore, showcasing featured projects.
-   **Multi-Divisional Service Pages**: Dedicated, styled pages for each company division (Construction, Homes, Properties, Tech) to detail their offerings.
-   **Project & Portfolio Galleries**:
    -   **/projects**: A paginated gallery of all construction project images.
    -   **/homes**: A filterable gallery of home products (e.g., pantry cupboards).
    -   **/properties**: A searchable and filterable gallery for real estate listings.
-   **Dynamic SEO**:
    -   **`sitemap.ts`**: Automatically generates a sitemap for better search engine indexing.
    -   **`robots.ts`**: Provides clear crawling instructions to search engine bots.
    -   **Page-Specific Metadata**: Each page has unique titles and descriptions for improved search rankings.
    -   **Structured Data (JSON-LD)**: The homepage includes schema markup to help Google understand the business details, which can lead to rich search results.
-   **Contact Form**: A fully functional contact form that saves submissions directly to Firestore for administrative review.
-   **Testimonial System**: Displays client testimonials from Firestore and allows logged-in users to submit their own.

### 3.2. User Authentication & Authorization

-   **Authentication**: Secure user login and registration system using Firebase Authentication, supporting both email/password and Google Sign-In.
-   **Role-Based Access Control (RBAC)**: A sophisticated permission system controls access to the dashboard.
    -   **User**: Standard access, can submit properties and testimonials.
    -   **Agent**: Can manage property listings and submissions.
    -   **Admin**: Full access to all dashboard features.
    -   **Developer**: Full access, with some special permissions.
    -   *Custom Permissions*: Fine-grained access can be granted to users and agents on the "Manage Roles" page.

### 3.3. Administrative Dashboard (`/dashboard`)

A secure, role-based area for managing the website's content and user interactions.

-   **Role Management**: Admins can view all users and assign roles (`user`, `agent`, `admin`) and grant specific permissions.
-   **Content Management**:
    -   **Projects**: Upload new projects, manage categories/sub-categories, and edit existing project details.
    -   **Home Products**: Add/edit product categories and manage individual home solution products.
    -   **Properties**: Manage property categories and individual property listings with detailed fields (price, location, bedrooms, etc.).
    -   **Events & Designs**: Upload images for special events and pantry designs.
-   **Message Center**:
    -   **Contact Messages**: View, read, and delete messages submitted through the public contact form.
    -   **Property Submissions & Chat**: A dedicated inbox to review property submissions from users. Each submission automatically creates a private chat room between the user and the administrative team (agents/admins).

## 4. Backend & Database (Firebase)

-   **Firestore (Database)**: A NoSQL database used to store all dynamic content. Key collections include:
    -   `users`: Stores user profiles, roles, and permissions.
    -   `projects`, `homeProducts`, `properties`: Store listings for the respective website sections.
    -   `projectCategories`, `homeProductCategories`, `propertyCategories`: Manage the categories used for filtering.
    -   `contactSubmissions`: Stores messages from the contact form.
    -   `testimonials`: Stores client testimonials.
    -   `propertySubmissions`: Stores property listings submitted by users for review.
    -   `chats`: Manages the real-time chat conversations related to property submissions.
-   **Firebase Storage**: Used for securely storing all user-uploaded images for projects, properties, and chat attachments.
-   **Security Rules**: Firestore and Storage rules are configured to protect data integrity and ensure that only authorized users can read or write specific data. For example, only admins/developers can manage roles, while agents can manage property data.

This architecture creates a powerful, flexible, and maintainable website that effectively serves the diverse needs of the Big Costa brand and its customers.