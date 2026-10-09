"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { createFilter } from "react-select";
import useSWR from "swr";
import { useDebounce } from "use-debounce";
import {
  listWarehousesAction,
  searchCitiesAction,
  searchStreetsAction,
} from "../nova-poshta.actions";
import type { NpCity, NpStreet, NpWarehouse } from "../crm/types";
import type { DeliveryMethod } from "../types";
import type { CheckoutFormValues } from "../validation";
import { LookupSelect } from "./lookup-select";
import styles from "./checkout-form.module.css";

type LookupResult<T> = { ok: true; data: T[] } | { ok: false; error: string };
async function fetchLookup<T>(
  request: () => Promise<LookupResult<T>>,
): Promise<T[]> {
  const result = await request();
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
const LOOKUP_OPTIONS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  errorRetryCount: 0,
};
const filterWarehouse = createFilter<NpWarehouse>();
export const DESTINATION_FIELDS = [
  "destination",
  "branchRef",
  "streetRef",
  "streetSearch",
  "building",
  "flat",
] as const;

export function NovaPoshtaFields({
  method,
  disabled,
}: {
  method: DeliveryMethod;
  disabled: boolean;
}) {
  const { setValue, clearErrors } = useFormContext<CheckoutFormValues>();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<NpCity | null>(null);
  const [citySearch] = useDebounce(query.trim(), 350);
  const searching = query.trim().length >= 2;
  const waiting = searching && query.trim() !== citySearch;
  const cities = useSWR(
    searching && !waiting ? { kind: "cities", query: citySearch } : null,
    ({ query }) => fetchLookup(() => searchCitiesAction(query)),
    LOOKUP_OPTIONS,
  );

  return (
    <div className={styles.addressFields}>
      <LookupSelect<NpCity>
        name="cityRef"
        label="Населений пункт"
        placeholder="Введіть щонайменше 2 літери"
        hint="Почніть вводити назву та оберіть населений пункт зі списку."
        value={city}
        inputValue={query}
        options={cities.data ?? []}
        filterOption={null}
        isDisabled={disabled}
        isLoading={waiting || cities.isLoading}
        lookupError={cities.error}
        retry={cities.mutate}
        noOptionsMessage={() =>
          cities.error
            ? "Не вдалося завантажити населені пункти"
            : !searching
              ? "Введіть щонайменше 2 літери"
              : waiting || cities.isLoading
                ? "Завантажуємо…"
                : "Нічого не знайдено. Уточніть назву."
        }
        onInputChange={(value, meta) => {
          if (meta.action === "input-change") setQuery(value.slice(0, 120));
          else if (meta.action === "menu-close") setQuery("");
        }}
        onChange={(option) => {
          setCity(option);
          setValue("city", option?.label ?? "");
          setValue("citySearch", option ? citySearch : "");
          for (const name of DESTINATION_FIELDS) setValue(name, "");
          clearErrors(["city", "citySearch", ...DESTINATION_FIELDS]);
          setQuery("");
        }}
      />
      {city ? (
        <DestinationFields
          key={`${city.ref}-${method}`}
          cityRef={city.ref}
          method={method}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}

function DestinationFields({
  cityRef,
  method,
  disabled,
}: {
  cityRef: string;
  method: DeliveryMethod;
  disabled: boolean;
}) {
  return method === "np-branch" ? (
    <WarehouseField cityRef={cityRef} disabled={disabled} />
  ) : (
    <StreetField cityRef={cityRef} disabled={disabled} />
  );
}

function WarehouseField({
  cityRef,
  disabled,
}: {
  cityRef: string;
  disabled: boolean;
}) {
  const { setValue, clearErrors } = useFormContext<CheckoutFormValues>();
  const [warehouse, setWarehouse] = useState<NpWarehouse | null>(null);
  const warehouses = useSWR(
    { kind: "warehouses", cityRef },
    ({ cityRef }) => fetchLookup(() => listWarehousesAction(cityRef)),
    LOOKUP_OPTIONS,
  );

  return (
    <LookupSelect<NpWarehouse>
      name="branchRef"
      label="Пункт отримання"
      placeholder="Оберіть відділення або поштомат"
      hint="Введіть номер відділення чи поштомату або частину адреси."
      value={warehouse}
      options={warehouses.data ?? []}
      filterOption={(option, input) =>
        /^\d+$/.test(input.trim())
          ? option.data.number === input.trim()
          : filterWarehouse(option, input)
      }
      isDisabled={disabled || warehouses.isLoading}
      isLoading={warehouses.isLoading}
      lookupError={warehouses.error}
      retry={warehouses.mutate}
      noOptionsMessage={() =>
        warehouses.error
          ? "Не вдалося завантажити пункти отримання"
          : warehouses.data?.length
            ? "Нічого не знайдено. Перевірте номер або адресу."
            : "У цьому населеному пункті немає доступних пунктів отримання."
      }
      onChange={(option) => {
        setWarehouse(option);
        setValue("destination", option?.label ?? "");
        clearErrors("destination");
      }}
    />
  );
}

function StreetField({
  cityRef,
  disabled,
}: {
  cityRef: string;
  disabled: boolean;
}) {
  const { setValue, clearErrors } = useFormContext<CheckoutFormValues>();
  const [query, setQuery] = useState("");
  const [street, setStreet] = useState<NpStreet | null>(null);
  const [streetSearch] = useDebounce(query.trim(), 350);
  const searching = query.trim().length >= 2;
  const waiting = searching && query.trim() !== streetSearch;
  const streets = useSWR(
    searching && !waiting
      ? { kind: "streets", cityRef, query: streetSearch }
      : null,
    ({ cityRef, query }) =>
      fetchLookup(() => searchStreetsAction(cityRef, query)),
    LOOKUP_OPTIONS,
  );

  return (
    <LookupSelect<NpStreet>
      name="streetRef"
      label="Вулиця"
      placeholder="Введіть щонайменше 2 літери"
      value={street}
      inputValue={query}
      options={streets.data ?? []}
      filterOption={null}
      isDisabled={disabled}
      isLoading={waiting || streets.isLoading}
      lookupError={streets.error}
      retry={streets.mutate}
      noOptionsMessage={() =>
        streets.error
          ? "Не вдалося завантажити вулиці"
          : !searching
            ? "Введіть щонайменше 2 літери"
            : waiting || streets.isLoading
              ? "Завантажуємо…"
              : "Нічого не знайдено. Уточніть назву вулиці."
      }
      onInputChange={(value, meta) => {
        if (meta.action === "input-change") setQuery(value.slice(0, 120));
        else if (meta.action === "menu-close") setQuery("");
      }}
      onChange={(option) => {
        setStreet(option);
        setValue("streetSearch", option ? streetSearch : "");
        setValue("destination", option?.label ?? "");
        clearErrors(["streetSearch", "destination"]);
        setQuery("");
      }}
    />
  );
}
