import { hasAdminSession, isSameOrigin, noStore } from "../../../lib/admin-auth";
import { adminOverview, saveManagedProgramme } from "../../../lib/admin-programmes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!hasAdminSession(request)) return noStore(Response.json({error: "Administrator sign-in required."}, {status: 401}));
  try {return noStore(Response.json(await adminOverview()));}
  catch {return noStore(Response.json({error: "Programme data is unavailable. Check admin settings."}, {status: 503}));}
}
async function save(request: Request, editing: boolean) {
  if (!isSameOrigin(request)) return noStore(Response.json({error: "Invalid request origin."}, {status: 403}));
  if (!hasAdminSession(request)) return noStore(Response.json({error: "Administrator sign-in required."}, {status: 401}));
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 16_384) return noStore(Response.json({error: "Programme details are too large."}, {status: 413}));
  let body: unknown;
  try {body = await request.json();} catch {return noStore(Response.json({error: "Invalid JSON body."}, {status: 400}));}
  let id: number | undefined;
  if (editing) {
    const raw = body && typeof body === "object" && "id" in body ? (body as {id: unknown}).id : undefined;
    const candidate = Number(raw);
    if (!Number.isSafeInteger(candidate) || candidate <= 0) return noStore(Response.json({error: "A valid programme ID is required."}, {status: 400}));
    id = candidate;
  }
  try {const programme = await saveManagedProgramme(body, id);
    return noStore(Response.json({programme, message: "Programme saved."}, {status: editing ? 200 : 201}));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Programme could not be saved.";
    const isValidation = /invalid|required|between|slug|cannot|must|publish|enrolment|not found/i.test(message);
    return noStore(Response.json({error: message}, {status: isValidation ? 400 : 503}));
  }
}
export async function POST(request: Request) {return save(request, false);}
export async function PATCH(request: Request) {return save(request, true);}
