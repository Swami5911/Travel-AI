
const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const AQI_API_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

interface GeoResult {
  results?: {
    latitude: number;
    longitude: number;
    name: string;
    country: string;
  }[];
}

interface AQIResult {
  current?: {
    us_aqi: number;
  };
}

export const getCoordinates = async (query: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const response = await fetch(`${GEOCODING_API_URL}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
    const data: GeoResult = await response.json();
    
    if (data.results && data.results.length > 0) {
      return {
        lat: data.results[0].latitude,
        lng: data.results[0].longitude
      };
    }
    return null;
  } catch (error) {
    console.error(`Error geocoding ${query}:`, error);
    return null;
  }
};

export const getAQI = async (lat: number, lng: number): Promise<number | null> => {
  try {
    const response = await fetch(`${AQI_API_URL}?latitude=${lat}&longitude=${lng}&current=us_aqi`);
    const data: AQIResult = await response.json();
    
    if (data.current && typeof data.current.us_aqi === 'number') {
      return data.current.us_aqi;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching AQI for ${lat},${lng}:`, error);
    return null;
  }
};

export const getRealTimeAQI = async (location: string): Promise<string | undefined> => {
  const coords = await getCoordinates(location);
  if (!coords) return undefined;

  const aqi = await getAQI(coords.lat, coords.lng);
  if (aqi === null) return undefined;

  let status = 'Good';
  if (aqi > 50) status = 'Moderate';
  if (aqi > 100) status = 'Unhealthy for Sensitive Groups';
  if (aqi > 150) status = 'Unhealthy';
  if (aqi > 200) status = 'Very Unhealthy';
  if (aqi > 300) status = 'Hazardous';

  return `AQI ${aqi} (${status})`;
};
