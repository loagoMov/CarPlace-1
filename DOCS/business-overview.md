# CarPlace Business Overview

## Product Vision
CarPlace is a premium, mobile-first marketplace connecting car dealerships with buyers. It emphasizes high-quality visual presentation, seamless user experience, and direct communication channels.

## Key Stakeholder Value
- **For Buyers**: A beautiful, intuitive interface to search, filter, and view detailed car specifications. Direct communication with dealers via WhatsApp integration removes friction.
- **For Dealerships**: A simplified, secure dashboard to manage inventory, track stats, and present their vehicles professionally without needing technical expertise.
- **For Platform Owners (Admins)**: A secure, organization-based structure (powered by Clerk) ensuring only vetted dealerships can list vehicles.

## Core Features & Walkthroughs

### 1. Dealership Onboarding & Management
To maintain quality control, dealerships cannot self-register. 
- **The Flow**: An Admin invites a dealer via the Clerk Dashboard. The dealer clicks the invite, creates an account, and is automatically placed into their Dealership workspace.
- **The Dashboard (`/dashboard`)**: Once logged in, dealers see a high-level overview of their inventory valuation and active listings. They can add, edit, or remove vehicles effortlessly. 

### 2. Vehicle Inventory Management
We have heavily upgraded the details available for vehicles to provide buyers with the information they need to make decisions.
- **Adding a Vehicle**: Dealers click "Add Vehicle" in the dashboard. They can now specify detailed attributes: Category (SUV, Sedan, etc.), Fuel Type, Transmission, Engine Size, Color, and upload multiple photos.
- **Status Tracking**: Vehicles can be marked as "Available", "Reserved", or "Sold" directly from the dashboard.

### 3. The Buyer Experience: Browsing & Searching
The core of the application is designed for discovery.
- **Home Page**: Features a hero search area and quick category filters (e.g., SUVs, Luxury). 
- **Search Page (`/search`)**: Clicking the search bar or a category takes the user to a dedicated search page. This page features real-time search (typing instantly filters cars) and visual category pills.
- **Vehicle Details (`/listings/[id]`)**: Clicking a car reveals a premium, sticky image gallery (on desktop) and a comprehensive breakdown of the newly added specifications.

### 4. Conversion Actions (Call to Action)
We focus on reducing friction between seeing a car and contacting the dealer.
- **WhatsApp Integration**: On the vehicle details page, clicking "Contact Dealer" automatically opens WhatsApp, pre-filling a message with the car's Make, Model, and Price, allowing for instant communication.
- **Book a Visit**: A secondary call to action designed to drive foot traffic to physical dealerships.

## Strategic Advantages
- **Mobile-First Design**: The interface mimics native applications with bottom navigation bars and floating action buttons, catering to the reality that most users browse on their phones.
- **Premium Aesthetics**: We utilize "Glassmorphism" (frosted glass effects) and clean, modern typography to elevate the perceived value of the cars listed.
