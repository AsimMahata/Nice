import { Router } from "express";
import {
  registerLocal,
  registerGoogle,
  registerGithub,
  loginLocal,
  logoutUser,
  loginWithToken,
  startDesktopGoogleAuth,
  startDesktopGithubAuth
} from "../controllers/auth.controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.js";
import passport from "passport";

const router = Router();

router.route("/login").post(loginLocal);

router.route("/logout").post(isLoggedIn, logoutUser);

router.post("/register", registerLocal);

router.post("/login-token", loginWithToken);

router.get(
  "/register/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/desktop/google",
  startDesktopGoogleAuth,
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
  }),
  registerGoogle,
);

router.get(
  "/register/github",
  passport.authenticate("github", { scope: ["user:email"] }),
);

router.get(
  "/desktop/github",
  startDesktopGithubAuth,
  passport.authenticate("github", { scope: ["user:email"] }),
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
  }),
  registerGithub,
);

export default router;
