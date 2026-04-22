-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoleLevel" AS ENUM ('JUNIOR', 'PROFESSIONAL', 'SENIOR', 'TEAM_LEAD', 'FUNCTIONAL_LEAD', 'HEAD_OF');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('CERTIFICATION', 'PROJECT', 'CODE_CONTRIBUTION', 'PEER_REVIEW', 'ASSESSMENT', 'COURSE_COMPLETION', 'PUBLICATION', 'MENTORING');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CareerGoalStatus" AS ENUM ('EXPLORING', 'COMMITTED', 'ACHIEVED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "FocusPriority" AS ENUM ('CRITICAL', 'GROWTH', 'STRETCH');

-- CreateEnum
CREATE TYPE "FocusStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ImpulseLevel" AS ENUM ('L1_AWARENESS', 'L2_GUIDED', 'L3_INDEPENDENT', 'L4_EXPERT');

-- CreateEnum
CREATE TYPE "ImpulseStep" AS ENUM ('CHECK_IN', 'TASK', 'REFLECTION', 'EVIDENCE');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('USER', 'FUNCTIONAL_LEAD', 'ADMIN');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('IMPULSE_STARTED', 'IMPULSE_COMPLETED', 'SKILL_FOCUSED', 'PLAN_CREATED', 'EVIDENCE_SAVED');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('SELF', 'VALIDATED');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('SELF_ASSESSED', 'EVIDENCE_SUBMITTED', 'VALIDATED');

-- CreateTable
CREATE TABLE "CompetenceField" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "ownerId" TEXT,

    CONSTRAINT "CompetenceField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OccupationalField" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "OccupationalField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responsibility" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "Responsibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "level" "RoleLevel" NOT NULL,
    "description" TEXT,
    "team" TEXT DEFAULT 'Squad',
    "hasLeadership" BOOLEAN NOT NULL DEFAULT false,
    "leadershipType" TEXT,
    "hasBudgetResp" BOOLEAN NOT NULL DEFAULT false,
    "directReportTo" TEXT,
    "language" TEXT DEFAULT 'english',
    "fieldId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerPath" (
    "id" TEXT NOT NULL,
    "fromRoleId" TEXT NOT NULL,
    "toRoleId" TEXT NOT NULL,
    "isTypical" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "fieldId" TEXT NOT NULL,
    "coreDescription" TEXT,
    "aiLayerDescription" TEXT,
    "aiToolTip" TEXT,
    "realWorldCaseLink" TEXT,
    "realWorldExpert" TEXT,
    "lastAiUpdate" TIMESTAMP(3),

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftSkill" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "SoftSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "currentRoleId" TEXT,
    "targetRoleId" TEXT,
    "platformRole" "PlatformRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleSkill" (
    "roleId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "minLevel" INTEGER NOT NULL,

    CONSTRAINT "RoleSkill_pkey" PRIMARY KEY ("roleId","skillId")
);

-- CreateTable
CREATE TABLE "SkillValidationConfig" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level1Points" INTEGER NOT NULL DEFAULT 10,
    "level2Points" INTEGER NOT NULL DEFAULT 30,
    "level3Points" INTEGER NOT NULL DEFAULT 60,
    "level4Points" INTEGER NOT NULL DEFAULT 100,
    "certificationWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "projectWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "codeContributionWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "peerReviewWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "assessmentWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.9,
    "courseCompletionWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "publicationWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "mentoringWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "autoValidateCertDomains" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillValidationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT,
    "roleId" TEXT,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "beforeLevel" INTEGER,
    "afterLevel" INTEGER,
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidenceIds" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSkillEvidence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "fileKey" TEXT,
    "issuer" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "status" "ValidationStatus" NOT NULL DEFAULT 'PENDING',
    "validatedAt" TIMESTAMP(3),
    "validatedBy" TEXT,
    "validationScore" DOUBLE PRECISION,
    "validationNotes" TEXT,
    "skillLevelContribution" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSkillEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "selfLevel" INTEGER NOT NULL DEFAULT 0,
    "validatedLevel" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "status" "CareerGoalStatus" NOT NULL DEFAULT 'EXPLORING',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningFocus" (
    "id" TEXT NOT NULL,
    "learningPlanId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "competenceFieldId" TEXT NOT NULL,
    "currentLevel" INTEGER NOT NULL DEFAULT 0,
    "targetLevel" INTEGER NOT NULL,
    "gapSize" INTEGER NOT NULL,
    "priority" "FocusPriority" NOT NULL DEFAULT 'GROWTH',
    "status" "FocusStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "focusOrder" INTEGER,
    "focusedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "internalProjectRefs" JSONB,
    "enrichedDescription" JSONB,
    "smartResources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningFocus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceNote" (
    "id" TEXT NOT NULL,
    "learningFocusId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "linkedResourceId" TEXT,
    "isAssessmentReady" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticalImpulse" (
    "id" TEXT NOT NULL,
    "learningFocusId" TEXT NOT NULL,
    "targetLevel" "ImpulseLevel" NOT NULL,
    "currentStep" "ImpulseStep" NOT NULL DEFAULT 'CHECK_IN',
    "checkInMessage" TEXT,
    "checkInViewedAt" TIMESTAMP(3),
    "prompt" TEXT NOT NULL,
    "taskDescription" TEXT,
    "expectedOutcome" TEXT,
    "estimatedMinutes" INTEGER,
    "taskStartedAt" TIMESTAMP(3),
    "vorbereitungText" TEXT,
    "durchfuehrungText" TEXT,
    "ergebnisCheckText" TEXT,
    "supportConcept" TEXT,
    "supportExplanation" TEXT,
    "supportTemplate" TEXT,
    "reflectionQuestion" TEXT,
    "userReflection" TEXT,
    "reflectionStartedAt" TIMESTAMP(3),
    "evidenceSaved" BOOLEAN NOT NULL DEFAULT false,
    "evidenceNoteId" TEXT,
    "evidenceSavedAt" TIMESTAMP(3),
    "functionalLeadId" TEXT,
    "functionalLeadName" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticalImpulse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "comment" TEXT,
    "contextSkill" TEXT,
    "contextType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "assessedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'SELF_ASSESSED',
    "selfLevel" INTEGER NOT NULL,
    "validatedLevel" INTEGER,
    "validatedById" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationEvent" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "validatorId" TEXT NOT NULL,
    "fromStatus" "AssessmentStatus" NOT NULL,
    "toStatus" "AssessmentStatus" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "evidenceId" TEXT,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RoleToSoftSkill" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RoleToSoftSkill_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompetenceField_title_key" ON "CompetenceField"("title");

-- CreateIndex
CREATE UNIQUE INDEX "CompetenceField_slug_key" ON "CompetenceField"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OccupationalField_title_key" ON "OccupationalField"("title");

-- CreateIndex
CREATE UNIQUE INDEX "OccupationalField_slug_key" ON "OccupationalField"("slug");

-- CreateIndex
CREATE INDEX "Responsibility_roleId_idx" ON "Responsibility"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");

-- CreateIndex
CREATE INDEX "Role_fieldId_idx" ON "Role"("fieldId");

-- CreateIndex
CREATE INDEX "Role_level_idx" ON "Role"("level");

-- CreateIndex
CREATE INDEX "CareerPath_fromRoleId_idx" ON "CareerPath"("fromRoleId");

-- CreateIndex
CREATE INDEX "CareerPath_toRoleId_idx" ON "CareerPath"("toRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerPath_fromRoleId_toRoleId_key" ON "CareerPath"("fromRoleId", "toRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_slug_key" ON "Skill"("slug");

-- CreateIndex
CREATE INDEX "Skill_fieldId_idx" ON "Skill"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_title_fieldId_key" ON "Skill"("title", "fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "SoftSkill_title_key" ON "SoftSkill"("title");

-- CreateIndex
CREATE UNIQUE INDEX "SoftSkill_slug_key" ON "SoftSkill"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_platformRole_idx" ON "User"("platformRole");

-- CreateIndex
CREATE INDEX "RoleSkill_skillId_idx" ON "RoleSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillValidationConfig_skillId_key" ON "SkillValidationConfig"("skillId");

-- CreateIndex
CREATE INDEX "SkillValidationConfig_skillId_idx" ON "SkillValidationConfig"("skillId");

-- CreateIndex
CREATE INDEX "TimelineEntry_eventDate_idx" ON "TimelineEntry"("eventDate");

-- CreateIndex
CREATE INDEX "TimelineEntry_skillId_idx" ON "TimelineEntry"("skillId");

-- CreateIndex
CREATE INDEX "TimelineEntry_userId_idx" ON "TimelineEntry"("userId");

-- CreateIndex
CREATE INDEX "UserSkillEvidence_skillId_idx" ON "UserSkillEvidence"("skillId");

-- CreateIndex
CREATE INDEX "UserSkillEvidence_status_idx" ON "UserSkillEvidence"("status");

-- CreateIndex
CREATE INDEX "UserSkillEvidence_type_idx" ON "UserSkillEvidence"("type");

-- CreateIndex
CREATE INDEX "UserSkillEvidence_userId_idx" ON "UserSkillEvidence"("userId");

-- CreateIndex
CREATE INDEX "SkillAssessment_userId_idx" ON "SkillAssessment"("userId");

-- CreateIndex
CREATE INDEX "SkillAssessment_skillId_idx" ON "SkillAssessment"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillAssessment_userId_skillId_key" ON "SkillAssessment"("userId", "skillId");

-- CreateIndex
CREATE INDEX "CareerGoal_userId_idx" ON "CareerGoal"("userId");

-- CreateIndex
CREATE INDEX "CareerGoal_roleId_idx" ON "CareerGoal"("roleId");

-- CreateIndex
CREATE INDEX "CareerGoal_status_idx" ON "CareerGoal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CareerGoal_userId_roleId_key" ON "CareerGoal"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPlan_userId_key" ON "LearningPlan"("userId");

-- CreateIndex
CREATE INDEX "LearningPlan_userId_idx" ON "LearningPlan"("userId");

-- CreateIndex
CREATE INDEX "LearningFocus_learningPlanId_idx" ON "LearningFocus"("learningPlanId");

-- CreateIndex
CREATE INDEX "LearningFocus_skillId_idx" ON "LearningFocus"("skillId");

-- CreateIndex
CREATE INDEX "LearningFocus_competenceFieldId_idx" ON "LearningFocus"("competenceFieldId");

-- CreateIndex
CREATE INDEX "LearningFocus_status_idx" ON "LearningFocus"("status");

-- CreateIndex
CREATE INDEX "LearningFocus_priority_idx" ON "LearningFocus"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "LearningFocus_learningPlanId_skillId_key" ON "LearningFocus"("learningPlanId", "skillId");

-- CreateIndex
CREATE INDEX "EvidenceNote_learningFocusId_idx" ON "EvidenceNote"("learningFocusId");

-- CreateIndex
CREATE INDEX "PracticalImpulse_learningFocusId_idx" ON "PracticalImpulse"("learningFocusId");

-- CreateIndex
CREATE INDEX "PracticalImpulse_isCompleted_idx" ON "PracticalImpulse"("isCompleted");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_activityType_idx" ON "ActivityLog"("activityType");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- CreateIndex
CREATE INDEX "Feedback_rating_idx" ON "Feedback"("rating");

-- CreateIndex
CREATE INDEX "AssessmentHistory_userId_skillId_createdAt_idx" ON "AssessmentHistory"("userId", "skillId", "createdAt");

-- CreateIndex
CREATE INDEX "Evidence_userId_skillId_idx" ON "Evidence"("userId", "skillId");

-- CreateIndex
CREATE INDEX "TimelineEvent_userId_createdAt_idx" ON "TimelineEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "_RoleToSoftSkill_B_index" ON "_RoleToSoftSkill"("B");

-- AddForeignKey
ALTER TABLE "CompetenceField" ADD CONSTRAINT "CompetenceField_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "OccupationalField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerPath" ADD CONSTRAINT "CareerPath_fromRoleId_fkey" FOREIGN KEY ("fromRoleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerPath" ADD CONSTRAINT "CareerPath_toRoleId_fkey" FOREIGN KEY ("toRoleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CompetenceField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleSkill" ADD CONSTRAINT "RoleSkill_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleSkill" ADD CONSTRAINT "RoleSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntry" ADD CONSTRAINT "TimelineEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillEvidence" ADD CONSTRAINT "UserSkillEvidence_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillEvidence" ADD CONSTRAINT "UserSkillEvidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillAssessment" ADD CONSTRAINT "SkillAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillAssessment" ADD CONSTRAINT "SkillAssessment_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerGoal" ADD CONSTRAINT "CareerGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerGoal" ADD CONSTRAINT "CareerGoal_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPlan" ADD CONSTRAINT "LearningPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningFocus" ADD CONSTRAINT "LearningFocus_learningPlanId_fkey" FOREIGN KEY ("learningPlanId") REFERENCES "LearningPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningFocus" ADD CONSTRAINT "LearningFocus_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningFocus" ADD CONSTRAINT "LearningFocus_competenceFieldId_fkey" FOREIGN KEY ("competenceFieldId") REFERENCES "CompetenceField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceNote" ADD CONSTRAINT "EvidenceNote_learningFocusId_fkey" FOREIGN KEY ("learningFocusId") REFERENCES "LearningFocus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticalImpulse" ADD CONSTRAINT "PracticalImpulse_learningFocusId_fkey" FOREIGN KEY ("learningFocusId") REFERENCES "LearningFocus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentHistory" ADD CONSTRAINT "AssessmentHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentHistory" ADD CONSTRAINT "AssessmentHistory_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentHistory" ADD CONSTRAINT "AssessmentHistory_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationEvent" ADD CONSTRAINT "ValidationEvent_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationEvent" ADD CONSTRAINT "ValidationEvent_validatorId_fkey" FOREIGN KEY ("validatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToSoftSkill" ADD CONSTRAINT "_RoleToSoftSkill_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToSoftSkill" ADD CONSTRAINT "_RoleToSoftSkill_B_fkey" FOREIGN KEY ("B") REFERENCES "SoftSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

