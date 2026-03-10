# Deploying CarPlace to Vercel

This guide outlines the steps required to successfully deploy the CarPlace Next.js application to Vercel, integrating with both Convex (Database) and Clerk (Authentication).

## 1. Prerequisites
Before deploying, ensure you have the following:
*   A [Vercel](https://vercel.com) account connected to your GitHub/GitLab/Bitbucket account.
*   Your CarPlace codebase pushed to a modern Git repository.
*   Access to your **Clerk Dashboard** and **Convex Dashboard**.

## 2. Preparing External Services for Production

### Convex Preparation
By default, `npx convex dev` connects to a development deployment. For Vercel, you need a Production deployment.
1.  Open your terminal in the project directory.
2.  Run `npx convex deploy`. This command will build your Convex functions and deploy them to your production environment on Convex.
3.  Go to the [Convex Dashboard](https://dashboard.convex.dev/), select your project, go to **Settings**, and locate your **Production Deployment URL**.

### Clerk Preparation
Clerk has separate Development and Production instances.
1.  Go to the [Clerk Dashboard](https://dashboard.clerk.com/).
2.  Select your application and switch the toggle at the top to **Production**.
3.  You will need to configure your domain (or the `.vercel.app` domain you'll temporarily use) in the Clerk dashboard.
4.  Navigate to **API Keys** in the Clerk dashboard to get your Production `Publishable Key` and `Secret Key`.

## 3. Vercel Deployment Steps

1.  **Import Project:** Log in to Vercel, click **Add New**, and select **Project**. Choose your Git repository containing CarPlace.
2.  **Configure Project:**
    *   **Framework Preset:** Vercel should automatically detect **Next.js**.
    *   **Root Directory:** Keep as `./` (unless your app is in a monorepo).
3.  **Environment Variables:** This is the most critical step. You must add the production versions of all variables from your local `.env.local` file.
    
    Add the following Environment Variables in the Vercel deployment settings:

    | Key | Source/Value |
    | :--- | :--- |
    | `NEXT_PUBLIC_CONVEX_URL` | Your **Production** Convex URL from the Convex Dashboard. |
    | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your **Production** Publishable Key from the Clerk Dashboard. |
    | `CLERK_SECRET_KEY` | Your **Production** Secret Key from the Clerk Dashboard. |
    | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
    | `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |

4.  **Deploy:** Click the **Deploy** button. Vercel will build the Next.js app and assign it a `your-app-name.vercel.app` domain.

## 4. Post-Deployment Configurations

### Clerk Domain Syncing
1.  Once Vercel assigns your domain (e.g., `carplace.vercel.app`), go back to the **Clerk Production Dashboard**.
2.  Go to **Domains / URLs** and update the application URL to match your new Vercel domain. This ensures Clerk's redirects and cookies work securely on your new URL.

### Organization Configuration (Reminder)
Since Dealerships use Clerk's Organization feature:
1.  Ensure **Organizations** are enabled in your Clerk Production instance.
2.  Verify that Organization Creation is restricted to Admins only (as configured locally) under **Organizations > Settings**.

## 5. Continuous Integration / Continuous Deployment (CI/CD)
Once set up, any changes pushed to your `main` or `master` branch will automatically trigger a new build and deployment on Vercel.

**Important Note for Convex:** If you make changes to your Convex schemas or backend functions, you must run `npx convex deploy` locally to push those changes to production *before* or *immediately after* your Vercel deployment completes, as Vercel only deploys the Next.js frontend frontend code by default.
