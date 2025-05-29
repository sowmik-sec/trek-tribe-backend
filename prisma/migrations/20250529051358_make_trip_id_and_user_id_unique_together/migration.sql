/*
  Warnings:

  - A unique constraint covering the columns `[tripId,userId]` on the table `travelBuddyRequests` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "travelBuddyRequests_tripId_userId_key" ON "travelBuddyRequests"("tripId", "userId");
