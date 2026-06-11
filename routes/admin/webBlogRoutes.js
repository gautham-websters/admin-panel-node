import express from "express";
import auth from "../../middleware/auth.js";

import {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
} from "../../controllers/admin/webBlogController.js";

const router = express.Router();

router.get("/", auth, getAllBlogs);

router.get("/:id", auth, getBlogById);

router.post("/", auth, createBlog);

router.put("/:id", auth, updateBlog);

router.delete("/:id", auth, deleteBlog);

export default router;
