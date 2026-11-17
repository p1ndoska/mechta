-- Текущие тексты номеров становятся русскими
ALTER TABLE "Room" RENAME COLUMN "title" TO "titleRu";
ALTER TABLE "Room" RENAME COLUMN "description" TO "descriptionRu";
ALTER TABLE "Room" ADD COLUMN "titleEn" TEXT NOT NULL DEFAULT '',
ADD COLUMN "titleBe" TEXT NOT NULL DEFAULT '',
ADD COLUMN "descriptionEn" TEXT NOT NULL DEFAULT '',
ADD COLUMN "descriptionBe" TEXT NOT NULL DEFAULT '';
