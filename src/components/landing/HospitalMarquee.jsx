import React, { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import FacilityBadge from '../FacilityBadge';
import { NETWORK_HOSPITALS } from './networkHospitals';

function Row({ hidden = false }) {
  return (
    <ul className="landing-marquee-track" aria-hidden={hidden ? 'true' : undefined}>
      {NETWORK_HOSPITALS.map((h) => (
        <li key={h.name} className="shrink-0">
          <FacilityBadge tone="onDark" name={h.name} code={h.code} logo={h.logo} showName={!h.nameInLogo} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Slow, continuous sideways scroll of the hospitals on the network. Pauses on hover, on keyboard
 * focus and with the Pause button (WCAG 2.2.2). With prefers-reduced-motion it is a static wrapped row.
 */
export default function HospitalMarquee() {
  const [paused, setPaused] = useState(false);
  return (
    <section id="network" aria-labelledby="network-title" className="landing-dark landing-network bg-brand-navy border-t border-white/10 py-10 scroll-mt-16">
      <div className="max-w-[1120px] mx-auto px-5 sm:px-8 flex items-center justify-between gap-4 mb-6">
        <h2 id="network-title" className="text-xs font-bold uppercase tracking-widest text-white/80">Hospitals on the CAELUM network</h2>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className="landing-marquee-toggle inline-flex items-center gap-1.5 min-h-11 px-3 rounded-full text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200"
        >
          {paused ? <Play className="w-3.5 h-3.5" aria-hidden="true" /> : <Pause className="w-3.5 h-3.5" aria-hidden="true" />}
          {paused ? 'Play' : 'Pause'}
          <span className="sr-only"> hospital list animation</span>
        </button>
      </div>
      <div className={`landing-marquee ${paused ? 'is-paused' : ''}`}>
        <Row />
        <Row hidden />
      </div>
    </section>
  );
}
