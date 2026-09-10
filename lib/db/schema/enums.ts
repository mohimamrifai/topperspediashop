import { pgEnum } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", [
  "super_admin",
  "admin_leader",
  "admin_staff",
  "member",
]);

export const userLevel = pgEnum("user_level", [
  "classic",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "premier",
]);

export const userStatus = pgEnum("user_status", ["online", "offline", "banned"]);

export const taskStatus = pgEnum("task_status", [
  "menunggu",
  "dipilih",
  "dikerjakan",
  "selesai",
  "dibatalkan",
]);

export const depositStatus = pgEnum("deposit_status", [
  "pending",
  "approved",
  "rejected",
]);

export const withdrawalStatus = pgEnum("withdrawal_status", [
  "pending",
  "processing",
  "completed",
  "rejected",
]);

export const channelType = pgEnum("channel_type", ["whatsapp", "telegram"]);
