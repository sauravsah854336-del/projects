const CompetitionAlert = ({ competition, currency = "₹" }) => {
  if (!competition || competition.count === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl p-4 sm:p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-extrabold text-indigo-900 m-0">Market Insight</p>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-300 px-2 py-0.5 rounded-full">
              {competition.count} SELLER{competition.count > 1 ? "S" : ""}
            </span>
          </div>
          <p className="text-xs text-indigo-700 mt-0.5 m-0">
            Other vendors are already selling similar products
          </p>
        </div>
      </div>

      {competition.priceRange && (
        <div className="bg-white rounded-xl p-3 mb-4 border border-indigo-100">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide m-0 mb-2">Current Market Price</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-[10px] text-gray-500 m-0">Lowest</p>
              <p className="text-sm font-extrabold text-green-600 m-0">{currency}{competition.priceRange.min.toLocaleString()}</p>
            </div>
            <div className="text-center border-x border-gray-100">
              <p className="text-[10px] text-gray-500 m-0">Average</p>
              <p className="text-sm font-extrabold text-gray-900 m-0">{currency}{competition.priceRange.avg.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-500 m-0">Highest</p>
              <p className="text-sm font-extrabold text-orange-600 m-0">{currency}{competition.priceRange.max.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-bold text-indigo-900 m-0 mb-2 flex items-center gap-1.5">
          <span>💡</span> Tips to stand out:
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { icon: "💰", text: "Set competitive pricing" },
            { icon: "📸", text: "Upload high-quality photos" },
            { icon: "🚚", text: "Offer fast shipping" },
            { icon: "📝", text: "Write detailed descriptions" },
          ].map((tip) => (
            <div key={tip.text} className="flex items-center gap-2 text-xs text-indigo-800">
              <span>{tip.icon}</span>
              <span>{tip.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompetitionAlert;