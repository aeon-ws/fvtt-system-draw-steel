
import { IHeroData } from "@hero/heroData";
import { IEnemyData } from "@enemy/enemyData";
import { IMinionData } from "@minion/minionData";


export function getActor(id: string): Actor | null {
    const actor = game.actors?.get(id);

    return actor as Actor | null;
}

export function getActorDecorator<TActorDecorator>(actorId: string, DecoratorClass: new (actor: Actor) => TActorDecorator): TActorDecorator | null {
    const actor = getActor(actorId);
    if (!actor) {
        console.warn(`Actor with ID ${actorId} not found.`);
        return null;
    }

    return new DecoratorClass(actor);
}

export function getActorTypeAsString<T extends foundry.documents.BaseActor>(actor: T): string {
    return actor.type as unknown as string;
}

export function isHeroActor(actor: foundry.documents.BaseActor): actor is Actor & { system: IHeroData } {
    return getActorTypeAsString(actor) === "hero";
}

export function isEnemyActor(actor: foundry.documents.BaseActor): actor is Actor & { system: IEnemyData } {
    return getActorTypeAsString(actor) === "enemy";
}

export function isMinionActor(actor: foundry.documents.BaseActor): actor is Actor & { system: IMinionData } {
    return getActorTypeAsString(actor) === "minion";
}
