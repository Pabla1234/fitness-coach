-- Community: fitness-only threads and photo posts with moderation state

CREATE TABLE IF NOT EXISTS `community_posts` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `parent_id` text,
  `body` text,
  `image_key` text,
  `image_caption` text,
  `status` text DEFAULT 'published' NOT NULL,
  `mod_stage` text,
  `mod_score` real,
  `mod_topic` text,
  `mod_reason` text,
  `mod_detail` text,
  `like_count` integer DEFAULT 0 NOT NULL,
  `reply_count` integer DEFAULT 0 NOT NULL,
  `report_count` integer DEFAULT 0 NOT NULL,
  `created_at` integer DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `community_posts_feed_idx` ON `community_posts` (`status`, `parent_id`, `created_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `community_posts_parent_idx` ON `community_posts` (`parent_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `community_posts_user_idx` ON `community_posts` (`user_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `post_likes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `post_id` text NOT NULL,
  `user_id` text NOT NULL,
  `created_at` integer DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `post_likes_unique` ON `post_likes` (`post_id`, `user_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `post_reports` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `post_id` text NOT NULL,
  `user_id` text NOT NULL,
  `reason` text,
  `created_at` integer DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `post_reports_unique` ON `post_reports` (`post_id`, `user_id`);
