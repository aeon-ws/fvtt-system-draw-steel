
public record Monster(string Name,
    int Level,
    string Type,
    string? Role,
    List<string> Keywords,
    int? EncounterValue,
    int Stamina,
    int Speed,
    List<string> MovementTypes,
    string Size,
    int Stability,
    int FreeStrikeDamage,
    Characteristics Characteristics,
    Dictionary<string, int>? Weakness,
    Dictionary<string, int>? Immunity,
    DerivedCaptainBonuses? DerivedCaptainBonuses,
    AppliedCaptainEffects? AppliedCaptainEffects,
    List<object> Abilities,
    List<object> Traits)
{
}
