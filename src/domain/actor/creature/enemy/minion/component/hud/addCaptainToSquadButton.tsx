
import { EnemyTokenDocument } from "@enemy/enemyTokenDocument";
import { MinionTokenDocument } from "@minion/minionTokenDocument";
import { getToken } from "@utils/tokenDocument";
import { JSX } from "react";


export function AddCaptainToSquadButton({ contextMinion }: { contextMinion: MinionTokenDocument }): JSX.Element | null {
    const onAddCaptainButtonClick = async () => {
        const token = await awaitSingleTokenSelection();
        if (token) {
            const captain = getToken(token.id, EnemyTokenDocument);
            if (!captain) {
                ui.notifications!.error("Selected token is not a valid enemy token.");
                return;
            }

            // Ensure that the context minion is a member of a squad, then get that squad.
            const squad = await contextMinion.getSquad();

            // Add the selected token to the squad as a captain, in the process dismissing any previously
            // attached captain.
            await squad.addCaptain(captain);
            console.log("onAddCaptainButtonClick | Captain added to squad:", captain);
        }
        else {
            ui.notifications!.info("No token selected.");
        }
    };

    return (
        <div className="minion-controls">
            <button type="button" className="ads-add-captain-to-squad" title="Add Captain to Squad" onClick={onAddCaptainButtonClick}>
                <i className="fas fa-crown"> </i>
            </button>
        </div>
    );
}

function pointInTokenBounds(token: Token, px: number, py: number): boolean {
    return (
        px >= token.x &&
        px < token.x + token.w &&
        py >= token.y &&
        py < token.y + token.h
    );
}

/**
* Prompts the user to select a token by clicking. While active:
* - On-hover: token highlights as if targeted.
* - On-click: returns the clicked token, or undefined if clicking empty space.
* - ESC: cancels selection, returns undefined.
* - All default click/hover behaviors are suppressed.
*/
async function awaitSingleTokenSelection(): Promise<Token | undefined> {
    return new Promise((resolve) => {
        let hoveredToken: Token | null = null;
        let done = false;

        // Helper to clean up listeners and highlights
        function cleanup() {
            if (!canvas || !canvas.tokens || !canvas.stage) return;
            if (done) return;

            done = true;
            canvas.stage.off("pointermove", onPointerMove);
            canvas.stage.off("pointerdown", onPointerDown);
            window.removeEventListener("keydown", onKeyDown, true);
            if (hoveredToken) {
                hoveredToken.setTarget(false, { releaseOthers: false });
                hoveredToken = null;
            }

            if (!ui.notifications) return;

            ui.notifications.info("Selection mode ended.");
        }

        if (!ui.notifications) return;
        ui.notifications.info("Selection mode: Click a token to select, click empty space or press ESC to cancel.");

        // Highlight token on hover
        function onPointerMove(event: PIXI.FederatedPointerEvent) {
            if (done) return;
            if (!canvas || !canvas.tokens) return;

            const pos = event.getLocalPosition(canvas.tokens?.children[0]?.parent || canvas.tokens);
            let found: Token | null = null;
            for (const t of canvas.tokens?.placeables || []) {
                if (t.hitArea && t.hitArea.contains(pos.x - t.x, pos.y - t.y)) {
                    found = t;
                    break;
                }
            }
            if (found !== hoveredToken) {
                if (hoveredToken) hoveredToken.setTarget(false, { releaseOthers: false });
                hoveredToken = found;
                if (hoveredToken) hoveredToken.setTarget(true, { releaseOthers: false });
            }
        }

        function onPointerDown(event: MouseEvent) {
            if (done) return;
            if (!canvas || !canvas.tokens || !canvas.stage || !canvas.app || !canvas.app.view) return;
            
            event.stopImmediatePropagation();
            event.preventDefault();

            const px = event.clientX - (canvas.app.view as any).getBoundingClientRect().x;
            const py = event.clientY - (canvas.app.view as any).getBoundingClientRect().y;
            const pos = canvas.stage.toLocal(new PIXI.Point(px, py));

            let selected: Token | undefined;
            for (const t of canvas.tokens?.placeables || []) {
                if (pointInTokenBounds(t, pos.x, pos.y)) {
                    selected = t;
                    break;
                }
            }
            if (hoveredToken) hoveredToken.setTarget(false, { releaseOthers: false });
            cleanup();
            resolve(selected);
        }

        (canvas!.app!.view as any).addEventListener("mousedown", onPointerDown as any, { once: true });

        // Handle ESC: cancel selection
        function onKeyDown(event: KeyboardEvent) {
            if (done) return;
            if (event.key === "Escape") {
                event.preventDefault();
                if (hoveredToken) hoveredToken.setTarget(false, { releaseOthers: false });
                cleanup();
                resolve(undefined);
            }
        }

        if (!canvas || !canvas.stage) return;

        canvas.stage.on("pointermove", onPointerMove);
        canvas.stage.on("pointerdown", onPointerDown);
        window.addEventListener("keydown", onKeyDown, true);
    });
}
