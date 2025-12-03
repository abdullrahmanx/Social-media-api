-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "chatOwnerId" TEXT;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_chatOwnerId_fkey" FOREIGN KEY ("chatOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
