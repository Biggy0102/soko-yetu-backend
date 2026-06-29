-- CreateTable
CREATE TABLE "feedback" (
    "id" SERIAL NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedback_sellerId_idx" ON "feedback"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_sellerId_authorId_key" ON "feedback"("sellerId", "authorId");

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
