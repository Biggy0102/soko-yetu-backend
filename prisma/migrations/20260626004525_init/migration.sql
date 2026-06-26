-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('pending', 'active', 'sold', 'rejected');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'reviewed', 'dismissed');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "memberSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseTime" TEXT NOT NULL DEFAULT 'within a day',
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifySms" BOOLEAN NOT NULL DEFAULT true,
    "showPhone" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "dialCode" TEXT NOT NULL,
    "exampleCity" TEXT NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subcategoryId" TEXT,
    "countryCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "storeAddress" TEXT,
    "specs" JSONB NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'pending',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history_entries" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "callbacks" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER NOT NULL,
    "userId" INTEGER,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "callbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER NOT NULL,
    "filedById" INTEGER,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_ads" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "listingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "listings_categoryId_idx" ON "listings"("categoryId");

-- CreateIndex
CREATE INDEX "listings_subcategoryId_idx" ON "listings"("subcategoryId");

-- CreateIndex
CREATE INDEX "listings_countryCode_idx" ON "listings"("countryCode");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "saved_ads_userId_listingId_key" ON "saved_ads"("userId", "listingId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_listingId_buyerId_key" ON "conversations"("listingId", "buyerId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "countries"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "countries"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history_entries" ADD CONSTRAINT "price_history_entries_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "callbacks" ADD CONSTRAINT "callbacks_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "callbacks" ADD CONSTRAINT "callbacks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_filedById_fkey" FOREIGN KEY ("filedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_ads" ADD CONSTRAINT "saved_ads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_ads" ADD CONSTRAINT "saved_ads_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
