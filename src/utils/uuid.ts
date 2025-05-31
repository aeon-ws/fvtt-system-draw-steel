
// -------------------------
// 🔗 UUID Utilities
// -------------------------

/**
 * Resolve a single UUID string to its corresponding document.
 * Returns null if not found.
 */
export async function resolveUuid<T extends foundry.abstract.Document.Any>(uuid: string): Promise<T | null> {
    const doc = await fromUuid(uuid);
    return doc as T | null;
}

/**
 * Resolve an array of UUID strings to their corresponding documents.
 * Skips any that fail to resolve.
 */
// export async function resolveUuids<T extends foundry.abstract.Document.Any>(uuids: string[]): Promise<T[]> {
//     const results = await Promise.all(uuids.map(uuid => fromUuid(uuid)));
//     return results.filter((doc: any): doc is T => !!doc);
// }
