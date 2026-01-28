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

// User Types (based on users table)
export interface User {
  id: string;
  wp_user_id: number;
  email: string;
  name: string;
  phone?: string;
  role: "admin" | "teacher" | "student";
  permissions: string[];
  target_score?: number;
  avatar_url?: string;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

// Student Group Types
export interface StudentGroup {
  id: string;
  name: string;
  description?: string;
  teacher_id?: string;
  teacher?: User;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

// Exam Types
export interface SectionType {
  id: string;
  code: "listening" | "reading" | "writing" | "speaking";
  name: string;
  name_ko?: string;
  description?: string;
  default_time_minutes: number;
  display_order: number;
  is_active: boolean;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  exam_type: "full" | "section_only";
  difficulty?: "easy" | "medium" | "hard";
  thumbnail_url?: string;
  is_package: boolean;
  package_info?: {
    child_exam_ids: string[];
    display_order: number[];
  };
  parent_package_id?: string;
  is_published: boolean;
  is_free: boolean;
  display_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamSection {
  id: string;
  exam_id: string;
  section_type_id: string;
  section_type?: SectionType;
  title?: string;
  description?: string;
  time_limit_minutes?: number;
  total_questions: number;
  display_order: number;
  created_at: string;
}

export interface Question {
  id: string;
  section_id: string;
  passage_id?: string;
  question_type: string;
  part_number?: number;
  question_number: number;
  content: string;
  instructions?: string;
  image_url?: string;
  options_data?: QuestionOption[];
  answer_data?: AnswerData;
  model_answers?: ModelAnswer[];
  points: number;
  generate_followup: boolean;
  display_order: number;
}

export interface QuestionOption {
  label: string;
  content: string;
  is_correct?: boolean;
  correct_position?: number;
  is_distractor?: boolean;
}

export interface AnswerData {
  correct: string;
  alternatives?: string[];
  case_sensitive?: boolean;
  explanation?: string;
}

export interface ModelAnswer {
  target_band: number;
  content: string;
}

// Coupon Types
export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  exam_ids: string[];
  usage_limit?: number;
  used_count: number;
  redemptions: CouponRedemption[];
  is_active: boolean;
  expires_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CouponRedemption {
  user_id: string;
  wp_order_id?: string;
  redeemed_at: string;
}

// Test Session Types
export interface TestSession {
  id: string;
  user_id: string;
  user?: User;
  exam_id: string;
  exam?: Exam;
  assignment_id?: string;
  mode: "practice" | "real";
  status: "not_started" | "in_progress" | "paused" | "completed" | "abandoned";
  current_section_id?: string;
  current_question_number?: number;
  time_remaining_seconds?: number;
  started_at?: string;
  ended_at?: string;
  submitted_at?: string;
  created_at: string;
}

// Score Types
export interface Score {
  id: string;
  session_id: string;
  score_type: "section" | "overall";
  section_type?: "listening" | "reading" | "writing" | "speaking";
  raw_score?: number;
  band_score: number;
  score_details?: Record<string, unknown>;
  adjusted_score?: number;
  adjustment_reason?: string;
  scored_at: string;
}

// Assignment Types
export interface Assignment {
  id: string;
  exam_id: string;
  exam?: Exam;
  group_id?: string;
  group?: StudentGroup;
  title: string;
  description?: string;
  mode: "practice" | "real";
  assignment_type: "homework" | "mock_test";
  starts_at?: string;
  due_date?: string;
  max_attempts: number;
  links: AssignmentLink[];
  is_published: boolean;
  assigned_by: string;
  created_at: string;
}

export interface AssignmentLink {
  user_id: string;
  code: string;
  attempts: number;
  completed: boolean;
  expires_at?: string;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  template_id?: string;
  notification_type: "email" | "kakao" | "sms";
  recipient: string;
  subject?: string;
  content?: string;
  status: "pending" | "sent" | "failed";
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

export interface NotificationTemplate {
  id: string;
  notification_type: "email" | "kakao" | "sms";
  code: string;
  name: string;
  subject_template?: string;
  body_template: string;
  variables: string[];
  is_active: boolean;
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  user_id: string;
  user?: User;
  session_id?: string;
  log_type: "auth" | "test_activity";
  event_type: string;
  event_data?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

// Content Types
export interface Content {
  id: string;
  content_type: "instruction" | "report_template";
  section_type?: "listening" | "reading" | "writing" | "speaking" | "general";
  name: string;
  title?: string;
  body: string;
  image_url?: string;
  metadata?: Record<string, unknown>;
  display_order: number;
  is_default: boolean;
  is_active: boolean;
}

// AI Prompt Types
export interface AIPrompt {
  id: string;
  section_type: "writing" | "speaking";
  prompt_type: "scoring" | "feedback" | "correction" | "followup";
  name: string;
  prompt_content: string;
  model_name?: string;
  temperature: number;
  is_active: boolean;
  version: number;
}

// Scoring Rule Types
export interface ScoringRule {
  id: string;
  rule_type: "band_conversion" | "scoring_weight";
  section_type: "listening" | "reading" | "writing" | "speaking";
  exam_variant: "academic" | "general";
  rules_data: Record<string, unknown>;
  is_active: boolean;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalUsers: number;
  totalExams: number;
  totalSessions: number;
  activeAssignments: number;
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
