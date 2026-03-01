import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pg from "pg";

import userRoutes from "./routes/user.routes.js";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(cookieParser());
app.use(express.static("public"));

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in .env");
    process.exit(1);
}

// ✅ THIS IS THE IMPORTANT PART FOR SUPABASE
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
    family : 4,
});

// Test DB connection properly
try {
    await pool.query("SELECT 1");
    console.log("✅ Supabase connected successfully\n");
} catch (err) {
    console.error("❌ Supabase connection failed:", err);
    process.exit(1);
}

app.use("/api/users", userRoutes);

export { app };