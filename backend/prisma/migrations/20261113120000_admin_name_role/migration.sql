-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'EDITOR');

-- Логин переименован в имя
ALTER TABLE "Admin" RENAME COLUMN "login" TO "name";
ALTER INDEX "Admin_login_key" RENAME TO "Admin_name_key";

-- Роль: уже созданные пользователи могли управлять пользователями, поэтому они администраторы
ALTER TABLE "Admin" ADD COLUMN "role" "AdminRole" NOT NULL DEFAULT 'EDITOR';
UPDATE "Admin" SET "role" = 'ADMIN';
