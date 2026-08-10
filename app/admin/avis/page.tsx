import Link from "next/link";
import { ReviewStatus } from "@prisma/client";
import { Check, Star, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminEmptyState,
  AdminFeedback,
  AdminPageHeader,
  AdminPagination,
  AdminPanel,
  AdminSelect,
  AdminStatusBadge,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { moderateReviewAction } from "@/app/admin/avis/actions";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { getAdminPagination, getSingleQuery } from "@/lib/admin/pagination";
import { getAdminReviewsPage } from "@/lib/services/reviews";

export const dynamic = "force-dynamic";

const statusLabels: Record<ReviewStatus, string> = {
  PENDING: "En attente",
  APPROVED: "Publié",
  REJECTED: "Rejeté",
};

function statusTone(status: ReviewStatus) {
  if (status === "APPROVED") return "success" as const;
  if (status === "REJECTED") return "muted" as const;
  return "warning" as const;
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("products");
  const params = await searchParams;
  const rawStatus = Array.isArray(params.status)
    ? params.status[0]
    : params.status;
  const status =
    rawStatus && (Object.values(ReviewStatus) as string[]).includes(rawStatus)
      ? (rawStatus as ReviewStatus)
      : undefined;
  const pagination = getAdminPagination({
    page: getSingleQuery(params.page),
    perPage: getSingleQuery(params.perPage),
  });
  const reviewsPage = await getAdminReviewsPage(status, pagination);
  const reviews = reviewsPage.items;

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Catalogue"
          title="Avis clients"
          description="Modérez les avis avant publication : seuls les avis approuvés apparaissent sur les fiches produit."
          breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Avis" }]}
        />
        <AdminFeedback
          success={
            Array.isArray(params.success) ? params.success[0] : params.success
          }
          error={Array.isArray(params.error) ? params.error[0] : params.error}
        />

        <AdminPanel title="Filtre">
          <form className="flex items-center gap-3">
            <AdminSelect name="status" defaultValue={status}>
              <option value="">Tous les statuts</option>
              {Object.values(ReviewStatus).map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </AdminSelect>
            <Button type="submit" variant="lightOutline" size="sm">
              Filtrer
            </Button>
          </form>
        </AdminPanel>

        <AdminPanel title={`${reviewsPage.total} avis`}>
          {reviews.length ? (
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Produit</th>
                  <th className="px-3 py-3">Auteur</th>
                  <th className="px-3 py-3">Note</th>
                  <th className="px-3 py-3">Avis</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </AdminTableHead>
              <tbody className="divide-y divide-white/10">
                {reviews.map((review) => (
                  <tr key={review.id}>
                    <AdminTableCell className="text-xs">
                      {review.createdAt}
                    </AdminTableCell>
                    <AdminTableCell>
                      <Link
                        href={`/produit/${review.productSlug}`}
                        className="font-bold text-white hover:text-nahda-olive"
                      >
                        {review.productName}
                      </Link>
                    </AdminTableCell>
                    <AdminTableCell>{review.authorName}</AdminTableCell>
                    <AdminTableCell>
                      <span className="inline-flex items-center gap-1 font-black text-white">
                        {review.rating}
                        <Star size={13} className="fill-[#f7b500] text-[#f7b500]" />
                      </span>
                    </AdminTableCell>
                    <AdminTableCell className="max-w-md text-sm leading-6">
                      {review.comment}
                    </AdminTableCell>
                    <AdminTableCell>
                      <AdminStatusBadge tone={statusTone(review.status)}>
                        {statusLabels[review.status]}
                      </AdminStatusBadge>
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="flex items-center gap-1.5">
                        {review.status !== "APPROVED" ? (
                          <form action={moderateReviewAction}>
                            <input type="hidden" name="reviewId" value={review.id} />
                            <input type="hidden" name="status" value="APPROVED" />
                            <Button type="submit" size="sm" title="Publier cet avis">
                              <Check size={14} />
                              Publier
                            </Button>
                          </form>
                        ) : null}
                        {review.status !== "REJECTED" ? (
                          <form action={moderateReviewAction}>
                            <input type="hidden" name="reviewId" value={review.id} />
                            <input type="hidden" name="status" value="REJECTED" />
                            <Button
                              type="submit"
                              variant="lightOutline"
                              size="sm"
                              title="Rejeter cet avis"
                            >
                              <X size={14} />
                              Rejeter
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </AdminTableCell>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <AdminEmptyState
              title="Aucun avis"
              description="Les avis soumis depuis les fiches produit apparaîtront ici pour modération."
            />
          )}
          <AdminPagination
            basePath="/admin/avis"
            searchParams={params}
            page={reviewsPage.page}
            perPage={reviewsPage.perPage}
            total={reviewsPage.total}
            totalPages={reviewsPage.totalPages}
          />
        </AdminPanel>
      </div>
    </AdminLayout>
  );
}
