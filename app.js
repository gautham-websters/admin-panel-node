import express from "express";
import cors from "cors";

import webAdminBlogRoutes from "./routes/admin/webBlogRoutes.js";
import webAdminWorkRoutes from "./routes/admin/webWorkRoutes.js";
import webPublicBlogRoutes from "./routes/public/webBlogRoutes.js";
import webPublicWorkRoutes from "./routes/public/webWorkRoutes.js";
import webAdminAuthRoutes from "./routes/admin/webAuthRoutes.js";

import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WEBSTERS MEDIA ROUTES
app.use("/web/admin/blogs", webAdminBlogRoutes);
app.use("/web/admin/works", webAdminWorkRoutes);
app.use("/web/blogs", webPublicBlogRoutes);
app.use("/web/works", webPublicWorkRoutes);
app.use("/web/admin/auth", webAdminAuthRoutes);

// AWESOME EVENTS ROUTES

app.use(notFound);
app.use(errorHandler);

export default app;
