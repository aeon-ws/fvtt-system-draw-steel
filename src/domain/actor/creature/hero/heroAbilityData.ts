import { AbilityType, ActorAbilityData, CharacteristicType, IActorAbilityData, IPotencyEffectData, IPowerRollData, IPowerRollTierData } from "@actor/actorAbilityData";

export interface IHeroAbilityData extends IActorAbilityData {
    type: AbilityType;

    level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    // The game text flavor description of the ability.  In the game text, it appears just below the name and
    // cost of the ability and just above the game text "keywords" section.
    description: string;
    heroicResourceCost: number;
    powerRoll: IHeroPowerRollData | null;
}

export interface IHeroPowerRollData extends IPowerRollData {
    // The list of characteristics from one of which the power roll bonus is derived.  The actual
    // characteristic used will always be the highest of the hero in question.
    characteristic: CharacteristicType[] | null;
    // The power roll bonus, which is always derived from the hero's characteristics.
    bonus: number;

    tier1: IHeroPowerRollTierData;
    tier2: IHeroPowerRollTierData;
    tier3: IHeroPowerRollTierData;
}

export interface IHeroPowerRollTierData extends IPowerRollTierData {
    // The damage before characteristic bonus is applied.  This is the value that is stated in the game text
    // for hero abilities.
    baseDamage: number | null;
    // The list of characteristics from one of which the damage is derived.  The actual characteristic used
    // will always be the highest of the hero in question.
    damageBonusCharacteristic: CharacteristicType[] | null;

    potencyEffect: IHeroPotencyEffectData | null;
}


// In the game text, this interface represents the general 
// "<targetCharacteristicFirstLetter> < [weak] | [average] | [strong] <effect>" pattern.
//     Examples:
//         M < [weak] slowed (EoT),
//         A < [average] frightened (save ends),
//         if the target has P < weak, each enemy within 2 squares of them is frightened of you (save ends),
//         M < average, bleeding and weakened (save ends)
export interface IHeroPotencyEffectData extends IPotencyEffectData {
    valueModifier: "weak" | "average" | "strong";
    // The characteristic that the potency value is based on, e.g., "might", "agility", "reason", "intuition",
    // or "presence".
    valueCharacteristic: "might" | "agility" | "reason" | "intuition" | "presence" | null;
}

export class HeroAbilityData<TData extends IHeroAbilityData = IHeroAbilityData> extends ActorAbilityData<TData> {
    static override defineSchema() {
        const schema = {
            ...this.createAbilityFields(),
            ...this.createDistanceField(),
            ...this.createTargetField(),

            type: new foundry.data.fields.StringField({ required: true, initial: "mainAction" }),
            level: new foundry.data.fields.NumberField({ required: true, initial: 1, choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }),
            description: new foundry.data.fields.HTMLField({ initial: "" }),
            heroicResourceCost: new foundry.data.fields.NumberField({ required: false, initial: 0, nullable: true }),

            prePowerRollEffect: new foundry.data.fields.SchemaField({
                ...this.createEffectFields()
            }, { required: false, nullable: true }),
            powerRoll: new foundry.data.fields.SchemaField({
                characteristic: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField(), { initial: null }),
                bonus: new foundry.data.fields.NumberField({ initial: 0 }),
                tier1: new foundry.data.fields.SchemaField({
                    ...this.createHeroPowerRollTierFields()
                }),
                tier2: new foundry.data.fields.SchemaField({
                    ...this.createHeroPowerRollTierFields()
                }),
                tier3: new foundry.data.fields.SchemaField({
                    ...this.createHeroPowerRollTierFields()
                })
            }, { required: false, nullable: true }),
            postPowerRollEffect: new foundry.data.fields.SchemaField({
                ...this.createEffectFields()
            }, { required: false, nullable: true }),
        };

        return schema;
    }

    static createHeroPowerRollTierFields() {
        return {
            ...this.createPowerRollTierFields(),

            baseDamage: new foundry.data.fields.NumberField({ initial: null }),
            damageBonusCharacteristic: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField(), { initial: null }),

            potencyEffect: new foundry.data.fields.SchemaField({
                ...this.createPotencyEffectFields(),

                valueModifier: new foundry.data.fields.StringField({ choices: ["weak", "average", "strong"], required: true, initial: "weak" }),
                valueCharacteristic: new foundry.data.fields.StringField({ choices: ["might", "agility", "reason", "intuition", "presence"], required: false, nullable: true, initial: null }),
            }, { required: false, nullable: true }),
        }
    }
}
