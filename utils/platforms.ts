// Single source of truth for the platform enum. The backend still stores `platform` as a free string,
// so `value` is exactly what travels over the wire; `logo` resolves it to a mark in /public/images/platforms.
// Ordered by popularity so the admin dropdown puts the common choices on top.
// Logos: Simple Icons (CC0) for most; Xbox/Nintendo/Microsoft come from Material Design Icons (Apache-2.0)
// because Simple Icons dropped those marks. No single set covers all eleven.
export interface Platform {
  value: string
  logo: string
}

export const PLATFORMS: readonly Platform[] = [
  { value: 'Steam', logo: '/images/platforms/steam.svg' },
  { value: 'PlayStation', logo: '/images/platforms/playstation.svg' },
  { value: 'Xbox', logo: '/images/platforms/xbox.svg' },
  { value: 'Epic Games', logo: '/images/platforms/epicgames.svg' },
  { value: 'Nintendo', logo: '/images/platforms/nintendo.svg' },
  { value: 'Battle.net', logo: '/images/platforms/battledotnet.svg' },
  { value: 'EA App', logo: '/images/platforms/ea.svg' },
  { value: 'Ubisoft Connect', logo: '/images/platforms/ubisoft.svg' },
  { value: 'Rockstar', logo: '/images/platforms/rockstargames.svg' },
  { value: 'GOG', logo: '/images/platforms/gogdotcom.svg' },
  { value: 'Microsoft', logo: '/images/platforms/microsoft.svg' },
]

/** Returns the enum entry for a stored value, or `undefined` for legacy free-text platforms. */
export function findPlatform(value: string): Platform | undefined {
  return PLATFORMS.find((platform) => platform.value === value)
}
