import { verifyPayment } from "../../../lib/verify-payment";
export async function GET(request: Request) { const reference = new URL(request.url).searchParams.get("reference") || ""; const result = await verifyPayment(reference); return Response.json(result.body, { status: result.httpStatus, headers: { "cache-control": "no-store" } }); }
