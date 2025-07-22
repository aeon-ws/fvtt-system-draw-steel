// src/actors/heroActor.ts

import { CreatureData, ICreatureCombatData, ICreatureData } from "@creature/creatureData";

const { NumberField, SchemaField, StringField } = foundry.data.fields;

export type HeroClass =
    "Beastheart" |
    "Censor" |
    "Conduit" |
    "Elementalist" |
    "Fury" |
    "Null" |
    "Summoner" |
    "Shadow" |
    "Tactician" |
    "Talent";

export interface IHeroData extends ICreatureData {
    ancestry: string;
    class: HeroClass;

    recovery: IRecoveryData;

    heroicResource: number;
}

export interface IRecoveryData {
    recoveryValue: number;
    recoveriesMax: number;
    recoveriesCurrent: number;
}

export interface IHeroCombatData extends ICreatureCombatData {
    disengage: number;
}

export class HeroData<TData extends IHeroData = IHeroData> extends CreatureData<TData> {
    static override defineSchema() {
        const schema = {
            ...this.createCreatureFields(),
            ...this.createImmunityField(),
            ...this.createWeaknessField(),
            ...this.createCharacteristicsField(),
            ...this.createStaminaField(),

            ancestry: new StringField(),
            class: new StringField(),

            combat: new SchemaField({
                ...this.createCreatureCombatFields(),

                disengage: new NumberField({ initial: 1 })
            }),

            recovery: new SchemaField({
                recoveryValue: new NumberField({ initial: 3 }),
                recoveriesMax: new NumberField({ initial: 3 }),
                recoveriesCurrent: new NumberField({ initial: 3 })
            }),

            heroicResource: new NumberField({ initial: 0 }),
        };

        console.log("HeroData.defineSchema", schema);
        return schema;
    }

    override get deadThreshold(): number {
        return -this.windedThreshold;
    }
}
