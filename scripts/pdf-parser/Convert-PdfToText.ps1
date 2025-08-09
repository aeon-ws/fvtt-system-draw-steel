
magick -density 300 "c:\_\aeon\fvtt-system-draw-steel\Draw Steel - Delian Tomb - Monsters - 2025-04.pdf" -quality 100 "c:\_\aeon\fvtt-system-draw-steel\pdf\output-%03d.pdf"
magick -density 300 "c:\_\aeon\fvtt-system-draw-steel\Draw_Steel_Monsters_v1.pdf" -quality 100 "c:\_\aeon\fvtt-system-draw-steel\pdf\monsters-v1-rasterized.pdf"
magick -density 300 "c:\_\aeon\fvtt-system-draw-steel\pdf\x\output-*.pdf" -quality 100 "c:\_\aeon\fvtt-system-draw-steel\pdf\_delian-tomb-rasterized-1-5.pdf"

python "C:\_\aeon\fvtt-system-draw-steel\scripts\pdf-parser\RasterPdfToText.py"

$xml = Get-Content "C:\_\aeon\fvtt-system-draw-steel\accessible-formatted-8.xml";

[regex]::Replace($xml, '(?s)<Sect>[^<>]*<Sect>[^<>]*<Story>[^<>]*<Monster_Role>[^<>]*Malice<Span>[^<>]*Malice Features</Span>[^<>]*</Monster_Role>[^<>]*</Story>[^<>]*</Sect>[^<>]*<Story>.*?</Story>[^<>]*</Sect>', '') |
    Out-File "C:\_\aeon\fvtt-system-draw-steel\accessible-9.xml" -Encoding utf8

    <Sect>
      <Sect>
        <Story>
          <Stat_Monster_Name> Goblin Malice<Span>  Malice Features</Span></Stat_Monster_Name>
        </Story>
      </Sect>
      <Story>
        <Feature_Intro_Text> At the start of any goblin’s turn, you can spend Malice to activate one of the following features.</Feature_Intro_Text>
        <Stat_Block_Arrow_Line></Stat_Block_Arrow_Line>
        <Stat_Block_Ability_Header> t Goblin Mode  3 Malice</Stat_Block_Ability_Header>
        <Ability_Body> Each goblin in the encounter gains a +2 bonus to speed until the end of the round.</Ability_Body>
        <Stat_Block_Arrow_Line></Stat_Block_Arrow_Line>
        <Stat_Block_Ability_Header> b Tiny Stabs  5 Malice</Stat_Block_Ability_Header>
        <Ability_Body> Each enemy in the encounter takes 1 damage for each goblin adjacent to them.</Ability_Body>
        <Stat_Block_Arrow_Line></Stat_Block_Arrow_Line>
        <Stat_Block_Ability_Header> p Swamp Stink   7 Malice</Stat_Block_Ability_Header>
        <Ability_Body> The encounter map is covered in a green mist that lasts until the end of the round, and which can’t be dispersed by wind. All areas of the map are difficult terrain for non-goblins, and each <Span></Span> non-goblin on the map makes a Might test.</Ability_Body>
        <Abiilty_Power_Roll>
          <Span> 1</Span>  5 poison damage; the creature is weakened until the mist disappears.</Abiilty_Power_Roll>
        <Abiilty_Power_Roll>
          <Span> 2</Span>  The creature is weakened until the mist disappears.</Abiilty_Power_Roll>
        <Abiilty_Power_Roll>
          <Span> 3</Span>  No effect.</Abiilty_Power_Roll>
      </Story>
    </Sect>