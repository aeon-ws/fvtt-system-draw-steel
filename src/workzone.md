Beskrivelse

Der eksisterer i dag en rudimentær integration mellem Workzone-servicen i ccta.dk og arbitrære projektrum i ADP-WS-Prod-subscription'en i Azure.  Integrationen er blot en Workzone klient som er installeret i alle projektrums-VM'er samt en netværksåbning fra det til subscriptionen hørende virtuelle netværk i Azure og til Workzone.

Løsningen er på mange måder uheldig: der er ingen som helst kontrol med hvad der bliver overført fra og til hvilke Workzone-sager, fra og til hvilke projektrum, ud over at man skal have adgang til det involverede projektrum og den anvendte Workzone-sag.

Indeværende opgave handler om at designe og implementere en alternativ løsning som fjerner Workzone klienten fra VM'erne og erstatter den med en konfigurationsstyret mekanisme som på projektrumsniveau giver fuld kontrol over hvilken sag der må overføres til/fra, hvilken retning overførslen går i, samt logger metadata vdr. alle overførsler.

Acceptkriterier

Ved oprettelse af et projektrum er det muligt at angive en Workzone-sag til/fra hvilken filer må overføres,
Det er muligt at angive om overførsler må foregå til eller fra Workzone-sagen eller i begge retninger,
Ændring af hvilken Workzone-sag et projektrum er knyttet til eller hvilke overførselstyper der er tilladt kan kun ændres ved at genkøre projektrumspipelinen mht. det specifikke projektrum,
Der findes i projektrummet i den eksisterende Staging storage account en container dedikeret til Workzone-overførsler,
Hvis overførsler til Workzone-sagen er slået til, vil denne container være overvåget af en egenudviklet service,
Hvis containerens indhold ændrer sig, vil de ændrede filer bliver overført fra containeren til Workzone-sagen,
Hvis overførsler fra Workzone-sagen er slået til, vil vores egenudviklede service periodisk overskrive alle filer i containeren med de aktuelle filer fra Workzone-sagen,
Hvis overførsler i begge retninger er tilladt, vil den nyeste udgave af en given fil overskrive en ældre udgave, lige meget om det er i sagen eller containeren,
Sletning af filer påvirker ikke overførsler, lige meget om det er til eller fra sagen,
Alle overførsler logges i projektrummets log analytics workspace,

Noter

Det skal afklares i hvilken sikkerhedskontekst ovennævnte service skal køre, idet Azure identiteter ikke kan gives adgang til ccta.dk-hostede resurser, herunder Workzone.