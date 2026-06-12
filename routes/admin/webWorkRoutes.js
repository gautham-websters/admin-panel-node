import express from "express";

import auth from "../../middleware/auth.js";

import {
  getAllWorks,
  getWorkById,
  createWork,
  updateWork,
  deleteWork,
} from "../../controllers/admin/webWorkController.js";

const router = express.Router();

router.get("/", auth, getAllWorks);

router.get("/:id", auth, getWorkById);

router.post("/", auth, createWork);

router.put("/:id", auth, updateWork);

router.delete("/:id", auth, deleteWork);

export default router;
