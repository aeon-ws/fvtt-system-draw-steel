// src/components/enemySheetComponent.tsx

import { IEnemyData } from "@data/enemyData";
import { ArrayField, CharacteristicFieldRow, EncounterValueField, ImmunityAndWeaknessFieldRow, SizeAndStabilityFieldsRow, StatFieldRow } from "@ui/sheetFieldComponent";

export interface IEnemyComponentContext extends IEnemyData {
    onChangeResource: (delta: number) => void;
}

export function EnemySheetComponent(context: IEnemyComponentContext) {
    return (
        <form autoComplete="off" className="aeon-draw-steel sheet actor minion">
          <div className="enemy-sheet">
            <div className="header">
              <span className="left">{context.name}&nbsp;</span>
              <span className="right">Level&nbsp;{context.level}&nbsp;{context.type}&nbsp;{context.role}</span>
            </div>
            <div className="subheader-row">
              <ArrayField classNames={["left"]} values={context.keywords} />
              <EncounterValueField label="EV" encounterValue={context.encounterValue} enemyType={context.type} />
            </div>
            <div className="divider"></div>
            <div className="columns">
              <div className="column left-column">
                <StatFieldRow label="Stamina" value={
                    context.stamina.value !== context.stamina.max
                        ? `${context.stamina.value} / ${context.stamina.max}`
                        : context.stamina.max} />
                <StatFieldRow label="Speed" value={context.combat.speed} />
              </div>
              <div className="column right-column">
                <ImmunityAndWeaknessFieldRow immunityLabel="Immunity" immunity={context.immunity} weaknessLabel="Weakness" weakness={context.weakness} />
                <SizeAndStabilityFieldsRow sizeLabel="Size" sizeValue={context.combat.size} stabilityLabel="Stability" stabilityValue={context.combat.stability} />
                <StatFieldRow label="Free Strike" value={context.combat.freeStrikeDamage} defaultValue="1" />
              </div>
            </div>
            <div className="divider"></div>
            <div className="characteristics-row">
              <CharacteristicFieldRow label="Might" value={context.characteristics.might} />
              <CharacteristicFieldRow label="Agility" value={context.characteristics.agility} />
              <CharacteristicFieldRow label="Reason" value={context.characteristics.reason} />
              <CharacteristicFieldRow label="Intuition" value={context.characteristics.intuition} />
              <CharacteristicFieldRow label="Presence" value={context.characteristics.presence} />
            </div>
            <div className="divider"></div>
          </div>
        </form >
    );
}
