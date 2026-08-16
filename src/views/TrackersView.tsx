import type { BookerLocation } from '../types/index';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, User, Clock } from 'lucide-react';

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
      <header className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/50 px-6 py-4 flex justify-between items-center shrink-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Live Tracker</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Track active bookers in real-time</p>
        </div>
      </header>
      
      <div className="flex-1 relative bg-slate-200 dark:bg-zinc-800">
        {loading && locations.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 z-20 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : null}

        <Map
          initialViewState={{
            longitude: locations.length > 0 ? locations[0].lng : center[1],
            latitude: locations.length > 0 ? locations[0].lat : center[0],
            zoom: 13
          }}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
          style={{width: '100%', height: '100%', position: 'absolute', inset: 0}}
        >
          {locations.map((loc) => (
            <Marker 
              key={loc.id} 
              longitude={loc.lng} 
              latitude={loc.lat} 
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedLocation(loc);
              }}
            >
              <div className="relative flex flex-col items-center cursor-pointer group">
                <div className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-0.5 shadow-md border border-white/20 whitespace-nowrap opacity-90 group-hover:opacity-100 transition-opacity">
                  {loc.booker_name}
                </div>
                <div className="text-blue-600 drop-shadow-md relative">
                   <MapPin size={32} weight="fill" style={{ fill: 'currentColor' }} />
                   <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white"></div>
                </div>
              </div>
            </Marker>
          ))}

          {selectedLocation && (
            <Popup
              anchor="top"
              longitude={selectedLocation.lng}
              latitude={selectedLocation.lat}
              onClose={() => setSelectedLocation(null)}
              closeOnClick={false}
              className="z-50"
              offset={10}
            >
              <div className="flex flex-col gap-1 min-w-[150px] p-1">
                <div className="font-bold text-sm text-slate-900 border-b pb-1 mb-1 flex items-center gap-2">
                  <User size={14} className="text-blue-600" />
                  {selectedLocation.booker_name}
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2">
                  <MapPin size={12} className="text-slate-400" />
                  {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                </div>
                <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-1">
                  <Clock size={12} className="text-amber-500" />
                  {formatTime(selectedLocation.updated_at)}
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}
