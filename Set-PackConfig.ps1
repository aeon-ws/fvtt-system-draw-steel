fvtt configure set installPath "C:/Program Files/Foundry Virtual Tabletop";
fvtt configure set dataPath "C:\Users\MortenNystrupRasmuss\AppData\Local\FoundryVTT";

fvtt package workon --type System "aeon-draw-steel";
fvtt package pack `
    --compendiumName "enemies" `
    --compendiumType Actor `
    --inputDirectory "c:/_/aeon/draw-steel-foundry/packs/_source/monsters" `
    --recursive `
    --yaml `
    --outputDirectory "c:/_/aeon/draw-steel-foundry/packs/enemies" `
    --verbose;
