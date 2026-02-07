import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from "passport-google-oauth20";
import { Strategy as GithubStrategy, Profile as GithubProfile } from "passport-github2";
import { User, IUser } from "../models/user.model.js";

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

passport.use(new LocalStrategy(
    {
        usernameField: "email",
        passwordField: "password",
    },
    async (email, password, done) => {
        try {
            const user = await User.findOne({ email, provider: "Local" });

            if (!user) {
                return done(null, false, { message: "User not found" });
            }

            const isValid = await user.isPasswordCorrect(password);

            if (!isValid) {
                return done(null, false, { message: "Incorrect Password" });
            }

            return done(null, user); 
        } catch (error) {
            return done(error);
        }
    }
));

passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID!, 
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: `${process.env.API_URL}/auth/google/callback`, 
    },
    async (
        _accessToken: string, 
        _refreshToken: string, 
        profile: GoogleProfile, 
        done: (error: any, user?: any) => void
    ) => {
        try {
            let user = await User.findOne({
                provider: 'Google',
                providerId: profile.id,
            });

            if (!user) {
                user = await User.create({
                    name: profile.displayName,
                    email: profile.emails?.[0]?.value,
                    username: profile.emails?.[0]?.value.split('@')[0],
                    provider: 'Google',
                    providerId: profile.id,
                });
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

passport.use(new GithubStrategy(
    {
        clientID: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!, 
        callbackURL: `${process.env.API_URL}/auth/github/callback`,
    },
    async (
        _accessToken: string, 
        _refreshToken: string, 
        profile: GithubProfile, 
        done: (error: any, user?: any) => void
    ) => {
        try {
            let user = await User.findOne({
                provider: 'Github',
                providerId: profile.id,
            });

            if (!user) {
                user = await User.create({
                    name: profile.displayName || profile.username,
                    email: profile.emails?.[0]?.value,
                    username: profile.username,
                    provider: 'Github',
                    providerId: profile.id,
                });
            }

            return done(null, user); 
        } catch (error) {
            return done(error);
        }
    }
));