
import { v4 as uuidv4 } from "uuid";

import { ActorTokenDocument } from "@data/actorTokenDocument";
import { IMinionData } from "@data/minionData";
import { MinionSquad } from "@data/minionSquad";
import { IStaminaBarConfig } from "@ui/adsToken";
import { isMinionToken } from "@utils/tokenDocument";


export class MinionTokenDocument<TActorData extends IMinionData = IMinionData> extends ActorTokenDocument<TActorData> {
    constructor(tokenDocument: TokenDocument, scene: Scene | null = null) {
        super(tokenDocument, scene);

        if (!isMinionToken(tokenDocument)) throw new Error("Cannot decorate non-minion token document.");
    }

    async getSquad(): Promise<MinionSquad> {
        if (!this.data.squadId) {
            console.log("MinionTokenDocument | constructor | No squad ID found in data.  Creating new squad ID...");
            this.data.squadId = uuidv4();
        }
        const squad = new MinionSquad(this.data);
        if (!squad.minions.map(minion => minion.id).includes(this.id)) {
            console.log("MinionTokenDocument | constructor | Current minion not found in squad minions list.  Adding...");
            await squad.addMinion(this.id);
        }
        return squad;
    }

    async applySquadTemporaryStamina(value: number): Promise<void> {
        if ((this.data.stamina.temporary ?? 0) < value) {
            await this.update({ system: { stamina: { temporary: value } } });
        }
    }

    override get staminaBarConfig(): IStaminaBarConfig {
        const stamina = this.data.stamina;
        const segmentCount = Math.max(this.data.squadMinionIds.length, 1);

        const barConfig = {
            max: stamina.max,
            min: stamina.min,
            value: stamina.value,
            segmentCount: segmentCount,
            showTicks: true
        };

        return barConfig;
    }

    async applyCaptainEffectsToMinions(): Promise<void> {
        const squad = await this.getSquad();
        await Promise.all(
            squad.minions.map(minion =>
                minion.applySquadTemporaryStamina(this.data.appliedCaptainEffects.temporaryStamina)
            )
        );
    }
}
