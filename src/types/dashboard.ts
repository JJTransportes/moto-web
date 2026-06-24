export interface StatsResponse {
  totalTravelsToday: number
  totalWaitingTravels: number
  driversOnline: number
  driversOffline: number
}

export interface PartitionTravelSummary {
  publicPartitionId: string
  publicPartitionName: string
  totalTravels: number
  totalDurationInMinutes: number
  totalDistanceInMeters: number
}

export interface PendingRegistration {
  registrationId: string
  fullName: string
  email: string
  role: 'Passenger' | 'Driver'
  department: string | null
  publicPartitionName: string | null
  createdAt: string
  status: string
}

export interface DashboardData {
  stats: StatsResponse
  partitions: PartitionTravelSummary[]
  pendingRegistrations: PendingRegistration[]
}
