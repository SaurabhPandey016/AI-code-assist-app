"use client";

import { AppShell } from '../components/ui/shell';
import { LoginForm } from '../components/auth/LoginForm';

export default function Home() {
  return (
    <AppShell>
      <div className="flex min-h-[70vh] items-center justify-center px-4 text-slate-100">
        <LoginForm />
      </div>
    </AppShell>
  );
}
