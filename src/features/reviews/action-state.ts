export type ReviewField = "name" | "email" | "rating" | "comment" | "consent";
export interface ReviewState {
  status: "idle" | "error" | "preview";
  message: string;
  errors: Partial<Record<ReviewField, string>>;
  values?: Record<ReviewField, string>;
  preview?: { author: string; rating: number; text: string };
}
export const initialReviewState: ReviewState = {
  status: "idle",
  message: "",
  errors: {},
};
