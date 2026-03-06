import { FieldValue } from "firebase-admin/firestore"
import { firebaseDB } from "../config/Firebase.js"
import { validateSession } from "./auth_controller.js"

import { createRequire } from "module"
import { useDefensePotion, useSpeedPotion, useStrengthPotion } from "../item-effects/potion_effects.js"
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

async function unequipItem(docRef, user, slot) {
    const field = {}
    field[slot] = FieldValue.delete()
    await docRef.update(field)
    delete user[slot]
}

user_router.post("/discard-item", validateSession, async function (req, res) {
    const {item_id} = req.body

    if ( typeof item_id !== "string") {
        return res.status(400).json({"error": "Invalid parameters."})
    }

    const uid = req.header('uid')

    const docRef = firebaseDB.collection("users").doc(uid)
    await docRef.get()
    .then(async(user_doc) => {
        var user = user_doc.data()

        for (const key of ["helmet", "chestplate", "boots", "weapon", "shield"]) {
            if (user[key]) {
                var equipment = JSON.parse(user[key])
                if (item_id == equipment.id) {
                    await unequipItem(docRef, user, key)
                }
            }
        }

        var inventory = user.inventory ? user.inventory : []

        inventory = inventory.filter(i => !i.includes(item_id))
        await docRef.update({
            "inventory": inventory
        })

        user.inventory = inventory
        
        return res.status(200).json(user)
    })
})

user_router.post("/use-item", validateSession, async function (req, res) {
    const {item_id} = req.body

    if ( typeof item_id !== "string") {
        return res.status(400).json({"error": "Invalid parameters."})
    }

    const uid = req.header('uid')

    const docRef = firebaseDB.collection("users").doc(uid)
    await docRef.get()
    .then(async(user_doc) => {
        var user = user_doc.data()

        if (["helmet", "chestplate", "boots", "weapon", "shield"].includes(item_id)) {
            const field = {}
            field[item_id] = FieldValue.delete()
            await docRef.update(field)
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
                        var status_effects = user.status_effects ? user.status_effects : {}
                        var health = JSON.parse(user.health)
                        switch (item.title) {
                            case "Defense Potion":
                                useDefensePotion(status_effects, item)
                                break;
                            case "Speed Potion":
                                useSpeedPotion(status_effects, item)
                                break;
                            case "Strength Potion":
                                useStrengthPotion(status_effects, item)
                                break;
                            case "Healing Potion":
                                var healAmount = 0
                                switch (item.rarity) {
                                    case "Common":
                                        healAmount = 10
                                        break;
                                    case "Uncommon":
                                        healAmount = 20
                                        break;
                                    case "Rare":
                                        healAmount = 30
                                        break;
                                    case "Epic":
                                        healAmount = 50
                                        break;
                                }

                                health.current = Math.min(health.currentMax, health.current + healAmount)
                                break;
                            default:
                                break;
                        }


                        inventory = inventory.filter(i => !i.includes(item_id))
                        await docRef.update({
                            "health": JSON.stringify(health),
                            "status_effects": status_effects,
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
                            case "Axe":
                            case "Single Sword":
                                key = "weapon"
                                break
                            default:
                        }
                        
                        const field = {}
                        const equipmentString = JSON.stringify(item)
                        field[key] = equipmentString
                        await docRef.update(field)

                        user[key] = equipmentString
                        break
                    default:
                }
            }
        }
        
        return res.status(200).json(user)
    })
})

user_router.post("/update-stats", validateSession, async function (req, res) {
    const {health, strength, defense, speed} = req.body

    const uid = req.header('uid')

    const docRef = firebaseDB.collection("users").doc(uid)
    await docRef.get()
    .then(async(user_doc) => {
        var user = user_doc.data()
        await docRef.update({
            health: JSON.stringify(health),
            strength: JSON.stringify(strength),
            defense: JSON.stringify(defense),
            speed: JSON.stringify(speed)
        })

        return res.status(200).json(user)
    })
})

export { user_router }