import { IActorData } from '@domain/actor/actorData.js';

export interface TierResult {
    tier: number;
    symbol: string;
    description: string;
}

export interface PowerRollOptions {
    baseBonus: number;
    edges: number;
    banes: number;
    additionalBonus: number;
    flavor?: string;
    tierResults?: TierResult[];
}

export interface PowerRollResult {
    dice: number[];
    diceTotal: number;
    bonus: number;
    total: number;
    tier: number;
    isCritical: boolean;
    edgeBaneEffect: string;
    breakdown: string[];
    tierResult?: TierResult;
}

export class PowerRoll<TActorData extends IActorData> extends Roll<TActorData> {
    declare options: PowerRollOptions & Roll.Options;

    constructor(formula: string = "2d10", data: Record<string, unknown> = {}, options: Partial<PowerRollOptions> = {}) {
        super(formula, data, options as Roll.Options);

        this.options = foundry.utils.mergeObject({
            baseBonus: 0,
            edges: 0,
            banes: 0,
            additionalBonus: 0,
            tierResults: [
                { tier: 1, symbol: "✦", description: "Basic success" },
                { tier: 2, symbol: "★", description: "Good success" },
                { tier: 3, symbol: "✸", description: "Excellent success" }
            ]
        }, options) as PowerRollOptions & Roll.Options;
    }

    /**
     * Calculate the net effect of edges and banes on the roll
     */
    static calculateEdgeBaneEffect(edges: number, banes: number): {
        modifier: number;
        tierAdjustment: number;
        description: string
    } {
        const net = edges - banes;
        const effective = Math.max(Math.min(net, 2), -2);

        switch (effective) {
            case -2:
                return {
                    modifier: 0,
                    tierAdjustment: -1,
                    description: "Double Bane (tier reduced)"
                };
            case -1:
                return {
                    modifier: -2,
                    tierAdjustment: 0,
                    description: "Single Bane (-2)"
                };
            case 0:
                return {
                    modifier: 0,
                    tierAdjustment: 0,
                    description: ""
                };
            case 1:
                return {
                    modifier: 2,
                    tierAdjustment: 0,
                    description: "Single Edge (+2)"
                };
            case 2:
                return {
                    modifier: 0,
                    tierAdjustment: 1,
                    description: "Double Edge (tier increased)"
                };
            default:
                return {
                    modifier: 0,
                    tierAdjustment: 0,
                    description: ""
                };
        }
    }

    /**
     * Calculate the tier based on the total roll result
     */
    static calculateTier(total: number, hasNaturalCrit: boolean): number {
        if (hasNaturalCrit) return 3;
        if (total >= 17) return 3;
        if (total >= 12) return 2;
        return 1;
    }

    /**
     * Evaluate the power roll and calculate all results
     */
    async evaluate(): Promise<this> {
        await super.evaluate();

        const diceResults = this.dice[0]?.results?.map(r => r.result) || [];
        const diceTotal = diceResults.reduce((sum, val) => sum + val, 0);
        const hasNaturalCrit = diceResults.some(val => val >= 19);

        const edgeBaneEffect = PowerRoll.calculateEdgeBaneEffect(this.options.edges, this.options.banes);
        const totalBonus = this.options.baseBonus + this.options.additionalBonus + edgeBaneEffect.modifier;

        const finalTotal = diceTotal + totalBonus;
        const initialTier = PowerRoll.calculateTier(finalTotal, hasNaturalCrit);
        const finalTier = Math.max(1, Math.min(3, initialTier + edgeBaneEffect.tierAdjustment));

        // Find the tier result description
        const tierResult = this.options.tierResults?.find(tr => tr.tier === finalTier);

        // Store custom result data
        this.terms.push({
            powerRollResult: {
                dice: diceResults,
                diceTotal,
                bonus: totalBonus,
                total: finalTotal,
                tier: finalTier,
                isCritical: hasNaturalCrit,
                edgeBaneEffect: edgeBaneEffect.description,
                breakdown: this.getBreakdown(),
                tierResult
            }
        } as any);

        return this;
    }

    /**
     * Get a breakdown of all bonuses applied to the roll
     */
    getBreakdown(): string[] {
        const breakdown: string[] = [];

        if (this.options.baseBonus) {
            breakdown.push(`Base Bonus: ${this.options.baseBonus >= 0 ? '+' : ''}${this.options.baseBonus}`);
        }

        if (this.options.additionalBonus) {
            breakdown.push(`Additional Bonus: ${this.options.additionalBonus >= 0 ? '+' : ''}${this.options.additionalBonus}`);
        }

        if (this.options.edges) {
            breakdown.push(`Edges: ${this.options.edges}`);
        }

        if (this.options.banes) {
            breakdown.push(`Banes: ${this.options.banes}`);
        }

        const edgeBaneEffect = PowerRoll.calculateEdgeBaneEffect(this.options.edges, this.options.banes);
        if (edgeBaneEffect.modifier !== 0) {
            breakdown.push(`Edge/Bane Modifier: ${edgeBaneEffect.modifier >= 0 ? '+' : ''}${edgeBaneEffect.modifier}`);
        }

        if (edgeBaneEffect.tierAdjustment !== 0) {
            const adjustment = edgeBaneEffect.tierAdjustment > 0 ? 'increased' : 'decreased';
            breakdown.push(`Tier ${adjustment} by ${Math.abs(edgeBaneEffect.tierAdjustment)}`);
        }

        return breakdown;
    }

    /**
     * Get the power roll result data
     */
    getPowerRollResult(): PowerRollResult | null {
        if (!this._evaluated) return null;

        const resultTerm = this.terms.find(t => (t as any).powerRollResult);
        return resultTerm ? (resultTerm as any).powerRollResult : null;
    }

    /**
     * Create a power roll from a dialog
     */
    static async fromDialog<TActorData extends IActorData>(options: Partial<PowerRollOptions> = {}): Promise<PowerRoll<TActorData> | null> {
        const { PowerRollDialog } = await import("@mechanics/powerRollDialog");

        const dialogData = await PowerRollDialog.show({
            edges: options.edges || 0,
            banes: options.banes || 0,
            additionalBonus: options.additionalBonus || 0,
            flavor: options.flavor || ""
        });

        if (!dialogData) return null;

        return new PowerRoll("2d10", {}, {
            ...options,
            ...dialogData
        });
    }

    /**
     * Create a chat message from this power roll
     */
    async toMessage(messageData: Partial<ChatMessage.CreateData> = {}): Promise<Roll.ToMessageReturn<true>> {
        if (!this._evaluated) await this.evaluate();

        const result = this.getPowerRollResult();
        if (!result) return;

        const { PowerRollCardManager } = await import("@mechanics/powerRollCardManager.js");

        return PowerRollCardManager.create(
            result,
            messageData.speaker?.actor,
            this.options.flavor
        );
    }

    /**
     * Create a simple power roll without dialog
     */
    static async create<TActorData extends IActorData>(options: PowerRollOptions): Promise<PowerRoll<TActorData>> {
        const roll = new PowerRoll<TActorData>("2d10", {}, options);
        await roll.evaluate();
        return roll;
    }

    /**
     * Roll and immediately send to chat
     */
    static async rollToChat<TActorData extends IActorData>(options: PowerRollOptions, messageData: Partial<ChatMessage.CreateData> = {}): Promise<ChatMessage | undefined> {
        const roll = await PowerRoll.create(options);
        return roll.toMessage(messageData);
    }

    /**
     * Get a summary of the roll for logging or display
     */
    getSummary(): string {
        const result = this.getPowerRollResult();
        if (!result) return "Roll not evaluated";

        const parts = [
            `Dice: ${result.dice.join(', ')}`,
            `Total: ${result.total}`,
            `Tier: ${result.tier}`,
        ];

        if (result.isCritical) {
            parts.push("Critical!");
        }

        if (result.edgeBaneEffect) {
            parts.push(`Effect: ${result.edgeBaneEffect}`);
        }

        return parts.join(' | ');
    }

    /**
     * Export roll data for saving/serialization
     */
    toJSON(): any {
        const json = super.toJSON();
        json.options = this.options;
        json.powerRollResult = this.getPowerRollResult();
        return json;
    }

    /**
     * Import roll data from saved/serialized data
     */
    static fromJSON<TActorData>(json: any): PowerRoll<TActorData extends IActorData> {
        const roll = new PowerRoll(json.formula, json.data, json.powerRollOptions);

        if (json.powerRollResult) {
            // Restore the evaluated state
            roll.terms.push({
                powerRollResult: json.powerRollResult
            } as any);
            (roll as any)._evaluated = true;
        }

        return roll;
    }
}