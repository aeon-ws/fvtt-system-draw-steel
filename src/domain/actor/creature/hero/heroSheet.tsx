// src/ui/sheets/heroSheet.ts

import ReactDOM from "react-dom/client";

import { HeroSheetComponent } from "@hero/heroSheetComponent";
import { isHeroActor } from "@utils/actor";
import { IHeroData } from "@hero/heroData";


export class HeroSheet extends foundry.applications.sheets.ActorSheetV2 {
    private _actor: Actor;
    private _reactRoot?: ReactDOM.Root;
    private _reactContainer?: HTMLElement;

    constructor(options: Record<string, any> = {}) {
        super(options);

        if (!isHeroActor(options.document)) throw new Error("Cannot create HeroSheet for non-hero token.");

        console.log("ActorSheetV2 Default Options:", foundry.applications.sheets.ActorSheetV2.DEFAULT_OPTIONS);

        this._actor = options.document as Actor;
    }

    get system() { return this._actor.system as unknown as IHeroData; }

    override get title() {
        return `Hero: ${this.system.name}`;
    }

    static defaultOptions = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
        classes: ["draw-steel", "sheet", "actor", "enemy"],
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
            <HeroSheetComponent {...this.system} />
        );

        return this._reactContainer;
    }

    _replaceHTML(element: HTMLElement): void {
        const windowContent = this.element.querySelector('.window-content');
        windowContent?.classList.add("sheet");

        if (windowContent) {
            windowContent.innerHTML = "";
            windowContent.appendChild(element);
        }
        else {
            this.element.appendChild(element);
        }
    }
}
