-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_chatOwnerId_fkey";

-- AlterTable
ALTER TABLE "Chat" ALTER COLUMN "chatOwnerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_chatOwnerId_fkey" FOREIGN KEY ("chatOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
