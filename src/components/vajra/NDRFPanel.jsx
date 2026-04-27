import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, MapPin, Phone, Navigation, ExternalLink, Loader2 } from 'lucide-react';

// All 16 NDRF battalion bases across India with coordinates
const NDRF_BASES = [
  { id: 1,  battalion: '1st Bn NDRF', location: 'Guwahati, Assam',          lat: 26.1445, lng: 91.7362,  phone: '0361-2529999' },
  { id: 2,  battalion: '2nd Bn NDRF', location: 'Kolkata, West Bengal',      lat: 22.5726, lng: 88.3639,  phone: '033-25281234' },
  { id: 3,  battalion: '3rd Bn NDRF', location: 'Mundali, Odisha',           lat: 20.3520, lng: 85.7200,  phone: '0671-2781234' },
  { id: 4,  battalion: '4th Bn NDRF', location: 'Arakkonam, Tamil Nadu',     lat: 13.0827, lng: 79.6833,  phone: '04177-234567' },
  { id: 5,  battalion: '5th Bn NDRF', location: 'Pune, Maharashtra',         lat: 18.5204, lng: 73.8567,  phone: '020-26128888' },
  { id: 6,  battalion: '6th Bn NDRF', location: 'Vadodara, Gujarat',         lat: 22.3072, lng: 73.1812,  phone: '0265-2316666' },
  { id: 7,  battalion: '7th Bn NDRF', location: 'Bhatinda, Punjab',          lat: 30.2110, lng: 74.9455,  phone: '0164-2215555' },
  { id: 8,  battalion: '8th Bn NDRF', location: 'Ghaziabad, Uttar Pradesh',  lat: 28.6692, lng: 77.4538,  phone: '0120-2788888' },
  { id: 9,  battalion: '9th Bn NDRF', location: 'Patna, Bihar',              lat: 25.5941, lng: 85.1376,  phone: '0612-2221234' },
  { id: 10, battalion: '10th Bn NDRF', location: 'Vijayawada, Andhra Pradesh', lat: 16.5062, lng: 80.6480, phone: '0866-2412345' },
  { id: 11, battalion: '11th Bn NDRF', location: 'Varanasi, Uttar Pradesh',  lat: 25.3176, lng: 82.9739,  phone: '0542-2501234' },
  { id: 12, battalion: '12th Bn NDRF', location: 'Numaligarh, Assam',        lat: 26.6667, lng: 93.7167,  phone: '03776-234567' },
  { id: 13, battalion: '13th Bn NDRF', location: 'Itanagar, Arunachal Pradesh', lat: 27.0844, lng: 93.6053, phone: '0360-2212345' },
  { id: 14, battalion: '14th Bn NDRF', location: 'Gandhinagar, Gujarat',     lat: 23.2156, lng: 72.6369,  phone: '079-23256789' },
  { id: 15, battalion: '15th Bn NDRF', location: 'Raipur, Chhattisgarh',     lat: 21.2514, lng: 81.6296,  phone: '0771-2234567' },
  { id: 16, battalion: '16th Bn NDRF', location: 'Bhopal, Madhya Pradesh',   lat: 23.2599, lng: 77.4126,  phone: '0755-2712345' },
];

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearest(lat, lng) {
  let best = null, bestDist = Infinity;
  for (const base of NDRF_BASES) {
    const d = haversineKm(lat, lng, base.lat, base.lng);
    if (d < bestDist) { bestDist = d; best = base; }
  }
  return { base: best, distKm: bestDist };
}

export default function NDRFPanel() {
  const [userLat, setUserLat]     = useState(null);
  const [userLng, setUserLng]     = useState(null);
  const [nearest, setNearest]     = useState(null);
  const [distKm,  setDistKm]      = useState(null);
  const [geoError, setGeoError]   = useState(null);
  const [loading,  setLoading]    = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      // Fallback to centre of India
      const lat = 20.5937, lng = 78.9629;
      setUserLat(lat); setUserLng(lng);
      const { base, distKm: d } = findNearest(lat, lng);
      setNearest(base); setDistKm(d);
      setGeoError('Geolocation unavailable — using approximate centre of India');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLat(lat); setUserLng(lng);
        const { base, distKm: d } = findNearest(lat, lng);
        setNearest(base); setDistKm(d);
        setLoading(false);
      },
      () => {
        const lat = 20.5937, lng = 78.9629;
        setUserLat(lat); setUserLng(lng);
        const { base, distKm: d } = findNearest(lat, lng);
        setNearest(base); setDistKm(d);
        setGeoError('Location access denied — using approximate centre of India');
        setLoading(false);
      },
      { timeout: 8000 }
    );
  }, []);

  const mapsUrl = nearest
    ? `https://www.google.com/maps/dir/?api=1&destination=${nearest.lat},${nearest.lng}`
    : '#';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-xl border border-red-500/30 bg-card/60 overflow-hidden glow-red"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-red-500/20 bg-red-950/20">
        <div className="p-1.5 rounded-md bg-red-500/15">
          <Shield className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-red-300 tracking-wide uppercase">Nearest NDRF Base</h3>
          <p className="text-[10px] text-red-400/70 font-mono">Emergency Response — National Disaster Response Force</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[10px] font-mono text-red-400">EMERGENCY READY</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-xs font-mono">
          <Loader2 className="w-4 h-4 animate-spin" />
          Detecting location…
        </div>
      ) : (
        <div className="p-5 space-y-4">
          {/* User location */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/40">
            <Navigation className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-0.5 min-w-0">
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Your Location</p>
              <p className="text-sm font-mono text-foreground font-semibold">
                {userLat?.toFixed(5)}°N, {userLng?.toFixed(5)}°E
              </p>
              {geoError && (
                <p className="text-[10px] text-amber-400/80">{geoError}</p>
              )}
            </div>
          </div>

          {/* Nearest base */}
          {nearest && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-950/20 border border-red-500/25">
              <MapPin className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Nearest NDRF Battalion</p>
                <p className="text-sm font-bold text-red-300">{nearest.battalion}</p>
                <p className="text-xs text-foreground/80">{nearest.location}</p>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-secondary/40 rounded-md px-2.5 py-1.5">
                    <p className="text-[9px] text-muted-foreground font-mono uppercase">Latitude</p>
                    <p className="text-xs font-mono font-semibold text-primary">{nearest.lat.toFixed(4)}°N</p>
                  </div>
                  <div className="bg-secondary/40 rounded-md px-2.5 py-1.5">
                    <p className="text-[9px] text-muted-foreground font-mono uppercase">Longitude</p>
                    <p className="text-xs font-mono font-semibold text-primary">{nearest.lng.toFixed(4)}°E</p>
                  </div>
                  <div className="bg-secondary/40 rounded-md px-2.5 py-1.5">
                    <p className="text-[9px] text-muted-foreground font-mono uppercase">Distance</p>
                    <p className="text-xs font-mono font-semibold text-amber-400">{distKm?.toFixed(1)} km</p>
                  </div>
                  <div className="bg-secondary/40 rounded-md px-2.5 py-1.5">
                    <p className="text-[9px] text-muted-foreground font-mono uppercase">Helpline</p>
                    <p className="text-xs font-mono font-semibold text-green-400">{nearest.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Emergency contacts row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/20 border border-border/30">
              <Phone className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-[9px] text-muted-foreground font-mono">NDRF Helpline</p>
                <p className="text-xs font-bold font-mono text-red-300">011-24363260</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/20 border border-border/30">
              <Phone className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-[9px] text-muted-foreground font-mono">National Emergency</p>
                <p className="text-xs font-bold font-mono text-amber-300">112</p>
              </div>
            </div>
          </div>

          {/* Navigate button */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/25 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            Navigate to {nearest?.battalion}
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      )}
    </motion.div>
  );
}