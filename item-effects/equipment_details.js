const DESCRIPTION_MAP = {
    "Defense Potion": {
        "Common": "Increase DEFENSE by 10 for next battle",
        "Uncommon": "Increase DEFENSE by 20 for next battle",
        "Rare": "Increase DEFENSE by 30 for next battle",
        "Epic": "Increase DEFENSE by 50 for next battle",
    },
    "Speed Potion": {
        "Common": "Increase SPEED by 10 for next battle",
        "Uncommon": "Increase SPEED by 20 for next battle",
        "Rare": "Increase SPEED by 30 for next battle",
        "Epic": "Increase SPEED by 40 for next battle",
    },
    "Strength Potion": {
        "Common": "Increase STRENGTH by 5 for next battle",
        "Uncommon": "Increase STRENGTH by 10 for next battle",
        "Rare": "Increase STRENGTH by 15 for next battle",
        "Epic": "Increase STRENGTH by 20 for next battle",
    },
    "Healing Potion": {
        "Common": "Restore 10 HEALTH",
        "Uncommon": "Restore 20 HEALTH",
        "Rare": "Restore 30 HEALTH",
        "Epic": "Restore 50 HEALTH",
    },
    "Helmet": {
        "Common": "Increase interaction range by 50m",
        "Uncommon": "Increase interaction range by 100m",
        "Rare": "Increase interaction range by 150m",
        "Epic": "Increase interaction range by 200m",
    },
    "Chestplate": {
        "Common": "Increase DENFENSE by 5",
        "Uncommon": "Increase DENFENSE by 10",
        "Rare": "Increase DENFENSE by 15",
        "Epic": "Increase DENFENSE by 20",
    },
    "Boots": {
        "Common": "Increase SPEED by 5",
        "Uncommon": "Increase SPEED by 10",
        "Rare": "Increase SPEED by 15",
        "Epic": "Increase SPEED by 20",
    },
    "Shield": {
        "Common": "",
        "Uncommon": "",
        "Rare": "",
        "Epic": "",
    },
    "Axe": {
        "Common": "Increase STRENGTH by 10",
        "Uncommon": "Increase STRENGTH by 15",
        "Rare": "Increase STRENGTH by 20",
        "Epic": "Increase STRENGTH by 25",
    },
    "Single Sword": {
        "Common": "Increase STRENGTH by 5",
        "Uncommon": "Increase STRENGTH by 10",
        "Rare": "Increase STRENGTH by 15",
        "Epic": "Increase STRENGTH by 20",
    },
}

const EQUIPMENT_STRENGTH_MAP = {
    "Axe": {
        "Common": 10,
        "Uncommon": 15,
        "Rare": 20,
        "Epic": 25,
    },
    "Single Sword": {
        "Common": 5,
        "Uncommon": 10,
        "Rare": 15,
        "Epic": 20,
    }
}

const EQUIPMENT_DEFENSE_MAP = {
    "Chestplate": {
        "Common": 5,
        "Uncommon": 10,
        "Rare": 15,
        "Epic": 20,
    }
}

const EQUIPMENT_SPEED_MAP = {
    "Boots": {
        "Common": 5,
        "Uncommon": 10,
        "Rare": 15,
        "Epic": 20,
    }
}

const LIGHT_STRIKE = {
    name: "Light Strike",
    action_id: 1,
    base_damage: 20,
    base_cooldown: 50,
}

const HEAVY_STRIKE = {
    name: "Heavy Strike",
    action_id: 2,
    base_damage: 30,
    base_cooldown: 80
}

const EQUIPMENT_ACTIONS_MAP = {
    "Shield": {
        "Common": [],
        "Uncommon": [],
        "Rare": [],
        "Epic": [],
    },
    "Axe": {
        "Common": [LIGHT_STRIKE, HEAVY_STRIKE],
        "Uncommon": [LIGHT_STRIKE, HEAVY_STRIKE],
        "Rare": [LIGHT_STRIKE, HEAVY_STRIKE],
        "Epic": [LIGHT_STRIKE, HEAVY_STRIKE],
    },
    "Single Sword": {
        "Common": [LIGHT_STRIKE, HEAVY_STRIKE],
        "Uncommon": [LIGHT_STRIKE, HEAVY_STRIKE],
        "Rare": [LIGHT_STRIKE, HEAVY_STRIKE],
        "Epic": [LIGHT_STRIKE, HEAVY_STRIKE],
    }
}

export { DESCRIPTION_MAP, EQUIPMENT_STRENGTH_MAP, EQUIPMENT_DEFENSE_MAP, EQUIPMENT_SPEED_MAP, EQUIPMENT_ACTIONS_MAP }