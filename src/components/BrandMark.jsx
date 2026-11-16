import React from 'react';

const BASE = 'rounded-xl bg-brand-burgundy flex items-center justify-center text-white font-extrabold';

/** Shared CAELUM "C" monogram used in the header and on the sign-in screen. */
export default function BrandMark({ className }) {
  return <span className={`${className} ${BASE}`}>C</span>;
}
