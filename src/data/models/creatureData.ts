// src/data/models/creatureData.ts

import { ActorData, IActorData, ICombatData, IStaminaData } from "@data/actorData";

const { ArrayField, NumberField, SchemaField, StringField } = foundry.data.fields;


export interface ICreatureData extends IActorData {
    keywords: string[];

    characteristics: ICharacteristicsData;
    combat: ICreatureCombatData;
    immunity: IImmunityData;
    weakness: IWeaknessData;
}

export interface IImmunityData {
    acid: number;
    cold: number;
    corruption: number;
    damage: number;
    fire: number;
    holy: number;
    lightning: number;
    poison: number;
    psychic: number;
    sonic: number;
}

export interface IWeaknessData {
    acid: number;
    cold: number;
    corruption: number;
    damage: number;
    fire: number;
    holy: number;
    lightning: number;
    poison: number;
    psychic: number;
    sonic: number;
}

export interface ICharacteristicsData {
    might: number;
    agility: number;
    reason: number;
    intuition: number;
    presence: number;
}

export interface ICreatureCombatData extends ICombatData {
    speed: number;
    movementTypes: string[];
    meleeDistanceBonus: number;
    rangedDistanceBonus: number;
}

export class CreatureData<TData extends ICreatureData = ICreatureData> extends ActorData<TData> {
    static createCreatureFields() {
        return {
            ...this.createActorFields()
        }
    }

    static createImmunityField() {
        return {
            immunity: new SchemaField({
                acid: new NumberField({ initial: 0 }),
                cold: new NumberField({ initial: 0 }),
                corruption: new NumberField({ initial: 0 }),
                damage: new NumberField({ initial: 0 }),
                fire: new NumberField({ initial: 0 }),
                holy: new NumberField({ initial: 0 }),
                lightning: new NumberField({ initial: 0 }),
                poison: new NumberField({ initial: 0 }),
                psychic: new NumberField({ initial: 0 }),
                sonic: new NumberField({ initial: 0 }),
            })
        }
    }

    static createWeaknessField() {
        return {
            weakness: new SchemaField({
                acid: new NumberField({ initial: 0 }),
                cold: new NumberField({ initial: 0 }),
                corruption: new NumberField({ initial: 0 }),
                damage: new NumberField({ initial: 0 }),
                fire: new NumberField({ initial: 0 }),
                holy: new NumberField({ initial: 0 }),
                lightning: new NumberField({ initial: 0 }),
                poison: new NumberField({ initial: 0 }),
                psychic: new NumberField({ initial: 0 }),
                sonic: new NumberField({ initial: 0 }),
            })
        }
    }

    static createCharacteristicsField() {
        return {
            characteristics: new SchemaField({
                might: new NumberField({ required: true, initial: 0 }),
                agility: new NumberField({ required: true, initial: 0 }),
                reason: new NumberField({ required: true, initial: 0 }),
                intuition: new NumberField({ required: true, initial: 0 }),
                presence: new NumberField({ required: true, initial: 0 }),
            })
        }
    }

    static createCreatureCombatFields() {
        return {
            ...this.createCombatFields(),

            speed: new NumberField({ required: true, initial: 5 }),
            movementTypes: new ArrayField(new StringField(), { required: true, initial: ["walk"] }),
            meleeDistanceBonus: new NumberField({ initial: 0 }),
            rangedDistanceBonus: new NumberField({ initial: 0 })
        }
    }

    static override defineSchema() {
        const schema = {
            ...this.createCreatureFields(),
            ...this.createImmunityField(),
            ...this.createWeaknessField(),
            ...this.createCharacteristicsField(),
            ...this.createStaminaField(),

            combat: new SchemaField({
                ...this.createCreatureCombatFields()
            })
        };

        return schema;
    }
}
