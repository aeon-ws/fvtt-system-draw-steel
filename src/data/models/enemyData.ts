// src/actors/enemyActor.ts

import { CreatureData, ICreatureData, ICreatureCombatData } from "@data/creatureData";

const { NumberField, SchemaField, StringField } = foundry.data.fields;

export interface IEnemyData extends ICreatureData {
    type: string;
    role: string;
    encounterValue: number;
    squadId: string;

    combat: IEnemyCombatData;
}

export interface IEnemyCombatData extends ICreatureCombatData {
    freeStrikeDamage: number;
}

export class EnemyData<TData extends IEnemyData = IEnemyData> extends CreatureData<TData> {
    static createEnemyFields() {
        return {
            ...this.createCreatureFields(),

            type: new StringField({ required: true, initial: "" }),
            role: new StringField({ required: true, initial: "" }),
            encounterValue: new NumberField({ required: true, initial: 0 }),
            squadId: new StringField({ initial: "" })
        };
    }

    static createEnemyCombatFields() {
        return {
            ...this.createCreatureCombatFields(),

            freeStrikeDamage: new NumberField({ required: true, initial: 0 })
        }
    }

    static override defineSchema() {
        const schema = {
            ...this.createEnemyFields(),
            ...this.createImmunityField(),
            ...this.createWeaknessField(),
            ...this.createCharacteristicsField(),
            ...this.createStaminaField(),

            combat: new SchemaField({
                ...this.createEnemyCombatFields()
            })
        };

        return schema;
    }
}
