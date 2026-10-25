/**
 * Open-Meteo Weather & Geocoding Service
 * Provides real-time weather context for agricultural reporting without requiring an API key.
 */

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Searches for location coordinates given a query string.
 * @param {string} locationQuery - City or area name (e.g. "Salinas", "Nairobi")
 * @returns {Promise<{ latitude: number, longitude: number, displayName: string }>}
 */
export async function geocodeLocation(locationQuery) {
  if (!locationQuery || !locationQuery.trim()) {
    throw new Error('Location query is empty');
  }

  const url = `${GEOCODING_BASE_URL}?name=${encodeURIComponent(locationQuery.trim())}&count=1&language=en&format=json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Geocoding failed with status ${response.status}`);
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`No location found for "${locationQuery}"`);
  }

  const first = data.results[0];
  const nameParts = [first.name, first.admin1, first.country].filter(Boolean);
  const displayName = nameParts.join(', ');

  return {
    latitude: first.latitude,
    longitude: first.longitude,
    displayName,
  };
}

/**
 * Fetches current weather metrics for given latitude and longitude.
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{ temperature: number, humidity: number, precipitation: number, windSpeed: number, time: string, units: object }>}
 */
export async function fetchCurrentWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
  });

  const url = `${FORECAST_BASE_URL}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather fetch failed with status ${response.status}`);
  }

  const data = await response.json();

  if (!data.current) {
    throw new Error('Invalid current weather response from Open-Meteo');
  }

  const current = data.current;
  const units = data.current_units || {};

  return {
    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    precipitation: current.precipitation,
    windSpeed: current.wind_speed_10m,
    time: current.time,
    units: {
      temperature: units.temperature_2m || '°C',
      humidity: units.relative_humidity_2m || '%',
      precipitation: units.precipitation || 'mm',
      windSpeed: units.wind_speed_10m || 'km/h',
    },
  };
}

/**
 * Combined helper to fetch weather by location name string.
 * @param {string} locationQuery
 * @returns {Promise<{ locationName: string, latitude: number, longitude: number, weather: object }>}
 */
export async function getWeatherByLocation(locationQuery) {
  if (!locationQuery || !locationQuery.trim()) {
    return {
      status: 'unavailable',
      reason: 'No location specified',
      data: null,
    };
  }

  try {
    const geo = await geocodeLocation(locationQuery);
    const weatherMetrics = await fetchCurrentWeather(geo.latitude, geo.longitude);

    return {
      status: 'success',
      data: {
        locationName: geo.displayName,
        latitude: geo.latitude,
        longitude: geo.longitude,
        temperature: weatherMetrics.temperature,
        humidity: weatherMetrics.humidity,
        precipitation: weatherMetrics.precipitation,
        windSpeed: weatherMetrics.windSpeed,
        units: weatherMetrics.units,
        fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    };
  } catch (err) {
    console.warn('Weather service notice:', err.message);
    return {
      status: 'error',
      reason: err.message || 'Unable to retrieve weather data',
      data: null,
    };
  }
}
