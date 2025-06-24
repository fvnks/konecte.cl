import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { PropertyVisitStatus } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getStatusVariantForUser = (status: PropertyVisitStatus): {
  variant: "default" | "secondary" | "destructive" | "outline";
  labelClass?: string;
} => {
  switch (status) {
    case 'PENDING':
      return { variant: "secondary", labelClass: "text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900" };
    case 'CONFIRMED':
      return { variant: "secondary", labelClass: "text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-900" };
    case 'CANCELLED_BY_VISITOR':
    case 'CANCELLED_BY_OWNER':
    case 'CANCELLED_BY_ADMIN':
      return { variant: "destructive" };
    case 'COMPLETED':
      return { variant: "default" };
    case 'REJECTED':
      return { variant: "destructive" };
    default:
      return { variant: "outline" };
  }
};
