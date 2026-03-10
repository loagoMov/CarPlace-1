# CarPlace Onboarding Guide

Welcome to the CarPlace project! This document will help you get your local environment set up and explain how to run the application.

## Prerequisites
Before you begin, assure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- npm (comes with Node.js)
- A Code Editor (VS Code recommended)
- Git

## 1. Initial Setup

1. **Clone the Repository** (If you haven't already):
   Ensure you are in the `CarPlace-1` directory.
   
2. **Install Dependencies**:
   Open your terminal and run:
   ```bash
   npm install
   ```

## 2. Environment Variables
CarPlace relies on two external services: **Convex** (Database) and **Clerk** (Authentication).

Ensure your `.env.local` file is present in the root of the directory and contains the following keys:
```env
# Convex Configuration
CONVEX_DEPLOYMENT=your_convex_deployment_string
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```
*(If you do not have these keys, request them from the project lead).*

## 3. Running the Application

To develop locally, you need to run two servers simultaneously. **We recommend opening two separate terminal windows/tabs.**

**Terminal 1: Start the Convex Database Sync**
This command continuously pushes your schema changes and functions to the Convex cloud.
```bash
npx convex dev
```

**Terminal 2: Start the Next.js Frontend Server**
This starts the actual web application.
```bash
npm run dev
```

Once both are running, open your browser and navigate to: `http://localhost:3000`

## 4. Testing Core Features

### As a Buyer (No Account Needed)
1. Go to `localhost:3000`.
2. Browse the home page and click on category tags.
3. Use the search bar to test real-time filtering.
4. Click on a car to view its detailed specifications and test the "Contact Dealer" button.

### As a Dealer (Requires Admin Setup)
1. Go to your Clerk Developer Dashboard.
2. Ensure you have created an "Organization" (Dealership).
3. Invite your testing email address to that organization.
4. Go back to `localhost:3000` and sign in.
5. Click the "Dealer" tab on the bottom navigation bar.
6. Try adding a new vehicle with multiple images and specifications.
7. Try editing that vehicle's price and status.

## Need Help?
Refer to the `developer-guide.md` and `business-overview.md` in this `DOCS` folder for deeper dives into the architecture and product vision.
