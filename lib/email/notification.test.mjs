import assert from "node:assert/strict";
import test from "node:test";
import { buildMessageNotification, createNotificationExcerpt, resolveRecipients } from "./notification.mjs";

test("normalise les espaces et conserve au plus 80 caractères Unicode", () => {
  assert.equal(createNotificationExcerpt("  Bonjour\n\t équipe   "), "Bonjour équipe");
  const excerpt = createNotificationExcerpt("😀".repeat(81));
  assert.equal(Array.from(excerpt).length, 80);
  assert.equal(excerpt.endsWith("…"), true);
});

test("n’ajoute l’ellipse que si le texte est tronqué", () => {
  assert.equal(createNotificationExcerpt("a".repeat(80)), "a".repeat(80));
  assert.equal(createNotificationExcerpt("a".repeat(81)), `${"a".repeat(79)}…`);
  assert.equal(Array.from(createNotificationExcerpt("a".repeat(500))).length, 80);
});

test("échappe le HTML dynamique et fournit le lien et la mention de réponse", () => {
  const notification = buildMessageNotification({
    parentFirstName: "Ariane",
    childFirstName: "Léa",
    body: '<b>Bonjour</b> & "équipe"',
    appUrl: "https://example.test/",
  });

  assert.equal(notification.subject, "Nouveau message de Ariane pour Léa");
  assert.match(notification.html, /&lt;b&gt;Bonjour&lt;\/b&gt; &amp; &quot;équipe&quot;/u);
  assert.doesNotMatch(notification.html, /<b>Bonjour/u);
  assert.match(notification.html, /https:\/\/example\.test\/staff\/messages/u);
  assert.match(notification.text, /Connectez-vous pour répondre/u);
  assert.match(notification.html, /Connectez-vous pour répondre/u);
});

test("le destinataire de test remplace entièrement les destinataires prévus", () => {
  const intended = ["equipe@example.test", "autre@example.test"];
  const recipient = "compte-resend@example.test";
  assert.deepEqual(resolveRecipients(intended, recipient), [recipient]);

  const notification = buildMessageNotification({
    parentFirstName: "Parent",
    childFirstName: "Enfant",
    body: "Bonjour",
    appUrl: "https://example.test",
    testRecipient: recipient,
  });
  assert.match(notification.subject, /^\[test\] Nouveau message/u);
  assert.doesNotMatch(JSON.stringify(notification), /equipe@example\.test|autre@example\.test/u);
});

test("sans destinataire de test, conserve les destinataires prévus", () => {
  assert.deepEqual(resolveRecipients(["equipe@example.test"], undefined), ["equipe@example.test"]);
  assert.deepEqual(resolveRecipients("equipe@example.test", undefined), ["equipe@example.test"]);
});
