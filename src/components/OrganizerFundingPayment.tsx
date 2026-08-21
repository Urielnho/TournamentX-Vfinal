import React, { useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, LoaderCircle, ShieldCheck } from 'lucide-react';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface Props {
  clientSecret: string;
  amount: number;
  onPaid: () => Promise<void> | void;
  buttonLabel?: string;
}

function PaymentForm({ amount, onPaid, buttonLabel }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || busy) return;
    setBusy(true);
    setError('');
    const result = await stripe.confirmPayment({ elements, redirect: 'if_required' });
    if (result.error) {
      setError(result.error.message || 'Stripe no pudo confirmar el pago.');
      setBusy(false);
      return;
    }
    if (result.paymentIntent?.status === 'succeeded' || result.paymentIntent?.status === 'processing') await onPaid();
    else {
      setError('El pago todavía no fue confirmado. Inténtalo nuevamente.');
      setBusy(false);
    }
  };

  return <form onSubmit={submit} className="space-y-4">
    <PaymentElement options={{ layout: 'tabs' }} />
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
    <button disabled={!stripe || busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
      {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
      {buttonLabel || `Pagar $${amount.toLocaleString()} MXN y publicar`}
    </button>
    <p className="flex items-center justify-center gap-1 text-[11px] text-gray-500"><ShieldCheck className="h-3.5 w-3.5" /> Los datos de la tarjeta son procesados directamente por Stripe.</p>
  </form>;
}

export function OrganizerFundingPayment(props: Props) {
  if (!stripePromise) return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">Falta STRIPE_PUBLISHABLE_KEY en el archivo .env. Reinicia npm run dev después de agregarla.</p>;
  return <Elements stripe={stripePromise} options={{ clientSecret: props.clientSecret, appearance: { theme: 'stripe' }, locale: 'es' }}>
    <PaymentForm {...props} />
  </Elements>;
}
