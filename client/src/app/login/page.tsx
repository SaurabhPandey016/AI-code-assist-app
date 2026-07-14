"use client";

import { LoginForm } from '../../components/auth/LoginForm';
import { AppShell } from '../../components/ui/shell';

export default function LoginPage() {
  return (
    <AppShell>
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-16 text-slate-100">
        <LoginForm />
      </div>
    </AppShell>
  );
}
