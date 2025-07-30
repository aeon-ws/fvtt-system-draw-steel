// src/data/models/abilityData.ts

import { ItemData, IItemData } from "@domain/itemData";
// import { IHeroData } from "@hero/heroData";
// import { IEnemyData } from "@enemy/enemyData";
// import { IMinionData } from "@minion/minionData";
// import { IObjectData } from "@object/objectData";
import { CharacteristicKeys, CharacteristicType, CreatureData, ICreatureData, IWeaknessData } from "@creature/creatureData";

export const PotencyValueModfierKeys = [
    "weak",
    "average",
    "strong"
] as const;
export type PotencyValueModfierType = typeof PotencyValueModfierKeys[number];
export type AbilityKeyword = "Area" | "Charge" | "Magic" | "Melee" | "Psionic" | "Ranged" | "Strike" | "Weapon";
export type AbilityType = "mainAction" | "freeAction" | "freeManeuver" | "freeTriggeredAction" | "maneuver" | "triggeredAction";
export type DamageType = "acid" | "cold" | "corruption" | "fire" | "holy" | "lightning" | "poison" | "psychic" | "sonic";

export interface IActorAbilityData extends IItemData {
    // Value of the game term "keywords" in the ability game text.
    keywords: AbilityKeyword[];
    // The malice cost of the ability or 0 (if it does not cost any malice or heroic resource).
    //     If rules terms include "action" && "signature", then property resourceCost = 0,
    //     If property type == "mainAction" && property resourceCost == 0, then the ability is a signature
    //         ability (not used here, but will be used in display logic).
    resourceCost: number;
    isSignature: boolean;
    // The distance of the ability, 
    distance: {
        self: boolean,
        melee: undefined | null | number,
        ranged: undefined | null | number,
        burst: undefined | null | number,
        cube: undefined | null | {
            size: number,
            within: number
        },
        line: undefined | null | {
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
    prePowerRollEffect: IEffectData | undefined;
    powerRoll: IPowerRollData | null;
    // The contents of the game text "effect" section when it appears *after/below* the power roll in the
    // layout.
    postPowerRollEffect: IEffectData | undefined;
}

export interface IAbilityTargetData {
    ally?: boolean;
    creature?: boolean;
    enemy?: boolean;
    object?: boolean;
    self?: boolean;

    special?: boolean;
    //filter?: (system: IEnemyData | IHeroData | IMinionData | IObjectData) => boolean;
    text: string;
    count?: number | "all";
}

export interface IEffectData {
    // The effect as shown in the game text.
    //   Examples:
    //     "slowed (EoT)",
    //     "frightened (save ends)",
    //     "bleeding and weakened (save ends)",
    text: string;
    duration: "startOfTargetTurn" | "endOfTargetTurn" | "saveEnds" | "endOfEncounter";

    bleeding?: boolean;
    frightened?: boolean;
    grabbed?: boolean;
    noEffect?: boolean;
    prone?: boolean;
    restrained?: boolean;
    slowed?: boolean;
    taunted?: boolean;
    weakened?: boolean;
    weakness?: IWeaknessData;
}

export interface IPowerRollData {
    // Enemies | Minions
    bonus?: number | null;

    // Heroes
    bonusCharacteristics?: CharacteristicType[] | null;

    // Common
    tier1: IPowerRollTierData;
    tier2: IPowerRollTierData;
    tier3: IPowerRollTierData;
}

export interface IPowerRollTierData {
    // Heroes
    //   The damage before characteristic bonus is applied.  This is the value that is stated in the game text
    //   for hero abilities.  It doesn't appear in the game text for enemy and minion abilities and isn't
    //   relevant since it has already been factored into the damage value.
    baseDamage?: number | null;
    //   The list of characteristics from one of which the damage is derived.  The actual characteristic used
    //   will always be the highest of the hero in question.  Must always be set for hero abilities.  Not
    //   relevant for enemy and minion abilities, since the characteristic damage bonus already been added into
    //   the damage value, which is why it is only present in the IHeroPowerRollTierData interface.
    damageBonusCharacteristics?: CharacteristicType[] | null;

    // Enemies | Minions
    //   The damage value that is stated in the game text for enemy and minion abilities.  For hero abilities,
    //   this value is calculated dynamically and should never be stored.
    damage?: number;

    // Common
    damageType?: DamageType;
    effect?: IEffectData | null;
    potencyEffect?: IPotencyEffectData | null;
}

// In the game text, this interface represents the general 
// "<targetCharacteristicFirstLetter> < [weak] | [average] | [strong] <effect>" pattern.
//     Examples:
//         M < [weak] slowed (EoT),
//         A < [average] frightened (save ends),
//         if the target has P < weak, each enemy within 2 squares of them is frightened of you (save ends),
//         M < average, bleeding and weakened (save ends)
export interface IPotencyEffectData {
    // Heroes
    //   The characteristic (i.e., "might", "agility", "reason", "intuition", or "presence") that the potency
    //   value calculation is based on.
    valueCharacteristics?: CharacteristicType[] | null;
    //   The potency value modifier, which is one of "weak", "average", or "strong".
    valueModifier?: PotencyValueModfierType | null;

    // Enemies and minions
    //   The potency value that is stated in the game text.
    //     Example:
    //       "M < 4 slowed (EoT)" => potency.value = 4,
    //       "A < 3 frightened (save ends)" => potency.value = 3.
    value?: number | null;

    targetCharacteristic: CharacteristicType;
    effect: IEffectData;
}

export class ActorAbilityData<TData extends IActorAbilityData = IActorAbilityData> extends ItemData<TData> {
    static override defineSchema() {
        const schema = {
            ...super.defineSchema(),

            ...this.createAbilityFields(),
            ...this.createDistanceField(),
            ...this.createTargetField(),

            prePowerRollEffect: new foundry.data.fields.SchemaField({
                ...this.createEffectFields()
            }, { required: false, nullable: true }),
            powerRoll: new foundry.data.fields.SchemaField({
                // Enemies | Minions
                bonus: new foundry.data.fields.NumberField(),
                // Heroes
                bonusCharacteristics: new foundry.data.fields.ArrayField(
                    new foundry.data.fields.StringField({ choices: CharacteristicKeys }),
                    { required: false, nullable: true }
                ),
                // Common
                tier1: new foundry.data.fields.SchemaField({
                    ...this.createPowerRollTierFields(),
                    potencyEffect: new foundry.data.fields.SchemaField({
                        ...this.createPotencyEffectFields()
                    }, { required: false, nullable: true })
                }),
                tier2: new foundry.data.fields.SchemaField({
                    ...this.createPowerRollTierFields(),
                    potencyEffect: new foundry.data.fields.SchemaField({
                        ...this.createPotencyEffectFields()
                    }, { required: false, nullable: true })
                }),
                tier3: new foundry.data.fields.SchemaField({
                    ...this.createPowerRollTierFields(),
                    potencyEffect: new foundry.data.fields.SchemaField({
                        ...this.createPotencyEffectFields()
                    }, { required: false, nullable: true })
                })
            }, { required: false, nullable: true }),
            postPowerRollEffect: new foundry.data.fields.SchemaField({
                ...this.createEffectFields()
            }, { required: false, nullable: true }),
        };

        return schema;
    }

    static createAbilityFields() {
        return {
            ...this.createBaseFields(),

            type: new foundry.data.fields.StringField({
                required: true,
                choices: ["mainAction", "freeAction", "freeManeuver", "freeTriggeredAction", "maneuver", "triggeredAction"]
            }),
            resourceCost: new foundry.data.fields.NumberField(),
            isSignature: new foundry.data.fields.BooleanField({ initial: false }),

            trigger: new foundry.data.fields.StringField(),
        }
    }

    static createDistanceField() {
        return {
            distance: new foundry.data.fields.SchemaField({
                self: new foundry.data.fields.BooleanField(),
                special: new foundry.data.fields.BooleanField(),
                melee: new foundry.data.fields.NumberField(),
                ranged: new foundry.data.fields.NumberField(),
                burst: new foundry.data.fields.NumberField(),
                cube: new foundry.data.fields.SchemaField({
                    size: new foundry.data.fields.NumberField(),
                    within: new foundry.data.fields.NumberField()
                }, { initial: undefined, nullable: true }),
                line: new foundry.data.fields.SchemaField({
                    width: new foundry.data.fields.NumberField(),
                    length: new foundry.data.fields.NumberField(),
                    within: new foundry.data.fields.NumberField()
                }, { initial: undefined, nullable: true })
            }),
        }
    }

    static createTargetField() {
        return {
            target: new foundry.data.fields.SchemaField({
                ally: new foundry.data.fields.BooleanField(),
                creature: new foundry.data.fields.BooleanField(),
                enemy: new foundry.data.fields.BooleanField(),
                object: new foundry.data.fields.BooleanField(),
                self: new foundry.data.fields.BooleanField(),

                special: new foundry.data.fields.BooleanField(),
                filter: new foundry.data.fields.JavaScriptField(),
                text: new foundry.data.fields.StringField({ required: true, nullable: false }),
                count: new foundry.data.fields.NumberField()
            })
        }
    }

    static createPowerRollTierFields() {
        return {
            // Heroes
            baseDamage: new foundry.data.fields.NumberField(),
            damageBonusCharacteristics: new foundry.data.fields.ArrayField(
                new foundry.data.fields.StringField({ choices: CharacteristicKeys }),
                { required: false, nullable: true }
            ),

            // Enemies | Minions
            damage: new foundry.data.fields.NumberField(),

            // Common
            damageType: new foundry.data.fields.StringField(),
            effect: new foundry.data.fields.SchemaField(
                { ...this.createEffectFields() },
                { required: false, nullable: true }
            ),
            potencyEffect: new foundry.data.fields.SchemaField(
                { ...this.createPotencyEffectFields() },
                { required: false, nullable: true }
            ),
        }
    }

    static createPotencyEffectFields() {
        return {
            // Heroes.
            valueCharacteristics: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField({ choices: CharacteristicKeys }), { initial: null, nullable: true }),
            valueModifier: new foundry.data.fields.StringField({ choices: PotencyValueModfierKeys }),

            // Enemies | Minions
            value: new foundry.data.fields.NumberField(),

            // Common
            targetCharacteristic: new foundry.data.fields.StringField({ choices: CharacteristicKeys, required: true, nullable: false }),
            effect: new foundry.data.fields.SchemaField({
                ...this.createEffectFields()
            })
        }
    }

    static createEffectFields() {
        return {
            text: new foundry.data.fields.StringField({ initial: "" }),

            targets: new foundry.data.fields.StringField({ initial: "" }),
            duration: new foundry.data.fields.StringField({ initial: "endOfTargetTurn" }),

            bleeding: new foundry.data.fields.BooleanField({ initial: false }),
            frightened: new foundry.data.fields.BooleanField({ initial: false }),
            grabbed: new foundry.data.fields.BooleanField({ initial: false }),
            taunted: new foundry.data.fields.BooleanField({ initial: false }),
            restrained: new foundry.data.fields.BooleanField({ initial: false }),
            slowed: new foundry.data.fields.BooleanField({ initial: false }),
            weakened: new foundry.data.fields.BooleanField({ initial: false }),

            ...CreatureData.createWeaknessField()
        }
    }
}
