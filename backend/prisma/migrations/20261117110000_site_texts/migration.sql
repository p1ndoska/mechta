-- CreateTable
CREATE TABLE "SiteText" (
    "key" TEXT NOT NULL,
    "ru" TEXT NOT NULL,
    "en" TEXT NOT NULL DEFAULT '',
    "be" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteText_pkey" PRIMARY KEY ("key")
);
