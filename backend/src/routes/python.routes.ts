import { Router } from "express";
import { runCode } from "../controllers/python.controller.js";


const router = Router();

// router.post('/compile', compileCode); // python doesn't really compile
router.post('/run', runCode);


export default router;
