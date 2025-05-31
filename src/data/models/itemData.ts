// src/actors/itemData.ts

import { BaseData, IBaseData } from "@data/baseData";


export interface IItemData extends IBaseData {
    document: Item;
}

export class ItemData<TData extends IItemData = IItemData> extends BaseData<TData, Item> {
    static override defineSchema() {
        const schema = {
            ...this.createBaseFields(),
        };

        return schema;
    }

    // @ts-ignore
    get document(): Item {
        return this.parent;
    }
}
