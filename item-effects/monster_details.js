function createSlime(interactable) {
    interactable.title = "Slime"
    interactable.max_health = 100
    interactable.speed = 100
    interactable.delay = 150
    interactable.actions = []
}

function createWolf(interactable) {
    interactable.title = "Wolf"
    interactable.max_health = 200
    interactable.speed = 130
    interactable.delay = 150
    interactable.actions = []
}

function createBear(interactable) {
    interactable.title = "Bear"
    interactable.max_health = 300
    interactable.speed = 110
    interactable.delay = 150
    interactable.actions = []
}

export { createSlime, createWolf, createBear }