
$devFolderPath = "c:/_/aeon/fvtt-system-draw-steel";
$fvttAppPath = "C:/Program Files/Foundry Virtual Tabletop";
$fvttDataPath = "C:/Users/MortenNystrupRasmuss/AppData/Local/FoundryVTT";

fvtt configure set installPath $fvttAppPath;
fvtt configure set dataPath $fvttDataPath;
fvtt package workon --type System "aeon-draw-steel";

fvtt package pack `
    --compendiumName "monsters" `
    --compendiumType Actor `
    --inputDirectory "$devFolderPath/packs/_source/monsters" `
    --recursive `
    --yaml `
    --outputDirectory "$devFolderPath/packs" `
    --verbose;

# fvtt package pack `
#     --compendiumName "monster-abilities" `
#     --compendiumType Actor `
#     --inputDirectory "$devFolderPath/packs/_source/monster-abilities" `
#     --recursive `
#     --yaml `
#     --outputDirectory "$devFolderPath/packs/monster-abilities" `
#     --verbose;
