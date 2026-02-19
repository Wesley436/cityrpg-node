import { FieldValue } from "firebase-admin/firestore"
import { firebaseDB } from "../config/Firebase.js"
import { validateSession } from "./auth_controller.js"

import { createRequire } from "module"
const require = createRequire(import.meta.url)

const express = require('express')
const user_router = express.Router()

user_router.get("/:uid", validateSession, async function (req, res) {
    const { uid } = req.params;

    if (uid !== req.header('uid')) {
        return res.status(400).json({"error": "Invalid parameters."})
    }

    await firebaseDB.collection("users").doc(uid).get()
    .then((document) => {
        return res.status(200)
            .json(document.data())
    })
    .catch(function (error) {
        console.log(error)
        return res.status(400).json({"error": "Unable to get user data."})
    })
})

user_router.post("/use-item", validateSession, async function (req, res) {
    const {item_id} = req.body

    if ( typeof item_id !== "string") {
        return res.status(400).json({"error": "Invalid parameters."})
    }

    const uid = req.header('uid')

    await firebaseDB.collection("users").doc(uid).get()
    .then(async(user_doc) => {
        var user = user_doc.data()

        if (["helmet", "chestplate", "boots", "weapon", "shield"].includes(item_id)) {
            const field = {}
            field[item_id] = FieldValue.delete()
            await firebaseDB.collection("users").doc(uid).update(field)
            delete user[item_id]
        } else {
            var inventory = user.inventory ? user.inventory : []

            if (!inventory) {
                return res.status(400).json({"error": "Item does not exist."})
            } else {
                var item = null
                inventory.some(i => {
                    if (i.includes(item_id)) {
                        item = JSON.parse(i)
                        return true
                    }
                    return false
                });

                if (!item) {
                    return res.status(400).json({"error": "Item does not exist."})
                }

                // console.log(item)

                switch (item.type) {
                    case "item":
                        inventory = inventory.filter(i => !i.includes(item_id))
                        await firebaseDB.collection("users").doc(uid).update({
                            "inventory": inventory
                        })

                        user.inventory = inventory
                        break
                    case "equipment":
                        var key = ""
                        switch (item.title) {
                            case "Helmet":
                                key = "helmet"
                                break
                            case "Chestplate":
                                key = "chestplate"
                                break
                            case "Boots":
                                key = "boots"
                                break
                            case "Shield":
                                key = "shield"
                                break
                            case "Axe", "Single Sword":
                                key = "weapon"
                                break
                            default:
                        }
                        
                        const field = {}
                        field[key] = item.title
                        await firebaseDB.collection("users").doc(uid).update(field)

                        user[key] = item.title
                        break
                    default:
                }
            }
        }
        
        return res.status(200).json(user)
    })
})

export { user_router }