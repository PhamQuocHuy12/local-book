CREATE TYPE "user_role" AS ENUM('owner', 'manager');--> statement-breakpoint
ALTER TYPE "tenant_status" RENAME TO "business_status";--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"business_id" uuid NOT NULL,
	"email" varchar(120) NOT NULL UNIQUE,
	"phone" varchar(20),
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(120) NOT NULL,
	"role" "user_role" DEFAULT 'manager'::"user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenants" RENAME TO "businesses";--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "business_type" varchar(80) NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "phone" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_business_id_businesses_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id");