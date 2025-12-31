export enum Page {
  LOGIN,
  DESTINATION,
  SPOTS,
  PLAN,
  TRACKER,
  BOOK_GUIDE,
  SHARED_PLAN,
  RIDE_BY,
}

export type UserRole = 'visitor' | 'guide' | 'admin';

export interface BaseUser {
  id: string;
  name: string;
  role: UserRole;
  password?: string; // In real app, this should be hashed. Using plain for mock.
}

export interface VisitorUser extends BaseUser {
  role: 'visitor';
  history: Itinerary[];
}

export interface GuideUser extends BaseUser {
  role: 'guide';
  specialties: string[];
  bio: string;
  image: string;
  isAvailable: boolean;
  reviews: Review[];
  rating: number;
}

export interface AdminUser extends BaseUser {
  role: 'admin';
}

export type User = VisitorUser | GuideUser | AdminUser;

export interface Review {
  id: string;
  visitorName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface Country {
  name: string;
  code: string;
}

export interface State {
  name: string;
}

// Represents a city in a list before its full details are fetched
export interface CityInfo {
    name: string;
    country: string;
    image: string;
    description: string;
    aqi?: string; // e.g. "AQI 45 (Good)"
}

// Represents the full city object with tourist spots after fetching details
export interface City extends CityInfo {
  spots: TouristSpot[];
}

export interface TouristSpot {
  id: string;
  name: string;
  description: string;
  image: string;
  aqi?: string; // e.g. "AQI 120 (Unhealthy)"
}

export interface ItineraryActivity {
  time: string;
  description: string;
  location: string;
}

export interface ItinerarySpecialEvent {
  name: string;
  location: string;
  details: string;
}

export interface DailyPlan {
  day: number;
  title: string;
  activities: ItineraryActivity[];
  specialEvent?: ItinerarySpecialEvent;
}

export interface Itinerary {
  tripTitle: string;
  dailyPlans: DailyPlan[];
}

export interface Guide {
  name: string;
  specialties: string[];
  bio: string;
  image: string;
}

export interface RideStop {
  name: string;
  type: 'food' | 'rest' | 'scenic' | 'fuel' | 'city' | 'town';
  description: string;
  location: string; // e.g., "60km from origin"
  distanceFromLast: string; // e.g. "30 km"
  weather: string; // e.g. "Sunny, 25°C"
  aqi?: string; // e.g., "AQI 50"
  highlights: string[]; // e.g. ["Famous Samosa", "Old Fort"]
  coordinates?: { lat: number; lng: number }; // Optional for future map integration
}

export interface RideRoute {
  origin: string;
  destination: string;
  distance: string;
  duration: string;
  roadCondition: string; // e.g., "Mostly highway, some construction near Jaipur"
  safetyTips: string[];
  stops: RideStop[];
}