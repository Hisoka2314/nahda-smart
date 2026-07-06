export type AdminPaginationInput = {
  page?: string;
  perPage?: string;
};

export type AdminPagination = {
  page: number;
  perPage: 20 | 50;
  skip: number;
  take: 20 | 50;
};

export type AdminPaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  perPage: 20 | 50;
  totalPages: number;
};

export function getAdminPagination(input: AdminPaginationInput): AdminPagination {
  const rawPage = Number(input.page ?? 1);
  const rawPerPage = Number(input.perPage ?? 20);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const perPage = rawPerPage === 50 ? 50 : 20;

  return {
    page,
    perPage,
    skip: (page - 1) * perPage,
    take: perPage,
  };
}

export function toAdminPaginatedResult<T>({
  items,
  total,
  page,
  perPage,
}: {
  items: T[];
  total: number;
  page: number;
  perPage: 20 | 50;
}): AdminPaginatedResult<T> {
  return {
    items,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export function getSingleQuery(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
