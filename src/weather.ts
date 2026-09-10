export interface WeatherData {
  temperatureC: number
  windSpeedKmh: number
  windDirectionDeg: number
  precipitationMm: number
  weatherCode: number
  description: string
}

const WEATHER_CODE_DESCRIPTIONS: Record<number, string> = {
  0: 'Ciel dégagé',
  1: 'Généralement dégagé',
  2: 'Partiellement nuageux',
  3: 'Couvert',
  45: 'Brouillard',
  48: 'Brouillard givrant',
  51: 'Bruine légère',
  53: 'Bruine modérée',
  55: 'Bruine dense',
  61: 'Pluie légère',
  63: 'Pluie modérée',
  65: 'Pluie forte',
  71: 'Neige légère',
  73: 'Neige modérée',
  75: 'Neige forte',
  80: 'Averses légères',
  81: 'Averses modérées',
  82: 'Averses violentes',
  95: 'Orage',
  96: 'Orage avec grêle légère',
  99: 'Orage avec forte grêle',
}

export function weatherDescriptionFor(code: number): string {
  return WEATHER_CODE_DESCRIPTIONS[code] ?? 'Conditions inconnues'
}

export async function fetchCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo request failed: ${res.status}`)
  const data = await res.json()
  const current = data.current

  return {
    temperatureC: current.temperature_2m,
    windSpeedKmh: current.wind_speed_10m,
    windDirectionDeg: current.wind_direction_10m,
    precipitationMm: current.precipitation,
    weatherCode: current.weather_code,
    description: weatherDescriptionFor(current.weather_code),
  }
}
