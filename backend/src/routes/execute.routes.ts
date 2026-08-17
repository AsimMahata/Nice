import { Router } from 'express';
import { runCode } from '../controllers/execute.controller.js';

const router = Router();

router.post('/run', runCode);

export default router;
