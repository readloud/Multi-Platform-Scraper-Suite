-- CreateTable
CREATE TABLE "ScrapeSchedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "cronExpression" TEXT,
    "target" TEXT NOT NULL,
    "params" TEXT NOT NULL,
    "webhookUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScrapeExecution" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scheduleId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "result" TEXT,
    "error" TEXT,
    "executedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScrapeExecution_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ScrapeSchedule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "shopId" TEXT,
    "name" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "priceBefore" TEXT,
    "rating" REAL,
    "soldCount" INTEGER,
    "shopName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "rawData" TEXT,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RestaurantData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cuisine" TEXT,
    "rating" REAL,
    "deliveryFee" TEXT,
    "estimatedTime" TEXT,
    "isOpen" BOOLEAN,
    "menu" TEXT,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WebhookConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Proxy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "isHealthy" BOOLEAN NOT NULL DEFAULT true,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "platform" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "remaining" INTEGER NOT NULL,
    "resetAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "platform" TEXT,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ScrapeExecution_scheduleId_idx" ON "ScrapeExecution"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductData_platform_region_productId_key" ON "ProductData"("platform", "region", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantData_platform_region_restaurantId_key" ON "RestaurantData"("platform", "region", "restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "Proxy_url_key" ON "Proxy"("url");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_platform_region_key" ON "RateLimit"("platform", "region");
