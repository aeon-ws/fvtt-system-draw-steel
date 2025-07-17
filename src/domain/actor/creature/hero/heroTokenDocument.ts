
import { IHeroData } from "@hero/heroData";
import { ActorTokenDocument } from "@actor/actorTokenDocument";
import { isHeroToken } from "@utils/tokenDocument";
import { IPotencyEffectData, IPowerRollData, PotencyValueModfierType } from "@actor/actorAbilityData";
import { CharacteristicType } from "@creature/creatureData";


export class HeroTokenDocument<TActorData extends IHeroData = IHeroData> extends ActorTokenDocument<TActorData> {
    constructor(tokenDocument: TokenDocument, scene: Scene | null = null) {
        super(tokenDocument, scene);

        if (!isHeroToken(tokenDocument)) throw new Error("Cannot decorate non-hero token document.");
    }

    getPowerRollBonus(powerRoll?: IPowerRollData): number {
        if (!powerRoll?.characteristic) {
            throw new Error("Power roll characteristic must be specified for all power rolls of hero abilities.");
        }

        return this.getHighestCharacteristicValue(powerRoll.characteristic);
    }

    getPotencyValue(potencyEffect?: IPotencyEffectData | null): number {
        if (potencyEffect?.value === undefined || potencyEffect.value === null) {
            throw new Error("Potency value must be specified for all potency effects of non-hero abilities.");
        }

        return this.getCharacteristicValue(potencyEffect.valueCharacteristic) + this.getPotencyValueModfierAsNumber(potencyEffect.valueModifier);
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

    private getPotencyValueModfierAsNumber(valueModifier: PotencyValueModfierType | null | undefined): number {
        if (valueModifier === undefined || valueModifier === null) {
            throw new Error("Potency value modifier must be specified for all potency effects of hero abilities.");
        }

        return valueModifier === "weak"
            ? -2
            : valueModifier === "average"
                ? -1
                : 0;
    }
}
