// src/components/minionSheetComponent.tsx

import { IMinionData } from "@minion/minionData";
import { ArrayField, CharacteristicField, EncounterValueField, ImmunityAndWeaknessFields, SizeAndStabilityFields, StatField } from "@actor/sheetFieldComponent";


export interface IMinionComponentContext extends IMinionData {
}

export function MinionSheetComponent(context: IMinionComponentContext) {
    return (
        <form autoComplete="off" className="aeon-draw-steel sheet actor minion">
          <div className="enemy-sheet">
            <div className="header">
              <span className="left">{context.name}&nbsp;</span>
              <span className="right">Level&nbsp;{context.level}&nbsp;{context.type}&nbsp;{context.role}</span>
            </div>
            <div className="subheader-row">
              <ArrayField valueClassNames={["left"]} values={context.keywords} />
              <EncounterValueField label="EV" encounterValue={context.encounterValue} enemyType={context.type} />
            </div>
            <div className="divider"></div>
            <div className="columns">
              <div className="column left-column">
                <StatField label="Stamina" value={
                    context.squadId
                        ? `${context.stamina.value} / ${context.stamina.max} (${context.stamina.perMinion} per minion)`
                        : context.stamina.perMinion} overflow />
                <StatField label="Speed" value={context.combat.speed} defaultValue="5" />
                <StatField label="With Captain" value={context.combat.strikeDamage} template="Strike damage +{value}" overflow />
                <StatField label="With Captain" value={context.derivedCaptainBonuses.speed} template="Speed +{value}" overflow />
                <StatField label="With Captain" value={context.derivedCaptainBonuses.rangedDistanceBonus} template="Ranged distance +{value}" overflow />
                <StatField label="With Captain" value={context.derivedCaptainBonuses.meleeDistanceBonus} template="Melee distance +{value}" overflow />
                <StatField label="With Captain" value={context.appliedCaptainEffects.temporaryStamina} template="{value} temporary stamina" overflow />
              </div>
              <div className="column right-column">
                <ImmunityAndWeaknessFields immunityLabel="Immunity" immunity={context.immunity} weaknessLabel="Weakness" weakness={context.weakness} />
                <SizeAndStabilityFields sizeLabel="Size" sizeValue={context.combat.size} stabilityLabel="Stability" stabilityValue={context.combat.stability} />
                <StatField label="Free Strike" value={context.combat.freeStrikeDamage} defaultValue="1" />
              </div>
            </div>
            <div className="divider"></div>
            <div className="characteristics-row">
              <CharacteristicField label="Might" value={context.characteristics.might} />
              <CharacteristicField label="Agility" value={context.characteristics.agility} />
              <CharacteristicField label="Reason" value={context.characteristics.reason} />
              <CharacteristicField label="Intuition" value={context.characteristics.intuition} />
              <CharacteristicField label="Presence" value={context.characteristics.presence} />
            </div>
            <div className="divider"></div>
          </div>
        </form >
    );
}
