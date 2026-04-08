-- Add step type to CampaignStep (email | linkedin), default email
ALTER TABLE "CampaignStep" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'email';
