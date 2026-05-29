export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "VERIFYING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "NEEDS_INFO";

export interface Application {
  id: string;
  userId: string;
  schoolEmail: string;
  studentId: string;
  department: string;
  reason: string;
  status: ApplicationStatus;
  reviewerId: string | null;
  reviewReason: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApplicationInput {
  userId: string;
  schoolEmail: string;
  studentId: string;
  department: string;
  reason: string;
}

export interface ReviewApplicationInput {
  status: "APPROVED" | "REJECTED" | "NEEDS_INFO";
  reviewerId: string;
  reviewReason?: string;
}

export interface ApplicationRepository {
  create(input: CreateApplicationInput): Promise<Application>;
  findById(id: string): Promise<Application | null>;
  findByUserId(userId: string): Promise<Application | null>;
  list(): Promise<Application[]>;
  review(id: string, input: ReviewApplicationInput): Promise<Application>;
}
