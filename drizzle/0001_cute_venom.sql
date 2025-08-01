ALTER TABLE "orders" ADD COLUMN "scheduled_delivery_date" timestamp with time zone DEFAULT CURRENT_TIMESTAMP + INTERVAL '14 days' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "date_delivered" timestamp with time zone DEFAULT CURRENT_TIMESTAMP + INTERVAL '16 days';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_street" varchar(200) DEFAULT '';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_city" varchar(100) DEFAULT '';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_state" varchar(100) DEFAULT '';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_postal" varchar(20) DEFAULT '';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_country" varchar(100) DEFAULT '';