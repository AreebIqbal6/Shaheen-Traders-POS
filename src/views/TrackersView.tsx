import type { BookerLocation } from '../types/index';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, User, Clock } from 'lucide-react';

// Fix leaflet default icons issue in react
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const customIcon = () => new L.DivIcon({
  html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
           <div style="color:#EA4335;filter:drop-shadow(0 4px 4px rgb(0 0 0 / 0.4)); transform: scale(1.1)">
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

export default function TrackersView() {
  const [locations, setLocations] = useState<BookerLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<BookerLocation | null>(null);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('booker_locations')
        .select('*');
      
      if (error) {
        console.error('Error fetching locations:', error);
        return;
      }
      
      if (data) {
        setLocations(data);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    
    // Subscribe to realtime location updates
    const subscription = supabase
      .channel('public:booker_locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booker_locations' }, payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setLocations(current => {
            const exists = current.find(loc => loc.id === payload.new.id);
            if (exists) {
              return current.map(loc => loc.id === payload.new.id ? payload.new as BookerLocation : loc);
            } else {
              return [...current, payload.new as BookerLocation];
            }
          });
          
          setSelectedLocation(current => {
             if (current && current.id === payload.new.id) {
                 return payload.new as BookerLocation;
             }
             return current;
          });
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `m ago`;
    return `h m ago`;
  };

  const center: [number, number] = [31.5204, 74.3587]; // Default to Lahore, Pakistan

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0a0a0c]">
      <header className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/50 px-6 py-4 flex justify-between items-center shrink-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Live Tracker</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Track active bookers in real-time</p>
        </div>
      </header>
      
      <div className="flex-1 relative bg-slate-200 dark:bg-zinc-800" style={{ zIndex: 0 }}>
        {loading && locations.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 z-[1000] backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : null}

        <MapContainer 
          center={locations.length > 0 ? [locations[0].lat, locations[0].lng] : center} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          />

          {locations.map((loc) => (
            <Marker 
              key={loc.id} 
              position={[loc.lat, loc.lng]} 
              icon={customIcon()}
              eventHandlers={{
                click: () => setSelectedLocation(loc),
              }}
            >
              {selectedLocation?.id === loc.id && (
                <Popup onClose={() => setSelectedLocation(null)}>
                  <div className="flex flex-col gap-1 min-w-[150px] p-1">
                    <div className="font-bold text-sm text-slate-900 border-b pb-1 mb-1 flex items-center gap-2">
                      <User size={14} className="text-blue-600" />
                      {loc.booker_name}
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <MapPin size={12} className="text-slate-400" />
                      {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                    </div>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-1">
                      <Clock size={12} className="text-amber-500" />
                      {formatTime(loc.updated_at)}
                    </div>
                  </div>
                </Popup>
              )}
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
