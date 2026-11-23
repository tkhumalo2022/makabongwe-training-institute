import type { Metadata } from "next";
import StudentPortal from "../../student-portal";
import "../../learn.css";
export const metadata:Metadata={title:"Course Space | Makabongwe",robots:{index:false,follow:false,noarchive:true}};
export default async function StudentCoursePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  return <StudentPortal slug={slug}/>;
}
