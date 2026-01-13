RENDER_MODE: STRICT
INTERPRETATION: FORBIDDEN
UNITS: mm
ORIGIN: top-left corner of page

DOCUMENT {
  PAGE {
    size: A4;
    orientation: portrait;
    margins: { top:20; bottom:20; left:20; right:20; }
  }
  DEFAULT_FONT { family: Arial; size: 9pt; color: black; }
}

--------------------------------------------------
HEADER BLOCK
--------------------------------------------------
TEXT { id:h1; content:"Raport z kontroli"; x:105; y:15; align:center; font_size:14pt; bold:true; }

TEXT { id:h2a; content:"J-IO 06"; x:20; y:30; }
TEXT { id:h2b; content:"F-NP 016"; x:20; y:36; }
TEXT { id:h2c; content:"z06.01"; x:20; y:42; }

--------------------------------------------------
TOP INFORMATION BLOCK
--------------------------------------------------
TEXT { content:"WZORCA DO ZATWIERDZENIA"; x:105; y:50; align:center; bold:true; }

TEXT { content:"Rap. Nr"; x:20; y:60; }
RECT { x:40; y:58; width:30; height:8; border:0.5pt; }
TEXT { content:"1"; x:45; y:60; }

TEXT { content:"Data"; x:90; y:60; }
RECT { x:110; y:58; width:30; height:8; border:0.5pt; }
TEXT { content:"2023-12-04"; x:112; y:60; }

TEXT { content:"Strona"; x:150; y:60; }
RECT { x:165; y:58; width:15; height:8; border:0.5pt; }
TEXT { content:"1"; x:170; y:60; }

--------------------------------------------------
OPIS WZORCA
--------------------------------------------------
TEXT { content:"Opis wzorca"; x:20; y:75; bold:true; }

CHECKBOX { x:20; y:82; label:"Nowa część"; }
CHECKBOX { x:60; y:82; label:"Część zmodyfikowana"; }
CHECKBOX { x:115; y:82; label:"Nowy dostawca"; }

TEXT { content:"Nr rys."; x:20; y:92; }
RECT { x:35; y:90; width:40; height:8; border:0.5pt; }

TEXT { content:"Nazwa części"; x:80; y:92; }
RECT { x:105; y:90; width:85; height:8; border:0.5pt; }

TEXT { content:"Dostawca"; x:20; y:104; }
RECT { x:40; y:102; width:150; height:8; border:0.5pt; }

TEXT { content:"Data kontroli u dostawcy"; x:20; y:116; }
LINE { x1:75; y1:120; x2:190; y2:120; style:dotted; }

TEXT { content:"Data kontroli w CBM Polska"; x:20; y:128; }
LINE { x1:85; y1:132; x2:190; y2:132; style:dotted; }

--------------------------------------------------
MAIN CONTROL TABLE
--------------------------------------------------
TABLE {
  x:20; y:140; width:170;
  columns: [
    { label:"Lp"; width:10; },
    { label:"Charakterystyka"; width:80; },
    { label:"Wynik dostawcy"; width:40; },
    { label:"Wynik KJ CBM Polska"; width:40; }
  ];
  rows:18;
  row_height:7;
  border:0.5pt;
}

--------------------------------------------------
STATEMENT
--------------------------------------------------
TEXT {
  content:"Gwarantujemy że wyniki zapisane poniżej są prawdziwe i nasz wzorzec został wykonany zgodnie z wymaganiami KJ CBM Polska";
  x:20; y:275; width:170;
}

--------------------------------------------------
DECISION STAMP
--------------------------------------------------
RECT { id:stamp; x:20; y:285; width:170; height:55; border:1pt; }

TEXT { content:"DECYZJE"; x:105; y:290; align:center; bold:true; }

TEXT { content:"WYM."; x:25; y:300; }
TEXT { content:"WZROK."; x:50; y:300; }
TEXT { content:"MAT."; x:80; y:300; }
TEXT { content:"OBRÓB."; x:110; y:300; }

TEXT { content:"TAK"; x:25; y:310; }
TEXT { content:"NIE"; x:50; y:310; }
TEXT { content:"WARUNKOWO"; x:80; y:310; }

TEXT { content:"UWAGA:    Obciążenie                     Godziny"; x:25; y:320; }

TEXT { content:"Wymiary"; x:25; y:330; }
TEXT { content:"Materiał"; x:25; y:338; }
TEXT { content:"Malowanie"; x:25; y:346; }
TEXT { content:"Plastiki"; x:25; y:354; }
TEXT { content:"Razem"; x:25; y:362; }

--------------------------------------------------
TOOLS DECLARATION
--------------------------------------------------
TEXT { content:"Wzorzec został wykonany na:"; x:20; y:350; }

TEXT { content:"TAK"; x:20; y:360; }
TEXT { content:"przyrządach do produkcji seryjnej"; x:35; y:360; }
TEXT { content:"NIE"; x:20; y:368; }

--------------------------------------------------
SIGNATURES
--------------------------------------------------
TEXT { content:"Lab. Metrologiczne"; x:20; y:385; }
LINE { x1:20; y1:392; x2:80; y2:392; style:dotted; }

TEXT { content:"Lab. An. Mater."; x:100; y:385; }
LINE { x1:100; y1:392; x2:160; y2:392; style:dotted; }

--------------------------------------------------
END OF SPECIFICATION
--------------------------------------------------
