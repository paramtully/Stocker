# Project Setup Commands (From Scratch)

1. Create Vite React Project
    *Scaffolds a working React + TypeScript project with all config files*

    npm create vite@latest stocker -- --template react-ts
    cd stocker
    npm install


2. Restructure for Monorepo
    *Separates frontend, backend, and shared code*
    
    * Move frontend into client folder
        mkdir client
        mv src client/src
        mv index.html client/
        mv public client/ 2>/dev/null || true
    * Create backend and shared folders
        mkdir -p server/services
        mkdir shared

Separates frontend, backend, and shared code.

3. Update vite.config.ts
    *Points Vite to the new client folder structure*

    import path from "path"
    import react from "@vitejs/plugin-react"
    import { defineConfig } from "vite"
    export default defineConfig({
    plugins: [react()],
    root: "client",
    resolve: {
        alias: {
        "@": path.resolve(__dirname, "./client/src"),
        "@shared": path.resolve(__dirname, "./shared"),
        },
    },
    })

4. Update tsconfig.json
    *Enables path aliases for imports*

    {
    "compilerOptions": {
        "target": "ES2020",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "strict": true,
        "jsx": "react-jsx",
        "esModuleInterop": true,
        "skipLibCheck": true,
        "baseUrl": ".",
        "paths": {
        "@/*": ["./client/src/*"],
        "@shared/*": ["./shared/*"]
        }
    },
    "include": ["client/src", "server", "shared"]
    }

5. Install Tailwind
    *Sets up Tailwind CSS*

    npm install -D tailwindcss@^3.4 postcss autoprefixer @types/node
    npx tailwindcss init -p
    


6. Initialize shadcn/ui
    *Installs all UI components used in Stocker*

    npx shadcn@latest init

    *When prompted:*
        Style: New York
        Base color: Zinc (or your preference)
        CSS variables: Yes
        CSS file location: client/src/index.css
        Components location: client/src/components
        npx shadcn@latest add button card dialog select tabs toast form input label separator avatar dropdown-menu scroll-area skeleton switch checkbox

7. Install Backend Dependencies
    *Sets up Express server with PostgreSQL and session management.*

    npm install express express-session connect-pg-simple pg drizzle-orm zod openid-client
    npm install -D @types/express @types/express-session @types/connect-pg-simple tsx drizzle-kit drizzle-zod


8. Install Frontend Dependencies
    *Adds routing, data fetching, charts, and animations.

    npm install wouter @tanstack/react-query recharts lucide-react date-fns framer-motion


9. Create Database Schema (shared/schema.ts)
    *Defines your database structure*

    import { pgTable, serial, text, integer, timestamp, boolean, decimal } from "drizzle-orm/pg-core";
    import { createInsertSchema } from "drizzle-zod";
    export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    email: text("email"),
    name: text("name"),
    // ... other fields
    });
    export const stocks = pgTable("stocks", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    ticker: text("ticker").notNull(),
    shares: decimal("shares").notNull(),
    purchasePrice: decimal("purchase_price"),
    purchaseDate: text("purchase_date"),
    });
    // ... other tables


10. Create drizzle.config.ts
    *Configures Drizzle ORM*

    import { defineConfig } from "drizzle-kit";
    export default defineConfig({
    schema: "./shared/schema.ts",
    out: "./migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    });

11. Add Scripts to package.json
    *Enables dev server and database sync commands*

    "scripts": {
    "dev": "tsx server/index.ts",
    "build": "vite build",
    "db:push": "drizzle-kit push"
    }

12. Create Server Entry Point (server/index.ts)
    *Basic Express server setup*

    import express from "express";
    import { registerRoutes } from "./routes";
    const app = express();
    app.use(express.json());
    registerRoutes(app);
    app.listen(5000, "0.0.0.0", () => {
    console.log("Server running on port 5000");
    });


13. Push Database Schema
    *Creates tables in PostgreSQL*
    
    npm run db:push


14. Start Development
    *Runs the full-stack app*

    npm run dev
