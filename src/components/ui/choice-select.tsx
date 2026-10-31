"use client";

import { useId } from "react";
import Select from "react-select";

import styles from "./choice-select.module.css";

interface ChoiceOption<Value extends string> {
  value: Value;
  label: string;
}

/** react-select owns keyboard navigation, dismissal and the accessible listbox. */
export function ChoiceSelect<Value extends string>({
  label,
  options,
  value,
  defaultValue,
  onChange,
  name,
  disabled,
  error,
  inline = false,
}: {
  label: string;
  options: readonly ChoiceOption<Value>[];
  value?: Value;
  defaultValue?: Value;
  onChange?: (value: Value) => void;
  name?: string;
  disabled?: boolean;
  error?: string;
  inline?: boolean;
}) {
  const id = useId();
  return (
    <div className={inline ? styles.inline : styles.field}>
      <label id={`${id}-label`} htmlFor={id} className={styles.label}>
        {label}
      </label>
      <Select<ChoiceOption<Value>, false>
        inputId={id}
        instanceId={id}
        name={name}
        options={options}
        value={
          value === undefined
            ? undefined
            : options.find((option) => option.value === value) ?? null
        }
        defaultValue={
          options.find((option) => option.value === defaultValue) ?? null
        }
        onChange={(option) => {
          if (option) onChange?.(option.value);
        }}
        isDisabled={disabled}
        isSearchable={false}
        menuPlacement="auto"
        maxMenuHeight={240}
        unstyled
        aria-labelledby={`${id}-label${error ? ` ${id}-error` : ""}`}
        aria-invalid={!!error}
        aria-errormessage={error ? `${id}-error` : undefined}
        classNames={{
          container: () => styles.select,
          control: ({ isFocused, isDisabled }) =>
            `${styles.control} ${isFocused ? styles.focused : ""} ${isDisabled ? styles.disabled : ""} ${error ? styles.invalid : ""}`,
          valueContainer: () => styles.value,
          indicatorsContainer: () => styles.indicators,
          indicatorSeparator: () => styles.separator,
          menu: () => styles.menu,
          menuList: () => styles.menuList,
          option: ({ isFocused, isSelected }) =>
            `${styles.option} ${isFocused ? styles.optionFocused : ""} ${isSelected ? styles.optionSelected : ""}`,
        }}
      />
      {error ? (
        <span id={`${id}-error`} className={styles.error}>{error}</span>
      ) : null}
    </div>
  );
}
