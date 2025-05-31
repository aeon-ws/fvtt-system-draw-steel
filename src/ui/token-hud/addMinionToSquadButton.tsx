
import { MinionTokenDocument } from "@data/minionTokenDocument";
import { asMinionToken } from "@utils/tokenDocument";


interface IMinionControlsProps {
    contextMinion: MinionTokenDocument;
}

export function AddMinionToSquadButton({ contextMinion }: { contextMinion: MinionTokenDocument }) {
    if (!contextMinion || !contextMinion.id) return null;

    const onAddMinionButtonClick = async () => {
        // Ensure that the context minion is a member of a squad, then get that squad.
        const squad = await contextMinion.getSquad();

        // Clone the context minion token.
        const protoData = foundry.utils.deepClone(contextMinion.tokenDocument.toObject());
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
