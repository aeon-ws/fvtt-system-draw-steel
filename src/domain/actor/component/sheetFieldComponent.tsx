
import clsx from "classnames";
import React from "react";

import { IImmunityData, IWeaknessData } from "@creature/creatureData";
import { JSX } from "react/jsx-runtime";


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

interface IDistanceFieldRowProps {
    distanceLabel: string;
    distanceTypeLabel1: string;
    value1: number | string;
    distanceTypeLabel2?: string | undefined;
    value2?: number | string | undefined;
}

export function DistanceFieldRow({
    distanceLabel,
    distanceTypeLabel1,
    value1,
    distanceTypeLabel2,
    value2
}: IDistanceFieldRowProps): JSX.Element | null {
    return (
        <div className="field-row">
            <span className="label">{distanceLabel}</span>
            <span className="value">{distanceTypeLabel1} {value1} {distanceTypeLabel2 && value2 !== undefined && value2 !== null && value2 !== 0 && (`or ${distanceTypeLabel2} ${value2}`)}</span>
        </div>
    );
}

interface StatFieldRowProps {
    label: string;
    value?: number | string | null;
    template?: string; // e.g., "Strike damage +{value}"
    className?: string;
    overflow?: boolean;
    defaultValue?: string | null; // If not null, allows 0 or empty values to be displayed
}

export const StatFieldRow: React.FC<StatFieldRowProps> = ({
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

interface SizeAndStabilityFieldsRowProps {
    sizeLabel: string;
    sizeValue: string | number;
    stabilityLabel: string;
    stabilityValue: string | number;
}

export const SizeAndStabilityFieldsRow: React.FC<SizeAndStabilityFieldsRowProps> = ({ sizeLabel, sizeValue, stabilityLabel, stabilityValue }) => {
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

interface CharacteristicFieldRowProps {
    label: string;
    value?: number | string | null;
}

export const CharacteristicFieldRow: React.FC<CharacteristicFieldRowProps> = ({ label, value }) => {
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

interface ImmunityAndWeaknessFieldRowProps {
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

export const ImmunityAndWeaknessFieldRow: React.FC<ImmunityAndWeaknessFieldRowProps> = ({
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
