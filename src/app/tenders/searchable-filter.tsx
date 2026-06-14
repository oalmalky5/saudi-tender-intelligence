"use client";

import { useId, useMemo, useState } from "react";

import { pick, type Locale } from "@/lib/i18n/locale";
import {
  uniqueSearchableFilterOptions,
  type SearchableFilterOption,
} from "@/lib/tenders/searchable-filter-options";

export function SearchableFilter({
  label,
  name,
  defaultValue,
  options,
  allLabel,
  locale,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: SearchableFilterOption[];
  allLabel: string;
  locale: Locale;
}) {
  const listId = useId();
  const inputId = useId();
  const uniqueOptions = useMemo(
    () => uniqueSearchableFilterOptions(options),
    [options],
  );
  const initialOption = uniqueOptions.find(
    (option) => option.value === defaultValue,
  );
  const [query, setQuery] = useState(initialOption?.label ?? "");
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matchingOptions = useMemo(
    () =>
      uniqueOptions
        .filter(
          (option) =>
            !normalizedQuery ||
            option.label.toLocaleLowerCase().includes(normalizedQuery) ||
            option.value.toLocaleLowerCase().includes(normalizedQuery),
        )
        .slice(0, 50),
    [normalizedQuery, uniqueOptions],
  );

  function updateQuery(value: string): void {
    setQuery(value);
    const exact = uniqueOptions.find(
      (option) =>
        option.label.toLocaleLowerCase() === value.trim().toLocaleLowerCase() ||
        option.value.toLocaleLowerCase() === value.trim().toLocaleLowerCase(),
    );
    setSelectedValue(exact?.value ?? "");
    setOpen(true);
  }

  function choose(option: SearchableFilterOption): void {
    setQuery(option.label);
    setSelectedValue(option.value);
    setOpen(false);
  }

  return (
    <div className="relative grid gap-1.5 text-sm font-medium">
      <label htmlFor={inputId}>{label}</label>
      <input type="hidden" name={name} value={selectedValue} />
      <div className="relative">
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
            }
            if (event.key === "Enter" && open) {
              event.preventDefault();
              const firstMatch = matchingOptions[0];
              if (firstMatch) {
                choose(firstMatch);
              }
            }
          }}
          placeholder={allLabel}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 pe-10 font-normal outline-none focus:border-[var(--accent)]"
        />
        {query && (
          <button
            type="button"
            aria-label={pick(locale, `Clear ${label}`, `مسح ${label}`)}
            onClick={() => {
              setQuery("");
              setSelectedValue("");
              setOpen(true);
            }}
            className="absolute inset-y-0 end-2 my-auto h-7 w-7 rounded-lg text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--accent)]"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-[var(--border)] bg-white p-1 shadow-[0_18px_45px_rgba(20,55,43,0.15)]"
        >
          <button
            type="button"
            role="option"
            aria-selected={!selectedValue}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setQuery("");
              setSelectedValue("");
              setOpen(false);
            }}
            className="w-full rounded-lg px-3 py-2 text-start text-sm text-[var(--muted)] hover:bg-[var(--background)]"
          >
            {allLabel}
          </button>
          {matchingOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={selectedValue === option.value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
              className={`w-full rounded-lg px-3 py-2 text-start text-sm font-normal hover:bg-[var(--accent-soft)] ${
                selectedValue === option.value
                  ? "bg-[var(--accent-soft)] text-[var(--accent-deep)]"
                  : ""
              }`}
            >
              <span className="block">{option.label}</span>
              {option.label !== option.value && (
                <span className="mt-0.5 block text-xs text-[var(--muted)]">
                  {option.value}
                </span>
              )}
            </button>
          ))}
          {matchingOptions.length === 0 && (
            <p className="px-3 py-4 text-sm text-[var(--muted)]">
              {pick(locale, "No matching options.", "لا توجد خيارات مطابقة.")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
