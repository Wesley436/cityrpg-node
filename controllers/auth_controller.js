import { firebaseAuth } from "../config/Firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const express = require('express');
const auth_router = express.Router();

auth_router.post("/register", async function (req, res) {
    const {email, password} = req.body

    try {
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        console.log(`User Created Successfully: ${userCredential.user.uid}`);
    } catch (error) {
        console.log(error);
    }
    return res.status(200).json({});
});


auth_router.post("/login", async function (req, res) {
});

auth_router.get("/logout", function (req, res) {
});

export { auth_router };