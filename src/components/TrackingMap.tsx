import type { Booker } from '../types/index';
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

// Fix leaflet default icons issue in react
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

function LocateControl({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  
  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          map.flyTo([lat, lng], 18, { duration: 1 });
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

const customIcon = (isOffline: boolean) => new L.DivIcon({
  html: <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
           <div style="color:;filter:drop-shadow(0 4px 3px rgb(0 0 0 / 0.3));">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
           </div>
         </div>,
  className: 'custom-leaflet-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function TrackingMap({ lat, lng, bookerName, lastSeen, isOffline }: TrackingMapProps) {
  
  return (
    <div className="w-full h-full rounded-md overflow-hidden relative border border-slate-200 dark:border-zinc-800 bg-slate-200 dark:bg-zinc-800">
      {isOffline && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 pointer-events-none">
          <MapPin size={14} className="animate-pulse" />
          BOOKER OFFLINE - LAST SEEN {lastSeen}
        </div>
      )}
      {!isOffline && lastSeen && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          LIVE - {lastSeen}
        </div>
      )}
      
      <MapContainer 
        center={[lat, lng]} 
        zoom={15} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocateControl lat={lat} lng={lng} />
        
        <Marker position={[lat, lng]} icon={customIcon(isOffline || false)}>
          <Popup>
            <div className="text-center font-bold">{bookerName}</div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
