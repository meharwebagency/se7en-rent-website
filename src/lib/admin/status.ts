import type { Database } from "@/lib/supabase/database.types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];
type CarStatus = Database["public"]["Enums"]["car_status"];

/** Badge variants per booking lifecycle stage. */
export function bookingStatusVariant(status: BookingStatus): "outline" | "warning" | "success" | "default" | "destructive" {
  switch (status) {
    case "pending":
      return "warning";
    case "confirmed":
      return "default";
    case "active":
      return "success";
    case "completed":
      return "outline";
    case "cancelled":
      return "destructive";
  }
}

export function carStatusVariant(status: CarStatus): "success" | "warning" | "destructive" {
  switch (status) {
    case "available":
      return "success";
    case "booked":
      return "warning";
  }
}