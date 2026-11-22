import { redirect } from "next/navigation";
import { connection } from "next/server";
import { SetPasswordForm } from "@/components/auth/set-password-form";
import { Card } from "@/components/ui/card";
import { getCurrentRole } from "@/lib/auth";

export default async function SetPasswordPage() {
  await connection();
  const role = await getCurrentRole();
  if (!role) redirect("/login");
  if (role !== "parent") redirect("/staff");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-10">
      <Card className="w-full gap-5 p-6 sm:p-8">
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold">Créer votre mot de passe</h1>
          <p className="text-sm text-muted-foreground">Choisissez un mot de passe d’au moins 8 caractères.</p>
        </div>
        <SetPasswordForm />
      </Card>
    </main>
  );
}
