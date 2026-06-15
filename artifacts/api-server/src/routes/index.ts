import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geminiRouter from "./gemini/index";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(geminiRouter);
router.use(contactRouter);

export default router;
