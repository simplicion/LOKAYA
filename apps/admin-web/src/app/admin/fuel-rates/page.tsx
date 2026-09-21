'use client';

import { useState, useMemo } from 'react';
import {
  useGetFuelRatesQuery,
  useUpdateFuelRateMutation,
  useSeedFuelRatesMutation,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Fuel,
  Search,
  RefreshCw,
  Edit3,
  TrendingUp,
  Globe2,
  CheckCircle2,
  XCircle,
  X,
  Zap,
  Sliders,
  Calculator,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

interface CountryFuelRateItem {
  id: string;
  countryCode: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  fuelPricePerLiter: number;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
}

export default function FuelRatesManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(100);
  const [editingItem, setEditingItem] = useState<CountryFuelRateItem | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');
  const [newIsActive, setNewIsActive] = useState<boolean>(true);

  // Estimator State
  const [calcCountryCode, setCalcCountryCode] = useState<string>('IN');
  const [calcDistanceKm, setCalcDistanceKm] = useState<number>(5.0);

  const {
    data: fuelData,
    isLoading,
    isFetching,
    refetch,
  } = useGetFuelRatesQuery({ search: searchQuery, page, limit });

  const [updateFuelRate, { isLoading: isUpdating }] = useUpdateFuelRateMutation();
  const [seedFuelRates, { isLoading: isSeeding }] = useSeedFuelRatesMutation();

  const rates: CountryFuelRateItem[] = fuelData?.items || [];
  const totalCount = fuelData?.total || 0;
  const totalPages = fuelData?.totalPages || 1;

  // Selected country for calculator widget
  const selectedCalcCountry = useMemo(() => {
    return rates.find((r) => r.countryCode === calcCountryCode) || rates[0] || null;
  }, [rates, calcCountryCode]);

  // Handle Edit Click
  const handleOpenEdit = (item: CountryFuelRateItem) => {
    setEditingItem(item);
    setNewPrice(item.fuelPricePerLiter.toString());
    setNewIsActive(item.isActive);
  };

  // Handle Save
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const parsedPrice = parseFloat(newPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error('Please enter a valid positive fuel price per liter');
      return;
    }

    try {
      await updateFuelRate({
        countryCode: editingItem.countryCode,
        fuelPricePerLiter: parsedPrice,
        isActive: newIsActive,
      }).unwrap();

      toast.success(
        `Updated fuel rate for ${editingItem.countryName} (${editingItem.countryCode}) to ${editingItem.currencySymbol} ${parsedPrice}/L`
      );
      setEditingItem(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update country fuel rate');
    }
  };

  // Handle Refresh / Reseed
  const handleSeedRefresh = async () => {
    try {
      await seedFuelRates().unwrap();
      toast.success('Country fuel rates cache cleared and verified across all regions');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to trigger fuel rates sync');
    }
  };

  // Calculated numbers for modal preview
  const previewFuelPrice = parseFloat(newPrice) || 0;
  const previewBaseFuelCost = previewFuelPrice > 0 ? (previewFuelPrice / 50.0) : 0;
  const previewRiderFloor = previewBaseFuelCost * 1.20;
  const previewStandardRate = Math.round(((previewBaseFuelCost + 1.0) * 1.5) * 10) / 10;

  // Calculator preview values
  const calcFuelPrice = selectedCalcCountry?.fuelPricePerLiter || 102.12;
  const calcSymbol = selectedCalcCountry?.currencySymbol || '₹';
  const calcBaseFuelCostPerKm = calcFuelPrice / 50.0;
  const calcFloorPerKm = Math.round(calcBaseFuelCostPerKm * 1.20 * 10) / 10;
  const calcStandardRatePerKm = Math.round(((calcBaseFuelCostPerKm + 1.0) * 1.5) * 10) / 10;
  const calcTwoWayKm = Math.round(calcDistanceKm * 2 * 10) / 10;
  const calcEstimatedFuel = Math.round(calcTwoWayKm * calcBaseFuelCostPerKm * 10) / 10;
  const calcTotalDeliveryFee = Math.max(50, Math.round(calcTwoWayKm * calcStandardRatePerKm));
  const calcRiderShare = Math.max(Math.round(calcTwoWayKm * calcFloorPerKm), Math.round(calcTotalDeliveryFee * 0.8));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-sm">
              <Fuel className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Global Fuel Rates & Delivery Engine
              </h1>
              <p className="text-sm text-gray-500">
                Live country retail fuel prices. The pricing engine dynamically derives per-km floors & distance fees.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleSeedRefresh}
            disabled={isSeeding}
            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow-sm"
          >
            <Zap className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
            Sync 177+ Countries
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Countries</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount > 0 ? totalCount : 177}</p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 mt-1">
              <Globe2 className="w-3.5 h-3.5" /> ISO 3166 Global Coverage
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Globe2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nepal (NPR)</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              रू {rates.find((r) => r.countryCode === 'NP')?.fuelPricePerLiter?.toFixed(2) || '200.00'}/L
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 mt-1">
              Floor: रू {( (rates.find((r) => r.countryCode === 'NP')?.fuelPricePerLiter || 200) / 50 * 1.2 ).toFixed(1)}/km
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Fuel className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">India (INR)</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              ₹ {rates.find((r) => r.countryCode === 'IN')?.fuelPricePerLiter?.toFixed(2) || '102.12'}/L
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 mt-1">
              Floor: ₹ {( (rates.find((r) => r.countryCode === 'IN')?.fuelPricePerLiter || 102.12) / 50 * 1.2 ).toFixed(1)}/km
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">United States (USD)</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              $ {rates.find((r) => r.countryCode === 'US')?.fuelPricePerLiter?.toFixed(2) || '0.95'}/L
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 mt-1">
              Floor: $ {( (rates.find((r) => r.countryCode === 'US')?.fuelPricePerLiter || 0.95) / 50 * 1.2 ).toFixed(2)}/km
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Layout: Table + Live Pricing Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Country Rates Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
            {/* Search Header */}
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search country, code (e.g. NP, IN, AE)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 bg-white border-gray-200 text-sm h-9 rounded-lg"
                />
              </div>

              <div className="text-xs font-medium text-gray-500">
                Showing {rates.length} of {totalCount} countries
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Country</th>
                    <th className="py-3 px-4">Currency</th>
                    <th className="py-3 px-4 text-right">Fuel Price / Liter</th>
                    <th className="py-3 px-4 text-right">Base / Km (50km/L)</th>
                    <th className="py-3 px-4 text-right">Rider Floor (+20%)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
                        Loading country fuel rates...
                      </td>
                    </tr>
                  ) : rates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
                        No countries match your search query &quot;{searchQuery}&quot;
                      </td>
                    </tr>
                  ) : (
                    rates.map((item) => {
                      const baseFuelCost = item.fuelPricePerLiter / 50.0;
                      const riderFloor = baseFuelCost * 1.20;

                      return (
                        <tr
                          key={item.countryCode}
                          className="hover:bg-amber-50/30 transition-colors group cursor-pointer"
                          onClick={() => setCalcCountryCode(item.countryCode)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-5 rounded bg-gray-100 border border-gray-200 text-[10px] font-bold text-gray-700 flex items-center justify-center">
                                {item.countryCode}
                              </span>
                              <div>
                                <p className="font-semibold text-gray-900">{item.countryName}</p>
                                <p className="text-[11px] text-gray-400">
                                  Updated: {new Date(item.updatedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                              {item.currency} ({item.currencySymbol})
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-bold text-gray-900 font-mono">
                            {item.currencySymbol} {item.fuelPricePerLiter.toFixed(item.fuelPricePerLiter < 5 ? 3 : 2)}
                          </td>

                          <td className="py-3 px-4 text-right text-gray-600 font-mono text-xs">
                            {item.currencySymbol} {baseFuelCost.toFixed(2)}/km
                          </td>

                          <td className="py-3 px-4 text-right font-semibold text-emerald-700 font-mono text-xs">
                            {item.currencySymbol} {riderFloor.toFixed(2)}/km
                          </td>

                          <td className="py-3 px-4 text-center">
                            {item.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-gray-600 bg-gray-100 rounded-full">
                                <XCircle className="w-3 h-3" /> Inactive
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(item)}
                              className="h-8 px-2.5 text-amber-700 hover:text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-medium"
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/40">
                <div>
                  Page {page} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-3 text-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 px-3 text-xs"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Delivery Pricing Engine Simulator (1 Col) */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-6 shadow-md border border-gray-700">
            <div className="flex items-center justify-between border-b border-gray-700 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-400" />
                <h2 className="font-bold text-base">Upfront Engine Simulator</h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                Live Pricing
              </span>
            </div>

            <p className="text-xs text-gray-300 mb-5 leading-relaxed">
              Verify how the dynamic delivery pricing engine calculates fees and rider payouts for any country upfront.
            </p>

            <div className="space-y-4">
              {/* Country Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Selected Country
                </label>
                <select
                  value={calcCountryCode}
                  onChange={(e) => setCalcCountryCode(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                >
                  {rates.map((r) => (
                    <option key={r.countryCode} value={r.countryCode}>
                      {r.countryName} ({r.countryCode}) - {r.currencySymbol} {r.fuelPricePerLiter.toFixed(2)}/L
                    </option>
                  ))}
                </select>
              </div>

              {/* Distance Slider */}
              <div>
                <div className="flex justify-between items-center text-xs text-gray-300 mb-1.5">
                  <span>One-Way Delivery Distance</span>
                  <span className="font-bold text-amber-400 font-mono text-sm">{calcDistanceKm} km</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="25"
                  step="0.5"
                  value={calcDistanceKm}
                  onChange={(e) => setCalcDistanceKm(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>0.5 km</span>
                  <span>10 km (Hub Threshold)</span>
                  <span>25 km</span>
                </div>
              </div>

              {/* Calculation Output Cards */}
              <div className="pt-3 border-t border-gray-700/80 space-y-2.5">
                <div className="flex justify-between text-xs py-1">
                  <span className="text-gray-400">2-Way Round Trip:</span>
                  <span className="font-mono font-semibold text-gray-200">{calcTwoWayKm} km</span>
                </div>

                <div className="flex justify-between text-xs py-1">
                  <span className="text-gray-400">Base Fuel Cost (50 km/L):</span>
                  <span className="font-mono font-semibold text-gray-200">
                    {calcSymbol} {calcBaseFuelCostPerKm.toFixed(2)} / km
                  </span>
                </div>

                <div className="flex justify-between text-xs py-1">
                  <span className="text-gray-400">Rider Min Floor (+20%):</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {calcSymbol} {calcFloorPerKm.toFixed(2)} / km
                  </span>
                </div>

                <div className="flex justify-between text-xs py-1">
                  <span className="text-gray-400">Est. Fuel Consumed:</span>
                  <span className="font-mono font-semibold text-gray-300">
                    {calcSymbol} {calcEstimatedFuel.toFixed(1)}
                  </span>
                </div>

                <div className="bg-gray-800/80 p-3 rounded-xl border border-gray-700 flex justify-between items-center mt-3">
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Customer Delivery Fee</p>
                    <p className="text-xl font-bold text-amber-400 font-mono">
                      {calcSymbol} {calcTotalDeliveryFee}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Rider Payout Floor</p>
                    <p className="text-xl font-bold text-emerald-400 font-mono">
                      {calcSymbol} {calcRiderShare}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Engine Architectural Note */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950 mb-1">Architecture Guarantee</p>
              <p className="leading-relaxed text-amber-900/90">
                The database stores strictly retail country fuel prices. All delivery fees, labor margins, multi-store blended pricing, and rider minimum floors are calculated dynamically in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Fuel Rate Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-amber-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Edit {editingItem.countryName} Fuel Rate
                  </h3>
                  <p className="text-xs text-gray-500">
                    ISO Code: {editingItem.countryCode} | Currency: {editingItem.currency} ({editingItem.currencySymbol})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Retail Fuel Price per Liter ({editingItem.currencySymbol})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400 font-mono">
                    {editingItem.currencySymbol}
                  </span>
                  <Input
                    type="number"
                    step="any"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. 102.12"
                    className="pl-9 font-mono font-bold text-base h-11"
                  />
                </div>
              </div>

              {/* Dynamic Upfront Calculation Preview */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs space-y-2">
                <p className="font-semibold text-gray-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-600" />
                  Live Derived Benchmarks (Upfront Engine)
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div>
                    <span className="text-gray-500">Base Fuel/km:</span>
                    <p className="font-bold text-gray-900">
                      {editingItem.currencySymbol} {previewBaseFuelCost.toFixed(2)}/km
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Rider Min Floor (+20%):</span>
                    <p className="font-bold text-emerald-600">
                      {editingItem.currencySymbol} {previewRiderFloor.toFixed(2)}/km
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between pt-2">
                <label className="text-xs font-semibold text-gray-700">
                  Rate Active in Pricing Engine
                </label>
                <button
                  type="button"
                  onClick={() => setNewIsActive(!newIsActive)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    newIsActive ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      newIsActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUpdating}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isUpdating ? 'Saving...' : 'Save & Update Rate'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
