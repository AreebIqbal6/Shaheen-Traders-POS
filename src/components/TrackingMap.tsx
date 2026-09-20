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
  html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
           <div style="color:${isOffline ? '#9e9e9e' : '#EA4335'};filter:drop-shadow(0 4px 4px rgb(0 0 0 / 0.4)); transform: scale(1.1)">
             <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
               <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
             </svg>
           </div>
         </div>`,
  className: 'custom-leaflet-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 38],
  popupAnchor: [0, -40],
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
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
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
