
import clsx from "classnames";
import React from "react";

import { IImmunityData, IWeaknessData } from "@data/creatureData";
import { jsx, JSX } from "react/jsx-runtime";


interface ArrayFieldProps {
    label?: string; // e.g., "Keywords"
    values: (string | number)[]; // e.g., ["Melee", "Strike", "Weapon"]
    valueSeparator?: string; // e.g., ", "
    classNames?: string[];
}

export const ArrayField: React.FC<ArrayFieldProps> = ({ label, values, valueSeparator, classNames }) => {
    if (!values || values.length === 0) return null;

    const separator = valueSeparator || ", ";
    return (
        <span className={clsx(classNames)}> {
            values.map(
                (value, index) =>
                    <span>{value}{index < values.length - 1 && separator}</span>
            )
        }
        </span>
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
    console.log("ImmunityOrWeaknessField | damageTypesAndValuesAsString:", damageTypesAndValuesAsString);

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
