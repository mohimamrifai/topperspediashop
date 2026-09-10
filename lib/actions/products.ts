"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { auditLogs, products } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import {
  attachUploadedFileToProduct,
  deleteUploadedFileByUrl,
  isAllowedImageMime,
  saveUploadedFile,
} from "@/lib/storage/local-storage";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama produk minimal 2 karakter.")
    .max(200, "Nama produk maksimal 200 karakter."),
  price: z
    .number({ message: "Harga wajib diisi." })
    .min(0, "Harga tidak boleh negatif.")
    .max(1_000_000_000, "Harga terlalu besar."),
  isActive: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export type ProductState = {
  success?: boolean;
  product?: {
    id: number;
    name: string;
    imageUrl: string | null;
    price: string;
    isActive: boolean;
  };
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
};

async function processImageUpload(
  file: File,
  oldPath: string | null,
): Promise<
  | { ok: true; publicUrl: string; path: string }
  | { ok: false; error: string }
> {
  if (file.size > MAX_SIZE) {
    return { ok: false, error: "Ukuran file maksimal 2MB." };
  }
  if (!isAllowedImageMime(file.type)) {
    return { ok: false, error: "Format harus JPG, PNG, atau WEBP." };
  }

  try {
    const saved = await saveUploadedFile({
      file,
      category: "products",
      visibility: "public",
    });

    // Cleanup best-effort: hapus file lama kalau ada
    await deleteUploadedFileByUrl(oldPath);

    return { ok: true, publicUrl: saved.url, path: saved.id };
  } catch (err) {
    console.error(
      "[products] upload image gagal:",
      err instanceof Error ? err.message : err,
    );
    if (err && typeof err === "object" && "cause" in err) {
      console.error("[products] cause:", (err as { cause?: unknown }).cause);
    }
    if (err && typeof err === "object" && "code" in err) {
      console.error("[products] db code:", (err as { code?: unknown }).code);
    }
    return {
      ok: false,
      error: "Upload gambar gagal diproses. Coba ulangi beberapa saat lagi.",
    };
  }
}

export async function createProduct(
  _prev: ProductState,
  formData: FormData,
): Promise<ProductState> {
  const actorId = (await getCurrentUser())?.id ?? null;
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    price: Number(String(formData.get("price") ?? "").replace(/[^\d]/g, "")),
    isActive: formData.get("isActive") ?? "on",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let imageUrl: string | null = null;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const upload = await processImageUpload(image, null);
    if (!upload.ok) {
      return { fieldErrors: { image: [upload.error] } };
    }
    imageUrl = upload.publicUrl;
    const [createdProduct] = await db
      .insert(products)
      .values({
        name: parsed.data.name,
        price: parsed.data.price.toFixed(2),
        imageUrl,
        isActive: parsed.data.isActive,
      })
      .returning({
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl,
        price: products.price,
        isActive: products.isActive,
      });

    await attachUploadedFileToProduct(upload.path, createdProduct.id);
    if (actorId) {
      await db.insert(auditLogs).values({
        actorId,
        targetId: null,
        action: "product_created",
        note: `Produk ${createdProduct.name} ditambahkan.`,
      });
    }
    revalidatePath("/admin/product");
    revalidatePath("/admin/task");
    revalidatePath("/");
    refresh();
    return {
      success: true,
      product: {
        id: createdProduct.id,
        name: createdProduct.name,
        imageUrl: createdProduct.imageUrl,
        price: createdProduct.price,
        isActive: createdProduct.isActive,
      },
    };
  }

  const [createdProduct] = await db
    .insert(products)
    .values({
      name: parsed.data.name,
      price: parsed.data.price.toFixed(2),
      imageUrl,
      isActive: parsed.data.isActive,
    })
    .returning({
      id: products.id,
      name: products.name,
      imageUrl: products.imageUrl,
      price: products.price,
      isActive: products.isActive,
    });

  if (actorId) {
    await db.insert(auditLogs).values({
      actorId,
      targetId: null,
      action: "product_created",
      note: `Produk ${createdProduct.name} ditambahkan.`,
    });
  }

  revalidatePath("/admin/product");
  revalidatePath("/admin/task");
  revalidatePath("/");
  refresh();
  return {
    success: true,
    product: {
      id: createdProduct.id,
      name: createdProduct.name,
      imageUrl: createdProduct.imageUrl,
      price: createdProduct.price,
      isActive: createdProduct.isActive,
    },
  };
}

export async function updateProduct(
  _prev: ProductState,
  formData: FormData,
): Promise<ProductState> {
  const actorId = (await getCurrentUser())?.id ?? null;
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "ID produk tidak valid." };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    price: Number(String(formData.get("price") ?? "").replace(/[^\d]/g, "")),
    isActive: formData.get("isActive") ?? "on",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const [current] = await db
    .select({ imageUrl: products.imageUrl })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!current) return { error: "Produk tidak ditemukan." };

  let imageUrl: string | null = current.imageUrl;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const upload = await processImageUpload(image, current.imageUrl);
    if (!upload.ok) {
      return { fieldErrors: { image: [upload.error] } };
    }
    imageUrl = upload.publicUrl;
    await attachUploadedFileToProduct(upload.path, id);
  }

  const [updatedProduct] = await db
    .update(products)
    .set({
      name: parsed.data.name,
      price: parsed.data.price.toFixed(2),
      imageUrl,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning({
      id: products.id,
      name: products.name,
      imageUrl: products.imageUrl,
      price: products.price,
      isActive: products.isActive,
    });

  if (actorId) {
    await db.insert(auditLogs).values({
      actorId,
      targetId: null,
      action: "product_updated",
      note: `Produk ${updatedProduct.name} diperbarui.`,
    });
  }

  revalidatePath("/admin/product");
  revalidatePath("/admin/task");
  revalidatePath("/");
  refresh();
  return {
    success: true,
    product: {
      id: updatedProduct.id,
      name: updatedProduct.name,
      imageUrl: updatedProduct.imageUrl,
      price: updatedProduct.price,
      isActive: updatedProduct.isActive,
    },
  };
}

export async function deleteProduct(
  _prev: ProductState,
  formData: FormData,
): Promise<ProductState> {
  const actorId = (await getCurrentUser())?.id ?? null;
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "ID produk tidak valid." };
  }

  // Ambil imageUrl dulu untuk cleanup storage
  const [row] = await db
    .select({ imageUrl: products.imageUrl })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (row?.imageUrl) {
    await deleteUploadedFileByUrl(row.imageUrl);
  }

  await db.delete(products).where(eq(products.id, id));
  if (actorId) {
    await db.insert(auditLogs).values({
      actorId,
      targetId: null,
      action: "product_deleted",
      note: `Produk #${id} dihapus.`,
    });
  }
  revalidatePath("/admin/product");
  revalidatePath("/admin/task");
  revalidatePath("/");
  refresh();
  return { success: true };
}
