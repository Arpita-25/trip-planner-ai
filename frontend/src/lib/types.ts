// Hand-written mirrors of the Pydantic models in backend/models/*.py.
// Nothing infers across the Python boundary — change a model, change its interface here.

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export type SlotCategory =
  | "food"
  | "nightlife"
  | "activities"
  | "places"
  | "transport"
  | "stay"
  | "shopping";

export interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  title: string;
  location: string;
  category: SlotCategory;
  notes: string;
  estimated_cost: number;
  duration_minutes: number;
  coordinates: Coordinates | null;
  booking_url: string | null;
  provider: string | null;
  source: "ai" | "user" | "explore";
}

export interface TripDay {
  id: string;
  day_number: number;
  date: string;
  city: string;
  summary: string;
  slots: TimeSlot[];
}

export interface FlightOption {
  id: string;
  airline: string;
  airline_code: string;
  flight_number: string;
  departure_airport: string;
  departure_city: string;
  arrival_airport: string;
  arrival_city: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  stops: number;
  cabin_class: string;
  price: number;
  currency: string;
  baggage: string;
  provider: string;
  provider_mode: "mock" | "real";
  booking_url: string;
}

export interface StayOption {
  id: string;
  name: string;
  city: string;
  location: string;
  property_type: string;
  price_per_night: number;
  total_price: number;
  nights: number;
  currency: string;
  rating: number;
  reviews: number;
  amenities: string[];
  room_type: string;
  images: string[];
  cancellation_policy: string;
  distance_to_beach_km: number;
  distance_to_center_km: number;
  distance_to_nightlife_km: number;
  coordinates: Coordinates | null;
  provider: string;
  provider_mode: "mock" | "real";
  booking_url: string;
  match_score: number;
  match_reasons: string[];
}

export type ExploreCategory = "food" | "nightlife" | "activities" | "places";

export interface ExploreOption {
  id: string;
  name: string;
  category: ExploreCategory;
  type: string;
  description: string;
  city: string;
  location: string;
  coordinates: Coordinates | null;
  rating: number;
  reviews: number;
  estimated_cost: number;
  currency: string;
  duration_minutes: number;
  images: string[];
  tags: string[];
  provider: string;
  provider_mode: "mock" | "real";
  provider_url: string;
  match_score: number;
  match_reasons: string[];
}

export interface CityStay {
  name: string;
  days: number;
}

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  origin: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  budget_amount: number;
  currency: string;
  travelers: number;
  cabin_class: string;
  travel_style: string;
  preferences: Record<string, number>;
  cities: CityStay[];
  itinerary: TripDay[];
  flights: FlightOption[];
  stays: StayOption[];
  explore_items: ExploreOption[];
  raw_prompt: string;
  itinerary_source: "none" | "ai" | "fallback";
  created_at: string;
  updated_at: string;
}

export interface TripSummary {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  budget_amount: number;
  currency: string;
  travelers: number;
  cities: CityStay[];
  itinerary_source: string;
  estimated_cost: number;
  cover_image: string;
  created_at: string;
}

export interface BudgetLine {
  category: string;
  label: string;
  amount: number;
}

export interface BudgetBreakdown {
  currency: string;
  lines: BudgetLine[];
  total: number;
  budget: number;
  remaining: number;
  per_traveler: number;
  over_budget: boolean;
  utilisation_percent: number;
}

export interface TripIntent {
  destination: string;
  origin: string;
  duration_days: number;
  budget_amount: number;
  currency: string;
  travelers: number;
  travel_style: string;
  title: string;
  interests: Record<string, number>;
}

export interface TripPlanResponse {
  trip: Trip;
  message: string;
  source: string;
}

export interface AiMessageResponse {
  reply: string;
  budget: BudgetBreakdown;
}

// ---------------------------------------------------------------- search requests

export interface FlightSearchRequest {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string | null;
  travelers: number;
  cabin_class: "economy" | "premium_economy" | "business" | "first";
  trip_type: "one_way" | "round_trip";
  max_stops?: number | null;
  airlines: string[];
  max_price?: number | null;
  sort_by: "price" | "duration" | "departure" | "stops";
}

export interface StaySearchRequest {
  city: string;
  check_in: string;
  check_out: string;
  guests: number;
  rooms: number;
  nightly_budget?: number | null;
  property_types: string[];
  needs_pool: boolean;
  near_beach: boolean;
  near_center: boolean;
  min_rating: number;
  amenities: string[];
  sort_by: "match" | "price_low" | "price_high" | "rating";
}

export interface ExploreSearchRequest {
  city: string;
  category: "all" | ExploreCategory;
  query: string;
  max_cost?: number | null;
  min_rating: number;
  sort_by: "match" | "rating" | "cost_low" | "cost_high";
}

export interface ItineraryItemCreate {
  day_number: number;
  start_time: string;
  end_time: string;
  title: string;
  location: string;
  category: SlotCategory;
  notes: string;
  estimated_cost: number;
  booking_url?: string | null;
  provider?: string | null;
  source: "ai" | "user" | "explore";
}
