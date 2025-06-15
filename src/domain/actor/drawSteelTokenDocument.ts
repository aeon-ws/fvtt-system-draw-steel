import { isEnemyActor, isHeroActor, isMinionActor } from "@utils/actor";
import { MinionTokenDocument } from "@minion/minionTokenDocument";
import { EnemyTokenDocument } from "@enemy/enemyTokenDocument";
import { IEnemyData } from "@enemy/enemyData";
import { IMinionData } from "@minion/minionData";
import { HeroTokenDocument } from "@hero/heroTokenDocument";
import { IHeroData } from "@hero/heroData";

export class DrawSteelTokenDocument extends TokenDocument {
    private _scene: Scene | null | undefined;
    private _delegate: EnemyTokenDocument<IEnemyData> | MinionTokenDocument<IMinionData> | HeroTokenDocument<IHeroData>

    constructor(createData: TokenDocument.CreateData, context: foundry.abstract.Document.ConstructionContext<Scene.Implementation>) {
        if (!createData) {
            throw new Error("createData is required.");
        }
        if (!createData.actorId) {
            throw new Error("createData must contain an actor with id.");
        }

        super(createData, context);

        if (!this.actor || !this.actor.id || !this.actor.type) {
            throw new Error("TokenDocument must have an actor with id and type.");
        }

        if (isMinionActor(this.actor)) {
            this._delegate = new MinionTokenDocument<IMinionData>(this, context.parent);
        }
        else if (isEnemyActor(this.actor)) {
            this._delegate = new EnemyTokenDocument<IEnemyData>(this, context.parent);
        }
        else if (isHeroActor(this.actor)) {
            this._delegate = new HeroTokenDocument<IHeroData>(this, context.parent);
        }
        else {
            throw new Error(`Unsupported actor type: ${this.actor.type}`);
        }
    }

    override prepareBaseData(): void {
        super.prepareBaseData();
        // Additional preparation logic for DrawSteelTokenDocument can be added here
    }
}
