-- CreateTable
CREATE TABLE "KeywordCache" (
    "channelId" TEXT NOT NULL,
    "frequencies" JSONB NOT NULL,
    "commentCount" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeywordCache_pkey" PRIMARY KEY ("channelId")
);

-- AddForeignKey
ALTER TABLE "KeywordCache" ADD CONSTRAINT "KeywordCache_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
