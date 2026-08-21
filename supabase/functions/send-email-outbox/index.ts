import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.16';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char] || char));
const eventPresentation = (eventType: string) => {
  if (eventType.includes('payment')) return { eyebrow: 'PAGO CONFIRMADO', icon: '✓', accent: '#16a34a' };
  if (eventType.includes('team')) return { eyebrow: 'EQUIPOS', icon: '♟', accent: '#2563eb' };
  if (eventType.includes('registration')) return { eyebrow: 'INSCRIPCIÓN', icon: '✓', accent: '#7c3aed' };
  if (eventType === 'welcome') return { eyebrow: 'BIENVENIDO', icon: 'TX', accent: '#000000' };
  return { eyebrow: 'TORNEOS', icon: '★', accent: '#000000' };
};
const emailHtml = (subject: string, body: string, eventType: string, appUrl: string) => {
  const safeSubject = escapeHtml(subject);
  const paragraphs = body.split(/\n+/).filter(Boolean).map(line => `<p style="margin:0 0 14px;color:#344054;font-size:16px;line-height:1.65">${escapeHtml(line)}</p>`).join('');
  const presentation = eventPresentation(eventType);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeSubject}</title></head><body style="margin:0;background:#f2f4f7;font-family:Arial,Helvetica,sans-serif;color:#101828"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${safeSubject}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f4f7"><tr><td align="center" style="padding:32px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px"><tr><td style="background:#000;border-radius:22px 22px 0 0;padding:25px 32px;color:#fff"><table role="presentation" width="100%"><tr><td style="font-size:22px;font-weight:900;letter-spacing:-1px">TOURNAMENTX</td><td align="right" style="font-size:11px;font-weight:700;color:#d0d5dd;letter-spacing:1.5px">COMPITE · ORGANIZA · GANA</td></tr></table></td></tr><tr><td style="background:#fff;padding:38px 38px 30px;border:1px solid #e4e7ec;border-top:0"><div style="display:inline-block;width:48px;height:48px;line-height:48px;text-align:center;border-radius:14px;background:${presentation.accent};color:#fff;font-size:18px;font-weight:900;margin-bottom:22px">${presentation.icon}</div><div style="font-size:11px;letter-spacing:1.7px;color:#667085;font-weight:800;margin-bottom:9px">${presentation.eyebrow}</div><h1 style="font-size:28px;line-height:1.2;letter-spacing:-.7px;margin:0 0 20px;color:#101828">${safeSubject}</h1>${paragraphs}<table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:26px"><tr><td style="border-radius:999px;background:#000"><a href="${escapeHtml(appUrl)}" style="display:inline-block;padding:14px 24px;color:#fff;text-decoration:none;font-size:14px;font-weight:800">Abrir TournamentX →</a></td></tr></table></td></tr><tr><td style="background:#fff;border:1px solid #e4e7ec;border-top:1px solid #f2f4f7;border-radius:0 0 22px 22px;padding:20px 38px;color:#98a2b3;font-size:12px;line-height:1.5">Este es un aviso automático relacionado con una acción en tu cuenta de TournamentX. Si no reconoces esta actividad, protege tu cuenta.</td></tr><tr><td align="center" style="padding:20px;color:#98a2b3;font-size:11px">© ${new Date().getFullYear()} TournamentX · Esports y deportes competitivos</td></tr></table></td></tr></table></body></html>`;
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Método no permitido.' }, 405);
  const supabaseUrl = Deno.env.get('SUPABASE_URL'); const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const smtpUser = Deno.env.get('SMTP_USER'); const smtpPass = Deno.env.get('SMTP_PASS');
  const appUrl = Deno.env.get('APP_URL') || 'https://tournament-x-vfinal.vercel.app';
  if (!supabaseUrl || !serviceKey || !smtpUser || !smtpPass) return jsonResponse(request, { error: 'Correo transaccional no configurado.' }, 503);
  const admin = createClient(supabaseUrl, serviceKey);
  const transporter = nodemailer.createTransport({ host:Deno.env.get('SMTP_HOST')||'smtp.gmail.com', port:Number(Deno.env.get('SMTP_PORT')||465), secure:true, auth:{user:smtpUser,pass:smtpPass} });
  const { data:queued,error } = await admin.from('email_outbox').select('*').eq('status','pending').lt('attempts',4).order('created_at').limit(10);
  if (error) return jsonResponse(request,{error:error.message},500);
  let sent=0;
  for (const item of queued||[]) {
    const claim=await admin.from('email_outbox').update({status:'sending',attempts:item.attempts+1}).eq('id',item.id).eq('status','pending').select('id').maybeSingle(); if(!claim.data) continue;
    try {
      await transporter.sendMail({from:`TournamentX <${smtpUser}>`,replyTo:smtpUser,to:item.recipient,subject:item.subject,text:`${item.body}\n\nAbrir TournamentX: ${appUrl}`,html:emailHtml(item.subject,item.body,item.event_type,appUrl)});
      await admin.from('email_outbox').update({status:'sent',sent_at:new Date().toISOString(),last_error:null}).eq('id',item.id); sent+=1;
    } catch(reason) { await admin.from('email_outbox').update({status:item.attempts+1>=4?'failed':'pending',last_error:reason instanceof Error?reason.message.slice(0,500):'Error SMTP'}).eq('id',item.id); }
  }
  return jsonResponse(request,{sent});
});
