
import { IStaminaBarConfig } from "@ui/adsToken";
import { IActorData } from "@data/actorData";


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
        return this.name;
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
        // @ts-ignore
        const isLinked = this._tokenDocument.actorLink.valueOf() ?? this._actor.actorLink ?? false;

        await this._actor.update(updates);

        if (isLinked) {
            // Since the actor is linked, the prototype actor will be updated: the update will persist and
            // propagate to all linked tokens.
            
        }
        else {
            // Since actor isn't linked, the token document must be updated instead; otherwise, the update
            // will be lost when the token is reloaded (e.g., when Foundry is shut down or the scene is
            // reloaded).
            await this._tokenDocument.update(updates);
        }
    }
}
