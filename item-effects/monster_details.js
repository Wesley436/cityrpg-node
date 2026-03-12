const TACKLE = {
    name: "Tackle",
    action_id: 3,
    base_damage: 20,
    base_cooldown: 60,
}

const BITE = {
    name: "Bite",
    action_id: 4,
    base_damage: 40,
    base_cooldown: 90,
}

function createSlime(interactable) {
    interactable.title = "Slime"
    interactable.max_health = 100
    interactable.strength = 100
    interactable.speed = 50
    interactable.delay = 50
    interactable.actions = [TACKLE]
}

function createWolf(interactable) {
    interactable.title = "Wolf"
    interactable.max_health = 200
    interactable.strength = 110
    interactable.speed = 65
    interactable.delay = 50
    interactable.actions = [TACKLE, BITE]
}

function createBear(interactable) {
    interactable.title = "Bear"
    interactable.max_health = 300
    interactable.strength = 160
    interactable.speed = 40
    interactable.delay = 50
    interactable.actions = [TACKLE, BITE]
}

export { createSlime, createWolf, createBear }