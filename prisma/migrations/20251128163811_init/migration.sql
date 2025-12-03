/*
  Warnings:

  - Made the column `chatOwnerId` on table `Chat` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_chatOwnerId_fkey";

-- AlterTable
ALTER TABLE "Chat" ALTER COLUMN "chatOwnerId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_chatOwnerId_fkey" FOREIGN KEY ("chatOwnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
