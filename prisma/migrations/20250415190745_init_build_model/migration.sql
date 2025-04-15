-- CreateTable
CREATE TABLE "Build" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "targetUrls" TEXT NOT NULL,
    "userObjective" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_ANALYSIS',
    "error" TEXT,
    "tempPackageJson" TEXT,
    "sampleResultsJson" TEXT,
    "finalConfigurationJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
