import type { BookerLocation } from '../types/index';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, User, Clock } from 'lucide-react';

// Fix for default Leaflet markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});



export default function TrackersView() {
  const [locations, setLocations] = useState<BookerLocation[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
     
    fetchLocations();
    
    // Subscribe to realtime changes in booker_locations
    const channel = supabase
      .channel('public:booker_locations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'booker_locations' },
        () => {
          // You can also optimistically update local state here instead of re-fetching, 
          // but for simplicity and consistency, re-fetching works well for small lists.
          fetchLocations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ${diffMin % 60}m ago`;
  };

  const center: [number, number] = [31.5204, 74.3587]; // Default to Lahore, Pakistan

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0a0a0c]">
      <header className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/50 px-6 py-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Live Tracker</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Track active bookers in real-time</p>
        </div>
      </header>
      
      <div className="flex-1 relative">
        {loading && locations.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 z-10 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : null}

        <MapContainer 
          center={locations.length > 0 ? [locations[0].lat, locations[0].lng] : center} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {locations.map((loc) => (
            <Marker key={loc.id} position={[loc.lat, loc.lng]}>
              <Popup>
                <div className="flex flex-col gap-1 min-w-[150px]">
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
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
