/** Same query for catalog filtering and its search presentation. */
export function readSearchQuery(value: string | string[] | undefined): string | undefined {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 100) || undefined;
}
