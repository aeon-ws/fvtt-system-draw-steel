
import { IHeroData } from "@hero/heroData";
import { ActorTokenDocument } from "@actor/actorTokenDocument";
import { isHeroToken } from "@utils/tokenDocument";
import { IPotencyEffectData, IPowerRollData, IPowerRollTierData, PotencyValueModfierType } from "@actor/actorAbilityData";
import { CharacteristicType } from "@creature/creatureData";


export class HeroTokenDocument<TActorData extends IHeroData = IHeroData> extends ActorTokenDocument<TActorData> {
    constructor(tokenDocument: TokenDocument, scene: Scene | null = null) {
        super(tokenDocument, scene);

        if (!isHeroToken(tokenDocument)) throw new Error("Cannot decorate non-hero token document.");
    }

    getDamageValue(powerRollTier?: IPowerRollTierData): number | null {
        if (powerRollTier?.damageBonusCharacteristics === undefined
            || powerRollTier.damageBonusCharacteristics === null
            || powerRollTier?.baseDamage === undefined
            || powerRollTier.baseDamage === null) {
            return null;
        }

        const damageBonus = this.getHighestCharacteristicValue(powerRollTier.damageBonusCharacteristics);

        return powerRollTier.baseDamage + damageBonus;
    }

    getPowerRollBonus(powerRoll?: IPowerRollData): number {
        if (powerRoll?.bonusCharacteristics === undefined || powerRoll.bonusCharacteristics === null) {
            throw new Error("Power roll bonus characteristics must be specified for all power rolls of hero abilities.");
        }

        return this.getHighestCharacteristicValue(powerRoll.bonusCharacteristics);
    }

    getPotencyValue(potencyEffect?: IPotencyEffectData | null): number {
        if (potencyEffect?.valueCharacteristics === undefined || potencyEffect.valueCharacteristics === null) {
            throw new Error("Potency value characteristics must be specified for all potency effects of hero abilities.");
        }
        if (potencyEffect.valueModifier === undefined || potencyEffect.valueModifier === null) {
            throw new Error("Potency value modifier must be specified for all potency effects of hero abilities.");
        }

        return this.getHighestCharacteristicValue(potencyEffect.valueCharacteristics) + this.getPotencyValueModfierAsNumber(potencyEffect.valueModifier);
    }

    getCharacteristicValue(characteristic?: CharacteristicType | null): number {
        if (!characteristic) {
            throw new Error("Characteristic must be specified to get its value.");
        }
        if (this.data.characteristics[characteristic] == undefined || this.data.characteristics[characteristic] === null) {
            throw new Error(`Characteristic ${characteristic} not found in hero data.`);
        }

        return this.data.characteristics[characteristic];
    }

    getHighestCharacteristicValue(characteristics: CharacteristicType[]): number {
        const values = characteristics.map(
            key => this.data.characteristics[key]
        );

        return Math.max(...values);
    }

    private getPotencyValueModfierAsNumber(valueModifier: PotencyValueModfierType): number {
        return valueModifier === "weak"
            ? -2
            : valueModifier === "average"
                ? -1
                : 0;
    }
}
