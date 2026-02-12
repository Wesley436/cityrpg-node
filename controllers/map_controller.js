import { firebaseDB } from "../config/Firebase.js"
import { validateSession } from "./auth_controller.js"
import { Filter } from "firebase-admin/firestore"

import { createRequire } from "module"
const require = createRequire(import.meta.url)

const express = require('express')
const map_router = express.Router()

const RANGE = 500

function isInsideSquareMap(latitude, longitude, upperLatitude, lowerLatitude, upperLongitude, lowerLongitude) {
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
            if (((Date.now() - interactable.created_at) / 1000) > 60) {
                expiredInteractables.push(interactable)
            } else {
                interactables.push(interactable)
            }
        })

        const proximityInteractables = interactables.filter((interactable) => isInsideSquareMap(interactable.latitude, interactable.longitude, maxProximityLatitude, minProximityLatitude, maxProximityLongitude, minProximityLongitude));

        const collectionRef = firebaseDB.collection("interactables")
        if (expiredInteractables.length > 0) {
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

        if (proximityInteractables.length < 30) {
            const amountToGenerate = 30 - proximityInteractables.length

            const batch = firebaseDB.batch();

            for (let i = 0; i < amountToGenerate; i++) {
                const coordinate = getCoordinatesWithinCircle(current_latitude, current_longitude, RANGE)
                // console.log(coordinate)

                const docRef = collectionRef.doc()

                const chanceId = Math.floor(Math.random() * 100) + 1;
                var itemType = "item"
                switch (true) {
                    case chanceId < 25:
                        itemType = "event"
                        break;
                    case chanceId < 50:
                        itemType = "monster"
                        break;
                    case chanceId < 75:
                        itemType = "item"
                        break;
                    case chanceId < 100:
                        itemType = "equipment"
                        break;
                    default:
                        break;
                }
                
                batch.set(docRef, {
                    latitude: coordinate.latitude,
                    longitude: coordinate.longitude,
                    type: itemType,
                    created_at: Date.now()
                })
            }

            try {
                await batch.commit();
                console.log(`Created ${amountToGenerate} interactables`);
            } catch (error) {
                console.error('Error creating interactables: ', error);
            }
        }

        return res.status(200).json({"interactables": interactables})
    })
    .catch((error) => {
        console.log(error)
        return res.status(400).json({"error": "Unable to get interactables."})
    });
})

export { map_router }