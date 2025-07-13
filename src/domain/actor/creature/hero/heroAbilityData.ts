import { AbilityType, ActorAbilityData, IActorAbilityData, IEffectData, IPotencyEffectData, IPowerRollTierData } from "@actor/actorAbilityData";
import { IHeroData } from "./heroData";

export const PotencyValueModfierKeys = [
    "weak",
    "average",
    "strong"
] as const;
export type PotencyValueModfierType = typeof PotencyValueModfierKeys[number];

export interface IHeroAbilityData extends IActorAbilityData {
    type: AbilityType | "heroTrait";

    level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    // The game text flavor description of the ability.  In the game text, it appears just below the name and
    // cost of the ability and just above the game text "keywords" section.
    description: string;
    heroicResourceCost: number;
}

export class HeroAbilityData<TData extends IHeroAbilityData = IHeroAbilityData> extends ActorAbilityData<TData> {
    static override defineSchema() {
        const schema = {
            ...super.defineSchema(),

            type: new foundry.data.fields.StringField({ required: true, initial: "mainAction" }),
            level: new foundry.data.fields.NumberField({ required: true, initial: 1, choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }),
            description: new foundry.data.fields.HTMLField({ initial: "" }),
            heroicResourceCost: new foundry.data.fields.NumberField({ required: false, initial: 0, nullable: true }),
        };

        return schema;
    }

    // @ts-ignore
    getPowerRollBonus(hero: IHeroData | null): number {
        if (!hero) {
            throw new Error("Hero must be specified.");
        }
        if (!this.data?.powerRoll?.characteristic) {
            throw new Error("Power roll characteristic must be specified for all power rolls of hero abilities.");
        }

        return hero.getHighestCharacteristicValue(this.data.powerRoll.characteristic);
    }

    static getPotencyValue(hero: IHeroData, potencyEffect: IPotencyEffectData): number {
        if (!hero) {
            throw new Error("Hero must be specified.");
        }
        return hero.getCharacteristicValue(potencyEffect.valueCharacteristic) + this.getPotencyValueModfierAsNumber(potencyEffect.valueModifier);
    }

    static getPotencyValueModfierAsNumber(valueModifier: PotencyValueModfierType | null | undefined): number {
        if (valueModifier === null || valueModifier === undefined) {
            throw new Error("Potency value modifier must be specified for all potency effects of hero abilities.");
        }

        return valueModifier === "weak"
            ? -2
            : valueModifier === "average"
                ? -1
                : 0;
    }
}
