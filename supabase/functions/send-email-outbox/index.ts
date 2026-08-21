import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.16';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char] || char));

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Método no permitido.' }, 405);
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const smtpUser = Deno.env.get('SMTP_USER');
  const smtpPass = Deno.env.get('SMTP_PASS');
  if (!supabaseUrl || !serviceKey || !smtpUser || !smtpPass) return jsonResponse(request, { error: 'Correo transaccional no configurado.' }, 503);

  const admin = createClient(supabaseUrl, serviceKey);
  const transporter = nodemailer.createTransport({ host: Deno.env.get('SMTP_HOST') || 'smtp.gmail.com', port: Number(Deno.env.get('SMTP_PORT') || 465), secure: true, auth: { user: smtpUser, pass: smtpPass } });
  const { data: queued, error } = await admin.from('email_outbox').select('*').eq('status','pending').lt('attempts',4).order('created_at').limit(10);
  if (error) return jsonResponse(request, { error: error.message }, 500);
  let sent = 0;
  for (const item of queued || []) {
    const claim = await admin.from('email_outbox').update({ status:'sending', attempts:item.attempts+1 }).eq('id',item.id).eq('status','pending').select('id').maybeSingle();
    if (!claim.data) continue;
    try {
      await transporter.sendMail({ from: `TournamentX <${smtpUser}>`, to:item.recipient, subject:item.subject, text:item.body, html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px"><h2 style="margin:0 0 18px">TOURNAMENTX</h2><p style="line-height:1.6;color:#263246">${escapeHtml(item.body)}</p><p style="margin-top:28px;font-size:12px;color:#7a8494">Este mensaje fue generado automáticamente por una acción realizada en TournamentX.</p></div>` });
      await admin.from('email_outbox').update({ status:'sent', sent_at:new Date().toISOString(), last_error:null }).eq('id',item.id); sent += 1;
    } catch (reason) {
      await admin.from('email_outbox').update({ status:item.attempts+1>=4?'failed':'pending', last_error:reason instanceof Error ? reason.message.slice(0,500) : 'Error SMTP' }).eq('id',item.id);
    }
  }
  return jsonResponse(request, { sent });
});
