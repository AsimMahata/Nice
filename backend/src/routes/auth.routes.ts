import { Router } from "express";
import { registerLocal, registerGoogle, registerGithub } from '../controllers/auth.controller.js';
import passport from "passport";

const router = Router();

router.post('/register', registerLocal);

router.get("/register/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback", 
    passport.authenticate("google", { failureRedirect: "/login" }), 
    registerGoogle
);

router.get("/register/github", passport.authenticate("github", { scope: ["user:email"] }));

router.get("/github/callback", 
    passport.authenticate("github", { failureRedirect: "/login" }), 
    registerGithub
);

export default router;