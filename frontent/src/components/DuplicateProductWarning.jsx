import { useNavigate } from "react-router-dom";

const DuplicateProductWarning = ({ duplicate, onClose, onEdit }) => {
  const navigate = useNavigate();

  if (!duplicate) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(duplicate._id);
    } else {
      navigate(`/vendor/dashboard?tab=products&edit=${duplicate._id}`);
    }
  };

  const fieldLabels = {
    name: "product name",
    sku: "SKU code",
    modelNumber: "model number",
  };

  const fieldLabel = fieldLabels[duplicate.matchType] || "details";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 relative">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0 backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-white/80 uppercase tracking-wider">Duplicate Product Detected</p>
              <h2 className="text-lg font-extrabold text-white m-0 mt-1">You already sell this product</h2>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📦</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide m-0">Existing Product</p>
                <p className="text-base font-extrabold text-gray-900 mt-1 mb-1 truncate">{duplicate.name}</p>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                    Same {fieldLabel}
                  </span>
                  {duplicate.sku && (
                    <span className="text-[10px] font-bold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                      SKU: {duplicate.sku}
                    </span>
                  )}
                  {duplicate.modelNumber && (
                    <span className="text-[10px] font-bold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                      Model: {duplicate.modelNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
            <div className="flex items-start gap-2.5">
              <span className="text-lg shrink-0">💡</span>
              <div>
                <p className="text-sm font-bold text-blue-900 m-0 mb-1">Instead of creating duplicate:</p>
                <p className="text-xs text-blue-700 m-0 leading-relaxed">
                  Update your existing product to change price, stock, images, or other details.
                  This keeps your catalog clean and preserves customer reviews.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleEdit}
              className="w-full bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] hover:brightness-110 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all border-none cursor-pointer font-[inherit] flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Edit Existing Product
            </button>

            <button
              onClick={onClose}
              className="w-full bg-white text-gray-700 py-3 rounded-xl font-semibold text-sm border-2 border-gray-200 hover:bg-gray-50 transition-all cursor-pointer font-[inherit]"
            >
              Change Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicateProductWarning;