CREATE TYPE "tenant_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(120) NOT NULL,
	"slug" varchar(80) NOT NULL UNIQUE,
	"status" "tenant_status" DEFAULT 'active'::"tenant_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
