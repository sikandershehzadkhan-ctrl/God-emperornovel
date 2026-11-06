import { createPasswordResetToken, hashPasswordResetToken } from "./password-reset-token.mjs";
import { issuePasswordResetToken, invalidatePasswordResetToken } from "./password-reset-store.mjs";
import { createPasswordResetLink } from "./password-reset-link.mjs";
import { deliverSecurityEmail } from "./security-email-delivery.mjs";

/**
 * Coordinates password-reset issuance and delivery. Missing configuration fails
 * closed before invalidating any existing recovery link.
 */
export async function requestPasswordReset({db,env,user,publicOrigin,now=new Date().toISOString()}={}) {
  if(!env?.SECURITY_EMAIL||typeof env.SECURITY_EMAIL.fetch!=="function")return {ok:false,reason:"unavailable"};
  if(!user||!Number.isSafeInteger(Number(user.id))||Number(user.id)<=0)return {ok:false,reason:"unavailable"};
  let action;
  try {
    const token=createPasswordResetToken();
    const tokenHash=await hashPasswordResetToken(token);
    action=createPasswordResetLink(token,publicOrigin);
    const issuedAt=new Date(now);
    if(!Number.isFinite(issuedAt.getTime()))return {ok:false,reason:"unavailable"};
    const createdAt=issuedAt.toISOString();
    const expiresAt=new Date(issuedAt.getTime()+30*60*1000).toISOString();
    const issued=await issuePasswordResetToken(db,{userId:Number(user.id),emailSnapshot:user.email,tokenHash,now:createdAt,expiresAt});
    if(!issued.ok)return {ok:false,reason:"unavailable"};
    const delivered=await deliverSecurityEmail(env,{
      template:"reset_password",recipient:user.email,actionUrl:action,
      publicOrigin:new URL(publicOrigin).origin,idempotencyKey:crypto.randomUUID()
    });
    if(!delivered.ok){
      try{await invalidatePasswordResetToken(db,{tokenHash,now:new Date().toISOString()});}catch{}
      return {ok:false,reason:"unavailable"};
    }
    return {ok:true};
  } catch {
    return {ok:false,reason:"unavailable"};
  }
}
