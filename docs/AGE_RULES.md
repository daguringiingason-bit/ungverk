# Aldursreglur í ungVERK

Grunnur: **Reglugerð nr. 426/1999 um vinnu barna og unglinga** (síðast breytt með 454/2016),
https://island.is/reglugerdir/nr/0426-1999

Þetta skjal lýsir hvernig ungVERK útfærir reglugerðina. Það er **ekki lögfræðiálit**. Atriði
merkt *túlkun* og spurningarnar neðst þarf að staðfesta (t.d. við Vinnueftirlitið eða lögfræðing)
fyrir opnun.

Allar tölur hér eru **gögn í gagnagrunninum** (`job_categories`, `platform_settings`). Það má
breyta þeim án kóðabreytinga. Gagnagrunnurinn (`worker_can_take_job()`) ræður alltaf, ekki appið.

## Tveir aldurshópar

| Hópur í ungVERK | Reglugerð | Hvað má |
| --- | --- | --- |
| 13–15 ára („barn“) | 1. gr.: undir 15 ára **eða í skyldunámi**; 25. gr. | Aðeins léttari störf (viðauki 4) |
| 16–17 ára („unglingur“) | 1. gr.: 15–18 og ekki í skyldunámi | Víðtækari störf, en bönn viðauka 1A, 2 og 3 gilda áfram |

Flest 15 ára ungmenni eru enn í grunnskóla og teljast því „börn“. Þess vegna er 15 ára
flokkað með börnum (`child_max_age = 15`).

## Flokkar

Viðskiptavinur getur alltaf beðið um **eldri** verkamann en flokkurinn leyfir, aldrei yngri.

| Flokkur | Lágm. aldur | Grunnur | Staða |
| --- | --- | --- | --- |
| Garðvinna (rakstur, illgresi, plöntun, vökvun) | 13 | Viðauki 4, liðir 2 og 5 | Skráð |
| Dýr (hundaganga, fóðrun, pössun) | 13 | Viðauki 4, liður 1. Ekki hættuleg dýr (viðauki 3, liður 3) | Skráð |
| Létt þrif | 13 | Viðauki 4, liðir 6 og 10. Engin hættuleg efni (viðauki 2) | Skráð |
| Sendiferðir | 13 | Viðauki 4, liður 13. Hámark 8 kg | Skráð |
| Létt burðarverk | 13 | Viðauki 4, liður 9 og almenn skilyrði (8–10 kg) | Skráð |
| Bílaþvottur í höndunum | 13 | Ekki nefndur sérstaklega; túlkaður sem létt hreingerning. Háþrýstidæla bönnuð (viðauki 1A) | *Túlkun* |
| Garðsláttur með sláttuvél | 16 | Sláttuvélar bannaðar yngri en 18 (viðauki 1A), en garðsláttuvél leyfð 16+ (viðauki 1B, liður 3) | Skráð |
| Snjómokstur með skóflu | 16 | Ekki á lista viðauka 4. Snjóblásari alltaf bannaður yngri en 18 (viðauki 1A) | *Túlkun* |
| Annað | 16 + yfirferð | Teymið metur hvert verkefni | *Túlkun* |

Aldrei í boði fyrir neinn yngri en 18: snjóblásarar, sláttuorf, keðjusagir, háþrýstidælur yfir
70 bör, hættuleg efni og byrðar yfir 12 kg.

## Vinnutími (á hvert verkefni)

| | 13–15 ára | 16–17 ára | Grunnur |
| --- | --- | --- | --- |
| Fyrst | kl. 06:00 | kl. 06:00 | 19. og 30. gr. |
| Í síðasta lagi búið | kl. 20:00 | kl. 22:00 | 30. gr. / 19. gr. |
| Hámarkslengd á skólatíma | 2 klst. | 8 klst. | 27. gr. / 16. gr. |
| Hámarkslengd utan skólatíma | 7 klst. | 8 klst. | 27. gr. / 16. gr. |

Hvort skólatími sé í gangi er stilling (`school_term_active`) sem teymið breytir á vorin og
haustin. Aldur er reiknaður á þeim degi sem verkið er unnið.

Ef viðskiptavinur velur t.d. kl. 19:30 eða 3 klst. á skólatíma, sjá 13–15 ára ekki verkefnið.
Appið sýnir viðskiptavini hverjir geta tekið það áður en hann póstar.

## Staðfesting viðskiptavinar

Við hvert verkefni staðfestir viðskiptavinur að verkið krefjist ekki véla, hættulegra efna
eða byrða yfir 8 kg, og að fullorðinn verði til taks (sbr. 6. gr. um eftirlit 18 ára eða eldri).
Tími staðfestingar er vistaður (`safety_confirmed_at`).

## Opnar spurningar fyrir opnun

1. **Hver er „atvinnurekandi“?** Reglugerðin leggur skyldur á atvinnurekanda: áhættumat
   (5. gr.), leiðsögn og eftirlit (6. gr.) og upplýsingar til foreldra (6. og 26. gr.). Er það
   viðskiptavinurinn, ungVERK eða hvorugt?
2. **Undanþága 2. gr.** Tilfallandi heimilisaðstoð á einkaheimili atvinnurekanda getur fallið
   utan reglugerðarinnar. ungVERK fylgir reglunum samt sem öryggisviðmiði, en þetta skiptir máli
   fyrir ábyrgð.
3. **Skyldunám.** Sumir 16 ára eru enn í 10. bekk fram á vor og teljast þá „börn“. Á að spyrja
   hvort grunnskóla sé lokið, frekar en að nota aldur einan?
4. **Uppsafnaður vinnutími.** Reglurnar gilda á dag og viku, samanlagt hjá öllum
   atvinnurekendum (17. gr.). Í dag er aðeins hvert verkefni athugað. Á að takmarka fjölda
   verkefna á dag?
5. **Túlkanirnar** (bílaþvottur 13+, snjómokstur 16+): staðfesta eða breyta.
6. **Upplýsingar til forráðamanna** (6. gr.): hvernig og hvenær.
