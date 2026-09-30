import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanFileNameToPaperName(fileName: string): string {
  if (!fileName) return "Untitled Paper";
  return fileName
    .replace(/\.[^/.]+$/, "") // strip extension
    .replace(/[_-]+/g, " ") // replace underscores/dashes with spaces
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSearchText(value: string | null | undefined): string {
  if (!value) return "";
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getTimeGreeting(name?: string): string {
  const hour = new Date().getHours();
  const student = name ? `, ${name}` : "";
  if (hour >= 5 && hour < 12) return `Good Morning${student}! ☀️`;
  if (hour >= 12 && hour < 17) return `Good AfterNoon${student}! 🌤️`;
  if (hour >= 17 && hour < 21) return `Good Evening${student}! 🌇`;
  return `Hello${student}, Studying Late? 🌙`;
}
