import React from 'react';
import BrandMark from './BrandMark';
import FacilityBadge from './FacilityBadge';

/**
 * Image side of the sign-in screen. `brand` comes from the email typed at step 1 or from ?facility=<MFL code>;
 * null shows the neutral CAELUM panel. `strip` is the short faded band shown above the form on phones.
 * The parent re-keys it per hospital, so the photo and mark fade in when the branding changes.
 */
export default function SignInBrandPanel({ brand, strip = false }) {
  const mark = brand && (
    <FacilityBadge tone="panel" size={strip ? 'md' : 'xl'} name={brand.name} code={brand.code} logo={brand.logo}
      accent={brand.accent} logoLoading="eager" className={strip ? 'max-w-full' : 'gap-4'} />
  );
  return (
    <div
      data-testid={strip ? 'brand-strip' : 'brand-panel'}
      className={`relative overflow-hidden bg-brand-navy text-white ${strip
        ? 'md:hidden h-36 px-5 flex items-center auth-strip-fade'
        : 'hidden md:flex flex-col justify-between p-10 lg:p-14 min-h-screen'}`}
    >
      {brand?.banner
        ? <img src={brand.banner} alt="" aria-hidden="true" decoding="async" className="auth-duotone auth-fade-in absolute inset-0 w-full h-full object-cover" />
        : <div className="auth-neutral absolute inset-0" aria-hidden="true" />}
      {brand && <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: brand.accent }} aria-hidden="true" />}
      {strip ? (
        <div className="relative auth-fade-in">{mark || <NeutralMark />}</div>
      ) : (
        <>
          <div className="relative"><NeutralMark small={Boolean(brand)} /></div>
          <div className="relative max-w-md auth-fade-in">
            {mark}
            {brand ? (
              <>
                <p className="mt-6 text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">Welcome back.</p>
                <p className="mt-2 text-base lg:text-lg text-white/85 leading-snug">Blood stock, requests and transfers for {brand.name}.</p>
              </>
            ) : (
              <p className="text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight">Blood stock, requests and transfers for Kenyan hospitals.</p>
            )}
            <p className="mt-3 text-sm text-white/80">Part of the CAELUM national blood network.</p>
          </div>
        </>
      )}
    </div>
  );
}

function NeutralMark({ small = false }) {
  return (
    <span className="inline-flex items-center gap-3">
      <BrandMark className={small ? 'w-8 h-8 text-sm' : 'w-12 h-12 text-xl'} />
      <span className={`${small ? 'text-sm' : 'text-lg'} font-extrabold tracking-tight`}>CAELUM <span className="font-semibold text-white/80">Facility</span></span>
    </span>
  );
}
