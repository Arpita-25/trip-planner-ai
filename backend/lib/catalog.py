"""Destination catalogue backing the mock providers and the deterministic fallback planner.

This is development data for the labelled mock providers — it is never presented as
live provider availability. Real adapters plug in alongside it (see providers/base.py).
"""

from typing import TypedDict


class CityData(TypedDict):
    country: str
    airport: str
    lat: float
    lng: float
    image: str
    blurb: str
    food: list[str]
    nightlife: list[str]
    activities: list[str]
    places: list[str]
    stays: list[str]


IMG_BEACH = "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwxfHx0aGFpbGFuZCUyMGJlYWNoJTIwdHJvcGljYWx8ZW58MHx8fHwxNzg2MTIyMjQ4fDA&ixlib=rb-4.1.0&q=85"
IMG_AERIAL = "https://images.unsplash.com/photo-1534008897995-27a23e859048?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwyfHx0aGFpbGFuZCUyMGJlYWNoJTIwdHJvcGljYWx8ZW58MHx8fHwxNzg2MTIyMjQ4fDA&ixlib=rb-4.1.0&q=85"
IMG_VILLA = "https://images.unsplash.com/photo-1615722440048-da4ccf6de048?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjByZXNvcnQlMjBwb29sJTIwdmlsbGF8ZW58MHx8fHwxNzkwODgwNjk3fDA&ixlib=rb-4.1.0&q=85"
IMG_RESORT = "https://images.unsplash.com/photo-1582498674105-ad104fcc5784?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHw0fHxsdXh1cnklMjByZXNvcnQlMjBwb29sJTIwdmlsbGF8ZW58MHx8fHwxNzkwODgwNjk3fDA&ixlib=rb-4.1.0&q=85"
IMG_NIGHT = "https://images.unsplash.com/photo-1694501898583-7caca30dde01?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2ODh8MHwxfHNlYXJjaHw0fHxiYW5na29rJTIwc3RyZWV0JTIwZm9vZCUyMG5pZ2h0JTIwbWFya2V0fGVufDB8fHx8MTc5MDg4MDY5N3ww&ixlib=rb-4.1.0&q=85"
IMG_MARKET = "https://images.unsplash.com/photo-1628324716243-0c9c29971a58?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2ODh8MHwxfHNlYXJjaHwyfHxiYW5na29rJTIwc3RyZWV0JTIwZm9vZCUyMG5pZ2h0JTIwbWFya2V0fGVufDB8fHx8MTc5MDg4MDY5N3ww&ixlib=rb-4.1.0&q=85"

CATEGORY_IMAGE = {
    "food": IMG_MARKET,
    "nightlife": IMG_NIGHT,
    "activities": IMG_AERIAL,
    "places": IMG_BEACH,
}

STAY_IMAGES = [IMG_VILLA, IMG_RESORT, IMG_BEACH, IMG_AERIAL]

CITIES: dict[str, CityData] = {
    "Phuket": {
        "country": "Thailand", "airport": "HKT", "lat": 7.8804, "lng": 98.3923,
        "image": IMG_BEACH,
        "blurb": "Andaman beaches, longtail boat islands and a loud, late Patong strip.",
        "food": ["Kan Eang@Pier Seafood", "Raya House Thai Kitchen", "Malee's Seafood Grill", "Suay Restaurant", "Chalong Night Food Lane"],
        "nightlife": ["Bangla Road Bar Crawl", "Illuzion Beach Club", "Catch Beach Club Bang Tao", "Kata Rooftop Sunset Bar", "Phuket Walking Street Night Market"],
        "activities": ["Phi Phi Island Speedboat Day", "Coral Island Snorkelling", "Big Buddha Viewpoint Ride", "Kata Beach Surf Lesson", "Sea Kayaking at Phang Nga"],
        "places": ["Patong Beach", "Kata Noi Beach", "Freedom Beach", "Promthep Cape Viewpoint", "Old Phuket Town"],
        "stays": ["Andaman Pool Villas", "Patong Shore Resort", "Kata Cliff Retreat", "Bang Tao Beachfront Suites", "Phuket Sunset Hostel", "Surin Palms Apartment"],
    },
    "Krabi": {
        "country": "Thailand", "airport": "KBV", "lat": 8.0863, "lng": 98.9063,
        "image": IMG_AERIAL,
        "blurb": "Limestone cliffs, island hopping from Ao Nang and quiet barefoot evenings.",
        "food": ["Krua Thara Seafood", "Ao Nang Boat Noodle House", "Railay Beach Grill", "Carnivore Steak Krabi", "Krabi Town Walking Food Street"],
        "nightlife": ["Ao Nang Center Point Bars", "Last Fisherman Beach Bar", "Railay Fire Show Bar", "Krabi Reggae Night", "Ao Nang Night Market"],
        "activities": ["4 Islands Longtail Tour", "Hong Island Hopping", "Railay Rock Climbing", "Emerald Pool & Hot Springs", "Sunset Kayak Ao Thalane"],
        "places": ["Railay Beach", "Ao Nang Beach", "Tup Island Sandbar", "Tiger Cave Temple Viewpoint", "Phra Nang Cave Beach"],
        "stays": ["Railay Cliff Resort", "Ao Nang Garden Pool Hotel", "Krabi Lagoon Villas", "Tubkaak Beach House", "Ao Nang Backpackers", "Krabi Riverside Apartment"],
    },
    "Bangkok": {
        "country": "Thailand", "airport": "BKK", "lat": 13.7563, "lng": 100.5018,
        "image": IMG_NIGHT,
        "blurb": "Street food lanes, rooftop bars and shopping that runs until midnight.",
        "food": ["Jay Fai Street Kitchen", "Thipsamai Pad Thai", "Chinatown Yaowarat Food Walk", "Err Urban Rustic Thai", "Sukhumvit Soi 38 Night Eats"],
        "nightlife": ["Sky Bar Lebua Rooftop", "Khao San Road Crawl", "Thonglor Cocktail Circuit", "Route 66 RCA Club", "Asiatique Riverside Night Market"],
        "activities": ["Chao Phraya Longtail Canal Tour", "Thai Cooking Class", "Bangkok Street Food Tuk-Tuk Tour", "Muay Thai Night at Rajadamnern", "Day Trip to Ayutthaya"],
        "places": ["Chatuchak Weekend Market", "Wat Arun Riverside", "Lumphini Park", "Siam Shopping District", "Talad Rot Fai Train Market"],
        "stays": ["Riverside Grand Bangkok", "Sukhumvit Sky Pool Hotel", "Silom Boutique Stay", "Thonglor Loft Apartment", "Khao San Social Hostel", "Asok Business Suites"],
    },
    "Bali": {
        "country": "Indonesia", "airport": "DPS", "lat": -8.4095, "lng": 115.1889,
        "image": IMG_VILLA,
        "blurb": "Surf beaches, rice terraces, beach clubs and villa living.",
        "food": ["Warung Babi Guling Ubud", "Seminyak Seafood Shack", "La Baracca Canggu", "Jimbaran Bay Grill", "Ubud Organic Market Cafe"],
        "nightlife": ["Potato Head Beach Club", "La Favela Seminyak", "Canggu Sunset Bars", "Single Fin Uluwatu", "Kuta Night Strip"],
        "activities": ["Nusa Penida Island Trip", "Uluwatu Surf Lesson", "Mount Batur Sunrise Trek", "Tegalalang Rice Terrace Cycle", "Ubud Waterfall Circuit"],
        "places": ["Seminyak Beach", "Uluwatu Cliff Temple", "Tanah Lot", "Campuhan Ridge Walk", "Kuta Beach"],
        "stays": ["Seminyak Pool Villas", "Canggu Surf Lodge", "Ubud Jungle Resort", "Uluwatu Cliff Suites", "Kuta Beach Hostel", "Sanur Garden Apartment"],
    },
    "Tokyo": {
        "country": "Japan", "airport": "HND", "lat": 35.6762, "lng": 139.6503,
        "image": IMG_NIGHT,
        "blurb": "Dense neighbourhoods, obsessive food culture and neon-lit nights.",
        "food": ["Tsukiji Outer Market Breakfast", "Shinjuku Omoide Yokocho", "Ichiran Ramen Shibuya", "Sushi Counter Ginza", "Harajuku Street Snacks"],
        "nightlife": ["Golden Gai Bar Hopping", "Shibuya Sky Night View", "Roppongi Club Night", "Izakaya Crawl Nakameguro", "Akihabara Arcade Night"],
        "activities": ["TeamLab Digital Art", "Mount Fuji Day Trip", "Sumo Practice Visit", "Tokyo Food Walking Tour", "Go-Kart Street Drive"],
        "places": ["Shibuya Crossing", "Senso-ji Asakusa", "Shinjuku Gyoen", "Ueno Park", "Ginza Shopping Mile"],
        "stays": ["Shinjuku Sky Hotel", "Shibuya Design Rooms", "Asakusa Ryokan Stay", "Ginza Business Suites", "Tokyo Pod Hostel", "Nakameguro Apartment"],
    },
    "Kyoto": {
        "country": "Japan", "airport": "ITM", "lat": 35.0116, "lng": 135.7681,
        "image": IMG_AERIAL,
        "blurb": "Temple lanes, tea houses and quiet riverside dinners.",
        "food": ["Nishiki Market Food Walk", "Pontocho Kaiseki Dinner", "Gion Matcha Tea House", "Kyoto Ramen Alley", "Arashiyama Tofu Lunch"],
        "nightlife": ["Pontocho Alley Bars", "Kiyamachi Night Stroll", "Kyoto Craft Beer Room", "Gion Evening Walk", "Sake Tasting Fushimi"],
        "activities": ["Arashiyama Bamboo Cycle", "Fushimi Inari Hike", "Kimono Walking Experience", "Tea Ceremony Class", "Nara Day Trip"],
        "places": ["Kiyomizu-dera", "Philosopher's Path", "Gion District", "Kinkaku-ji", "Nishiki Market"],
        "stays": ["Gion Machiya Townhouse", "Kyoto Station Hotel", "Arashiyama Riverside Inn", "Kawaramachi Boutique", "Kyoto Guest Hostel", "Higashiyama Apartment"],
    },
    "Goa": {
        "country": "India", "airport": "GOI", "lat": 15.2993, "lng": 74.1240,
        "image": IMG_BEACH,
        "blurb": "Shacks, scooters, sunsets and a nightlife belt in the north.",
        "food": ["Gunpowder Assagao", "Martin's Corner Seafood", "Baga Beach Shack Grill", "Anjuna Cafe Breakfast", "Panjim Fish Thali"],
        "nightlife": ["Tito's Lane Baga", "Curlies Anjuna", "Hilltop Vagator Sundown", "Thalassa Sunset Party", "Saturday Night Market Arpora"],
        "activities": ["Dudhsagar Falls Trip", "Grande Island Snorkelling", "Spice Plantation Tour", "Mandovi Sunset Cruise", "Scooter Beach Hop"],
        "places": ["Palolem Beach", "Anjuna Beach", "Chapora Fort Viewpoint", "Fontainhas Latin Quarter", "Arambol Beach"],
        "stays": ["Anjuna Pool Villas", "Baga Beach Resort", "Palolem Beach Huts", "Panjim Heritage Rooms", "Vagator Surf Hostel", "Assagao Garden Villa"],
    },
    "Dubai": {
        "country": "UAE", "airport": "DXB", "lat": 25.2048, "lng": 55.2708,
        "image": IMG_RESORT,
        "blurb": "Desert excursions, beach clubs and relentless shopping.",
        "food": ["Al Ustad Special Kebab", "Pierchic Seafood", "Ravi Restaurant Satwa", "Deira Spice Souk Eats", "Jumeirah Brunch Table"],
        "nightlife": ["Marina Rooftop Lounge", "Zero Gravity Beach Club", "Downtown Sky Bar", "Dhow Cruise Night", "Global Village Night Walk"],
        "activities": ["Desert Dune Safari", "Burj Khalifa Observation", "Dubai Marina Yacht Hour", "Jet Ski Jumeirah", "Old Dubai Abra Tour"],
        "places": ["JBR Beach", "Dubai Mall", "Palm Jumeirah Boardwalk", "Dubai Creek", "Kite Beach"],
        "stays": ["Marina Pool Tower", "JBR Beach Resort", "Downtown Business Suites", "Palm Luxury Villas", "Deira Budget Rooms", "Jumeirah Apartment"],
    },
    "Singapore": {
        "country": "Singapore", "airport": "SIN", "lat": 1.3521, "lng": 103.8198,
        "image": IMG_NIGHT,
        "blurb": "Hawker centres, gardens and a tidy, walkable night scene.",
        "food": ["Maxwell Hawker Centre", "Newton Food Centre", "Katong Laksa", "Chinatown Complex Food", "Clarke Quay Chilli Crab"],
        "nightlife": ["Clarke Quay Riverside", "Marina Bay Rooftop", "Haji Lane Bars", "Sentosa Beach Club", "Night Safari"],
        "activities": ["Gardens by the Bay", "Sentosa Island Day", "Singapore River Cruise", "Hawker Food Tour", "Universal Studios"],
        "places": ["Marina Bay Sands Waterfront", "Orchard Road", "Little India", "Kampong Glam", "East Coast Park"],
        "stays": ["Marina View Hotel", "Chinatown Boutique", "Orchard Road Suites", "Sentosa Beach Resort", "Bugis Capsule Hostel", "River Valley Apartment"],
    },
    "Hanoi": {
        "country": "Vietnam", "airport": "HAN", "lat": 21.0278, "lng": 105.8342,
        "image": IMG_MARKET,
        "blurb": "Old Quarter food lanes, lakes and cheap, excellent coffee.",
        "food": ["Bun Cha Huong Lien", "Pho Thin", "Old Quarter Egg Coffee", "Banh Mi 25", "Dong Xuan Market Eats"],
        "nightlife": ["Beer Street Ta Hien", "Hanoi Rooftop Bars", "Old Quarter Night Market", "Jazz Club Hanoi", "Weekend Walking Street"],
        "activities": ["Ha Long Bay Day Cruise", "Hanoi Street Food Tour", "Ninh Binh Boat Trip", "Motorbike City Tour", "Water Puppet Show"],
        "places": ["Hoan Kiem Lake", "Train Street", "Temple of Literature", "West Lake", "Long Bien Bridge"],
        "stays": ["Old Quarter Boutique", "Hanoi Lake View Hotel", "West Lake Pool Hotel", "Hanoi Backpackers", "Ba Dinh Serviced Apartment", "Hoan Kiem Heritage Rooms"],
    },
}

DESTINATIONS: dict[str, list[str]] = {
    "thailand": ["Phuket", "Krabi", "Bangkok"],
    "bali": ["Bali"],
    "indonesia": ["Bali"],
    "japan": ["Tokyo", "Kyoto"],
    "tokyo": ["Tokyo"],
    "kyoto": ["Kyoto"],
    "goa": ["Goa"],
    "dubai": ["Dubai"],
    "uae": ["Dubai"],
    "singapore": ["Singapore"],
    "vietnam": ["Hanoi"],
    "phuket": ["Phuket"],
    "krabi": ["Krabi"],
    "bangkok": ["Bangkok"],
}

ORIGIN_AIRPORTS: dict[str, str] = {
    "bangalore": "BLR", "bengaluru": "BLR", "mumbai": "BOM", "delhi": "DEL",
    "new delhi": "DEL", "hyderabad": "HYD", "chennai": "MAA", "kolkata": "CCU",
    "pune": "PNQ", "ahmedabad": "AMD", "kochi": "COK", "goa": "GOI",
    "london": "LHR", "dubai": "DXB", "singapore": "SIN", "new york": "JFK",
}


def cities_for_destination(destination: str) -> list[str]:
    """Resolve a free-text destination to catalogued cities, else a single generic city."""
    key = destination.strip().lower()
    if key in DESTINATIONS:
        return DESTINATIONS[key]
    for name, cities in DESTINATIONS.items():
        if name in key or key in name:
            return cities
    for city in CITIES:
        if city.lower() in key:
            return [city]
    return [destination.strip().title() or "Your Destination"]


def city_data(city: str) -> CityData:
    """Catalogued city, or a generic deterministic profile for anything unknown."""
    if city in CITIES:
        return CITIES[city]
    for name, data in CITIES.items():
        if name.lower() == city.strip().lower():
            return data
    return {
        "country": "", "airport": (city[:3] or "XXX").upper(), "lat": 0.0, "lng": 0.0,
        "image": IMG_BEACH,
        "blurb": f"Highlights, food and evenings around {city}.",
        "food": [f"{city} Local Food Market", f"{city} Seafood Grill", f"{city} Street Food Lane",
                 f"{city} Rooftop Restaurant", f"{city} Heritage Cafe"],
        "nightlife": [f"{city} Night Market", f"{city} Rooftop Bar", f"{city} Live Music Lounge",
                      f"{city} Riverside Bars", f"{city} Late Night Strip"],
        "activities": [f"{city} City Walking Tour", f"{city} Day Excursion", f"{city} Cooking Class",
                       f"{city} Sunset Cruise", f"{city} Adventure Park"],
        "places": [f"{city} Old Town", f"{city} Main Beach", f"{city} Viewpoint",
                   f"{city} Central Park", f"{city} Shopping District"],
        "stays": [f"{city} Grand Hotel", f"{city} Pool Resort", f"{city} Boutique Stay",
                  f"{city} Budget Rooms", f"{city} Traveller Hostel", f"{city} Serviced Apartment"],
    }


def airport_for(place: str) -> str:
    key = place.strip().lower()
    if key in ORIGIN_AIRPORTS:
        return ORIGIN_AIRPORTS[key]
    for name, code in ORIGIN_AIRPORTS.items():
        if name in key:
            return code
    data = city_data(place)
    return data["airport"]
