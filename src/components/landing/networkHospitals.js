// The 16 seeded CAELUM hospitals (API/src/utils/seed.py + seed_extended.py), in a mixed regional order.
// Logo rule (02_DESIGN_SYSTEM.md): only the 8 official hospital logos are used. The other 8 have
// county emblems only, so they get a CAELUM initials badge instead; never add a county crest here.
// Logos are white-on-transparent WebP copies of ~/Pictures/CAELUM-Hospital-Logos for the dark band.
import knh from '../../assets/landing/logos/kenyatta-national-hospital.webp';
import mtrh from '../../assets/landing/logos/moi-teaching-and-referral-hospital.webp';
import nairobi from '../../assets/landing/logos/nairobi-hospital.webp';
import mamaLucy from '../../assets/landing/logos/mama-lucy-kibaki-hospital.webp';
import mbagathi from '../../assets/landing/logos/mbagathi-county-hospital.webp';
import cgtrh from '../../assets/landing/logos/coast-general-teaching-and-referral-hospital.webp';
import jootrh from '../../assets/landing/logos/jaramogi-oginga-odinga-teaching-and-referral-hospital.webp';
import kisumu from '../../assets/landing/logos/kisumu-county-referral-hospital.webp';

// `code`: Level 5 hospitals use "<initial>L5"; the rest use the seed's 3-letter unit prefix so no two badges match.
// `nameInLogo`: the logo already spells out the hospital name, so the visible name is not repeated.
export const NETWORK_HOSPITALS = [
  { name: 'Kenyatta National Hospital', logo: knh },
  { name: 'Thika Level 5 Hospital', code: 'TL5' },
  { name: 'Moi Teaching and Referral Hospital', logo: mtrh },
  { name: 'Naivasha County Referral Hospital', code: 'NCR' },
  { name: 'Coast General Teaching and Referral Hospital', logo: cgtrh },
  { name: 'Kiambu Level 5 Hospital', code: 'KL5' },
  { name: 'Jaramogi Oginga Odinga Teaching and Referral Hospital', logo: jootrh },
  { name: 'Machakos Level 5 Hospital', code: 'ML5' },
  { name: 'Nairobi Hospital Hub', logo: nairobi },
  { name: 'Narok County Referral Hospital', code: 'NRK' },
  { name: 'Mama Lucy Kibaki Hospital', logo: mamaLucy },
  { name: 'Kapsabet County Referral Hospital', code: 'KPS' },
  { name: 'Mbagathi County Hospital', logo: mbagathi, nameInLogo: true },
  { name: 'Nakuru Level 5 Hospital', code: 'NL5' },
  { name: 'Kisumu County Referral Hospital', logo: kisumu },
  { name: 'Port Reitz Sub-County Hospital', code: 'PRZ' },
];
