import { getPrismaClient } from "@/lib/db";
import {
  customerSchema,
  type CustomerInput,
} from "@/lib/validations/customer";

export async function createCustomer(input: CustomerInput) {
  const db = getPrismaClient();
  const data = customerSchema.parse(input);

  return db.customer.create({
    data: {
      ...data,
      email: emptyToUndefined(data.email),
      organizationName: emptyToUndefined(data.organizationName),
      internalNotes: emptyToUndefined(data.internalNotes),
    },
  });
}

export async function findCustomerByPhone(phone: string) {
  const db = getPrismaClient();

  return db.customer.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });
}

function emptyToUndefined(value?: string) {
  return value?.trim() ? value.trim() : undefined;
}
