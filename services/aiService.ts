import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import { Itinerary, TouristSpot, City, Country, State, CityInfo, Guide, RideRoute } from '../types';
import { fetchImage } from './imageService';
import { getRealTimeAQI } from './weatherService';

// --- Configuration ---
export type AIProvider = 'gemini' | 'openai' | 'grok';

const getGeminiClient = () => {
  const customKey = localStorage.getItem('GEMINI_API_KEY');
  // @ts-ignore
  const envKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : import.meta.env.VITE_GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey: customKey || envKey || '' });
};

const openaiClient = new OpenAI({
  // @ts-ignore
  apiKey: (typeof process !== 'undefined' && process.env) ? process.env.OPENAI_API_KEY : '', 
  dangerouslyAllowBrowser: true 
});

const grokClient = new OpenAI({
  // @ts-ignore
  apiKey: (typeof process !== 'undefined' && process.env) ? process.env.GROK_API_KEY : '',
  baseURL: "https://api.x.ai/v1", 
  dangerouslyAllowBrowser: true
});

// --- Caching ---
const CACHE_PREFIX = 'ai_cache_v2_'; // Changed prefix to invalidate old cache with images
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheItem<T> {
  timestamp: number;
  data: T;
}

function getCacheKey(prompt: string, provider: AIProvider): string {
  let hash = 0;
  const keyString = `${provider}:${prompt}`;
  for (let i = 0; i < keyString.length; i++) {
    const char = keyString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `${CACHE_PREFIX}${hash}`;
}

// --- Core Fetch Function ---
async function fetchJson<T>(prompt: string, schema: any, provider: AIProvider = 'gemini'): Promise<T | null> {
  const cacheKey = getCacheKey(prompt, provider);

  // 1. Try Cache
  try {
    const cachedItem = localStorage.getItem(cacheKey);
    if (cachedItem) {
      const { timestamp, data } = JSON.parse(cachedItem) as CacheItem<T>;
      if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
        console.log(`[AI Service] Serving from cache (${provider}):`, data);
        return data;
      } else {
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (e) {
    console.warn("Cache read failed", e);
  }

  // 2. Fetch from Provider
  try {
    let data: T;

    if (provider === 'gemini') {
      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });
      
      if (!response.text) throw new Error("Empty response from Gemini");
      let jsonText = response.text; // It's a getter
      
      // Sanitization: Remove Markdown code blocks if present (Gemini sometimes adds them despite mimeType)
      if (typeof jsonText === 'string') {
          jsonText = jsonText.replace(/```json\n?|\n?```/g, '').trim();
      }
      
      data = JSON.parse(jsonText) as T;

    } else if (provider === 'openai') {
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini", // Optimized for speed
        messages: [
            { role: "system", content: "You are a helpful travel assistant. You must output valid JSON." },
            { role: "user", content: `${prompt}\n\nOutput strictly in this JSON schema format:\n${JSON.stringify(schema, null, 2)}` }
        ],
        response_format: { type: "json_object" },
      });
      const content = response.choices[0].message.content;
      if (!content) throw new Error("Empty response from OpenAI");
      data = JSON.parse(content) as T;

    } else if (provider === 'grok') {
       const response = await grokClient.chat.completions.create({
        model: "grok-beta", 
        messages: [
            { role: "system", content: "You are a helpful travel assistant. You must output valid JSON." },
            { role: "user", content: `${prompt}\n\nOutput strictly in this JSON schema format:\n${JSON.stringify(schema, null, 2)}` }
        ],
      });
      const content = response.choices[0].message.content;
      if (!content) throw new Error("Empty response from Grok");
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      data = JSON.parse(cleanContent) as T;
    } else {
        throw new Error("Invalid provider");
    }

    // 3. Save to Cache
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (e) {
      console.warn("Cache write failed", e);
    }

    return data;

  } catch (error: any) {
    console.error(`Error fetching from ${provider}:`, error);
    alert(`${provider.toUpperCase()} Error: ${error.message || error}`);
    return null;
  }
}

// --- Schemas (Modified to remove images) ---
const countrySchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        code: { type: Type.STRING, description: "Two-letter ISO 3166-1 alpha-2 code." },
    },
    required: ['name', 'code'],
};
const countriesSchema = { type: Type.ARRAY, items: countrySchema };

const stateSchema = { type: Type.OBJECT, properties: { name: { type: Type.STRING } }, required: ['name'] };
const statesSchema = { type: Type.ARRAY, items: stateSchema };

const cityInfoSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        country: { type: Type.STRING },
        // image removed
    },
    required: ['name', 'country'],
};
const citiesSchema = { type: Type.ARRAY, items: cityInfoSchema };

const touristSpotSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: "A unique, URL-friendly identifier for the spot (e.g., 'hawa-mahal')." },
    name: { type: Type.STRING },
    description: { type: Type.STRING, description: 'A detailed and engaging description of the spot, around 2-3 sentences long.' },
    aqi: { type: Type.STRING, description: 'Current Air Quality Index (e.g., "AQI 45 (Good)"). Estimate based on typical levels.' },
    // image removed
  },
  required: ['id', 'name', 'description', 'aqi'],
};

const detailedCitySchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    country: { type: Type.STRING },
    // image removed
    spots: {
      type: Type.ARRAY,
      description: 'A list of 6 + of the most famous tourist spots in the city.',
      items: touristSpotSchema,
    },
  },
  required: ['name', 'country', 'spots'],
};

const itinerarySchema = {
  type: Type.OBJECT,
  properties: {
    tripTitle: { type: Type.STRING },
    dailyPlans: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER },
          title: { type: Type.STRING },
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                description: { type: Type.STRING },
                location: { type: Type.STRING },
              },
              required: ['time', 'description', 'location'],
            },
          },
          specialEvent: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              location: { type: Type.STRING },
              details: { type: Type.STRING, description: "Details including timing and why it's recommended, relevant to the travel date." },
            },
          },
        },
        required: ['day', 'title', 'activities'],
      },
    },
  },
  required: ['tripTitle', 'dailyPlans'],
};

const guideSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        specialties: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 2-3 short specialties (e.g., 'History', 'Foodie')." },
        bio: { type: Type.STRING, description: "A short, engaging bio for the guide, 2-3 sentences long." },
        // image removed
    },
    required: ['name', 'specialties', 'bio'],
};

const guidesSchema = {
    type: Type.ARRAY,
    items: guideSchema,
};

// --- Exported Service Functions (With Hydration) ---

export const getCountries = (provider: AIProvider = 'gemini') => 
    fetchJson<Country[]>("List all countries in the world with their two-letter ISO 3166-1 alpha-2 code, sorted alphabetically by name.", countriesSchema, provider);

export const getStates = (countryName: string, provider: AIProvider = 'gemini') => 
    fetchJson<State[]>(`List all major states/provinces/regions for ${countryName}, sorted alphabetically.`, statesSchema, provider);

export const getTopCities = async (stateName: string, countryName: string, provider: AIProvider = 'gemini'): Promise<CityInfo[] | null> => {
    const prompt = `
    List the top 10 most popular tourist cities in ${stateName}, ${countryName}.
    For each city, provide its name and country.
  `;
    const cities = await fetchJson<Omit<CityInfo, 'image'>[]>(prompt, citiesSchema, provider);
    
    if (!cities) return null;

    // Hydrate with images
    const hydratedCities = await Promise.all(cities.map(async (city) => ({
        ...city,
        image: await fetchImage(`${city.name}, ${city.country} tourism`)
    })));

    return hydratedCities;
};

export const getCityInfo = async (cityName: string, provider: AIProvider = 'gemini'): Promise<City | null> => {
  const prompt = `
    Generate detailed travel information for "${cityName}".
    Include the city's name, country.
    Also, provide a list of its 6 most famous tourist spots.
    For each spot, include a unique ID, name, estimated AQI (Air Quality Index), and an engaging description.
  `;
  const cityData = await fetchJson<Omit<City, 'image' | 'spots'> & { spots: Omit<TouristSpot, 'image'>[] }>(prompt, detailedCitySchema, provider);

  if (!cityData) return null;

  // Hydrate city image
  const cityImagePromise = fetchImage(`${cityData.name}, ${cityData.country} travel`);

  // Hydrate spots images AND Real-time AQI
  const hydratedSpotsPromise = Promise.all(cityData.spots.map(async (spot) => {
      const [image, realTimeAqi] = await Promise.all([
          fetchImage(`${spot.name} ${cityData.name}`),
          getRealTimeAQI(`${spot.name}, ${cityData.name}, ${cityData.country}`)
      ]);
      return {
          ...spot,
          image,
          aqi: realTimeAqi || spot.aqi // Fallback to AI estimate if real-time fails
      };
  }));

  const [cityImage, hydratedSpots] = await Promise.all([cityImagePromise, hydratedSpotsPromise]);

  return {
      ...cityData,
      image: cityImage,
      spots: hydratedSpots
  };
};

export const generateItinerary = async (
  cityName: string,
  days: number,
  selectedSpots: TouristSpot[],
  startDate: string,
  provider: AIProvider = 'gemini'
): Promise<Itinerary | null> => {
  const spotNames = selectedSpots.map(spot => spot.name).join(', ') || 'popular attractions';

  const prompt = `
    Create a vibrant, culturally-rich ${days}-day itinerary for ${cityName}, starting ${startDate}.
    The user's must-visit spots are: ${spotNames}.
    For each day, create a practical, timed schedule that logically includes the selected spots.
    For each evening, suggest a unique, specific local event relevant to the start date.
    Return a single JSON object.
  `;

  return fetchJson<Itinerary>(prompt, itinerarySchema, provider);
};

export const generateGuides = async (cityName: string, provider: AIProvider = 'gemini'): Promise<Guide[] | null> => {
    const prompt = `
      You are a travel agency manager. Create a list of 3 diverse, fictional tour guides for hire in ${cityName}.
      For each guide, provide:
      1. A realistic name.
      2. 2-3 specialties (e.g., 'Ancient History', 'Street Food Expert').
      3. A short, compelling bio (2-3 sentences).
    `;
    const guides = await fetchJson<Omit<Guide, 'image'>[]>(prompt, guidesSchema, provider);

    if (!guides) return null;

    // Hydrate with generic avatars or try to find "Guide" images (unlikely to work well with wiki)
    // Using a reliable placeholder service for avatars
    const hydratedGuides = guides.map(guide => ({
        ...guide,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(guide.name)}&background=random&size=256`
    }));

    return hydratedGuides;
};

const rideRouteSchema = {
    type: Type.OBJECT,
    properties: {
        origin: { type: Type.STRING },
        destination: { type: Type.STRING },
        distance: { type: Type.STRING },
        duration: { type: Type.STRING },
        roadCondition: { type: Type.STRING, description: "Detailed description of road quality, traffic patterns, and any construction." },
        safetyTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 specific safety tips for this route and vehicle type." },
        stops: {
            type: Type.ARRAY,
            description: "A sequential list of major cities, towns, and pit stops along the route from origin to destination.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['food', 'rest', 'scenic', 'fuel', 'city', 'town'] },
                    description: { type: Type.STRING },
                    location: { type: Type.STRING, description: "Distance from origin (e.g., '45 km')" },
                    distanceFromLast: { type: Type.STRING, description: "Distance from the previous stop (e.g., '30 km')" },
                    weather: { type: Type.STRING, description: "Expected weather condition (e.g., 'Sunny, 28°C')" },
                    aqi: { type: Type.STRING, description: "Air Quality Index (e.g., 'AQI 120 (Unhealthy)')" },
                    highlights: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 key things to see or do here." },
                },
                required: ['name', 'type', 'description', 'location', 'distanceFromLast', 'weather', 'aqi', 'highlights'],
            },
        },
    },
    required: ['origin', 'destination', 'distance', 'duration', 'roadCondition', 'safetyTips', 'stops'],
};

export const getRideRoute = async (origin: string, destination: string, vehicleType: 'bike' | 'car', stopInterval: number, provider: AIProvider = 'gemini'): Promise<RideRoute | null> => {
    const prompt = `
      Plan a detailed road trip from ${origin} to ${destination} by ${vehicleType}.
      Provide a SEQUENTIAL list of stops including major cities, towns, and recommended pit stops.
      CRITICAL: You must try to find a relevant stop approximately every ${stopInterval} km. It doesn't have to be exact, but aim for this frequency to ensure frequent breaks.
      For each stop, provide:
      1. Distance from the previous stop.
      2. Expected weather (assume current season).
      3. Estimated Air Quality Index (AQI).
      4. Key highlights or famous things (e.g., specific food, landmark).
      5. Type of stop (city, town, food, fuel, etc.).
      
      Also provide overall distance, duration, road conditions, and safety tips.
    `;
    const route = await fetchJson<RideRoute>(prompt, rideRouteSchema, provider);

    if (!route) return null;

    // Hydrate stops with real-time AQI
    const hydratedStops = await Promise.all(route.stops.map(async (stop) => {
        // Try precise name, then name + origin region context if possible, but keep it simple
        const realTimeAqi = await getRealTimeAQI(stop.name); 
        return {
            ...stop,
            aqi: realTimeAqi || stop.aqi // Fallback to AI estimate
        };
    }));

    return {
        ...route,
        stops: hydratedStops
    };
};
