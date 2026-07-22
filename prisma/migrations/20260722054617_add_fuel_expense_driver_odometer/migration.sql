/*
  Warnings:

  - Added the required column `user_id` to the `fuel_expenses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "fuel_expenses" ADD COLUMN     "odometer_km" INTEGER,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "fuel_expenses_user_id_idx" ON "fuel_expenses"("user_id");

-- AddForeignKey
ALTER TABLE "fuel_expenses" ADD CONSTRAINT "fuel_expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
