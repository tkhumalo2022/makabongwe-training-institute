import { getServerConfig, supabase } from "./payments";
export async function verifyPayment(reference: string) {
  const config = getServerConfig(); if (!config) return { httpStatus: 503, body: { status: "error", message: "Verification is unavailable." } };
  if (!/^[A-Za-z0-9._-]{8,120}$/.test(reference)) return { httpStatus: 400, body: { status: "error", message: "Invalid payment reference." } };
  const local = await supabase(config, `payments?select=*,enrollments(first_name,last_name),cms_programmes(title)&paystack_reference=eq.${encodeURIComponent(reference)}&limit=1`);
  const rows = local.ok ? await local.json() as Record<string, unknown>[] : []; const payment = rows[0];
  if (!payment) return { httpStatus: 404, body: { status: "failed", message: "Payment record not found." } };
  const remote = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { authorization: `Bearer ${config.paystackKey}` }, cache: "no-store" });
  const payload = await remote.json() as { data?: Record<string, unknown> }; const data = payload.data || {};
  const valid = remote.ok && data.status === "success" && data.reference === reference && Number(data.amount) === Number(payment.amount) && data.currency === "ZAR";
  if (!valid) return { httpStatus: 200, body: { status: data.status === "pending" || data.status === "ongoing" ? "pending" : "failed", message: "Payment has not been confirmed." } };
  if (payment.status !== "success") {
    await supabase(config, `payments?id=eq.${payment.id}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ status: "success", paid_at: data.paid_at || new Date().toISOString(), paystack_transaction_id: String(data.id || ""), raw_response: { channel: data.channel, gateway_response: data.gateway_response } }) });
    await supabase(config, `enrollments?id=eq.${payment.enrollment_id}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ status: "submitted", payment_status: "paid" }) });
  }
  const applicant = payment.enrollments as { first_name?: string; last_name?: string } | null; const course = payment.cms_programmes as { title?: string } | null;
  return { httpStatus: 200, body: { status: "success", reference, applicantName: `${applicant?.first_name || ""} ${applicant?.last_name || ""}`.trim(), courseTitle: course?.title, amount: Number(payment.amount), currency: "ZAR" } };
}
