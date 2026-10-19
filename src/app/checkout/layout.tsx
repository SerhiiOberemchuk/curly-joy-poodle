import { EmotionRegistry } from "@/components/layout/emotion-registry";

/** react-select (the Nova Poshta lookups) styles itself with Emotion; only checkout needs it. */
export default function CheckoutLayout({ children }: LayoutProps<"/checkout">) {
  return <EmotionRegistry>{children}</EmotionRegistry>;
}
