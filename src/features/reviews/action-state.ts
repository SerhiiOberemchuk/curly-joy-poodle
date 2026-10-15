export type ReviewField = "name" | "email" | "rating" | "comment" | "consent";
export interface ReviewState {
  status: "idle" | "error" | "submitted";
  message: string;
  errors: Partial<Record<ReviewField, string>>;
  values?: Record<ReviewField, string>;
}
export const initialReviewState: ReviewState = {
  status: "idle",
  message: "",
  errors: {},
};
