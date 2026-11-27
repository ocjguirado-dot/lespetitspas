import assert from "node:assert/strict";
import test from "node:test";
import { buildMessageNotification, resolveRecipients } from "./notification.mjs";

test("ne reprend aucun contenu du message et fournit le lien et la mention de réponse", () => {
  const bodyMarker = "allergie-fictive-XYZ";
  const notification = buildMessageNotification({
    parentFirstName: "Ariane <équipe>",
    childFirstName: "Léa & Cie",
    appUrl: "https://example.test/?source=<équipe>",
    body: bodyMarker,
  });

  assert.equal(notification.subject, "Nouveau message de Ariane <équipe> pour Léa & Cie");
  assert.deepEqual(Object.keys(notification).sort(), ["html", "messagesUrl", "subject", "text"]);
  assert.doesNotMatch(notification.subject, new RegExp(bodyMarker, "u"));
  assert.doesNotMatch(notification.text, new RegExp(bodyMarker, "u"));
  assert.doesNotMatch(notification.html, new RegExp(bodyMarker, "u"));
  assert.match(notification.html, /Ariane &lt;équipe&gt; pour Léa &amp; Cie/u);
  assert.match(notification.html, /https:\/\/example\.test\/\?source=&lt;équipe&gt;\/staff\/messages/u);
  assert.match(notification.text, /Connectez-vous pour le lire et y répondre/u);
  assert.match(notification.html, /Connectez-vous pour le lire et y répondre/u);
});

test("le destinataire de test remplace entièrement les destinataires prévus", () => {
  const intended = ["equipe@example.test", "autre@example.test"];
  const recipient = "compte-resend@example.test";
  assert.deepEqual(resolveRecipients(intended, recipient), [recipient]);

  const notification = buildMessageNotification({
    parentFirstName: "Parent",
    childFirstName: "Enfant",
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
