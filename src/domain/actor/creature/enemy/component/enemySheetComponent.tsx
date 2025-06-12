// src/components/enemySheetComponent.tsx

import { IEnemyData } from "@enemy/enemyData";
import { ArrayField, CharacteristicFieldRow, EncounterValueField, ImmunityAndWeaknessFieldRow, SizeAndStabilityFieldsRow, StatFieldRow } from "@actor/sheetFieldComponent";
import { EnemyAbilityComponent } from "@enemy/enemyAbilityComponent";
import { IEnemyAbilityData } from "@enemy/enemyAbilityData";

export interface IEnemyComponentContext {
    enemy: IEnemyData;
    abilities: IEnemyAbilityData[]
}

export function EnemySheetComponent(context: IEnemyComponentContext) {
    const enemy = context.enemy;
    const abilities = context.abilities;

    return (
        <form autoComplete="off" className="aeon-draw-steel sheet actor minion">
            <div className="enemy-sheet">
                <div className="header">
                    <span className="left">{enemy.name}&nbsp;</span>
                    <span className="right">Level&nbsp;{enemy.level}&nbsp;{enemy.type}&nbsp;{enemy.role}</span>
                </div>
                <div className="subheader-row">
                    <ArrayField valueClassNames={["left"]} values={enemy.keywords} />
                    <EncounterValueField label="EV" encounterValue={enemy.encounterValue} enemyType={enemy.type} />
                </div>
                <div className="divider"></div>
                <div className="columns">
                    <div className="column left-column">
                        <StatFieldRow label="Stamina" value={
                            enemy.stamina.value !== enemy.stamina.max
                                ? `${enemy.stamina.value} / ${enemy.stamina.max}`
                                : enemy.stamina.max} />
                        <StatFieldRow label="Speed" value={enemy.combat.speed} />
                    </div>
                    <div className="column right-column">
                        <ImmunityAndWeaknessFieldRow immunityLabel="Immunity" immunity={enemy.immunity} weaknessLabel="Weakness" weakness={enemy.weakness} />
                        <SizeAndStabilityFieldsRow sizeLabel="Size" sizeValue={enemy.combat.size} stabilityLabel="Stability" stabilityValue={enemy.combat.stability} />
                        <StatFieldRow label="Free Strike" value={enemy.combat.freeStrikeDamage} defaultValue="1" />
                    </div>
                </div>
                <div className="divider"></div>
                <div className="characteristics-row">
                    <CharacteristicFieldRow label="Might" value={enemy.characteristics.might} />
                    <CharacteristicFieldRow label="Agility" value={enemy.characteristics.agility} />
                    <CharacteristicFieldRow label="Reason" value={enemy.characteristics.reason} />
                    <CharacteristicFieldRow label="Intuition" value={enemy.characteristics.intuition} />
                    <CharacteristicFieldRow label="Presence" value={enemy.characteristics.presence} />
                </div>
                <div className="divider"></div>
                <>
                    {abilities.map(ability => (
                        <EnemyAbilityComponent key={ability.name} enemy={enemy} ability={ability} />
                    ))}
                </>
            </div>
        </form >
    );
}
