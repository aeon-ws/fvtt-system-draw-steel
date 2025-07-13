import { AbilityType, ActorAbilityData, IActorAbilityData, IEffectData, IPotencyEffectData, IPowerRollData, IPowerRollTierData } from "@domain/actor/actorAbilityData";
import { CharacteristicKeys, ICreatureData } from "../creatureData";

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


    // @ts-ignore
    getPowerRollBonus(_?: ICreatureData | null): number {
        if (!this.data.powerRoll?.bonus) {
            throw new Error("Power roll bonus must be specified for all power rolls of enemy abilities.");
        }

        return this.data.powerRoll.bonus;
    }

    // @ts-ignore
    getPotencyValue(_?: ICreatureData | null, potencyEffect?: IPotencyEffectData | null): number {
        if (!potencyEffect?.value) {
            throw new Error("Potency value must be specified for all potency effects of enemy abilities.");
        }

        return potencyEffect.value;
    }
}
