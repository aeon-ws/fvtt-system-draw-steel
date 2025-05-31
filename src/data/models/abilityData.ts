// src/data/models/abilityData.ts

import { ItemData, IItemData } from "@data/itemData";
import { IHeroData } from "./heroData";
import { IEnemyData } from "./enemyData";
import { IMinionData } from "./minionData";
import { IObjectData } from "./objectData";
import { CreatureData, IWeaknessData } from "./creatureData";

export type AbilityKeyword = ["Area", "Charge", "Magic", "Melee", "Psionic", "Ranged", "Strike", "Weapon"];
export type AbilityType = "mainAction" | "freeAction" | "freeManeuver" | "freeTriggeredAction" | "maneuver" | "triggeredAction";
export type CharacteristicType = "might" | "agility" | "reason" | "intuition" | "presence";

export interface IAbilityData extends IItemData {
    // If enemy ability, derived property equal to creature level during import, but stored as individual
    // property on Foundry ability item for consistency with hero abilities.
    // If hero ability, property equal to value of game text level-related section header and/or sub-header.
    // Inconsistently used in game text, but generally follows patters similar to the following examples:
    //     ("2ND-LEVEL FEATURES" > "2ND-LEVEL COLLEGE ABILITY") => 2
    //     ("5TH-LEVEL FEATURES" > "9-DRAMA ABILITIES") => 5
    //     ("9TH-LEVEL FEATURES" > "9TH-LEVEL DOMAIN ABILITIES") => 9
    //     ("1ST-LEVEL FEATURES" > "CENSOR ABILITIES") => 1
    level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    // The game text flavor description of the ability.  In the game text, it appears just below the name and
    // cost of the ability and just above the game text "keywords" section.
    description: string;
    // Value of the game term "keywords" in the ability game text.
    keywords: AbilityKeyword[];
    // [type property value] to [rules term] map:
    //     mainAction: action
    //     freeAction: free action | no action
    //     freeManeuver: free maneuver
    //     freeTriggeredAction: free triggered action
    //     maneuver: maneuver
    //     triggeredAction: triggered action
    type: AbilityType;
    // The malice cost of the ability or 0 (if it does not cost malice).
    //     If rules terms include "action" && "signature", then property maliceCost = 0,
    //     If property type == "mainAction" && property maliceCost == 0, then the ability is a signature
    //         ability (not used here, but will be used in display logic).
    maliceCost: number;
    // The distance of the ability, 
    distance: {
        self: boolean,
        melee: number,
        ranged: number,
        burst: number,
        cube: {
            size: number,
            within: number
        },
        line: {
            width: number,
            length: number,
            within: number
        },
    };
    // How many and which targets the ability can/will affect.  This is a complex property with many different game text permutations,
    // idiosyncrasies, redundancies, and exceptions.  The following are some examples:
    //     "One creature" => { displayValue: <game text>, count: 1, filter: (system) => { return system.actorType === "enemy" || system.actorType === "hero" || system.actorType === "minion"; } }
    //         Here, the filter is used to determine which tokens/actors are creatures (i.e., enemies, heroes, and minions).
    //     "Self and each ally in the area" => { displayValue: <game text>, count: "all", filter: (system) => { return system.actorType === "hero"; } }
    //         Here, the filter is used to determine which tokens/actors are allies or self.  The area is
    //         determined by the ability distance, so the game text "in area" is redundant/always implied.
    target: IAbilityTargetData;
    // For abilities of type == "triggeredAction" or "freeTriggeredAction", equal to the game text "trigger" section.
    trigger: string;
    // The contents of the game text "effect" section when it appears *before/above* the power roll in the
    // layout.
    prePowerRollEffect: IEffectData | null;
    powerRoll: {
        // The list of characteristics from one of which the power roll bonus is derived.  The actual
        // characteristic used will always be the highest of the hero in question.  Must always be set for
        // hero abilities.  Not relevant for enemy and minion abilities, for whom the power roll bonus has
        // already been calculated.
        //     Examples:
        //         "Clobber and Clutch (Action) ◆ 2d10 + 2 ◆ Signature" => characteristic = null (this is an enemy ability where "2d10 + 2" is the power roll including the bonus, so no characteristic is specified),
        //         "Power Roll + Might" => characteristic = might (this is a hero ability where the bonus will be calculated dynamically).
        //         "2d10 + Agility" => characteristic = agility (this is a hero ability where the bonus will be calculated dynamically).
        characteristic: CharacteristicType[] | null;
        // The power roll bonus, which is always derived from the hero's characteristics.  For enemy and
        // minion abilities, this is the power roll bonus that is stated in the game text and *should* be
        // imported.
        //     Examples:
        //         "Clobber and Clutch (Action) ◆ 2d10 + 2 ◆ Signature" => bonus = 2 (this is an enemy ability where "2d10 + 2" is the power roll including the bonus),
        //         "Power Roll + Might" => bonus = system.characteristics.might (this is a hero ability where the bonus will be calculated dynamically).
        //         "2d10 + Agility" => bonus = system.characteristics.agility (this is a hero ability where the bonus will be calculated dynamically).
        bonus: number;
        tier1: IPowerRollTierData,
        tier2: IPowerRollTierData,
        tier3: IPowerRollTierData
    }
    // The contents of the game text "effect" section when it appears *after/below* the power roll in the
    // layout.
    postPowerRollEffect: IEffectData | null;
}

export interface IAbilityTargetData {
    filter: ((system: IEnemyData | IHeroData | IMinionData | IObjectData) => boolean) | null;
    displayValue: string;
    count: number | "all";
}

export interface IPowerRollTierData {
    // The damage before characteristic bonus is applied.  This is the value that is stated in the game text
    // for hero abilities.  It doesn't appear in the game text for enemy and minion abilities and isn't
    // relevant since it has already been factored into the damage value.
    baseDamage: number | null;
    // The list of characteristics from one of which the damage is derived.  The actual characteristic used
    // will always be the highest of the hero in question.  Must always be set for hero abilities.  Not
    // relevant for enemy and minion abilities, since the characteristic damage bonus already been added into
    // the damage value.
    damageBonusCharacteristic: CharacteristicType[] | null;
    // The damage value that is stated in the game text for enemy and minion abilities.  For hero abilities,
    // this is the damage value that is calculated dynamically and should never be imported.
    damage: number | null;
    effect: IEffectData | null;
    potencyEffect: IPotencyEffectData | null;
}

export interface IEffectData {
    // The effect as shown in the game text.
    //     Examples:
    //         "slowed (EoT)",
    //         "frightened (save ends)",
    //         "bleeding and weakened (save ends)",
    text: string;
    // The target(s) the effect.  Impossible to resolve during import, so should just be left empty.
    targets: string;
    // The game text effect duration.
    duration: "endOfTargetTurn" | "saveEnds" | "endOfEncounter";
    // The mechanical conditions derived from the game text.
    slowed: boolean;
    weakened: boolean;
    frightened: boolean;
    bleeding: boolean;
    grabbed: boolean;
    taunted: boolean;
    restrained: boolean;
    weakness: IWeaknessData | null;
}

// In the game text, this interface represents the general 
// "<characteristicFirstLetter> < [weak] | [average] | [strong] <effect>" pattern.
// This is a complex property with many different game text permutations, idiosyncrasies, redundancies, and
// exceptions.  Sometimes the square brackets around the potency tier are omitted, sometimes excess verbiage
// is included (e.g., "if the target has P < weak" could have been written as "P < [weak]", "M < average, the
// target has fire weakness 5 (save ends)" could have been shortened to "M < [average] fire weakness 5 (save ends)").
//     Examples:
//         M < [weak] slowed (EoT),
//         A < [average] frightened (save ends),
//         if the target has P < weak, each enemy within 2 squares of them is frightened of you (save ends),
//         M < average, bleeding and weakened (save ends)
export interface IPotencyEffectData {
    // The tier of the potency effect, which is only relevant for hero abilities.  For enemy and minion
    // abilities, potency tier and characteristic have already been translated into potency value, which is
    // all that is ever stated in the game text.
    tier: "weak" | "average" | "strong";
    // The characteristic that the potency tier is based on, e.g., "might", "agility", "reason", "intuition",
    // or "presence".  Only relevant if the potency tier is based on a characteristic, which is only the
    // case for hero abilities, and even then, there are exceptions.
    characteristic: "might" | "agility" | "reason" | "intuition" | "presence" | null;
    // A calculated value for most hero abilities, so not relevanat for import purposes.  For enemy and
    // minion abilities, this is the potency value that is stated in the game text and *should* be imported.
    //     Example:
    //       "M < 4 slowed (EoT)" => potency.value = 4,
    //       "A < 3 frightened (save ends)" => potency.value = 3.
    value: number;
    effects: IEffectData;
}

export class AbilityData<TData extends IAbilityData = IAbilityData> extends ItemData<TData> {
    static override defineSchema() {
        const schema = {
            ...this.createBaseFields(),

            level: new foundry.data.fields.NumberField({ required: true, initial: 1, choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }),

            description: new foundry.data.fields.HTMLField({ initial: "" }),
            keywords: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField(), { initial: [] }),
            type: new foundry.data.fields.StringField({ required: true, initial: "mainAction" }),
            maliceCost: new foundry.data.fields.NumberField({ initial: 0 }),
            distance: new foundry.data.fields.SchemaField({
                self: new foundry.data.fields.BooleanField({ initial: false }),
                melee: new foundry.data.fields.NumberField({ initial: 0 }),
                ranged: new foundry.data.fields.NumberField({ initial: 0 }),
                burst: new foundry.data.fields.NumberField({ initial: 0 }),
                cube: new foundry.data.fields.SchemaField({
                    size: new foundry.data.fields.NumberField({ initial: 0 }),
                    within: new foundry.data.fields.NumberField({ initial: 0 })
                }),
                line: new foundry.data.fields.SchemaField({
                    width: new foundry.data.fields.NumberField({ initial: 0 }),
                    length: new foundry.data.fields.NumberField({ initial: 0 }),
                    within: new foundry.data.fields.NumberField({ initial: 0 })
                })
            }),
            target: new foundry.data.fields.SchemaField({
                filter: new foundry.data.fields.JavaScriptField({ initial: null }),
                displayValue: new foundry.data.fields.StringField({ initial: "" }),
                count: new foundry.data.fields.NumberField({ initial: 1 })
            }),
            trigger: new foundry.data.fields.StringField({ initial: "" }),
            prePowerRollEffect: new foundry.data.fields.SchemaField({
                ...this.createEffectFields()
            }, { required: false, nullable: true }),
            powerRoll: new foundry.data.fields.SchemaField({
                characteristic: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField(), { initial: null }),
                bonus: new foundry.data.fields.NumberField({ initial: 0 }),
                tier1: new foundry.data.fields.SchemaField({
                    ...this.createPowerRollTierFields()
                }),
                tier2: new foundry.data.fields.SchemaField({
                    ...this.createPowerRollTierFields()
                }),
                tier3: new foundry.data.fields.SchemaField({
                    ...this.createPowerRollTierFields()
                })
            }),
            postPowerRollEffect: new foundry.data.fields.SchemaField({
                ...this.createEffectFields()
            }, { required: false, nullable: true }),
        };

        return schema;
    }

    static createPowerRollTierFields() {
        return {
            baseDamage: new foundry.data.fields.NumberField({ initial: null }),
            damageBonusCharacteristic: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField(), { initial: null }),
            damage: new foundry.data.fields.NumberField({ initial: null }),
            effect: new foundry.data.fields.SchemaField({
                ...this.createEffectFields()
            }, { required: false, nullable: true }),
            potencyEffect: new foundry.data.fields.SchemaField({
                //tier: new foundry.data.fields.StringField({ choices: ["weak", "average", "strong"], required: true, initial: "weak" }),
                characteristic: new foundry.data.fields.StringField({ choices: ["might", "agility", "reason", "intuition", "presence"], required: false, nullable: true, initial: null }),
                value: new foundry.data.fields.NumberField({ required: true, initial: 0 }),
                effects: new foundry.data.fields.SchemaField({
                    ...this.createEffectFields()
                })
            }, { required: false, nullable: true }),
        }
    }

    static createEffectFields() {
        return {
            text: new foundry.data.fields.StringField({ initial: "" }),
            targets: new foundry.data.fields.StringField({ initial: "" }),
            duration: new foundry.data.fields.StringField({ initial: "endOfTargetTurn" }),
            slowed: new foundry.data.fields.BooleanField({ initial: false }),
            weakened: new foundry.data.fields.BooleanField({ initial: false }),
            frightened: new foundry.data.fields.BooleanField({ initial: false }),
            bleeding: new foundry.data.fields.BooleanField({ initial: false }),
            grabbed: new foundry.data.fields.BooleanField({ initial: false }),
            taunted: new foundry.data.fields.BooleanField({ initial: false }),
            restrained: new foundry.data.fields.BooleanField({ initial: false }),

            ...CreatureData.createWeaknessField()
        }
    }
}
