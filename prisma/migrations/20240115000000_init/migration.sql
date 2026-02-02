-- CreateEnum
CREATE TYPE "RoleLevel" AS ENUM ('JUNIOR', 'PROFESSIONAL', 'SENIOR', 'FUNCTIONAL_LEAD', 'HEAD_OF');

-- CreateTable
CREATE TABLE "OccupationalField" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "OccupationalField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
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
CREATE TABLE "Responsibility" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "Responsibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetenceField" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "CompetenceField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fieldId" TEXT NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleSkill" (
    "roleId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "minLevel" INTEGER NOT NULL,

    CONSTRAINT "RoleSkill_pkey" PRIMARY KEY ("roleId","skillId")
);

-- CreateTable
CREATE TABLE "SoftSkill" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "SoftSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RoleToSoftSkill" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RoleToSoftSkill_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "OccupationalField_title_key" ON "OccupationalField"("title");

-- CreateIndex
CREATE INDEX "Role_fieldId_idx" ON "Role"("fieldId");

-- CreateIndex
CREATE INDEX "Role_level_idx" ON "Role"("level");

-- CreateIndex
CREATE INDEX "Responsibility_roleId_idx" ON "Responsibility"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetenceField_title_key" ON "CompetenceField"("title");

-- CreateIndex
CREATE INDEX "Skill_fieldId_idx" ON "Skill"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_title_fieldId_key" ON "Skill"("title", "fieldId");

-- CreateIndex
CREATE INDEX "RoleSkill_skillId_idx" ON "RoleSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "SoftSkill_title_key" ON "SoftSkill"("title");

-- CreateIndex
CREATE INDEX "_RoleToSoftSkill_B_index" ON "_RoleToSoftSkill"("B");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "OccupationalField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CompetenceField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleSkill" ADD CONSTRAINT "RoleSkill_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleSkill" ADD CONSTRAINT "RoleSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToSoftSkill" ADD CONSTRAINT "_RoleToSoftSkill_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToSoftSkill" ADD CONSTRAINT "_RoleToSoftSkill_B_fkey" FOREIGN KEY ("B") REFERENCES "SoftSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
