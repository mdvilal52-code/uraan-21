'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, LocateFixed, Search, Loader2, AlertCircle, Plus, Minus } from 'lucide-react';
import type { GeoAddress } from '@/lib/geo/nominatim';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Default map center: the store's own city (New Delhi) — used only until the
// customer detects/searches their own location.
const DEFAULT_CENTER: [number, number] = [28.7041, 77.1025];
const DEFAULT_ZOOM = 12;
const PIN_ZOOM = 16;

type GeoErrorKind = 'denied' | 'unavailable' | 'timeout' | 'unsupported' | 'lookup-failed' | null;

interface LocationPickerProps {
  onLocationResolved: (address: GeoAddress) => void;
}

export default function LocationPicker({ onLocationResolved }: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markerRef = useRef<import('leaflet').Marker | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<GeoErrorKind>(null);
  const [resolvedLabel, setResolvedLabel] = useState('');

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoAddress[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolveFromCoords = useCallback(
    async (lat: number, lon: number) => {
      setLocating(true);
      setError(null);
      try {
        const res = await fetch(`/api/geo/reverse?lat=${lat}&lon=${lon}`);
        const data = await res.json();
        if (!data.ok) {
          setError('lookup-failed');
          return;
        }
        setResolvedLabel(data.address.displayName);
        onLocationResolved(data.address);
      } catch {
        setError('lookup-failed');
      } finally {
        setLocating(false);
      }
    },
    [onLocationResolved]
  );

  const placeMarker = useCallback(
    (lat: number, lon: number, recenter = true) => {
      const L = leafletRef.current;
      const map = mapRef.current;
      if (!L || !map) return;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lon]);
      } else {
        markerRef.current = L.marker([lat, lon], { draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLatLng();
          resolveFromCoords(pos.lat, pos.lng);
        });
      }
      if (recenter) map.setView([lat, lon], PIN_ZOOM);
    },
    [resolveFromCoords]
  );

  // Init the map once, client-side only (Leaflet touches `window`/`document`,
  // so it's dynamically imported here rather than at module scope).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import('leaflet');
      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      // Default marker icon URLs break under bundlers unless re-pointed at
      // the actual asset URLs Next.js emits for the package's images.
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIcon2x.src,
        iconUrl: markerIcon.src,
        shadowUrl: markerShadow.src,
      });

      const map = L.map(mapContainerRef.current, { zoomControl: false }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        placeMarker(e.latlng.lat, e.latlng.lng);
        resolveFromCoords(e.latlng.lat, e.latlng.lng);
      });
      leafletRef.current = L;
      mapRef.current = map;
      setMapReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) {
      setError('unsupported');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        placeMarker(latitude, longitude);
        resolveFromCoords(latitude, longitude);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) setError('denied');
        else if (err.code === err.TIMEOUT) setError('timeout');
        else setError('unavailable');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/geo/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setSuggestions(data.ok ? data.results : []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSuggestionPick = (addr: GeoAddress) => {
    setQuery(addr.displayName);
    setShowSuggestions(false);
    setResolvedLabel(addr.displayName);
    placeMarker(addr.lat, addr.lon);
    onLocationResolved(addr);
  };

  const zoomBy = (delta: number) => {
    const map = mapRef.current;
    if (map) map.setZoom(map.getZoom() + delta);
  };

  const errorMessages: Record<NonNullable<GeoErrorKind>, string> = {
    denied: 'Location access was denied. You can still search for your address below, or allow location access in your browser settings and try again.',
    unavailable: 'Your location could not be determined right now. Please check your GPS/network and try again, or search for your address below.',
    timeout: 'Location detection timed out. Please try again or search for your address below.',
    unsupported: 'Location detection isn’t supported in this browser. Please search for your address below.',
    'lookup-failed': 'Could not look up an address for that location. Please try again or search below.',
  };

  return (
    <div className="border border-[rgba(184,137,58,0.3)] bg-[#f8f2e6]/40 p-4 mb-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <p className="text-[11px] tracking-[1.5px] uppercase text-[#6b5d4c] font-semibold flex items-center gap-1.5">
          <MapPin size={14} className="text-[#b8893a]" /> Detect Delivery Location
        </p>
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="inline-flex items-center gap-1.5 h-9 px-3 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[1.5px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] disabled:opacity-60"
        >
          {locating ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />}
          {locating ? 'Locating…' : 'Use My Location'}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8c75]" />
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search city, area, pincode, or landmark…"
          className="w-full h-10 pl-9 pr-8 border border-[rgba(184,137,58,0.3)] bg-white text-sm focus:outline-none focus:border-[#b8893a]"
        />
        {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8c75] animate-spin" />}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-20 top-full left-0 right-0 bg-white border border-[rgba(184,137,58,0.3)] border-t-0 max-h-56 overflow-y-auto shadow-luxury">
            {suggestions.map((s, i) => (
              <button
                type="button"
                key={i}
                onClick={() => handleSuggestionPick(s)}
                className="w-full text-left px-3 py-2 text-xs text-[#3a2f24] hover:bg-[#f8f2e6] border-b border-[rgba(184,137,58,0.1)] last:border-b-0"
              >
                {s.displayName}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-[#7a2e2e] bg-[#7a2e2e]/5 border border-[#7a2e2e]/20 px-3 py-2 mb-3">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>{errorMessages[error]}</span>
        </div>
      )}

      {resolvedLabel && !error && (
        <p className="text-xs text-[#3d6b5a] mb-3 flex items-start gap-1.5">
          <MapPin size={13} className="flex-shrink-0 mt-0.5" /> {resolvedLabel}
        </p>
      )}

      {/* Map */}
      <div className="relative h-56 border border-[rgba(184,137,58,0.3)]">
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />
        {!mapReady && (
          <div className="absolute inset-0 grid place-items-center bg-[#f8f2e6] text-[#9a8c75] text-xs">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}
        {mapReady && (
          <div className="absolute right-2 top-2 z-10 flex flex-col border border-[rgba(184,137,58,0.3)] bg-white">
            <button type="button" onClick={() => zoomBy(1)} aria-label="Zoom in" className="w-7 h-7 grid place-items-center hover:bg-[#f8f2e6] border-b border-[rgba(184,137,58,0.2)]">
              <Plus size={13} />
            </button>
            <button type="button" onClick={() => zoomBy(-1)} aria-label="Zoom out" className="w-7 h-7 grid place-items-center hover:bg-[#f8f2e6]">
              <Minus size={13} />
            </button>
          </div>
        )}
      </div>
      <p className="text-[10px] text-[#9a8c75] mt-2">
        Tap the map or drag the pin to fine-tune your exact delivery spot.
      </p>
    </div>
  );
}
