import "server-only";
import type { OutboxItem } from "./institute-store";
import { markDelivery } from "./institute-store";

export function mailDeliveryReady(){
  return process.env.MAKABONGWE_EMAIL_DELIVERY === "enabled" &&
    Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
}

/**
 * Preview-safe by default: queue mail locally, no external deliveries without
 * explicit server-only opt-in and verified Resend sender configuration.
 */
export async function deliverStudentEmail(item:OutboxItem){
  if(!mailDeliveryReady()) return {state:"queued" as const,reason:"Email provider is in preview mode."};
  if(item.recipient.endsWith(".invalid"))return {state:"queued" as const,reason:"Demo address, no email sent."};
  try {
    const response=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{"authorization":`Bearer ${process.env.RESEND_API_KEY!}`,"content-type":"application/json","Idempotency-Key":item.id},
      body:JSON.stringify({from:process.env.RESEND_FROM_EMAIL,to:[item.recipient],subject:item.subject,text:item.body}),
      cache:"no-store",signal:AbortSignal.timeout(12_000),
    });
    const result=await response.json().catch(()=>({})) as {id?:string};
    if(!response.ok){
      await markDelivery(item.id,"failed",undefined,"Email provider returned "+response.status);
      return {state:"failed" as const};
    }
    await markDelivery(item.id,"sent",result.id);
    return {state:"sent" as const};
  }catch(error){
    await markDelivery(item.id,"failed",undefined,"Temporary delivery error.");
    console.error("[student-mail] delivery failed",error instanceof Error?error.name:"unknown");
    return {state:"failed" as const};
  }
}
