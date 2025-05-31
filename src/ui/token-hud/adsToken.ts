
import { asEnemyToken, asMinionToken, asHeroToken } from "@utils/tokenDocument";


export interface IStaminaBarConfig {
    max: number;
    min: number;
    value: number;
    segmentCount: number;
    showTicks: boolean;
}

export class AdsToken extends Token {
    // Store a reference to your custom bar for cleanup
    _customBar: PIXI.Graphics | null = null;
    _customBarOverlay: PIXI.Graphics | null = null;
    _customBarMask: PIXI.Graphics | null = null;
    _customBarText: PIXI.Text | null = null;

    override _refreshNameplate(): void {
        super._refreshNameplate();

        if (!this.actor) {
            console.log("Aeon-Draw-Steel | No actor found for token, skipping state refresh.");
            return;
        }
        if (!this.document) {
            console.log("Aeon-Draw-Steel | No document found for token, skipping state refresh.");
            return;
        }

        if (!this.nameplate) {
            this.nameplate = new PreciseText();
        }
        // console.log("Aeon-Draw-Steel | Setting token nameplate style.");
        this.nameplate.style = new PIXI.TextStyle({
            fontFamily: "Roboto, sans-serif",
            fontSize: 15,
            fill: "#ffffff",
            align: "center",
            stroke: "#000000",
            strokeThickness: 2,
        });
    }

    // Override drawBars to insert your custom bar
    override drawBars(): void {
        if (!this.actor) return; // Defensive: actor is set by Foundry on first draw
        if (!this.bars) return; // Defensive: bars is set by Foundry on first draw
        if (!this.document) return; // Defensive: document is set by Foundry on first draw

        // Remove any existing custom bar (store a reference to it for easy cleanup)
        if (this._customBar) {
            this._customBar.destroy({ children: true });
            this._customBar = null;
        }

        const token = asEnemyToken(this.document) ?? asMinionToken(this.document) ?? asHeroToken(this.document);
        if (!token) {
            // console.error(`Couldn't resolve token document decorator for token ${this} and token document ${this.document}`);
            return;
        }

        const barConfig = token.staminaBarConfig;
        if (!barConfig) {
            // console.error(`Couldn't resolve bar configuration for token document ${this.document}`);
            return;
        }

        this.drawSegmentedBar(
            this.bars,
            barConfig.min,
            barConfig.max,
            barConfig.value,
            barConfig.segmentCount,
            barConfig.showTicks,
            this.w,
            this.h
        );
    }

    drawSegmentedBar(
        parent: PIXI.Container,
        minValue: number,
        maxValue: number,
        currentValue: number,
        segmentCount: number,
        showTicks: boolean,
        parentTokenWidth: number,
        parentTokenHeight: number
    ): void {
        parent.removeChildren();

        const bar = new PIXI.Graphics();

        const segmentFraction = 1 / segmentCount;
        const barHeight = Math.max(17, Math.floor(parentTokenHeight * 0.10));
        const barWidth = parentTokenWidth - 2;
        const cornerRadius = barHeight / 2;

        const isValueZeroOrBelow = currentValue <= 0;
        let fillColor = isValueZeroOrBelow ? "#660000" : "#bb0000"; // e.g., red or green

        let fillFraction = 1;
        if (isValueZeroOrBelow) {
            // Dying
            const maxNegative = Math.abs(minValue);
            fillFraction = Math.min(1, (maxNegative - Math.abs(currentValue)) / maxNegative);
        }
        else {
            // Healthy | Winded
            fillFraction = Math.min(1, currentValue / maxValue);
        }

        bar.beginFill(new PIXI.Color(fillColor).toHex(), 1);
        bar.drawRoundedRect(0, 0, barWidth, barHeight, cornerRadius);
        bar.endFill();

        // Draw ticks if enabled (skip final edge)
        if (showTicks && segmentCount > 1) {
            bar.lineStyle(1, 0x000000, 1);
            for (let i = 1; i < segmentCount; i++) {
                const tickX = Math.round(i * segmentFraction * barWidth);
                bar.moveTo(tickX, 0);
                bar.lineTo(tickX, barHeight);
            }
            bar.lineStyle(0, 0, 0); // Reset
        }

        // Place the bar at the bottom left of the token with equal padding on either side.
        bar.x = (parentTokenWidth - barWidth) / 2;
        bar.y = parentTokenHeight - barHeight;
        bar.zIndex = 70;

        const barOverlay = new PIXI.Graphics();
        barOverlay.beginFill(0x000000, 1);
        barOverlay.drawRect(fillFraction * barWidth, 0, (1 - fillFraction) * barWidth, barHeight);
        barOverlay.endFill();

        // Place the overlay bar on top of the primary bar.
        barOverlay.x = bar.x;
        barOverlay.y = bar.y;
        barOverlay.zIndex = 80;

        // Create the mask (matches bar shape).
        const barMask = new PIXI.Graphics();
        barMask.beginFill(0xFF3300, 1);
        barMask.drawRoundedRect(0, 0, barWidth, barHeight, cornerRadius);
        barMask.endFill();

        // Place the bar mask on top of the overlay bar.
        barMask.x = bar.x;
        barMask.y = bar.y;
        barMask.zIndex = 90;

        // Apply the mask to the overlay bar.
        barOverlay.mask = barMask;

        // Add text label in the center of the bar.
        const textStyle = new PIXI.TextStyle({
            fontFamily: "Roboto, sans-serif",
            fontSize: barHeight,
            fontWeight: "500",
            fill: "#ffffff",
            align: "center",
            textBaseline: "alphabetic",
        });

        const label = isValueZeroOrBelow
            ? `${currentValue} / ${maxValue}`
            : `${currentValue} / ${maxValue}`;
        const text = new PIXI.Text(label, textStyle);

        // Center the text in the bar.
        text.anchor.set(0.5, 0.5);
        text.x = parentTokenWidth / 2;
        text.y = parentTokenHeight - (barHeight / 2);
        text.zIndex = 100;

        parent.addChild(bar, barOverlay, barMask, text);
        parent.sortChildren();

        this._customBar = bar;
        this._customBarOverlay = barOverlay;
        this._customBarMask = barMask;
        this._customBarText = text;
    }
}
