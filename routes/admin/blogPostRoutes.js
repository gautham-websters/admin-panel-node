import blogPostController from "../../controllers/admin/blogPostController.js";
import express from "express";

import auth from "../../middleware/auth.js";

const router = express.Router();

router.get("/", auth, blogPostController.getAll);
router.post("/", auth, blogPostController.create);
router.put("/:id", auth, blogPostController.update);
router.delete("/:id", auth, blogPostController.remove);

export default router;
