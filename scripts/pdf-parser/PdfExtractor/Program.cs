
using iText.Commons.Datastructures;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Tagutils;
using iText.Kernel.Utils;
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
        var normalizedAccessible2FilePath = "C:/_/aeon/fvtt-system-draw-steel/accessible-normalized-2.xml";
        ExtractPdfTagsAsXmlFile("C:/_/aeon/fvtt-system-draw-steel/Draw_Steel_Monsters_v1.pdf", rawAccessibleFilePath);
        NormalizePdfTags(rawAccessibleFilePath, normalizedAccessibleFilePath);
        NormalizePdfTags2(normalizedAccessibleFilePath, normalizedAccessible2FilePath);
        Format(normalizedAccessible2FilePath, "C:/_/aeon/fvtt-system-draw-steel/accessible-formatted.xml");
        //await ParseMonsters();
    }

    static async Task ParseMonsters()
    {
        // using var xmlReader =
        //     XmlReader.Create(
        //         "C:/_/aeon/fvtt-system-draw-steel/accessible-formatted-final.xml",
        //         new XmlReaderSettings { IgnoreWhitespace = true });

        var xmlDocument = XDocument.Load("C:/_/aeon/fvtt-system-draw-steel/accessible-formatted-final.xml");
        var parseMonsterTasks = new List<Task>();

        var articleElements = xmlDocument.Root?.Element("Article")?.Elements() ?? [];
        foreach (var articleElement in articleElements)
        {
            if (articleElement.Name.LocalName != "Sect")
            {
                Console.WriteLine($"Unexpected element: {articleElement.Name.LocalName}");
                continue;
            }

            var headerElement =
                articleElement.Elements().First().Name == "Sect"
                    ? articleElement.Element("Sect")?.Element("Story")
                    : articleElement.Element("Story");
            if (headerElement == null)
            {
                Console.WriteLine($"No header element found.  Sect: {articleElement.ToString()}");
                continue;
            }
            var headerElements = headerElement.Elements().ToList();
            var namePattern = @"(?<Name>[a-z][a-z' -]*[a-z])";
            var levelPattern = @"Level[ ]+(?<Level>10|[1-9])";
            var organizationPattern = @"(?<Organization>Minion|Horde|Platoon|Elite|Leader|Solo)";
            var rolePattern = @"(?<Role>Ambusher|Artillery|Brute|Controller|Defender|Harrier|Hexer|Mount|Support)";
            var headerPattern = $"^[ ]*{namePattern}[ ]+{levelPattern}[ ]+{organizationPattern}([ ]+{rolePattern})?[ ]*$";
            var headerRegex = new Regex(headerPattern, RegexOptions.IgnoreCase | RegexOptions.ExplicitCapture);
            Console.WriteLine($"Header pattern: {headerPattern}");
            Console.WriteLine($"Parsing header: {headerElements[0].Value}");
            var headerMatch = headerRegex.Match(headerElements[0].Value);

            var headerLine2 = headerElements[1].Value;
            Console.WriteLine($"Name: {headerMatch.Groups["Name"]} | Level: {headerMatch.Groups["Level"]} | Organization: {headerMatch.Groups["Organization"]} | Role: {headerMatch.Groups["Role"]}");
            Console.WriteLine();
        }
        ;

        // while (xmlReader.Read())
        // {
        //     Console.WriteLine(xmlReader.LocalName);
        //     // Check if the current node is an element and has the name "Sect"
        //     if (xmlReader.NodeType == XmlNodeType.Element && xmlReader.LocalName == "Sect")
        //     {
        //         // Read the Sect element and parse it
        //         if (XNode.ReadFrom(xmlReader) is XElement sectElement)
        //         {
        //             ParseSect(sectElement);
        //         }
        //         else
        //         {
        //             Console.WriteLine($"Failed to read Sect element: {xmlReader.LocalName}.");
        //         }
        //     }
        // }

        // await foreach (var sect in ReadSectsAsync(xmlReader))
        // {
        //     ParseSect(sect);
        //     // parseMonsterTasks.Add(Task.Run(() => ParseSect(sect)));
        // }

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

    static void NormalizePdfTags(string inputFilePath, string outputFilePath)
    {
        var xmlDocument = XDocument.Load(inputFilePath);
        XElement root = xmlDocument.Root!;

        root.Descendants("Figure")?.ToList().ForEach(e => e.Remove());

        root.Element("Article")?.Remove();
        var mainArticle = root.Element("Article")!;

        for (var i = 0; i < 40; i++)
        {
            mainArticle.Element("Sect")?.Remove();
        }

        for (var i = 0; i < 12; i++)
        {
            mainArticle.Element("Story")?.Remove();
        }

        // Chapter Titles

        mainArticle
            .Elements("Story")
            .Where(e => e.Element("Heading_0_-_Black_Boss") != null || e.Element("Heading_0_-_Black") != null)
            .ToList()
            .ForEach(e => e.Remove());

        // Malice Features

        mainArticle
            .Elements("Sect")
            .Where(e => e.Element("Story")?.Element("Monster_Role")?.Value.Contains("Malice Features") ?? false)
            .ToList()
            .ForEach(e => e.Remove());

        mainArticle
            .Elements("Sect")
            .Where(e => e.Element("Story")?.Element("Stat_Monster_Name")?.Value.Contains("Malice Features") ?? false)
            .ToList()
            .ForEach(e => e.Remove());

        mainArticle
            .Elements("Sect")
            .Where(e => e.Element("Sect")?.Element("Story")?.Element("Monster_Role")?.Value.Contains("Malice Features") ?? false)
            .ToList()
            .ForEach(e => e.Remove());

        mainArticle
            .Elements("Sect")
            .Where(e => e.Element("Sect")?.Element("Story")?.Element("Stat_Monster_Name")?.Value.Contains("Malice Features") ?? false)
            .ToList()
            .ForEach(e => e.Remove());

        mainArticle
            .Elements("Story")
            .Where(e => e.Element("Monster_Role")?.Value.Contains("Malice Features") ?? false)
            .ToList()
            .ForEach(e => e.Remove());

        mainArticle
            .Elements("Story")
            .Where(e => e.Element("Stat_Monster_Name")?.Value.Contains("Malice Features") ?? false)
            .ToList()
            .ForEach(e => e.Remove());

        mainArticle
            .Elements("Story")
            .Where(e => e.Element("Feature_Intro_Text") != null)
            .ToList()
            .ForEach(e => e.Remove());

        // Sidebars

        mainArticle
            .Elements("Sect")
            .Where(e => e.Element("Story")?.Element("Sidebar_Heading") != null)
            .ToList()
            .ForEach(e => e.Remove());

        // Tables

        mainArticle
            .Elements("Sect")
            .Where(e => e.Element("Story")?.Element("Table_Title") != null)
            .ToList()
            .ForEach(e => e.Remove());

        mainArticle
            .Elements("Story")
            .Where(e => e.Element("Table_Title") != null)
            .ToList()
            .ForEach(e => e.Remove());

        // Fluff
        mainArticle
            .Descendants("Story")
            .Where(e => e.Element("Heading_1_-_Black") != null || e.Element("Heading_2_-_Black") != null || e.Element("Heading_3_-_Black") != null)
            .ToList()
            .ForEach(e => e.Remove());

        mainArticle
            .Elements("Sect")
            .Where(e => e.Element("Story")?.Element("Pull_Quote_Body") != null)
            .ToList()
            .ForEach(e => e.Remove());

        mainArticle
            .Elements("Sect")
            .Where(e => e.Element("Story")?.Element("Advancement_Header") != null)
            .ToList()
            .ForEach(e => e.Remove());

        mainArticle
            .Elements("Story")
            .Where(e => e.Element("Body")?.Value?.Contains("A retainer is a type of NPC follower") ?? false)
            .ToList()
            .ForEach(e => e.Remove());

        // Retainer Advancement
        var retainerPowerNameRegex = new Regex(
            @"Face Grab|Shadow Drag|Spew Death|Slow-Poison Needle|Shadow Dagger|Snipe|Magic Arrows|Weaving Knives|Horn Toss|Triumphant Squeak|Hangry Frenzy|Mazed|Take Root|Backfire Curse|Rearing Trample|Giddyup!|Cavalry Charge|It’s Me You Want!|Watch Out!|Big Windup|Oil Slick|Line ’Em Up|Supporting Volley|Elemental Blast|Hold ’Em Down",
            RegexOptions.IgnoreCase);
        mainArticle
            .Elements("Sect")
            .Where(e => retainerPowerNameRegex.IsMatch(e.Element("Story")?.Element("Stat_Block_Ability_Header")?.Value ?? string.Empty))
            .ToList()
            .ForEach(e => e.Remove());

        // Titles

        mainArticle
            .Elements("Story")
            .Where(e => e.Element("Chapter_Title_-_White") != null)
            .ToList()
            .ForEach(e => e.Remove());

        // Monster Headers

        var monsterHeaders = mainArticle.Descendants("Monster_Role").ToList() ?? [];
        foreach (var element in monsterHeaders)
        {
            element.Name = "Stat_Monster_Name";
        }

        // Retainer Headers
        var retainerHeaders = mainArticle.Descendants("Stat_Retainer_Name").ToList() ?? [];
        foreach (var element in retainerHeaders)
        {
            element.Name = "Stat_Monster_Name";
        }

        // Dynamic Terrain Objects

        mainArticle
            .Elements("Story")
            .Where(e => e.Element("DTO_Feature_Intro_Text") != null)
            .ToList()
            .ForEach(e => e.Remove());

        xmlDocument.Save(outputFilePath);
    }

    static void NormalizePdfTags2(string inputFilePath, string outputFilePath)
    {
        var xmlDocument = XDocument.Load(inputFilePath);
        XElement root = xmlDocument.Root!;
        XElement mainArticle = root.Element("Article")!;

        var nestedSects = mainArticle.Elements("Sect").Elements("Sect").ToList();
        foreach (var nestedSect in nestedSects)
        {
            nestedSect.ReplaceWith([.. nestedSect.Elements()]);
        }

        // Targeted Normalization

        /// Radenwight Redeye (misplaced combat stats element)
        var radenwightRedeyeSect =
            mainArticle
                .Elements("Sect")
                .Where(e => e.Element("Story")?.Element("Stat_Monster_Name")?.Value.Contains("Radenwight Redeye") == true)
                .FirstOrDefault();
        var radenwightRedeyeCombatStats =
            mainArticle
                .Elements("Story")
                .Where(e => e.Element("NormalParagraphStyle")?.Element("Table")?.Attribute("bBox")?.Value.Contains("[312.997 678.49 554.761 702.52 ]") == true)
                .FirstOrDefault();
        radenwightRedeyeSect?.ReplaceWith(
            new XElement(
                "Sect",
                radenwightRedeyeSect.Element("Story"),
                radenwightRedeyeCombatStats,
                radenwightRedeyeSect.Elements("Story").Where(e => e.Element("Stat_Block_Data")?.Value.Contains("Immunity") == true)));
        radenwightRedeyeCombatStats?.Remove();

        /// Wodenelg (misplaced combat stats element)
        var wodenelgSect =
            mainArticle
                .Elements("Sect")
                .Where(e => e.Element("Story")?.Element("Stat_Monster_Name")?.Value.Contains("Wodenelg") == true)
                .FirstOrDefault();
        var wodenelgCombatStats =
            wodenelgSect?.ElementsAfterSelf("Story").First();
        wodenelgSect?.ReplaceWith(
            new XElement(
                "Sect",
                wodenelgSect.Element("Story"),
                wodenelgCombatStats,
                wodenelgSect.Elements("Story").Where(e => e.Element("Stat_Block_Data")?.Value.Contains("Immunity") == true)));
        wodenelgCombatStats?.Remove();

        /// Fire Giant Lightbearer (misplaced combat stats element)
        var lightbearerSect =
            mainArticle
                .Elements("Sect")
                .Where(e => e.Element("Story")?.Element("Stat_Monster_Name")?.Value.Contains("Lightbearer") == true)
                .FirstOrDefault();
        var lightbearerCombatStats =
            lightbearerSect?.ElementsAfterSelf("Story").First();
        lightbearerSect?.ReplaceWith(
            new XElement(
                "Sect",
                lightbearerSect.Element("Story"),
                lightbearerCombatStats,
                lightbearerSect.Elements("Story").Where(e => e.Element("Stat_Block_Data")?.Value.Contains("Immunity") == true)));
        lightbearerCombatStats?.Remove();

        /// Fire Giant Lightbearer (misplaced combat stats element)
        var hagSect =
            mainArticle
                .Elements("Sect")
                .Where(e => e.Element("Story")?.Element("Stat_Monster_Name")?.Value.Contains("Wode Hag") == true)
                .FirstOrDefault();
        var hagMain =
            hagSect?.ElementsAfterSelf("Story").First();
        hagSect?.ReplaceWith(
            new XElement(
                "Sect",
                hagSect.Element("Story"),
                hagSect.Elements("Story").Where(e => e.Element("NormalParagraphStyle")?.Element("Table")?.Attribute("bBox")?.Value.Contains("[") == true),
                hagMain));
        hagMain?.Remove();

        /// Medusa (misplaced combat stats element)
        var medusaSect =
              mainArticle
                  .Elements("Sect")
                  .Where(e => e.Element("Story")?.Element("Stat_Monster_Name")?.Value.Contains("Medusa") == true)
                  .FirstOrDefault();
        var medusaMain =
            medusaSect?.ElementsAfterSelf("Story").First();
        medusaSect?.ReplaceWith(
            new XElement(
                "Sect",
                medusaSect.Element("Story"),
                medusaSect.Elements("Story").Where(e => e.Element("NormalParagraphStyle")?.Element("Table")?.Attribute("bBox")?.Value.Contains("[") == true),
                medusaMain));
        medusaMain?.Remove();

        /// Ceramic Horse (misplaced header and combat stats elements)
        var ceramicHorseSect =
              mainArticle
                  .Elements("Sect")
                  .Where(e => e.Element("Sect")?.Element("Story")?.Element("Stat_Monster_Name")?.Value.Contains("Ceramic Horse") == true)
                  .FirstOrDefault();
        ceramicHorseSect?.ReplaceWith(
            new XElement(
                "Sect",
                ceramicHorseSect.Element("Sect")?.Element("Story"),
                ceramicHorseSect.Element("Sect")?.Element("Story")?.NextNode as XElement,
                ceramicHorseSect.Element("Story")));
        ceramicHorseSect?.Element("Sect")?.Remove();

        /// Bugbear Commando (missing header and combat stats)
        RepairMonsterFromMainElement(
            mainArticle,
            mainElementName: "Ability_Data_Leading_Colon",
            mainElementValuePattern: "If the commando",
            name: "Bugbear Commando",
            level: 2,
            organization: "Retainer",
            role: "Ambusher",
            keywords: ["Bugbear", "Fey", "Goblin", "Humanoid"],
            size: "1L",
            speed: 5,
            stamina: 30,
            stability: 0,
            freeStrike: 2);

        /// Goblin Underboss (missing header and combat stats)
        RepairMonsterFromMainElement(
            mainArticle,
            mainElementName: "Stat_Block_Ability_Header",
            mainElementValuePattern: "m  Swordplay",
            name: "Goblin Underboss",
            level: 1,
            organization: "Horde",
            role: "Support",
            keywords: ["Goblin", "Humanoid"],
            encounterValue: 3,
            size: "1S",
            speed: 5,
            stamina: 15,
            stability: 0,
            freeStrike: 1);

        /// Goblin Warrior (missing header and combat stats)
        RepairMonsterFromMainElement(
            mainArticle,
            mainElementName: "Stat_Block_Ability_Header",
            mainElementValuePattern: "Spear Charge",
            name: "Goblin Warrior",
            level: 1,
            organization: "Horde",
            role: "Harrier",
            keywords: ["Goblin", "Humanoid"],
            encounterValue: 3,
            size: "1S",
            speed: 6,
            stamina: 15,
            stability: 0,
            freeStrike: 1);

        /// Kobold Saggitarion (missing header and combat stats)
        RepairMonsterFromMainElement(
            mainArticle,
            mainElementName: "Ability_Data_Leading_Colon",
            mainElementValuePattern: "sagittarion",
            name: "Kobold Saggitarion",
            level: 1,
            organization: "Minion",
            role: "Artillery",
            keywords: ["Humanoid", "Kobold"],
            encounterValue: 3,
            size: "1S",
            speed: 5,
            stamina: 3,
            stability: 0,
            freeStrike: 2);

        /// Kobold Artifex (missing header and combat stats)
        RepairMonsterFromMainElement(
            mainArticle,
            mainElementName: "Stat_Block_Ability_Header",
            mainElementValuePattern: "Chain Hook",
            name: "Kobold Artifex",
            level: 1,
            organization: "Horde",
            role: "Controller",
            keywords: ["Humanoid", "Kobold"],
            encounterValue: 3,
            size: "1S",
            speed: 5,
            stamina: 10,
            stability: 0,
            freeStrike: 1);

        /// Lizardfolk Shellguard (missing header and combat stats)
        RepairMonsterFromMainElement(
            mainArticle,
            mainElementName: "Stat_Block_Ability_Header",
            mainElementValuePattern: "m Shield Smash",
            name: "Lizardfolk Shellguard",
            level: 1,
            organization: "Minion",
            role: "Defender",
            keywords: ["Humanoid", "Lizardfolk"],
            encounterValue: 3,
            size: "1L",
            speed: 5,
            stamina: 6,
            stability: 1,
            freeStrike: 1);

        /// Lizardfolk Tonguer (missing header and combat stats)
        RepairMonsterFromMainElement(
            mainArticle,
            mainElementName: "Ability_Data_Leading_Colon",
            mainElementValuePattern: "adjacent to the tonguer",
            name: "Lizardfolk Tonguer",
            level: 1,
            organization: "Minion",
            role: "Artillery",
            keywords: ["Humanoid", "Lizardfolk"],
            encounterValue: 3,
            size: "1S",
            speed: 5,
            stamina: 3,
            stability: 0,
            freeStrike: 2);

        /// Clawfish (missing header and combat stats)
        RepairMonsterFromMainElement(
            mainArticle,
            mainElementName: "Stat_Block_Ability_Header",
            mainElementValuePattern: "Hookclaw",
            name: "Clawfish",
            level: 1,
            organization: "Minion",
            role: "Brute",
            keywords: ["Angulotl", "Animal"],
            encounterValue: 3,
            size: "1S",
            speed: 5,
            stamina: 5,
            stability: 0,
            freeStrike: 2);

        /// Angulotl Wave (missing header and combat stats)
        RepairMonsterFromMainElement(
            mainArticle,
            mainElementName: "Stat_Block_Ability_Header",
            mainElementValuePattern: "Refulgent Beams",
            name: "Angulotl Wave",
            level: 1,
            organization: "Horde",
            role: "Controller",
            keywords: ["Angulotl", "Humanoid"],
            encounterValue: 3,
            size: "1S",
            speed: 5,
            stamina: 10,
            stability: 0,
            freeStrike: 1);

        /// Gnoll Mage Mauler (missing header and combat stats)
        RepairMonsterFromMainElement(
            mainArticle,
            mainElementName: "Stat_Block_Ability_Header",
            mainElementValuePattern: "Wizard Ripper",
            name: "Gnoll Mage Mauler",
            level: 5,
            organization: "Minion",
            role: "Hexer",
            keywords: ["Abyssal", "Gnoll"],
            encounterValue: 4,
            size: "1M",
            speed: 5,
            stamina: 4,
            stability: 1,
            freeStrike: 2);

        /// Hobgoblin War Mage (missing header and combat stats)
        RepairMonsterFromMainElement(
            mainArticle,
            mainElementName: "Ability_Data_Leading_Colon",
            mainElementValuePattern: "the war mage can teleport",
            name: "Hobgoblin War Mage",
            level: 5,
            organization: "Elite",
            role: "Controller",
            keywords: ["Goblin", "Hobgoblin", "Humanoid", "Infernal"],
            encounterValue: 28,
            size: "1M",
            speed: 5,
            stamina: 120,
            stability: 0,
            freeStrike: 6);
        // Orphan Monster Headers

        var orphanMonsterHeaderElements =
            mainArticle
                .Elements("Story")
                .Where(e => e.Element("Stat_Monster_Name") != null)
                .ToList() ?? [];
        foreach (var headerElement in orphanMonsterHeaderElements)
        {
            XElement? combatStatsElement = null;
            XElement? mainElement = null;

            if (headerElement.NextNode is not XElement nextElement)
            {
                Console.WriteLine($"No next element found for orphan header: {headerElement}");
                continue;
            }

            if (nextElement.Name == "Story" &&
                nextElement.Element("NormalParagraphStyle")?.Element("Table") != null)
            {
                combatStatsElement = nextElement;
            }
            else if (nextElement.Name == "Sect")
            {
                var storyElements = nextElement.Elements("Story").ToList();
                combatStatsElement =
                    storyElements
                        .Where(e => e.Element("NormalParagraphStyle")?.Element("Table") != null)
                        .FirstOrDefault();
                mainElement =
                    storyElements
                        .Where(e => e.Element("Stat_Block_Data")?.Value.Contains("Immunity") == true)
                        .FirstOrDefault();
            }

            if (combatStatsElement == null)
            {
                Console.WriteLine($"No combat stats found for orphan header: {headerElement}");
                continue;
            }

            if (mainElement == null)
            {
                if (nextElement.NextNode is not XElement nextNextElement)
                {
                    Console.WriteLine($"No next next element found for orphan header: {headerElement}");
                    continue;
                }

                if (nextNextElement.Name == "Story" &&
                    nextNextElement.Element("Stat_Block_Data")?.Value.Contains("Immunity") == true)
                {
                    mainElement = nextNextElement;
                }
                else if (
                    nextNextElement.Name == "Sect" &&
                    nextNextElement.Element("Story")?.Element("Stat_Block_Data")?.Value.Contains("Immunity") == true)
                {
                    mainElement = nextNextElement.Element("Story");
                }
            }

            if (mainElement == null)
            {
                Console.WriteLine($"No main stats or powers found for orphan header: {headerElement}");
                continue;
            }

            headerElement.ReplaceWith(
                new XElement(
                    "Sect",
                    new XElement("Story", headerElement.Elements()),
                    new XElement("Story", combatStatsElement.Elements()),
                    new XElement("Story", mainElement.Elements())));

            if (combatStatsElement.Parent?.Name == "Sect")
            {
                try
                {
                    combatStatsElement.Parent.Remove();
                }
                catch { }
            }
            combatStatsElement.Remove();

            if (mainElement.Parent?.Name == "Sect")
            {
                try
                {
                    mainElement.Parent.Remove();
                }
                catch { }
            }
            mainElement.Remove();
        }

        foreach (var story in mainArticle.Elements("Story") ?? [])
        {
            Console.WriteLine($"--------------------------------------");
            Console.WriteLine($"Orphan Story");
            Console.WriteLine($"{story}");
        }

        foreach (var sect in mainArticle.Elements("Sect") ?? [])
        {
            if (sect.Elements().Count() != 3)
            {
                Console.WriteLine($"--------------------------------------");
                Console.WriteLine($"Sect with {sect.Elements().Count()} children");
                Console.WriteLine($"{sect.Elements().FirstOrDefault()?.Value ?? "NA"}");
            }
        }

        xmlDocument.Save(outputFilePath);
    }

    private static void RepairMonsterFromMainElement(XElement monsterSectsRootElement, string mainElementName, string mainElementValuePattern, string name, int level, string organization, string role, List<string> keywords, string size, int speed, int stamina, int stability, int freeStrike, int? encounterValue = null)
    {
        var goblinUnderbossMainElement = FindMonsterMainElement(monsterSectsRootElement, mainElementName, mainElementValuePattern);
        var goblinUnderbossHeaderElement =
            GetMonsterHeaderElement(
                name,
                level,
                organization,
                role,
                keywords,
                encounterValue);
        var goblinUnderbossCombatStatsElement =
            GetMonsterCombatStatsElement(size, speed, stamina, stability, freeStrike);
        goblinUnderbossMainElement?.Parent?.ReplaceWith(
            new XElement(
                "Sect",
                goblinUnderbossHeaderElement,
                goblinUnderbossCombatStatsElement,
                goblinUnderbossMainElement));
    }

    private static XElement GetMonsterHeaderElement(string name, int level, string organization, string role, List<string> keywords, int? encounterValue = null)
    {
        return
            new XElement("Story",
                new XElement("Stat_Monster_Name",
                    name,
                    new XElement("Span", $"Level {level} {organization} {role}")
                ),
                new XElement("Stat_Block_Data",
                    $"{string.Join(", ", keywords)}{(encounterValue is not null ? $" EV {encounterValue}" : string.Empty)}"
                ),
                new XElement("Stat_Block_Arrow_Line")
            );
    }

    private static XElement GetMonsterCombatStatsElement(
        string size, int speed, int stamina, int stability, int freeStrike)
    {
        return
            new XElement("Story",
            new XElement("NormalParagraphStyle",
                new XElement("Table",
                    new XAttribute("bBox", "[1 1 1 1]"),
                    new XAttribute("o", "/Layout"),
                    new XElement("TBody",
                        new XElement("TR",
                            new XElement("TD", new XElement("Big_numbers", size)),
                            new XElement("TD", new XElement("Big_numbers", speed)),
                            new XElement("TD", new XElement("Big_numbers", stamina)),
                            new XElement("TD", new XElement("Big_numbers", stability)),
                            new XElement("TD", new XElement("Big_numbers", freeStrike))
                        )
                    )
                )
            )
        );
    }

    private static XElement? FindMonsterMainElement(XElement monsterSectsRootElement, string mainElementName, string mainElementValuePattern)
    {
        return
            monsterSectsRootElement
                .Elements("Sect")
                .SelectMany(e => e.Elements("Story"))
                .FirstOrDefault(e =>
                    e.Elements(mainElementName).Select(me => me.Value).Any(v => v.Contains(mainElementValuePattern)));
    }
}
