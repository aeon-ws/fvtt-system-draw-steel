// src/main.ts

import { HeroData } from "@hero/heroData";
import { EnemyData } from "@enemy/enemyData";
import { clearSquadHighlights, highlightSquad, MinionSquad } from "@minion/minionSquad";
import { IMinionData, MinionData } from "@minion/minionData";
import { HeroSheet } from "@hero/heroSheet";
import { EnemySheet } from "@enemy/enemySheet";
import { MinionSheet } from "@minion/minionSheet";
import { ObjectSheet } from "@object/objectSheet";
import { ActorToken } from "@actor/actorToken";
import { asEnemyToken, asMinionToken } from "@utils/tokenDocument";
import { isMinionActor } from "@utils/actor";
import { ActorTokenHud } from "@actor/actorTokenHud";
import { Effects } from "@actor/effects";
import { ObjectData } from "@object/objectData";
import { AbilityData } from "@actor/abilityData";
import "/styles.scss";

Hooks.once("init", async () => {
    console.log("Aeon-Draw-Steel | Initializing system");

    // Hook up the custom data models for all system-specific actor types.
    CONFIG.Actor.dataModels.enemy = EnemyData;
    CONFIG.Actor.dataModels.hero = HeroData;
    CONFIG.Actor.dataModels.minion = MinionData;
    CONFIG.Actor.dataModels.object = ObjectData;

    // Configure the system-specific stats that should be mapped to bar1 and bar2.
    CONFIG.Actor.trackableAttributes = {
        enemy: {
            bar: ["stamina"],
            value: []
        },
        hero: {
            bar: ["stamina"],
            value: ["heroicResource"]
        },
        minion: {
            bar: ["stamina"],
            value: []
        },
        object: {
            bar: ["stamina"],
            value: []
        }
    };

    // Hook up sheets for all system-specific actor types.
    const documentSheetConfig = foundry.applications.apps.DocumentSheetConfig;
    // @ts-ignore
    documentSheetConfig.registerSheet(Actor, "aeon-draw-steel", HeroSheet, {
        types: ["hero"],
        label: "Aeon Draw Steel: Hero Sheet",
        makeDefault: true
    });
    // @ts-ignore
    documentSheetConfig.registerSheet(Actor, "aeon-draw-steel", EnemySheet, {
        types: ["enemy"],
        label: "Aeon Draw Steel: Enemy Sheet",
        makeDefault: true
    });
    // @ts-ignore
    documentSheetConfig.registerSheet(Actor, "aeon-draw-steel", MinionSheet, {
        types: ["minion"],
        label: "Aeon Draw Steel: Minion Sheet",
        makeDefault: true
    });
    // @ts-ignore
    documentSheetConfig.registerSheet(Actor, "aeon-draw-steel", ObjectSheet, {
        types: ["object"],
        label: "Aeon Draw Steel: Object Sheet",
        makeDefault: true
    });

    // Hook up the system-specific token and token HUD classes.
    // @ts-ignore
    CONFIG.Token.hudClass = ActorTokenHud;
    CONFIG.Token.objectClass = ActorToken;
    CONFIG.statusEffects = Effects;
    CONFIG.Item.dataModels.enemyAbility = AbilityData;
    CONFIG.Item.dataModels.heroAbility = AbilityData;
    // CONFIG.Item.typeLabels = {
    //     enemyAbility: "Aeon Draw Steel: Enemy Ability",
    //     heroAbility: "Aeon Draw Steel: Hero Ability"
    // }
});

Hooks.once("ready", () => {
    console.log("Aeon-Draw-Steel | System ready");

    // canvas.tokens.placeables.forEach(token => {
    //     // Ensure the token has an actor (in rare cases it might not)
    //     if (token.document.actor) {
    //         console.log(token.document.actor.system);
    //     }
    // });
});

Hooks.on("preCreateToken", (document: TokenDocument, data: any, options: any, userId: string) => {
    console.log("on | preCreateToken | document:", document, "data:", data, "options:", options, "userId:", userId);
    if (data.actorLink) return;

    let staminaMax = foundry.utils.getProperty(data, "system.stamina.max");
    if (!staminaMax && document.actor?.system.stamina.max) {
        staminaMax = document.actor?.system.stamina.max;
    }

    if (typeof staminaMax === "number") {
        if (!data.system) data.system = {};
        if (!data.system.stamina) data.system.stamina = {};
        data.system.stamina.value = staminaMax;
    }
});

Hooks.on("createToken", async (tokenDocument: TokenDocument) => {
    console.log("on | createToken | tokenDocument", tokenDocument);
});

// This hook is used to update the squad of a minion when the token is deleted (i.e., squad membership
// should be updated and the stamina.max stat should be recalculated and both should be propagated to
// all remaining members of the squad).
Hooks.on("deleteToken", async (tokenDocument: TokenDocument, options: any, userId: any) => {
    console.log("on | deleteToken | Token deleted:", tokenDocument);

    const minion = asMinionToken(tokenDocument);
    if (minion) {
        console.log("on | deleteToken | Minion found, updating squad");
        const squad = new MinionSquad(minion.data);
        await squad.updateSquad()
    }

    const enemy = asEnemyToken(tokenDocument);
    if (enemy) {
        console.log("on | deleteToken | Enemy found");
        if (!enemy.data.squadId) return;
        if (!game.scenes || !game.scenes.active) return;

        console.log("on | deleteToken | Enemy captain found, removing captain from squad");
        const squadMinionTokenDocument = game.scenes.active.tokens.find(tokenDocument => {
            const currentMinion = asMinionToken(tokenDocument);
            if (!currentMinion) return false;

            const currentMinionSquadId = currentMinion.data.squadId;
            if (!currentMinion.id || !currentMinionSquadId) return false;

            return currentMinionSquadId === enemy.data.squadId;
        });

        if (!squadMinionTokenDocument) return;
        const minion = asMinionToken(squadMinionTokenDocument);
        if (!minion) return;
        const squad = await minion.getSquad();
        if (squad) {
            await squad.removeCaptain({ updateSquad: true });
        }
    }
});

Hooks.on("hoverToken", async (token: Token, hovered: boolean) => {
    const minionOrEnemy = asEnemyToken(token.document) || asMinionToken(token.document);
    if (minionOrEnemy) {
        if (hovered) {
            clearSquadHighlights();
            highlightSquad(token.scene, minionOrEnemy);
            return;
        }
    }

    clearSquadHighlights();
});

Hooks.on("createActor", async (actor: Actor) => {
    if (actor) {
        console.log("on | createActor | actor", actor);

        // @ts-ignore
        const maxStamina = actor?.system.stamina?.max ?? 0;
        await actor.update({
            // @ts-ignore
            "system.stamina.value": maxStamina,
            "system.stamina.perMinion": maxStamina,
            "prototypeToken.actor.system.stamina.value": maxStamina,
            "prototypeToken.actor.system.stamina.perMinion": maxStamina,
            "prototypeToken.system.stamina.value": maxStamina,
            "prototypeToken.system.stamina.perMinion": maxStamina,
            "prototypeToken.displayName": 30,
            "prototypeToken.displayBars": 50,
            "prototypeToken.bar1.attribute": "stamina",
            "prototypeToken.bar2.attribute": "heroicResource",
            "lockRotation": true,
        });
    }
});

// This hook is used to override normal stamina.value modifications for specifically minions to ensure that
// each minion in a given squad always has the same stamina.value.  This is done because minions in Draw
// Steel conceptually don't have individual stamina values but instead track their stamina collectively at
// the minion squad level.  However, on a technical level, each minion token actor in Foundry has its own 
// stamina.value; this hook merely ensures that any changes to stamina.value for a given minion token actor
// are propagated to all minion token actors with the same squadId.
Hooks.on("preUpdateActor", async (actor: Actor, updateData: any, options: any, userId: any): Promise<void> => {
    if (isMinionActor(actor)) {
        if (foundry.utils.hasProperty(updateData, "system.squadId")) {
            // console.log("preUpdateToken | Minion | Squad | NoOp");
            // Update is part of a squad update, so no need to do anything further; synchronization will be
            // handled by the squad class.
        }
        else {
            if (foundry.utils.hasProperty(updateData, "system.stamina.value")) {
                // console.log("preUpdateToken | Minion | Non-Squad | Stamina update");
                // Update is *not* part of a squad update and involves changes to stamina.value, so we have
                // to propate the change to all minions in squad.

                // First we get the updated stamina value from the updateData object.
                const updatedStamina = foundry.utils.getProperty(updateData, "system.stamina.value");

                // Then we cancel the stamina update via the ordinary workflow by removing the relevant
                // properties from the updateData object.
                delete updateData.system.stamina.value;
                if (Object.keys(updateData.system.stamina).length === 0) {
                    delete updateData.system.stamina;
                }
                if (Object.keys(updateData.system).length === 0) {
                    delete updateData.system;
                }

                // Now we retrieve the context minion, get the squad associated with the context minion, and
                // update the stamina of all minions in the squad.
                const minionData = actor.system as unknown as IMinionData;
                const squad = new MinionSquad(minionData);
                const minionCasualtyCount =
                    Math.floor((minionData.stamina.value - 1) / minionData.stamina.perMinion + 1)
                    - Math.floor((updatedStamina - 1) / minionData.stamina.perMinion + 1);
                console.log("preUpdateToken | Minion | Non-Squad | Stamina update | minionCasualtyCount:", minionCasualtyCount);
                if (minionCasualtyCount > 0) {
                    ui.notifications?.notify(`${minionCasualtyCount} minion${minionCasualtyCount > 1 ? "s have" : " has"} been ruthlessly slain!  Please remove ${minionCasualtyCount} minion token${minionCasualtyCount > 1 ? "s" : ""} from the scene.`);
                }
                await squad.setSquadStaminaValue(updatedStamina);
            }
        }
    }
});
