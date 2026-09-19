/**
 * Live OpenStreetMap & Dynamic Global Location Service
 * Resolves user geolocation, country, state/province, currency, and flags
 * dynamically without hardcoding.
 */

export interface LocationContext {
  latitude: number;
  longitude: number;
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2, e.g. "NP", "IN", "US"
  state: string; // e.g. "Bagmati Province", "Maharashtra"
  city: string; // e.g. "Kathmandu", "Mumbai"
  currency: string; // ISO 4217, e.g. "NPR", "INR", "USD"
  currencySymbol: string; // e.g. "रू", "₹", "$"
  flag: string; // e.g. "🇳🇵", "🇮🇳"
  callingCode: string; // e.g. "+977", "+91"
  formattedAddress: string;
  source: 'gps' | 'ip' | 'fallback';
}

// In-memory cache for countries API data
let cachedCountriesData: any[] | null = null;

export class LocationService {
  /**
   * Convert 2-letter ISO country code to Unicode Flag Emoji mathematically.
   * e.g., 'NP' -> '🇳🇵', 'IN' -> '🇮🇳', 'US' -> '🇺🇸'
   */
  static getCountryFlag(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    try {
      const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🌐';
    }
  }

  /**
   * Dynamically resolve currency symbol using native ECMAScript Intl API
   * without hardcoding.
   */
  static getCurrencySymbol(currencyCode: string, countryCode?: string): string {
    if (!currencyCode) return '';
    try {
      // Determine appropriate locale from countryCode if provided
      let locale = 'en-US';
      if (countryCode) {
        const lowerCode = countryCode.toLowerCase();
        if (lowerCode === 'np') locale = 'ne-NP';
        else if (lowerCode === 'in') locale = 'en-IN';
        else if (lowerCode === 'gb') locale = 'en-GB';
        else if (lowerCode === 'jp') locale = 'ja-JP';
        else if (lowerCode === 'de') locale = 'de-DE';
        else locale = `en-${countryCode.toUpperCase()}`;
      }

      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: 'narrowSymbol',
      });

      const parts = formatter.formatToParts(0);
      const symbolPart = parts.find(p => p.type === 'currency');
      if (symbolPart && symbolPart.value) {
        return symbolPart.value;
      }
      return currencyCode;
    } catch {
      return currencyCode;
    }
  }

  /**
   * Fetch live country metadata (currency, calling code, etc.) from global directory.
   */
  static async fetchCountryDirectory(): Promise<any[]> {
    if (cachedCountriesData && cachedCountriesData.length > 0) {
      return cachedCountriesData;
    }

    try {
      const res = await fetch('https://countries-api.davegarvey.workers.dev/countries', {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          cachedCountriesData = data;
          return data;
        }
      }
    } catch (err) {
      console.warn('[LocationService] Countries directory fetch failed:', err);
    }

    return [];
  }

  /**
   * Look up country details by 2-letter ISO code dynamically.
   */
  static async resolveCountryDetails(countryCode: string, fallbackCountryName?: string) {
    const codeUpper = countryCode.toUpperCase();
    const flag = this.getCountryFlag(codeUpper);

    // Query live countries directory
    const countries = await this.fetchCountryDirectory();
    const match = countries.find(
      (c: any) => c.code === codeUpper || c.name?.toLowerCase() === fallbackCountryName?.toLowerCase()
    );

    let currency = match?.currency || 'USD';
    let callingCode = match?.callingCode || '+1';
    const countryName = match?.name || fallbackCountryName || countryCode;

    // Resolve native currency symbol via Intl
    const currencySymbol = this.getCurrencySymbol(currency, codeUpper);

    return {
      countryName,
      countryCode: codeUpper,
      currency,
      currencySymbol,
      callingCode,
      flag: match?.flag || flag,
    };
  }

  /**
   * Reverse-geocode coordinates using live OpenStreetMap Nominatim API.
   */
  static async reverseGeocodeOSM(latitude: number, longitude: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'LokayaSellerApp/1.0',
      },
    });

    if (!res.ok) {
      throw new Error(`OpenStreetMap Nominatim returned status ${res.status}`);
    }

    const data = await res.json();
    const addr = data.address || {};

    const country = addr.country || '';
    const countryCode = (addr.country_code || '').toUpperCase();
    const state = addr.state || addr.province || addr.region || addr.state_district || '';
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.suburb || '';
    const formattedAddress = data.display_name || [city, state, country].filter(Boolean).join(', ');

    return {
      country,
      countryCode,
      state,
      city,
      formattedAddress,
    };
  }

  /**
   * Get fallback location via IP if browser geolocation is unavailable or denied.
   */
  static async getIPLocationFallback() {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        return {
          latitude: data.latitude || 27.7172,
          longitude: data.longitude || 85.3240,
          country: data.country_name || 'Nepal',
          countryCode: (data.country_code || 'NP').toUpperCase(),
          state: data.region || 'Bagmati Province',
          city: data.city || 'Kathmandu',
          currency: data.currency || 'NPR',
          callingCode: data.country_calling_code || '+977',
        };
      }
    } catch {}

    // Graceful default if offline
    return {
      latitude: 27.7172,
      longitude: 85.3240,
      country: 'Nepal',
      countryCode: 'NP',
      state: 'Bagmati Province',
      city: 'Kathmandu',
      currency: 'NPR',
      callingCode: '+977',
    };
  }

  /**
   * Master detection method:
   * 1. Prompts browser GPS geolocation.
   * 2. Runs OpenStreetMap Nominatim reverse geocode live.
   * 3. Dynamically resolves country, currency, symbol, flag, and dial code.
   */
  static async detectUserLocation(forceRefresh = false): Promise<LocationContext> {
    const storageKey = 'lokaya_detected_location_context';
    if (!forceRefresh && typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(storageKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.country && parsed.currency) {
            return parsed;
          }
        }
      } catch {}
    }

    // Try browser GPS first
    let lat: number | null = null;
    let lng: number | null = null;
    let source: 'gps' | 'ip' | 'fallback' = 'gps';

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 7000,
            maximumAge: 60000,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (geoErr) {
        console.warn('[LocationService] Browser GPS prompt denied or timed out:', geoErr);
        source = 'ip';
      }
    } else {
      source = 'ip';
    }

    // If GPS coordinates available, use OpenStreetMap
    if (lat !== null && lng !== null) {
      try {
        const osm = await this.reverseGeocodeOSM(lat, lng);
        const countryDetails = await this.resolveCountryDetails(osm.countryCode, osm.country);

        const result: LocationContext = {
          latitude: lat,
          longitude: lng,
          country: countryDetails.countryName,
          countryCode: countryDetails.countryCode,
          state: osm.state,
          city: osm.city,
          currency: countryDetails.currency,
          currencySymbol: countryDetails.currencySymbol,
          flag: countryDetails.flag,
          callingCode: countryDetails.callingCode,
          formattedAddress: osm.formattedAddress,
          source: 'gps',
        };

        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(storageKey, JSON.stringify(result));
          } catch {}
        }
        return result;
      } catch (osmErr) {
        console.warn('[LocationService] OpenStreetMap reverse geocode failed, falling back to IP:', osmErr);
        source = 'ip';
      }
    }

    // Fallback to IP geolocation
    const ipData = await this.getIPLocationFallback();
    const countryDetails = await this.resolveCountryDetails(ipData.countryCode, ipData.country);

    const result: LocationContext = {
      latitude: ipData.latitude,
      longitude: ipData.longitude,
      country: countryDetails.countryName,
      countryCode: countryDetails.countryCode,
      state: ipData.state,
      city: ipData.city,
      currency: countryDetails.currency,
      currencySymbol: countryDetails.currencySymbol,
      flag: countryDetails.flag,
      callingCode: countryDetails.callingCode,
      formattedAddress: `${ipData.city}, ${ipData.state}, ${countryDetails.countryName}`,
      source,
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(result));
      } catch {}
    }

    return result;
  }
}
