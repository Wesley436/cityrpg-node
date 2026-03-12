import { firebaseDB } from "../config/Firebase.js"
import { validateSession } from "./auth_controller.js"
import { Filter } from "firebase-admin/firestore"
import { DESCRIPTION_MAP, EQUIPMENT_STRENGTH_MAP, EQUIPMENT_DEFENSE_MAP, EQUIPMENT_SPEED_MAP, EQUIPMENT_ACTIONS_MAP } from "../item-effects/equipment_details.js"

import { createRequire } from "module"
import { createBear, createSlime } from "../item-effects/monster_details.js"
const require = createRequire(import.meta.url)

const express = require('express')
const map_router = express.Router()

const RANGE = 500
const INTERACTABLE_LIFETIME_SECOND = 3600
const PROXIMITY_INTERACTABLE_LIMIT = 50

function isInsideMapSquare(latitude, longitude, upperLatitude, lowerLatitude, upperLongitude, lowerLongitude) {
    return (
        (latitude >= lowerLatitude) && (latitude <= upperLatitude)
        && (longitude >= lowerLongitude) && (longitude <= upperLongitude)
    )
}

function getCoordinatesWithinCircle(lat, long, range) {
    const rangeInDegree = range/111111
    const distance = rangeInDegree * Math.sqrt(Math.random())
    const angle = 2 * Math.PI * Math.random()
    const latDelta = distance * Math.cos(angle)
    const longDelta = distance * Math.sin(angle)
    const compensatedLongDelta = longDelta / Math.cos(lat * Math.PI/180)

    const latitude = lat + latDelta
    const longitude = long + compensatedLongDelta

    return { latitude, longitude }
}

async function expireInteractables(expiredInteractables) {
    if (expiredInteractables.length > 0) {
        const collectionRef = firebaseDB.collection("interactables")
        const amountExpired = expiredInteractables.length
        const batch = firebaseDB.batch();
        expiredInteractables.forEach((interactable) => {
            batch.delete(collectionRef.doc(interactable.id))
        })
        
        try {
            await batch.commit();
            console.log(`${amountExpired} interactables expired`);
        } catch (error) {
            console.error('Error deleting interactables: ', error);
        }
    }
}

async function createInteractablesNearUser(proximityInteractables, latitude, longitude) {
    if (proximityInteractables.length < PROXIMITY_INTERACTABLE_LIMIT) {
        const collectionRef = firebaseDB.collection("interactables")
        const amountToGenerate = PROXIMITY_INTERACTABLE_LIMIT - proximityInteractables.length

        const batch = firebaseDB.batch();

        for (let i = 0; i < amountToGenerate; i++) {
            const coordinate = getCoordinatesWithinCircle(latitude, longitude, RANGE)
            // console.log(coordinate)

            const docRef = collectionRef.doc()

            var interactableTypeChance = Math.floor(Math.random() * 4) + 1;
            var itemType = "item"
            var interactable = {
                id: docRef.id,
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
                type: itemType,
                created_at: Date.now()
            }

            var rarityChance = Math.floor(Math.random() * 10) + 1;
            var rarity = "Common"
            switch (true) {
                case rarityChance < 4:
                    rarity = "Common"
                    break;
                case rarityChance < 7:
                    rarity = "Uncommon"
                    break;
                case rarityChance < 9:
                    rarity = "Rare"
                    break;
                case rarityChance < 10:
                    rarity = "Epic"
                    break;
            }
            
            switch (true) {
                case interactableTypeChance == 1:
                    interactable.type = "event"
                    break;
                case interactableTypeChance == 2:
                    interactable.type = "monster"
                    var monsterChance = Math.floor(Math.random() * 10) + 1;
                    switch (true) {
                        case monsterChance <= 6:
                            createSlime(interactable)
                            break;
                        case monsterChance <= 9:
                            createWolf(interactable)
                            break;
                        case monsterChance <= 10:
                            createBear(interactable)
                            break;
                        default:
                            break;
                    }
                    break;
                case interactableTypeChance == 3:
                    interactable.type = "item"
                    interactable.rarity = rarity
                    var itemChance = Math.floor(Math.random() * 4) + 1;
                    switch (true) {
                        case itemChance <= 6:
                            interactable.title = "Defense Potion"
                            break;
                        case itemChance == 9:
                            interactable.title = "Speed Potion"
                            break;
                        case itemChance == 10:
                            interactable.title = "Strength Potion"
                            break;
                        case itemChance == 4:
                            interactable.title = "Healing Potion"
                            break;
                        default:
                            break;
                    }

                    interactable.description = DESCRIPTION_MAP[interactable.title][interactable.rarity]
                    break;
                case interactableTypeChance == 4:
                    interactable.type = "equipment"
                    interactable.rarity = rarity
                    const equipmentChance = Math.floor(Math.random() * 9) + 1;
                    switch (true) {
                        case equipmentChance == 1:
                            interactable.title = "Helmet"
                            break;
                        case equipmentChance == 2:
                            interactable.title = "Chestplate"
                            interactable.defense = EQUIPMENT_DEFENSE_MAP[interactable.title][interactable.rarity]
                            break;
                        case equipmentChance == 3:
                            interactable.title = "Boots"
                            interactable.speed = EQUIPMENT_SPEED_MAP[interactable.title][interactable.rarity]
                            break;
                        case equipmentChance <= 5:
                            interactable.title = "Shield"
                            interactable.actions = EQUIPMENT_ACTIONS_MAP[interactable.title][interactable.rarity]
                            break;
                        case equipmentChance <= 7:
                            interactable.title = "Axe"
                            interactable.strength = EQUIPMENT_STRENGTH_MAP[interactable.title][interactable.rarity]
                            interactable.actions = EQUIPMENT_ACTIONS_MAP[interactable.title][interactable.rarity]
                            break;
                        case equipmentChance <= 9:
                            interactable.title = "Single Sword"
                            interactable.strength = EQUIPMENT_STRENGTH_MAP[interactable.title][interactable.rarity]
                            interactable.actions = EQUIPMENT_ACTIONS_MAP[interactable.title][interactable.rarity]
                            break;
                        default:
                            break;
                    }

                    interactable.description = DESCRIPTION_MAP[interactable.title][interactable.rarity]
                    break;
                default:
                    break;
            }
            
            batch.set(docRef, interactable)
        }

        try {
            await batch.commit();
            console.log(`Created ${amountToGenerate} interactables`);
        } catch (error) {
            console.error('Error creating interactables: ', error);
        }
    }
}

map_router.post("/load-region", validateSession, async function (req, res) {
    const {current_latitude, current_longitude, top_left_latitude, top_left_longitude, top_right_latitude, top_right_longitude, bottom_left_latitude, bottom_left_longitude, bottom_right_latitude, bottom_right_longitude} = req.body

    if (
        typeof current_latitude !== "number"
        || typeof current_longitude !== "number"
        || typeof top_left_latitude !== "number"
        || typeof top_left_longitude !== "number"
        || typeof top_right_latitude !== "number"
        || typeof top_right_longitude !== "number"
        || typeof bottom_left_latitude !== "number"
        || typeof bottom_left_longitude !== "number"
        || typeof bottom_right_latitude !== "number"
        || typeof bottom_right_longitude !== "number"
    ) {
        return res.status(400).json({"error": "Invalid parameters."})
    }

    const latitudeRange = RANGE/111111
    const longitudeRange = RANGE/(111111 * Math.cos((current_latitude * Math.PI/180)))

    // console.log("latitudeRange: " + latitudeRange)
    // console.log("longitudeRange: " + longitudeRange)

    const maxProximityLatitude = current_latitude + latitudeRange
    const minProximityLatitude = current_latitude - latitudeRange
    const maxProximityLongitude = current_longitude + longitudeRange
    const minProximityLongitude = current_longitude - longitudeRange

    // console.log("top_left_latitude: " + top_left_latitude)
    // console.log("bottom_right_latitude: " + bottom_right_latitude)
    // console.log("top_left_longitude: " + top_left_longitude)
    // console.log("bottom_right_longitude: " + bottom_right_longitude)

    await firebaseDB.collection("interactables")
    .where(Filter.or(
        Filter.and(
            Filter.where("latitude", "<=", top_left_latitude),
            Filter.where("latitude", ">=", bottom_right_latitude),
            Filter.where("longitude", ">=", top_left_longitude),
            Filter.where("longitude", "<=", bottom_right_longitude)
        ),
        Filter.and(
            Filter.where("latitude", "<=", maxProximityLatitude),
            Filter.where("latitude", ">=", minProximityLatitude),
            Filter.where("longitude", "<=", maxProximityLongitude),
            Filter.where("longitude", ">=", minProximityLongitude)
        )
    ))
    .get()
    .then(async (querySnapshot) => {
        const interactables = []
        const expiredInteractables = []
        querySnapshot.forEach((doc) => {
            const interactable = doc.data()
            interactable.id = doc.id
            if (((Date.now() - interactable.created_at) / 1000) > INTERACTABLE_LIFETIME_SECOND) {
                expiredInteractables.push(interactable)
            } else {
                interactables.push(interactable)
            }
        })

        const proximityInteractables = interactables.filter((interactable) => isInsideMapSquare(interactable.latitude, interactable.longitude, maxProximityLatitude, minProximityLatitude, maxProximityLongitude, minProximityLongitude));

        await expireInteractables(expiredInteractables)

        await createInteractablesNearUser(proximityInteractables, current_latitude, current_longitude)

        return res.status(200).json({"interactables": interactables})
    })
    .catch((error) => {
        console.log(error)
        return res.status(400).json({"error": "Unable to get interactables."})
    });
})

map_router.post("/pick-up", validateSession, async function (req, res) {
    const {interactable_id} = req.body

    if ( typeof interactable_id !== "string") {
        return res.status(400).json({"error": "Invalid parameters."})
    }

    const uid = req.header('uid')

    await firebaseDB.collection("interactables")
    .doc(interactable_id).get()
    .then(async (interactable_doc) => {
        const interactable = interactable_doc.data()
        await firebaseDB.collection("users").doc(uid).get()
        .then(async(user_doc) => {
            const user = user_doc.data()
            const inventory = user.inventory ? user.inventory : []
            inventory.push(JSON.stringify(interactable))
            await firebaseDB.collection("users").doc(uid).update({
                "inventory": inventory
            })

            await firebaseDB.collection("interactables").doc(interactable_id).delete()

            return res.status(200)
                .json(interactable)
        })
    })
    .catch(function (error) {
        console.log(error)
        return res.status(400).json({"error": "Unable to pick up item."})
    })
})

map_router.post("/start-battle", validateSession, async function (req, res) {
    const {interactable_id} = req.body

    if ( typeof interactable_id !== "string") {
        return res.status(400).json({"error": "Invalid parameters."})
    }

    const uid = req.header('uid')

    await firebaseDB.collection("interactables")
    .doc(interactable_id).get()
    .then(async (interactable_doc) => {
        const interactable = interactable_doc.data()

        if (interactable.type === "monster") {
            await firebaseDB.collection("battles").doc(uid).get()
            .then(async(battle_doc) => {
                if (battle_doc.exists) {
                    return res.status(400).json({"error": "Already in a battle."})
                }

                await firebaseDB.collection("users").doc(uid).get()
                .then(async(user_doc) => {
                    const user = user_doc.data()

                    const battle = {
                        "user": JSON.stringify(user),
                        "monster": JSON.stringify(interactable)
                    }
                    await firebaseDB.collection("battles").doc(uid).set(battle)

                    return res.status(200)
                        .json({
                            "user": user,
                            "monster": interactable
                        })
                })
            })
        } else {
            return res.status(400).json({"error": "Not a monster."})
        }
    })
    .catch(function (error) {
        console.log(error)
        return res.status(400).json({"error": "Unable to start battle."})
    })
})

export { map_router }