
import { IHeroData } from "@data/heroData";
import { IEnemyData } from "@data/enemyData";
import { IMinionData } from "@data/minionData";
import { getActorTypeAsString } from "@utils/actor";
import { MinionTokenDocument } from "@data/minionTokenDocument";
import { EnemyTokenDocument } from "@data/enemyTokenDocument";
import { HeroTokenDocument } from "@data/heroTokenDocument";


export function getTokenDocument(id: string): TokenDocument | null {
    const tokenDocument = canvas.scene?.tokens.get(id);

    return tokenDocument as TokenDocument | null;
}

export function getToken<TTokenDecorator>(id: string, DecoratorClass: new (actor: TokenDocument) => TTokenDecorator): TTokenDecorator | null {
    const tokenDocument = getTokenDocument(id);
    if (!tokenDocument) {
        return null;
    }

    return new DecoratorClass(tokenDocument);
}

export function isHeroToken(tokenDocument: TokenDocument): tokenDocument is TokenDocument & { actor: { system: IHeroData } } {
    return getActorTypeAsString(tokenDocument.actor as Actor) === "hero";
}

export function asHeroToken(tokenDocument: TokenDocument): HeroTokenDocument | null {
    return isHeroToken(tokenDocument) ? new HeroTokenDocument(tokenDocument) : null;
}

export function isEnemyToken(tokenDocument: TokenDocument): tokenDocument is TokenDocument & { actor: { system: IEnemyData } } {
    return getActorTypeAsString(tokenDocument.actor as Actor) === "enemy";
}

export function asEnemyToken(tokenDocument: TokenDocument): EnemyTokenDocument | null {
    return isEnemyToken(tokenDocument) ? new EnemyTokenDocument(tokenDocument) : null;
}

export function isMinionToken(tokenDocument: TokenDocument): tokenDocument is TokenDocument & { actor: { system: IMinionData } } {
    return getActorTypeAsString(tokenDocument?.actor as Actor) === "minion";
}

export function asMinionToken(tokenDocument: TokenDocument): MinionTokenDocument | null {
    return isMinionToken(tokenDocument) ? new MinionTokenDocument(tokenDocument) : null;
}
