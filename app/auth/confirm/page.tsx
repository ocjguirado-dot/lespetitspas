import Link from "next/link";
import { connection } from "next/server";
import { Card } from "@/components/ui/card";
import { ConfirmInvitationForm } from "@/components/auth/confirm-invitation-form";
import { safeInvitationNext } from "@/lib/email/invitation.mjs";

export default async function ConfirmInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string | string[]; type?: string | string[]; next?: string | string[] }>;
}) {
  await connection();
  const params = await searchParams;
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash : "";
  const type = typeof params.type === "string" ? params.type : "";
  const next = safeInvitationNext(params.next) ?? "";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-10">
      <Card className="w-full gap-5 p-6 sm:p-8">
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold">Confirmer votre invitation</h1>
          <p className="text-sm text-muted-foreground">Continuez pour définir le mot de passe de votre compte.</p>
        </div>
        <ConfirmInvitationForm next={next} tokenHash={tokenHash} type={type} />
        <Link className="text-sm text-foreground underline underline-offset-4" href="/login">Aller à la connexion</Link>
      </Card>
    </main>
  );
}
