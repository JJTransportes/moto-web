export interface OnlineUserDto {
  userId: string
  fullName: string
  role: 'Driver' | 'Passenger'
  latitude: number
  longitude: number
  lastUpdated: string
  photoUrl: string | null
  cpf?: string | null
  email?: string | null
  phone?: string | null
  department?: string | null
  vehicleBrand?: string | null
  vehicleModel?: string | null
  vehiclePlate?: string | null
  vehicleCategory?: string | null
  lastTravelDepartureAddress?: string | null
  lastTravelDestinationAddress?: string | null
  lastTravelFinishedAt?: string | null
}

export interface TodayTravelDto {
  travelId: string
  orderId: string
  status: 'Accepted' | 'InProgress'
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
  driverPhotoUrl: string | null
  passengerPhotoUrl: string | null
  vehicleBrand: string | null
  vehicleModel: string | null
  vehiclePlate: string | null
  startedAt: string | null
}

export interface MapDataResponse {
  onlineUsers: OnlineUserDto[]
  todayTravels: TodayTravelDto[]
}

export type FilterType = 'all' | 'drivers' | 'passengers' | 'travels'
