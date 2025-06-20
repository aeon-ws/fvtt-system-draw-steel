import { asEnemyToken, asMinionToken, getToken, isEnemyToken } from "@utils/tokenDocument";
import { MinionTokenDocument } from "@minion/minionTokenDocument";
import { EnemyTokenDocument } from "@enemy/enemyTokenDocument";
import { IMinionData } from "@minion/minionData";


// Global map to store current squad highlights.
// Effectively available for the duration of the current user session.
const CurrentSquadHighlights = new Map<string, PIXI.Text>();

export function clearSquadSymbol() {
    for (let [_, highlight] of CurrentSquadHighlights.entries()) {
        if (highlight.parent) highlight.parent.removeChild(highlight);
    }
    CurrentSquadHighlights.clear();
}

export function addSquadSymbolToToken(canvasToken: Token | null | undefined, isEnemyToken: boolean = false) {
    if (!canvasToken) return;

    const textStyle = new PIXI.TextStyle({
        fill: 0xffaa00,
        fontFamily: "Font Awesome 6 Pro",
        fontSize: 24,
        fontWeight: "400",
        stroke: "#000000",
        strokeThickness: 2,
    });
    const symbol = new PIXI.Text(isEnemyToken ? "\uf6a5" : "\uf500", textStyle);
    symbol.anchor.set(1, 0);
    symbol.position.set(canvasToken.w - 5, 5);
    symbol.zIndex = 3;

    canvasToken.addChildAt(symbol, 0);
    CurrentSquadHighlights.set(canvasToken.id, symbol);
}

export function addSquadSymbolToSquad(scene: Scene, contextEnemyOrMinion: EnemyTokenDocument | MinionTokenDocument) {
    clearSquadSymbol();

    const contextSquadId = contextEnemyOrMinion.data.squadId;
    if (!scene || !contextEnemyOrMinion.id || !contextSquadId) return;

    scene.tokens.forEach(tokenDocument => {
        const currentEnemyOrMinion = asMinionToken(tokenDocument) || asEnemyToken(tokenDocument);
        if (!currentEnemyOrMinion) return;

        const currentSquadId = currentEnemyOrMinion.data.squadId;
        if (!currentSquadId) return;

        if (currentSquadId === contextSquadId) {
            addSquadSymbolToToken(currentEnemyOrMinion?.tokenDocument.object, isEnemyToken(currentEnemyOrMinion.tokenDocument));
        }
    });
}

export class MinionSquad {
    private _contextMinionData: IMinionData;

    constructor(contextMinionData: IMinionData) {
        this._contextMinionData = contextMinionData;
    }

    get squadId(): string {
        return this._contextMinionData.squadId;
    }

    get captainId(): string {
        return this._contextMinionData.captainId;
    }

    get minionCount(): number {
        return this.minionIds.length;
    }

    get minionIds(): string[] {
        return this._contextMinionData.squadMinionIds;
    }

    get minions(): MinionTokenDocument[] {
        return this.minionIds
            .map(id => getToken(id, MinionTokenDocument))
            .filter(minion => minion !== null);
    }

    get captain(): EnemyTokenDocument | null {
        return getToken(this.captainId, EnemyTokenDocument);
    }

    async addCaptain(newCaptain: EnemyTokenDocument): Promise<void> {
        console.log("MinionSquad | addCaptain | newCaptain:", newCaptain);
        console.log("MinionSquad | addCaptain | current Captain ID:", this.captainId);
        if (this.captainId !== newCaptain.id) {
            // Remove any existing captain from the squad before adding the new one.
            await this.removeCaptain({ updateSquad: false });
        }

        if (newCaptain.data.squadId && newCaptain.data.squadId !== this.squadId) {
            console.warn("MinionSquad | addCaptain | new captain already belongs to a different squad, removing from that squad first.");
            const captainFormerSquadMinion = canvas!.tokens!.placeables
                .map(token => {
                    if (token.document.actor) {
                        return asMinionToken(token.document);
                    }
                })
                .find(minion => {
                    return minion && minion.data.squadId === newCaptain.data.squadId;
                });
            if (captainFormerSquadMinion) {
                console.log("MinionSquad | addCaptain | removing captain from previous squad:", captainFormerSquadMinion.id);
                const squad = await captainFormerSquadMinion.getSquad();
                await squad.removeCaptain({ updateSquad: true });
            }
        }
        console.log("MinionSquad | addCaptain | previous captain removed, setting new captain:", newCaptain.id);
        this._contextMinionData.captainId = newCaptain.id;
        await newCaptain.update({ system: { squadId: this.squadId } });

        console.log("MinionSquad | addCaptain | new captain set, updating squad");
        await this.updateSquad();
    }

    async removeCaptain({ updateSquad = true }: { updateSquad: boolean }): Promise<void> {
        console.log("MinionSquad | removeCaptain | updateSquad:", updateSquad);
        if (!this._contextMinionData.captainId) return;

        const previousCaptain = getToken(this.captainId, EnemyTokenDocument);
        if (previousCaptain) {
            await previousCaptain.update({ system: { squadId: "" } });
        }

        this._contextMinionData.captainId = "";

        if (!updateSquad) return;

        await this.updateSquad();
    }

    async removeMinion(minionId: string): Promise<void> {
        if (!this.minionIds.includes(minionId)) return;

        this._contextMinionData.squadMinionIds = this.minionIds.filter(id => id !== minionId);

        await this.updateSquad();
    }

    async addMinion(minionId: string): Promise<void> {
        if (this.minionIds.includes(minionId)) return;

        this.minionIds.push(minionId);
        if (this.minionIds.length > 1) {
            this._contextMinionData.stamina.value += this._contextMinionData.stamina.perMinion;
        }

        await this.updateSquad();
    }

    async modifySquadStaminaValue(delta: number): Promise<void> {
        const current = this._contextMinionData.stamina.value;
        const normalizedNewValue = Math.max(Math.min(current + delta, this._contextMinionData.stamina.max), 0);

        if (current !== normalizedNewValue) {
            this._contextMinionData.stamina.value = normalizedNewValue;

            await this.updateSquad();
        }
    }

    async setSquadStaminaValue(newValue: number): Promise<void> {
        const current = this._contextMinionData.stamina.value;
        const normalizedNewValue = Math.max(Math.min(newValue, this._contextMinionData.stamina.max), 0);

        if (current !== normalizedNewValue) {
            this._contextMinionData.stamina.value = normalizedNewValue;

            await this.updateSquad();
        }
    }

    async updateSquad(): Promise<void> {
        console.log("MinionSquad | updateSquad | squadId:", this.squadId, "captainId:", this.captainId, "minionCount:", this.minionCount);
        const minions = this.minions;
        const staminaMax = Math.max(this.minions.length, 1) * this._contextMinionData.stamina.perMinion;
        const staminaValue = Math.min(this._contextMinionData.stamina.value, staminaMax);

        await Promise.all(this.minions.map(async (squadMinion: MinionTokenDocument) => {
            await squadMinion.update({
                system: {
                    captainId: this.captainId,
                    squadId: this.squadId,
                    squadMinionIds: minions.map(minion => minion.id),
                    stamina: {
                        max: staminaMax,
                        value: staminaValue
                    }
                }
            });
        }));

        minions.forEach(async (squadMinion: MinionTokenDocument) => {
            squadMinion.tokenDocument.render(true);
        });
    }
}
