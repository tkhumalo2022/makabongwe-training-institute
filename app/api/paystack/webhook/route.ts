import { createHmac, timingSafeEqual } from "node:crypto";
import { getServerConfig } from "../../../lib/payments";
import { verifyPayment } from "../../../lib/verify-payment";
export async function POST(request: Request) {
  const config = getServerConfig(); if (!config) return new Response("Unavailable", { status: 503 });
  const raw = await request.text(); const signature = request.headers.get("x-paystack-signature") || "";
  const expected = createHmac("sha512", config.paystackKey).update(raw).digest("hex");
  const valid = signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return new Response("Invalid signature", { status: 401 });
  let event: { event?: string; data?: { reference?: string } }; try { event = JSON.parse(raw); } catch { return new Response("Invalid payload", { status: 400 }); }
  if (event.event === "charge.success" && event.data?.reference) await verifyPayment(event.data.reference);
  return new Response("OK", { status: 200 });
}
