export interface VehicleWithPOIs {
  placa: string;
  positionsByPOI: {
    poi_name: string;
    latitude: number;
    longitude: number;
    positions: {date: string, duration: string}[],
    duration?: string
  }[];
}


