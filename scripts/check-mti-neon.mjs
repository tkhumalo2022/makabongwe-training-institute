import { neon } from "@neondatabase/serverless";
if(process.env.MAKABONGWE_INSTITUTE_MODE!=="neon"||!process.env.NEON_DATABASE_URL) {
  console.error("PREVIEW_DATABASE_NOT_CONFIGURED");
  process.exit(2);
}
const sql=neon(process.env.NEON_DATABASE_URL);
try {
  const result=await sql.query(
    "SELECT (SELECT count(*)::int FROM public.mti_students) AS students,"+
    "(SELECT count(*)::int FROM public.mti_courses) AS courses,"+
    "(SELECT count(*)::int FROM public.mti_course_enrolments) AS enrolments,"+
    "(SELECT current_database()) AS database_name"
  );
  if(!Array.isArray(result)||result.length!==1)throw Error("Unexpected PostgreSQL response");
  console.log("NEON_PREVIEW_CONNECTED",JSON.stringify({
    students:result[0].students,courses:result[0].courses,enrolments:result[0].enrolments,
    databaseVerified:typeof result[0].database_name==="string"
  }));
} catch(error) {
  console.error("NEON_PREVIEW_CHECK_FAILED",error instanceof Error?error.name:"error");
  process.exit(1);
}
