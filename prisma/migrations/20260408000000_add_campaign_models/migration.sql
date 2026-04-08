-- Add Campaign and CampaignStep tables for the cold email sequence builder.
-- These replace the legacy smartleadCampaigns JSON field on Project.

CREATE TABLE "Campaign" (
  "id"          TEXT        NOT NULL,
  "projectId"   TEXT        NOT NULL,
  "name"        TEXT        NOT NULL,
  "smartleadId" INTEGER,
  "pushedAt"    TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CampaignStep" (
  "id"         TEXT        NOT NULL,
  "campaignId" TEXT        NOT NULL,
  "seq"        INTEGER     NOT NULL,
  "waitDays"   INTEGER     NOT NULL DEFAULT 0,
  "variants"   JSONB       NOT NULL DEFAULT '[]',
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CampaignStep_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Campaign_projectId_idx" ON "Campaign"("projectId");
CREATE INDEX "CampaignStep_campaignId_idx" ON "CampaignStep"("campaignId");
CREATE UNIQUE INDEX "CampaignStep_campaignId_seq_key" ON "CampaignStep"("campaignId", "seq");

ALTER TABLE "Campaign"
  ADD CONSTRAINT "Campaign_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CampaignStep"
  ADD CONSTRAINT "CampaignStep_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
