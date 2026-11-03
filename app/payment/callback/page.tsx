import type { Metadata } from "next";
export const metadata: Metadata = { robots: { index: false, follow: false } };
import { Suspense } from "react"; import { PaymentResult } from "./payment-result";
export default function CallbackPage(){return <main><section className="section payment-page"><div className="shell"><Suspense fallback={<div className="result-card"><h1>Verifying your payment…</h1></div>}><PaymentResult/></Suspense></div></section></main>}
