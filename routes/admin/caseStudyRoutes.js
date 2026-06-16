import caseStudyController from "../../controllers/admin/caseStudyController.js";
import express from "express";

import auth from "../../middleware/auth.js";

const router = express.Router();

router.get("/", auth, caseStudyController.getAll);
router.post("/", auth, caseStudyController.create);
router.put("/:id", auth, caseStudyController.update);
router.delete("/:id", auth, caseStudyController.remove);

export default router;
