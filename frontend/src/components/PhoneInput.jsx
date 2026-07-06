import { useState, useRef, useEffect } from "react";

const COUNTRIES = [
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳", length: 10, pattern: /^[6-9]\d{9}$/ },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸", length: 10, pattern: /^[2-9]\d{9}$/ },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧", length: 10, pattern: /^\d{10}$/ },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪", length: 9, pattern: /^5\d{8}$/ },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦", length: 9, pattern: /^5\d{8}$/ },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺", length: 9, pattern: /^4\d{8}$/ },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦", length: 10, pattern: /^[2-9]\d{9}$/ },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬", length: 8, pattern: /^[89]\d{7}$/ },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪", length: 11, pattern: /^1\d{9,10}$/ },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷", length: 9, pattern: /^[67]\d{8}$/ },
  { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵", length: 10, pattern: /^[7-9]0\d{8}$/ },
  { code: "CN", name: "China", dial: "+86", flag: "🇨🇳", length: 11, pattern: /^1\d{10}$/ },
  { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷", length: 11, pattern: /^\d{10,11}$/ },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦", length: 9, pattern: /^[6-8]\d{8}$/ },
  { code: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬", length: 10, pattern: /^[789]\d{9}$/ },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰", length: 10, pattern: /^3\d{9}$/ },
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩", length: 10, pattern: /^1\d{9}$/ },
  { code: "LK", name: "Sri Lanka", dial: "+94", flag: "🇱🇰", length: 9, pattern: /^7\d{8}$/ },
  { code: "NP", name: "Nepal", dial: "+977", flag: "🇳🇵", length: 10, pattern: /^9\d{9}$/ },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾", length: 10, pattern: /^1\d{8,9}$/ },
];


const SORTED_DIAL_CODES = [...COUNTRIES]
  .map((c) => ({ code: c.code, dial: c.dial.replace("+", "") }))
  .sort((a, b) => b.dial.length - a.dial.length);

const PhoneInput = ({
  value,
  countryCode,
  onChange,
  onCountryChange,
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const selectedCountry =
    COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const detectCountryFromInput = (input) => {
    const cleanInput = input.replace(/\D/g, "");

    for (const { code, dial } of SORTED_DIAL_CODES) {
      if (cleanInput.startsWith(dial)) {
        const country = COUNTRIES.find((c) => c.code === code);
        const remaining = cleanInput.slice(dial.length);
        if (remaining.length <= country.length) {
          return { country, phoneDigits: remaining };
        }
      }
    }
    return null;
  };

  const handlePhoneChange = (e) => {
    const rawInput = e.target.value;
    let digits = rawInput.replace(/\D/g, "");

    if (rawInput.startsWith("+") || digits.length > selectedCountry.length) {
      const detected = detectCountryFromInput(digits);

      if (detected && detected.country.code !== selectedCountry.code) {
        onCountryChange(detected.country.code);
        onChange(detected.phoneDigits);
        return;
      } else if (detected) {
        onChange(detected.phoneDigits);
        return;
      }
    }

    if (digits.length > selectedCountry.length) {
      digits = digits.slice(0, selectedCountry.length);
    }

    onChange(digits);
  };

  const handleCountrySelect = (country) => {
    onCountryChange(country.code);
    setIsOpen(false);
    setSearch("");
    onChange(""); 
  };

  const isValid =
    value.length === selectedCountry.length &&
    selectedCountry.pattern.test(value);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`flex rounded-xl border overflow-hidden transition-all
          focus-within:ring-4
          ${
            error
              ? "border-red-400 focus-within:ring-red-100"
              : isValid
              ? "border-green-400 focus-within:ring-green-100"
              : "border-gray-200 focus-within:border-[#D85A30] focus-within:ring-[#D85A30]/10"
          }
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 bg-gray-100 hover:bg-gray-200 
                     border-r border-gray-200 shrink-0 transition-colors 
                     cursor-pointer outline-none focus:bg-gray-200"
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="text-sm font-semibold text-gray-700">
            {selectedCountry.dial}
          </span>
          <svg
            className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <div className="relative flex-1">
          <input
            type="tel"
            inputMode="numeric"
            placeholder={`Enter ${selectedCountry.length}-digit number`}
            value={value}
            onChange={handlePhoneChange}
            disabled={disabled}
            autoComplete="tel"
            className="w-full h-full px-3 py-3 sm:py-3.5 outline-none 
                       text-[15px] bg-gray-50 focus:bg-white 
                       transition-colors rounded-r-xl"
          />

          {value.length > 0 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <span
                className={`text-xs font-medium ${
                  isValid ? "text-green-500" : "text-gray-400"
                }`}
              >
                {value.length}/{selectedCountry.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white 
                     border border-gray-200 rounded-xl shadow-2xl 
                     shadow-black/10 z-50 overflow-hidden"
        >
          <div className="p-3 border-b border-gray-100 sticky top-0 bg-white">
            <div className="relative">
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                autoFocus
                placeholder="Search country or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 
                           rounded-lg outline-none focus:border-[#D85A30] 
                           focus:ring-2 focus:ring-[#D85A30]/10"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 
                             hover:bg-gray-50 transition-colors text-left
                             ${
                               selectedCountry.code === country.code
                                 ? "bg-orange-50"
                                 : ""
                             }`}
                >
                  <span className="text-xl">{country.flag}</span>
                  <span className="flex-1 text-sm font-medium text-gray-800">
                    {country.name}
                  </span>
                  <span className="text-sm text-gray-500 font-mono">
                    {country.dial}
                  </span>
                  {selectedCountry.code === country.code && (
                    <svg
                      className="w-4 h-4 text-[#D85A30]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                No country found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
export { COUNTRIES };