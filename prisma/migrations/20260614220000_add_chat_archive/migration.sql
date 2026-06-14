ALTER TABLE "TenderChatRun" ADD COLUMN "clearedAt" TIMESTAMP(3);

CREATE INDEX "TenderChatRun_workspaceId_clearedAt_generatedAt_idx"
ON "TenderChatRun"("workspaceId", "clearedAt", "generatedAt");
