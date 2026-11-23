import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentRole } from "@/lib/auth";

export default async function LoginPage() {
  const role = await getCurrentRole();

  if (role) redirect(role === "staff" ? "/staff" : "/parent");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <Card className="w-full max-w-md border-border/80 shadow-sm">
        <CardHeader className="space-y-3 text-center">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Les Petits Pas
          </p>
          <h1 className="font-heading text-2xl leading-snug font-medium sm:text-3xl">
            Bienvenue
          </h1>
          <CardDescription>
            Connectez-vous pour accéder à votre espace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
