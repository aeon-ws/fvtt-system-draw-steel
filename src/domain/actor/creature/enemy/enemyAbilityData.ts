import { AbilityType, ActorAbilityData, IActorAbilityData } from "@actor/actorAbilityData";

export type EnemyAbilityType = AbilityType | "monsterTrait" | "villainAction";

export interface IEnemyAbilityData extends IActorAbilityData {
    type: EnemyAbilityType;
    villainActionOrdinal?: number;
    maliceCost: number;
}

export class EnemyAbilityData<TData extends IEnemyAbilityData = IEnemyAbilityData> extends ActorAbilityData<TData> {
    static override defineSchema() {
        const schema = {
            ...super.defineSchema(),

            maliceCost: new foundry.data.fields.NumberField({ initial: 0 }),
            villainActionOrdinal: new foundry.data.fields.NumberField({ required: false, nullable: true }),
        };

        return schema;
    }
}
