import { admin, firebaseAuth, firebaseDB } from "../config/Firebase.js"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail  } from 'firebase/auth'
import { firebaseConfig } from "../config/FirebaseConfig.js"

import { createRequire } from "module"
const require = createRequire(import.meta.url)

const express = require('express')
const axios = require('axios').default
const auth_router = express.Router()
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

function validateSession(req, res, next) {
    const id_token = req.header('Authorization')?.replace('Bearer', '').trim()
    const uid = req.header('uid')

    if (!id_token || !uid) {
        return res.status(401).json({"error": "Session invalid."})
    }

    admin.auth().verifyIdToken(id_token)
    .then(function (decodedToken) {
        if(decodedToken.uid === uid){
            return next()
        } else {
            return res.status(401).json({"error": "Session invalid."})
        }
    }).catch(function () {
        return res.status(401).json({"error": "Session invalid."})
    })
}

auth_router.post("/refresh-token", async function (req, res) {
    const { uid, refresh_token } = req.body

    if (typeof refresh_token !== "string") {
        return res.status(400).json({"error": "Invalid parameters."})
    }

    await axios.post("https://securetoken.googleapis.com/v1/token?key=" + firebaseConfig.apiKey, {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    })
    .then(function (response) {
        const id_token = response.data.id_token
        admin.auth().verifyIdToken(id_token)
        .then(function (decodedToken) {
            if(decodedToken.uid === uid){
                return res.status(200)
                    .setHeader("uid", uid)
                    .setHeader("id_token", id_token)
                    .setHeader("refresh_token", refresh_token)
                    .json({ "success": "Token refreshed",})
            } else {
                return res.status(400).json({"error": "Unable to refresh token."})
            }
        }).catch(function () {
            return res.status(400).json({"error": "Unable to refresh token."})
        })
    })
    .catch(function (error) {
        console.log(error)
        return res.status(400).json({"error": "Unable to refresh token."})
    })
})

auth_router.post("/register", async function (req, res) {
    const {email, password, confirm_password} = req.body

    if (typeof email !== "string" || typeof password !== "string" || typeof confirm_password !== "string") {
        return res.status(400).json({"error": "Invalid parameters."})
    }

    if (!email || !password || !confirm_password || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({"error": "Invalid email or password."})
    }

    if (password !== confirm_password) {
        return res.status(400).json({"error": "The two passwords are not the same."})
    }

    try {
        await createUserWithEmailAndPassword(firebaseAuth, email, password)
        .then(async (result) => {
            await firebaseDB.collection("users").doc(result.user.uid).set({
                uid: result.user.uid,
                email: email
            })
            
            return res.status(200)
                // .setHeader("uid", result.user.uid)
                // .setHeader("id_token", result.user.accessToken)
                // .setHeader("refresh_token", result.user.refreshToken)
                .json({"success": "User Created Successfully"})
        })
    } catch (error) {
        switch (error.code) {
            case "auth/weak-password":
                return res.status(400).json({"error": "Password must be 6 characters or longer."})
            case "auth/email-already-in-use":
                return res.status(400).json({"error": "Email already exists."})
            default:
                console.log(error)
                return res.status(400).json({"error": "Unable to create account."})
        }
    }
})

auth_router.post("/login", async function (req, res) {
    const {email, password} = req.body

    if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({"error": "Invalid parameters."})
    }

    if (!email || !password || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({"error": "Invalid email or password."})
    }

    try {
        await signInWithEmailAndPassword(firebaseAuth, email, password)
        .then((result) => {
            return res.status(200)
                .setHeader("uid", result.user.uid)
                .setHeader("id_token", result.user.accessToken)
                .setHeader("refresh_token", result.user.refreshToken)
                .json({"success": "Login success."})
        })
    } catch (error) {
        switch (error.code) {
            case "auth/invalid-credential":
                return res.status(400).json({"error": "Incorrect email or password."})
            default:
                console.log(error)
                return res.status(400).json({"error": "Login failed."})
        }
    }
})

auth_router.post("/forget-password", async function (req, res) {
    const {email} = req.body

    if (typeof email !== "string") {
        return res.status(400).json({"error": "Invalid parameters."})
    }

    if (!email) {
        return res.status(400).json({"error": "Empty email or password."})
    }

    try {
        await sendPasswordResetEmail(firebaseAuth, email)
        .then(() => {
            return res.status(200)
                .json({"success": "Reset password email sent."})
        })
    } catch (error) {
        switch (error.code) {
            default:
                console.log(error)
                return res.status(400).json({"error": "Failed to send reset password email."})
        }
    }
})

export { auth_router, validateSession }