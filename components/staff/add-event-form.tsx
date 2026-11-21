"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addEvent, type EventActionState } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const initialState: EventActionState = { revision: 0 };
const emptyValues = { type: "repas", moment: "", qualite: "", debut: "", fin: "", nom: "", dose: "", heure: "", incident_type: "", gravite: "", autorisation_confirmee: "", note: "" };
const validTypes = ["repas", "sieste", "activite", "incident", "medicament"];
const mealMoments = ["matin", "midi", "gouter"];
const mealQualities = ["tout", "moitie", "peu", "rien"];
const napQualities = ["calme", "agitee", "reveil_precoce"];
const incidentTypes = ["chute", "morsure", "fievre", "autre"];
const incidentSeverities = ["leger", "modere", "urgent"];
const HH_MM_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

type EventDraft = typeof emptyValues;

function allowedValue(value: string, allowedValues: string[]): string {
  return allowedValues.includes(value) ? value : "";
}

function valuesFromAction(values: NonNullable<EventActionState["values"]>): EventDraft {
  const type = allowedValue(values.type, validTypes) || "repas";
  return {
    type,
    moment: type === "repas" ? allowedValue(values.moment ?? "", mealMoments) : "",
    qualite: allowedValue(values.qualite ?? "", type === "repas" ? mealQualities : napQualities),
    debut: type === "sieste" && HH_MM_PATTERN.test(values.debut ?? "") ? values.debut ?? "" : "",
    fin: type === "sieste" && HH_MM_PATTERN.test(values.fin ?? "") ? values.fin ?? "" : "",
    nom: type === "activite" || type === "medicament" ? values.nom ?? "" : "",
    incident_type: type === "incident" ? allowedValue(values.incident_type ?? "", incidentTypes) : "",
    gravite: type === "incident" ? allowedValue(values.gravite ?? "", incidentSeverities) : "",
    dose: type === "medicament" ? values.dose ?? "" : "",
    heure: type === "medicament" && HH_MM_PATTERN.test(values.heure ?? "") ? values.heure ?? "" : "",
    autorisation_confirmee: type === "medicament" && values.autorisation_confirmee === "true" ? "true" : "",
    note: values.note,
  };
}

export function AddEventForm({ childId }: { childId: string }) {
  const [state, formAction, pending] = useActionState(addEvent.bind(null, childId), initialState);
  const [draft, setDraft] = useState({ revision: 0, values: emptyValues });
  const submissionLock = useRef(false);
  const router = useRouter();
  const childPath = `/staff/children/${childId}`;
  const values = draft.revision === state.revision
    ? draft.values
    : state.values
      ? valuesFromAction(state.values)
      : emptyValues;
  const displayedErrors = draft.revision !== state.revision ? state.errors : undefined;
  const displayedFormError = draft.revision !== state.revision ? state.formError : undefined;

  useEffect(() => {
    if (!pending) submissionLock.current = false;
  }, [pending]);

  useEffect(() => {
    if (state.success && (window.location.pathname !== childPath || window.location.search)) {
      window.history.replaceState(null, "", childPath);
      router.refresh();
    }
  }, [childPath, router, state.revision, state.success]);

  function updateValue(field: keyof EventDraft, value: string) {
    setDraft({ revision: state.revision, values: { ...values, [field]: value } });
  }

  function updateType(value: string) {
    const type = allowedValue(value, validTypes) || "repas";
    setDraft({ revision: state.revision, values: { ...emptyValues, type, note: values.note } });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || submissionLock.current) return;

    submissionLock.current = true;
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  const typeId = `event-type-${childId}`;
  const momentId = `meal-moment-${childId}`;
  const mealQualityId = `meal-quality-${childId}`;
  const startTimeId = `nap-start-${childId}`;
  const endTimeId = `nap-end-${childId}`;
  const napQualityId = `nap-quality-${childId}`;
  const activityNameId = `activity-name-${childId}`;
  const incidentTypeId = `incident-type-${childId}`;
  const incidentSeverityId = `incident-severity-${childId}`;
  const medicationNameId = `medication-name-${childId}`;
  const medicationDoseId = `medication-dose-${childId}`;
  const medicationTimeId = `medication-time-${childId}`;
  const medicationAuthorizationId = `medication-authorization-${childId}`;
  const medicationAuthorizationMessageId = `${medicationAuthorizationId}-message`;
  const noteId = `event-note-${childId}`;
  const typeErrorId = `${typeId}-error`;
  const momentErrorId = `${momentId}-error`;
  const mealQualityErrorId = `${mealQualityId}-error`;
  const startErrorId = `${startTimeId}-error`;
  const endErrorId = `${endTimeId}-error`;
  const napQualityErrorId = `${napQualityId}-error`;
  const activityNameErrorId = `${activityNameId}-error`;
  const incidentTypeErrorId = `${incidentTypeId}-error`;
  const incidentSeverityErrorId = `${incidentSeverityId}-error`;
  const medicationNameErrorId = `${medicationNameId}-error`;
  const medicationDoseErrorId = `${medicationDoseId}-error`;
  const medicationTimeErrorId = `${medicationTimeId}-error`;
  const medicationAuthorizationErrorId = `${medicationAuthorizationId}-error`;
  const noteErrorId = `${noteId}-error`;

  return (
    <section aria-labelledby={`event-form-heading-${childId}`}>
      <Card className="items-start gap-4 p-5 sm:p-6">
        <h2 className="font-heading text-lg font-semibold" id={`event-form-heading-${childId}`}>Ajouter un événement</h2>

        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          <div className="grid min-w-0 gap-2">
            <Label htmlFor={typeId}>Type</Label>
            <select
              aria-describedby={displayedErrors?.type ? typeErrorId : undefined}
              aria-invalid={Boolean(displayedErrors?.type)}
              aria-required="true"
              className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:text-sm"
              id={typeId}
              name="type"
              onChange={(event) => updateType(event.target.value)}
              value={values.type}
            >
              <option value="repas">Repas</option>
              <option value="sieste">Sieste</option>
              <option value="activite">Activité</option>
              <option value="incident">Incident</option>
              <option value="medicament">Médicament</option>
            </select>
            {displayedErrors?.type ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" id={typeErrorId} role="alert">{displayedErrors.type}</p> : null}
          </div>

          {values.type === "repas" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid min-w-0 gap-2">
                <Label htmlFor={momentId}>Moment</Label>
                <select
                  aria-describedby={displayedErrors?.moment ? momentErrorId : undefined}
                  aria-invalid={Boolean(displayedErrors?.moment)}
                  aria-required="true"
                  className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:text-sm"
                  id={momentId}
                  name="moment"
                  onChange={(event) => updateValue("moment", event.target.value)}
                  value={values.moment}
                >
                  <option value="">Choisir un moment</option>
                  <option value="matin">Matin</option>
                  <option value="midi">Midi</option>
                  <option value="gouter">Goûter</option>
                </select>
                {displayedErrors?.moment ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" id={momentErrorId} role="alert">{displayedErrors.moment}</p> : null}
              </div>

              <div className="grid min-w-0 gap-2">
                <Label htmlFor={mealQualityId}>Qualité</Label>
                <select
                  aria-describedby={displayedErrors?.qualite ? mealQualityErrorId : undefined}
                  aria-invalid={Boolean(displayedErrors?.qualite)}
                  aria-required="true"
                  className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:text-sm"
                  id={mealQualityId}
                  name="qualite"
                  onChange={(event) => updateValue("qualite", event.target.value)}
                  value={values.qualite}
                >
                  <option value="">Choisir une qualité</option>
                  <option value="tout">A tout mangé</option>
                  <option value="moitie">A mangé la moitié</option>
                  <option value="peu">A peu mangé</option>
                  <option value="rien">N&apos;a rien mangé</option>
                </select>
                {displayedErrors?.qualite ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" id={mealQualityErrorId} role="alert">{displayedErrors.qualite}</p> : null}
              </div>
            </div>
          ) : values.type === "sieste" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid min-w-0 gap-2">
                <Label htmlFor={startTimeId}>Heure de début</Label>
                <input
                  aria-describedby={displayedErrors?.debut ? startErrorId : undefined}
                  aria-invalid={Boolean(displayedErrors?.debut)}
                  aria-required="true"
                  className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:text-sm"
                  id={startTimeId}
                  name="debut"
                  onChange={(event) => updateValue("debut", event.target.value)}
                  step={60}
                  type="time"
                  value={values.debut}
                />
                {displayedErrors?.debut ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" id={startErrorId} role="alert">{displayedErrors.debut}</p> : null}
              </div>

              <div className="grid min-w-0 gap-2">
                <Label htmlFor={endTimeId}>Heure de fin</Label>
                <input
                  aria-describedby={displayedErrors?.fin ? endErrorId : undefined}
                  aria-invalid={Boolean(displayedErrors?.fin)}
                  aria-required="true"
                  className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:text-sm"
                  id={endTimeId}
                  name="fin"
                  onChange={(event) => updateValue("fin", event.target.value)}
                  step={60}
                  type="time"
                  value={values.fin}
                />
                {displayedErrors?.fin ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" id={endErrorId} role="alert">{displayedErrors.fin}</p> : null}
              </div>

              <div className="grid min-w-0 gap-2 sm:col-span-2">
                <Label htmlFor={napQualityId}>Qualité</Label>
                <select
                  aria-describedby={displayedErrors?.qualite ? napQualityErrorId : undefined}
                  aria-invalid={Boolean(displayedErrors?.qualite)}
                  aria-required="true"
                  className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:text-sm"
                  id={napQualityId}
                  name="qualite"
                  onChange={(event) => updateValue("qualite", event.target.value)}
                  value={values.qualite}
                >
                  <option value="">Choisir une qualité</option>
                  <option value="calme">Calme</option>
                  <option value="agitee">Agitée</option>
                  <option value="reveil_precoce">Réveil précoce</option>
                </select>
                {displayedErrors?.qualite ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" id={napQualityErrorId} role="alert">{displayedErrors.qualite}</p> : null}
              </div>
            </div>
          ) : values.type === "activite" ? (
            <div className="grid gap-4">
              <div className="grid min-w-0 gap-2">
                <Label htmlFor={activityNameId}>Nom de l&apos;activité</Label>
                <input
                  aria-describedby={displayedErrors?.nom ? activityNameErrorId : undefined}
                  aria-invalid={Boolean(displayedErrors?.nom)}
                  aria-required="true"
                  className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:text-sm"
                  id={activityNameId}
                  name="nom"
                  onChange={(event) => updateValue("nom", event.target.value)}
                  value={values.nom}
                />
                {displayedErrors?.nom ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" id={activityNameErrorId} role="alert">{displayedErrors.nom}</p> : null}
              </div>
            </div>
          ) : values.type === "incident" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid min-w-0 gap-2">
                <Label htmlFor={incidentTypeId}>Type d&apos;incident</Label>
                <select
                  aria-describedby={displayedErrors?.incident_type ? incidentTypeErrorId : undefined}
                  aria-invalid={Boolean(displayedErrors?.incident_type)}
                  aria-required="true"
                  className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:text-sm"
                  id={incidentTypeId}
                  name="incident_type"
                  onChange={(event) => updateValue("incident_type", event.target.value)}
                  value={values.incident_type}
                >
                  <option value="">Choisir un type d’incident</option>
                  <option value="chute">Chute</option>
                  <option value="morsure">Morsure</option>
                  <option value="fievre">Fièvre</option>
                  <option value="autre">Autre</option>
                </select>
                {displayedErrors?.incident_type ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" id={incidentTypeErrorId} role="alert">{displayedErrors.incident_type}</p> : null}
              </div>

              <div className="grid min-w-0 gap-2">
                <Label htmlFor={incidentSeverityId}>Gravité</Label>
                <select
                  aria-describedby={displayedErrors?.gravite ? incidentSeverityErrorId : undefined}
                  aria-invalid={Boolean(displayedErrors?.gravite)}
                  aria-required="true"
                  className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:text-sm"
                  id={incidentSeverityId}
                  name="gravite"
                  onChange={(event) => updateValue("gravite", event.target.value)}
                  value={values.gravite}
                >
                  <option value="">Choisir une gravité</option>
                  <option value="leger">Léger</option>
                  <option value="modere">Modéré</option>
                  <option value="urgent">Urgent</option>
                </select>
                {displayedErrors?.gravite ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" id={incidentSeverityErrorId} role="alert">{displayedErrors.gravite}</p> : null}
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid min-w-0 gap-2">
                <Label htmlFor={medicationNameId}>Nom du médicament</Label>
                <input
                  aria-describedby={displayedErrors?.nom ? medicationNameErrorId : undefined}
                  aria-invalid={Boolean(displayedErrors?.nom)}
                  aria-required="true"
                  className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:text-sm"
                  id={medicationNameId}
                  name="nom"
                  onChange={(event) => updateValue("nom", event.target.value)}
                  value={values.nom}
                />
                {displayedErrors?.nom ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" id={medicationNameErrorId} role="alert">{displayedErrors.nom}</p> : null}
              </div>

              <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                <div className="grid min-w-0 gap-2">
                  <Label htmlFor={medicationDoseId}>Dose</Label>
                  <input
                    aria-describedby={displayedErrors?.dose ? medicationDoseErrorId : undefined}
                    aria-invalid={Boolean(displayedErrors?.dose)}
                    aria-required="true"
                    className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:text-sm"
                    id={medicationDoseId}
                    name="dose"
                    onChange={(event) => updateValue("dose", event.target.value)}
                    value={values.dose}
                  />
                  {displayedErrors?.dose ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" id={medicationDoseErrorId} role="alert">{displayedErrors.dose}</p> : null}
                </div>

                <div className="grid min-w-0 gap-2">
                  <Label htmlFor={medicationTimeId}>Heure</Label>
                  <input
                    aria-describedby={displayedErrors?.heure ? medicationTimeErrorId : undefined}
                    aria-invalid={Boolean(displayedErrors?.heure)}
                    aria-required="true"
                    className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:text-sm"
                    id={medicationTimeId}
                    name="heure"
                    onChange={(event) => updateValue("heure", event.target.value)}
                    step={60}
                    type="time"
                    value={values.heure}
                  />
                  {displayedErrors?.heure ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" id={medicationTimeErrorId} role="alert">{displayedErrors.heure}</p> : null}
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex min-h-11 items-center gap-3">
                  <input
                    aria-describedby={displayedErrors?.autorisation_confirmee ? medicationAuthorizationErrorId : undefined}
                    aria-invalid={Boolean(displayedErrors?.autorisation_confirmee)}
                    className="size-5 shrink-0 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    id={medicationAuthorizationId}
                    name="autorisation_confirmee"
                    onChange={(event) => updateValue("autorisation_confirmee", event.target.checked ? "true" : "")}
                    type="checkbox"
                    value="true"
                    checked={values.autorisation_confirmee === "true"}
                  />
                  <Label htmlFor={medicationAuthorizationId}>Autorisation parentale confirmée</Label>
                </div>
                {displayedErrors?.autorisation_confirmee ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" id={medicationAuthorizationErrorId} role="alert">{displayedErrors.autorisation_confirmee}</p> : null}
                {values.autorisation_confirmee !== "true" ? <p className="text-sm text-muted-foreground" id={medicationAuthorizationMessageId}>Cochez l’autorisation parentale pour pouvoir enregistrer.</p> : null}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor={noteId}>Note (facultative)</Label>
            <textarea
              aria-describedby={displayedErrors?.note ? noteErrorId : undefined}
              aria-invalid={Boolean(displayedErrors?.note)}
              className="min-h-24 w-full min-w-0 resize-y rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:text-sm"
              id={noteId}
              maxLength={500}
              name="note"
              onChange={(event) => updateValue("note", event.target.value)}
              value={values.note}
            />
            {displayedErrors?.note ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" id={noteErrorId} role="alert">{displayedErrors.note}</p> : null}
          </div>

          {displayedFormError ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" role="alert">{displayedFormError}</p> : null}
          {state.success ? <p aria-live="polite" className="text-sm font-medium text-foreground" role="status">{state.success}</p> : null}

          <Button
            aria-describedby={values.type === "medicament" && values.autorisation_confirmee !== "true" ? medicationAuthorizationMessageId : undefined}
            className="min-h-11 w-full sm:w-auto"
            disabled={pending || (values.type === "medicament" && values.autorisation_confirmee !== "true")}
            type="submit"
          >
            {pending ? "Enregistrement…" : values.type === "repas" ? "Enregistrer le repas" : values.type === "sieste" ? "Enregistrer la sieste" : values.type === "activite" ? "Enregistrer l’activité" : values.type === "incident" ? "Enregistrer l’incident" : "Enregistrer le médicament"}
          </Button>
        </form>
      </Card>
    </section>
  );
}
