-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "realName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER'
);

-- CreateTable
CREATE TABLE "Chemical" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "casNo" TEXT,
    "category" TEXT NOT NULL,
    "hazardDesc" TEXT,
    "msdsUrl" TEXT,
    "safeThreshold" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'g',
    "currentQuantity" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "StockIn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chemicalId" INTEGER NOT NULL,
    "batchNo" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "inQuantity" REAL NOT NULL,
    "operator" TEXT NOT NULL,
    "inDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockIn_chemicalId_fkey" FOREIGN KEY ("chemicalId") REFERENCES "Chemical" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chemicalId" INTEGER NOT NULL,
    "opType" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "opTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OpLog_chemicalId_fkey" FOREIGN KEY ("chemicalId") REFERENCES "Chemical" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "opTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
