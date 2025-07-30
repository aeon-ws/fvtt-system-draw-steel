
import clsx from "classnames";
import React, { Fragment } from "react";

import { IImmunityData, IWeaknessData } from "@creature/creatureData";
import { JSX } from "react/jsx-runtime";
import { DamageType, IEffectData, IPotencyEffectData, IPowerRollData, IPowerRollTierData } from "@actor/actorAbilityData";

export type Die = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";

interface IRollProps {
    dieType: Die;
    dieCount: number;
    rollBonus: number | undefined | null;
}

export function Roll(props: IRollProps): JSX.Element | null {
    if (props.dieCount <= 0) return null;

    const dieSymbols: JSX.Element[] = [];
    for (let i = 0; i < props.dieCount; i++) {
        dieSymbols.push(
            <i key={`${props.dieType}-${i + 1}`} className={`fa-sharp fa-light fa-dice-${props.dieType}`}></i>
        );
    }

    return (
        <span className="ads-roll-box">
            {dieSymbols}+{props.rollBonus}
        </span>
    );
}

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
    distanceTypeLabel2?: undefined | null | string;
    value2?: undefined | null | number | string;
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
    if ((value === null || value === undefined || value === "") && !defaultValue) return null;

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

interface ICharacteristicFieldProps {
    label: string;
    value: number;
}

export function CharacteristicField({ label, value }: ICharacteristicFieldProps): JSX.Element | null {
    if (value === null || value === undefined) {
        value = -5;
    }

    return (
        <div className="characteristic">
            <span className="label">
                <span className="ads-inline-box">{label[0].toUpperCase()}</span>
                {label.slice(1).toLowerCase()}</span>
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
    return enemyType.toLowerCase() === "minion"
        ? <span className="right">{label} {encounterValue} for 4 minions</span>
        : <span className="right">{label} {encounterValue}</span>
}

interface ImmunityOrWeaknessFieldProps {
    fieldLabelClassName?: string;
    fieldLabel?: string;
    immunityOrWeakness?: IImmunityData | IWeaknessData;
    damageTypeLabels?: Map<string, string>;
}

export function ImmunityOrWeaknessField(props: ImmunityOrWeaknessFieldProps): JSX.Element | null {
    const damageTypesAndValuesAsString =
        props.immunityOrWeakness
            ? Object.entries(props.immunityOrWeakness)
                .filter(([_, value]) => value > 0)
                .map(
                    ([damageTypeName, value]) => {
                        const damageTypeLabel = props.damageTypeLabels?.get(damageTypeName) || damageTypeName;

                        return `${damageTypeLabel} ${value}`;
                    }
                )
                .join(", ")
            : "\u2013";  // Em dash for empty values.

    return (
        <span>
            <span className={props.fieldLabelClassName}>{props.fieldLabel}</span>
            <span className="value">{damageTypesAndValuesAsString}</span>
        </span>
    )
}

interface IWeaknessFieldProps {
    weaknessLabel?: string;
    weakness?: IWeaknessData;
    damageTypeLabels?: Map<string, string>;
}

export function WeaknessField(props: IWeaknessFieldProps): JSX.Element | null {
    const weakness = props.weakness;

    return (
        <div className="field-row">
            <ImmunityOrWeaknessField
                // fieldLabelClassName="fa-sharp fa-solid fa-shield-minus"
                fieldLabelClassName="label"
                fieldLabel={props.weaknessLabel}
                immunityOrWeakness={weakness}
                damageTypeLabels={props.damageTypeLabels}
            />
        </div>
    );
};

interface IImmunityFieldProps {
    immunityLabel?: string;
    immunity?: IImmunityData
    damageTypeLabels?: Map<string, string>;
}

export function ImmunityField(props: IImmunityFieldProps): JSX.Element | null {
    const immunity = props.immunity;

    return (
        <div className="field-row">
            <ImmunityOrWeaknessField
                // fieldLabelClassName="fa-sharp fa-solid fa-shield-plus"
                fieldLabelClassName="label"
                fieldLabel={props.immunityLabel}
                immunityOrWeakness={immunity}
                damageTypeLabels={props.damageTypeLabels}
            />
        </div>
    );
};

export function getPowerRollDamageText(damageType: DamageType | undefined | null, damageValue: number | undefined | null): string {
    if (!damageValue) return "";

    const damageValueText = damageValue && damageValue > 0 ? `${damageValue} ` : null;
    const damageTypeText = damageType ? `${damageType} ` : "";

    return damageValueText ? `${damageValueText}${damageTypeText} damage; ` : "";
}

export function getPowerRollEffectText(tier: IPowerRollTierData): string {
    if (!tier.effect) return "";

    return tier.effect.text?.length > 0 ? `${tier.effect.text} ` : "";
}

interface IPowerRollTierProps {
    label: string;
    tier: IPowerRollTierData;
    damageValue: number | null;
    getPotencyValue: (potencyEffect: IPotencyEffectData) => number;
}

export function PowerRollTier(props: IPowerRollTierProps): JSX.Element | null {
    const tier = props.tier;
    if (!tier) return null;

    const potencyEffect = tier.potencyEffect;

    return (
        <div className="power-roll-tier">
            <span className="value">
                <span className="label">{props.label}</span>
            </span>
            <span className="value">
                {getPowerRollDamageText(tier.damageType, props.damageValue)}
                {getPowerRollEffectText(tier)}
                {potencyEffect && (
                    <Fragment>
                        <span className="ads-inline-box">
                            {`${potencyEffect.targetCharacteristic[0].toUpperCase()} < ${props.getPotencyValue(potencyEffect)}`}
                        </span>
                        <span>{potencyEffect.effect?.text}</span>
                    </Fragment>
                )}
            </span>
        </div>
    );
}

interface IPowerRollFieldProps {
    powerRoll: IPowerRollData | undefined | null;
    // powerRollBonus: number | null;
    getDamageValue: (powerRollTier: IPowerRollTierData) => number | null;
    getPotencyValue: (potencyEffect: IPotencyEffectData) => number;
}

export function PowerRollField(props: IPowerRollFieldProps): JSX.Element | null {
    // if (!props.powerRoll || !props.powerRollBonus) return null;
    if (!props.powerRoll) return null;

    const powerRoll = props.powerRoll;
    // const powerRollBonus = props.powerRollBonus;
    const getPotencyValue = props.getPotencyValue;
    const getDamageValue = props.getDamageValue;

    return (
        <div className="power-roll-section">
            {/* {powerRollBonus && (
                <div className="field-row">
                    <span className="label">Power Roll </span>
                    <Roll dieCount={2} dieType="d10" rollBonus={powerRollBonus} />
                    <span className="value">:</span>
                </div>
            )} */}
            <div className="power-roll-table">
                <PowerRollTier
                    label="≤11"
                    tier={powerRoll.tier1}
                    damageValue={getDamageValue(powerRoll.tier1)}
                    getPotencyValue={getPotencyValue}
                />
                <PowerRollTier
                    label="12-16"
                    tier={powerRoll.tier2}
                    damageValue={getDamageValue(powerRoll.tier2)}
                    getPotencyValue={getPotencyValue}
                />
                <PowerRollTier
                    label="17+"
                    tier={powerRoll.tier3}
                    damageValue={getDamageValue(powerRoll.tier2)}
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
