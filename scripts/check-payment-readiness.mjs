const requiredEnvironment = ["SUPABASE_URL", "PAYSTACK_SECRET_KEY", "NEXT_PUBLIC_SITE_URL"];
for (const file of [".env.local", ".env"]) { try { process.loadEnvFile(file); } catch {} }
const supabaseKeys = [...new Set([
  process.env.SUPABASE_SECRET_KEY,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
].map((key) => key?.trim()).filter(Boolean))];
const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);
if (!supabaseKeys.length) missingEnvironment.push("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY");
console.log("Makabongwe payment readiness");
console.log(`Missing environment variables: ${missingEnvironment.length ? missingEnvironment.join(", ") : "none"}`);
if (!process.env.SUPABASE_URL || !supabaseKeys.length) {
  console.error("Course readiness unavailable until Supabase server variables are configured.");
  process.exitCode = 1;
} else {
  const url = `${process.env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/cms_programmes?select=id,title,slug,price_cents,registration_fee_cents,is_available,is_published,department,duration,delivery_mode,location,image_url,available_intake&order=sort_order.asc`;
  let response;
  for (const key of supabaseKeys) {
    response = await fetch(url, { headers: { apikey: key, authorization: `Bearer ${key}` } });
    if (response.status !== 401) break;
  }
  if (!response.ok) { console.error(`Course readiness query failed with HTTP ${response.status}.`); process.exitCode = 1; }
  else {
    const courses = await response.json();
    const groups = { ready: [], unavailable: [], zeroPrice: [] };
    for (const course of courses) {
      const total = course.price_cents + course.registration_fee_cents;
      const missing = [
        total <= 0 && "payment amount", (!course.department?.trim()) && "department",
        (!course.duration?.trim() || course.duration === "To be confirmed") && "duration",
        (!course.delivery_mode?.trim()) && "delivery mode", (!course.location?.trim() || course.location === "To be confirmed") && "location",
        (!course.image_url?.trim()) && "image", (!course.available_intake?.trim()) && "intake",
      ].filter(Boolean);
      const row = `${course.id} | ${course.title} | ${new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(total / 100)} | missing: ${missing.length ? missing.join(", ") : "none"}`;
      if (course.is_published && course.is_available && total > 0) groups.ready.push(row); else groups.unavailable.push(row);
      if (total <= 0) groups.zeroPrice.push(row);
    }
    for (const [label, rows] of [["Ready courses", groups.ready], ["Unavailable courses", groups.unavailable], ["Zero-price courses", groups.zeroPrice]]) {
      console.log(`\n${label} (${rows.length})`); console.log(rows.length ? rows.join("\n") : "None");
    }
    if (missingEnvironment.length || !groups.ready.length) process.exitCode = 1;
  }
}
