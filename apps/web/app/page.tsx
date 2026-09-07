"use client";

import { Github, LockKeyhole, MessageCircle, Sparkles } from "lucide-react";

const providers = [
  { label: "Continue with Google", icon: <span className="text-base font-semibold text-[#4285f4]">G</span> },
  { label: "Continue with GitHub", icon: <Github className="size-4" /> },
  { label: "Continue with ChatGPT", icon: <Sparkles className="size-4" /> },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 sm:px-8 sm:py-5">
        <span className="text-xl font-black tracking-[-0.14em]">v0</span>
        <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
          Sign Up
        </button>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-md flex-col items-center px-6 text-center">
        <div className="mb-5 flex size-20 items-center justify-center rounded-full border border-border bg-card shadow-sm">
          <span className="text-4xl font-black tracking-[-0.16em]">v0</span>
        </div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight">Sign in to v0</h1>
        <p className="mt-3 text-pretty text-sm leading-6 text-muted-foreground">
          Sign in to v0 using your Vercel account.
        </p>

        <form className="mt-6 w-full" onSubmit={(event) => event.preventDefault()}>
          <label className="sr-only" htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="name@work-email.com"
            className="h-12 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          <button className="mt-2 h-11 w-full rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90">
            Continue with Email
          </button>
        </form>

        <div className="my-4 h-px w-full bg-border" />
        <div className="w-full space-y-3">
          {providers.map((provider) => (
            <button key={provider.label} className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-transparent text-sm font-medium transition-colors hover:bg-accent">
              {provider.icon}
              {provider.label}
            </button>
          ))}
          <button className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-transparent text-sm font-medium transition-colors hover:bg-accent">
            <LockKeyhole className="size-4" />
            Continue with SAML SSO
          </button>
        </div>

        <button className="mt-7 text-sm text-foreground underline-offset-4 hover:underline">
          Show other options
        </button>
        <p className="mt-10 text-sm text-muted-foreground">
          Don&apos;t have an account? <button className="text-foreground underline underline-offset-4">Sign Up</button>
        </p>
        <p className="mt-5 max-w-xs text-xs leading-5 text-muted-foreground">
          By proceeding, you agree to creating a Vercel account subject to our <a className="underline underline-offset-4" href="#terms">Terms of Service</a> and <a className="underline underline-offset-4" href="#privacy">Privacy Policy</a>.
        </p>
        <span className="mt-auto flex items-center gap-2 pb-6 pt-10 text-xs text-muted-foreground">
          <MessageCircle className="size-3.5" /> Secure access for your workspace
        </span>
      </section>
    </main>
  );
}
