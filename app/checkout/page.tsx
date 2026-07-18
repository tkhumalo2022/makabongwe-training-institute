import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "../components/page-hero";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Programme checkout",
  description: "Complete your Makabongwe programme enrolment and payment details.",
};

type CheckoutPageProps = {
  searchParams: Promise<{ programme?: string; amount?: string }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const programme = params.programme?.trim() || "Makabongwe programme";
  const parsedAmount = Number(params.amount);
  const amount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : undefined;

  return (
    <main>
      <PageHero
        eyebrow="Secure enrolment"
        title="Complete your programme registration."
        intro="Confirm the learner details below. Payment will activate automatically once the selected provider credentials are added."
        action="Contact admissions"
      />

      <section className="section">
        <div className="shell">
          <div className="split-heading">
            <div>
              <p className="eyebrow dark"><span />Selected programme</p>
              <h2>{programme}</h2>
            </div>
            <p>
              {amount
                ? `Amount due: R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`
                : "The final fee will be confirmed by the Makabongwe admissions team before payment."}
            </p>
          </div>

          <CheckoutForm programme={programme} amount={amount} />

          <p>
            Need help before continuing? <Link href={`/contact?service=${encodeURIComponent(programme)}#enquiry`}>Send a programme enquiry</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
