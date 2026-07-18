export type PaymentProvider = "payfast" | "yoco" | "stripe" | "manual";

export type PaymentConfiguration = {
  provider: PaymentProvider;
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  secretKey: string;
  webhookSecret: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  sandbox: boolean;
};

function readBoolean(value: string | undefined, fallback = true) {
  if (!value) return fallback;
  return value.toLowerCase() !== "false";
}

export function getPaymentConfiguration(): PaymentConfiguration {
  return {
    provider: (process.env.PAYMENT_PROVIDER || "payfast") as PaymentProvider,
    merchantId: process.env.PAYMENT_MERCHANT_ID || "",
    merchantKey: process.env.PAYMENT_MERCHANT_KEY || "",
    passphrase: process.env.PAYMENT_PASSPHRASE || "",
    secretKey: process.env.PAYMENT_SECRET_KEY || "",
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || "",
    returnUrl: process.env.PAYMENT_RETURN_URL || "",
    cancelUrl: process.env.PAYMENT_CANCEL_URL || "",
    notifyUrl: process.env.PAYMENT_NOTIFY_URL || "",
    sandbox: readBoolean(process.env.PAYMENT_SANDBOX, true),
  };
}

export function isPaymentConfigured(configuration = getPaymentConfiguration()) {
  if (configuration.provider === "manual") return true;

  if (configuration.provider === "payfast") {
    return Boolean(
      configuration.merchantId &&
        configuration.merchantKey &&
        configuration.returnUrl &&
        configuration.cancelUrl &&
        configuration.notifyUrl,
    );
  }

  return Boolean(
    configuration.secretKey &&
      configuration.returnUrl &&
      configuration.cancelUrl &&
      configuration.notifyUrl,
  );
}
