// src/components/minionSheetComponent.tsx

import { IMinionData } from "@minion/minionData";
import { ArrayField, CharacteristicField, EncounterValueField, ImmunityField, WeaknessField, SizeAndStabilityFields, StatField } from "@actor/sheetFieldComponent";
import { EnemyAbilityComponent } from "@enemy/component/enemyAbilityComponent";
import { IEnemyAbilityData } from "@enemy/enemyAbilityData";
import { MinionTokenDocument } from "@minion/minionTokenDocument";


export interface IMinionComponentContext {
    ref: React.RefObject<HTMLFormElement | null>;
    enemy: MinionTokenDocument<IMinionData>;
    abilities: IEnemyAbilityData[]
}

export function MinionSheetComponent(context: IMinionComponentContext) {
    const enemy = context.enemy;
    const enemyData = enemy.data;
    const abilities = context.abilities;

    return (
        <form ref={context.ref} autoComplete="off" className="aeon-draw-steel sheet actor minion">
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
                        enemyData.squadId
                            ? `${enemyData.stamina.value} / ${enemyData.stamina.max} (${enemyData.stamina.perMinion} / minion)`
                            : `${enemyData.stamina.perMinion} / minion`} />
                    <StatField label="Stability" value={enemyData.combat.stability} />
                    <StatField label="Free Strike" value={enemyData.combat.freeStrikeDamage} defaultValue="1" />
                </div>
                <div className="columns">
                    <div className="column left-column">
                        <ImmunityField immunity={enemyData.immunity} />
                        <StatField label="Movement" value={enemyData.combat.movementTypes.toString()} />
                    </div>
                    <div className="column right-column">
                        <WeaknessField weakness={enemyData.weakness} />
                        <StatField label="With Captain" value={enemyData.combat.strikeDamage} template="Strike damage +{value}" overflow />
                        <StatField label="With Captain" value={enemyData.derivedCaptainBonuses.speed} template="Speed +{value}" overflow />
                        <StatField label="With Captain" value={enemyData.derivedCaptainBonuses.rangedDistanceBonus} template="Ranged distance +{value}" overflow />
                        <StatField label="With Captain" value={enemyData.derivedCaptainBonuses.meleeDistanceBonus} template="Melee distance +{value}" overflow />
                        <StatField label="With Captain" value={enemyData.appliedCaptainEffects.temporaryStamina} template="{value} temporary stamina" overflow />
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
