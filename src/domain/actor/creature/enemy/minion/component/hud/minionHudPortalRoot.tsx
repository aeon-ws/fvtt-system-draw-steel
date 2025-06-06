// MinionHudPortalRoot.tsx

import { JSX } from "react";

import { AddMinionToSquadButton } from "@minion/addMinionToSquadButton";
import { AddCaptainToSquadButton } from "@minion/addCaptainToSquadButton";
import { MinionTokenDocument } from "@minion/minionTokenDocument";
import { createPortal } from "react-dom";

// Props: you pass in the DOM nodes you want to use as portals.
export function MinionHudPortalRoot({
    leftCol,
    rightCol,
    contextMinion
}: {
    leftCol: HTMLElement | null,
    rightCol: HTMLElement | null,
    contextMinion: MinionTokenDocument
}): JSX.Element {
    return (
        <>
            {leftCol && createPortal(<AddCaptainToSquadButton contextMinion={contextMinion} />, leftCol)}
            {rightCol && createPortal(<AddMinionToSquadButton contextMinion={contextMinion} />, rightCol)}
        </>
    );
}
