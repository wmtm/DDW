export interface HourlyForecast {
  hoursAhead: number
  temperatureC: number
  weatherCode: number
}

export interface WeatherData {
  temperatureC: number
  windSpeedKmh: number
  windDirectionDeg: number
  precipitationMm: number
  weatherCode: number
  description: string
  forecast: HourlyForecast[]
  sunrise: string
  sunset: string
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

const FORECAST_HOURS_AHEAD = [2, 4]

export async function fetchCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code&hourly=temperature_2m,weather_code&daily=sunrise,sunset&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo request failed: ${res.status}`)
  const data = await res.json()
  const current = data.current
  const hourly = data.hourly
  const daily = data.daily

  const forecast: HourlyForecast[] = []
  if (hourly?.time?.length) {
    const currentTime = new Date(current.time).getTime()
    let nowIndex = 0
    let minDiff = Infinity
    for (let i = 0; i < hourly.time.length; i++) {
      const diff = Math.abs(new Date(hourly.time[i]).getTime() - currentTime)
      if (diff < minDiff) {
        minDiff = diff
        nowIndex = i
      }
    }
    for (const hoursAhead of FORECAST_HOURS_AHEAD) {
      const idx = nowIndex + hoursAhead
      if (idx < hourly.time.length) {
        forecast.push({
          hoursAhead,
          temperatureC: hourly.temperature_2m[idx],
          weatherCode: hourly.weather_code[idx],
        })
      }
    }
  }

  // Open-Meteo returns daily.sunrise/sunset as local wall-clock ISO strings
  // (timezone=auto), so slicing out "HH:MM" avoids any extra TZ conversion.
  const sunrise: string = daily?.sunrise?.[0]?.slice(11, 16) ?? ''
  const sunset: string = daily?.sunset?.[0]?.slice(11, 16) ?? ''

  return {
    temperatureC: current.temperature_2m,
    windSpeedKmh: current.wind_speed_10m,
    windDirectionDeg: current.wind_direction_10m,
    precipitationMm: current.precipitation,
    weatherCode: current.weather_code,
    description: weatherDescriptionFor(current.weather_code),
    forecast,
    sunrise,
    sunset,
  }
}
