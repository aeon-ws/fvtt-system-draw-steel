// src/components/enemySheetComponent.tsx

import { HeroTokenDocument } from "@hero/heroTokenDocument";
import { IHeroAbilityData } from "@hero/heroAbilityData";
import { HeroClass, IHeroData } from "@hero/heroData";
import { ArrayField, DistanceField, EffectField, PowerRollField, Roll, TargetField } from "@actor/sheetFieldComponent";
import { JSX } from "react";

export interface IHeroAbilityComponentProps {
    key: string;
    hero: HeroTokenDocument<IHeroData>;
    ability: IHeroAbilityData;
}

export function HeroAbilityComponent({ key, hero, ability }: IHeroAbilityComponentProps): JSX.Element | null {
    const getHeroicResourceDisplayName = (heroClass: HeroClass) => {
        switch (heroClass) {
            case "Beastheart":
                return "Ferocity";
            case "Censor":
                return "Wrath";
            case "Conduit":
                return "Piety";
            case "Elementalist":
                return "Essence";
            case "Fury":
                return "Ferocity";
            case "Null":
                return "Discipline";
            case "Summoner":
                return "Essence";
            case "Shadow":
                return "Insight";
            case "Tactician":
                return "Focus";
            case "Talent":
                return "Discipline";
            default:
                throw new Error(`Unknown hero class: ${heroClass}`);
        }
    };

    const getAbilityDisplayName = (name: string) => {
        switch (name) {
            case "heroTrait":
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
                            <Roll dieCount={2} dieType="d10" rollBonus={hero.getPowerRollBonus(powerRoll)} />
                        )
                    }
                </span>
                <span className="right">
                    <span className={abilityNameCssClassNames}>
                        {ability.resourceCost > 0
                            && `${ability.resourceCost} ${getHeroicResourceDisplayName(hero.data.class)}`
                        }
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
                        <span>{getAbilityDisplayName(ability.type)}</span>
                    </div>
                    {ability.target?.text
                        && (
                            <TargetField value={ability.target.text} />
                        )
                    }
                </div>
            </div>

            <EffectField label={ability.type !== "heroTrait" ? "Effect" : null} effect={ability.prePowerRollEffect} />

            {powerRoll
                && (
                    <PowerRollField
                        powerRoll={powerRoll}
                        getDamageValue={(powerRollTier) => hero.getDamageValue(powerRollTier)}
                        getPotencyValue={(potencyEffect) => hero.getPotencyValue(potencyEffect)}
                    />
                )}

            <EffectField label={ability.type !== "heroTrait" ? "Effect" : null} effect={ability.postPowerRollEffect} />

            < div className="divider"></div >
        </div>
    );
}
