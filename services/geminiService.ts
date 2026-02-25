import { GoogleGenAI, Type } from "@google/genai";
import { Itinerary, TouristSpot, City, Country, State, CityInfo, Guide } from '../types';

if (
  !import.meta.env.VITE_GEMINI_API_KEY ||
  import.meta.env.VITE_GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE"
) {
  const userFriendlyMessage =
    "Gemini API key not found. Please open index.html and replace 'YOUR_GEMINI_API_KEY_HERE' with your actual key.";

  // Display the message in a more visible way on the page itself
  const body = document.querySelector("body");
  if (body) {
    const errorDiv = document.createElement("div");
    errorDiv.style.position = "fixed";
    errorDiv.style.top = "10px";
    errorDiv.style.left = "50%";
    errorDiv.style.transform = "translateX(-50%)";
    errorDiv.style.padding = "1rem";
    errorDiv.style.backgroundColor = "#ef4444"; // red-500
    errorDiv.style.color = "white";
    errorDiv.style.borderRadius = "0.5rem";
    errorDiv.style.zIndex = "9999";
    errorDiv.style.fontFamily = "sans-serif";
    errorDiv.innerHTML = `<b>Configuration Error:</b> ${userFriendlyMessage}`;
    body.prepend(errorDiv);
  }

  // Also log to console for developers
  console.error(userFriendlyMessage);

  // Throw an error to stop further execution
  throw new Error("API_KEY is not set.");
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Generic function to handle Gemini API calls with structured JSON output
const CACHE_PREFIX = 'gemini_cache_';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheItem<T> {
  timestamp: number;
  data: T;
}

function getCacheKey(prompt: string): string {
  // Simple hash to keep keys short, or just use a prefix + truncated prompt
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${CACHE_PREFIX}${hash}`;
}

async function fetchJson<T>(prompt: string, schema: object): Promise<T | null> {
  const cacheKey = getCacheKey(prompt);
  
  // Try to get from cache
  try {
    const cachedItem = localStorage.getItem(cacheKey);
    if (cachedItem) {
      const { timestamp, data } = JSON.parse(cachedItem) as CacheItem<T>;
      if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
        console.log(`[Gemini Service] Serving from cache: ${cacheKey}`);
        return data;
      } else {
        console.log(`[Gemini Service] Cache expired for: ${cacheKey}`);
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (e) {
    console.warn("Failed to read from cache", e);
  }

  // Fetch from API with Retry Logic
  let attempts = 0;
  const maxAttempts = 3;
  let delay = 2000;

  while (attempts < maxAttempts) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      // Check if text exists
      if (!response.text) {
         console.error("Gemini API returned empty response:", response);
         throw new Error("Received empty response from AI model.");
      }

      const jsonText = response.text;
      const data = JSON.parse(jsonText) as T;

      // Save to cache
      try {
        const cacheItem: CacheItem<T> = {
          timestamp: Date.now(),
          data,
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      } catch (e) {
        console.warn("Failed to save to cache (likely quota exceeded)", e);
      }

      return data;

    } catch (error: any) {
      console.error(`Attempt ${attempts + 1} failed:`, error);
      
      // Check for 429 or Resource Exhausted
      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('exhausted')) {
        attempts++;
        if (attempts >= maxAttempts) {
           alert(`Gemini API Quota Exceeded. Please try again later.`);
           return null;
        }
        console.log(`[Gemini Service] Quota hit. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      
      // Other errors
      alert(`Gemini API Error: ${error.message || error}`);
      return null;
    }
  }
  return null;
}

// Schemas for dynamic destination fetching
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
        image: { type: Type.STRING, description: "A direct, publicly accessible, high-resolution image URL." },
    },
    required: ['name', 'country', 'image'],
};
const citiesSchema = { type: Type.ARRAY, items: cityInfoSchema };

// Service functions for destination hierarchy
export const getCountries = () => fetchJson<Country[]>("List all countries in the world with their two-letter ISO 3166-1 alpha-2 code, sorted alphabetically by name.", countriesSchema);
export const getStates = (countryName: string) => fetchJson<State[]>(`List all major states/provinces/regions for ${countryName}, sorted alphabetically.`, statesSchema);
export const getTopCities = (stateName: string, countryName: string) => {
    const prompt = `
    List the top 10 most popular tourist cities in ${stateName}, ${countryName}.
    For each city, provide its name, country, and a stunning image URL.
    
    CRITICAL IMAGE REQUIREMENTS:
    - All image URLs MUST be direct links to an image file (e.g., ending in .jpg, .png, .webp).
    - The URLs MUST be publicly accessible and allow hotlinking.
    - Prioritize using reliable sources like Wikimedia Commons, Pexels, or Unsplash.
    - DO NOT provide URLs from stock photo sites with watermarks, pages that require logins, or URLs that lead to a webpage instead of an image file.
  `;
    return fetchJson<CityInfo[]>(prompt, citiesSchema);
};

// Schema and service for fetching detailed city info with spots
const touristSpotSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: "A unique, URL-friendly identifier for the spot (e.g., 'hawa-mahal')." },
    name: { type: Type.STRING },
    description: { type: Type.STRING, description: 'A detailed and engaging description of the spot, around 2-3 sentences long.' },
    image: { type: Type.STRING, description: 'A direct, high-resolution image URL for the spot.' },
  },
  required: ['id', 'name', 'description', 'image'],
};

const detailedCitySchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    country: { type: Type.STRING },
    image: { type: Type.STRING, description: 'A direct, high-resolution image URL representing the city.' },
    spots: {
      type: Type.ARRAY,
      description: 'A list of 6 + of the most famous tourist spots in the city.',
      items: touristSpotSchema,
    },
  },
  required: ['name', 'country', 'image', 'spots'],
};

export const getCityInfo = (cityName: string): Promise<City | null> => {
  const prompt = `
    Generate detailed travel information for "${cityName}".
    You must return a single, valid JSON object that adheres to the provided schema.
    Include the city's name, country, and a stunning, high-resolution image URL representing the city.
    Also, provide a list of its 6 most famous tourist spots.
    For each spot, include a unique ID, name, an engaging description, and an image URL.
    
    CRITICAL IMAGE REQUIREMENTS:
    - All image URLs MUST be direct links to an image file (e.g., ending in .jpg, .png, .webp).
    - The URLs MUST be publicly accessible and allow hotlinking.
    - Prioritize using reliable sources like Wikimedia Commons, Pexels, or Unsplash.
    - DO NOT provide URLs from stock photo sites with watermarks, pages that require logins, or URLs that lead to a webpage instead of an image file.
  `;
  return fetchJson<City>(prompt, detailedCitySchema);
};

// Schema and service for generating the itinerary
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

export const generateItinerary = async (
  cityName: string,
  days: number,
  selectedSpots: TouristSpot[],
  startDate: string
): Promise<Itinerary | null> => {
  const spotNames = selectedSpots.map(spot => spot.name).join(', ') || 'popular attractions';

  const prompt = `
    Create a vibrant, culturally-rich ${days}-day itinerary for ${cityName}, starting ${startDate}.
    The user's must-visit spots are: ${spotNames}.
    For each day, create a practical, timed schedule that logically includes the selected spots.
    For each evening, suggest a unique, specific local event relevant to the start date.
    Return a single JSON object.
  `;

  return fetchJson<Itinerary>(prompt, itinerarySchema);
};

// New Schema and service for generating guides
const guideSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        specialties: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 2-3 short specialties (e.g., 'History', 'Foodie')." },
        bio: { type: Type.STRING, description: "A short, engaging bio for the guide, 2-3 sentences long." },
        image: { type: Type.STRING, description: "A direct, public, hotlink-able URL for a portrait-style photo of a person." },
    },
    required: ['name', 'specialties', 'bio', 'image'],
};

const guidesSchema = {
    type: Type.ARRAY,
    items: guideSchema,
};

export const generateGuides = (cityName: string): Promise<Guide[] | null> => {
    const prompt = `
      You are a travel agency manager. Create a list of 3 diverse, fictional tour guides for hire in ${cityName}.
      For each guide, provide:
      1. A realistic name.
      2. 2-3 specialties (e.g., 'Ancient History', 'Street Food Expert').
      3. A short, compelling bio (2-3 sentences).
      4. An image URL for a realistic, professional-looking portrait photograph of a person.

      CRITICAL IMAGE REQUIREMENTS:
      - The image URL MUST be a direct link to an image file (e.g., .jpg, .png, .webp).
      - The image MUST be a portrait of a person and clearly show their face. DO NOT use objects, animals, or landscapes.
      - It MUST be publicly accessible and allow hotlinking from reliable sources like Pexels or Unsplash.
      - DO NOT provide URLs that lead to a webpage instead of an image file.
    `;
    return fetchJson<Guide[]>(prompt, guidesSchema);
};