// src/components/enemySheetComponent.tsx

import { HeroTokenDocument } from "@hero/heroTokenDocument";
import { IHeroAbilityData } from "@hero/heroAbilityData";
import { IHeroData } from "@hero/heroData";
import { ArrayField, DistanceField, EffectField, PowerRollField, TargetField } from "@actor/sheetFieldComponent";
import { JSX } from "react";

export interface IHeroAbilityComponentProps {
    hero: HeroTokenDocument<IHeroData>;
    ability: IHeroAbilityData;
}

export function HeroAbilityComponent({ hero, ability }: IHeroAbilityComponentProps): JSX.Element | null {
    const getAbilityDisplayName = (name: string) => {
        switch (name) {
            case "heroTrait":
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
        }
    };

    const abilityNameCssClassNames =
        ability.heroicResourceCost > 0
            ? "label malice"
            : ability.isSignature
                ? "label signature"
                : "label";

    return (
        <div className="ability">
            <div className="subheader-row">
                <span className="left">
                    <span className={abilityNameCssClassNames}>{ability.name}</span>
                    {ability.type.search(/trait/gi) == -1
                        ? (<span className="value">{getAbilityDisplayName(ability.type)}</span>) : null}
                </span>
                <span className="right">
                    {ability.heroicResourceCost > 0
                        ? (<>
                            <span className="label malice">Heroic Resource</span>
                            <span className="value malice">{ability.heroicResourceCost}</span></>)
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
                            <DistanceField
                                distanceTypeLabel1="Melee"
                                value1={ability.distance.melee}
                                distanceTypeLabel2="Ranged"
                                value2={ability.distance.ranged}
                            />
                        )
                        : ability.distance?.ranged && ability.distance?.ranged !== 0 && (
                            <DistanceField distanceTypeLabel1="Ranged" value1={ability.distance.ranged} />
                        )}
                    {ability.distance?.burst && ability.distance?.burst !== 0 && (
                        <DistanceField distanceTypeLabel1="Burst" value1={ability.distance.burst} />
                    )}
                    {ability.distance?.cube && ability.distance.cube.size !== 0 && ability.distance.cube.within !== 0 && (
                        <DistanceField
                            distanceTypeLabel1="Cube"
                            value1={`${ability.distance.cube.size} within ${ability.distance.cube.within}`}
                        />
                    )}
                    {ability.distance?.line && ability.distance.line.length !== 0 && ability.distance.line.width !== 0 && ability.distance.line.within != 0 && (
                        <DistanceField
                            distanceTypeLabel1="Line"
                            value1={`${ability.distance.line.length} x ${ability.distance.line.width} within ${ability.distance.line.within}`}
                        />
                    )}
                </div>
                <div className="column right-column">
                    {ability.target?.text && (
                        <TargetField value={ability.target.text} />
                    )}
                </div>
            </div>

            <EffectField label={ability.type !== "heroTrait" ? "Effect" : null} effect={ability.prePowerRollEffect} />

            <PowerRollField
                powerRoll={ability.powerRoll}
                getPowerRollBonus={hero.getPowerRollBonus}
                getPotencyValue={hero.getPotencyValue}
            />

            <EffectField label={ability.type !== "heroTrait" ? "Effect" : null} effect={ability.postPowerRollEffect} />

            < div className="divider"></div >
        </div>
    );
}
