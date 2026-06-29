-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "readAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "messages_conversationId_readAt_idx" ON "messages"("conversationId", "readAt");
