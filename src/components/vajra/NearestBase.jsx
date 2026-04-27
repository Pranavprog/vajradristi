import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Phone, MapPin, Radio, Clock } from 'lucide-react';

const BASE_INFO = {
  name: 'NDRF 9th Battalion',
  location: 'Mysuru, Karnataka',
  address: 'Mandakalli, Mysuru – 570027',
  distance: '~12 km from city centre',
  phone: '+91-821-248-6100',
  control: '011-24363260',
  response: '< 30 min',
  status: 'STANDBY',
};

export default function NearestBase() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-lg border border-vajra-red/30 bg-vajra-red/5 p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-vajra-red/20">
          <Shield className="w-3.5 h-3.5 text-vajra-red" />
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-vajra-red">
            Nearest Emergency Base
          </h3>
          <p className="text-[10px] text-muted-foreground font-mono">National Disaster Response Force</p>
        </div>
        <span className="ml-auto text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-vajra-green/20 text-vajra-green border border-vajra-green/30 animate-pulse">
          {BASE_INFO.status}
        </span>
      </div>

      {/* Base name */}
      <div className="font-semibold text-sm text-foreground">{BASE_INFO.name}</div>

      {/* Details */}
      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 text-vajra-cyan mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-foreground/80 font-medium">{BASE_INFO.location}</p>
            <p className="font-mono text-[10px]">{BASE_INFO.address}</p>
            <p className="text-[10px] text-vajra-amber">{BASE_INFO.distance}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-vajra-green flex-shrink-0" />
          <div>
            <p className="font-mono text-foreground/80">{BASE_INFO.phone}</p>
            <p className="text-[10px]">Direct battalion line</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-vajra-purple flex-shrink-0" />
          <div>
            <p className="font-mono text-foreground/80">{BASE_INFO.control}</p>
            <p className="text-[10px]">NDRF National Control Room (24×7)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-vajra-amber flex-shrink-0" />
          <div>
            <p className="font-mono text-vajra-green font-semibold">{BASE_INFO.response}</p>
            <p className="text-[10px]">Estimated response time</p>
          </div>
        </div>
      </div>

      {/* Quick-dial button */}
      <a
        href={`tel:${BASE_INFO.phone}`}
        className="flex items-center justify-center gap-2 w-full py-2 rounded-md bg-vajra-red/20 hover:bg-vajra-red/35 border border-vajra-red/40 text-vajra-red text-xs font-semibold transition-colors"
      >
        <Phone className="w-3.5 h-3.5" />
        Call NDRF Mysuru
      </a>
    </motion.div>
  );
}