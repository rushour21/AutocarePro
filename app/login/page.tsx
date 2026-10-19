'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, LogIn, ShieldCheck, UserCog, Wrench } from 'lucide-react';
import { Logo } from '@/components/layout/AppShell';
import { Button, Field, Input } from '@/components/ui';
import { homeFor, login } from '@/lib/auth';

const DEMOS = [
  { label: 'Garage Admin', sub: 'Rahul Sharma', email: 'admin@autohub.com', password: 'admin123', icon: UserCog },
  { label: 'Technician', sub: 'Amit Gupta', email: 'amit@autohub.com', password: 'tech123', icon: Wrench },
  { label: 'Customer', sub: 'Rahul Mehta', email: 'rahul.mehta@example.com', password: 'customer123', icon: ShieldCheck },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const submit = (e?: string, p?: string) => {
    const res = login(e ?? email, p ?? password);
    if (!res.ok) return setError(res.error);
    const next = params.get('next');
    const home = homeFor(res.user.role);
    router.push(next && next.startsWith(home) ? next : home);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="neu w-full max-w-[440px] p-7 sm:p-9">
        <Link href="/">
          <Logo size="lg" />
        </Link>
        <h1 className="mt-7 text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-ink-500">Welcome back. Enter your details to open your portal.</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Field label="Email">
            <Input type="email" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="you@example.com" required />
          </Field>
          <Field label="Password" error={error}>
            <div className="relative">
              <Input type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="••••••••" required className="pr-11" />
              <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Button type="submit" size="lg" className="w-full">
            <LogIn className="h-4 w-4" /> Sign in
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-ink-400">
          <span className="h-px flex-1 bg-ivory-300" /> Demo accounts <span className="h-px flex-1 bg-ivory-300" />
        </div>
        <div className="space-y-2.5">
          {DEMOS.map(({ label, sub, email: e, password: p, icon: Icon }) => (
            <button key={label} type="button" onClick={() => submit(e, p)} className="neu-sm flex w-full items-center gap-3 p-3 text-left transition hover:-translate-y-0.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-coral-100 text-coral-500">
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex-1 leading-tight">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-xs text-ink-400">
                  {sub} · {e}
                </span>
              </span>
              <span className="text-xs font-medium text-coral-600">Use</span>
            </button>
          ))}
        </div>
        <p className="mt-5 text-center text-[11px] leading-5 text-ink-400">Demo build with mock data stored in this browser. Passwords are shown above for evaluation only.</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
