import { FilterInputType as PrismaFilterInputType } from "@prisma/client";
import { globalFilterGroups } from "@/data/filter-definitions";
import type {
  FilterAttribute,
  FilterGroup,
  FilterInputType,
} from "@/types/catalogue";

type PrismaPublicFilterGroup = {
  id: string;
  name: string;
  order: number;
  defaultOpen: boolean;
  isAdvanced: boolean;
  category: { slug: string };
  attributes: Array<{
    id: string;
    label: string;
    slug: string;
    type: PrismaFilterInputType;
    unit: string | null;
    filterable: boolean;
    searchable: boolean;
    visible: boolean;
    order: number;
    options: Array<{
      id: string;
      label: string;
      value: string;
      order: number;
      visible: boolean;
    }>;
  }>;
};

const inputTypeMap: Record<PrismaFilterInputType, FilterInputType> = {
  CHECKBOX: "checkbox",
  RADIO: "radio",
  RANGE: "range",
  BOOLEAN: "boolean",
  SELECT: "select",
  MULTI_SELECT: "multi-select",
  SEARCH_LIST: "search-list",
  NUMERIC_RANGE: "numeric-range",
};

export function prismaFilterGroupsToUiGroups(
  groups: PrismaPublicFilterGroup[],
  options: { includeGlobal?: boolean } = {},
): FilterGroup[] {
  const categoryGroups = groups
    .filter((group) => group.attributes.some((attribute) => attribute.visible))
    .map(prismaFilterGroupToUiGroup);

  return [
    ...(options.includeGlobal ?? true ? globalFilterGroups : []),
    ...categoryGroups,
  ].sort((first, second) => first.order - second.order);
}

function prismaFilterGroupToUiGroup(group: PrismaPublicFilterGroup): FilterGroup {
  return {
    id: group.id,
    categorySlug: group.category.slug,
    name: group.name,
    order: group.order + 20,
    defaultOpen: group.defaultOpen,
    isAdvanced: group.isAdvanced,
    attributes: group.attributes
      .filter((attribute) => attribute.visible && attribute.filterable)
      .sort((first, second) => first.order - second.order)
      .map((attribute): FilterAttribute => {
        const type = inputTypeMap[attribute.type] ?? "checkbox";

        return {
          id: attribute.id,
          groupId: group.id,
          categorySlug: group.category.slug,
          label: attribute.label,
          slug: attribute.slug,
          type,
          unit: attribute.unit ?? undefined,
          filterable: attribute.filterable,
          searchable: attribute.searchable,
          visible: attribute.visible,
          order: attribute.order,
          options: attribute.options
            .filter((option) => option.visible)
            .sort((first, second) => first.order - second.order)
            .map((option) => ({
              id: option.id,
              label: option.label,
              value: option.value,
              order: option.order,
            })),
          defaultOpen: group.defaultOpen,
          showEmptyOptions: false,
          source: "product-attribute",
          paramKey: `attr_${attribute.slug}`,
        };
      }),
  };
}
