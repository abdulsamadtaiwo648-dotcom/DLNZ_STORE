import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Loader2, Navigation, Compass, Play, Pause, Info, CornerDownRight, Settings } from 'lucide-react';
import { Order } from '../types';

// Custom dark map styles for the premium techwear aesthetic
const DARK_MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#747474" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#181818" }] },
  { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#333333" }] },
  { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
  { "featureType": "landscape", "stylers": [{ "color": "#111111" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#303030" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] },
  { "featureType": "road.highway.controlled_access", "elementType": "geometry", "stylers": [{ "color": "#4e4e4e" }] },
  { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#202020" }] },
  { "featureType": "water", "stylers": [{ "color": "#0d0d0d" }] }
];

interface OrderTrackingMapProps {
  order: Order;
}

// Coordinate resolvers for major regions
const getCoordinatesForAddress = (address: string = ''): { lat: number; lng: number; name: string } => {
  const normalized = address.toLowerCase();
  
  if (normalized.includes('abuja') || normalized.includes('fct')) {
    return { lat: 9.0765, lng: 7.3986, name: 'Abuja Logistics Node' };
  }
  if (normalized.includes('port harcourt') || normalized.includes('ph')) {
    return { lat: 4.8156, lng: 7.0498, name: 'Rivers Delivery Hub' };
  }
  if (normalized.includes('ibadan')) {
    return { lat: 7.3775, lng: 3.9470, name: 'Ibadan Trans-depot' };
  }
  if (normalized.includes('kano')) {
    return { lat: 12.0022, lng: 8.5919, name: 'Kano North-Terminal' };
  }
  if (normalized.includes('enugu')) {
    return { lat: 6.4483, lng: 7.5139, name: 'Enugu East-Hub' };
  }
  if (normalized.includes('benin')) {
    return { lat: 6.3350, lng: 5.6269, name: 'Edo Central Junction' };
  }
  if (normalized.includes('ikeja') || normalized.includes('mainland')) {
    return { lat: 6.6018, lng: 3.3515, name: 'Ikeja Mainland Hub' };
  }
  if (normalized.includes('lekki') || normalized.includes('vi') || normalized.includes('island')) {
    return { lat: 6.4281, lng: 3.4219, name: 'Lekki Coastal Terminal' };
  }

  // Generates unique coordinates in Lagos area based on order ID checksum to stay consistent
  const checksum = orderIdHash(address || 'Lagos');
  const latOffset = (checksum % 100) / 1000 - 0.05; // -0.05 to +0.05 variation
  const lngOffset = ((checksum >> 3) % 100) / 1000 - 0.05;

  return { 
    lat: 6.5244 + latOffset, 
    lng: 3.3792 + lngOffset, 
    name: 'Metropolitan Lagos Hub' 
  };
};

// Quick determinic hashing mechanism to keep location pinning stable per order ID
const orderIdHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export function OrderTrackingMap({ order }: OrderTrackingMapProps) {
  const API_KEY =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    '';
  const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

  // Base coordinates (Lagos HQ Dispatch)
  const lagosHQ = { lat: 6.4544, lng: 3.3992 };
  
  // Resolve destination coordinates based on order shippingAddress
  const destInfo = getCoordinatesForAddress(order.shippingAddress || order.customerName);
  const destCoords = order.lat && order.lng ? { lat: order.lat, lng: order.lng } : { lat: destInfo.lat, lng: destInfo.lng };

  // Setup simulation states
  const [transitProgress, setTransitProgress] = useState(0.0);
  const [isSimulating, setIsSimulating] = useState(true);
  const [currentSpeed, setCurrentSpeed] = useState(62); // km/h
  const [lastUpdatedTime, setLastUpdatedTime] = useState('JUST NOW');

  // Interpolate location coordinates based on progress and order status
  const getSimulatedLocation = () => {
    if (order.status === 'Processing' || order.status === 'Hold') {
      return lagosHQ;
    }
    if (order.status === 'Delivered') {
      return destCoords;
    }
    
    // For Shipped, package is in active transit! Interpolate coordinates based on progress percentage
    const lat = lagosHQ.lat + (destCoords.lat - lagosHQ.lat) * transitProgress;
    const lng = lagosHQ.lng + (destCoords.lng - lagosHQ.lng) * transitProgress;
    return { lat, lng };
  };

  const currentLocation = getSimulatedLocation();

  // Progress simulation loop
  useEffect(() => {
    let intervalId: any = null;

    if (isSimulating && order.status === 'Shipped') {
      const step = 0.005; // increment speed
      intervalId = setInterval(() => {
        setTransitProgress((prev) => {
          let next = prev + step;
          if (next >= 1.0) {
            next = 0.0; // cycle back for interactive loop tracking
          }
          return next;
        });
        
        // Randomly modulate speed
        setCurrentSpeed((prev) => {
          const delta = Math.floor(Math.random() * 9) - 4; // -4 to +4
          const nextSpeed = Math.max(45, Math.min(110, prev + delta));
          return nextSpeed;
        });

        // Set live timestamps
        const seconds = new Date().getSeconds();
        setLastUpdatedTime(`SYNCED ${seconds % 2 === 0 ? '0' : ''}${seconds % 10}S AGO`);
      }, 1000);
    } else {
      if (order.status === 'Delivered') {
        setTransitProgress(1.0);
      } else if (order.status === 'Processing' || order.status === 'Hold') {
        setTransitProgress(0.0);
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSimulating, order.status]);

  // Calculate distance in km
  const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // distance in km
    return Math.round(d);
  };

  const totalDistance = getDistanceInKm(lagosHQ.lat, lagosHQ.lng, destCoords.lat, destCoords.lng);
  const remainingDistance = Math.max(0, Math.round(totalDistance * (1 - transitProgress)));
  const estimatedHours = remainingDistance / currentSpeed;
  const etaHours = Math.floor(estimatedHours);
  const etaMinutes = Math.round((estimatedHours - etaHours) * 60);

  return (
    <div className="border border-outline-variant/30 bg-[#0c0c0c] flex flex-col overflow-hidden">
      
      {/* Top Console Header */}
      <div className="bg-brand-charcoal px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/20 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-brand-red animate-ping" />
          <span className="font-technical-sm text-[10px] tracking-[0.25em] font-bold text-white uppercase">
            GEOGRAPHICAL DISPATCH MAP / REAL-TIME COURIER INFRASTRUCTURE
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex border border-outline-variant/20 divide-x divide-outline-variant/20 bg-black/45 h-7">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              disabled={order.status !== 'Shipped'}
              title={isSimulating ? "Pause real-time tracking feed" : "Resume real-time tracking feed"}
              className="px-2.5 flex items-center justify-center text-primary hover:text-brand-red disabled:opacity-30 disabled:hover:text-primary transition-colors cursor-pointer"
            >
              {isSimulating && order.status === 'Shipped' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <div className="px-3 flex items-center justify-center font-technical text-[9px] text-on-surface-variant tracking-wider uppercase font-bold">
              SIMULATOR: {order.status === 'Shipped' ? (isSimulating ? 'LIVE' : 'AUTO-PAUSED') : 'STATIC'}
            </div>
          </div>
          
          <span className="font-mono text-[9px] opacity-40 text-right">{lastUpdatedTime}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[460px]">
        
        {/* Left Side: Live Telemetry Feeds */}
        <div className="lg:col-span-1 border-r border-outline-variant/20 flex flex-col justify-between bg-[#080808]/85 p-6 space-y-8 select-none">
          
          <div className="space-y-6">
            <div>
              <span className="font-technical-sm text-[8.5px] opacity-40 tracking-widest block uppercase mb-1">LOGISTICAL CLASSIFICATION</span>
              <span className="font-display text-lg tracking-tight uppercase font-medium block">
                {order.status === 'Delivered' ? 'DELIVERY FULFILLED' :
                 order.status === 'Shipped' ? 'EN-ROUTE DISPATCH' :
                 order.status === 'Hold' ? 'LOGISTICAL EXCEPTION' : 'HUB-STAGE PREPARATION'}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="font-technical-sm text-[8.5px] opacity-40 tracking-widest block uppercase mb-1.5">INITIAL HUB ORIGIN</span>
                <div className="flex items-start gap-2 bg-black/40 p-2.5 border border-outline-variant/10">
                  <Navigation className="w-3.5 h-3.5 text-primary rotate-45 mt-0.5" />
                  <div>
                    <p className="font-technical text-[10px] text-primary leading-tight font-bold">LAGOS MAIN HQ</p>
                    <p className="text-[9px] text-on-surface-variant mt-0.5 uppercase">NGR // VI DISTRICT DEPO</p>
                  </div>
                </div>
              </div>

              <div>
                <span className="font-technical-sm text-[8.5px] opacity-40 tracking-widest block uppercase mb-1.5">DESTINATION POINT</span>
                <div className="flex items-start gap-2 bg-black/40 p-2.5 border border-outline-variant/10">
                  <LocationPinIcon />
                  <div>
                    <p className="font-technical text-[10px] text-brand-red leading-tight font-bold">{destInfo.name}</p>
                    <p className="text-[9px] text-on-surface-variant mt-0.5 uppercase truncate max-w-[150px]">
                      {order.shippingAddress || 'STREET ADDRESS PENDING'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 border-t border-outline-variant/15 pt-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[8px] font-technical-sm opacity-40 block tracking-widest">TRANSMISSION RATE</span>
                <span className="font-technical font-bold text-sm tracking-tighter text-white">
                  {order.status === 'Shipped' ? `${currentSpeed} KM/H` : '0 KM/H'}
                </span>
              </div>
              <div>
                <span className="text-[8px] font-technical-sm opacity-40 block tracking-widest">REMAINING GAP</span>
                <span className="font-technical font-bold text-sm tracking-tighter text-white">
                  {remainingDistance} KM
                </span>
              </div>
            </div>

            {order.status === 'Shipped' && (
              <div className="bg-brand-red/5 border border-brand-red/10 p-3">
                <span className="text-[8px] font-technical text-brand-red tracking-wider uppercase block font-bold">CALCULATED ARRIVAL</span>
                <span className="font-display font-bold text-lg tracking-tight text-brand-red block">
                  {etaHours > 0 ? `${etaHours}H ` : ''}{etaMinutes}M
                </span>
                <span className="text-[7.5px] font-technical uppercase block opacity-50 mt-1 leading-snug">
                  SUBJECT TO PORT HARCOURT AND ABUJA LOGISTICAL BLOCKADES.
                </span>
              </div>
            )}

            {/* Signal Strength Line */}
            <div className="flex items-center justify-between text-[8px] font-technical opacity-55">
              <span>SAT SIGNAL STRENGTH</span>
              <div className="flex gap-0.5 items-end h-2">
                <div className="w-[2px] h-1 bg-brand-red" />
                <div className="w-[2px] h-1.5 bg-brand-red" />
                <div className="w-[2px] h-2 bg-brand-red animate-pulse" />
                <div className="w-[2px] h-2.5 bg-brand-red" />
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Map Canvas Container */}
        <div className="lg:col-span-3 min-h-[460px] relative bg-[#131313] flex flex-col justify-center items-center">
          
          {hasValidKey ? (
            /* REAL GOOGLE MAP CONTAINER */
            <APIProvider apiKey={API_KEY} version="weekly">
              <div className="w-full h-full min-h-[460px] relative">
                <Map
                  defaultCenter={currentLocation}
                  center={currentLocation}
                  defaultZoom={5}
                  zoom={order.status === 'Shipped' ? 6 : 7}
                  gestureHandling={'cooperative'}
                  disableDefaultUI={true}
                  mapId="DEMO_MAP_ID"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  options={{
                    styles: DARK_MAP_STYLE,
                    backgroundColor: '#131313',
                  }}
                  style={{ width: '100%', height: '100%', minHeight: '460px' }}
                >
                  {/* Lagos HQ Hub Marker */}
                  <AdvancedMarker position={lagosHQ}>
                    <div className="relative group flex items-center justify-center">
                      <div className="absolute w-7 h-7 bg-white/20 border border-white rounded-full animate-ping pointer-events-none" />
                      <div className="w-4 h-4 bg-white border-2 border-black rounded-full flex items-center justify-center font-mono text-[7px] text-black font-bold z-10 shadow-lg">H</div>
                    </div>
                  </AdvancedMarker>

                  {/* Destination Marker */}
                  <AdvancedMarker position={destCoords}>
                    <div className="relative group flex items-center justify-center">
                      <div className="absolute w-7 h-7 bg-brand-red/20 border border-brand-red rounded-full animate-ping pointer-events-none" />
                      <div className="w-4 h-4 bg-brand-red border border-black rounded-full flex items-center justify-center text-white z-10 shadow-lg">
                        <Navigation className="w-2.5 h-2.5 fill-current" />
                      </div>
                    </div>
                  </AdvancedMarker>

                  {/* Active Package Tracker Marker */}
                  {order.status !== 'Cancelled' && (
                    <AdvancedMarker position={currentLocation}>
                      <div className="relative group flex flex-col items-center">
                        {/* Live ping glow for transit */}
                        <div className="absolute -inset-2.5 bg-brand-red/30 rounded-full blur-sm animate-pulse pointer-events-none" />
                        <div className="px-2.5 py-1 bg-black border border-brand-red font-technical text-[8px] text-brand-red tracking-widest uppercase font-bold whitespace-nowrap mb-1.5 shadow-xl select-none">
                          {order.id} : {order.status === 'Shipped' ? `${remainingDistance}KM LEFT` : order.status}
                        </div>
                        <div className="w-5 h-5 bg-black border-2 border-brand-red rounded-full flex items-center justify-center text-brand-red z-30 shadow-2xl animate-bounce">
                          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                        </div>
                      </div>
                    </AdvancedMarker>
                  )}
                </Map>

                {/* Micro instructions overlay */}
                <div className="absolute bottom-4 left-4 bg-black/85 border border-outline-variant/30 px-3.5 py-2.5 font-technical text-[9px] uppercase tracking-wider text-on-surface-variant flex items-center gap-2 select-none">
                  <Info className="w-3.5 h-3.5 text-brand-red animate-pulse" />
                  <span>Actual Satellite Google Maps Active. Right-click or drag to explore.</span>
                </div>
              </div>
            </APIProvider>
          ) : (
            /* HIGH-FIDELITY VECTOR SIMULATION SCREEN (FALLBACK IF GOOGLE_MAPS_PLATFORM_KEY IS MISSING) */
            <div className="w-full h-full min-h-[460px] relative bg-[#0a0a0a] overflow-hidden flex flex-col items-center justify-center p-8 border border-white/5 selection:bg-transparent">
              
              {/* Decorative Tech Grid Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#151515_1px,transparent_1px),linear-gradient(to_bottom,#151515_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-85" />
              
              {/* Grid Radar Swinger */}
              <div className="absolute w-[180%] h-[180%] border-l border-brand-red/5 top-[-40%] left-[-40%] animate-spin origin-center pointer-events-none" style={{ animationDuration: '18s' }} />

              {/* Simulation Vector Graphic */}
              <div className="w-full max-w-lg aspect-[5/3] relative border border-outline-variant/10 rounded-none bg-black/45 p-6 flex flex-col justify-between z-10">
                <div className="flex justify-between items-center text-[7.5px] font-technical opacity-45">
                  <span>MOCK RADAR SCAN COORDINATE: [LGS-ABJ-GRID]</span>
                  <span>PREVIEW PLATFORM v2026.06</span>
                </div>

                {/* The Graphic Canvas */}
                <div className="relative flex-grow my-4 border border-dashed border-outline-variant/15 flex items-center justify-center">
                  
                  {/* Origin Dot (Lagos) */}
                  <div className="absolute left-[15%] top-[70%] flex flex-col items-center">
                    <div className="w-3 h-3 bg-white hover:bg-brand-red border border-black rounded-none shadow flex items-center justify-center text-[6px] text-black font-bold font-mono">H</div>
                    <span className="text-[7px] font-technical opacity-50 mt-1 uppercase">HQ-LAGOS</span>
                  </div>

                  {/* Destination Dot */}
                  <div className="absolute right-[15%] top-[25%] flex flex-col items-center">
                    <div className="w-3 h-3 bg-brand-red border border-black rounded-none shadow flex items-center justify-center">
                      <div className="w-1 h-1 bg-white" />
                    </div>
                    <span className="text-[7.5px] font-technical text-brand-red font-bold mt-1 uppercase">{destInfo.name.split(' ')[0]}</span>
                  </div>

                  {/* Connecting Transit Dash Route */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line 
                      x1="22%" y1="68%" 
                      x2="78%" y2="30%" 
                      stroke="#444444" 
                      strokeWidth="1.5" 
                      strokeDasharray="4 4"
                    />
                    <line 
                      x1="22%" y1="68%" 
                      x2={`${22 + (78-22)*transitProgress}%`} y2={`${68 - (68-30)*transitProgress}%`} 
                      stroke="#8B0000" 
                      strokeWidth="2" 
                    />
                  </svg>

                  {/* Traveling Package Dot */}
                  <div 
                    className="absolute z-20 flex flex-col items-center"
                    style={{
                      left: `calc(${22 + (78-22)*transitProgress}% - 8px)`,
                      top: `calc(${68 - (68-30)*transitProgress}% - 8px)`
                    }}
                  >
                    <div className="relative">
                      <div className="absolute -inset-2 bg-brand-red/35 rounded-full animate-ping pointer-events-none" />
                      <div className="w-4.5 h-4.5 bg-black border border-brand-red text-brand-red rounded-full flex items-center justify-center animate-pulse">
                        <Compass className="w-3 h-3 text-brand-red animate-spin" style={{ animationDuration: '8s' }} />
                      </div>
                    </div>
                  </div>

                  <span className="absolute bottom-2 text-[8px] font-technical uppercase opacity-40">
                    STATUS: {order.status === 'Shipped' ? `DISPATCH COURIER SIMULATING IN TRANSIT (${Math.round(transitProgress*100)}%)` : order.status}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-brand-red/5 p-2.5 border border-brand-red/20">
                  <div className="flex gap-2 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-ping" />
                    <span className="text-[8px] font-technical text-brand-red font-bold uppercase tracking-wider">MOCKUP SIMULATION REVEALED // GOOGLE MAP SECRET REQUIRED</span>
                  </div>
                  <span className="text-[7.5px] font-mono opacity-50 uppercase">MAP REF: {order.id}</span>
                </div>
              </div>

              {/* Setup Configuration CTA Widget */}
              <div className="mt-6 w-full max-w-lg bg-brand-charcoal p-5 border border-outline-variant/30 text-left z-10 shadow-2xl relative">
                <div className="flex items-start gap-3">
                  <Settings className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5 animate-spin" style={{ animationDuration: '10s' }} />
                  <div className="space-y-2">
                    <h4 className="font-display text-xs uppercase font-bold text-white tracking-widest flex items-center gap-2">
                      ACTIVATE LIVE SATELLITE GOOGLE COURIER MAP
                    </h4>
                    <p className="font-body text-[10px] opacity-70 leading-relaxed uppercase">
                      To load the actual Google Maps routing with Advanced Pins and road network calculation, you must insert your Google Maps Key into the secure AI Studio Workspace secrets.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/5 text-[9px] font-technical uppercase">
                      <div>
                        <span className="text-brand-red font-bold block mb-1">STEP 1: ACQUIRE KEY</span>
                        <a 
                          href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-white underline hover:text-brand-red block"
                        >
                          Generate Google GMP Credentials ↗
                        </a>
                      </div>
                      <div>
                        <span className="text-brand-red font-bold block mb-1">STEP 2: ENROLL SECRET</span>
                        <p className="opacity-60 leading-tight">
                          Open gear icon (⚙️) on top-right → Secrets → enroll <strong>GOOGLE_MAPS_PLATFORM_KEY</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Custom simple inline location pin icon
function LocationPinIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-brand-red mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
