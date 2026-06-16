import portfolioController from "../../controllers/admin/portfolioController.js";
import express from "express";

import auth from "../../middleware/auth.js";

const router = express.Router();

router.get("/", auth, portfolioController.getAll);
router.post("/", auth, portfolioController.create);
router.put("/:id", auth, portfolioController.update);
router.delete("/:id", auth, portfolioController.remove);

export default router;
