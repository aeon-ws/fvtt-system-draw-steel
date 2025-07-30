// src/components/enemySheetComponent.tsx

import { IEnemyData } from "@enemy/enemyData";
import { ArrayField, CharacteristicField, EncounterValueField, ImmunityField, WeaknessField, SizeAndStabilityFields, StatField } from "@actor/sheetFieldComponent";
import { EnemyAbilityComponent } from "@enemy/enemyAbilityComponent";
import { IEnemyAbilityData } from "@enemy/enemyAbilityData";
import { EnemyTokenDocument } from "@enemy/enemyTokenDocument";
import { Fragment } from "react/jsx-runtime";

export interface IEnemyComponentContext {
    ref: React.RefObject<HTMLFormElement | null>;
    enemy: EnemyTokenDocument<IEnemyData>;
    abilities: IEnemyAbilityData[]
}

export function EnemySheetComponent(context: IEnemyComponentContext) {
    const enemy = context.enemy;
    const enemyData = enemy.data;
    const abilities = context.abilities;

    return (
        <form ref={context.ref} autoComplete="off" className="aeon-draw-steel sheet actor enemy">
            <div className="enemy-sheet">
                <div className={`header ${enemyData.role.toLowerCase()}`}>
                    <div className="header-row">
                        <span className="left">{enemyData.name}&nbsp;</span>
                        <span className="right">Level&nbsp;{enemyData.level}&nbsp;{enemyData.type}&nbsp;{enemyData.role}</span>
                    </div>
                    <div className="subheader-row">
                        <ArrayField valueClassNames={["left"]} values={enemyData.keywords} />
                        <EncounterValueField label="EV" encounterValue={enemyData.encounterValue} enemyType={enemyData.type} />
                    </div>
                </div>
                <div className="divider"></div>

                <div className="combat-stats-row">
                    <StatField label="Size" value={enemyData.combat.size} />
                    <StatField label="Speed" value={enemyData.combat.speed} />
                    <StatField label="Stamina" value={
                        enemyData.stamina.value !== enemyData.stamina.max
                            ? `${enemyData.stamina.value} / ${enemyData.stamina.max}`
                            : enemyData.stamina.max} />
                    <StatField label="Stability" value={enemyData.combat.stability} />
                    <StatField label="Free Strike" value={enemyData.combat.freeStrikeDamage} defaultValue="1" />
                </div>
                <div className="columns">
                    <div className="column left-column">
                        <ImmunityField immunityLabel="Immunity" immunity={enemyData.immunity} />
                        <StatField label="Movement" value={enemyData.combat.movementTypes.toString()} />
                    </div>
                    <div className="column right-column">
                        <WeaknessField weaknessLabel="Weakness" weakness={enemyData.weakness} />
                    </div>
                </div>

                <div className={`characteristics-row  ${enemyData.role.toLowerCase()}`}>
                    <CharacteristicField label="Might" value={enemyData.characteristics.might} />
                    <CharacteristicField label="Agility" value={enemyData.characteristics.agility} />
                    <CharacteristicField label="Reason" value={enemyData.characteristics.reason} />
                    <CharacteristicField label="Intuition" value={enemyData.characteristics.intuition} />
                    <CharacteristicField label="Presence" value={enemyData.characteristics.presence} />
                </div>

                <Fragment>
                    {abilities
                        .slice()
                        .sort((a, b) =>
                            (a.isSignature ? -1 : 1) - (b.isSignature ? -1 : 1)
                            || (a.type === "monsterTrait" ? 1 : -1) - (b.type === "monsterTrait" ? 1 : -1)
                            || (a.type as string).localeCompare(b.type as string)
                            || (a.villainActionOrdinal ?? 0) - (b.villainActionOrdinal ?? 0)
                            || (a.name as string).localeCompare(b.name as string)
                        )
                        .map(ability => (
                            <EnemyAbilityComponent key={ability.name} enemy={enemy} ability={ability} />
                        ))}
                </Fragment>
            </div>
        </form >
    );
}
