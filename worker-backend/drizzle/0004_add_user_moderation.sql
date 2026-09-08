-- Per-user moderation standing: strikes that accumulate across posts

CREATE TABLE IF NOT EXISTS `user_moderation` (
  `user_id` text PRIMARY KEY NOT NULL,
  `strikes` integer DEFAULT 0 NOT NULL,
  `blocked_count` integer DEFAULT 0 NOT NULL,
  `review_count` integer DEFAULT 0 NOT NULL,
  `published_count` integer DEFAULT 0 NOT NULL,
  `status` text DEFAULT 'ok' NOT NULL,
  `last_violation_at` integer,
  `last_topic` text,
  `updated_at` integer DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_moderation_status_idx` ON `user_moderation` (`status`, `strikes`);
