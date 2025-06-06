
import { IHeroData } from "@hero/heroData";
import { ActorTokenDocument } from "@actor/actorTokenDocument";
import { isHeroToken } from "@utils/tokenDocument";


export class HeroTokenDocument<TActorData extends IHeroData = IHeroData> extends ActorTokenDocument<TActorData> {
    constructor(tokenDocument: TokenDocument, scene: Scene | null = null) {
        super(tokenDocument, scene);

        if (!isHeroToken(tokenDocument)) throw new Error("Cannot decorate non-hero token document.");
    }
}
