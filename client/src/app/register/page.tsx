"use client";

import { RegisterForm } from '../../components/auth/RegisterForm';
import { AppShell } from '../../components/ui/shell';

export default function RegisterPage() {
  return (
    <AppShell>
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-16 text-slate-100">
        <RegisterForm />
      </div>
    </AppShell>
  );
}
