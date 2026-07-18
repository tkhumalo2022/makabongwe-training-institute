import "server-only";
import { getSupabaseConfig, supabase } from "./payments";

export type CoursePaymentInput = {
  priceRands: number; registrationFeeRands: number; isAvailable: boolean;
  isPublished: boolean; department: string; duration: string;
  deliveryMode: string; location: string; intake?: string; imageUrl?: string;
};

export function validateCoursePaymentInput(input: CoursePaymentInput) {
  const errors: string[] = [];
  if (!Number.isFinite(input.priceRands) || input.priceRands < 0) errors.push("Course price cannot be negative.");
  if (!Number.isFinite(input.registrationFeeRands) || input.registrationFeeRands < 0) errors.push("Registration fee cannot be negative.");
  const priceCents = Math.round(input.priceRands * 100);
  const registrationFeeCents = Math.round(input.registrationFeeRands * 100);
  if (input.isAvailable && priceCents + registrationFeeCents === 0) errors.push("An available course must have a payment amount greater than zero.");
  if (input.isAvailable && !input.isPublished) errors.push("An unpublished course cannot be available for enrolment.");
  for (const [label, value] of [["Department", input.department], ["Duration", input.duration], ["Delivery mode", input.deliveryMode], ["Location", input.location]]) if (!value.trim()) errors.push(`${label} is required.`);
  return errors.length ? { ok: false as const, errors } : { ok: true as const, values: { priceCents, registrationFeeCents } };
}

// Server-only building block for a future authenticated admin surface. It is
// intentionally not exposed through a public Route Handler.
export async function updateCoursePaymentSettings(courseId: number, input: CoursePaymentInput) {
  const validation = validateCoursePaymentInput(input);
  if (!validation.ok) return validation;
  const config = getSupabaseConfig();
  if (!config) return { ok: false as const, errors: ["Server configuration is unavailable."] };
  const response = await supabase(config, `cms_programmes?id=eq.${courseId}`, {
    method: "PATCH", headers: { prefer: "return=representation" },
    body: JSON.stringify({ price_cents: validation.values.priceCents, registration_fee_cents: validation.values.registrationFeeCents,
      is_available: input.isAvailable, department: input.department.trim(), duration: input.duration.trim(),
      delivery_mode: input.deliveryMode.trim(), location: input.location.trim(), available_intake: input.intake?.trim() || null,
      image_url: input.imageUrl?.trim() || null, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) return { ok: false as const, errors: ["Course payment settings could not be saved."] };
  return { ok: true as const, message: "Course payment settings saved." };
}
