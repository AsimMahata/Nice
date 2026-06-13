import express from "express";
import { isLoggedIn } from "../middlewares/isLoggedIn.js";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";

const router = express.Router();

router.get("/", isLoggedIn, getSettings);
router.post("/", isLoggedIn, updateSettings);

export default router;
