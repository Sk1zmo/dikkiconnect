import clsx, { type ClassValue } from 'clsx'

/** Class-name joiner. Thin alias so every component imports the same helper. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
