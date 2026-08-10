import { ReviewStatus } from "@prisma/client";
import { z } from "zod";
import { getPrismaClient } from "@/lib/db";
import { logAdminEvent } from "@/lib/auth/admin-auth";
import { formatDateTime } from "@/lib/admin/labels";
import {
  toAdminPaginatedResult,
  type AdminPagination,
} from "@/lib/admin/pagination";

export const productReviewSchema = z.object({
  // Le slug identifie le produit côté public (l'id DB n'est pas exposé au client).
  productSlug: z.string().min(1),
  authorName: z.string().trim().min(2, "Votre nom est requis.").max(80),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .min(10, "Votre avis doit contenir au moins 10 caractères.")
    .max(1000),
});

export type PublicReview = {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type PublicProductReviews = {
  average: number | null;
  count: number;
  reviews: PublicReview[];
};

export type ReviewSubmitResult = {
  ok: boolean;
  message: string;
};

export async function submitProductReview(
  input: unknown,
): Promise<ReviewSubmitResult> {
  const parsed = productReviewSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Formulaire d'avis invalide.",
    };
  }

  const db = getPrismaClient();
  const product = await db.product.findUnique({
    where: { slug: parsed.data.productSlug },
    select: { id: true },
  });

  if (!product) {
    return { ok: false, message: "Produit introuvable." };
  }

  await db.productReview.create({
    data: {
      productId: product.id,
      authorName: parsed.data.authorName,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  return {
    ok: true,
    message:
      "Merci pour votre avis ! Il sera publié après validation par notre équipe.",
  };
}

export async function getApprovedProductReviews(
  productSlug: string,
): Promise<PublicProductReviews> {
  const db = getPrismaClient();
  const product = await db.product.findUnique({
    where: { slug: productSlug },
    select: { id: true },
  });

  if (!product) {
    return { average: null, count: 0, reviews: [] };
  }

  const productId = product.id;
  const [aggregate, reviews] = await Promise.all([
    db.productReview.aggregate({
      where: { productId, status: ReviewStatus.APPROVED },
      _avg: { rating: true },
      _count: true,
    }),
    db.productReview.findMany({
      where: { productId, status: ReviewStatus.APPROVED },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return {
    average: aggregate._avg.rating
      ? Math.round(aggregate._avg.rating * 10) / 10
      : null,
    count: aggregate._count,
    reviews: reviews.map((review) => ({
      id: review.id,
      authorName: review.authorName,
      rating: review.rating,
      comment: review.comment,
      createdAt: formatDateTime(review.createdAt),
    })),
  };
}

export async function getAdminReviewsPage(
  status: ReviewStatus | undefined,
  pagination: AdminPagination,
) {
  const db = getPrismaClient();
  const where = status ? { status } : undefined;
  const [total, reviews] = await Promise.all([
    db.productReview.count({ where }),
    db.productReview.findMany({
      where,
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  return toAdminPaginatedResult({
    items: reviews.map((review) => ({
      id: review.id,
      productName: review.product.name,
      productSlug: review.product.slug,
      authorName: review.authorName,
      rating: review.rating,
      comment: review.comment,
      status: review.status,
      createdAt: formatDateTime(review.createdAt),
    })),
    total,
    page: pagination.page,
    perPage: pagination.perPage,
  });
}

// Product.rating et Product.reviewCount sont denormalises : ils alimentent les
// cartes produit et le filtre "note minimum" du catalogue. Sans ce recalcul ils
// restaient figes sur les valeurs du seed, et le site affichait une note sans
// rapport avec les avis reellement approuves.
export async function syncProductRatingFromReviews(productId: string) {
  const db = getPrismaClient();
  const aggregate = await db.productReview.aggregate({
    where: { productId, status: ReviewStatus.APPROVED },
    _avg: { rating: true },
    _count: true,
  });

  const average = aggregate._avg.rating;

  await db.product.update({
    where: { id: productId },
    data: {
      rating: average === null ? null : Math.round(average * 100) / 100,
      reviewCount: aggregate._count,
    },
  });
}

export async function moderateReview({
  adminId,
  reviewId,
  status,
}: {
  adminId: string;
  reviewId: string;
  status: ReviewStatus;
}) {
  const db = getPrismaClient();
  const review = await db.productReview.update({
    where: { id: reviewId },
    data: { status },
    select: { id: true, productId: true, status: true },
  });

  await syncProductRatingFromReviews(review.productId);

  await logAdminEvent({
    adminId,
    action: "ADMIN_REVIEW_MODERATED",
    entity: "ProductReview",
    entityId: review.id,
    metadata: { status: review.status },
  });

  return review;
}
