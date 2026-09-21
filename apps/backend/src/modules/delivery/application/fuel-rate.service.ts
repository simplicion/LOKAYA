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
      const dbEntry = await (prisma as any).countryFuelRate.findUnique({
        where: { countryCode: normCountry }
      });

      if (dbEntry && dbEntry.isActive !== false) {
        const bikeMileage = 50.0;
        const scooterMileage = 40.0;
        const labor = normCountry === 'NP' ? 2.0 : normCountry === 'US' ? 0.5 : normCountry === 'BD' ? 1.5 : 1.0;
        const fuelPrice = dbEntry.fuelPricePerLiter;
        const baseFuelPerKm = fuelPrice / bikeMileage;
        const standardRate = Math.round((baseFuelPerKm + labor) * 1.5 * 10) / 10;
        const minFloor = normCountry === 'NP' ? 80 : normCountry === 'US' ? 3.5 : normCountry === 'BD' ? 65 : 50;

        const data: FuelBenchmarkData = {
          countryCode: dbEntry.countryCode,
          countryName: dbEntry.countryName,
          currency: dbEntry.currency,
          currencySymbol: dbEntry.currencySymbol,
          fuelPricePerLiter: dbEntry.fuelPricePerLiter,
          standardBikeMileage: bikeMileage,
          standardScooterMileage: scooterMileage,
          baseLaborAllowance: labor,
          minDeliveryFloor: minFloor,
          standardPerKmRate: standardRate,
          longDistanceFlatRate: normCountry === 'NP' ? 150 : normCountry === 'US' ? 5.99 : normCountry === 'BD' ? 110 : 90,
          lastUpdated: dbEntry.updatedAt ? new Date(dbEntry.updatedAt).toISOString() : new Date().toISOString()
        };

        this.cache.set(normCountry, { data, cachedAt: now });
        return data;
      }
    } catch (e) {
      console.warn(`[FuelRateService] Could not query db for ${normCountry}, using built-in fallback.`);
    }

    // Fallback to seed benchmark
    const seed = SEED_BENCHMARKS[normCountry] || SEED_BENCHMARKS['IN'];
    this.cache.set(normCountry, { data: seed, cachedAt: now });
    return seed;
  }

  /**
   * Directly queries the country fuel rate record.
   */
  static async getCountryFuelRate(countryCode = 'IN') {
    const normCountry = (countryCode || 'IN').toUpperCase();
    try {
      const rate = await (prisma as any).countryFuelRate.findUnique({
        where: { countryCode: normCountry }
      });
      if (rate) return rate;
    } catch (err) {
      console.warn(`[FuelRateService] Error fetching country fuel rate for ${normCountry}:`, err);
    }
    const seed = SEED_BENCHMARKS[normCountry] || SEED_BENCHMARKS['IN'];
    return {
      id: `seed-${normCountry}`,
      countryCode: seed.countryCode,
      countryName: seed.countryName,
      currency: seed.currency,
      currencySymbol: seed.currencySymbol,
      fuelPricePerLiter: seed.fuelPricePerLiter,
      isActive: true,
      updatedAt: new Date(),
      createdAt: new Date()
    };
  }

  /**
   * Retrieves paginated list of all country fuel rates for admin management.
   */
  static async getAllCountryRates(search?: string, page = 1, limit = 50) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(250, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const where: any = {};
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { countryCode: { contains: q, mode: 'insensitive' } },
        { countryName: { contains: q, mode: 'insensitive' } },
        { currency: { contains: q, mode: 'insensitive' } },
      ];
    }

    try {
      const [total, items] = await Promise.all([
        (prisma as any).countryFuelRate.count({ where }),
        (prisma as any).countryFuelRate.findMany({
          where,
          orderBy: { countryName: 'asc' },
          skip,
          take: safeLimit
        })
      ]);

      return {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
        items
      };
    } catch (err) {
      console.error('[FuelRateService] Error fetching all country fuel rates:', err);
      return {
        total: 0,
        page: safePage,
        limit: safeLimit,
        totalPages: 0,
        items: []
      };
    }
  }

  /**
   * Updates fuel price per liter or active status for a specific country and invalidates cache.
   */
  static async updateCountryRate(countryCode: string, fuelPricePerLiter: number, isActive?: boolean) {
    const normCountry = countryCode.toUpperCase();
    const data: any = {
      fuelPricePerLiter: Number(fuelPricePerLiter)
    };
    if (isActive !== undefined) {
      data.isActive = Boolean(isActive);
    }

    const updated = await (prisma as any).countryFuelRate.update({
      where: { countryCode: normCountry },
      data
    });

    this.invalidateCache(normCountry);
    return updated;
  }

  /**
   * Invalidates memory cache for a given country or all countries.
   */
  static invalidateCache(countryCode?: string) {
    if (countryCode) {
      this.cache.delete(countryCode.toUpperCase());
    } else {
      this.cache.clear();
    }
  }

  /**
   * Calculates the base fuel cost per kilometer based on vehicle type and live country fuel rate.
   */
  static calculateBaseFuelCostPerKm(vehicleType: VehicleType | string, benchmark: FuelBenchmarkData): number {
    let mileage = benchmark.standardBikeMileage || 50.0;
    if (vehicleType === VehicleType.SCOOTER || vehicleType === 'SCOOTER') {
      mileage = benchmark.standardScooterMileage || 40.0;
    } else if (vehicleType === VehicleType.BICYCLE || vehicleType === 'BICYCLE' || vehicleType === 'WALKER') {
      mileage = benchmark.standardBikeMileage || 50.0;
    }
    return Math.round((benchmark.fuelPricePerLiter / mileage) * 100) / 100;
  }

  /**
   * Calculates the dynamic minimum allowed per-km price floor for a rider (+20% minimum margin).
   * Rider cannot decrease their per-km rate below this floor.
   */
  static calculateMinimumRateFloor(vehicleType: VehicleType | string, benchmark: FuelBenchmarkData): number {
    const baseFuelCost = this.calculateBaseFuelCostPerKm(vehicleType, benchmark);
    const floor = baseFuelCost * 1.20; // 20% minimum margin
    return Math.round(floor * 10) / 10;
  }

  /**
   * Calculates the recommended default rate (+50% margin over base fuel cost).
   */
  static calculateSuggestedRate(vehicleType: VehicleType | string, benchmark: FuelBenchmarkData): number {
    const baseFuelCost = this.calculateBaseFuelCostPerKm(vehicleType, benchmark);
    const suggested = baseFuelCost * 1.50; // 50% recommended margin
    return Math.round(suggested * 10) / 10;
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
    fuelPricePerLiter: number;
    standardBikeMileage: number;
    fuelCostPerKm: number;
    estimatedFuelCost: number;
    estimatedLaborCost: number;
    laborPercentage: number;
  } {
    const twoWayDistanceKm = Math.round(distanceKm * 2 * 10) / 10;
    const fuelCostPerKm = Math.round((benchmark.fuelPricePerLiter / benchmark.standardBikeMileage) * 100) / 100;
    const estimatedFuelCost = Math.round(twoWayDistanceKm * fuelCostPerKm * 10) / 10;

    if (isDeliveryIncluded) {
      return {
        distanceKm,
        twoWayDistanceKm,
        deliveryFee: 0,
        isLongDistance: distanceKm > 10,
        isFreeDelivery: true,
        minFloorApplied: false,
        currencySymbol: benchmark.currencySymbol,
        fuelPricePerLiter: benchmark.fuelPricePerLiter,
        standardBikeMileage: benchmark.standardBikeMileage,
        fuelCostPerKm,
        estimatedFuelCost: 0,
        estimatedLaborCost: 0,
        laborPercentage: 0
      };
    }

    // Long distance threshold (>10km) switches to flat regional hub rate
    if (distanceKm > 10) {
      const finalFee = benchmark.longDistanceFlatRate;
      const estimatedLaborCost = Math.max(0, Math.round((finalFee - estimatedFuelCost) * 10) / 10);
      const laborPercentage = finalFee > 0 ? Math.round((estimatedLaborCost / finalFee) * 100) : 0;

      return {
        distanceKm,
        twoWayDistanceKm,
        deliveryFee: finalFee,
        isLongDistance: true,
        isFreeDelivery: false,
        minFloorApplied: false,
        currencySymbol: benchmark.currencySymbol,
        fuelPricePerLiter: benchmark.fuelPricePerLiter,
        standardBikeMileage: benchmark.standardBikeMileage,
        fuelCostPerKm,
        estimatedFuelCost,
        estimatedLaborCost,
        laborPercentage
      };
    }

    // Hyperlocal 2-way round trip billing
    const rawFee = twoWayDistanceKm * benchmark.standardPerKmRate;
    const finalFee = Math.max(benchmark.minDeliveryFloor, Math.round(rawFee));
    const estimatedLaborCost = Math.max(0, Math.round((finalFee - estimatedFuelCost) * 10) / 10);
    const laborPercentage = finalFee > 0 ? Math.round((estimatedLaborCost / finalFee) * 100) : 0;

    return {
      distanceKm: Math.round(distanceKm * 10) / 10,
      twoWayDistanceKm,
      deliveryFee: finalFee,
      isLongDistance: false,
      isFreeDelivery: false,
      minFloorApplied: rawFee < benchmark.minDeliveryFloor,
      currencySymbol: benchmark.currencySymbol,
      fuelPricePerLiter: benchmark.fuelPricePerLiter,
      standardBikeMileage: benchmark.standardBikeMileage,
      fuelCostPerKm,
      estimatedFuelCost,
      estimatedLaborCost,
      laborPercentage
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
