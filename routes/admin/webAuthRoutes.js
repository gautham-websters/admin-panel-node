import express from "express";

import { login, logout, me } from "../../controllers/admin/authController.js";

import auth from "../../middleware/auth.js";

const router = express.Router();

router.post("/login", login);

router.post("/logout", auth, logout);

router.get("/me", auth, me);

export default router;
