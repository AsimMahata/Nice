import { Router } from "express";
import { compileCode, runCode } from "../controllers/cpp.controller.js";

const router = Router();

router.post('/compile', compileCode);
router.post('/run', runCode);


export default router;
