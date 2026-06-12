import express from "express";

import {
  getWorks,
  getWorkBySlug,
} from "../../controllers/public/webWorkController.js";

const router = express.Router();

router.get("/", getWorks);

router.get("/:slug", getWorkBySlug);

export default router;
