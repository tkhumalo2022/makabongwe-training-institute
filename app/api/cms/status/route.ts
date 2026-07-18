import { getCmsConnectionStatus } from "../../../lib/cms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getCmsConnectionStatus();

  return Response.json(status, {
    status: status.connected ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
