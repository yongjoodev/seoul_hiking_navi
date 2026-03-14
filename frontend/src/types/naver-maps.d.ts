// Naver Maps JavaScript API v3 타입 선언
declare namespace naver {
  namespace maps {
    class Map {
      constructor(element: HTMLElement | string, options?: MapOptions);
      panTo(latlng: LatLng, transitionOptions?: TransitionOptions): void;
      setZoom(zoom: number, effect?: boolean): void;
      getZoom(): number;
      setCenter(latlng: LatLng): void;
      getCenter(): LatLng;
      fitBounds(bounds: LatLngBounds, margin?: number | { top?: number; right?: number; bottom?: number; left?: number }): void;
      destroy(): void;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    class LatLngBounds {
      constructor(sw: LatLng, ne: LatLng);
    }

    class Point {
      constructor(x: number, y: number);
    }

    class Size {
      constructor(width: number, height: number);
    }

    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      getMap(): Map | null;
      setIcon(icon: MarkerIcon | string): void;
      getPosition(): LatLng;
    }

    class Polyline {
      constructor(options: PolylineOptions);
      setMap(map: Map | null): void;
      getMap(): Map | null;
      setPath(path: LatLng[]): void;
    }

    class InfoWindow {
      constructor(options: InfoWindowOptions);
      open(map: Map, anchor: LatLng | Marker): void;
      close(): void;
      setContent(content: string | HTMLElement): void;
      getContent(): string | HTMLElement;
      setPosition(position: LatLng): void;
    }

    namespace Event {
      function addListener(
        target: Map | Marker | unknown,
        type: string,
        listener: (...args: unknown[]) => void
      ): unknown;
      function removeListener(listener: unknown): void;
    }

    const MapTypeId: {
      NORMAL: string;
      TERRAIN: string;
      SATELLITE: string;
      HYBRID: string;
    };

    interface MapOptions {
      center?: LatLng;
      zoom?: number;
      minZoom?: number;
      maxZoom?: number;
      mapTypeId?: string;
      zoomControl?: boolean;
      zoomControlOptions?: unknown;
      scaleControl?: boolean;
      mapDataControl?: boolean;
      logoControl?: boolean;
    }

    interface MarkerOptions {
      position: LatLng;
      map?: Map;
      icon?: MarkerIcon | string;
      title?: string;
      clickable?: boolean;
      zIndex?: number;
    }

    interface MarkerIcon {
      content?: string;
      anchor?: Point;
      size?: Size;
    }

    interface PolylineOptions {
      path: LatLng[];
      strokeColor?: string;
      strokeWeight?: number;
      strokeOpacity?: number;
      strokeStyle?: string;
      clickable?: boolean;
      map?: Map;
    }

    interface InfoWindowOptions {
      content?: string | HTMLElement;
      borderWidth?: number;
      disableAnchor?: boolean;
      backgroundColor?: string;
      pixelOffset?: Point;
      zIndex?: number;
    }

    interface PolylineMouseEvent {
      coord: LatLng;
      offset: Point;
    }

    interface TransitionOptions {
      duration?: number;
      easing?: string;
    }
  }
}

declare interface Window {
  naver: typeof naver;
}
