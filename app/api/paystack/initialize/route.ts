import { randomUUID } from "node:crypto";
import { getCourse, getServerConfig, supabase, totalCents, validateApplicant } from "../../../lib/payments";
export async function POST(request: Request) {
  const config = getServerConfig(); if (!config) return Response.json({ message: "Payment is temporarily unavailable." }, { status: 503 });
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return Response.json({ message: "Invalid request." }, { status: 400 }); }
  const validation = validateApplicant(body.applicant); if (!validation.ok) return Response.json({ message: "Please check your details.", errors: validation.errors }, { status: 400 });
  const courseId = Number(body.courseId); if (!Number.isSafeInteger(courseId) || courseId < 1) return Response.json({ message: "Select a valid course." }, { status: 400 });
  let course; try { course = await getCourse(config, courseId); } catch { return Response.json({ message: "Course availability could not be checked." }, { status: 502 }); }
  if (!course) return Response.json({ message: "This course is unavailable." }, { status: 404 });
  const amount = totalCents(course); if (amount < 100) return Response.json({ message: "This course is not currently available for online payment." }, { status: 409 });
  const enrollmentId = randomUUID(), paymentId = randomUUID(), reference = `MTI-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const a = validation.applicant;
  const enrollment = await supabase(config, "enrollments", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ id: enrollmentId, course_id: course.id, first_name: a.firstName, last_name: a.lastName, email: a.email, phone: a.phone, id_passport_number: a.idPassportNumber, date_of_birth: a.dateOfBirth || null, address: a.address, qualification: a.qualification, preferred_intake: a.preferredIntake, notes: a.notes || null }) });
  if (!enrollment.ok) return Response.json({ message: "Your enrolment could not be created." }, { status: 502 });
  const payment = await supabase(config, "payments", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ id: paymentId, enrollment_id: enrollmentId, course_id: course.id, paystack_reference: reference, amount: amount, currency: "ZAR", customer_email: a.email }) });
  if (!payment.ok) return Response.json({ message: "Your payment could not be prepared." }, { status: 502 });
  const paystack = await fetch("https://api.paystack.co/transaction/initialize", { method: "POST", headers: { authorization: `Bearer ${config.paystackKey}`, "content-type": "application/json" }, body: JSON.stringify({ email: a.email, amount, currency: "ZAR", reference, callback_url: `${config.siteUrl}/payment/callback`, metadata: { enrollmentId, courseId: course.id, courseTitle: course.title } }) });
  const result = await paystack.json() as { status?: boolean; data?: { authorization_url?: string; reference?: string } };
  if (!paystack.ok || !result.status || !result.data?.authorization_url) { await supabase(config, `payments?id=eq.${paymentId}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ status: "initialization_failed" }) }); return Response.json({ message: "Paystack could not start the payment." }, { status: 502 }); }
  return Response.json({ authorizationUrl: result.data.authorization_url, reference: result.data.reference || reference, enrollmentId }, { status: 201 });
}
