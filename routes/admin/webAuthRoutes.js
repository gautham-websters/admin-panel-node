import express from "express";

import { login } from "../../controllers/admin/webAuthController.js";

import auth from "../../middleware/auth.js";

const router = express.Router();

router.post("/login", login);

export default router;
