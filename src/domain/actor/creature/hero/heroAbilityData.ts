import { AbilityType, ActorAbilityData, IActorAbilityData } from "@actor/actorAbilityData";

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

            level: new foundry.data.fields.NumberField({ required: true, initial: 1, choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }),
            description: new foundry.data.fields.HTMLField({ initial: "" }),
            heroicResourceCost: new foundry.data.fields.NumberField({ required: false, initial: 0, nullable: true }),
        };

        console.log("HeroAbilityData.defineSchema", schema);
        return schema;
    }
}
