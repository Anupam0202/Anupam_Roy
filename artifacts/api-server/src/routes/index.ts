import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geminiRouter from "./gemini/index";
import contactRouter from "./contact";
import portfolioRouter from "./portfolio";

const router: IRouter = Router();

router.use(healthRouter);
router.use(portfolioRouter);
router.use(geminiRouter);
router.use(contactRouter);

export default router;
