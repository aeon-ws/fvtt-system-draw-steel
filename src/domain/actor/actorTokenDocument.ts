
import { IStaminaBarConfig } from "@actor/actorToken";
import { IActorData } from "@actor/actorData";
import { IPotencyEffectData, IPowerRollData } from "./actorAbilityData";


export class ActorTokenDocument<TActorData extends IActorData> {
    private _actor: Actor;
    private _tokenDocument: TokenDocument;

    id: string;
    scene: Scene | null;
    

    constructor(tokenDocument: TokenDocument, scene: Scene | null = null) {
        if (!tokenDocument) {
            throw new Error("TokenDocument is required");
        }
        if (!tokenDocument.actor || !tokenDocument.actor.id || !tokenDocument.actor.type) {
            throw new Error("TokenDocument must have an actor with id and type");
        }

        this._tokenDocument = tokenDocument;
        this._actor = tokenDocument.actor;

        this.id = String(tokenDocument.id);
        this.scene = scene;
    }

    get tokenDocument(): TokenDocument {
        return this._tokenDocument;
    }

    get actor(): Actor {
        return this._actor;
    }

    get data(): TActorData {
        return this._actor.system as unknown as TActorData;
    }

    get name(): string {
        return this._tokenDocument.name;
    }

    get type(): string {
        return this._actor.type;
    }

    get staminaBarConfig(): IStaminaBarConfig {
        const stamina = this.data.stamina;
        const segmentCount = this.data.deadThreshold == this.data.dyingThreshold ? 2 : 3;

        return {
            max: stamina.max,
            min: stamina.min,
            value: stamina.value,
            segmentCount: segmentCount,
            showTicks: false
        };
    }

    async update(updates: any): Promise<void> {
        await this._actor.update(updates);
    }

    getPowerRollBonus(powerRoll?: IPowerRollData): number {
        if (powerRoll?.bonus === undefined || powerRoll.bonus === null) {
            throw new Error("Power roll bonus must be specified for all power rolls of non-hero abilities.");
        }

        return powerRoll.bonus;
    }

    getPotencyValue(potencyEffect?: IPotencyEffectData | null): number {
        if (potencyEffect?.value === undefined || potencyEffect.value === null) {
            throw new Error("Potency value must be specified for all potency effects of non-hero abilities.");
        }

        return potencyEffect.value;
    }
}
