import { Router } from "express";
import { getCurrentUser, updateUser } from "../controllers/user.controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.js";

const router = Router();

router.get('/current-user', isLoggedIn, getCurrentUser);
router.patch('/update', isLoggedIn, updateUser);

export default router;
