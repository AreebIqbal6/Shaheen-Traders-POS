import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TrackingMapProps {
  lat: number;
  lng: number;
  bookerName: string;
  lastSeen?: string;
  isOffline?: boolean;
}

// Helper component to recenter map when lat/lng change
function RecenterAutomatically({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

function LocateControl({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Zoom level 18 is very close
          map.flyTo([lat, lng], 18, { animate: true, duration: 1 });
        }}
        className="bg-white hover:bg-slate-100 text-slate-800 px-3 py-2 rounded-md shadow-md border border-slate-200 flex items-center gap-2 font-bold text-sm pointer-events-auto transition-colors"
        title="Locate Booker"
      >
        <Navigation size={16} className="text-blue-600" />
        Locate Booker
      </button>
    </div>
  );
}

export default function TrackingMap({ lat, lng, bookerName, lastSeen, isOffline }: TrackingMapProps) {
  return (
    <div className="w-full h-full rounded-md overflow-hidden relative border border-slate-200 dark:border-zinc-800">
      {isOffline && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
          <MapPin size={14} className="animate-pulse" />
          BOOKER OFFLINE - LAST SEEN {lastSeen}
        </div>
      )}
      {!isOffline && lastSeen && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          LIVE - {lastSeen}
        </div>
      )}
      
      <MapContainer 
        center={[lat, lng]} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <LocateControl lat={lat} lng={lng} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <RecenterAutomatically lat={lat} lng={lng} />
        <Marker position={[lat, lng]}>
          <Popup>
            <div className="text-center font-bold">
              {bookerName}
              {isOffline && <div className="text-red-600 text-xs mt-1">Offline</div>}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
