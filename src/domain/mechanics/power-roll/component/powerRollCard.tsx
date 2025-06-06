import React from 'react';
import { PowerRollResult } from "@mechanics/powerRoll";

interface PowerRollCardProps {
    result: PowerRollResult;
    actor: {
        name: string;
        img: string;
        [key: string]: any;
    };
    flavor?: string;
    timestamp?: string;
}

export const PowerRollCard: React.FC<PowerRollCardProps> = ({
    result,
    actor,
    flavor,
    timestamp
}) => {
    const getTierClassName = (tier: number): string => {
        return `tier-${tier}`;
    };

    const getDieClassName = (value: number): string => {
        if (value === 1) return 'die d10 min';
        if (value >= 19) return 'die d10 max';
        return 'die d10';
    };

    return (
        <div className="draw-steel power-roll-card">
            <div className="card-header">
                <img
                    src={actor.img}
                    alt={actor.name}
                    className="actor-portrait"
                />
                <div className="roll-info">
                    <h3 className="actor-name">{actor.name}</h3>
                    {flavor && <p className="roll-flavor">{flavor}</p>}
                </div>
                <div className={`tier-display ${getTierClassName(result.tier)}`}>
                    <span className="tier-symbol">
                        {result.tierResult?.symbol || result.tier}
                    </span>
                    {result.isCritical && (
                        <i className="fas fa-star critical-star"></i>
                    )}
                </div>
            </div>

            <div className="roll-details">
                <div className="dice-display">
                    {result.dice.map((die, index) => (
                        <div key={index} className={getDieClassName(die)}>
                            {die}
                        </div>
                    ))}
                </div>

                <div className="calculation">
                    <span className="dice-total">
                        {result.dice.join(' + ')}
                    </span>
                    {result.bonus !== 0 && (
                        <span className="bonus">
                            {result.bonus >= 0 ? ' + ' : ' - '}
                            {Math.abs(result.bonus)}
                        </span>
                    )}
                    <span className="equals"> = </span>
                    <span className="total">{result.total}</span>
                </div>

                {result.edgeBaneEffect && (
                    <div className="edge-bane-effect">
                        <strong>{result.edgeBaneEffect}</strong>
                    </div>
                )}

                {result.breakdown.length > 0 && (
                    <div className="breakdown">
                        {result.breakdown.map((item, index) => (
                            <div key={index} className="breakdown-item">
                                {item}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="tier-result">
                <div className="tier-header">
                    <span className="tier-symbol-large">
                        {result.tierResult?.symbol || '✦'}
                    </span>
                    <span className="tier-label">
                        Tier {result.tier} Result
                    </span>
                </div>
                <div className="tier-description">
                    {result.tierResult?.description || `Tier ${result.tier} success`}
                </div>
            </div>

            {timestamp && (
                <div className="card-footer">
                    <small className="timestamp">{timestamp}</small>
                </div>
            )}
        </div>
    );
};