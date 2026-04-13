-- CreateTable
CREATE TABLE "Agency" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "abbrev" TEXT,
    "type" TEXT,
    "countryCode" TEXT,
    "logoUrl" TEXT,
    "wikiUrl" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RocketConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "family" TEXT,
    "variant" TEXT,
    "fullName" TEXT,
    "reusable" BOOLEAN NOT NULL DEFAULT false,
    "lengthMeters" REAL,
    "diameterMeters" REAL,
    "leoCapacityKg" REAL,
    "gtoCapacityKg" REAL,
    "thrustKn" REAL,
    "totalLaunchCount" INTEGER,
    "successfulLaunches" INTEGER,
    "failedLaunches" INTEGER,
    "imageUrl" TEXT,
    "wikiUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Core" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serialNumber" TEXT NOT NULL,
    "status" TEXT,
    "rocketConfigId" INTEGER,
    "totalFlights" INTEGER NOT NULL DEFAULT 0,
    "lastFlightDate" DATETIME,
    "reuseCount" INTEGER NOT NULL DEFAULT 0,
    "block" INTEGER,
    "spxId" TEXT,
    "rtlsAttempts" INTEGER,
    "rtlsLandings" INTEGER,
    "asdsAttempts" INTEGER,
    "asdsLandings" INTEGER,
    "lastUpdate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Core_rocketConfigId_fkey" FOREIGN KEY ("rocketConfigId") REFERENCES "RocketConfig" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoreFlight" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "coreId" TEXT NOT NULL,
    "launchId" TEXT NOT NULL,
    "flightNumber" INTEGER,
    "flightProven" BOOLEAN NOT NULL DEFAULT false,
    "landingAttempt" BOOLEAN NOT NULL DEFAULT false,
    "landingSuccess" BOOLEAN,
    "landingType" TEXT,
    "landingLocation" TEXT,
    "turnaroundDays" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoreFlight_coreId_fkey" FOREIGN KEY ("coreId") REFERENCES "Core" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CoreFlight_launchId_fkey" FOREIGN KEY ("launchId") REFERENCES "Launch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LaunchPad" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "fullName" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "locationName" TEXT,
    "countryCode" TEXT,
    "mapImageUrl" TEXT,
    "totalLaunchCount" INTEGER,
    "orbitalLaunchAttemptCount" INTEGER,
    "isLandingPad" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Program" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "wikiUrl" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LaunchProgram" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "launchId" TEXT NOT NULL,
    "programId" INTEGER NOT NULL,
    CONSTRAINT "LaunchProgram_launchId_fkey" FOREIGN KEY ("launchId") REFERENCES "Launch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LaunchProgram_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProgramAgency" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "programId" INTEGER NOT NULL,
    "agencyId" INTEGER NOT NULL,
    CONSTRAINT "ProgramAgency_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProgramAgency_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payload" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ll2SpacecraftId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "status" TEXT,
    "launchId" TEXT,
    "satelliteId" INTEGER,
    "intlDesignator" TEXT,
    "matchConfidence" TEXT,
    "matchedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payload_launchId_fkey" FOREIGN KEY ("launchId") REFERENCES "Launch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payload_satelliteId_fkey" FOREIGN KEY ("satelliteId") REFERENCES "Satellite" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TleSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "satelliteId" INTEGER NOT NULL,
    "noradId" INTEGER NOT NULL,
    "epoch" DATETIME NOT NULL,
    "tle1" TEXT NOT NULL,
    "tle2" TEXT NOT NULL,
    "source" TEXT,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TleSnapshot_satelliteId_fkey" FOREIGN KEY ("satelliteId") REFERENCES "Satellite" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conjunction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cdmId" TEXT NOT NULL,
    "creationDate" DATETIME NOT NULL,
    "tca" DATETIME NOT NULL,
    "missDistance" REAL NOT NULL,
    "relativeSpeed" REAL,
    "collisionProbability" REAL,
    "collisionProbabilityMethod" TEXT,
    "primaryNoradId" INTEGER NOT NULL,
    "primaryName" TEXT,
    "primarySatelliteId" INTEGER,
    "secondaryNoradId" INTEGER NOT NULL,
    "secondaryName" TEXT,
    "secondarySatelliteId" INTEGER,
    "primaryObjectType" TEXT,
    "secondaryObjectType" TEXT,
    "screeningOption" TEXT,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Conjunction_primarySatelliteId_fkey" FOREIGN KEY ("primarySatelliteId") REFERENCES "Satellite" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conjunction_secondarySatelliteId_fkey" FOREIGN KEY ("secondarySatelliteId") REFERENCES "Satellite" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataSync" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source" TEXT NOT NULL,
    "entityType" TEXT,
    "lastSyncAt" DATETIME NOT NULL,
    "recordCount" INTEGER,
    "nextSyncAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "errorMessage" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Launch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "net" DATETIME NOT NULL,
    "rocketName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "statusAbbrev" TEXT,
    "padName" TEXT,
    "padLat" REAL,
    "padLon" REAL,
    "missionName" TEXT,
    "missionDescription" TEXT,
    "missionType" TEXT,
    "orbit" TEXT,
    "orbitAbbrev" TEXT,
    "windowStart" DATETIME,
    "windowEnd" DATETIME,
    "probability" INTEGER,
    "webcastLive" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "infographicUrl" TEXT,
    "slug" TEXT,
    "spxFlightNumber" INTEGER,
    "spxId" TEXT,
    "rocketConfigId" INTEGER,
    "agencyId" INTEGER,
    "padId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Launch_rocketConfigId_fkey" FOREIGN KEY ("rocketConfigId") REFERENCES "RocketConfig" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Launch_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Launch_padId_fkey" FOREIGN KEY ("padId") REFERENCES "LaunchPad" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Launch" ("createdAt", "id", "missionDescription", "missionName", "missionType", "name", "net", "orbit", "orbitAbbrev", "padLat", "padLon", "padName", "rocketName", "status", "updatedAt") SELECT "createdAt", "id", "missionDescription", "missionName", "missionType", "name", "net", "orbit", "orbitAbbrev", "padLat", "padLon", "padName", "rocketName", "status", "updatedAt" FROM "Launch";
DROP TABLE "Launch";
ALTER TABLE "new_Launch" RENAME TO "Launch";
CREATE UNIQUE INDEX "Launch_spxFlightNumber_key" ON "Launch"("spxFlightNumber");
CREATE UNIQUE INDEX "Launch_spxId_key" ON "Launch"("spxId");
CREATE INDEX "Launch_net_idx" ON "Launch"("net");
CREATE INDEX "Launch_status_idx" ON "Launch"("status");
CREATE INDEX "Launch_agencyId_idx" ON "Launch"("agencyId");
CREATE INDEX "Launch_rocketConfigId_idx" ON "Launch"("rocketConfigId");
CREATE TABLE "new_Satellite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "noradId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "tle1" TEXT NOT NULL,
    "tle2" TEXT NOT NULL,
    "tleEpoch" DATETIME,
    "intlDesignator" TEXT,
    "objectType" TEXT,
    "opsStatusCode" TEXT,
    "owner" TEXT,
    "launchDate" DATETIME,
    "launchSiteCode" TEXT,
    "decayDate" DATETIME,
    "period" REAL,
    "inclination" REAL,
    "apogee" REAL,
    "perigee" REAL,
    "radarCrossSection" REAL,
    "satcatUpdatedAt" DATETIME,
    "spxId" TEXT,
    "spxVersion" TEXT,
    "launchId" TEXT,
    "agencyId" INTEGER,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Satellite_launchId_fkey" FOREIGN KEY ("launchId") REFERENCES "Launch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Satellite_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Satellite" ("id", "launchId", "name", "noradId", "tle1", "tle2", "updatedAt") SELECT "id", "launchId", "name", "noradId", "tle1", "tle2", "updatedAt" FROM "Satellite";
DROP TABLE "Satellite";
ALTER TABLE "new_Satellite" RENAME TO "Satellite";
CREATE UNIQUE INDEX "Satellite_noradId_key" ON "Satellite"("noradId");
CREATE UNIQUE INDEX "Satellite_spxId_key" ON "Satellite"("spxId");
CREATE INDEX "Satellite_objectType_idx" ON "Satellite"("objectType");
CREATE INDEX "Satellite_opsStatusCode_idx" ON "Satellite"("opsStatusCode");
CREATE INDEX "Satellite_owner_idx" ON "Satellite"("owner");
CREATE INDEX "Satellite_launchId_idx" ON "Satellite"("launchId");
CREATE INDEX "Satellite_intlDesignator_idx" ON "Satellite"("intlDesignator");
CREATE INDEX "Satellite_name_idx" ON "Satellite"("name");
CREATE INDEX "Satellite_agencyId_idx" ON "Satellite"("agencyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Agency_abbrev_idx" ON "Agency"("abbrev");

-- CreateIndex
CREATE INDEX "Agency_countryCode_idx" ON "Agency"("countryCode");

-- CreateIndex
CREATE INDEX "RocketConfig_family_idx" ON "RocketConfig"("family");

-- CreateIndex
CREATE INDEX "RocketConfig_name_idx" ON "RocketConfig"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Core_serialNumber_key" ON "Core"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Core_spxId_key" ON "Core"("spxId");

-- CreateIndex
CREATE INDEX "Core_status_idx" ON "Core"("status");

-- CreateIndex
CREATE INDEX "Core_serialNumber_idx" ON "Core"("serialNumber");

-- CreateIndex
CREATE INDEX "CoreFlight_launchId_idx" ON "CoreFlight"("launchId");

-- CreateIndex
CREATE INDEX "CoreFlight_coreId_idx" ON "CoreFlight"("coreId");

-- CreateIndex
CREATE UNIQUE INDEX "CoreFlight_coreId_launchId_key" ON "CoreFlight"("coreId", "launchId");

-- CreateIndex
CREATE INDEX "LaunchPad_name_idx" ON "LaunchPad"("name");

-- CreateIndex
CREATE INDEX "LaunchProgram_programId_idx" ON "LaunchProgram"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "LaunchProgram_launchId_programId_key" ON "LaunchProgram"("launchId", "programId");

-- CreateIndex
CREATE INDEX "ProgramAgency_agencyId_idx" ON "ProgramAgency"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramAgency_programId_agencyId_key" ON "ProgramAgency"("programId", "agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "Payload_ll2SpacecraftId_key" ON "Payload"("ll2SpacecraftId");

-- CreateIndex
CREATE UNIQUE INDEX "Payload_satelliteId_key" ON "Payload"("satelliteId");

-- CreateIndex
CREATE INDEX "Payload_launchId_idx" ON "Payload"("launchId");

-- CreateIndex
CREATE INDEX "Payload_name_idx" ON "Payload"("name");

-- CreateIndex
CREATE INDEX "Payload_intlDesignator_idx" ON "Payload"("intlDesignator");

-- CreateIndex
CREATE INDEX "TleSnapshot_satelliteId_idx" ON "TleSnapshot"("satelliteId");

-- CreateIndex
CREATE INDEX "TleSnapshot_noradId_epoch_idx" ON "TleSnapshot"("noradId", "epoch");

-- CreateIndex
CREATE INDEX "TleSnapshot_epoch_idx" ON "TleSnapshot"("epoch");

-- CreateIndex
CREATE UNIQUE INDEX "TleSnapshot_noradId_epoch_key" ON "TleSnapshot"("noradId", "epoch");

-- CreateIndex
CREATE UNIQUE INDEX "Conjunction_cdmId_key" ON "Conjunction"("cdmId");

-- CreateIndex
CREATE INDEX "Conjunction_tca_idx" ON "Conjunction"("tca");

-- CreateIndex
CREATE INDEX "Conjunction_primaryNoradId_idx" ON "Conjunction"("primaryNoradId");

-- CreateIndex
CREATE INDEX "Conjunction_secondaryNoradId_idx" ON "Conjunction"("secondaryNoradId");

-- CreateIndex
CREATE INDEX "Conjunction_primarySatelliteId_idx" ON "Conjunction"("primarySatelliteId");

-- CreateIndex
CREATE INDEX "Conjunction_secondarySatelliteId_idx" ON "Conjunction"("secondarySatelliteId");

-- CreateIndex
CREATE INDEX "Conjunction_collisionProbability_idx" ON "Conjunction"("collisionProbability");

-- CreateIndex
CREATE INDEX "DataSync_source_idx" ON "DataSync"("source");

-- CreateIndex
CREATE UNIQUE INDEX "DataSync_source_entityType_key" ON "DataSync"("source", "entityType");
