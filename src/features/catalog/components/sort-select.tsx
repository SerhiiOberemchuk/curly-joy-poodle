"use client";

import { sortOptions, type SortOption } from "../sorting";
import { ChoiceSelect } from "@/components/ui/choice-select";

export function SortSelect({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  return (
    <ChoiceSelect
      label="Сортування"
      options={sortOptions}
      value={value}
      onChange={onChange}
      inline
    />
  );
}
