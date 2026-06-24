export interface TravelAdminListItem {
  travelId: string
  orderId: string
  passengerName: string | null
  driverName: string | null
  destinationAddress: string
  status: TravelStatus
  createdAt: string
}

export type TravelStatus = 'Pending' | 'Accepted' | 'InProgress' | 'Completed' | 'Cancelled'

export interface PaginatedTravelAdminList {
  items: TravelAdminListItem[]
  page: number
  pageSize: number
  totalCount: number
}

export interface TravelRouteResponse {
  routeId: string
  sequenceIndex: number
  departureAddress: string
  destinationAddress: string
  routeDestinationInMeters: number
  averageTravelTimeInHours: number
  averageTravelTimeInMinutes: number
  initialLatitude: number
  initialLongitude: number
  destinationLatitude: number
  destinationLongitude: number
  encodedPolyline: string
}

export interface TravelDetailResponse {
  travelId: string
  orderId: string
  driverId: string | null
  passengerId: string
  status: TravelStatus
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  cancelledAt: string | null
  cancellationReason: string | null
  driverName: string | null
  passengerName: string | null
  routes: TravelRouteResponse[]
}

export interface TravelListParams {
  page?: number
  pageSize?: number
  status?: string[]
  createdFrom?: string
  createdTo?: string
}
