// Navigation Types
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

// =============================================
// User Types (based on users table)
// =============================================
export interface User {
  id: string;
  wp_user_id: number;
  email: string;
  name: string;
  phone?: string | null;
  admin_role?: "super_admin" | "content_manager" | "student_manager" | null;
  target_score?: number | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
}

// =============================================
// Student Group Types
// =============================================
export interface StudentGroup {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  // computed/joined
  member_count?: number;
}

export interface StudentGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  left_at?: string | null;
  // joined
  user?: User;
}

// =============================================
// Question Types (based on questions table)
// =============================================
export type QuestionType = "listening" | "reading" | "writing" | "speaking";

export type QuestionFormat =
  // Reading (8)
  | "fill_blank_typing"
  | "fill_blank_drag"
  | "matching"
  | "mcq_single"
  | "mcq_multiple"
  | "true_false_ng"
  | "yes_no_ng"
  | "flowchart"
  | "table_completion"
  | "short_answer"
  // Writing (1)
  | "essay"
  // Speaking (3)
  | "speaking_part1"
  | "speaking_part2"
  | "speaking_part3";

export interface Question {
  id: string;
  question_code?: string | null;
  question_type: QuestionType;
  question_format: QuestionFormat;
  title?: string | null;
  content: string;
  instructions?: string | null;
  image_url?: string | null;
  options_data?: Record<string, unknown> | null;
  answer_data?: Record<string, unknown> | null;
  model_answers?: ModelAnswer[] | null;
  // Audio (Listening/Speaking)
  audio_url?: string | null;
  audio_duration_seconds?: number | null;
  audio_transcript?: string | null;
  // Speaking fields
  speaking_category?: string | null;
  related_part2_id?: string | null;
  depth_level?: number | null;
  target_band_min?: number | null;
  target_band_max?: number | null;
  // Settings
  points: number;
  difficulty?: "easy" | "medium" | "hard" | null;
  is_practice: boolean;
  generate_followup: boolean;
  tags?: string[] | null;
  // Status
  is_active: boolean;
  // Meta
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModelAnswer {
  target_band: number;
  content: string;
}

// =============================================
// Section Types (based on sections table)
// =============================================
export type SectionType = "listening" | "reading" | "writing" | "speaking";

export interface Section {
  id: string;
  section_type: SectionType;
  title: string;
  description?: string | null;
  image_url?: string | null;
  // Instruction page
  instruction_title?: string | null;
  instruction_html?: string | null;
  instruction_image_url?: string | null;
  // Reading: passage
  passage_title?: string | null;
  passage_content?: string | null;
  passage_footnotes?: string | null;
  // Listening: audio
  audio_url?: string | null;
  audio_duration_seconds?: number | null;
  audio_transcript?: string | null;
  // Settings
  time_limit_minutes?: number | null;
  difficulty?: "easy" | "medium" | "hard" | null;
  is_practice: boolean;
  tags?: string[] | null;
  // Status
  is_active: boolean;
  // Meta
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Computed/joined
  question_count?: number;
  items?: SectionItem[];
  content_blocks?: SectionContentBlock[];
  question_groups?: SectionQuestionGroup[];
}

// =============================================
// Section Content Blocks
// =============================================
export interface SectionContentBlock {
  id: string;
  section_id: string;
  display_order: number;
  content_type: "passage" | "audio";
  // Passage
  passage_title?: string | null;
  passage_content?: string | null;
  passage_footnotes?: string | null;
  // Audio
  audio_url?: string | null;
  audio_duration_seconds?: number | null;
  audio_transcript?: string | null;
  // Meta
  created_at: string;
  updated_at: string;
}

// =============================================
// Section Question Groups
// =============================================
export interface SectionQuestionGroup {
  id: string;
  section_id: string;
  content_block_id?: string | null;
  display_order: number;
  title?: string | null;
  instructions?: string | null;
  question_number_start: number;
  created_at: string;
  updated_at: string;
  // Joined
  items?: SectionItem[];
}

// =============================================
// Section Items (section ↔ question many-to-many)
// =============================================
export interface SectionItem {
  id: string;
  section_id: string;
  question_id: string;
  group_id?: string | null;
  question_number_start: number;
  display_order: number;
  created_at: string;
  // Joined
  question?: Question;
}

// =============================================
// Package Types (based on packages table)
// =============================================
export interface Package {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  unique_code?: string;
  exam_type: "full" | "section_only";
  difficulty?: "easy" | "medium" | "hard" | null;
  time_limit_minutes?: number | null;
  is_practice: boolean;
  is_bundle: boolean;
  access_type: "public" | "groups" | "individuals" | "groups_and_individuals";
  is_published: boolean;
  is_free: boolean;
  display_order: number;
  tags?: string[] | null;
  instruction_title?: string | null;
  instruction_content?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Computed/joined
  sections?: PackageSection[];
  section_count?: number;
  bundle_children?: PackageBundleItem[];
}

// =============================================
// Package Bundle (bundle ↔ child package many-to-many)
// =============================================
export interface PackageBundleItem {
  id: string;
  bundle_id: string;
  child_package_id: string;
  display_order: number;
  // Joined
  child_package?: Package;
}

// =============================================
// Package Sections (package ↔ section many-to-many)
// =============================================
export interface PackageSection {
  id: string;
  package_id: string;
  section_id: string;
  display_order: number;
  custom_time_limit_minutes?: number | null;
  created_at: string;
  // Joined
  section?: Section;
}

// =============================================
// Coupon (이용권/결제) Types (based on coupons table)
// =============================================
export type CouponStatus = "paid" | "expired" | "refunded";

export interface Coupon {
  id: string;
  user_id: string;
  package_id: string;
  wp_order_id: string;
  amount: number;
  status: CouponStatus;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  user?: User;
  package?: Package;
}

// =============================================
// Access Control Types
// =============================================
export interface UserPackageAccess {
  id: string;
  user_id: string;
  package_id: string;
  access_type: "coupon" | "assigned" | "trial" | "purchase" | "direct";
  source_id?: string | null;
  granted_by?: string | null;
  expires_at?: string | null;
  created_at: string;
  // Joined
  user?: User;
  package?: Package;
}

export interface PackageGroupAccess {
  id: string;
  package_id: string;
  group_id: string;
  granted_by?: string | null;
  created_at: string;
  // Joined
  group?: StudentGroup;
}

// =============================================
// Test Session Types (based on test_sessions table)
// =============================================
export interface TestSession {
  id: string;
  user_id: string;
  package_id: string;
  mode: "practice" | "real";
  status: "not_started" | "in_progress" | "paused" | "completed" | "abandoned";
  current_section_id?: string | null;
  current_question_number?: number | null;
  time_remaining_seconds?: number | null;
  draft_data?: Record<string, unknown> | null;
  draft_saved_at?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  submitted_at?: string | null;
  package_snapshot?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  // Scoring
  scoring_status: "not_scored" | "auto_scored" | "under_review" | "finalized";
  total_score?: number | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  reviewer_notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  user?: User;
  package?: Package;
}

// =============================================
// Test Response Types (based on test_responses table)
// =============================================
export interface TestResponse {
  id: string;
  session_id: string;
  section_id?: string | null;
  question_id?: string | null;
  response_type: "answer" | "recording" | "highlight";
  // Answer fields
  answer_content?: string | null;
  selected_options?: Record<string, unknown>[] | null;
  is_flagged: boolean;
  // Recording fields
  audio_url?: string | null;
  duration_seconds?: number | null;
  transcript?: string | null;
  // Highlight fields
  highlight_data?: Record<string, unknown> | null;
  // Speaking followup
  followup_questions?: Record<string, unknown>[] | null;
  // Snapshot
  question_snapshot?: Record<string, unknown> | null;
  // Scoring
  auto_score?: number | null;
  admin_score?: number | null;
  final_score?: number | null;
  admin_feedback?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  // Common
  time_spent_seconds?: number | null;
  created_at: string;
  updated_at: string;
}

// =============================================
// Score Types (based on scores table)
// =============================================
export interface Score {
  id: string;
  session_id: string;
  section_id?: string | null;
  score_type: "section" | "overall";
  section_type?: SectionType | null;
  raw_score?: number | null;
  band_score: number;
  score_details?: Record<string, unknown> | null;
  adjusted_score?: number | null;
  adjustment_reason?: string | null;
  adjusted_by?: string | null;
  scored_at: string;
  created_at: string;
}

// =============================================
// Feedback Types (based on feedback table)
// =============================================
export interface Feedback {
  id: string;
  session_id: string;
  section_id?: string | null;
  question_id?: string | null;
  section_type?: SectionType | null;
  feedback_type: "ai_writing" | "ai_speaking" | "teacher";
  // AI feedback fields
  criteria_scores?: Record<string, unknown> | null;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  suggestions?: string[] | null;
  corrections?: Record<string, unknown>[] | null;
  corrected_version?: string | null;
  model_answer?: string | null;
  pronunciation_issues?: Record<string, unknown>[] | null;
  // Teacher feedback fields
  teacher_comment?: string | null;
  is_public: boolean;
  // Common
  created_by?: string | null;
  ai_model_used?: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================
// Inquiry Types (based on inquiries table)
// =============================================
export interface Inquiry {
  id: string;
  user_id: string;
  category: "general" | "technical" | "exam" | "payment" | "account" | "other";
  subject: string;
  content: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  admin_id?: string | null;
  reply?: string | null;
  replied_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  user?: User;
}

// =============================================
// Speaking Category Types (based on speaking_categories table)
// =============================================
export interface SpeakingCategory {
  id: string;
  code: string;
  name_en: string;
  name_ko?: string | null;
  description_en?: string | null;
  description_ko?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// Speaking Rubric Types (based on speaking_rubrics table)
// =============================================
export interface SpeakingRubric {
  id: string;
  band_score: number;
  criteria_code: "fc" | "lr" | "ga" | "pr";
  criteria_name_en: string;
  criteria_name_ko?: string | null;
  description_en: string;
  description_ko?: string | null;
  key_indicators?: string[] | null;
  created_at: string;
  updated_at: string;
}

// =============================================
// Speaking Test Set Types (based on speaking_test_sets table)
// =============================================
export interface SpeakingTestSet {
  id: string;
  set_code: string;
  title: string;
  description?: string | null;
  part1_category_ids: string[];
  part2_question_id: string;
  target_band_min?: number | null;
  target_band_max?: number | null;
  estimated_duration_minutes: number;
  is_active: boolean;
  is_published: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Computed/joined
  part1_category_count?: number;
  part3_question_count?: number;
}

// =============================================
// Notification Types
// =============================================
export interface Notification {
  id: string;
  user_id: string;
  template_id?: string | null;
  notification_type: "email" | "kakao" | "sms";
  recipient: string;
  subject?: string | null;
  content?: string | null;
  status: "pending" | "sent" | "failed";
  sent_at?: string | null;
  error_message?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface NotificationTemplate {
  id: string;
  notification_type: "email" | "kakao" | "sms";
  code: string;
  name: string;
  subject_template?: string | null;
  body_template: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// Activity Log Types
// =============================================
export interface ActivityLog {
  id: string;
  user_id: string;
  session_id?: string | null;
  log_type: "auth" | "test_activity";
  event_type: string;
  event_data?: Record<string, unknown> | null;
  user_agent?: string | null;
  timestamp: string;
  // Joined
  user?: User;
}

// =============================================
// Package Assignment Types
// =============================================
export interface PackageAssignment {
  id: string;
  package_id: string;
  package_title: string;
  assignment_type: "group" | "individual";
  group_id?: string | null;
  group_name?: string | null;
  user_id?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  assigned_by: string;
  assigned_by_name?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  is_active: boolean;
  memo?: string | null;
  created_at: string;
  updated_at: string;
  // Detail only
  member_count?: number;
}

// =============================================
// Dashboard Stats Types
// =============================================
export interface DashboardStats {
  totalUsers: number;
  totalPackages: number;
  totalSessions: number;
  recentActivity: ActivityLog[];
  sessionsByStatus: {
    completed: number;
    in_progress: number;
    abandoned: number;
  };
  averageScores: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
    overall: number;
  };
}
