export interface Mountain {
  id: number;
  name: string;
  altitude: number;
  lat: number;
  lng: number;
  description: string;
  nationalPark: boolean;
  difficulty?: string;
  features: string[];
}

export interface MountainsApiResponse {
  success: boolean;
  count: number;
  data: Mountain[];
}

export interface TrailPoint {
  lat: number;
  lng: number;
  ele: number;
}

export interface Waypoint {
  lat: number;
  lng: number;
  ele: number;
  name: string;
  category: string;
}

export interface TrailCourse {
  id: number;
  name: string;
  distance: number;
  segments: TrailPoint[][];
  waypoints?: Waypoint[];
  difficulty?: string;
  uphillTime?: number;
  downhillTime?: number;
}

export interface TrailData {
  mountainId: number;
  mountainName: string;
  courses: TrailCourse[];
}

export interface TrailApiResponse {
  success: boolean;
  data: TrailData;
}
