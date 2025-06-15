// src/components/minionSheetComponent.tsx

import { IMinionData } from "@minion/minionData";
import { ArrayField, CharacteristicField, EncounterValueField, ImmunityAndWeaknessFields, SizeAndStabilityFields, StatField } from "@actor/sheetFieldComponent";
import { EnemyAbilityComponent } from "@enemy/component/enemyAbilityComponent";
import { IEnemyAbilityData } from "@enemy/enemyAbilityData";


export interface IMinionComponentContext {
    ref: React.RefObject<HTMLFormElement | null>;
    enemy: IMinionData;
    abilities: IEnemyAbilityData[]
}

export function MinionSheetComponent(context: IMinionComponentContext) {
    const enemy = context.enemy;
    const abilities = context.abilities;

    return (
        <form ref={context.ref} autoComplete="off" className="aeon-draw-steel sheet actor minion">
            <div className="enemy-sheet">
                <div className={`header ${enemy.role.toLowerCase()}`}>
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
                        <StatField label="Stamina" value={
                            enemy.squadId
                                ? `${enemy.stamina.value} / ${enemy.stamina.max} (${enemy.stamina.perMinion} per minion)`
                                : enemy.stamina.perMinion} overflow />
                        <StatField label="Speed" value={enemy.combat.speed} defaultValue="5" />
                        <StatField label="With Captain" value={enemy.combat.strikeDamage} template="Strike damage +{value}" overflow />
                        <StatField label="With Captain" value={enemy.derivedCaptainBonuses.speed} template="Speed +{value}" overflow />
                        <StatField label="With Captain" value={enemy.derivedCaptainBonuses.rangedDistanceBonus} template="Ranged distance +{value}" overflow />
                        <StatField label="With Captain" value={enemy.derivedCaptainBonuses.meleeDistanceBonus} template="Melee distance +{value}" overflow />
                        <StatField label="With Captain" value={enemy.appliedCaptainEffects.temporaryStamina} template="{value} temporary stamina" overflow />
                    </div>
                    <div className="column right-column">
                        <ImmunityAndWeaknessFields immunityLabel="Immunity" immunity={enemy.immunity} weaknessLabel="Weakness" weakness={enemy.weakness} />
                        <SizeAndStabilityFields sizeLabel="Size" sizeValue={enemy.combat.size} stabilityLabel="Stability" stabilityValue={enemy.combat.stability} />
                        <StatField label="Free Strike" value={enemy.combat.freeStrikeDamage} defaultValue="1" />
                    </div>
                </div>
                <div className="divider"></div>
                <div className="characteristics-row">
                    <CharacteristicField label="Might" value={enemy.characteristics.might} />
                    <CharacteristicField label="Agility" value={enemy.characteristics.agility} />
                    <CharacteristicField label="Reason" value={enemy.characteristics.reason} />
                    <CharacteristicField label="Intuition" value={enemy.characteristics.intuition} />
                    <CharacteristicField label="Presence" value={enemy.characteristics.presence} />
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
