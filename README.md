A modern, responsive weather application built with React, TypeScript, and Tailwind CSS. The app provides real-time weather data, supports location search, and remembers user preferences for a smooth user experience.

Live Demo:
https://weather-dashboard1-sigma.vercel.app/

Features:
- Automatic location detection using browser geolocation
- Manual search by city name or US ZIP code
- Current weather conditions (temperature, description)
- Additional metrics: feels like, humidity, wind, sunrise, sunset
- 7-day forecast
- Clickable days to view hourly forecast
- Favorites system with persistent storage
- LocalStorage caching for faster reloads
- Dynamic UI based on weather conditions
- Responsive design for mobile and desktop

Tech Stack:
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Open-Meteo API
- Open-Meteo Geocoding API
- Zippopotam API

Installation:
1. Clone the repository:
   git clone https://github.com/poornachandra1704/weather-dashboard

2. Navigate to the project:
   cd weather-dashboard

3. Install dependencies:
   npm install

4. Run the development server:
   npm run dev

5. Open in browser:
   http://localhost:3000

How It Works:
- On initial load, the app attempts to fetch the user's location using the Geolocation API.
- If permission is denied, the user can search manually.
- Weather data is fetched from Open-Meteo using latitude and longitude.
- Search uses Open-Meteo Geocoding and Zippopotam APIs.
- The selected location is saved in localStorage for persistence.
- Favorites are stored locally and can be quickly accessed.

Local Storage Keys:
- weather_location: stores last selected location
- favorites: stores saved favorite locations

Notes:
- No API key required (uses free public APIs)
- Handles loading, error, and empty states
- Includes keyboard navigation for search

Future Improvements:
- Unit preference persistence (C/F)
- Improved accessibility support
- Weather radar integration
- PWA/offline support

Author:
poorna chandra
poornachandra1704@gmail.com

