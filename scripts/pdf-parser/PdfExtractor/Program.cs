
using iText.Commons.Datastructures;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Tagutils;
using iText.Kernel.Utils;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using System.Threading.Tasks.Dataflow;
using System.Xml;
using System.Xml.Linq;

class Program
{
    static async Task Main(string[] args)
    {
        var rawAccessibleFilePath = "C:/_/aeon/fvtt-system-draw-steel/accessible-raw.xml";
        var normalizedAccessibleFilePath = "C:/_/aeon/fvtt-system-draw-steel/accessible-normalized.xml";
        var accessibleFormattedFilePath = "C:/_/aeon/fvtt-system-draw-steel/accessible-formatted.xml";
        //ExtractPdfTagsAsXmlFile("C:/_/aeon/fvtt-system-draw-steel/Draw_Steel_Monsters_v1.pdf", rawAccessibleFilePath);
        var normalizer = new PdfTagNormalizer();
        normalizer.Normalize(rawAccessibleFilePath, normalizedAccessibleFilePath);
        Format(normalizedAccessibleFilePath, accessibleFormattedFilePath);
        await ParseMonsters(accessibleFormattedFilePath);
    }

    static async Task ParseMonsters(string inputFilePath)
    {
        var xmlDocument = XDocument.Load(inputFilePath);
        var parseMonsterTasks = new List<Task>();

        var monsterElements = xmlDocument.Root?.Element("Article")?.Elements() ?? [];
        foreach (var monsterElement in monsterElements)
        {
            if (monsterElement.Value.Trim().Length == 0)
            {
                Console.WriteLine("Empty Sect element found. Skipping.");
                continue;
            }

            var headerElement =
                monsterElement.Elements().First().Name == "Sect"
                    ? monsterElement.Element("Sect")?.Element("Story")
                    : monsterElement.Element("Story");
            if (headerElement == null)
            {
                Console.WriteLine($"No header element found.  Sect: {monsterElement}");
                continue;
            }

            var headerElements = headerElement.Elements().ToList();
            var name = @"[a-z][a-z' -]*[a-z]";
            var namePattern = @$"(?<Name>{name})";
            var levelPattern = @"Level[ ]+(?<Level>10|[1-9])";
            var organizationPattern = @"(?<Organization>Minion|Horde|Platoon|Elite|Leader|Solo)";
            var rolePattern = @"(?<Role>Ambusher|Artillery|Brute|Controller|Defender|Harrier|Hexer|Mount|Support)";
            var retainerPattern = @$"{rolePattern}[ ]+(?<Organization>Retainer)";
            var headerPattern = $"^[ ]*{namePattern}[ ]*{levelPattern}[ ]*(?:{organizationPattern}?[ ]*{rolePattern}?|{retainerPattern})[ ]*$";
            var headerRegex = new Regex(headerPattern, RegexOptions.IgnoreCase | RegexOptions.ExplicitCapture);

            var headerValue = headerElements[0].Value.Trim();
            var headerMatch = headerRegex.Match(headerValue);
            List<string> keywords = [
                "Abyssal",
                "Accursed",
                "Animal",
                "Beast",
                "Construct",
                "Dragon",
                "Elemental",
                "Fey",
                "Giant",
                "Horror",
                "Humanoid",
                "Infernal",
                "Plant",
                "Swarm",
                "Undead",
                "Mystic Goblin",
                "Goblin",
                "Ruinborn",
                "Bugbear",
                "Werebeast",
                "Water Wolf",
                "Rival",
                "Arixx",
                "Human",
                "Dwarf",
                "Polder",
                "Ooze",
                "Angulotl",
                "Ankheg",
                "Basilisk",
                "Bredbeddle",
                "Chimera",
                "Demon",
                "Soulraker",
                "Devil",
                "Planar",
                "Draconian",
                "High Elf",
                "Shadow Elf",
                "Wode Elf",
                "Fire Giant",
                "Frost Giant",
                "Storm Giant",
                "Stone Giant",
                "Hill Giant",
                "Gnoll",
                "Griffon",
                "Hag",
                "Hobgoblin",
                "Worm",
                "Kobold",
                "Lightbender",
                "Lizardfolk",
                "Manticore",
                "Medusa",
                "Minotaur",
                "Ogre",
                "Orc",
                "Olothec",
                "Radenwight",
                "Shambling Mound",
                "Time Raider",
                "Troll",
                "Mummy",
                "Vampire",
                "Corporeal",
                "Incorporeal",
                "Multivok",
                "Valok",
                "Servok",
                "Voiceless Talker",
                "War Dog",
                "Wyvern",
                "Overmind",
                "Eyestalk",
                "Soulless"
            ];

            var keywordPattern = @$"(?<Keywords>(?:{string.Join("|", keywords)})(?:(?:.|,)[ ]?(?:{string.Join("|", keywords)}))*)";
            var encounterValuePattern = @"(?:EV[ ]*(?<EncounterValue>\d+)[ ]*(?:for (?:four|4) minions?)?)";
            var subHeaderPattern = @$"^{keywordPattern}[. ]*{encounterValuePattern}?[\ ]*$";
            var subHeaderRegex = new Regex(subHeaderPattern, RegexOptions.IgnoreCase | RegexOptions.ExplicitCapture);

            var subHeaderValue = headerElements[1].Value.Trim();
            var subHeaderMatch = subHeaderRegex.Match(subHeaderValue);

            XElement combatStatsElement =
                monsterElement
                    .Elements("Story")
                    .FirstOrDefault(e =>
                        e.Elements().Any(el => el.Name == "NormalParagraphStyle"))
                ?? throw new Exception($"No combat stats found for monster: {headerValue}");

            var combatStats =
                combatStatsElement
                    .Elements("NormalParagraphStyle")
                    .SelectMany(e => e.Elements("Table"))
                    .SelectMany(t => t.Elements("TBody"))
                    .SelectMany(tb => tb.Elements("TR"))
                    .SelectMany(tr => tr.Elements("TD"))
                    .Select(td => td.Value.Trim())
                    .ToList();

            var monster = new Monster(
                Name: headerMatch.Groups["Name"].Value,
                Level: int.Parse(headerMatch.Groups["Level"].Value),
                Type: headerMatch.Groups["Organization"].Value,
                Role: headerMatch.Groups["Role"].Value,
                Keywords: [.. subHeaderMatch.Groups["Keywords"].Value.Split(",").Select(v => v.Trim())],
                EncounterValue:
                    subHeaderMatch.Groups["EncounterValue"].Success
                        ? int.Parse(subHeaderMatch.Groups["EncounterValue"].Value)
                        : null,
                Size: combatStats[0],
                Speed: int.Parse(combatStats[1]),
                Stamina: int.Parse(combatStats[2]),
                Stability: int.Parse(combatStats[3]),
                FreeStrikeDamage: int.Parse(combatStats[4]),
                MovementTypes: new List<string>(), // Placeholder, needs to be parsed from the XML
                Characteristics:
                    new Characteristics(
                        Might: 1,
                        Agility: 1,
                        Reason: 1,
                        Intuition: 1,
                        Presence: 1),
                Weakness: null, // Placeholder, needs to be parsed from the XML
                Immunity: null, // Placeholder, needs to be parsed from the XML
                DerivedCaptainBonuses: new DerivedCaptainBonuses(
                    Speed: null, // Placeholder, needs to be parsed from the XML
                    MeleeDistanceBonus: null, // Placeholder, needs to be parsed from the XML
                    RangedDistanceBonus: null, // Placeholder, needs to be parsed from the XML
                    StrikeDamage: null, // Placeholder, needs to be parsed from the XML
                    StrikeEdge: null // Placeholder, needs to be parsed from the XML
                ),
                AppliedCaptainEffects: new AppliedCaptainEffects(
                    TemporaryStamina: 0 // Placeholder, needs to be parsed from the XML
                ),
                Abilities: new List<object>(), // Placeholder, needs to be parsed from the XML
                Traits: new List<object>() // Placeholder, needs to be parsed from the XML
            );

            Console.WriteLine(JsonSerializer.Serialize(monster));
        }

        await Task.WhenAll(parseMonsterTasks);
    }

    static void ParseSect(XElement sect)
    {
        Console.WriteLine($"{sect.Elements().First().Elements().First()?.Value ?? "No Monster Role"}");
    }

    static void Format(string inputUnformattedXmlFilePath, string outputFormattedXmlFilePath)
    {
        var inputText = File.ReadAllText(inputUnformattedXmlFilePath);
        inputText = inputText.Replace("\r", string.Empty).Replace("\n", string.Empty);
        File.WriteAllText(inputUnformattedXmlFilePath, inputText);

        var readerSettings = new XmlReaderSettings
        {
            IgnoreWhitespace = true,
            IgnoreComments = false,
        };

        var writerSettings = new XmlWriterSettings
        {
            Indent = true,               // Enable indentation
            IndentChars = "  ",          // Two spaces
            NewLineChars = "\n",         // Unix-style line endings
            NewLineHandling = NewLineHandling.Replace,
            Encoding = System.Text.Encoding.UTF8,
            OmitXmlDeclaration = false,   // Keep XML declaration
            CloseOutput = true,
        };

        using var r = XmlReader.Create(inputUnformattedXmlFilePath, readerSettings);
        using var w = XmlWriter.Create(outputFormattedXmlFilePath, writerSettings);

        w.WriteNode(r, false);
    }

    static void ExtractPdfTagsAsXmlFile(string inputFilePath, string outputFilePath)
    {
        using var pdf = new PdfDocument(new PdfReader(inputFilePath));
        var tool = new TaggedPdfReaderTool(pdf);

        using var fileStream = File.Create(outputFilePath);
        tool.ConvertToXml(fileStream);
    }
}
