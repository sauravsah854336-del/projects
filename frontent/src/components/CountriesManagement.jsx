import { useState } from "react";
import { 
  useGetAllCountriesQuery, 
  useUpdateExchangeRatesMutation,
  useAdminUpdateCountryMutation,
  useToggleCountryStatusMutation,
} from "../features/country/countryApi";
import { toast } from "./Toast";

const CountriesManagement = () => {
  const { data: countriesData, isLoading } = useGetAllCountriesQuery();
  const [updateRates, { isLoading: updating }] = useUpdateExchangeRatesMutation();
  const [updateCountry] = useAdminUpdateCountryMutation();
  const [toggleStatus] = useToggleCountryStatusMutation();
  
  const [editingCountry, setEditingCountry] = useState(null);
  const [editValues, setEditValues] = useState({});

  const handleUpdateRates = async () => {
    try {
      const res = await updateRates().unwrap();
      toast.success(res.message);
    } catch (err) {
      toast.error("Failed to update rates");
    }
  };

  const handleToggle = async (code) => {
    try {
      await toggleStatus(code).unwrap();
      toast.success("Status updated");
    } catch {
      toast.error("Failed to toggle");
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateCountry({ code: editingCountry, ...editValues }).unwrap();
      toast.success("Country updated");
      setEditingCountry(null);
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="fade-up">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 m-0">Country & Currency Management</h2>
          <p className="text-xs text-gray-500 mt-1 m-0">{countriesData?.data?.length || 0} countries configured</p>
        </div>
        <button 
          onClick={handleUpdateRates}
          disabled={updating}
          className="bg-gradient-to-r from-[#4338ca] to-[#6366f1] text-white border-none rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer disabled:opacity-50 hover:brightness-110 transition font-[inherit] shadow-lg shadow-indigo-200"
        >
          {updating ? "Updating..." : "🔄 Update Exchange Rates"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {countriesData?.data?.map((country) => (
          <div key={country.code} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex gap-4 flex-1 min-w-0">
                <span className="text-5xl shrink-0">{country.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base font-extrabold text-gray-900 m-0">{country.name}</h3>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">{country.code}</span>
                    {country.isDefault && <span className="text-xs bg-indigo-100 text-[#4338ca] px-2 py-0.5 rounded font-bold">DEFAULT</span>}
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${country.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {country.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-500 uppercase font-bold m-0">Currency</p>
                      <p className="text-sm font-extrabold text-gray-900 m-0">{country.currency.symbol} {country.currency.code}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-500 uppercase font-bold m-0">Rate (vs INR)</p>
                      <p className="text-sm font-extrabold text-gray-900 m-0">{country.exchangeRate}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-500 uppercase font-bold m-0">{country.tax.label}</p>
                      <p className="text-sm font-extrabold text-gray-900 m-0">{country.tax.rate}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-500 uppercase font-bold m-0">Free Ship Over</p>
                      <p className="text-sm font-extrabold text-gray-900 m-0">{country.currency.symbol}{country.shipping.freeShippingThreshold}</p>
                    </div>
                  </div>

                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {country.paymentMethods.map(method => (
                      <span key={method} className="text-[10px] bg-indigo-50 text-[#4338ca] px-2 py-1 rounded-full font-bold uppercase">
                        {method}
                      </span>
                    ))}
                  </div>

                  <p className="text-[11px] text-gray-400 mt-2 m-0">
                    Last updated: {new Date(country.lastRateUpdate).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditingCountry(country.code);
                    setEditValues({
                      exchangeRate: country.exchangeRate,
                      "tax.rate": country.tax.rate,
                      "shipping.freeShippingThreshold": country.shipping.freeShippingThreshold,
                    });
                  }}
                  className="bg-indigo-50 text-[#4338ca] border border-indigo-200 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-indigo-100 transition font-[inherit]"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleToggle(country.code)}
                  className={`border rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition font-[inherit] ${
                    country.isActive 
                      ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" 
                      : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  }`}
                >
                  {country.isActive ? "🚫 Disable" : "✓ Enable"}
                </button>
              </div>
            </div>

            {editingCountry === country.code && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">Exchange Rate</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editValues.exchangeRate}
                      onChange={(e) => setEditValues({...editValues, exchangeRate: parseFloat(e.target.value)})}
                      className="w-full border-[1.5px] border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4338ca] font-[inherit]"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleSaveEdit} className="bg-[#4338ca] text-white border-none rounded-lg px-4 py-2 text-xs font-bold cursor-pointer hover:bg-[#3730a3] transition font-[inherit]">Save</button>
                  <button onClick={() => setEditingCountry(null)} className="bg-white text-gray-700 border border-gray-200 rounded-lg px-4 py-2 text-xs font-bold cursor-pointer hover:bg-gray-50 transition font-[inherit]">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountriesManagement;