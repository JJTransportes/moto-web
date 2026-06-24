export interface PartitionTravelReportItem {
  publicPartitionId: string
  publicPartitionName: string
  categoryTitle: string | null
  totalTravels: number
  totalDistanceInMeters: number
  totalDurationInMinutes: number
}
