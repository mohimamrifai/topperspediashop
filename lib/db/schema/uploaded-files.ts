import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { deposits } from "./deposits";
import { products } from "./products";
import { profiles } from "./profiles";
import { withdrawals } from "./withdrawals";

/**
 * Metadata file upload lokal.
 *
 * Binary file disimpan di disk (`src/uploaded/...`), sedangkan tabel ini
 * menyimpan referensi dan metadata untuk kontrol akses, cleanup, dan lookup.
 *
 * `category` dipakai sebagai namespace logical dan penentu folder fisik:
 * - products
 * - deposit-proof
 * - withdrawal-proof
 * - profile-image
 * - misc
 *
 * `visibility` disiapkan untuk kebutuhan future-proof. Saat ini mayoritas
 * file yang sensitif akan memakai nilai `private`.
 */
export const uploadedFiles = pgTable(
  "uploaded_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    disk: text("disk").notNull().default("local"),
    category: text("category").notNull(),
    originalName: text("original_name").notNull(),
    storedName: text("stored_name").notNull(),
    relativePath: text("relative_path").notNull().unique(),
    inlineDataBase64: text("inline_data_base64"),
    mimeType: text("mime_type").notNull(),
    extension: text("extension"),
    sizeBytes: integer("size_bytes").notNull(),
    checksumSha256: text("checksum_sha256"),
    visibility: text("visibility").notNull().default("private"),
    ownerUserId: uuid("owner_user_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdBy: uuid("created_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    productId: bigint("product_id", { mode: "number" }).references(
      () => products.id,
      { onDelete: "set null" },
    ),
    depositId: integer("deposit_id").references(() => deposits.id, {
      onDelete: "set null",
    }),
    withdrawalId: integer("withdrawal_id").references(() => withdrawals.id, {
      onDelete: "set null",
    }),
    profileId: uuid("profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index("uploaded_files_category_idx").on(table.category),
    index("uploaded_files_owner_user_id_idx").on(table.ownerUserId),
    index("uploaded_files_created_by_idx").on(table.createdBy),
    index("uploaded_files_product_id_idx").on(table.productId),
    index("uploaded_files_deposit_id_idx").on(table.depositId),
    index("uploaded_files_withdrawal_id_idx").on(table.withdrawalId),
    index("uploaded_files_profile_id_idx").on(table.profileId),
    index("uploaded_files_visibility_idx").on(table.visibility),
  ],
);
