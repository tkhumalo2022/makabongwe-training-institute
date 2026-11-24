import type { Metadata } from "next";
import StudentPortal from "./student-portal";
import "./learn.css";
import "./intranet.css";
export const metadata:Metadata={title:"Student Portal | Makabongwe",robots:{index:false,follow:false,noarchive:true}};
export default function LearnHome(){return <StudentPortal/>;}
