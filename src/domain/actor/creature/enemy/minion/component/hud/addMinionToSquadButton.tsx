
import { MinionTokenDocument } from "@minion/minionTokenDocument";
import { asMinionToken } from "@utils/tokenDocument";
import { JSX } from "react";


interface IMinionControlsProps {
    contextMinion: MinionTokenDocument;
}

export function AddMinionToSquadButton({ contextMinion }: IMinionControlsProps): JSX.Element | null {
    if (!contextMinion || !contextMinion.id) return null;

    const onAddMinionButtonClick = async () => {
        // Ensure that the context minion is a member of a squad, then get that squad.
        const squad = await contextMinion.getSquad();

        // Clone the context minion token.
        const protoData = foundry.utils.deepClone(contextMinion.tokenDocument.toObject());
        console.log("AddMinionToSquadButton | onAddMinionButtonClick | contextMinion:", contextMinion);
        console.log("AddMinionToSquadButton | onAddMinionButtonClick | game.scenes!.active!.tokens.contents:", game.scenes!.active!.tokens.contents);
        const tokenDocumentsOfTypeInScene = game.scenes!.active!.tokens.contents.filter(token => token!.actor!.id === contextMinion.actor.id);
        const minionNumbersInUseInScene = tokenDocumentsOfTypeInScene.map(td => td.name.replace(new RegExp("[^0-9]", "gi"), ""));
        console.log("AddMinionToSquadButton | onAddMinionButtonClick | minionNumbersInUseInScene:", minionNumbersInUseInScene);
        let minionNumberCandidate: number;
        for (minionNumberCandidate = 1; minionNumberCandidate <= minionNumbersInUseInScene.length + 1; minionNumberCandidate++) {
            console.log("AddMinionToSquadButton | onAddMinionButtonClick | minionNumberCandidate:", minionNumberCandidate);
            if (minionNumbersInUseInScene.filter(mn => mn === `${minionNumberCandidate}`).length === 0) {
                break;
            }
        }

        protoData.name = `${contextMinion.name.replace(new RegExp("[()0-9 ]*$", "gi"), "")} ${minionNumberCandidate}`;
        // Place the new minion token next to the context minion token.
        protoData.x = contextMinion.tokenDocument.x + (canvas?.grid?.sizeX ?? 0);
        protoData.y = contextMinion.tokenDocument.y;

        // Create the new minion token in the scene.
        const createdDocs = await canvas.scene?.createEmbeddedDocuments("Token", [protoData]);
        if (createdDocs && createdDocs.length) {
            const newToken = createdDocs[0];
            const newMinion = asMinionToken(newToken);
            if (!newMinion || !newMinion.id) return;
            // Add the new minion to the squad.
            await squad.addMinion(newMinion.id);
        }
    };

    return (
        <div className="minion-controls">
            <button type="button" className="ads-add-minion-to-squad" title="Add Minion to Squad" onClick={onAddMinionButtonClick}>
                <i className="fas fa-plus"> </i>
            </button>
        </div>
    );
};
