import { getSupabaseConfig, mapCourse, supabase } from "../../lib/payments";
export const dynamic = "force-dynamic";
export async function GET() {
  const config = getSupabaseConfig();
  if (!config) return Response.json({ message: "Courses are temporarily unavailable." }, { status: 503 });
  const response = await supabase(config, "cms_programmes?select=id,slug,title,description,department,duration,delivery_mode,location,image_url,price_cents,registration_fee_cents,available_intake,is_available&is_published=eq.true&order=sort_order.asc");
  if (!response.ok) {
    console.error("[courses] Supabase request failed", { status: response.status });
    return Response.json({ message: "Courses could not be loaded." }, { status: 502 });
  }
  return Response.json({ courses: ((await response.json()) as Record<string, unknown>[]).map(mapCourse) });
}
