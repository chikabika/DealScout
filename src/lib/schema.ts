import {
  boolean,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ─── Shared run-stats type ────────────────────────────────────────────────────
// Written by the cron route after each scrape run; read by the dashboard to
// show per-search diagnostic info (which filter step dropped everything, etc.).

export type LastRunStats = {
  ranAt: string                          // ISO timestamp of the run
  maxItems: number                       // Apify maxItems (plan-dependent)
  apifyReturned: number                  // raw items from Apify
  afterSoldLive: number                  // after sold/isLive filter
  afterPrice: number                     // after strict price filter
  afterLocation: number                  // after strict location filter
  afterJunk: number                      // after junk-keyword filter
  afterBlacklist: number                 // after user blacklist
  afterClassifier: number                // after AI car classifier
  newlyInserted: number                  // net-new DB inserts
  priceRangeUsed: { min: number; max: number }
  pricesReturned: number[]               // sorted prices from raw (pre-filter)
  locationsReturned: string[]            // unique locations from raw (pre-filter)
  providerCounts: Record<string, number> // raw items returned per provider e.g. { facebook: 12, carsdotcom: 0 }
  providerErrors: Record<string, string> // error message per provider if it failed e.g. { carsdotcom: 'Firecrawl HTTP 429' }
}

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  plan: text("plan").notNull().default('free'),
  scrapesUsedThisMonth: integer("scrapes_used_this_month").notNull().default(0),
  scrapesResetAt: timestamp("scrapes_reset_at", { mode: "date" }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  paddleCustomerId: text("paddle_customer_id"),
  paddleSubscriptionId: text("paddle_subscription_id"),
  paddleSubscriptionStatus: text("paddle_subscription_status"),
  paddlePriceId: text("paddle_price_id"),
  lsCustomerId: text("ls_customer_id"),
  lsSubscriptionId: text("ls_subscription_id"),
  lsSubscriptionStatus: text("ls_subscription_status"),
  lsVariantId: text("ls_variant_id"),
  aiCallsThisMonth: integer("ai_calls_this_month").notNull().default(0),
  // Daily counter — resets at midnight UTC
  runsToday: integer('runs_today').notNull().default(0),
  runsTodayResetAt: timestamp('runs_today_reset_at', { mode: 'date' }),
  // Monthly counter — resets on 1st of month
  runsThisMonth: integer('runs_this_month').notNull().default(0),
  runsThisMonthResetAt: timestamp('runs_this_month_reset_at', { mode: 'date' }),
  lastSeenAt: timestamp("last_seen_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const searches = pgTable("searches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  maxPrice: integer("max_price").notNull(),
  minPrice: integer("min_price"),
  minYear: integer("min_year"),
  make: text("make"),
  model: text("model"),
  maxMileage: integer("max_mileage"),
  providers: json("providers").$type<string[]>().notNull().default(['facebook']),
  keywords: text("keywords"),
  blacklist: text("blacklist"),
  zipCode: text("zip_code"),
  radiusMiles: integer("radius_miles").default(50),
  pollingFrequency: text("polling_frequency").notNull().default('hourly'),
  frequencyMinutes: integer("frequency_minutes").notNull().default(240),
  nextRunAt: timestamp("next_run_at", { mode: "date" }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  // Populated by the cron route after each run
  lastRunAt: timestamp("last_run_at", { mode: "date" }),
  lastRunStats: json("last_run_stats").$type<LastRunStats>(),
});

export const listings = pgTable("listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  searchId: uuid("search_id")
    .notNull()
    .references(() => searches.id, { onDelete: "cascade" }),
  externalId: text("external_id").notNull(),
  title: text("title").notNull(),
  price: integer("price").notNull(),
  location: text("location"),
  url: text("url").notNull(),
  image: text("image"),
  // Vehicle type determined by AI classifier (sedan, suv, truck, motorcycle, etc.)
  // Null for listings inserted before the classifier was added.
  vehicleType: text("vehicle_type"),
  provider: text("provider").notNull().default('facebook'),
  description: text("description"),
  year: integer("year"),
  make: text("make"),
  model: text("model"),
  mileage: integer("mileage"),
  alerted: boolean("alerted").notNull().default(false),
  seenAt: timestamp("seen_at", { mode: "date" }).defaultNow(),
  // AI deal scoring — Pro/Dealer only
  dealScore: integer("deal_score"),
  estimatedValue: integer("estimated_value"),
  savings: integer("savings"),
  conditionRating: text("condition_rating"),
  conditionNotes: json("condition_notes").$type<string[]>(),
  redFlags: json("red_flags").$type<string[]>(),
  aiSummary: text("ai_summary"),
  aiScoredAt: timestamp("ai_scored_at", { mode: "date" }),
}, (table) => [
  uniqueIndex("listings_provider_external_id_unique").on(table.provider, table.externalId),
]);
