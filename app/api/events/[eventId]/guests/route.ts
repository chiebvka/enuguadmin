
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  req: NextRequest, 
  context: any
) {
  const { params } = context;
  const { eventId } = params;
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!eventId) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
  }

  try {
    const { data: guests, error } = await supabase
      .from('event_guest')
      .select('name, email')
      .eq('event_id', eventId)
      .order('name', { ascending: true }); // Optional: order by name

    if (error) {
      console.error('Error fetching event guests:', error.message);
      return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(guests || [], { status: 200 });
  } catch (e: any) {
    console.error('Catch block error fetching event guests:', e.message);
    return NextResponse.json({ error: e.message || 'Failed to fetch event guests' }, { status: 500 });
  }
} 