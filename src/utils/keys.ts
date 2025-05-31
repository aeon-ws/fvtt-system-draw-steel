
import { IMinionCombatData } from "@data/minionData";


export type KeysExcept<T, K extends keyof T> = keyof Omit<T, K>;

export type KeysOf<T, K extends keyof T> = keyof Pick<T, K>;

export type KeysOfType<T, V> = {
    [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

export const NumericMinionCombatKey: readonly KeysOfType<IMinionCombatData, number>[] = [
    "speed", "strikeDamage", "strikeEdge", "freeStrikeDamage", "stability", "meleeDistanceBonus", "rangedDistanceBonus"
];
