ALTER TABLE "users" DROP CONSTRAINT "users_business_id_businesses_id_fkey";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "business_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role";--> statement-breakpoint
DROP TYPE "user_role";