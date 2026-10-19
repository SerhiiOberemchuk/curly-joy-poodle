"use client";

import { catchError } from "next/error";

// The server log already explains a failed CRM read; a broken part just disappears.
export const PartBoundary = catchError(() => null);
