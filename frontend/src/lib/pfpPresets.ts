/**
 * Preset profile pictures (SVGs converted to data URLs) and helpers for TidyBiz
 */

export interface PfpPreset {
  id: string;
  name: string;
  url: string;
}

// Crisp, lightweight, hermetic SVG avatars that never fail network requests
const svgToDataUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export const PFP_PRESETS: PfpPreset[] = [
  {
    id: 'pfp-1',
    name: 'Executive Studio',
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#E8EB39"/>
        <circle cx="50" cy="38" r="18" fill="#222321"/>
        <path d="M22 84 C22 62, 34 56, 50 56 C66 56, 78 62, 78 84 Z" fill="#222321"/>
        <circle cx="50" cy="38" r="15" fill="#FFE0B2"/>
        <path d="M35 34 C35 24, 65 24, 65 34 C65 30, 58 26, 50 26 C42 26, 35 30, 35 34 Z" fill="#222321"/>
      </svg>
    `),
  },
  {
    id: 'pfp-2',
    name: 'Creative Warmth',
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#F43F5E"/>
        <circle cx="50" cy="40" r="17" fill="#FFEDD5"/>
        <path d="M24 86 C24 64, 36 58, 50 58 C64 58, 76 64, 76 86 Z" fill="#FFFFFF"/>
        <path d="M33 34 C33 22, 67 22, 67 34 C60 22, 40 22, 33 34 Z" fill="#9F1239"/>
      </svg>
    `),
  },
  {
    id: 'pfp-3',
    name: 'Operations Minimal',
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#0284C7"/>
        <circle cx="50" cy="39" r="17" fill="#FDE68A"/>
        <path d="M22 86 C22 64, 35 57, 50 57 C65 57, 78 64, 78 86 Z" fill="#0F172A"/>
        <path d="M33 32 Q50 18 67 32 Q50 24 33 32 Z" fill="#0F172A"/>
      </svg>
    `),
  },
  {
    id: 'pfp-4',
    name: 'Care & Focus',
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#10B981"/>
        <circle cx="50" cy="39" r="17" fill="#FEF08A"/>
        <path d="M22 86 C22 65, 34 58, 50 58 C66 58, 78 65, 78 86 Z" fill="#064E3B"/>
        <path d="M34 32 C34 20, 66 20, 66 32 Z" fill="#064E3B"/>
      </svg>
    `),
  },
  {
    id: 'pfp-5',
    name: 'Dispatch Amber',
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#F59E0B"/>
        <circle cx="50" cy="39" r="17" fill="#FED7AA"/>
        <path d="M22 86 C22 65, 34 58, 50 58 C66 58, 78 65, 78 86 Z" fill="#78350F"/>
        <path d="M32 35 C32 23, 68 23, 68 35 Z" fill="#451A03"/>
      </svg>
    `),
  },
  {
    id: 'pfp-6',
    name: 'Charcoal Monogram',
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#222321"/>
        <circle cx="50" cy="50" r="42" fill="none" stroke="#E8EB39" stroke-width="3"/>
        <text x="50" y="62" font-family="sans-serif" font-weight="bold" font-size="34" fill="#FFFFFF" text-anchor="middle">TB</text>
      </svg>
    `),
  },
];
