"use client";

import { useId } from "react";
import Select, { type Props } from "react-select";
import { useController, useFormContext } from "react-hook-form";
import type { CheckoutFormValues } from "../validation";
import styles from "./checkout-form.module.css";

type LookupOption = { ref: string; label: string };

export function LookupSelect<T extends LookupOption>({
  name,
  label,
  hint,
  lookupError,
  retry,
  ...props
}: Props<T, false> & {
  name: "cityRef" | "branchRef" | "streetRef";
  label: string;
  hint?: string;
  lookupError?: Error;
  retry: () => Promise<unknown>;
}) {
  const id = useId();
  const { control } = useFormContext<CheckoutFormValues>();
  const {
    field: { ref, onBlur, onChange },
    fieldState,
  } = useController({ name, control });
  const error = fieldState.error?.message;
  // react-select owns aria-describedby (its placeholder and live region) and
  // drops ours, so the error and the hint join the field's accessible name.
  const labelledBy = [
    `${id}-label`,
    error ? `${id}-error` : null,
    hint ? `${id}-hint` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.field}>
      <label id={`${id}-label`} className={styles.label} htmlFor={id}>
        {label}
      </label>
      <Select<T, false>
        {...props}
        ref={ref}
        onBlur={onBlur}
        inputId={id}
        instanceId={id}
        getOptionValue={(option) => option.ref}
        getOptionLabel={(option) => option.label}
        onChange={(option, meta) => {
          props.onChange?.(option, meta);
          onChange(option?.ref ?? "");
        }}
        isSearchable
        isClearable
        menuPlacement="auto"
        unstyled
        styles={{
          singleValue: (base) => ({ ...base, whiteSpace: "normal" }),
          menu: (base) => ({ ...base, zIndex: 2 }),
        }}
        aria-labelledby={labelledBy}
        aria-invalid={!!error}
        aria-errormessage={error ? `${id}-error` : undefined}
        // Shown only when its delivery method needs it, and then mandatory.
        required
        loadingMessage={() => "Завантажуємо…"}
        classNames={{
          container: () => styles.select,
          control: ({ isFocused }) =>
            `${styles.selectControl} ${isFocused ? styles.selectFocused : ""} ${error ? styles.selectInvalid : ""}`,
          valueContainer: () => styles.selectValue,
          input: () => styles.selectInput,
          placeholder: () => styles.selectPlaceholder,
          singleValue: () => styles.selectSingleValue,
          indicatorsContainer: () => styles.selectIndicators,
          menu: () => styles.selectMenu,
          option: ({ isFocused, isSelected }) =>
            `${styles.selectOption} ${isFocused || isSelected ? styles.selectOptionActive : ""}`,
          noOptionsMessage: () => styles.selectMessage,
          loadingMessage: () => styles.selectMessage,
        }}
      />
      <div>
        {error ? (
          <p id={`${id}-error`} className={styles.error}>
            {error}
          </p>
        ) : null}
        {hint ? (
          <p id={`${id}-hint`} className={styles.optionHint}>
            {hint}
          </p>
        ) : null}
        {lookupError ? (
          <div role="alert">
            <p className={styles.error}>{lookupError.message}</p>
            <button
              type="button"
              className={styles.lookupRetry}
              disabled={props.isDisabled}
              onClick={() => {
                void retry();
              }}
            >
              Спробувати ще раз
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
