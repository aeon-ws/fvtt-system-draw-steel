// src/domain/actor/creature/enemy/enemySheet.ts

import ReactDOM from "react-dom/client";

import { isMinionActor } from "@utils/actor";
import { IEnemyAbilityData } from "@enemy/enemyAbilityData";
import React from "react";
import { MinionSheetComponent } from "@minion/component/minionSheetComponent";
import { IMinionData } from "@minion/minionData";


export class MinionSheet extends foundry.applications.sheets.ActorSheetV2 {
    private _actor: Actor;
    private _reactRoot?: ReactDOM.Root;
    private _reactContainer?: HTMLElement;
    private _formRef: React.RefObject<HTMLFormElement | null>;

    constructor(options: Record<string, any> = {}) {
        super(options);

        if (!isMinionActor(options.document)) throw new Error("Cannot create EnemySheet for non-enemy token.");

        this._actor = options.document as Actor;
        this._formRef = React.createRef();
    }

    get system() { return this._actor.system as unknown as IMinionData; }

    override get title() {
        return `Enemy ${this.system.type}: ${this.system.name}`;
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
                ref={this._formRef}
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
        }
        else {
            // Fallback: just append (shouldn't really happen)
            this.element.appendChild(element);
        }

        setTimeout(() => this.autosizeToContent(), 0);
    }

    autosizeToContent() {
        const form = this._formRef.current;
        if (!form) return;
        // Add some buffer to avoid scrollbar
        const padding = 74;
        const height = form.offsetHeight + padding;
        const maxHeight = Math.min(height, 1200);
        //this.setPosition({ height: maxHeight });

        const windowContent = this.element.querySelector('.window-content') as HTMLElement;
        if (windowContent && windowContent.parentElement && windowContent.parentElement.style) {
            console.log("Setting max height for window content:", maxHeight);
            windowContent.parentElement.style.maxHeight = `${maxHeight}px`;
        }
    }
}
