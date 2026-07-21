-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'accountant', 'driver');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'invited', 'disabled');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('petrol', 'diesel', 'electric', 'hybrid', 'lpg');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('owned', 'finance_lease', 'operating_lease');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('active', 'in_service', 'retired');

-- CreateEnum
CREATE TYPE "ProtocolType" AS ENUM ('handover', 'return');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('regular_service', 'repair', 'tires', 'other');

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('business', 'private');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('stk', 'vignette', 'insurance', 'service', 'lease_end');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('pending', 'sent', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "DocumentOwnerType" AS ENUM ('vehicle', 'handover_protocol', 'service_record', 'fuel_expense', 'company');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('create', 'update', 'delete');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ico" TEXT NOT NULL,
    "dic" TEXT,
    "address" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "retention_years" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "started_at" TIMESTAMP(3),
    "status" "UserStatus" NOT NULL DEFAULT 'invited',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "spz" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "fuel_type" "FuelType" NOT NULL,
    "consumption_l_100km" DECIMAL(65,30),
    "ownership_type" "OwnershipType" NOT NULL,
    "lease_supplier" TEXT,
    "lease_end_date" TIMESTAMP(3),
    "odometer_km" INTEGER NOT NULL DEFAULT 0,
    "status" "VehicleStatus" NOT NULL DEFAULT 'active',
    "stk_valid_until" TIMESTAMP(3),
    "vignette_valid_until" TIMESTAMP(3),
    "insurance_liability_valid_until" TIMESTAMP(3),
    "insurance_casco_valid_until" TIMESTAMP(3),
    "insurance_provider" TEXT,
    "insurance_policy_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_assignments" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),

    CONSTRAINT "vehicle_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handover_protocols" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "ProtocolType" NOT NULL,
    "protocol_date" TIMESTAMP(3) NOT NULL,
    "odometer_km" INTEGER NOT NULL,
    "condition_notes" TEXT,
    "photos" JSONB,
    "signed_by_admin" BOOLEAN NOT NULL DEFAULT false,
    "signed_by_admin_at" TIMESTAMP(3),
    "signed_by_driver" BOOLEAN NOT NULL DEFAULT false,
    "signed_by_driver_at" TIMESTAMP(3),
    "pdf_document_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "handover_protocols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_records" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "type" "ServiceType" NOT NULL,
    "service_date" TIMESTAMP(3) NOT NULL,
    "odometer_km" INTEGER NOT NULL,
    "supplier" TEXT,
    "cost_amount" DECIMAL(65,30) NOT NULL,
    "cost_currency" TEXT NOT NULL DEFAULT 'CZK',
    "document_id" TEXT,
    "next_service_due_date" TIMESTAMP(3),
    "next_service_due_km" INTEGER,

    CONSTRAINT "service_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_log_entries" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "trip_date" TIMESTAMP(3) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "start_location" TEXT NOT NULL,
    "end_location" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "trip_type" "TripType" NOT NULL,
    "odometer_start_km" INTEGER NOT NULL,
    "odometer_end_km" INTEGER NOT NULL,
    "distance_km" INTEGER NOT NULL,
    "note" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "edited_from_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_expenses" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "trip_id" TEXT,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "liters" DECIMAL(65,30),
    "amount" DECIMAL(65,30) NOT NULL,
    "document_id" TEXT,

    CONSTRAINT "fuel_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "vehicle_id" TEXT,
    "type" "NotificationType" NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'pending',
    "lead_days" INTEGER NOT NULL DEFAULT 14,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "owner_type" "DocumentOwnerType" NOT NULL,
    "owner_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "diff" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_ico_key" ON "companies"("ico");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vin_key" ON "vehicles"("vin");

-- CreateIndex
CREATE INDEX "vehicles_company_id_idx" ON "vehicles"("company_id");

-- CreateIndex
CREATE INDEX "vehicle_assignments_vehicle_id_idx" ON "vehicle_assignments"("vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_assignments_user_id_idx" ON "vehicle_assignments"("user_id");

-- CreateIndex
CREATE INDEX "handover_protocols_vehicle_id_idx" ON "handover_protocols"("vehicle_id");

-- CreateIndex
CREATE INDEX "service_records_vehicle_id_idx" ON "service_records"("vehicle_id");

-- CreateIndex
CREATE INDEX "trip_log_entries_vehicle_id_idx" ON "trip_log_entries"("vehicle_id");

-- CreateIndex
CREATE INDEX "trip_log_entries_user_id_idx" ON "trip_log_entries"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "trip_log_entries_vehicle_id_sequence_number_key" ON "trip_log_entries"("vehicle_id", "sequence_number");

-- CreateIndex
CREATE INDEX "fuel_expenses_vehicle_id_idx" ON "fuel_expenses"("vehicle_id");

-- CreateIndex
CREATE INDEX "notifications_company_id_idx" ON "notifications"("company_id");

-- CreateIndex
CREATE INDEX "documents_company_id_idx" ON "documents"("company_id");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_idx" ON "audit_logs"("company_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_protocols" ADD CONSTRAINT "handover_protocols_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_protocols" ADD CONSTRAINT "handover_protocols_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_log_entries" ADD CONSTRAINT "trip_log_entries_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_log_entries" ADD CONSTRAINT "trip_log_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_expenses" ADD CONSTRAINT "fuel_expenses_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
