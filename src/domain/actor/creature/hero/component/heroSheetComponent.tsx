// src/components/heroSheetComponent.tsx

import { IHeroData } from "@hero/heroData";
import { ArrayField, CharacteristicField, EncounterValueField, ImmunityAndWeaknessFields, SizeAndStabilityFields, StatField } from "@actor/sheetFieldComponent";
import { HeroAbilityComponent } from "@hero/heroAbilityComponent";
import { IHeroAbilityData } from "@hero/heroAbilityData";

export interface IHeroComponentContext {
    ref: React.RefObject<HTMLFormElement | null>;
    hero: IHeroData;
    abilities: IHeroAbilityData[]
}

export function HeroSheetComponent(context: IHeroComponentContext) {
    const hero = context.hero;
    const abilities = context.abilities;

    return (
        <form ref={context.ref} autoComplete="off" className="aeon-draw-steel sheet actor hero">
            <div className="enemy-sheet">
                <div className={`header`}>
                    <span className="left">{hero.name}&nbsp;</span>
                    <span className="right">Level&nbsp;{hero.level}&nbsp;{hero.ancestry}&nbsp;{hero.class}</span>
                </div>
                <div className="subheader-row">
                    <ArrayField valueClassNames={["left"]} values={hero.keywords} />
                </div>
                <div className="divider"></div>
                <div className="columns">
                    <div className="column left-column">
                        <StatField label="Stamina" value={
                            hero.stamina.value !== hero.stamina.max
                                ? `${hero.stamina.value} / ${hero.stamina.max}`
                                : hero.stamina.max} />
                        <StatField label="Speed" value={hero.combat.speed} />
                    </div>
                    <div className="column right-column">
                        <ImmunityAndWeaknessFields immunityLabel="Immunity" immunity={hero.immunity} weaknessLabel="Weakness" weakness={hero.weakness} />
                        <SizeAndStabilityFields sizeLabel="Size" sizeValue={hero.combat.size} stabilityLabel="Stability" stabilityValue={hero.combat.stability} />
                    </div>
                </div>
                <div className="divider"></div>
                <div className="characteristics-row">
                    <CharacteristicField label="Might" value={hero.characteristics.might} />
                    <CharacteristicField label="Agility" value={hero.characteristics.agility} />
                    <CharacteristicField label="Reason" value={hero.characteristics.reason} />
                    <CharacteristicField label="Intuition" value={hero.characteristics.intuition} />
                    <CharacteristicField label="Presence" value={hero.characteristics.presence} />
                </div>
                <div className="divider"></div>
                <>
                    {abilities
                        .slice()
                        .sort((a, b) =>
                            (a.isSignature ? -1 : 1) - (b.isSignature ? -1 : 1)
                            || (a.type === "heroTrait" ? 1 : -1) - (b.type === "heroTrait" ? 1 : -1)
                            || (a.type as string).localeCompare(b.type as string)
                            || (a.name as string).localeCompare(b.name as string)
                        )
                        .map(ability => (
                            <HeroAbilityComponent key={ability.name} hero={hero} ability={ability} />
                        ))}
                </>
            </div>
        </form >
    );
}
