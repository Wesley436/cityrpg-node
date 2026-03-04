const useDefensePotion = (status_effects, defense_potion) => {
    var amount = 0
    switch (defense_potion.rarity) {
        case "Common":
            amount = 10
            break;
        case "Uncommon":
            amount = 20
            break;
        case "Rare":
            amount = 30
            break;
        case "Epic":
            amount = 50
            break;
    }
    status_effects.defense_potion = {
        type: "defense",
        amount: amount
    }
}

const useStrengthPotion = (status_effects, strength_potion) => {
    var amount = 0
    switch (strength_potion.rarity) {
        case "Common":
            amount = 5
            break;
        case "Uncommon":
            amount = 10
            break;
        case "Rare":
            amount = 15
            break;
        case "Epic":
            amount = 20
            break;
    }
    status_effects.strength_potion = {
        type: "strength",
        amount: amount
    }
}

const useSpeedPotion = (status_effects, speed_potion) => {
    var amount = 0
    switch (speed_potion.rarity) {
        case "Common":
            amount = 10
            break;
        case "Uncommon":
            amount = 20
            break;
        case "Rare":
            amount = 30
            break;
        case "Epic":
            amount = 40
            break;
    }
    status_effects.speed_potion = {
        type: "speed",
        amount: amount
    }
}

export {useDefensePotion, useStrengthPotion, useSpeedPotion}