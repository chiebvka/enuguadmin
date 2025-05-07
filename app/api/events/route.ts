// File: app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'



export async function GET() {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })

    //   console.log(data)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data, { status: 200 })
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
