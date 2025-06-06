// src/models/baseData.ts

export interface IBaseData {
    [key: string]: any;
    name: string;
}

export class BaseData<TData extends IBaseData = IBaseData, TParentData extends foundry.abstract.Document.Any = Actor | Item> extends foundry.abstract.TypeDataModel<TData, TParentData> {
    get data(): TData {
        return this as unknown as TData;
    }

    static createBaseFields() {
        return {
            name: new foundry.data.fields.StringField({ required: true, initial: "" }),
            keywords: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField(), { initial: [] }),
        }
    }

    static override defineSchema() {
        return {
            ...this.createBaseFields(),
        }
    }

    prepareBaseData(): void {
        const name = this.data.name;
        this.data.name = (name && name.length > 0) ? name : String(this.parent.name);
    }
}
