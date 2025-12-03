-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "deletedFor" TEXT[] DEFAULT ARRAY[]::TEXT[];
