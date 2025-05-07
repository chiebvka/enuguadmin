import React from 'react'
import Eventwizard from './components/event-wizard'
import axios from 'axios'

async function fetchEvents() {
  // Use process.env.NEXT_PUBLIC_BASE_URL or fallback to localhost
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  try {
    const res = await axios.get(`${baseUrl}/api/events`, { headers: { 'Cache-Control': 'no-store' } })
    return res.data
  } catch (e) {
    return []
  }
}

export default async function EventsPage() {
  const events = await fetchEvents()
  console.log(`Here are the events: ${events}`)
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Eventwizard initialEvents={events} />
    </div>
  )
}