import { create } from 'zustand';

interface MapState {
  selectedTreeId: string | null;
  userLocation: { lat: number; lng: number } | null;
  mapCenter: [number, number];
  mapZoom: number;
  filterStatus: string | null;
  setSelectedTree: (id: string | null) => void;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  setFilterStatus: (status: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedTreeId: null,
  userLocation: null,
  mapCenter: [41.2995, 69.2401], // Tashkent
  mapZoom: 12,
  filterStatus: null,

  setSelectedTree: (id) => set({ selectedTreeId: id }),
  setUserLocation: (loc) => set({ userLocation: loc }),
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  setFilterStatus: (status) => set({ filterStatus: status }),
}));
