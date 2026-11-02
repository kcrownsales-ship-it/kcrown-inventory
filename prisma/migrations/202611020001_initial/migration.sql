CREATE TABLE "InventoryState" (
  "id" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryState_pkey" PRIMARY KEY ("id")
);
