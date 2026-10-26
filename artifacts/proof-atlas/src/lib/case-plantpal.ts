/**
 * PlantPal case-study data. Provider rows describe what the code at 99071d4
 * requests; resolution is only stated where the repository states it.
 */
export interface ProviderRow {
  signal: string;
  provider: string;
  request: string;
  freshness: string;
  resolution: string;
}

export const providerRows: ProviderRow[] = [
  { signal: "Current weather and 7-day forecast", provider: "Open-Meteo forecast", request: "Temperature, humidity, wind, forecast", freshness: "Cached 24 h in the browser", resolution: "Not stated in the repository" },
  { signal: "Air quality and pollen", provider: "Open-Meteo air quality", request: "US/EU AQI, PM2.5, PM10, ozone, pollen", freshness: "Cached 15 min", resolution: "Not stated in the repository" },
  { signal: "Soil temperature and moisture", provider: "Open-Meteo", request: "0–28 cm soil temperature and moisture", freshness: "Cached 15 min", resolution: "Not stated in the repository" },
  { signal: "Soil properties", provider: "ISRIC SoilGrids v2.0", request: "pH, texture, organic carbon at 0–5 cm (mean)", freshness: "Not separately cached (30-day cache inactive)", resolution: "250 m, per README" },
  { signal: "Elevation", provider: "Open-Elevation", request: "Metres above sea level", freshness: "Not separately cached", resolution: "Not stated in the repository" },
  { signal: "Sun and moon", provider: "Sunrise-Sunset", request: "Sunrise, sunset, day length", freshness: "Cached 24 h", resolution: "Computed for the coordinate" },
  { signal: "Historical climate", provider: "Open-Meteo archive", request: "Two 10-year windows for comparison", freshness: "Fetched with the profile", resolution: "Not stated in the repository" },
  { signal: "Climate projection", provider: "Open-Meteo climate (CMIP6)", request: "One model (CMCC_CM2_SR5), 2041–2060 and 2071–2090", freshness: "Fetched with the profile", resolution: "Not stated in the repository" },
  { signal: "Biodiversity", provider: "GBIF occurrence search", request: "Up to 300 plant records in a ±0.1° box; animal record count", freshness: "Fetched with the profile", resolution: "±0.1° latitude/longitude box" },
  { signal: "Location", provider: "Browser geolocation, ipapi.co, Open-Meteo geocoding", request: "Coordinates from GPS, IP lookup or city search", freshness: "Per session", resolution: "IP lookup is city-level at best" },
];

export const interpretationBoundary = {
  may: [
    "Summarise the combined signals in plain language.",
    "Suggest plants worth considering, given stated preferences.",
    "Point out which signals are missing or stale.",
  ],
  mustNot: [
    "Present a fixed per-plant table as an exact carbon measurement.",
    "Diagnose a plant disease as certain from a photo.",
    "Treat one climate model's projection as a forecast.",
    "Call occurrence records a list of native species.",
    "Guarantee that a plant will thrive.",
  ],
};

export interface SyntheticProfile {
  id: string;
  label: string;
  note: string;
  signals: Array<{ name: string; value: string; band: [number, number]; uncertainty: "low" | "medium" | "high"; why: string }>;
}

/** Clearly synthetic: these locations and values are invented for illustration. */
export const syntheticProfiles: SyntheticProfile[] = [
  {
    id: "humid-coastal",
    label: "Synthetic site A — humid coastal",
    note: "Invented values for a warm, humid coastal plot.",
    signals: [
      { name: "Mean summer temperature", value: "29 °C", band: [27, 31], uncertainty: "low", why: "A long-run seasonal average changes little from year to year." },
      { name: "Air quality (PM2.5)", value: "38 µg/m³", band: [24, 52], uncertainty: "medium", why: "Modelled, gridded and changes hourly." },
      { name: "Soil pH (0–5 cm)", value: "6.4", band: [5.8, 7.0], uncertainty: "medium", why: "250 m prediction; one garden can differ." },
      { name: "Plant occurrence records nearby", value: "212", band: [212, 212], uncertainty: "high", why: "A count of reports, not a census or a native-species list." },
      { name: "2041–2060 warming vs recent", value: "+1.4 °C", band: [0.8, 2.1], uncertainty: "high", why: "One model, one projection; not a forecast." },
    ],
  },
  {
    id: "semi-arid",
    label: "Synthetic site B — semi-arid upland",
    note: "Invented values for a dry, elevated plot.",
    signals: [
      { name: "Mean summer temperature", value: "33 °C", band: [31, 35], uncertainty: "low", why: "A long-run seasonal average changes little from year to year." },
      { name: "Air quality (PM2.5)", value: "19 µg/m³", band: [12, 30], uncertainty: "medium", why: "Modelled, gridded and changes hourly." },
      { name: "Soil pH (0–5 cm)", value: "7.8", band: [7.2, 8.3], uncertainty: "medium", why: "250 m prediction; one garden can differ." },
      { name: "Plant occurrence records nearby", value: "41", band: [41, 41], uncertainty: "high", why: "Sparse reporting is not the same as sparse life." },
      { name: "2041–2060 warming vs recent", value: "+1.9 °C", band: [1.1, 2.7], uncertainty: "high", why: "One model, one projection; not a forecast." },
    ],
  },
  {
    id: "temperate-urban",
    label: "Synthetic site C — temperate city yard",
    note: "Invented values for a shaded urban yard.",
    signals: [
      { name: "Mean summer temperature", value: "22 °C", band: [20, 24], uncertainty: "low", why: "A long-run seasonal average changes little from year to year." },
      { name: "Air quality (PM2.5)", value: "27 µg/m³", band: [15, 41], uncertainty: "medium", why: "Street-level exposure can differ from the grid cell." },
      { name: "Soil pH (0–5 cm)", value: "6.9", band: [6.2, 7.5], uncertainty: "high", why: "Urban soils are often disturbed or imported." },
      { name: "Plant occurrence records nearby", value: "300+", band: [300, 300], uncertainty: "high", why: "The query stops at 300 records; the true count is unknown." },
      { name: "2041–2060 warming vs recent", value: "+1.2 °C", band: [0.6, 1.9], uncertainty: "high", why: "One model, one projection; not a forecast." },
    ],
  },
];
