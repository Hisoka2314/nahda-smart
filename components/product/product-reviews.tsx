"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitProductReviewAction } from "@/app/actions/reviews";
import type {
  PublicProductReviews,
  ReviewSubmitResult,
} from "@/lib/services/reviews";

const initialState: ReviewSubmitResult | null = null;

function Stars({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={size}
          className={
            value <= rating
              ? "fill-[#f7b500] text-[#f7b500]"
              : "text-neutral-300"
          }
        />
      ))}
    </span>
  );
}

export function ProductReviews({
  productSlug,
  reviews,
}: {
  productSlug: string;
  reviews: PublicProductReviews;
}) {
  const [state, formAction, pending] = useActionState(
    submitProductReviewAction,
    initialState,
  );
  const [selectedRating, setSelectedRating] = useState(5);

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div>
        <div className="rounded-card bg-nahda-ink p-5 text-white">
          {reviews.count > 0 ? (
            <>
              <p className="text-4xl font-black">
                {reviews.average?.toFixed(1)}
              </p>
              <div className="mt-2">
                <Stars rating={Math.round(reviews.average ?? 0)} size={17} />
              </div>
              <p className="mt-2 text-sm font-bold text-white/70">
                Basé sur {reviews.count} avis client{reviews.count > 1 ? "s" : ""}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-black">Aucun avis pour le moment</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                Soyez le premier à partager votre expérience avec ce produit.
              </p>
            </>
          )}
        </div>

        <form
          action={formAction}
          className="mt-4 rounded-card border border-border-soft bg-white p-5"
        >
          <p className="font-black text-nahda-ink">Donner mon avis</p>
          <input type="hidden" name="productSlug" value={productSlug} />
          <input type="hidden" name="rating" value={selectedRating} />

          <div className="mt-3">
            <p className="text-xs font-black uppercase text-neutral-500">
              Votre note
            </p>
            <div className="mt-1.5 flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                  onClick={() => setSelectedRating(value)}
                  className="focus-ring rounded p-0.5"
                >
                  <Star
                    size={22}
                    className={
                      value <= selectedRating
                        ? "fill-[#f7b500] text-[#f7b500]"
                        : "text-neutral-300 transition hover:text-[#f7b500]"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <input
            name="authorName"
            required
            minLength={2}
            maxLength={80}
            placeholder="Votre nom"
            className="focus-ring mt-3 h-11 w-full rounded-control border border-border-soft px-3 text-sm"
          />
          <textarea
            name="comment"
            required
            minLength={10}
            maxLength={1000}
            rows={4}
            placeholder="Votre expérience avec ce produit..."
            className="focus-ring mt-3 w-full rounded-control border border-border-soft p-3 text-sm"
          />
          <Button type="submit" className="mt-3 w-full" disabled={pending}>
            {pending ? "Envoi..." : "Envoyer mon avis"}
          </Button>
          {state ? (
            <p
              role="status"
              className={`mt-2 text-sm font-bold ${
                state.ok ? "text-nahda-olive-dark" : "text-nahda-orange"
              }`}
            >
              {state.message}
            </p>
          ) : null}
        </form>
      </div>

      <div className="grid content-start gap-3">
        {reviews.reviews.length === 0 ? (
          <div className="rounded-card border border-border-soft p-5">
            <p className="text-sm leading-6 text-neutral-600">
              Les avis validés par notre équipe apparaîtront ici.
            </p>
          </div>
        ) : (
          reviews.reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-card border border-border-soft bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-black text-nahda-ink">{review.authorName}</p>
                <Stars rating={review.rating} />
              </div>
              <p className="mt-2 text-sm leading-6 text-neutral-700">
                {review.comment}
              </p>
              <p className="mt-2 text-xs text-neutral-400">{review.createdAt}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
