import "server-only";
import { neon } from "@neondatabase/serverless";
import type { ManagedProgramme } from "./admin-programmes";

function sql() {
  const url = process.env.NEON_DATABASE_URL || process.env.INSTITUTE_DATABASE_URL;
  if (process.env.MAKABONGWE_INSTITUTE_MODE !== "neon" || !url || !/^postgres(?:ql)?:\/\//.test(url))
    throw new Error("Neon preview database is not configured.");
  return neon(url);
}
type Row = Record<string, unknown>;
const fields = "id,slug,title,description,department,duration,delivery_mode,location,available_intake,image_url,price_cents,registration_fee_cents,sort_order,is_available,status,updated_at";
function programme(row: Row): ManagedProgramme {
  return {
    id:Number(row.id),slug:String(row.slug),title:String(row.title),description:String(row.description),
    department:String(row.department),duration:String(row.duration),delivery_mode:String(row.delivery_mode),
    location:String(row.location),available_intake:row.available_intake ? String(row.available_intake) : null,
    image_url:row.image_url ? String(row.image_url) : null, price_cents:Number(row.price_cents),
    registration_fee_cents:Number(row.registration_fee_cents),sort_order:Number(row.sort_order),
    is_published:row.status === "published",is_available:row.is_available === true,
    updated_at:row.updated_at ? new Date(String(row.updated_at)).toISOString():undefined,
  };
}
export async function listNeonProgrammes(): Promise<ManagedProgramme[]> {
  const rows = await sql().query("SELECT "+fields+" FROM public.mti_courses WHERE status <> 'archived' ORDER BY sort_order,id") as Row[];
  return rows.map(programme);
}
export async function saveNeonProgramme(
  values: Omit<ManagedProgramme,"id"|"updated_at">, id?: number
): Promise<ManagedProgramme> {
  const params = [values.slug,values.title,values.description,values.department,values.duration,
    values.delivery_mode,values.location,values.available_intake,values.image_url,values.price_cents,
    values.registration_fee_cents,values.sort_order,values.is_available,values.is_published?"published":"draft"];
  const insert = "INSERT INTO public.mti_courses(slug,title,description,department,duration,delivery_mode,location,available_intake,image_url,price_cents,registration_fee_cents,sort_order,is_available,status) VALUES ("+
    params.map((_,index)=>"$"+(index+1)).join(",")+") RETURNING "+fields;
  const update = "UPDATE public.mti_courses SET slug=$1,title=$2,description=$3,department=$4,duration=$5,delivery_mode=$6,location=$7,available_intake=$8,image_url=$9,price_cents=$10,registration_fee_cents=$11,sort_order=$12,is_available=$13,status=$14,updated_at=now() WHERE id=$15 AND status<>'archived' RETURNING "+fields;
  let rows:Row[];
  try{ rows=await sql().query(id===undefined?insert:update,id===undefined?params:[...params,id]) as Row[];}
  catch(e){
    if(e instanceof Error && /duplicate|unique|23505/i.test(e.message)) throw new Error("This programme slug already exists.");
    throw e;
  }
  if(!rows.length)throw new Error("Programme not found.");
  return programme(rows[0]);
}
export async function neonProgrammeOverview(){
  const programmes=await listNeonProgrammes();
  const [enrolments]=await sql().query("SELECT count(*)::int AS count FROM public.mti_course_enrolments") as Row[];
  return {mode:"neon" as const,programmes,enquiryCount:null,paymentCount:null,enrolmentCount:Number(enrolments?.count??0)};
}
