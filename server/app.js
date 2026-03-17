import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pg from "pg";

import userRoutes from "./routes/user.routes.js";
import candidateRouter from "./routes/candidate.routes.js";
import domainDashboardRouter from "./routes/domainDashboard.routes.js";
import adminRouter from "./routes/admin.routes.js";
import examRouter  from "./routes/exam.routes.js";

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

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    family: 4,
});

try {
    await pool.query("SELECT 1");
    console.log("✅ Supabase connected successfully\n");
} catch (err) {
    console.error("❌ Supabase connection failed:", err);
    process.exit(1);
}

// ✅ All routes registered once, after DB is ready
app.use("/api/users", userRoutes);
app.use("/api/v1/candidate", candidateRouter);
app.use("/api/v1/candidate", domainDashboardRouter); // ✅ correct
app.use('/api/admin', adminRouter);
app.use('/api/exam',  examRouter);

export { app };