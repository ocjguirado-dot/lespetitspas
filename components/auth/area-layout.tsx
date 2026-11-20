import type { ReactNode } from "react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function AreaLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <p className="font-heading text-lg font-semibold text-foreground">
            Les Petits Pas
          </p>
          <form action={signOut}>
            <Button className="min-h-10" type="submit" variant="outline">
              Déconnexion
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
