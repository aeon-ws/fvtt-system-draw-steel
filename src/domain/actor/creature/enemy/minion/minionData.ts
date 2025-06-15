// src/actors/minionActor.ts

import { EnemyData, IEnemyCombatData, IEnemyData } from "@enemy/enemyData";
import { IStaminaData } from "@actor/actorData";

const { ArrayField, NumberField, SchemaField, StringField } = foundry.data.fields;

export interface IMinionData extends IEnemyData {
    captainId: string;
    squadMinionIds: string[];

    stamina: IMinionStaminaData;
    combat: IMinionCombatData;
    appliedCaptainEffects: IAppliedMinionSquadCaptainEffectsData;
    derivedCaptainBonuses: IDerivedMinionSquadCaptainBonusesData;
}

export interface IMinionCombatData extends IEnemyCombatData {
    strikeDamage: number;
    strikeEdge: number;
}

export interface IMinionStaminaData extends IStaminaData {
    maxShared: number;
    perMinion: number;
}

export interface IDerivedMinionSquadCaptainBonusesData {
    speed: number;
    meleeDistanceBonus: number;
    rangedDistanceBonus: number;
    strikeDamage: number;
    strikeEdge: number;
}

export interface IAppliedMinionSquadCaptainEffectsData {
    temporaryStamina: number;
}

export class MinionData<TData extends IMinionData = IMinionData> extends EnemyData<TData> {
    static override defineSchema() {
        const schema = {
            ...this.createBaseFields(),
            ...this.createCreatureFields(),
            ...this.createEnemyFields(),
            ...this.createImmunityField(),
            ...this.createWeaknessField(),
            ...this.createCharacteristicsField(),

            captainId: new StringField({ initial: "" }),
            squadMinionIds: new ArrayField(new StringField(), { initial: [] }),

            stamina: new SchemaField({
                ...this.createStaminaFields(),

                perMinion: new NumberField({ initial: 0 })
            }),

            combat: new SchemaField({
                ...this.createEnemyCombatFields(),
            }),

            appliedCaptainEffects: new SchemaField({
                temporaryStamina: new NumberField({ initial: 0 })
            }),

            derivedCaptainBonuses: new SchemaField({
                speed: new NumberField({ initial: 0 }),
                meleeDistanceBonus: new NumberField({ initial: 0 }),
                rangedDistanceBonus: new NumberField({ initial: 0 }),
                strikeDamage: new NumberField({ initial: 0 }),
                strikeEdge: new NumberField({ initial: 0 })
            })
        };

        return schema;
    }


    // override prepareDerivedData(): void {
    //     super.prepareDerivedData();


    //         const value = squad.data.getEffectiveStat(key);
    //         if (typeof value === "number") {
    //             this.data.combat[key] = value;
    //         }
    //     }
    // }
}
