export const collapseSpaces = (value: string): string => value.replace(/\u00A0/g, " ").replace(/ {2,}/g, " ");
