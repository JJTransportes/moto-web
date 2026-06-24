export interface OnlineUserDto {
  userId: string
  fullName: string
  role: 'Driver' | 'Passenger'
  latitude: number
  longitude: number
  lastUpdated: string
}

export interface TodayTravelDto {
  travelId: string
  orderId: string
  status: 'Pending' | 'InProgress' | 'Completed' | 'Cancelled'
  driverId: string | null
  driverName: string | null
  passengerId: string
  passengerName: string
  departureAddress: string
  destinationAddress: string
  initialLatitude: number
  initialLongitude: number
  destinationLatitude: number
  destinationLongitude: number
  routeDistanceInMeters: number
  averageTimeInMinutes: number
  encodedPolyline: string | null
}

export interface MapDataResponse {
  onlineUsers: OnlineUserDto[]
  todayTravels: TodayTravelDto[]
}

export type FilterType = 'all' | 'drivers' | 'passengers' | 'travels'
