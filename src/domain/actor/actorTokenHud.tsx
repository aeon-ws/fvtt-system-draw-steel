// src/ui/token-hud/actorTokenHud.tsx

import ReactDOM from "react-dom/client";

import { asHeroToken, asMinionToken } from "@utils/tokenDocument";
import { HeroTokenDocument } from "@hero/heroTokenDocument";
import { MinionHudPortalRoot } from "@minion/minionHudPortalRoot";


export class ActorTokenHud extends foundry.applications.hud.TokenHUD {
    private _reactPortalRootContainer: HTMLDivElement | null = null;
    private _reactPortalRoot: ReactDOM.Root | null = null;

    override close(...args: any[]) {
        if (this._reactPortalRoot) {
            this._reactPortalRoot.unmount();
            this._reactPortalRoot = null;
        }
        if (this._reactPortalRootContainer) {
            this._reactPortalRootContainer.remove();
            this._reactPortalRootContainer = null;
        }
        return super.close(...args);
    }

    override async _renderHTML(context: any, options: any): Promise<any> {
        const resultElements = await super._renderHTML(context, options);

        const hudElement = resultElements.hud as HTMLElement;
        if (!hudElement || !this.document) return resultElements;

        // If this is a hero token, override the default stamina input handling (i.e., the box that
        // allows you to increase, decrease, or directly set stamina.value).
        const heroToken = asHeroToken(this.document);
        if (heroToken) {
            this.overrideStaminaInputBox(hudElement, heroToken);
        }

        // Get columns in the HUD
        const leftColElement = hudElement.querySelector('.col.left') as HTMLElement | null;
        const rightColElement = hudElement.querySelector('.col.right') as HTMLElement | null;

        // Prepare your token (you may have different logic here)
        const minion = asMinionToken(this.document);
        if (!minion || !minion.data) return resultElements;

        // Set up the single React root container if not already done
        if (!this._reactPortalRootContainer) {
            this._reactPortalRootContainer = document.createElement("div");
            this._reactPortalRootContainer.classList.add("react-portal-root");
            // Attach this root container *anywhere* (it won't render anything visible itself)
            // It's fine to put it in hudElement, or even document.body; it just needs to persist
            hudElement.appendChild(this._reactPortalRootContainer);
        }

        this._reactPortalRoot ??= ReactDOM.createRoot(this._reactPortalRootContainer);

        // Render the React component that will portal into the columns
        this._reactPortalRoot.render(
            <MinionHudPortalRoot leftCol={leftColElement} rightCol={rightColElement} contextMinion={minion} />
        );

        return resultElements;
    }

    private overrideStaminaInputBox(hudElement: HTMLElement, heroToken: HeroTokenDocument) {
        const barInput = hudElement.querySelector('input[name="bar1"]') as HTMLInputElement | null;
        if (barInput) {
            barInput.onchange = async (event) => {
                event.preventDefault();
                event.stopPropagation();

                const data = heroToken.data;
                const minValue = data.stamina.min;
                const maxValue = data.stamina.max;
                const current = data.stamina.value;
                let newValue = current;

                const entered = String(barInput.value).trim();
                if (!entered) {
                    return;
                }
                if (entered.startsWith("=")) {
                    newValue = Math.max(minValue, Math.min(maxValue, Number(entered.slice(1))));
                }
                else if (entered.startsWith("+") || entered.startsWith("-")) {
                    const delta = Number(entered);
                    newValue = Math.max(minValue, Math.min(maxValue, current + delta));
                }
                else {
                    newValue = Math.max(minValue, Math.min(maxValue, Number(entered)));
                }

                console.log(`renderTokenHud | stamina.value: [${current}] --> [${newValue}]`);
                await heroToken.update({ system: { stamina: { value: newValue } } });

                barInput.value = String(newValue);
            };
        }
    }

    override _replaceHTML(resultElements: any, containerElement: HTMLElement, options: any): void {
        super._replaceHTML(resultElements, containerElement, options);
    }
}
