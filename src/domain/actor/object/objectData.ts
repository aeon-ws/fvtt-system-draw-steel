// src/data/models/objectData.ts

import { ActorData, IActorData } from "@actor/actorData";

const { SchemaField } = foundry.data.fields;


export interface IObjectData extends IActorData {
}

export class ObjectData<TData extends IObjectData = IObjectData> extends ActorData<TData> {
    static createObjectFields() {
        return {
            ...this.createActorFields(),
        }
    }

    static override defineSchema() {
        const schema = {
            ...this.createObjectFields(),
            ...this.createStaminaField(),

            combat: new SchemaField({
                ...this.createCombatFields()
            })
        };

        return schema;
    }
}
