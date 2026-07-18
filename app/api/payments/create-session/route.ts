import { NextResponse } from "next/server";
import { getPaymentConfiguration, isPaymentConfigured } from "../../../lib/payment";

type PaymentSessionRequest = {
  programme?: string;
  amount?: number;
  applicantName?: string;
  applicantEmail?: string;
};

export async function POST(request: Request) {
  const configuration = getPaymentConfiguration();

  if (!isPaymentConfigured(configuration)) {
    return NextResponse.json(
      {
        error: "Payment provider configuration is incomplete.",
        code: "PAYMENT_PROVIDER_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as PaymentSessionRequest | null;

  if (!body?.programme || !body.applicantName || !body.applicantEmail) {
    return NextResponse.json(
      { error: "Programme, applicant name and applicant email are required." },
      { status: 400 },
    );
  }

  if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0) {
    return NextResponse.json({ error: "A valid payment amount is required." }, { status: 400 });
  }

  return NextResponse.json(
    {
      error: `The ${configuration.provider} adapter is ready for credentials but has not been activated yet.`,
      code: "PAYMENT_ADAPTER_PENDING_ACTIVATION",
    },
    { status: 501 },
  );
}
