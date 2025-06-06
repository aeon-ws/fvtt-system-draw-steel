// src/actors/actorData.ts

import { BaseData, IBaseData } from "@domain/baseData";

const { ArrayField, NumberField, SchemaField, StringField } = foundry.data.fields;


export interface IActorData extends IBaseData {
    level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    echelon: 1 | 2 | 3 | 4;

    actor: Actor;
    actorType: "enemy" | "hero" | "minion";

    stamina: IStaminaData;
    combat: ICombatData

    windedThreshold: number;
    dyingThreshold: number;
    deadThreshold: number;
    isWinded: boolean;
    isDying: boolean;
    isDead: boolean;
}

export interface IStaminaData {
    max: number;
    min: number;
    value: number;
    temporary: number;
}

export interface ICombatData {
    size: string;
    stability: number;
}

export class ActorData<TData extends IActorData = IActorData> extends BaseData<TData, Actor> {
    static override defineSchema() {
        const schema = {
            ...this.createActorFields(),
            ...this.createStaminaField(),

            combat: new SchemaField({
                ...this.createCombatFields()
            }),
        };

        return schema;
    }

    static createActorFields() {
        return {
            ...this.createBaseFields(),

            level: new NumberField({ required: true, initial: 1 })
        };
    }

    static createStaminaField() {
        return {
            stamina: new SchemaField({
                ...this.createStaminaFields()
            })
        }
    }

    static createStaminaFields() {
        return {
            max: new NumberField({ required: true, initial: 0 }),
            min: new NumberField({ initial: 0 }),
            value: new NumberField({ initial: 0 }),
            temporary: new NumberField({ initial: 0 }),
        }
    }

    static createCombatFields() {
        return {
            size: new StringField({ required: true, initial: "1M" }),
            stability: new NumberField({ required: true, initial: 0 })
        }
    }

    // @ts-ignore
    get actor(): Actor {
        return this.parent;
    }

    // @ts-ignore
    get actorType(): "enemy" | "hero" | "minion" {
        return this.actor.type as "enemy" | "hero" | "minion";
    }

    // @ts-ignore
    get echelon(): number {
        if (this.data.level == 10) return 4;
        if (this.data.level >= 7) return 3;
        if (this.data.level >= 4) return 2;
        return 1;
    }

    // @ts-ignore
    get deadThreshold(): number {
        return 0;
    }

    // @ts-ignore
    get dyingThreshold(): number {
        return 0;
    }

    // @ts-ignore
    get windedThreshold(): number {
        return Math.floor(this.data.stamina.max / 2)
    }

    // @ts-ignore
    get isDead(): boolean {
        return this.data.stamina.value <= this.deadThreshold;
    }

    // @ts-ignore
    get isDying(): boolean {
        return !this.isDead && this.data.stamina.value <= this.dyingThreshold;
    }

    // @ts-ignore
    get isWinded(): boolean {
        return !this.isDead && this.data.stamina.value <= this.windedThreshold;
    }

    override prepareDerivedData() {
        super.prepareDerivedData();

        this.data.stamina.min = this.deadThreshold;
    }
}
