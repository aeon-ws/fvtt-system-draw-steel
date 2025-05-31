
import { IEnemyData } from "@data/enemyData";
import { ActorTokenDocument } from "@data/actorTokenDocument";
import { isEnemyToken } from "@utils/tokenDocument";


export class EnemyTokenDocument<TActorData extends IEnemyData = IEnemyData> extends ActorTokenDocument<TActorData> {
    constructor(tokenDocument: TokenDocument, scene: Scene | null = null) {
        super(tokenDocument, scene);

        if (!isEnemyToken(tokenDocument)) throw new Error("Cannot decorate non-enemy token document.");
    }
}
