import { prisma, VehicleType } from '@workspace/db';

export interface FuelBenchmarkData {
  countryCode: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  fuelPricePerLiter: number;
  standardBikeMileage: number;
  standardScooterMileage: number;
  baseLaborAllowance: number;
  minDeliveryFloor: number;
  standardPerKmRate: number;
  longDistanceFlatRate: number;
  lastUpdated: string;
}

// Built-in live country operational benchmarks with zero-latency fallback
const SEED_BENCHMARKS: Record<string, FuelBenchmarkData> = {
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    fuelPricePerLiter: 102.0, // ₹102/L
    standardBikeMileage: 50.0, // 50 km/L
    standardScooterMileage: 40.0, // 40 km/L
    baseLaborAllowance: 1.0, // ₹1/km minimum buffer
    minDeliveryFloor: 50.0, // Minimum ₹50 delivery fee
    standardPerKmRate: 15.0, // ₹15/km standard benchmark
    longDistanceFlatRate: 90.0, // ₹90 flat for >10km regional hub
    lastUpdated: new Date().toISOString()
  },
  NP: {
    countryCode: 'NP',
    countryName: 'Nepal',
    currency: 'NPR',
    currencySymbol: 'रू',
    fuelPricePerLiter: 175.0, // रू 175/L
    standardBikeMileage: 45.0,
    standardScooterMileage: 38.0,
    baseLaborAllowance: 2.0,
    minDeliveryFloor: 80.0, // रू 80 floor
    standardPerKmRate: 24.0, // रू 24/km standard benchmark
    longDistanceFlatRate: 150.0, // रू 150 flat for >10km
    lastUpdated: new Date().toISOString()
  },
  BD: {
    countryCode: 'BD',
    countryName: 'Bangladesh',
    currency: 'BDT',
    currencySymbol: '৳',
    fuelPricePerLiter: 130.0,
    standardBikeMileage: 50.0,
    standardScooterMileage: 40.0,
    baseLaborAllowance: 1.5,
    minDeliveryFloor: 65.0,
    standardPerKmRate: 18.0,
    longDistanceFlatRate: 110.0,
    lastUpdated: new Date().toISOString()
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    fuelPricePerLiter: 1.15, // ~$4.35 / gal
    standardBikeMileage: 50.0,
    standardScooterMileage: 40.0,
    baseLaborAllowance: 0.5,
    minDeliveryFloor: 3.50,
    standardPerKmRate: 1.20,
    longDistanceFlatRate: 5.99,
    lastUpdated: new Date().toISOString()
  }
};

export class FuelRateService {
  private static cache = new Map<string, { data: FuelBenchmarkData; cachedAt: number }>();
  private static CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 Hours

  /**
   * Detects the country code (IN, NP, BD, US) from geographic latitude and longitude.
   */
  static detectCountry(latitude?: number, longitude?: number): string {
    if (!latitude || !longitude) return 'IN';

    // Nepal Geographic Bounding Box
    if (latitude >= 26.3 && latitude <= 30.5 && longitude >= 80.0 && longitude <= 88.2) {
      return 'NP';
    }

    // Bangladesh Geographic Bounding Box
    if (latitude >= 20.7 && latitude <= 26.6 && longitude >= 88.0 && longitude <= 92.7) {
      return 'BD';
    }

    // United States Geographic Bounding Box
    if (latitude >= 24.0 && latitude <= 49.5 && longitude >= -125.0 && longitude <= -66.9) {
      return 'US';
    }

    // India Geographic Bounding Box / Default
    if (latitude >= 6.7 && latitude <= 37.5 && longitude >= 68.1 && longitude <= 97.4) {
      return 'IN';
    }

    return 'IN';
  }

  /**
   * Retrieves active fuel benchmark and mileage rates for a country with memory and DB caching.
   */
  static async getFuelBenchmark(countryCode = 'IN'): Promise<FuelBenchmarkData> {
    const normCountry = (countryCode || 'IN').toUpperCase();
    const now = Date.now();

    const cached = this.cache.get(normCountry);
    if (cached && (now - cached.cachedAt) < this.CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const dbEntry = await (prisma as any).countryFuelBenchmark.findUnique({
        where: { countryCode: normCountry }
      });

      if (dbEntry) {
        const bikeMileage = dbEntry.standardBikeMileage || 50.0;
        const fuelPrice = dbEntry.fuelPricePerLiter;
        const labor = dbEntry.baseLaborAllowance || 1.0;
        const baseFuelPerKm = fuelPrice / bikeMileage;
        const standardRate = Math.round((baseFuelPerKm + labor) * 1.5 * 10) / 10;
        const minFloor = normCountry === 'NP' ? 80 : normCountry === 'US' ? 3.5 : 50;

        const data: FuelBenchmarkData = {
          countryCode: dbEntry.countryCode,
          countryName: dbEntry.countryName,
          currency: dbEntry.currency,
          currencySymbol: dbEntry.currencySymbol,
          fuelPricePerLiter: dbEntry.fuelPricePerLiter,
          standardBikeMileage: bikeMileage,
          standardScooterMileage: dbEntry.standardScooterMileage || 40.0,
          baseLaborAllowance: labor,
          minDeliveryFloor: minFloor,
          standardPerKmRate: standardRate,
          longDistanceFlatRate: normCountry === 'NP' ? 150 : normCountry === 'US' ? 5.99 : 90,
          lastUpdated: dbEntry.lastUpdated.toISOString()
        };

        this.cache.set(normCountry, { data, cachedAt: now });
        return data;
      }
    } catch (e) {
      console.warn(`[FuelRateService] Could not query db for ${normCountry}, using built-in benchmark.`);
    }

    // Fallback to seed benchmark
    const seed = SEED_BENCHMARKS[normCountry] || SEED_BENCHMARKS['IN'];
    this.cache.set(normCountry, { data: seed, cachedAt: now });
    return seed;
  }

  /**
   * Calculates the dynamic minimum allowed per-km price floor for a rider based on vehicle type and live country fuel.
   */
  static calculateMinimumRateFloor(vehicleType: VehicleType | string, benchmark: FuelBenchmarkData): number {
    let mileage = benchmark.standardBikeMileage;

    if (vehicleType === VehicleType.SCOOTER || vehicleType === 'SCOOTER') {
      mileage = benchmark.standardScooterMileage;
    } else if (vehicleType === VehicleType.BICYCLE || vehicleType === 'BICYCLE' || vehicleType === 'WALKER') {
      // Non-fuel eco vehicles inherit the standard motorcycle baseline for fair labor compensation
      mileage = benchmark.standardBikeMileage;
    }

    const fuelCostPerKm = benchmark.fuelPricePerLiter / mileage;
    const floor = fuelCostPerKm + benchmark.baseLaborAllowance;
    return Math.round(floor * 10) / 10;
  }

  /**
   * Calculates customer delivery fee using 2-way round trip distance, live fuel benchmarks, and the ₹50 minimum floor.
   */
  static calculateDeliveryFee(
    distanceKm: number,
    benchmark: FuelBenchmarkData,
    isDeliveryIncluded = false
  ): {
    distanceKm: number;
    twoWayDistanceKm: number;
    deliveryFee: number;
    isLongDistance: boolean;
    isFreeDelivery: boolean;
    minFloorApplied: boolean;
    currencySymbol: string;
  } {
    if (isDeliveryIncluded) {
      return {
        distanceKm,
        twoWayDistanceKm: distanceKm * 2,
        deliveryFee: 0,
        isLongDistance: distanceKm > 10,
        isFreeDelivery: true,
        minFloorApplied: false,
        currencySymbol: benchmark.currencySymbol
      };
    }

    // Long distance threshold (>10km) switches to flat regional hub rate
    if (distanceKm > 10) {
      return {
        distanceKm,
        twoWayDistanceKm: distanceKm * 2,
        deliveryFee: benchmark.longDistanceFlatRate,
        isLongDistance: true,
        isFreeDelivery: false,
        minFloorApplied: false,
        currencySymbol: benchmark.currencySymbol
      };
    }

    // Hyperlocal 2-way round trip billing
    const twoWayDistanceKm = Math.round(distanceKm * 2 * 10) / 10;
    const rawFee = twoWayDistanceKm * benchmark.standardPerKmRate;
    const finalFee = Math.max(benchmark.minDeliveryFloor, Math.round(rawFee));

    return {
      distanceKm: Math.round(distanceKm * 10) / 10,
      twoWayDistanceKm,
      deliveryFee: finalFee,
      isLongDistance: false,
      isFreeDelivery: false,
      minFloorApplied: rawFee < benchmark.minDeliveryFloor,
      currencySymbol: benchmark.currencySymbol
    };
  }

  /**
   * Calculates a single blended average delivery fee for carts spanning multiple merchant stores.
   * Instead of adding full standalone delivery fee per store, takes the blended average distance across stores.
   */
  static calculateMultiStoreBlendedFee(
    storeDistances: Array<{ distanceKm: number; isDeliveryIncluded?: boolean }>,
    benchmark: FuelBenchmarkData
  ) {
    if (!storeDistances || storeDistances.length === 0) {
      return this.calculateDeliveryFee(5.0, benchmark);
    }

    const payableStores = storeDistances.filter(s => !s.isDeliveryIncluded);
    if (payableStores.length === 0) {
      return {
        distanceKm: 0,
        blendedDistanceKm: 0,
        twoWayDistanceKm: 0,
        deliveryFee: 0,
        isLongDistance: false,
        isFreeDelivery: true,
        minFloorApplied: false,
        totalStores: storeDistances.length,
        savings: 0,
        currencySymbol: benchmark.currencySymbol
      };
    }

    const sumDistance = payableStores.reduce((acc, s) => acc + s.distanceKm, 0);
    const blendedDistance = Math.round((sumDistance / payableStores.length) * 10) / 10;

    const baseCalculation = this.calculateDeliveryFee(blendedDistance, benchmark, false);

    // Calculate how much the customer saved compared to separate standalone deliveries
    const standaloneSum = payableStores.reduce((acc, s) => {
      const single = this.calculateDeliveryFee(s.distanceKm, benchmark, false);
      return acc + single.deliveryFee;
    }, 0);

    const savings = Math.max(0, standaloneSum - baseCalculation.deliveryFee);

    return {
      ...baseCalculation,
      blendedDistanceKm: blendedDistance,
      totalStores: storeDistances.length,
      payableStoresCount: payableStores.length,
      standaloneSum,
      savings,
      currencySymbol: benchmark.currencySymbol
    };
  }
}
