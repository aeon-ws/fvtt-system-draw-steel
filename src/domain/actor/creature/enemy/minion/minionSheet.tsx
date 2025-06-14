// src/sheets/minionSheet.ts

import ReactDOM from "react-dom/client";

import { MinionSheetComponent } from "@minion/minionSheetComponent";
import { IMinionData } from "@minion/minionData";
import { isMinionActor } from "@utils/actor";
import { IEnemyAbilityData } from "@enemy/enemyAbilityData";


export class MinionSheet extends foundry.applications.sheets.ActorSheetV2 {
    private _actor: Actor;
    private _reactRoot?: ReactDOM.Root;
    private _reactContainer?: HTMLElement;

    constructor(options: Record<string, any> = {}) {
        super(options);

        if (!isMinionActor(options.document)) throw new Error("Cannot create MinionSheet for non-minion token.");

        this._actor = options.document as Actor;
    }

    get system() { return this._actor.system as unknown as IMinionData; }

    override get title() {
        return `Enemy (${this.system.type}): ${this.system.name}`;
    }

    static defaultOptions = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
        classes: ["draw-steel", "sheet", "actor"],
        window: {
            resizable: true
        },
        position: {
            width: 588,
            height: 700
        },
    });

    async _renderHTML(context: object): Promise<HTMLElement> {
        // Create the React container if needed
        if (!this._reactContainer) {
            this._reactContainer = document.createElement("div");
            this._reactContainer.classList.add("react-root");
        }

        // Mount React inside this container
        if (!this._reactRoot) {
            this._reactRoot = ReactDOM.createRoot(this._reactContainer);
        }
        this._reactRoot.render(
            <MinionSheetComponent
                enemy={this.system}
                abilities={this.actor.items.map(item => item.system as unknown as IEnemyAbilityData)}
            />
        );

        return this._reactContainer;
    }

    _replaceHTML(element: HTMLElement): void {
        const windowContent = this.element.querySelector('.window-content');
        windowContent?.classList.add("sheet");

        const window = windowContent?.parentElement
        window?.classList.add("sheet-window");

        if (windowContent) {
            // Clear existing content
            windowContent.innerHTML = "";
            windowContent.appendChild(element);
        } else {
            // Fallback: just append (shouldn't really happen)
            this.element.appendChild(element);
        }
    }
}
