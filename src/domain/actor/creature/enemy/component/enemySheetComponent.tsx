// src/components/enemySheetComponent.tsx

import { IEnemyData } from "@enemy/enemyData";
import { ArrayField, CharacteristicField, EncounterValueField, ImmunityAndWeaknessFields, SizeAndStabilityFields, StatField } from "@actor/sheetFieldComponent";
import { EnemyAbilityComponent } from "@enemy/enemyAbilityComponent";
import { IEnemyAbilityData } from "@enemy/enemyAbilityData";
import { EnemyTokenDocument } from "@enemy/enemyTokenDocument";

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
                    <span className="left">{enemyData.name}&nbsp;</span>
                    <span className="right">Level&nbsp;{enemyData.level}&nbsp;{enemyData.type}&nbsp;{enemyData.role}</span>
                </div>
                <div className="subheader-row">
                    <ArrayField valueClassNames={["left"]} values={enemyData.keywords} />
                    <EncounterValueField label="EV" encounterValue={enemyData.encounterValue} enemyType={enemyData.type} />
                </div>
                <div className="divider"></div>
                <div className="columns">
                    <div className="column left-column">
                        <StatField label="Stamina" value={
                            enemyData.stamina.value !== enemyData.stamina.max
                                ? `${enemyData.stamina.value} / ${enemyData.stamina.max}`
                                : enemyData.stamina.max} />
                        <StatField label="Speed" value={enemyData.combat.speed} />
                    </div>
                    <div className="column right-column">
                        <ImmunityAndWeaknessFields immunityLabel="Immunity" immunity={enemyData.immunity} weaknessLabel="Weakness" weakness={enemyData.weakness} />
                        <SizeAndStabilityFields sizeLabel="Size" sizeValue={enemyData.combat.size} stabilityLabel="Stability" stabilityValue={enemyData.combat.stability} />
                        <StatField label="Free Strike" value={enemyData.combat.freeStrikeDamage} defaultValue="1" />
                    </div>
                </div>
                <div className="divider"></div>
                <div className="characteristics-row">
                    <CharacteristicField label="Might" value={enemyData.characteristics.might} />
                    <CharacteristicField label="Agility" value={enemyData.characteristics.agility} />
                    <CharacteristicField label="Reason" value={enemyData.characteristics.reason} />
                    <CharacteristicField label="Intuition" value={enemyData.characteristics.intuition} />
                    <CharacteristicField label="Presence" value={enemyData.characteristics.presence} />
                </div>
                <div className="divider"></div>
                <>
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
                </>
            </div>
        </form >
    );
}
