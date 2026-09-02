# Profilly — 3DX Profile Editor

Baut 3DXChat-Profiltexte aus Bausteinen zusammen, statt Unity-Tags von Hand zu tippen.
Live-Vorschau im nachgebauten Profilfenster, automatische Ausrichtung, Zeichenzähler.

**Live:** https://sophey.vodka/profile-editor/
**Schwester-Tool:** [Gifty](https://sophey.vodka/gift-generator/) — der Geschenk-Generator

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | die komplette App — eine Datei, kein Build, keine externen Abhängigkeiten |
| `check-layouts.mjs` | prüft alle Vorlagen gegen Zeichenlimit und Zeilenbreite |
| `docs/` | Design-Dokument mit allen gemessenen 3dx-Werten |
| `backups/` | Zwischenstände |

## Deployen

```
node deploy.mjs "was sich geändert hat"
```

Prüft die Vorlagen, pusht, stößt den Webhook an und wartet, bis die neue Datei
wirklich ausgeliefert wird. Es meldet Erfolg erst, wenn sie oben ist.

**Dieses Repo muss öffentlich bleiben.** Der Server klont es ohne Zugangsdaten;
steht es auf privat, meldet der Webhook brav `deploy started` und tut nichts.

## Vorlagen prüfen

```
node check-layouts.mjs
```

Rechnet jede Vorlage durch und meldet, wenn eine über 1000 Zeichen kommt oder eine
Zeile breiter als 444 px wird. **Nach jeder Änderung an den Vorlagen laufen lassen** —
im Mockup sind mehrfach unbemerkt kaputte Vorlagen entstanden.

## Wie 3dx Profiltext rendert

Alles in-game gemessen, nicht geschätzt:

- Textfeld **480 px** breit, Schrift **Arial**, Basisgröße 14 px
- Glyphenbreiten werden auf **ganze Pixel gerundet** (`round`, nicht abschneiden).
  Beweis: `|` + 40 Leerzeichen + `|` in den Größen 11/12/13/14/16/18/20 ergibt
  3/3/4/4/4/5/6 px — exakt `round(0,278 × Größe)`
- **Leerzeichen bleiben erhalten**, auch führende. Deshalb sind Spalten, Einrückung
  und Rahmen möglich — bei Geschenktexten strippt 3dx sie und zentriert selbst
- Es wird **nicht** automatisch zentriert; „mittig" entsteht durch Leerzeichen
- Zu lange Zeilen brechen an **Wortgrenzen** um und zerlegen das Layout.
  Deshalb: nur bis **444 px** auffüllen, ab **464 px** warnen
- Limit **1000 Zeichen** inklusive aller Tags. Darüber schneidet 3dx ab und
  die rohen Tags werden sichtbar

## Zeichen sparen

1. **Größe außen, Farben innen:** `<size=12><color=#a>zeile1\nzeile2</color><color=#b>zeile3</color></size>`
2. **Kein `<color>`-Tag**, wo die Standardfarbe reicht — spart je Stelle ~24 Zeichen
3. **Leerzeichen am Zeilenende** weglassen, die sind unsichtbar
4. **Ganze Zeilen entfernen** statt Text kürzen — bei zentrierten Zeilen macht
   kürzerer Text die Zeile *teurer*, weil mehr Einrückung nötig wird
