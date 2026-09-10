import { useEffect, useState } from 'react'

const MAURITIUS_TIME_ZONE = 'Indian/Mauritius'

export default function DateTimeWidget() {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="datetime-readout">
      <span className="datetime-clock">
        {time.toLocaleTimeString('en-GB', {
          timeZone: MAURITIUS_TIME_ZONE,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>
      <span className="datetime-day">
        {time.toLocaleDateString('en-GB', { timeZone: MAURITIUS_TIME_ZONE, weekday: 'long' })}
      </span>
      <span className="datetime-date">
        {time.toLocaleDateString('en-GB', {
          timeZone: MAURITIUS_TIME_ZONE,
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </span>
    </div>
  )
}
