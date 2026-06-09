import express from "express";

import {
  getBlogs,
  getBlogBySlug,
} from "../../controllers/public/webBlogController.js";

const router = express.Router();

router.get("/", getBlogs);
router.get("/:slug", getBlogBySlug);

export default router;
