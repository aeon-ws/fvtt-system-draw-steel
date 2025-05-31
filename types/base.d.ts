// types/base.d.ts


declare function fromUuid<T extends foundry.abstract.Document<any, any> = foundry.abstract.Document<any, any>>(uuid: string): Promise<T | null>;

// -------------------------
// 🗂️ Collections
// -------------------------

declare class Collection<T> {
    get(id: string): T | undefined;
    has(id: string): boolean;
    forEach(callback: (value: T, key: string) => void): void;
    filter(predicate: (value: T) => boolean): T[];
    values(): IterableIterator<T>;
    // Add more if needed
}

// -------------------------
// 📋 Document Contexts
// -------------------------

declare interface DocumentUpdateContext {
    diff?: boolean;
    render?: boolean;
    noHook?: boolean;
    [key: string]: any;
}

declare interface DocumentModificationContext {
    deleteAll?: boolean;
    updateEmbedded?: boolean;
    keepId?: boolean;
    [key: string]: any;
}

// -------------------------
// 📦 Common Interfaces
// -------------------------

declare interface CompendiumDocument {
    _id: string;
    name: string;
    type: string;
    [key: string]: any;
}

declare interface ItemData {
    _id: string;
    name: string;
    type: string;
    system: any;
    flags?: Record<string, any>;
    [key: string]: any;
}

declare interface SceneData {
    _id: string;
    name: string;
    active: boolean;
    tokens: TokenDocument[];
    [key: string]: any;
}

// -------------------------
// 🛠️ Utility Types
// -------------------------

type Constructor<T = {}> = new (...args: any[]) => T;
type ValueOf<T> = T[keyof T];

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object
    ? T[P] extends Function
    ? T[P]
    : DeepPartial<T[P]>
    : T[P];
};

type SourceOf<T> = T extends { _source: infer S } ? S : never;
type WithFlags<T = any> = {
    flags?: Record<string, T>;
};
