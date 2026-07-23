-- References metier lisibles et atomiques.
CREATE SEQUENCE "customer_reference_seq" START 1;
CREATE SEQUENCE "supplier_reference_seq" START 1;

ALTER TABLE "Customer" ADD COLUMN "reference" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "reference" TEXT;

WITH numbered AS (
  SELECT "id", row_number() OVER (ORDER BY "createdAt", "id") AS number
  FROM "Customer"
)
UPDATE "Customer" AS customer
SET "reference" = 'CLI-' || lpad(numbered.number::text, 6, '0')
FROM numbered
WHERE customer."id" = numbered."id";

WITH numbered AS (
  SELECT "id", row_number() OVER (ORDER BY "createdAt", "id") AS number
  FROM "Supplier"
)
UPDATE "Supplier" AS supplier
SET "reference" = 'FOU-' || lpad(numbered.number::text, 6, '0')
FROM numbered
WHERE supplier."id" = numbered."id";

SELECT setval(
  '"customer_reference_seq"',
  GREATEST((SELECT count(*) FROM "Customer"), 1),
  (SELECT count(*) FROM "Customer") > 0
);
SELECT setval(
  '"supplier_reference_seq"',
  GREATEST((SELECT count(*) FROM "Supplier"), 1),
  (SELECT count(*) FROM "Supplier") > 0
);

ALTER TABLE "Customer"
  ALTER COLUMN "reference" SET NOT NULL,
  ALTER COLUMN "reference" SET DEFAULT (
    'CLI-' || lpad(nextval('"customer_reference_seq"')::text, 6, '0')
  );

ALTER TABLE "Supplier"
  ALTER COLUMN "reference" SET NOT NULL,
  ALTER COLUMN "reference" SET DEFAULT (
    'FOU-' || lpad(nextval('"supplier_reference_seq"')::text, 6, '0')
  );

CREATE UNIQUE INDEX "Customer_reference_key" ON "Customer"("reference");
CREATE UNIQUE INDEX "Supplier_reference_key" ON "Supplier"("reference");
