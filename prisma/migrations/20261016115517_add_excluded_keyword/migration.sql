-- CreateTable
CREATE TABLE "ExcludedKeyword" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExcludedKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExcludedKeyword_channelId_word_key" ON "ExcludedKeyword"("channelId", "word");

-- AddForeignKey
ALTER TABLE "ExcludedKeyword" ADD CONSTRAINT "ExcludedKeyword_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
