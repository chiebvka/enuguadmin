// File: app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'



export async function GET() {
    const supabase = await createClient()
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })

    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 })
    }

    if (!events) {
        return NextResponse.json([], { status: 200 }); // Return empty array if no events
    }

    // For each event, fetch and aggregate participant data
    const eventsWithParticipants = await Promise.all(
      events.map(async (event) => {
        const { data: participantsData, error: participantsError } = await supabase
          .from('event_participant')
          .select('adult, kids, males, females, people')
          .eq('event_id', event.id);

        if (participantsError) {
          console.error(`Failed to fetch participants for event ${event.id}:`, participantsError.message);
          // Return event data without participant counts or with a specific error indicator
          return { ...event, participantCounts: null };
        }

        const participantCounts = {
          totalAttendees: participantsData.reduce((sum, p) => sum + (p.people || 0), 0),
          totalAdults: participantsData.reduce((sum, p) => sum + (p.adult || 0), 0),
          totalKids: participantsData.reduce((sum, p) => sum + (p.kids || 0), 0),
          totalMales: participantsData.reduce((sum, p) => sum + (p.males || 0), 0),
          totalFemales: participantsData.reduce((sum, p) => sum + (p.females || 0), 0),
        };
        return { ...event, participantCounts };
      })
    );

    // Log the data that will be sent to the client
    console.log('API /api/events GET response data:', JSON.stringify(eventsWithParticipants, null, 2));

    return NextResponse.json(eventsWithParticipants, { status: 200 })
}

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      const body = await req.json();
      const {
        name, event_date, start_time, end_time, venue, summary, content, type
      } = body;

      const today = new Date();
      const eventDate = new Date(event_date);
      const status = eventDate < today ? 'past' : 'upcoming';

      const profile_id = user.id;

      const { data, error } = await supabase
        .from('events')
        .insert([{ name, event_date, start_time, end_time, venue, summary, content, profile_id, status, type }])
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Failed to create event');
      return NextResponse.json(data[0], { status: 201 })
    } catch (error: any) {
      console.error("POST /api/events error:", error);
      return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const supabase = await createClient()
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      const body = await req.json();
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });

      // Debug log
      console.log("PUT /api/events: id", id, "updates", updates);

      const today = new Date();
      const eventDate = new Date(updates.event_date);
      const status = eventDate < today ? 'past' : 'upcoming';

      const { data, error } = await supabase
        .from('events')
        .update({ ...updates, status })
        .eq('id', id)
        .select();

      // Debug log
      console.log("PUT /api/events: update result", data, error);

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Update failed or event not found');
      return NextResponse.json(data[0]);
    } catch (error: any) {
      console.error("PUT /api/events error:", error);
      return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const supabase = await createClient()
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      const { searchParams } = new URL(req.url)
      const id = searchParams.get('id')
      if (!id) return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });

      // Remove ownership check here

      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error;
      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("DELETE /api/events error:", error);
      return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// export async function PUT(req: NextRequest) {
//     const supabase = await createClient()
//     try {
//       const { data: { user }, error: authError } = await supabase.auth.getUser();
//       if (authError || !user) {
//         return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//       }

//       const body = await req.json();
//       const { id, ...updates } = body;
//       if (!id) return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });

//       // Fetch the event to check ownership
//       const { data: eventData, error: fetchError } = await supabase
//         .from('events')
//         .select()
//         .eq('id', id)
//         .single();

//       if (fetchError || !eventData) {
//         return NextResponse.json({ error: 'Event not found' }, { status: 404 });
//       }
//       if (eventData.profile_id !== user.id) {
//         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
//       }

//       const today = new Date();
//       const eventDate = new Date(updates.event_date);
//       const status = eventDate < today ? 'past' : 'upcoming';

//       const { data, error } = await supabase
//         .from('events')
//         .update({ ...updates, status })
//         .eq('id', id)
//         .select();

//       if (error) throw error;
//       if (!data || data.length === 0) throw new Error('Update failed or event not found');
//       return NextResponse.json(data[0]);
//     } catch (error: any) {
//       console.error("PUT /api/events error:", error);
//       return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
//     }
// }

// export async function DELETE(req: NextRequest) {
//     const supabase = await createClient()
//     try {
//       const { data: { user }, error: authError } = await supabase.auth.getUser();
//       if (authError || !user) {
//         return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//       }

//       const { searchParams } = new URL(req.url)
//       const id = searchParams.get('id')
//       if (!id) return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });

//       // Fetch the event to check ownership
//       const { data: eventData, error: fetchError } = await supabase
//         .from('events')
//         .select('profile_id')
//         .eq('id', id)
//         .single();

//       if (fetchError || !eventData) {
//         return NextResponse.json({ error: 'Event not found' }, { status: 404 });
//       }
//       if (eventData.profile_id !== user.id) {
//         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
//       }

//       const { error } = await supabase.from('events').delete().eq('id', id)
//       if (error) throw error;
//       return NextResponse.json({ success: true });
//     } catch (error: any) {
//       console.error("DELETE /api/events error:", error);
//       return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
//     }
// }
