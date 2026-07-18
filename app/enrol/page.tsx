import type { Metadata } from "next";
import { EnrolmentFlow } from "./enrolment-flow";
export const metadata: Metadata = { title: "Enrol", description: "Select a Makabongwe course, submit your enrolment and pay securely with Paystack." };
export default function EnrolPage() { return <main><section className="enrol-hero"><div className="shell"><p className="eyebrow"><span />Online enrolment</p><h1>Choose your course.<br />Start your journey.</h1><p>Select an available programme, complete your details and continue to Paystack&apos;s secure payment page.</p></div></section><EnrolmentFlow /></main>; }
