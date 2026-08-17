import type { Booker } from '../types/index';
import React, { useEffect, useRef } from 'react';
import Map, { Marker, Popup, useMap } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Navigation } from 'lucide-react';

interface TrackingMapProps {
  lat: number;
  lng: number;
  bookerName: string;
  lastSeen?: string;
  isOffline?: boolean;
}

function LocateControl({ lat, lng }: { lat: number; lng: number }) {
  const { current: map } = useMap();
  
  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (map) {
             map.flyTo({ center: [lng, lat], zoom: 18, duration: 1000 });
          }
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
  
  const mapStyle = {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: 'Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL.'
      }
    },
    layers: [
      {
        id: 'simple-tiles',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 22
      }
    ]
  } as any;

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
      
      <Map
        initialViewState={{
          longitude: lng,
          latitude: lat,
          zoom: 15
        }}
        mapStyle={mapStyle}
        style={{width: '100%', height: '100%', position: 'absolute', inset: 0}}
      >
        <LocateControl lat={lat} lng={lng} />
        
        <Marker 
          longitude={lng} 
          latitude={lat}
          anchor="bottom"
        >
          <div className="relative flex flex-col items-center group">
            <div className="bg-slate-900 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm border border-slate-700 whitespace-nowrap mb-0.5">
              {bookerName}
              {isOffline && <div className="text-red-400 text-[10px] mt-0.5">Offline</div>}
            </div>
            <div className={`drop-shadow-md relative ${isOffline ? 'text-red-500' : 'text-blue-600'}`}>
               <MapPin size={32} weight="fill" style={{ fill: 'currentColor' }} />
               <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white"></div>
            </div>
          </div>
        </Marker>
      </Map>
    </div>
  );
}
