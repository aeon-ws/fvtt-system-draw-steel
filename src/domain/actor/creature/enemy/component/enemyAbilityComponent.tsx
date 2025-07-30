// src/components/enemySheetComponent.tsx

import { ArrayField, DistanceField, EffectField, PowerRollField, Roll, TargetField } from "@actor/sheetFieldComponent";
import { IEnemyAbilityData } from "@enemy/enemyAbilityData";
import { IEnemyData } from "@enemy/enemyData";
import { EnemyTokenDocument } from "@enemy/enemyTokenDocument";
import { JSX } from "react";
import { MinionTokenDocument } from "@minion/minionTokenDocument";
import { IMinionData } from "@minion/minionData";


export interface IEnemyAbilityComponentProps {
    key: string;
    enemy: EnemyTokenDocument<IEnemyData> | MinionTokenDocument<IMinionData>;
    ability: IEnemyAbilityData;
}

export function EnemyAbilityComponent({ key, enemy, ability }: IEnemyAbilityComponentProps): JSX.Element | null {
    const getAbilityTypeDisplayName = (name: string) => {
        switch (name) {
            case "enemyTrait":
                return "";
            case "freeMainAction":
                return "Free Main Action";
            case "freeManeuver":
                return "Free Maneuver";
            case "freeTriggeredAction":
                return "Free Triggered Action";
            case "mainAction":
                return "Main Action";
            case "maneuver":
                return "Maneuver";
            case "triggeredAction":
                return "Triggered Action";
            case "villainAction":
                return `Villain Action ${ability.villainActionOrdinal}`;
        }
    };

    const abilityNameCssClassNames =
        ability.resourceCost > 0
            ? "label malice"
            : ability.isSignature
                ? "label signature"
                : "label";


    const powerRoll = ability.powerRoll;

    return (
        <div key={key} className="ability">
            <div className="subheader-row">
                <span className="left">
                    <span className={abilityNameCssClassNames}>{ability.name}</span>
                    {powerRoll
                        && (
                            <Roll dieCount={2} dieType="d10" rollBonus={enemy.getPowerRollBonus(powerRoll)} />
                        )
                    }
                </span>
                <span className="right">
                    <span className={abilityNameCssClassNames}>
                        {ability.resourceCost > 0 && `${ability.resourceCost} Malice`}
                    </span>
                </span>
            </div>
            <div className="columns">
                <div className="column left-column">
                    <div className="field-row">
                        <ArrayField values={ability.keywords} valueClassNames={["overflow"]} />
                    </div>
                    {ability.distance?.melee && ability.distance?.melee !== 0
                        ? (
                            <DistanceField
                                distanceTypeLabel1="Melee"
                                value1={ability.distance.melee}
                                distanceTypeLabel2="Ranged"
                                value2={ability.distance.ranged}
                            />
                        )
                        : (
                            ability.distance?.ranged && ability.distance?.ranged !== 0
                            && (
                                <DistanceField distanceTypeLabel1="Ranged" value1={ability.distance.ranged} />
                            )
                        )
                    }
                    {ability.distance?.burst && ability.distance?.burst !== 0
                        && (
                            <DistanceField distanceTypeLabel1="Burst" value1={ability.distance.burst} />
                        )
                    }
                    {ability.distance?.cube && ability.distance.cube.size !== 0 && ability.distance.cube.within !== 0
                        && (
                            <DistanceField
                                distanceTypeLabel1="Cube"
                                value1={`${ability.distance.cube.size} within ${ability.distance.cube.within}`}
                            />
                        )
                    }
                    {ability.distance?.line && ability.distance.line.length !== 0 && ability.distance.line.width !== 0 && ability.distance.line.within != 0
                        && (
                            <DistanceField
                                distanceTypeLabel1="Line"
                                value1={`${ability.distance.line.length} x ${ability.distance.line.width} within ${ability.distance.line.within}`}
                            />
                        )
                    }
                </div>
                <div className="column right-column">
                    <div className="field-row">
                        <span>{getAbilityTypeDisplayName(ability.type)}</span>
                    </div>
                    {ability.target?.text
                        && (
                            <TargetField value={ability.target.text} />
                        )
                    }
                </div>
            </div>

            <EffectField label={ability.type !== "monsterTrait" ? "Effect" : null} effect={ability.prePowerRollEffect} />

            {powerRoll
                && (
                    <PowerRollField
                        powerRoll={powerRoll}
                        getDamageValue={(powerRollTier) => enemy.getDamageValue(powerRollTier)}
                        getPotencyValue={(potencyEffect) => enemy.getPotencyValue(potencyEffect)}
                    />
                )}

            <EffectField label={ability.type !== "monsterTrait" ? "Effect" : null} effect={ability.postPowerRollEffect} />

            < div className="divider"></div >
        </div>
    );
}
