import assert from "node:assert/strict";
import test from "node:test";
import { buildInvitationLink, isInvitationUuid, mapInvitationError, normalizeInvitationEmail, safeInvitationNext } from "./invitation.mjs";
import { buildParentInvitationEmail } from "./notification.mjs";

test("normalise et valide les adresses email et les UUID", () => {
  assert.equal(normalizeInvitationEmail("  Parent@Example.test "), "parent@example.test");
  assert.equal(normalizeInvitationEmail("pas-une-adresse"), null);
  assert.equal(isInvitationUuid("550e8400-e29b-41d4-a716-446655440000"), true);
  assert.equal(isInvitationUuid("abc"), false);
});

test("construit le lien d'invitation depuis le token hash uniquement", () => {
  const link = new URL(buildInvitationLink("https://app.example.test/", "hash+secret"));
  assert.equal(link.origin, "https://app.example.test");
  assert.equal(link.pathname, "/auth/confirm");
  assert.equal(link.searchParams.get("token_hash"), "hash+secret");
  assert.equal(link.searchParams.get("type"), "invite");
  assert.equal(link.searchParams.get("next"), "/auth/set-password");
  assert.equal(link.searchParams.has("action_link"), false);
});

test("n'autorise que la destination exacte de définition du mot de passe", () => {
  assert.equal(safeInvitationNext("/auth/set-password"), "/auth/set-password");
  for (const value of ["/staff", "https://example.test", "//example.test", "/auth/set-password?x=1", undefined]) {
    assert.equal(safeInvitationNext(value), null);
  }
});

test("prépare un email d'invitation échappé, minimal et redirigé en mode test", () => {
  const email = buildParentInvitationEmail({
    childFirstName: "Léa <b>",
    invitationUrl: "https://app.example.test/auth/confirm?x=\"&y=<tag>",
    testRecipient: "resend-test@example.test",
  });
  assert.equal(email.subject, "[test] Vous êtes invité à suivre la journée de Léa <b> sur Les Petits Pas");
  assert.match(email.html, /Léa &lt;b&gt;/u);
  assert.match(email.html, /&quot;&amp;y=&lt;tag&gt;/u);
  assert.match(email.text, /valable 24 h/u);
  assert.match(email.html, /uniquement pour son suivi par la crèche/u);
  assert.doesNotMatch(`${email.subject}${email.text}${email.html}`, /resend-test@example\.test|nom de famille|allergie|médicament/iu);
});

test("mappe les erreurs Auth sans exposer leur contenu", () => {
  assert.equal(mapInvitationError({ code: "email_exists", message: "secret provider text" }), "already-active");
  assert.equal(mapInvitationError({ message: "User already registered" }), "already-active");
  assert.equal(mapInvitationError({ code: "unexpected_error", message: "secret" }), "error");
  assert.equal(mapInvitationError(null), "error");
});
