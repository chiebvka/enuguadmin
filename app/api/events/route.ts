// File: app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'



export async function GET() {
    const supabase = await createClient()
  
    const { data, error } = await supabase
      .from('events')
      .select('id, name, event_date, start_time, end_time, venue, summary, status') // only fetch needed fields
      .order('event_date', { ascending: false })
  
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  
    return NextResponse.json(data, { status: 200 })
  }

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const body = await req.json()
  
    const {
      name,
      event_date,
      start_time,
      end_time,
      venue,
      summary,
      content,
      profile_id,
      status = 'pending', // Default to 'pending' if not provided
    } = body
  
    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          name,
          event_date,
          start_time,
          end_time,
          venue,
          summary,
          content,
          profile_id,
          status, // included here
        },
      ])
      .select()
  
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Failed to create event' }, { status: 400 })
    }
  
    return NextResponse.json(data[0], { status: 201 })
  }

  export async function PUT(req: NextRequest) {
    const supabase = await createClient()
    const body = await req.json()
    const { id, status = 'pending', ...updates } = body
  
    if (!id) {
      return NextResponse.json({ error: 'Missing event ID' }, { status: 400 })
    }
  
    const { data, error } = await supabase
      .from('events')
      .update({ ...updates, status }) // ensure status is included
      .eq('id', id)
      .select()
  
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Update failed or event not found' }, { status: 404 })
    }
  
    return NextResponse.json(data[0])
  }

export async function DELETE(req: NextRequest) {
    const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Missing event ID' }, { status: 400 })

  const { error } = await supabase.from('events').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
