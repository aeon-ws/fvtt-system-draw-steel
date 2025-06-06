import React from 'react';
import { createRoot } from 'react-dom/client';
import { PowerRollCard } from '@mechanics/powerRollCard';
import { PowerRollResult } from '@mechanics/powerRoll';

export class PowerRollCardManager {
    static async create(result: PowerRollResult, actor: Actor, flavor: string = ""): Promise<ChatMessage> {
        // Create a temporary container to render React component to HTML
        const tempDiv = document.createElement('div');
        const root = createRoot(tempDiv);

        // Render the React component
        await new Promise<void>((resolve) => {
            const actorData = actor.toObject();
            root.render(
                React.createElement(PowerRollCard, {
                    result,
                    actor: {
                        ...actorData,
                        img: actorData.img || ""
                    },
                    flavor,
                    timestamp: new Date().toLocaleTimeString(),
                })
            );

            // Wait for render to complete
            setTimeout(() => {
                resolve();
            }, 0);
        });

        const htmlContent = tempDiv.innerHTML;
        root.unmount();

        const messageData = {
            user: game.user?.id,
            speaker: ChatMessage.getSpeaker({ actor }),
            content: htmlContent,
            sound: CONFIG.sounds.dice,
            flags: {
                "draw-steel": {
                    type: "power-roll",
                    result: result
                }
            }
        };

        return ChatMessage.create(messageData as any) as any;
    }
}
