// src/sheets/enemySheet.ts

import ReactDOM from "react-dom/client";

import { EnemySheetComponent } from "@enemy/enemySheetComponent";
import { isEnemyActor } from "@utils/actor";
import { IEnemyData } from "@enemy/enemyData";


export class EnemySheet extends foundry.applications.sheets.ActorSheetV2 {
    private _actor: Actor;
    private _reactRoot?: ReactDOM.Root;
    private _reactContainer?: HTMLElement;

    constructor(options: Record<string, any> = {}) {
        super(options);

        if (!isEnemyActor(options.document)) throw new Error("Cannot create EnemySheet for non-enemy token.");

        this._actor = options.document as Actor;
    }

    get system() { return this._actor.system as unknown as IEnemyData; }

    override get title() {
        return `Enemy ${this.system.type}: ${this.system.name}`;
    }

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
            <EnemySheetComponent
                {...this.system}
                onChangeResource={async (delta: number) => {
                    const newValue = this.system.stamina.value + delta;
                    await this._actor.update({ "system.stamina.value": newValue });
                }}
            />
        );

        return this._reactContainer;
    }

    _replaceHTML(element: HTMLElement): void {
        // Instead of replacing the entire sheet element,
        // inject your React root into the ".window-content" section
        const windowContent = this.element.querySelector('.window-content');
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
