
import clsx from "classnames";
import React from "react";

import { ICreatureData, IImmunityData, IWeaknessData } from "@creature/creatureData";
import { JSX } from "react/jsx-runtime";
import { IActorAbilityData, IEffectData, IPotencyEffectData, IPowerRollData, IPowerRollTierData } from "@actor/actorAbilityData";


interface IArrayFieldProps {
    label?: string | undefined;
    labelClassNames?: string[] | undefined;
    values: (string | number)[];
    valueSeparator?: string;
    valueClassNames?: string[];
}

export function ArrayField({
    label,
    labelClassNames,
    values,
    valueSeparator = ", ",
    valueClassNames
}: IArrayFieldProps): JSX.Element | null {
    if (!values || values.length === 0) return null;

    return (
        <span>
            {label && (
                <span className={clsx(labelClassNames)}>{label}</span>
            )}
            <span className={clsx(valueClassNames)}>
                {values.map((value, index) => (
                    <React.Fragment key={index}>
                        {value}
                        {index < values.length - 1 && valueSeparator}
                    </React.Fragment>
                ))}
            </span>
        </span>
    );
}

interface IDistanceFieldProps {
    distanceTypeLabel1: string;
    value1: number | string;
    distanceTypeLabel2?: string | undefined;
    value2?: number | string | undefined;
}

export function DistanceField(props: IDistanceFieldProps): JSX.Element | null {
    return (
        <div className="field-row">
            <i className="fa-sharp fa-solid fa-ruler-triangle"></i>
            <span className="value">{props.distanceTypeLabel1} {props.value1} {props.distanceTypeLabel2 && props.value2 !== undefined && props.value2 !== null && props.value2 !== 0 && (`or ${props.distanceTypeLabel2} ${props.value2}`)}</span>
        </div>
    );
}


interface ITargetFieldProps {
    value: string;
}

export function TargetField(props: ITargetFieldProps): JSX.Element | null {
    return (
        <div className="field-row">
            <i className="fa-sharp fa-solid fa-bullseye-arrow"></i>
            <span className="value">{props.value}</span>
        </div>
    );
}

interface StatFieldProps {
    label: string;
    value?: number | string | null;
    template?: string; // e.g., "Strike damage +{value}"
    className?: string;
    overflow?: boolean;
    defaultValue?: string | null; // If not null, allows 0 or empty values to be displayed
}

export const StatField: React.FC<StatFieldProps> = ({
    label,
    value,
    template,
    className,
    overflow,
    defaultValue
}) => {
    if ((value === null || value === undefined || value === "" || value === 0) && !defaultValue) return null;

    const valueOrDefault = value ?? defaultValue;

    let displayValue =
        template && valueOrDefault !== undefined && valueOrDefault !== null
            ? template.replace("{value}", valueOrDefault.toString())
            : valueOrDefault;

    return (
        <div className={clsx("field-row", className, { overflow })}>
            <span className="label">{label}</span>
            <span className="value">{displayValue}</span>
        </div>
    );
}

interface SizeAndStabilityFieldsProps {
    sizeLabel: string;
    sizeValue: string | number;
    stabilityLabel: string;
    stabilityValue: string | number;
}

export const SizeAndStabilityFields: React.FC<SizeAndStabilityFieldsProps> = ({ sizeLabel, sizeValue, stabilityLabel, stabilityValue }) => {
    return (
        <div className="field-row">
            <span className="label">{sizeLabel}</span>
            <span className="value">{sizeValue}</span>
            <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
            <span className="label">{stabilityLabel}</span>
            <span className="value">{stabilityValue}</span>
        </div>
    );
}

interface CharacteristicFieldProps {
    label: string;
    value?: number | string | null;
}

export const CharacteristicField: React.FC<CharacteristicFieldProps> = ({ label, value }) => {
    if (value === null || value === undefined || value === "" || value === 0) {
        value = 0;
    }

    return (
        <div className="characteristic">
            <span className="label">{label}</span>
            <span className="value">{value}</span>
        </div>
    );
};

interface EncounterValueFieldProps {
    label: string;
    encounterValue?: number | string | null;
    enemyType: string; // i.e., "minion" or "enemy"
}

export const EncounterValueField: React.FC<EncounterValueFieldProps> = ({ label = "EV", encounterValue, enemyType }) => {
    return enemyType === "minion"
        ? <span className="right">{label} {encounterValue} for four minions</span>
        : <span className="right">{label} {encounterValue}</span>
}

interface ImmunityAndWeaknessFieldsProps {
    immunityLabel: string;
    immunity: IImmunityData
    weaknessLabel: string;
    weakness: IWeaknessData;
    damageTypeLabels?: Map<string, string>;
}

interface ImmunityOrWeaknessFieldProps {
    fieldLabel: string;
    immunityOrWeakness: IImmunityData | IWeaknessData;
    damageTypeLabels?: Map<string, string>;
}

const ImmunityOrWeaknessField: React.FC<ImmunityOrWeaknessFieldProps> = ({ fieldLabel, immunityOrWeakness, damageTypeLabels }) => {
    const damageTypesAndValuesAsString =
        Object.entries(immunityOrWeakness)
            .filter(([_, value]) => value > 0)
            .map(
                ([damageTypeName, value]) => {
                    const damageTypeLabel = damageTypeLabels?.get(damageTypeName) || damageTypeName;

                    return `${damageTypeLabel.toLowerCase()} ${value}`;
                }
            )
            .join(", ");

    if (!damageTypesAndValuesAsString) return null;

    return (
        <span>
            <span className="label">{fieldLabel}</span>
            <span className="value">{damageTypesAndValuesAsString}</span>
        </span>
    )
}

export const ImmunityAndWeaknessFields: React.FC<ImmunityAndWeaknessFieldsProps> = ({
    immunityLabel,
    immunity,
    weaknessLabel,
    weakness,
    damageTypeLabels,
}) => {
    if (!immunity && !weakness) return null;

    const fields: JSX.Element[] = [];
    if (immunity) {
        fields.push(<ImmunityOrWeaknessField fieldLabel={immunityLabel} immunityOrWeakness={immunity} damageTypeLabels={damageTypeLabels} />);
        if (weakness) {
            fields.push(<span>  |  </span>);
        }
    }
    if (weakness) {
        fields.push(<ImmunityOrWeaknessField fieldLabel={weaknessLabel} immunityOrWeakness={weakness} damageTypeLabels={damageTypeLabels} />);
    }

    if (fields.length === 0) return null;

    return (
        <div className="field-row">
            {fields}
        </div>
    );
};


export function getPowerRollDamageText(tier: IPowerRollTierData): string {
    if (!tier.damage) return "";

    const damageValueText = tier.damage > 0 ? `${tier.damage} ` : null;
    const damageTypeText = tier.damageType ? `${tier.damageType} ` : "";

    return damageValueText ? `${damageValueText}${damageTypeText} damage; ` : "";
}

interface IPowerRollPotencyEffectProps {
    tier: IPowerRollTierData;
    getPotencyValue: (potencyEffect: IPotencyEffectData) => number;
}

export function PowerRollPotencyEffect(props: IPowerRollPotencyEffectProps): JSX.Element | null {
    const tier = props?.tier;
    if (!tier?.potencyEffect || !props?.getPotencyValue) return null;

    const potencyTargetCharacteristicInitial = tier.potencyEffect.targetCharacteristic[0].toUpperCase();

    return (
        <>
            <span className="ads-inline-box">
                {`${potencyTargetCharacteristicInitial} < ${props.getPotencyValue(tier.potencyEffect)}`}
            </span>
            <span>{tier.potencyEffect.effect.text}</span>
        </>
    );
}

export function getPowerRollEffectText(tier: IPowerRollTierData): string {
    if (!tier.effect) return "";

    return tier.effect.text?.length > 0 ? `${tier.effect.text} ` : "";
}

interface IPowerRollTierProps {
    label: string;
    tier: IPowerRollTierData;
    getPotencyValue: (potencyEffect: IPotencyEffectData) => number;
}

export function PowerRollTier(props: IPowerRollTierProps): JSX.Element | null {
    return (
        <div className="power-roll-tier">
            <span className="value">
                <span className="label">{props.label}</span>
            </span>
            <span className="value">
                {getPowerRollDamageText(props.tier)}
                {getPowerRollEffectText(props.tier)}
                <PowerRollPotencyEffect tier={props.tier} getPotencyValue={props.getPotencyValue} />
            </span>
        </div>
    );
}

interface IPowerRollFieldProps {
    powerRoll?: IPowerRollData | null;
    getPowerRollBonus?: (powerRoll: IPowerRollData) => number | null;
    getPotencyValue?: (potencyEffect: IPotencyEffectData) => number;
}

export function PowerRollField(props: IPowerRollFieldProps): JSX.Element | null {
    if (!props.powerRoll || !props?.getPowerRollBonus || !props.getPotencyValue) return null;

    const powerRoll = props.powerRoll;
    const powerRollBonus = props.getPowerRollBonus(powerRoll);
    const getPotencyValue = props.getPotencyValue;

    return (
        <div className="power-roll-section">
            {powerRollBonus && (
                <StatField label="Power Roll" value={`2d10 + ${powerRollBonus}`} />
            )}
            <div className="power-roll-table">
                <PowerRollTier
                    label="≤11"
                    tier={powerRoll.tier1}
                    getPotencyValue={getPotencyValue}
                />
                <PowerRollTier
                    label="12-16"
                    tier={powerRoll.tier2}
                    getPotencyValue={getPotencyValue}
                />
                <PowerRollTier
                    label="17+"
                    tier={powerRoll.tier3}
                    getPotencyValue={getPotencyValue}
                />
            </div>
        </div>
    );
}

interface IEffectFieldProps {
    label?: string | null;
    effect?: IEffectData | null;
}

export function EffectField({ label, effect }: IEffectFieldProps): JSX.Element | null {
    if (!effect || !effect.text || effect.text.length === 0) return null;

    return (
        <div className="effect-field">
            {label && <span className="label">{label}</span>}
            <span className="value">{effect.text}</span>
        </div>
    );
}
