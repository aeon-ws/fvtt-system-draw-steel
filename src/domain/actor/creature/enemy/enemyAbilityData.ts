import { AbilityType, ActorAbilityData, IActorAbilityData } from "@domain/actor/actorAbilityData";

export type EnemyAbilityType = AbilityType | "monsterTrait" | "villainAction";

export interface IEnemyAbilityData extends IActorAbilityData {
    type: EnemyAbilityType;
    maliceCost: number;
}

export class EnemyAbilityData<TData extends IEnemyAbilityData = IEnemyAbilityData> extends ActorAbilityData<TData> {
    static override defineSchema() {
        const schema = {
            ...super.defineSchema(),
            // ...this.createAbilityFields(),
            // ...this.createDistanceField(),
            // ...this.createTargetField(),

            maliceCost: new foundry.data.fields.NumberField({ initial: 0 }),

            // prePowerRollEffect: new foundry.data.fields.SchemaField({
            //     ...this.createEffectFields()
            // }, { required: false, nullable: true }),
            // powerRoll: new foundry.data.fields.SchemaField({
            //     bonus: new foundry.data.fields.NumberField({ initial: 0 }),
            //     tier1: new foundry.data.fields.SchemaField({
            //         ...this.createPowerRollTierFields()
            //     }),
            //     tier2: new foundry.data.fields.SchemaField({
            //         ...this.createPowerRollTierFields()
            //     }),
            //     tier3: new foundry.data.fields.SchemaField({
            //         ...this.createPowerRollTierFields()
            //     })
            // }, { required: false, nullable: true }),
            // postPowerRollEffect: new foundry.data.fields.SchemaField({
            //     ...this.createEffectFields()
            // }, { required: false, nullable: true }),
        };

        return schema;
    }
}
