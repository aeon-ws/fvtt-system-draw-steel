export interface PowerRollDialogData {
    edges: number;
    banes: number;
    additionalBonus: number;
    flavor: string;
}

interface PowerRollDialogResult extends PowerRollDialogData {
    roll: boolean;
}

export class PowerRollDialog extends foundry.applications.api.DialogV2 {
    static override DEFAULT_OPTIONS = {
        id: "power-roll-dialog",
        tag: "dialog",
        window: {
            title: "Power Roll Configuration",
            icon: "fas fa-dice-d20",
            minimizable: false,
            resizable: false
        },
        position: {
            width: 400,
            height: "auto"
        },
        modal: true,
        form: {
            handler: PowerRollDialog.formHandler,
            submitOnChange: false,
            closeOnSubmit: true
        }
    };

    constructor(data: Partial<PowerRollDialogData> = {}) {
        super({
            content: PowerRollDialog.getTemplate(data),
            buttons: [
                {
                    action: "roll",
                    label: "Roll",
                    icon: "fas fa-dice",
                    default: true,
                    callback: (event, button, dialog) => {
                        const formData = new FormData(dialog.querySelector("form")!);
                        const result = PowerRollDialog.formHandler(event, dialog.querySelector("form")!, formData);
                        return result.then(data => ({ ...data, roll: true }));
                    }
                },
                {
                    action: "cancel",
                    label: "Cancel",
                    icon: "fas fa-times",
                    callback: () => null
                }
            ]
        });
    }

    static getTemplate(data: Partial<PowerRollDialogData>): string {
        return `
            <form>
                <div class="form-group">
                    <label for="edges">Edges:</label>
                    <input type="number" name="edges" value="${data.edges || 0}" min="0" max="10">
                </div>
                <div class="form-group">
                    <label for="banes">Banes:</label>
                    <input type="number" name="banes" value="${data.banes || 0}" min="0" max="10">
                </div>
                <div class="form-group">
                    <label for="additionalBonus">Additional Bonus:</label>
                    <input type="number" name="additionalBonus" value="${data.additionalBonus || 0}">
                </div>
                <div class="form-group">
                    <label for="flavor">Flavor Text:</label>
                    <input type="text" name="flavor" value="${data.flavor || ''}" placeholder="Optional description">
                </div>
            </form>
        `;
    }

    static async formHandler(
        event: Event,
        form: HTMLFormElement,
        formData: FormData
    ): Promise<PowerRollDialogData> {
        return {
            edges: parseInt(formData.get("edges") as string) || 0,
            banes: parseInt(formData.get("banes") as string) || 0,
            additionalBonus: parseInt(formData.get("additionalBonus") as string) || 0,
            flavor: (formData.get("flavor") as string) || ""
        };
    }

    static async show(data: Partial<PowerRollDialogData> = {}): Promise<PowerRollDialogData | null> {
        const dialog = new PowerRollDialog(data);
        const result = await dialog.render({ force: true });

        if (result && typeof result === 'object' && 'roll' in result && result.roll) {
            const { roll, ...dialogData } = result as PowerRollDialogResult;
            return dialogData as PowerRollDialogData;
        }
        return null;
    }
}