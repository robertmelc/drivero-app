-- CreateTable
CREATE TABLE "company_memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_memberships_user_id_idx" ON "company_memberships"("user_id");

-- CreateIndex
CREATE INDEX "company_memberships_company_id_idx" ON "company_memberships"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_memberships_user_id_company_id_role_key" ON "company_memberships"("user_id", "company_id", "role");

-- AddForeignKey
ALTER TABLE "company_memberships" ADD CONSTRAINT "company_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_memberships" ADD CONSTRAINT "company_memberships_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
