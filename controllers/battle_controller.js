import { firebaseDB } from "../config/Firebase.js"
import { validateSession } from "./auth_controller.js"

import { createRequire } from "module"
const require = createRequire(import.meta.url)

const express = require('express')
const battle_router = express.Router()

battle_router.get("/:uid", validateSession, async function (req, res) {
    const { uid } = req.params;

    if (uid !== req.header('uid')) {
        return res.status(400).json({"error": "Invalid parameters."})
    }

    await firebaseDB.collection("battles").doc(uid).get()
    .then((document) => {
        return res.status(200)
            .json(document.data())
    })
    .catch(function (error) {
        console.log(error)
        return res.status(400).json({"error": "Unable to get battle data."})
    })
})

export { battle_router }