"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { ReviewStatus } from "@prisma/client";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { moderateReview } from "@/lib/services/reviews";

export async function moderateReviewAction(formData: FormData) {
  const admin = await requireAdminSection("products");
  const reviewId = formData.get("reviewId");
  const rawStatus = formData.get("status");
  const status =
    typeof rawStatus === "string" &&
    (Object.values(ReviewStatus) as string[]).includes(rawStatus)
      ? (rawStatus as ReviewStatus)
      : null;

  if (typeof reviewId !== "string" || !reviewId || !status) {
    redirect("/admin/avis?error=validation");
  }

  let productSlug = "";

  try {
    const review = await moderateReview({
      adminId: admin.id,
      reviewId,
      status,
    });
    const db = (await import("@/lib/db")).getPrismaClient();
    const product = await db.product.findUnique({
      where: { id: review.productId },
      select: { slug: true },
    });
    productSlug = product?.slug ?? "";
  } catch (error) {
    unstable_rethrow(error);
    redirect("/admin/avis?error=save");
  }

  revalidatePath("/admin/avis");
  if (productSlug) {
    revalidatePath(`/produit/${productSlug}`);
  }
  redirect("/admin/avis?success=updated");
}
