-- CreateTable
CREATE TABLE "RoomPhoto" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "type" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomPhoto_roomId_idx" ON "RoomPhoto"("roomId");

-- AddForeignKey
ALTER TABLE "RoomPhoto" ADD CONSTRAINT "RoomPhoto_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

