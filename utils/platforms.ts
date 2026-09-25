// Single source of truth for the platform enum. The backend still stores `platform` as a free string,
// so `value` is exactly what travels over the wire; `logo` resolves it to a mark in /public/images/platforms.
// Ordered by popularity so the admin dropdown puts the common choices on top.
// `logo`: Simple Icons (CC0) for most; Xbox/Nintendo/Microsoft come from Material Design Icons (Apache-2.0)
// because Simple Icons dropped those marks. No single set covers all eleven.
// `colorLogo` (public-domain trademark, /images/platforms/color): Steam/Xbox/Microsoft/Roblox from
// Wikimedia Commons; Garena traced from the icon mark on official.garena.com's own logo SVG. No compact
// icon-only mark was found for PlayStation (only a wide wordmark), so it falls back to `color`.
export interface Platform {
  value: string
  logo: string
  /** Official full-color app icon (Wikimedia Commons, public-domain trademark), used for the badge on
   *  the product detail page. Only sourced for the platforms buyers see most; falls back to `color`. */
  colorLogo?: string
  /** Official brand hex, used as the badge background behind the monochrome `logo` when there's no `colorLogo`. */
  color?: string
}

export const PLATFORMS: readonly Platform[] = [
  { value: 'Steam', logo: '/images/platforms/steam.svg', colorLogo: '/images/platforms/color/steam.svg' },
  { value: 'PlayStation', logo: '/images/platforms/playstation.svg', color: '#0070D1' },
  { value: 'Xbox', logo: '/images/platforms/xbox.svg', colorLogo: '/images/platforms/color/xbox.svg' },
  { value: 'Garena', logo: '/images/platforms/garena.svg', colorLogo: '/images/platforms/color/garena.svg' },
  { value: 'Roblox', logo: '/images/platforms/roblox.svg', colorLogo: '/images/platforms/color/roblox.svg' },
  { value: 'Epic Games', logo: '/images/platforms/epicgames.svg', color: '#313131' },
  { value: 'Nintendo', logo: '/images/platforms/nintendo.svg', color: '#E60012' },
  { value: 'Battle.net', logo: '/images/platforms/battledotnet.svg', color: '#4381C3' },
  { value: 'EA App', logo: '/images/platforms/ea.svg', color: '#000000' },
  { value: 'Ubisoft Connect', logo: '/images/platforms/ubisoft.svg', color: '#000000' },
  { value: 'Rockstar', logo: '/images/platforms/rockstargames.svg', color: '#FCAF17' },
  { value: 'GOG', logo: '/images/platforms/gogdotcom.svg', color: '#86328A' },
  { value: 'Microsoft', logo: '/images/platforms/microsoft.svg', colorLogo: '/images/platforms/color/microsoft.svg' },
]

/** Returns the enum entry for a stored value, or `undefined` for legacy free-text platforms. */
export function findPlatform(value: string): Platform | undefined {
  return PLATFORMS.find((platform) => platform.value === value)
}
