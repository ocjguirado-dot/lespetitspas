"use client";

import { useMemo, useState } from "react";
import { ChildCard, sectionLabels, type ChildSummary } from "@/components/staff/child-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SectionFilter = "all" | ChildSummary["section"];

const sectionOptions: { value: SectionFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "bebes", label: sectionLabels.bebes },
  { value: "moyens", label: sectionLabels.moyens },
  { value: "grands", label: sectionLabels.grands },
];

function normalize(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr-FR");
}

export function ChildrenBrowser({ items }: { items: ChildSummary[] }) {
  const [search, setSearch] = useState("");
  const [section, setSection] = useState<SectionFilter>("all");
  const normalizedSearch = normalize(search);

  const visibleChildren = useMemo(
    () =>
      items.filter((child) => {
        const matchesSection = section === "all" || child.section === section;
        const fullName = normalize(`${child.first_name} ${child.last_name}`);
        return matchesSection && (!normalizedSearch || fullName.includes(normalizedSearch));
      }),
    [items, normalizedSearch, section],
  );

  const hasFilters = search.trim().length > 0 || section !== "all";

  function clearFilters() {
    setSearch("");
    setSection("all");
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4 md:flex md:items-end md:justify-between md:gap-6 md:space-y-0">
        <div className="w-full space-y-2 md:max-w-sm">
          <label className="text-sm font-medium" htmlFor="child-search">
            Rechercher un enfant
          </label>
          <Input
            autoComplete="off"
            className="min-h-11"
            id="child-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Prénom ou nom"
            type="search"
            value={search}
          />
        </div>
        <div className="space-y-2">
          <span className="block text-sm font-medium">Filtrer par section</span>
          <div aria-label="Filtrer par section" className="flex flex-wrap gap-2" role="group">
            {sectionOptions.map((option) => (
              <Button
                aria-pressed={section === option.value}
                className="min-h-11 min-w-11"
                key={option.value}
                onClick={() => setSection(option.value)}
                type="button"
                variant={section === option.value ? "default" : "outline"}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="text-sm text-muted-foreground" role="status">
        {visibleChildren.length} {visibleChildren.length === 1 ? "enfant affiché" : "enfants affichés"} sur {items.length}
      </p>

      {visibleChildren.length === 0 ? (
        <div className="space-y-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <p>Aucun enfant ne correspond à votre recherche.</p>
          {hasFilters ? (
            <Button className="min-h-11" onClick={clearFilters} type="button" variant="outline">
              Effacer les filtres
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleChildren.map((child) => (
            <li key={child.id}>
              <ChildCard child={child} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
