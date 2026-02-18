import { firebaseDB } from "../config/Firebase.js"
import { validateSession } from "./auth_controller.js"
import { Filter } from "firebase-admin/firestore"
import { arrayUnion } from "firebase/firestore";

import { createRequire } from "module"
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
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
                type: itemType,
                created_at: Date.now()
            }
            
            switch (true) {
                case interactableTypeChance == 1:
                    interactable.type = "event"
                    break;
                case interactableTypeChance == 2:
                    interactable.type = "monster"
                    break;
                case interactableTypeChance == 3:
                    interactable.type = "item"
                    var itemChance = Math.floor(Math.random() * 4) + 1;
                    switch (true) {
                        case itemChance == 1:
                            interactable.title = "Defense Potion"
                            break;
                        case itemChance == 2:
                            interactable.title = "Speed Potion"
                            break;
                        case itemChance == 3:
                            interactable.title = "Strength Potion"
                            break;
                        case itemChance == 4:
                            interactable.title = "Healing Potion"
                            break;
                        default:
                            break;
                    }
                    break;
                case interactableTypeChance == 4:
                    interactable.type = "equipment"
                    const equipmentChance = Math.floor(Math.random() * 10) + 1;
                    switch (true) {
                        case equipmentChance == 1:
                            interactable.title = "Helmet"
                            break;
                        case equipmentChance == 2:
                            interactable.title = "Chestplate"
                            break;
                        case equipmentChance == 3:
                            interactable.title = "Leggings"
                            break;
                        case equipmentChance == 4:
                            interactable.title = "Boots"
                            break;
                        case equipmentChance <= 6:
                            interactable.title = "Shield"
                            break;
                        case equipmentChance <= 8:
                            interactable.title = "Axe"
                            break;
                        case equipmentChance <= 10:
                            interactable.title = "Single Sword"
                            break;
                        default:
                            break;
                    }
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

    if (
        typeof interactable_id !== "string"
    ) {
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
            inventory.push(interactable.title)
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

export { map_router }