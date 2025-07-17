// src/components/heroSheetComponent.tsx

import { ArrayField, CharacteristicField, ImmunityAndWeaknessFields, SizeAndStabilityFields, StatField } from "@actor/sheetFieldComponent";
import { HeroAbilityComponent } from "@hero/heroAbilityComponent";
import { HeroTokenDocument } from "@hero/heroTokenDocument";
import { IHeroData } from "@hero/heroData";
import { IHeroAbilityData } from "@hero/heroAbilityData";


export interface IHeroComponentContext {
    ref: React.RefObject<HTMLFormElement | null>;
    hero: HeroTokenDocument<IHeroData>;
    abilities: IHeroAbilityData[]
}

export function HeroSheetComponent(context: IHeroComponentContext) {
    const hero = context.hero;
    const heroData = hero.data;
    const abilities = context.abilities;

    return (
        <form ref={context.ref} autoComplete="off" className="aeon-draw-steel sheet actor hero">
            <div className="enemy-sheet">
                <div className={`header`}>
                    <span className="left">{heroData.name}&nbsp;</span>
                    <span className="right">Level&nbsp;{heroData.level}&nbsp;{heroData.ancestry}&nbsp;{heroData.class}</span>
                </div>
                <div className="subheader-row">
                    <ArrayField valueClassNames={["left"]} values={heroData.keywords} />
                </div>
                <div className="divider"></div>
                <div className="columns">
                    <div className="column left-column">
                        <StatField label="Stamina" value={
                            heroData.stamina.value !== heroData.stamina.max
                                ? `${heroData.stamina.value} / ${heroData.stamina.max}`
                                : heroData.stamina.max} />
                        <StatField label="Speed" value={heroData.combat.speed} />
                    </div>
                    <div className="column right-column">
                        <ImmunityAndWeaknessFields immunityLabel="Immunity" immunity={heroData.immunity} weaknessLabel="Weakness" weakness={heroData.weakness} />
                        <SizeAndStabilityFields sizeLabel="Size" sizeValue={heroData.combat.size} stabilityLabel="Stability" stabilityValue={heroData.combat.stability} />
                    </div>
                </div>
                <div className="divider"></div>
                <div className="characteristics-row">
                    <CharacteristicField label="Might" value={heroData.characteristics.might} />
                    <CharacteristicField label="Agility" value={heroData.characteristics.agility} />
                    <CharacteristicField label="Reason" value={heroData.characteristics.reason} />
                    <CharacteristicField label="Intuition" value={heroData.characteristics.intuition} />
                    <CharacteristicField label="Presence" value={heroData.characteristics.presence} />
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
