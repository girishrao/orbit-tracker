-- CreateTable
CREATE TABLE "Agency" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "abbrev" TEXT,
    "type" TEXT,
    "countryCode" TEXT,
    "logoUrl" TEXT,
    "wikiUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RocketConfig" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "family" TEXT,
    "variant" TEXT,
    "fullName" TEXT,
    "reusable" BOOLEAN NOT NULL DEFAULT false,
    "lengthMeters" DOUBLE PRECISION,
    "diameterMeters" DOUBLE PRECISION,
    "leoCapacityKg" DOUBLE PRECISION,
    "gtoCapacityKg" DOUBLE PRECISION,
    "thrustKn" DOUBLE PRECISION,
    "totalLaunchCount" INTEGER,
    "successfulLaunches" INTEGER,
    "failedLaunches" INTEGER,
    "imageUrl" TEXT,
    "wikiUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RocketConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Core" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "status" TEXT,
    "rocketConfigId" INTEGER,
    "totalFlights" INTEGER NOT NULL DEFAULT 0,
    "lastFlightDate" TIMESTAMP(3),
    "reuseCount" INTEGER NOT NULL DEFAULT 0,
    "block" INTEGER,
    "spxId" TEXT,
    "rtlsAttempts" INTEGER,
    "rtlsLandings" INTEGER,
    "asdsAttempts" INTEGER,
    "asdsLandings" INTEGER,
    "lastUpdate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Core_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreFlight" (
    "id" SERIAL NOT NULL,
    "coreId" TEXT NOT NULL,
    "launchId" TEXT NOT NULL,
    "flightNumber" INTEGER,
    "flightProven" BOOLEAN NOT NULL DEFAULT false,
    "landingAttempt" BOOLEAN NOT NULL DEFAULT false,
    "landingSuccess" BOOLEAN,
    "landingType" TEXT,
    "landingLocation" TEXT,
    "turnaroundDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoreFlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Launch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "net" TIMESTAMP(3) NOT NULL,
    "rocketName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "statusAbbrev" TEXT,
    "padName" TEXT,
    "padLat" DOUBLE PRECISION,
    "padLon" DOUBLE PRECISION,
    "missionName" TEXT,
    "missionDescription" TEXT,
    "missionType" TEXT,
    "orbit" TEXT,
    "orbitAbbrev" TEXT,
    "windowStart" TIMESTAMP(3),
    "windowEnd" TIMESTAMP(3),
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Launch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaunchPad" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locationName" TEXT,
    "countryCode" TEXT,
    "mapImageUrl" TEXT,
    "totalLaunchCount" INTEGER,
    "orbitalLaunchAttemptCount" INTEGER,
    "isLandingPad" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaunchPad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "wikiUrl" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaunchProgram" (
    "id" SERIAL NOT NULL,
    "launchId" TEXT NOT NULL,
    "programId" INTEGER NOT NULL,

    CONSTRAINT "LaunchProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramAgency" (
    "id" SERIAL NOT NULL,
    "programId" INTEGER NOT NULL,
    "agencyId" INTEGER NOT NULL,

    CONSTRAINT "ProgramAgency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payload" (
    "id" SERIAL NOT NULL,
    "ll2SpacecraftId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "status" TEXT,
    "launchId" TEXT,
    "satelliteId" INTEGER,
    "intlDesignator" TEXT,
    "matchConfidence" TEXT,
    "matchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Satellite" (
    "id" SERIAL NOT NULL,
    "noradId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "tle1" TEXT NOT NULL,
    "tle2" TEXT NOT NULL,
    "tleEpoch" TIMESTAMP(3),
    "intlDesignator" TEXT,
    "objectType" TEXT,
    "opsStatusCode" TEXT,
    "owner" TEXT,
    "launchDate" TIMESTAMP(3),
    "launchSiteCode" TEXT,
    "decayDate" TIMESTAMP(3),
    "period" DOUBLE PRECISION,
    "inclination" DOUBLE PRECISION,
    "apogee" DOUBLE PRECISION,
    "perigee" DOUBLE PRECISION,
    "radarCrossSection" DOUBLE PRECISION,
    "satcatUpdatedAt" TIMESTAMP(3),
    "spxId" TEXT,
    "spxVersion" TEXT,
    "launchId" TEXT,
    "agencyId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Satellite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TleSnapshot" (
    "id" SERIAL NOT NULL,
    "satelliteId" INTEGER NOT NULL,
    "noradId" INTEGER NOT NULL,
    "epoch" TIMESTAMP(3) NOT NULL,
    "tle1" TEXT NOT NULL,
    "tle2" TEXT NOT NULL,
    "source" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TleSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conjunction" (
    "id" SERIAL NOT NULL,
    "cdmId" TEXT NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL,
    "tca" TIMESTAMP(3) NOT NULL,
    "missDistance" DOUBLE PRECISION NOT NULL,
    "relativeSpeed" DOUBLE PRECISION,
    "collisionProbability" DOUBLE PRECISION,
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
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conjunction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSync" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "entityType" TEXT,
    "lastSyncAt" TIMESTAMP(3) NOT NULL,
    "recordCount" INTEGER,
    "nextSyncAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ok',
    "errorMessage" TEXT,

    CONSTRAINT "DataSync_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "Launch_spxFlightNumber_key" ON "Launch"("spxFlightNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Launch_spxId_key" ON "Launch"("spxId");

-- CreateIndex
CREATE INDEX "Launch_net_idx" ON "Launch"("net");

-- CreateIndex
CREATE INDEX "Launch_status_idx" ON "Launch"("status");

-- CreateIndex
CREATE INDEX "Launch_agencyId_idx" ON "Launch"("agencyId");

-- CreateIndex
CREATE INDEX "Launch_rocketConfigId_idx" ON "Launch"("rocketConfigId");

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
CREATE UNIQUE INDEX "Satellite_noradId_key" ON "Satellite"("noradId");

-- CreateIndex
CREATE UNIQUE INDEX "Satellite_spxId_key" ON "Satellite"("spxId");

-- CreateIndex
CREATE INDEX "Satellite_objectType_idx" ON "Satellite"("objectType");

-- CreateIndex
CREATE INDEX "Satellite_opsStatusCode_idx" ON "Satellite"("opsStatusCode");

-- CreateIndex
CREATE INDEX "Satellite_owner_idx" ON "Satellite"("owner");

-- CreateIndex
CREATE INDEX "Satellite_launchId_idx" ON "Satellite"("launchId");

-- CreateIndex
CREATE INDEX "Satellite_intlDesignator_idx" ON "Satellite"("intlDesignator");

-- CreateIndex
CREATE INDEX "Satellite_name_idx" ON "Satellite"("name");

-- CreateIndex
CREATE INDEX "Satellite_agencyId_idx" ON "Satellite"("agencyId");

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

-- AddForeignKey
ALTER TABLE "Core" ADD CONSTRAINT "Core_rocketConfigId_fkey" FOREIGN KEY ("rocketConfigId") REFERENCES "RocketConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreFlight" ADD CONSTRAINT "CoreFlight_coreId_fkey" FOREIGN KEY ("coreId") REFERENCES "Core"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreFlight" ADD CONSTRAINT "CoreFlight_launchId_fkey" FOREIGN KEY ("launchId") REFERENCES "Launch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Launch" ADD CONSTRAINT "Launch_rocketConfigId_fkey" FOREIGN KEY ("rocketConfigId") REFERENCES "RocketConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Launch" ADD CONSTRAINT "Launch_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Launch" ADD CONSTRAINT "Launch_padId_fkey" FOREIGN KEY ("padId") REFERENCES "LaunchPad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaunchProgram" ADD CONSTRAINT "LaunchProgram_launchId_fkey" FOREIGN KEY ("launchId") REFERENCES "Launch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaunchProgram" ADD CONSTRAINT "LaunchProgram_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramAgency" ADD CONSTRAINT "ProgramAgency_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramAgency" ADD CONSTRAINT "ProgramAgency_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payload" ADD CONSTRAINT "Payload_launchId_fkey" FOREIGN KEY ("launchId") REFERENCES "Launch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payload" ADD CONSTRAINT "Payload_satelliteId_fkey" FOREIGN KEY ("satelliteId") REFERENCES "Satellite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Satellite" ADD CONSTRAINT "Satellite_launchId_fkey" FOREIGN KEY ("launchId") REFERENCES "Launch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Satellite" ADD CONSTRAINT "Satellite_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TleSnapshot" ADD CONSTRAINT "TleSnapshot_satelliteId_fkey" FOREIGN KEY ("satelliteId") REFERENCES "Satellite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conjunction" ADD CONSTRAINT "Conjunction_primarySatelliteId_fkey" FOREIGN KEY ("primarySatelliteId") REFERENCES "Satellite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conjunction" ADD CONSTRAINT "Conjunction_secondarySatelliteId_fkey" FOREIGN KEY ("secondarySatelliteId") REFERENCES "Satellite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
