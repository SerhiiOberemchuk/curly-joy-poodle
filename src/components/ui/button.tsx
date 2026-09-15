import type { ButtonHTMLAttributes } from "react";

import styles from "./button.module.css";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
}

/**
 * Shared button styling. Exported separately so links (`next/link`) can wear the
 * same skin without being rendered as a `<button>`.
 */
export function buttonStyles({
  variant = "primary",
  size = "md",
  block = false,
  className,
}: ButtonStyleOptions = {}): string {
  return [styles.base, styles[variant], styles[size], block ? styles.block : null, className]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleOptions;

export function Button({ variant, size, block, className, ...props }: ButtonProps) {
  return <button {...props} className={buttonStyles({ variant, size, block, className })} />;
}
