'use client';
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface LocationPickerProps {
  lat?: number;
  lng?: number;
  onPick: (lat: number, lng: number) => void;
}

export default function LocationPicker({ lat, lng, onPick }: LocationPickerProps) {
  const center: [number, number] = lat && lng ? [lat, lng] : [41.2995, 69.2401];

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-700" style={{ height: 240 }}>
      <MapContainer
        center={center}
        zoom={12}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        <ClickHandler onPick={onPick} />
        {lat && lng && (
          <Marker position={[lat, lng]} />
        )}
      </MapContainer>
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[999] bg-gray-900/90 text-xs text-gray-300 px-3 py-1 rounded-full border border-gray-700 pointer-events-none">
        Joylashuvni tanlash uchun xaritani bosing
      </div>
    </div>
  );
}
