"use client"

import { useEffect, useState, useRef } from "react"
import {
  Star,
  X,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type Weather = {
  temp: number
  description: string
  code: number
  feelsLike: number
  humidity: number
  wind: number
  sunrise: string
  sunset: string
  hourly: { time: string; temp: number }[]
  daily: { max: number; min: number; hourly: { time: string; temp: number }[] }[]
}

type Suggestion = {
  name: string
  admin1?: string
  country?: string
  latitude: number
  longitude: number
}

export default function Home() {
  const [data, setData] = useState<Weather | null>(null)
  const [location, setLocation] = useState("")
  const [search, setSearch] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [unit, setUnit] = useState<"C" | "F">("F")
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [selectedDay, setSelectedDay] = useState(0)
  const [searchLoading, setSearchLoading] = useState(false)

  const debounceRef = useRef<any>(null)

  const convert = (t: number) =>
    unit === "F" ? Math.round((t * 9) / 5 + 32) : Math.round(t)

  const WeatherIcon = ({ code }: { code: number }) => {
    if (code === 0) return <Sun size={64} className="animate-pulse" />
    if (code < 3) return <Cloud size={64} />
    if (code >= 95) return <CloudLightning size={64} />
    if (code >= 61) return <CloudRain size={64} />
    return <Cloud size={64} />
  }

  const getBg = () => {
    if (!data) return "from-blue-600 via-indigo-700 to-black"
    if (data.code === 0) return "from-yellow-300 via-orange-400 to-pink-500"
    if (data.code < 3) return "from-gray-400 via-gray-600 to-gray-900"
    if (data.code >= 61) return "from-blue-700 via-indigo-900 to-black"
    if (data.code >= 95) return "from-purple-900 via-black to-black"
    return "from-blue-600 via-indigo-700 to-black"
  }

  const fetchWeather = async (lat: number, lon: number, cityName?: string) => {
    try {
      setIsTransitioning(true)
      setLoading(true)
      setError("")

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,apparent_temperature,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`
      )

      const json = await res.json()
      const code = json.current_weather.weathercode

      const map: Record<number, string> = {
        0: "Sunny",
        1: "Mostly Sunny",
        2: "Partly Cloudy",
        3: "Cloudy",
        61: "Rain",
        80: "Showers",
        95: "Storm"
      }

      const nowIndexRaw = json.hourly.time.findIndex((t: string) =>
        new Date(t) > new Date()
      )
      const nowIndex = nowIndexRaw === -1 ? 0 : nowIndexRaw

      // Build 7 days of hourly (24 each)
      const daily = json.daily.temperature_2m_max.map(
        (max: number, i: number) => {
          const start = i * 24
          const hourlySlice = json.hourly.time
            .slice(start, start + 24)
            .map((t: string, idx: number) => ({
              time: new Date(t).toLocaleTimeString([], {
                hour: "numeric",
                hour12: true
              }),
              temp: json.hourly.temperature_2m[start + idx]
            }))

          return {
            max,
            min: json.daily.temperature_2m_min[i],
            hourly: hourlySlice
          }
        }
      )

      setData({
        temp: json.current_weather.temperature,
        description: map[code] || "Clear",
        code,
        feelsLike: json.hourly.apparent_temperature[nowIndex],
        humidity: json.hourly.relative_humidity_2m[nowIndex],
        wind: json.current_weather.windspeed,
        sunrise: json.daily.sunrise[0],
        sunset: json.daily.sunset[0],
        hourly: daily[0].hourly,
        daily
      })

      setSelectedDay(0)
      setLocation(cityName || "Your Location")
      setSuggestions([])
      setSearch("")

      localStorage.setItem(
        "weather_location",
        JSON.stringify({ lat, lon, city: cityName })
      )

      setTimeout(() => setIsTransitioning(false), 300)
    } catch {
      setError("Failed to load weather")
    } finally {
      setLoading(false)
    }
  }

  const handleDayClick = (index: number) => {
    if (!data) return
    setSelectedDay(index)
    setIsTransitioning(true)

    setTimeout(() => {
      setData((prev) =>
        prev
          ? {
              ...prev,
              hourly: prev.daily[index].hourly
            }
          : prev
      )
      setIsTransitioning(false)
    }, 200)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setSelectedIndex(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.length < 2) {
      setSuggestions([])
      return
    }

    setSearchLoading(true)

    debounceRef.current = setTimeout(async () => {
      try {
        if (/^\d{5}$/.test(value)) {
          const zipRes = await fetch(`https://api.zippopotam.us/us/${value}`)
          if (zipRes.ok) {
            const zipData = await zipRes.json()
            setSuggestions([
              {
                name: zipData.places[0]["place name"],
                admin1: zipData.places[0]["state"],
                country: "US",
                latitude: parseFloat(zipData.places[0]["latitude"]),
                longitude: parseFloat(zipData.places[0]["longitude"])
              }
            ])
            setSearchLoading(false)
            return
          }
        }

        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${value}&count=6`
        )
        const json = await res.json()
        setSuggestions(json.results || [])
      } catch {
        setSuggestions([])
      } finally {
        setSearchLoading(false)
      }
    }, 400)
  }

  const handleKeyDown = (e: any) => {
    if (!suggestions.length) return

    if (e.key === "ArrowDown") {
      setSelectedIndex((prev) => (prev + 1) % suggestions.length)
    }

    if (e.key === "ArrowUp") {
      setSelectedIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1
      )
    }

    if (e.key === "Enter") {
      const s = suggestions[selectedIndex] || suggestions[0]
      if (s)
        fetchWeather(s.latitude, s.longitude, `${s.name}, ${s.admin1 || ""}`)
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("weather_location")
    const fav = localStorage.getItem("favorites")

    if (fav) setFavorites(JSON.parse(fav))

    if (saved) {
      const parsed = JSON.parse(saved)
      fetchWeather(parsed.lat, parsed.lon, parsed.city)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => {
        setError("Location denied. Please search manually.")
        setLoading(false)
      }
    )
  }, [])

  const addFavorite = () => {
    if (!location) return
    const saved = JSON.parse(localStorage.getItem("weather_location") || "{}")

    if (!favorites.some((f) => f.name === location)) {
      const updated = [
        ...favorites,
        { name: location, lat: saved.lat, lon: saved.lon }
      ]
      setFavorites(updated)
      localStorage.setItem("favorites", JSON.stringify(updated))
    }
  }

  const removeFavorite = (name: string) => {
    const updated = favorites.filter((f) => f.name !== name)
    setFavorites(updated)
    localStorage.setItem("favorites", JSON.stringify(updated))
  }

  return (
    <main className={`min-h-screen bg-gradient-to-b ${getBg()} text-white flex`}>

      {/* SIDEBAR */}
      <div className="hidden md:flex flex-col w-64 bg-black/30 backdrop-blur-xl p-4 space-y-4 border-r border-white/10">
        <h2 className="text-lg font-semibold">Favorites</h2>

        {favorites.map((f, i) => (
          <motion.div key={i} className="flex justify-between items-center bg-white/10 px-3 py-2 rounded-xl">
            <span onClick={() => fetchWeather(f.lat, f.lon, f.name)} className="cursor-pointer">
              {f.name}
            </span>
            <X size={14} onClick={() => removeFavorite(f.name)} className="cursor-pointer" />
          </motion.div>
        ))}
      </div>

      {/* MAIN */}
      <div className="flex-1 flex justify-center px-4 py-6">
        <div className="w-full max-w-md space-y-6">

          {/* SEARCH */}
          <div className="relative">
            <input
              className="w-full p-4 rounded-full bg-white/20"
              placeholder="Search city or ZIP..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            {searchLoading && <div className="text-xs mt-2 opacity-60">Searching...</div>}

            {suggestions.length > 0 && (
              <div className="absolute w-full mt-2 bg-black/40 rounded-xl overflow-hidden">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() =>
                      fetchWeather(
                        s.latitude,
                        s.longitude,
                        `${s.name}, ${s.admin1 || ""}`
                      )
                    }
                    className="p-3 cursor-pointer hover:bg-white/20"
                  >
                    {s.name}, {s.admin1}, {s.country}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HEADER */}
          <div className="text-center space-y-2">
            <p>{location}</p>

            {data && (
              <>
                <WeatherIcon code={data.code} />
                <h1 className="text-7xl">{convert(data.temp)}°</h1>
                <p>{data.description}</p>
              </>
            )}
          </div>

          {/* METRICS */}
          {data && (
            <div className="grid grid-cols-2 gap-4 bg-white/10 p-4 rounded-2xl">
              <div>Feels Like {convert(data.feelsLike)}°</div>
              <div>Humidity {data.humidity}%</div>
              <div>Wind {data.wind} km/h</div>
              <div>Sunrise {new Date(data.sunrise).toLocaleTimeString()}</div>
              <div>Sunset {new Date(data.sunset).toLocaleTimeString()}</div>
            </div>
          )}

          {/* HOURLY */}
          {data && (
            <div className="flex gap-4 overflow-x-auto">
              {data.hourly.map((h, i) => (
                <motion.div key={i} className="bg-white/10 p-3 rounded-xl min-w-[70px] text-center">
                  <p>{h.time}</p>
                  <p>{convert(h.temp)}°</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* DAILY */}
          {data && (
            <div className="bg-white/10 p-4 rounded-2xl space-y-2">
              {data.daily.slice(0, 7).map((d, i) => {
                const date = new Date()
                date.setDate(date.getDate() + i)

                return (
                  <div
                    key={i}
                    onClick={() => handleDayClick(i)}
                    className={`flex justify-between cursor-pointer ${
                      i === selectedDay ? "opacity-100 font-semibold" : "opacity-70"
                    }`}
                  >
                    <span>
                      {i === 0
                        ? "Today"
                        : i === 1
                        ? "Tomorrow"
                        : date.toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric"
                          })}
                    </span>
                    <span>
                      {convert(d.max)}° / {convert(d.min)}°
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex justify-center gap-3">
            <button onClick={() => setUnit(unit === "C" ? "F" : "C")} className="bg-white/20 px-4 py-2 rounded-full">
              °{unit}
            </button>
            <button onClick={addFavorite} className="bg-white/20 px-4 py-2 rounded-full">
              <Star size={16} />
            </button>
          </div>

        </div>
      </div>
    </main>
  )
}