import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGetAllCountriesQuery, useDetectUserCountryQuery } from "../features/country/countryApi";
import { setCountry, setAllCountries } from "../features/country/countrySlice";
import { toast } from "./Toast";

const CountrySelector = ({ compact = false }) => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { currentCountry } = useSelector((state) => state.country);
  
  const { data: countriesData } = useGetAllCountriesQuery();
  const { data: detectedData } = useDetectUserCountryQuery(undefined, {
    skip: !!localStorage.getItem("userCountry"),
  });

  useEffect(() => {
    if (countriesData?.data) {
      dispatch(setAllCountries(countriesData.data));
    }
  }, [countriesData, dispatch]);

  useEffect(() => {
    if (detectedData?.data && !localStorage.getItem("userCountry")) {
      dispatch(setCountry(detectedData.data));
      toast.info(`📍 Showing prices for ${detectedData.data.flag} ${detectedData.data.name}`);
    }
  }, [detectedData, dispatch]);

  const handleSelect = (country) => {
    dispatch(setCountry(country));
    setOpen(false);
    setSearch("");
    toast.success(`${country.flag} Switched to ${country.name}`);
  };

  const filteredCountries = countriesData?.data?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 ${compact ? "px-2 py-1.5" : "px-3 py-2"} bg-white border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50 transition cursor-pointer font-[inherit] shadow-sm`}
        title={`Shipping to ${currentCountry.name}`}
      >
        <span className="text-xl">{currentCountry.flag}</span>
        {!compact && (
          <>
            <div className="text-left">
              <p className="text-[10px] text-gray-500 m-0 leading-none">Shipping to</p>
              <p className="text-xs font-extrabold text-gray-900 m-0 mt-0.5">{currentCountry.code}</p>
            </div>
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M19 9l-7 7-7-7" strokeLinecap="round" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[9998] bg-black/30" onClick={() => setOpen(false)} />
          
          <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden flex flex-col">
            
            <div className="bg-gradient-to-r from-[#131921] to-[#232F3E] px-5 py-4">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wide m-0">Choose your country</p>
              <p className="text-white text-base font-extrabold m-0 mt-1">
                Where would you like to shop?
              </p>
            </div>

            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search country..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#D85A30] focus:ring-2 focus:ring-[#D85A30]/10 font-[inherit] bg-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-4xl mb-2">🌍</p>
                  <p className="text-sm text-gray-500 m-0">No countries found</p>
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleSelect(country)}
                    className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition border-none cursor-pointer text-left font-[inherit] ${
                      currentCountry.code === country.code ? "bg-orange-50" : "bg-transparent"
                    }`}
                  >
                    <span className="text-3xl shrink-0">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900 m-0 truncate">{country.name}</p>
                        {country.code === currentCountry.code && (
                          <span className="text-[9px] bg-[#D85A30] text-white px-1.5 py-0.5 rounded-full font-extrabold">CURRENT</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 m-0 mt-0.5">
                        {country.currency.symbol} {country.currency.code} · {country.tax.label} {country.tax.rate}%
                      </p>
                    </div>
                    {currentCountry.code === country.code && (
                      <svg width="18" height="18" fill="none" stroke="#D85A30" strokeWidth="3" viewBox="0 0 24 24" className="shrink-0">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-[11px] text-gray-500 m-0">
                💡 Prices, taxes, and shipping will update based on your country
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CountrySelector;