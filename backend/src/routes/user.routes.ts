import { Router } from "express";
import { getCurrentUser } from "../controllers/user.controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.js";

const router = Router();

router.get('/current-user', isLoggedIn, getCurrentUser);


export default router;
