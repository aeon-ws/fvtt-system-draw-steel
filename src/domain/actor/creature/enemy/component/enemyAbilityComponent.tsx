// src/components/enemySheetComponent.tsx

import { IEnemyAbilityData } from "@enemy/enemyAbilityData";
import { IEnemyData } from "@enemy/enemyData";
import { ArrayField, DistanceFieldRow, StatFieldRow } from "@actor/sheetFieldComponent";
import { JSX } from "react";

export interface IEnemyAbilityComponentProps {
    enemy: IEnemyData;
    ability: IEnemyAbilityData;
}

export function EnemyAbilityComponent({ enemy, ability }: IEnemyAbilityComponentProps): JSX.Element | null {
    console.log("EnemyAbilityComponent | ability:", ability);
    const getAbilityDisplayName = (name: string) => {
        switch (name) {
            case "enemyTrait":
                return "";
            case "freeMainAction":
                return "(Free Main Action)";
            case "freeManeuver":
                return "(Free Maneuver)";
            case "freeTriggeredAction":
                return "(Free Triggered Action)";
            case "mainAction":
                return "(Main Action)";
            case "maneuver":
                return "(Maneuver)";
            case "triggeredAction":
                return "(Triggered Action)";
            case "villainAction":
                return "";
        }
    };

    return (
        <div className="ability">
            <div className="subheader-row">
                <span className="left">
                    <span className="label">{ability.name}</span>
                    {ability.type.search(/trait|villain/gi) == -1
                        ? (<span className="value">{getAbilityDisplayName(ability.type)}</span>) : null}
                </span>
                <span className="right">
                    {ability.maliceCost > 0
                        ? (<>
                            <span className="label malice">Malice</span>
                            <span className="value malice">{ability.maliceCost}</span></>)
                        : (ability.isSignature ? <span className="label signature">Signature</span> : null)
                    }
                </span>
            </div>
            <div className="subheader-row">
                <ArrayField label="Keywords" labelClassNames={["label"]} values={ability.keywords} valueClassNames={["value"]} />
            </div>
            <div className="columns">
                <div className="column left-column">
                    {ability.distance?.melee && ability.distance?.melee !== 0
                        ? (
                            <DistanceFieldRow
                                distanceLabel="Distance"
                                distanceTypeLabel1="Melee"
                                value1={ability.distance.melee}
                                distanceTypeLabel2="Ranged"
                                value2={ability.distance.ranged}
                            />
                        )
                        : ability.distance?.ranged && ability.distance?.ranged !== 0 && (
                            <DistanceFieldRow
                                distanceLabel="Distance"
                                distanceTypeLabel1="Ranged"
                                value1={ability.distance.ranged}
                            />
                        )}
                    {ability.distance?.burst && ability.distance?.burst !== 0 && (
                        <DistanceFieldRow
                            distanceLabel="Distance"
                            distanceTypeLabel1="Burst"
                            value1={ability.distance.burst}
                        />
                    )}
                    {ability.distance?.cube && ability.distance.cube.size !== 0 && ability.distance.cube.within !== 0 && (
                        <DistanceFieldRow
                            distanceLabel="Distance"
                            distanceTypeLabel1="Cube"
                            value1={`${ability.distance.cube.size} within ${ability.distance.cube.within}`}
                        />
                    )}
                    {ability.distance?.line && ability.distance.line.length !== 0 && ability.distance.line.width !== 0 && ability.distance.line.within != 0 && (
                        <DistanceFieldRow
                            distanceLabel="Distance"
                            distanceTypeLabel1="Line"
                            value1={`${ability.distance.line.length} x ${ability.distance.line.width} within ${ability.distance.line.within}`}
                        />
                    )}
                </div>
                <div className="column right-column">
                    {ability.target?.text && (
                        <StatFieldRow label="Target" value={ability.target.text} />
                    )}
                </div>
            </div>
            {ability.powerRoll && (
                <div className="power-roll-section">
                    {ability.powerRoll?.bonus && (
                        <StatFieldRow label="Power Roll" value={`2d10 + ${ability.powerRoll.bonus}`} />
                    )}
                    <div className="power-roll-table">
                        <div className="power-roll-tier">
                            <span className="symbol">✦</span>
                            <span className="label">≤11</span>
                            <span className="value">{`${ability.powerRoll.tier1.damage} damage;`}{` ${ability.powerRoll.tier1.effect?.text}`}{` ${ability.powerRoll.tier1.potencyEffect?.targetCharacteristic}<${ability.powerRoll.tier1.potencyEffect?.value} ${ability.powerRoll.tier1.potencyEffect?.effect.text}`}</span>
                        </div>
                        <div className="power-roll-tier">
                            <span className="symbol">★</span>
                            <span className="label">12-16</span>
                            <span className="value">{`${ability.powerRoll.tier2.damage} damage;`}{` ${ability.powerRoll.tier2.effect?.text}`}{` ${ability.powerRoll.tier2.potencyEffect?.targetCharacteristic}<${ability.powerRoll.tier2.potencyEffect?.value} ${ability.powerRoll.tier2.potencyEffect?.effect.text}`}</span>
                        </div>
                        <div className="power-roll-tier">
                            <span className="symbol">✸</span>
                            <span className="label">17+</span>
                            <span className="value">{`${ability.powerRoll.tier2.damage} damage;`}{` ${ability.powerRoll.tier3.effect?.text}`}{` ${ability.powerRoll.tier3.potencyEffect?.targetCharacteristic}<${ability.powerRoll.tier3.potencyEffect?.value} ${ability.powerRoll.tier3.potencyEffect?.effect.text}`}</span>
                        </div>
                    </div>
                </div>
            )}
            < div className="divider"></div >
        </div>
    );
}
