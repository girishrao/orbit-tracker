-- CreateTable
CREATE TABLE "Launch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "net" DATETIME NOT NULL,
    "rocketName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "padName" TEXT,
    "padLat" REAL,
    "padLon" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Satellite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "noradId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "tle1" TEXT NOT NULL,
    "tle2" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "launchId" TEXT,
    CONSTRAINT "Satellite_launchId_fkey" FOREIGN KEY ("launchId") REFERENCES "Launch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Satellite_noradId_key" ON "Satellite"("noradId");
