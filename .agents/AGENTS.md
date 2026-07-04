# Projectinstellingen & Cloud-strategie (Aura Fitness)

Dit document bevat de overeengekomen richtlijnen en plannen voor de doorontwikkeling van Aura Fitness naar een cloud-gebaseerde Android-app voor de Google Play Store.

## 1. Doel & Positionering (Benchmark: Fitbod)
*   **Unique Selling Point**: Aura Fitness onderscheidt zich van Fitbod door het gebruik van generatieve AI (Gemini) om als een echte, interactieve coach dagelijkse biometrische inzichten en gepersonaliseerde cues te schrijven.
*   **Verdienmodel**: Freemium model met abonnementen:
    *   *Gratis*: Toegang tot logboek en offline rule-based workout-generatie.
    *   *Eerste 3 trainingen*: Gratis toegang tot AI Coach-functies (trial).
    *   *Abonnement (Premium)*: €4,99 per maand of €29,99 per jaar voor onbeperkt AI-workouts en dagelijkse coaching-inzichten.

## 2. Cloud Integratie-Roadmap (Voor latere fase)
Zodra we de app live in de cloud gaan zetten, gebruiken we de volgende opzet (allemaal binnen de gratis limieten te starten):
1.  **Hosting (Compute)**: Google Cloud Run of Render.com om de Express server (`server.ts`) veilig te draaien en de Gemini API-sleutel af te schermen.
2.  **Database & Authenticatie**: Firebase of Supabase (Postgres) voor het opslaan van gebruikersprofielen en trainingsgeschiedenis, inclusief Google Sign-In integratie.
3.  **In-App Aankopen**: Integratie van RevenueCat om abonnementen en betalingen via Google Play Billing af te handelen.
4.  **Mobiele Packaging**: Gebruik van Ionic Capacitor om de Vite static output (`dist/`) te verpakken in een native Android-project dat in Android Studio gebouwd kan worden tot een Play Store `.aab` / `.apk` pakket.
5.  **Biometrische Synchronisatie**: Integratie van Google Fit & Apple Health via Capacitor plugins om gewichtsschommelingen en stappen (steps) automatisch te synchroniseren. Dit zorgt ervoor dat de AI-coach en het herstelalgoritme altijd over de meest actuele gegevens beschikken zonder dat de gebruiker deze handmatig hoeft in te voeren.

## 3. Lokalisatie & Internationalisering (Voor latere fase)
Als de app internationaal gaat, passen we de volgende structuur toe:
1.  **Talen (i18n)**:
    - *UI*: Implementatie van `react-i18next` of gelijkaardig voor statische vertalingen (Engels, Duits, Spaans, etc.).
    - *AI Coach*: Gemini is meertalig van nature. We sturen de geselecteerde taal van de gebruiker mee in de API-payload (`userModel.language`) zodat Aura haar antwoorden en oefeningen-cues direct in die taal genereert.
2.  **Eenheden (kg/lbs)**:
    - Toevoegen van een `unit` voorkeur (`metric` of `imperial`) in de Instellingen.
    - De UI rekent gewichten om met `1 kg = 2.20462 lbs` indien ingesteld op imperial.
    - We geven de eenheid door in de backend-prompts zodat Gemini gewichtsschattingen en progressie-adviezen direct in de juiste eenheid (lbs) formuleert.
3.  **Datumformaten**:
    - Alle datums in het Dashboard en Logboek formatteren via JavaScript's native `Intl.DateTimeFormat` API om automatisch aan te sluiten bij de systeemtaal en regio van de telefoon.
