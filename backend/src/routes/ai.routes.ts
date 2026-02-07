import { Router } from "express";
import { aiSuggest } from "../controllers/ai.controller.js";

const router = Router()

router.post('/help', aiSuggest)


export default router
