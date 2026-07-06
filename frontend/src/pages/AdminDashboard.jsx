import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import AdminCategoryManager from "../components/admin/AdminCategoryManager";
import {
  useGetPendingVendorsQuery,
  useGetAllVendorsQuery,
  useApproveVendorMutation,
  useRejectVendorMutation,
  useGetAdminStatsQuery,
  useGetAllAdminsQuery,
  useGetAllCustomersQuery,
  useGetSingleCustomerQuery,
  useBlockCustomerMutation,
  useUnblockCustomerMutation,
  useDeleteCustomerMutation,
  useSuspendVendorMutation,
  useUnsuspendVendorMutation,
  useUpdateVendorCommissionMutation,
  useCreateAdminMutation,
} from "../features/auth/authApi";
import { useUploadSingleImageMutation } from "../features/upload/uploadApi";
import {
  useAdminGetAllProductsQuery,
  useFeatureProductMutation,
  useDelistProductMutation,
  useRelistProductMutation,
} from "../features/product/productApi";
import {
  useAdminGetAllOrdersQuery,
  useAdminCancelOrderMutation,
} from "../features/order/orderApi";
import {
  useAdminGetAllReviewsQuery,
  useDeleteReviewMutation,
} from "../features/review/reviewApi";
import {
  useAdminGetAllCouponsQuery,
  useAdminCreateCouponMutation,
  useAdminUpdateCouponMutation,
  useAdminDeleteCouponMutation,
  useAdminToggleCouponMutation,
} from "../features/coupon/couponApi";
import { toast } from "../components/Toast";

const categoryIcons = {
  furniture: "🛋️",
  kitchen: "🍳",
  electronics: "📱",
  walls: "🧱",
  decorative: "🖼️",
  upholstery: "🧵",
  finishes: "🎨",
  floors: "🪵",
  furnishing: "🪟",

  sofas: "🛋️",
  chairs: "🪑",
  tables: "🪑",
  beds: "🛏️",
  wardrobes: "🚪",
  shelves: "📚",
  desks: "🖥️",
  cabinets: "🗄️",

  cookware: "🍳",
  appliances: "🔌",
  utensils: "🍴",
  storage: "📦",
  dining: "🍽️",
  smartphones: "📱",
  laptops: "💻",
  tablets: "📱",
  cameras: "📷",
  headphones: "🎧",
  speakers: "🔊",
  gaming: "🎮",
  wearables: "⌚",
  tv: "📺",
  printers: "🖨️",

  "wall art": "🖼️",
  wallpaper: "🎨",
  clocks: "🕐",
  mirrors: "🪞",
  shelving: "📚",
  decor: "🏠",

  fashion: "👗",
  clothing: "👔",
  cloth: "👕",
  "men's clothing": "👔",
  "women's clothing": "👗",
  "kids clothing": "👶",
  shoes: "👟",
  footwear: "👞",

  accessories: "⌚",
  bags: "👜",
  jewelry: "💍",
  watches: "⌚",
  sunglasses: "🕶️",
  belts: "👔",
  hats: "🧢",

  "home decor": "🏠",
  "home & living": "🏡",
  "living room": "🛋️",
  bedroom: "🛏️",
  bathroom: "🚿",
  outdoor: "🏡",
  garden: "🌿",
  lighting: "💡",
  curtains: "🪟",
  rugs: "🧶",
  cushions: "🛋️",

  beauty: "💄",
  skincare: "🧴",
  haircare: "💇",
  makeup: "💄",
  fragrance: "🌸",
  "personal care": "🧼",

  health: "💊",
  fitness: "💪",
  supplements: "💊",
  yoga: "🧘",
  sports: "⚽",


  cricket: "🏏",
  football: "⚽",
  basketball: "🏀",
  tennis: "🎾",
  swimming: "🏊",
  cycling: "🚴",
  camping: "⛺",
  hiking: "🥾",

  books: "📚",
  stationery: "✏️",
  notebooks: "📓",
  pens: "🖊️",
  art: "🎨",

  toys: "🧸",
  games: "🎲",
  puzzles: "🧩",
  "baby products": "👶",
  "kids furniture": "🪑",

  grocery: "🛒",
  food: "🍔",
  snacks: "🍪",
  beverages: "🥤",
  organic: "🥬",
  dairy: "🥛",
  bakery: "🍞",

  automotive: "🚗",
  "car accessories": "🚗",
  "bike accessories": "🏍️",


  office: "💼",
  "office furniture": "🖥️",
  "office supplies": "📎",


  pets: "🐾",
  "dog supplies": "🐕",
  "cat supplies": "🐈",


  music: "🎵",
  instruments: "🎸",
  movies: "🎬",


  travel: "✈️",
  luggage: "🧳",
  "travel accessories": "🎒",

  tools: "🔧",
  hardware: "🔩",
  plumbing: "🚿",
  electrical: "⚡",
  paint: "🎨",

  cleaning: "🧹",
  laundry: "👕",
  "cleaning supplies": "🧽",


  christmas: "🎄",
  diwali: "🪔",
  holi: "🎨",
  valentine: "❤️",
  "new year": "🎆",

  gifts: "🎁",
  crafts: "✂️",
  flowers: "💐",
  candles: "🕯️",
  antiques: "🏺",
};

const formatRupee = (amt) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amt || 0);

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const statusMap = {
  confirmed: {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
  pending: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  processing: {
    bg: "bg-indigo-100",
    text: "text-indigo-800",
    dot: "bg-indigo-500",
  },
  shipped: {
    bg: "bg-violet-100",
    text: "text-violet-800",
    dot: "bg-violet-500",
  },
  out_for_delivery: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    dot: "bg-amber-500",
  },
  delivered: {
    bg: "bg-green-100",
    text: "text-green-800",
    dot: "bg-green-500",
  },
  cancelled: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  returned: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
  refunded: { bg: "bg-pink-100", text: "text-pink-800", dot: "bg-pink-500" },
  approved: {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
  rejected: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  suspended: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    dot: "bg-amber-500",
  },
  active: {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
  blocked: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  inactive: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
  delisted: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
};

const statusLabel = {
  confirmed: "Confirmed",
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  refunded: "Refunded",
  approved: "Live",
  rejected: "Rejected",
  suspended: "Suspended",
  active: "Active",
  blocked: "Blocked",
  inactive: "Inactive",
  delisted: "Delisted",
};

const Badge = ({ status }) => {
  const cfg = statusMap[status] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {statusLabel[status] || status}
    </span>
  );
};

const InfoRow = ({ label, value, mono }) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
    <span className="text-xs text-gray-500 font-medium shrink-0 mr-4">
      {label}
    </span>
    <span
      className={`text-xs text-gray-900 font-semibold text-right break-all ${mono ? "font-mono" : ""}`}
    >
      {value || "—"}
    </span>
  </div>
);

const SecTitle = ({ icon, title }) => (
  <div className="flex items-center gap-2 pt-3 pb-2 mt-2">
    <span className="text-sm">{icon}</span>
    <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#4338ca]">
      {title}
    </span>
  </div>
);

const DocPreview = ({ label, doc }) => {
  if (!doc?.url)
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-100">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <span className="text-[11px] text-gray-400 italic">Not uploaded</span>
      </div>
    );
  const isPdf = doc.url.endsWith(".pdf") || doc.filename?.endsWith(".pdf");
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <p className="text-xs text-gray-500 font-medium mb-1.5 m-0">{label}</p>
      <div className="flex items-center gap-2.5">
        {isPdf ? (
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="#EF4444"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path
                d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                strokeLinecap="round"
              />
              <path d="M14 2v6h6M9 13h6M9 17h4" strokeLinecap="round" />
            </svg>
          </div>
        ) : (
          <img
            src={doc.url}
            alt={label}
            className="w-10 h-10 rounded-lg object-cover border border-gray-200"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        )}
        <div>
          <p className="text-[11px] text-gray-700 font-semibold m-0">
            {doc.filename || "Document"}
          </p>
          <a
            href={doc.url}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-[#4338ca] font-semibold no-underline hover:underline"
          >
            View Document →
          </a>
        </div>
      </div>
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer border transition-all duration-200 font-[inherit] ${
      active
        ? "bg-white text-[#4338ca] border-white shadow-md"
        : "bg-white/10 text-white border-white/20 hover:bg-white/20"
    }`}
  >
    <span className="text-base">{icon}</span>
    {label}
    {badge > 0 && (
      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow">
        {badge > 9 ? "9+" : badge}
      </span>
    )}
  </button>
);

const FilterBtn = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer border transition-all capitalize font-[inherit] ${
      active
        ? "bg-[#4338ca] text-white border-[#4338ca]"
        : "bg-white text-gray-600 border-gray-200 hover:border-[#4338ca] hover:text-[#4338ca]"
    }`}
  >
    {children}
  </button>
);

const ActionBtn = ({ variant = "view", onClick, children, className = "" }) => {
  const cls = {
    approve:
      "bg-green-100 text-green-800 border-green-200 hover:bg-green-500 hover:text-white",
    reject:
      "bg-red-100 text-red-800 border-red-200 hover:bg-red-500 hover:text-white",
    view: "bg-indigo-100 text-[#4338ca] border-indigo-200 hover:bg-[#4338ca] hover:text-white",
    delete: "bg-red-50 text-red-800 border-red-200 hover:bg-red-100",
    warn: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-500 hover:text-white",
    info: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-500 hover:text-white",
  };
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer border transition-all font-[inherit] ${cls[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const PageBtn = ({ active, onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all font-[inherit] disabled:opacity-40 disabled:cursor-not-allowed ${
      active
        ? "bg-[#4338ca] text-white border-[#4338ca]"
        : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
    }`}
  >
    {children}
  </button>
);

const EmptyState = ({ icon, title, subtitle }) => (
  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
      {icon}
    </div>
    <p className="text-base font-bold text-gray-900 m-0">{title}</p>
    {subtitle && (
      <p className="text-[13px] text-gray-500 mt-2 m-0">{subtitle}</p>
    )}
  </div>
);

const Spinner = ({ text }) => (
  <div className="text-center py-12">
    <div className="w-8 h-8 border-[3px] border-[#4338ca] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
    <p className="text-gray-500 text-[13px] m-0">{text}</p>
  </div>
);

const RejectPanel = ({
  show,
  reason,
  setReason,
  onConfirm,
  onCancel,
  placeholder,
}) => {
  if (!show) return null;
  return (
    <div className="px-5 py-3 bg-red-50 border-t border-red-200">
      <p className="text-xs font-bold text-red-600 mb-2 m-0">
        ⚠️ Provide a reason
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={placeholder || "Reason..."}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="flex-1 border border-red-200 rounded-lg px-3 py-2.5 text-[13px] outline-none focus:border-red-400 bg-white font-[inherit]"
        />
        <button
          onClick={onConfirm}
          className="bg-red-500 text-white border-none rounded-lg px-4 py-2.5 text-xs font-bold cursor-pointer hover:bg-red-600 transition font-[inherit]"
        >
          Confirm
        </button>
        <button
          onClick={onCancel}
          className="bg-white text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-semibold cursor-pointer hover:bg-gray-50 transition font-[inherit]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  sub,
  iconBg = "bg-indigo-50",
  iconColor = "text-[#4338ca]",
  trend,
}) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <div
        className={`w-12 h-12 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center text-xl`}
      >
        {icon}
      </div>
      {trend !== undefined && (
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${trend >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
        >
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-2xl font-black text-gray-900 m-0 leading-none">
      {value}
    </p>
    <p className="text-sm text-gray-500 mt-1.5 m-0">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5 m-0">{sub}</p>}
  </div>
);

const ProductImg = ({ src, alt, size = "72px" }) => (
  <div
    className="bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shrink-0"
    style={{ width: size, height: size }}
  >
    <img
      src={src || "https://placehold.co/80?text=No"}
      alt={alt}
      className="w-full h-full object-contain p-1"
      onError={(e) => {
        e.target.src = "https://placehold.co/80?text=No";
      }}
    />
  </div>
);

const LineChart = ({ data, height = 200, color = "#4338ca" }) => {
  if (!data || data.length === 0) return null;
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const min = 0;
  const width = 100;
  const padding = 5;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
      const y =
        height - ((d.value - min) / (max - min || 1)) * (height - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `${padding},${height} ${points} ${width - padding},${height}`;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#areaGrad)" />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
          const y =
            height - ((d.value - min) / (max - min || 1)) * (height - 20) - 10;
          return <circle key={i} cx={x} cy={y} r="0.8" fill={color} />;
        })}
      </svg>
      <div className="flex justify-between mt-2 px-1">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] text-gray-400 font-semibold">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const DonutChart = ({ data, size = 160 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;
  const radius = 60;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        className="shrink-0"
      >
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        {data.map((d, i) => {
          const percent = (d.value / total) * 100;
          const dash = (percent / 100) * circumference;
          const gap = circumference - dash;
          const rotation = (offset / 100) * 360 - 90;
          offset += percent;
          return (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeLinecap="butt"
              transform={`rotate(${rotation} 80 80)`}
              style={{ transition: "all 0.5s ease" }}
            />
          );
        })}
        <text
          x="80"
          y="76"
          textAnchor="middle"
          className="text-2xl font-black fill-gray-900"
        >
          {total}
        </text>
        <text
          x="80"
          y="92"
          textAnchor="middle"
          className="text-[10px] font-semibold fill-gray-500"
        >
          Total
        </text>
      </svg>
      <div className="flex-1 flex flex-col gap-2 min-w-[140px]">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ background: d.color }}
            />
            <span className="text-xs text-gray-600 flex-1">{d.label}</span>
            <span className="text-xs font-bold text-gray-900">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const setActiveTab = (tab) => setSearchParams({ tab });

  const { data: statsData, isLoading: statsLoading } = useGetAdminStatsQuery();
  const stats = statsData?.data;

  const { data: pendingData, isLoading: vendorsLoading } =
    useGetPendingVendorsQuery();
  const [vendorStatusFilter, setVendorStatusFilter] = useState("");
  const [vendorPage, setVendorPage] = useState(1);
  const { data: allVendorsData, isLoading: allVendorsLoading } =
    useGetAllVendorsQuery({
      status: vendorStatusFilter,
      page: vendorPage,
    });
  const [approveVendor] = useApproveVendorMutation();
  const [rejectVendor] = useRejectVendorMutation();
  const [suspendVendor] = useSuspendVendorMutation();
  const [unsuspendVendor] = useUnsuspendVendorMutation();
  const [updateVendorCommission] = useUpdateVendorCommissionMutation();
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendingId, setSuspendingId] = useState(null);
  const [expandedVendor, setExpandedVendor] = useState(null);
  const [commissionEdit, setCommissionEdit] = useState({});
  const [commissionValue, setCommissionValue] = useState("");
  const [vendorView, setVendorView] = useState("pending");

  const [customerPage, setCustomerPage] = useState(1);
  const [customerStatusFilter, setCustomerStatusFilter] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearchInput, setCustomerSearchInput] = useState("");
  const { data: customersData, isLoading: customersLoading } =
    useGetAllCustomersQuery({
      page: customerPage,
      status: customerStatusFilter,
      search: customerSearch,
    });
  const [blockCustomer] = useBlockCustomerMutation();
  const [unblockCustomer] = useUnblockCustomerMutation();
  const [deleteCustomer] = useDeleteCustomerMutation();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { data: customerDetailData } = useGetSingleCustomerQuery(
    selectedCustomer,
    {
      skip: !selectedCustomer,
    },
  );
  const [blockingId, setBlockingId] = useState(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState(null);

  const { data: adminsData, isLoading: adminsLoading } = useGetAllAdminsQuery();
  const [createAdmin] = useCreateAdminMutation();
  const [adminForm, setAdminForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [adminFormError, setAdminFormError] = useState("");
  const [adminFormLoading, setAdminFormLoading] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [productStatusFilter, setProductStatusFilter] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productSearchInput, setProductSearchInput] = useState("");
  const { data: productsData, isLoading: productsLoading } =
    useAdminGetAllProductsQuery({
      status: productStatusFilter,
      search: productSearch,
    });
  const [featureProduct] = useFeatureProductMutation();
  const [delistProduct] = useDelistProductMutation();
  const [relistProduct] = useRelistProductMutation();
  const [delistingId, setDelistingId] = useState(null);
  const [delistReason, setDelistReason] = useState("");
  const [expandedProduct, setExpandedProduct] = useState(null);

  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderSearchInput, setOrderSearchInput] = useState("");
  const { data: ordersData, isLoading: ordersLoading } =
    useAdminGetAllOrdersQuery({
      status: orderStatusFilter,
      page: orderPage,
      search: orderSearch,
    });
  const [adminCancelOrder] = useAdminCancelOrderMutation();
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelOrderReason, setCancelOrderReason] = useState("");

  const [reviewRatingFilter, setReviewRatingFilter] = useState(undefined);
  const [reviewSort, setReviewSort] = useState("newest");
  const [reviewPage, setReviewPage] = useState(1);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const { data: reviewsData, isLoading: reviewsLoading } =
    useAdminGetAllReviewsQuery({
      rating: reviewRatingFilter,
      sort: reviewSort,
      page: reviewPage,
      limit: 10,
    });
  const [deleteReview] = useDeleteReviewMutation();

  const [couponStatusFilter, setCouponStatusFilter] = useState("");
  const [couponTypeFilter, setCouponTypeFilter] = useState("");
  const [couponSearch, setCouponSearch] = useState("");
  const [couponSearchInput, setCouponSearchInput] = useState("");
  const [couponPage, setCouponPage] = useState(1);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const initialCouponForm = {
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    maxDiscountAmount: "",
    minOrderAmount: "",
    expiryDate: "",
    usageLimit: "",
    usageLimitPerUser: "1",
    firstTimeUserOnly: false,
    isPublic: true,
  };
  const [couponForm, setCouponForm] = useState(initialCouponForm);
  const [deletingCouponId, setDeletingCouponId] = useState(null);

  const { data: couponsData, isLoading: couponsLoading } =
    useAdminGetAllCouponsQuery({
      status: couponStatusFilter,
      type: couponTypeFilter,
      search: couponSearch,
      page: couponPage,
    });
  const [createCoupon, { isLoading: creatingCoupon }] =
    useAdminCreateCouponMutation();
  const [updateCoupon, { isLoading: updatingCoupon }] =
    useAdminUpdateCouponMutation();
  const [deleteCoupon] = useAdminDeleteCouponMutation();
  const [toggleCoupon] = useAdminToggleCouponMutation();

  const handleApprove = async (vendorId) => {
    try {
      await approveVendor(vendorId).unwrap();
      setExpandedVendor(null);
      toast.success("Vendor approved!");
    } catch {
      toast.error("Failed to approve vendor");
    }
  };

  const handleReject = async (vendorId) => {
    try {
      await rejectVendor({ vendorId, reason: rejectReason }).unwrap();
      setRejectingId(null);
      setRejectReason("");
      setExpandedVendor(null);
      toast.success("Vendor rejected");
    } catch {
      toast.error("Failed to reject vendor");
    }
  };

  const handleSuspend = async (vendorId) => {
    try {
      await suspendVendor({ vendorId, reason: suspendReason }).unwrap();
      setSuspendingId(null);
      setSuspendReason("");
      toast.success("Vendor suspended");
    } catch {
      toast.error("Failed to suspend vendor");
    }
  };

  const handleUnsuspend = async (vendorId) => {
    try {
      await unsuspendVendor(vendorId).unwrap();
      toast.success("Vendor unsuspended");
    } catch {
      toast.error("Failed to unsuspend vendor");
    }
  };

  const handleUpdateCommission = async (vendorId) => {
    try {
      await updateVendorCommission({
        vendorId,
        commission: Number(commissionValue),
      }).unwrap();
      setCommissionEdit({});
      setCommissionValue("");
      toast.success("Commission updated!");
    } catch {
      toast.error("Failed to update commission");
    }
  };



  const handleFeatureProduct = async (id) => {
    try {
      await featureProduct(id).unwrap();
      toast.success("Feature toggled");
    } catch {
      toast.error("Failed");
    }
  };

  const handleDelistProduct = async (id) => {
    try {
      await delistProduct({ id, reason: delistReason }).unwrap();
      setDelistingId(null);
      setDelistReason("");
      toast.success("Product delisted");
    } catch {
      toast.error("Failed to delist");
    }
  };

  const handleRelistProduct = async (id) => {
    try {
      await relistProduct(id).unwrap();
      toast.success("Product relisted — now live");
    } catch {
      toast.error("Failed to relist");
    }
  };

  const handleAdminCancelOrder = async (orderId, reason) => {
    try {
      await adminCancelOrder({ id: orderId, reason }).unwrap();
      setCancellingOrderId(null);
      setCancelOrderReason("");
      toast.success("Order cancelled");
    } catch {
      toast.error("Failed to cancel order");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview({ reviewId }).unwrap();
      setDeletingReviewId(null);
      toast.success("Review deleted");
    } catch {
      toast.error("Failed");
    }
  };

  const handleBlockCustomer = async (userId) => {
    try {
      await blockCustomer(userId).unwrap();
      setBlockingId(null);
      toast.success("Customer blocked successfully");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to block customer");
    }
  };

  const handleUnblockCustomer = async (userId) => {
    try {
      await unblockCustomer(userId).unwrap();
      toast.success("Customer unblocked successfully");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to unblock customer");
    }
  };

  const handleDeleteCustomer = async (userId) => {
    try {
      await deleteCustomer(userId).unwrap();
      setDeletingCustomerId(null);
      setSelectedCustomer(null);
      toast.success("Customer deleted");
    } catch {
      toast.error("Failed");
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminFormError("");
    const { firstName, lastName, email, phone, password } = adminForm;
    if (!firstName || !lastName || !email || !phone || !password) {
      setAdminFormError("All fields are required");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setAdminFormError("Enter valid 10-digit phone");
      return;
    }
    setAdminFormLoading(true);
    try {
      await createAdmin({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      }).unwrap();
      setAdminForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
      });
      setShowAdminForm(false);
      toast.success("Admin created successfully!");
    } catch (err) {
      setAdminFormError(err?.data?.message || "Failed to create admin");
    } finally {
      setAdminFormLoading(false);
    }
  };

  const openCreateCoupon = () => {
    setEditingCoupon(null);
    setCouponForm(initialCouponForm);
    setShowCouponForm(true);
  };

  const openEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue || "",
      maxDiscountAmount: coupon.maxDiscountAmount || "",
      minOrderAmount: coupon.minOrderAmount || "",
      expiryDate: coupon.expiryDate?.split("T")[0] || "",
      usageLimit: coupon.usageLimit || "",
      usageLimitPerUser: coupon.usageLimitPerUser || 1,
      firstTimeUserOnly: coupon.firstTimeUserOnly,
      isPublic: coupon.isPublic,
    });
    setShowCouponForm(true);
  };

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...couponForm,
        discountValue: Number(couponForm.discountValue) || 0,
        maxDiscountAmount: Number(couponForm.maxDiscountAmount) || null,
        minOrderAmount: Number(couponForm.minOrderAmount) || 0,
        usageLimit: Number(couponForm.usageLimit) || null,
        usageLimitPerUser: Number(couponForm.usageLimitPerUser) || 1,
      };
      if (editingCoupon) {
        await updateCoupon({ id: editingCoupon._id, ...payload }).unwrap();
        toast.success("Coupon updated!");
      } else {
        await createCoupon(payload).unwrap();
        toast.success("Coupon created!");
      }
      setShowCouponForm(false);
      setCouponForm(initialCouponForm);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save coupon");
    }
  };

  const handleDeleteCoupon = async (id, code) => {
    try {
      await deleteCoupon(id).unwrap();
      setDeletingCouponId(null);
      toast.success(`Coupon "${code}" deleted`);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleToggleCoupon = async (id) => {
    try {
      await toggleCoupon(id).unwrap();
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update");
    }
  };

  const getCouponStatusBadge = (coupon) => {
    const now = new Date();
    if (!coupon.isActive)
      return { text: "Inactive", color: "bg-gray-100 text-gray-700" };
    if (new Date(coupon.expiryDate) < now)
      return { text: "Expired", color: "bg-red-100 text-red-700" };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
      return { text: "Fully Used", color: "bg-orange-100 text-orange-700" };
    return { text: "Active", color: "bg-green-100 text-green-700" };
  };

  const pendingVendorCount = pendingData?.data?.length || 0;
  const inputCls =
    "w-full border-[1.5px] border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#4338ca] focus:ring-2 focus:ring-[#4338ca]/10 transition bg-white font-[inherit]";

  const dailyData = stats?.revenue?.daily
    ? Object.entries(stats.revenue.daily)
    : [];
  const maxDaily =
    dailyData.length > 0 ? Math.max(...dailyData.map(([, v]) => v), 1) : 1;

  const chartLineData = dailyData.map(([date, value]) => ({
    label: new Date(date).toLocaleDateString("en-IN", { weekday: "short" }),
    value,
  }));

  const orderStatusChart = [
    {
      label: "Delivered",
      value: stats?.orders?.delivered || 0,
      color: "#10b981",
    },
    { label: "Pending", value: stats?.orders?.pending || 0, color: "#f59e0b" },
    {
      label: "Processing",
      value: stats?.orders?.processing || 0,
      color: "#6366f1",
    },
    {
      label: "Cancelled",
      value: stats?.orders?.cancelled || 0,
      color: "#ef4444",
    },
  ].filter((d) => d.value > 0);

  const userStatusChart = [
    {
      label: "Active Customers",
      value: stats?.customers?.active || 0,
      color: "#4338ca",
    },
    {
      label: "Blocked",
      value: stats?.customers?.blocked || 0,
      color: "#ef4444",
    },
    {
      label: "Approved Vendors",
      value: stats?.vendors?.approved || 0,
      color: "#10b981",
    },
    {
      label: "Pending Vendors",
      value: stats?.vendors?.pending || 0,
      color: "#f59e0b",
    },
  ].filter((d) => d.value > 0);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "analytics", label: "Analytics", icon: "📈" },
    { key: "vendors", label: "Vendors", icon: "🏪", badge: pendingVendorCount },
    { key: "customers", label: "Customers", icon: "👥" },
    { key: "admins", label: "Admins", icon: "👑" },
    { key: "categories", label: "Categories", icon: "📂" },
    { key: "products", label: "Products", icon: "📦" },
    { key: "orders", label: "Orders", icon: "🛒" },
    { key: "coupons", label: "Coupons", icon: "🎟️" },
    { key: "reviews", label: "Reviews", icon: "⭐" },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.25s ease both; }
      `}</style>

      <div className="bg-gradient-to-br from-[#3730a3] via-[#4338ca] to-[#4f46e5] shadow-lg shadow-indigo-200/50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin/profile")}
                className="relative cursor-pointer group bg-transparent border-none p-0"
                title="Go to Profile"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#4338ca] font-black text-xl shadow-lg overflow-hidden group-hover:scale-105 transition-transform">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    user?.firstName?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-400 rounded-full border-2 border-white shadow" />
              </button>
              <div>
                <p className="text-indigo-200 text-xs font-medium m-0">
                  {greeting()} 👋
                </p>
                <h1 className="text-white font-black text-xl sm:text-2xl m-0 mt-0.5">
                  {user?.firstName} {user?.lastName}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="bg-red-500/20 text-red-100 border border-red-400/30 text-xs font-bold px-2.5 py-1 rounded-full">
                    👑 Admin
                  </span>
                  <span className="text-indigo-200 text-xs">{user?.email}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => navigate("/admin/profile")}
                className="flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer hover:bg-white/20 transition font-[inherit]"
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                >
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                My Profile
              </button>
            </div>
          </div>

          {!statsLoading && stats && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Total Revenue",
                  value: formatRupee(stats?.revenue?.total),
                  icon: "💰",
                },
                {
                  label: "Total Orders",
                  value: stats?.orders?.total || 0,
                  icon: "🛒",
                },
                {
                  label: "Customers",
                  value: stats?.customers?.total || 0,
                  icon: "👥",
                },
                {
                  label: "Vendors",
                  value: stats?.vendors?.total || 0,
                  icon: "🏪",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3.5 flex items-center gap-3"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-white font-extrabold text-lg m-0 leading-none">
                      {item.value}
                    </p>
                    <p className="text-indigo-200 text-[11px] mt-0.5 m-0">
                      {item.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-1.5 mt-6 flex-wrap">
            {tabs.map((tab) => (
              <TabBtn
                key={tab.key}
                active={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                icon={tab.icon}
                label={tab.label}
                badge={tab.badge}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === "overview" && (
          <div className="flex flex-col gap-5 fade-up">
            {statsLoading ? (
              <Spinner text="Loading dashboard..." />
            ) : (
              <>
                {pendingVendorCount > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3.5">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl shrink-0">
                      ⚠️
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-800 m-0">
                        {pendingVendorCount} vendor application
                        {pendingVendorCount > 1 ? "s" : ""} awaiting review
                      </p>
                      <p className="text-xs text-amber-600 m-0 mt-0.5">
                        Review and approve to grow your marketplace
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab("vendors");
                        setVendorView("pending");
                      }}
                      className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-amber-200 transition font-[inherit] whitespace-nowrap"
                    >
                      Review Now →
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon="💰"
                    label="Total Revenue"
                    value={formatRupee(stats?.revenue?.total)}
                    sub="All delivered orders"
                    iconBg="bg-indigo-50"
                    iconColor="text-[#4338ca]"
                  />
                  <StatCard
                    icon="📅"
                    label="This Month"
                    value={formatRupee(stats?.revenue?.thisMonth)}
                    sub={`Last: ${formatRupee(stats?.revenue?.lastMonth)}`}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                  />
                  <StatCard
                    icon="🛒"
                    label="Total Orders"
                    value={stats?.orders?.total || 0}
                    sub={`${stats?.orders?.thisMonth || 0} this month`}
                    iconBg="bg-violet-50"
                    iconColor="text-violet-600"
                  />
                  <StatCard
                    icon="👥"
                    label="Customers"
                    value={stats?.customers?.total || 0}
                    sub={`${stats?.customers?.active || 0} active`}
                    iconBg="bg-emerald-50"
                    iconColor="text-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon="🏪"
                    label="Total Vendors"
                    value={stats?.vendors?.total || 0}
                    sub={`${stats?.vendors?.approved || 0} approved`}
                    iconBg="bg-pink-50"
                    iconColor="text-pink-600"
                  />
                  <StatCard
                    icon="⏳"
                    label="Pending Vendors"
                    value={stats?.vendors?.pending || 0}
                    sub="Awaiting review"
                    iconBg="bg-amber-50"
                    iconColor="text-amber-600"
                  />
                  <StatCard
                    icon="📦"
                    label="Total Products"
                    value={stats?.products?.total || 0}
                    sub={`${stats?.products?.approved || 0} live`}
                    iconBg="bg-teal-50"
                    iconColor="text-teal-600"
                  />
                  <StatCard
                    icon="👑"
                    label="Admins"
                    value={stats?.admins?.total || 0}
                    sub="Platform admins"
                    iconBg="bg-red-50"
                    iconColor="text-red-600"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-sm font-extrabold text-gray-900 m-0">
                          Revenue — Last 7 Days
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5 m-0">
                          {formatRupee(
                            dailyData.reduce((s, [, v]) => s + v, 0),
                          )}{" "}
                          this week
                        </p>
                      </div>
                      <div className="w-9 h-9 bg-indigo-50 text-[#4338ca] rounded-xl flex items-center justify-center text-lg">
                        📈
                      </div>
                    </div>
                    {dailyData.length > 0 ? (
                      <div className="flex items-end gap-2 sm:gap-3 h-36">
                        {dailyData.map(([date, value]) => {
                          const pct =
                            maxDaily > 0 ? (value / maxDaily) * 100 : 0;
                          const label = new Date(date).toLocaleDateString(
                            "en-IN",
                            { weekday: "short" },
                          );
                          const isToday =
                            new Date(date).toDateString() ===
                            new Date().toDateString();
                          return (
                            <div
                              key={date}
                              className="flex-1 flex flex-col items-center gap-2 group"
                            >
                              <div
                                className="relative w-full flex items-end justify-center"
                                style={{ height: "112px" }}
                              >
                                <div
                                  className={`w-full rounded-t-xl transition-all duration-700 cursor-pointer ${
                                    isToday
                                      ? "bg-gradient-to-t from-[#4338ca] to-[#6366f1] shadow-md shadow-indigo-200"
                                      : "bg-gray-100 group-hover:bg-gray-200"
                                  }`}
                                  style={{ height: `${Math.max(pct, 4)}%` }}
                                  title={`${label}: ${formatRupee(value)}`}
                                />
                                {value > 0 && (
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                                    {formatRupee(value)}
                                  </div>
                                )}
                              </div>
                              <span
                                className={`text-[10px] font-semibold ${isToday ? "text-[#4338ca]" : "text-gray-400"}`}
                              >
                                {label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-36 flex flex-col items-center justify-center text-gray-400">
                        <p className="text-3xl mb-2">📊</p>
                        <p className="text-sm">No data yet</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-5 m-0">
                      Platform Health
                    </h3>
                    <div className="flex flex-col gap-3.5">
                      {[
                        {
                          label: "Delivered",
                          value: stats?.orders?.delivered || 0,
                          color: "bg-emerald-500",
                          total: stats?.orders?.total,
                        },
                        {
                          label: "Pending",
                          value: stats?.orders?.pending || 0,
                          color: "bg-amber-500",
                          total: stats?.orders?.total,
                        },
                        {
                          label: "Cancelled",
                          value: stats?.orders?.cancelled || 0,
                          color: "bg-red-400",
                          total: stats?.orders?.total,
                        },
                        {
                          label: "Active Users",
                          value: stats?.customers?.active || 0,
                          color: "bg-indigo-500",
                          total: stats?.customers?.total,
                        },
                        {
                          label: "Blocked",
                          value: stats?.customers?.blocked || 0,
                          color: "bg-gray-400",
                          total: stats?.customers?.total,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-3"
                        >
                          <span className="text-xs text-gray-500 w-24 shrink-0">
                            {item.label}
                          </span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full transition-all duration-700`}
                              style={{
                                width: `${item.total ? (item.value / item.total) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-6 text-right shrink-0">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => setActiveTab("vendors")}
                        className="flex-1 bg-gray-900 text-white border-none rounded-xl py-2.5 text-xs font-bold cursor-pointer hover:bg-gray-800 transition font-[inherit]"
                      >
                        Vendors
                      </button>
                      <button
                        onClick={() => setActiveTab("customers")}
                        className="flex-1 bg-gradient-to-r from-[#4338ca] to-[#6366f1] text-white border-none rounded-xl py-2.5 text-xs font-bold cursor-pointer hover:brightness-110 transition font-[inherit]"
                      >
                        Users
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="flex flex-col gap-5 fade-up">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-black text-gray-900 m-0">
                  📈 Analytics Dashboard
                </h2>
                <p className="text-sm text-gray-500 mt-1 m-0">
                  Deep insights into your business performance
                </p>
              </div>
            </div>

            {statsLoading ? (
              <Spinner text="Loading analytics..." />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon="💵"
                    label="Total Revenue"
                    value={formatRupee(stats?.revenue?.total)}
                    sub="Lifetime earnings"
                    iconBg="bg-emerald-50"
                    iconColor="text-emerald-600"
                    trend={stats?.revenue?.growthPercent}
                  />
                  <StatCard
                    icon="📊"
                    label="This Month"
                    value={formatRupee(stats?.revenue?.thisMonth)}
                    sub={`vs ${formatRupee(stats?.revenue?.lastMonth)} last month`}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                  />
                  <StatCard
                    icon="🎯"
                    label="Avg Order Value"
                    value={formatRupee(
                      stats?.orders?.delivered > 0
                        ? (stats?.revenue?.total || 0) /
                            stats?.orders?.delivered
                        : 0,
                    )}
                    sub={`${stats?.orders?.delivered || 0} delivered`}
                    iconBg="bg-purple-50"
                    iconColor="text-purple-600"
                  />
                  <StatCard
                    icon="🔥"
                    label="Conversion Rate"
                    value={`${stats?.customers?.total > 0 ? Math.round((stats?.orders?.total / stats?.customers?.total) * 100) : 0}%`}
                    sub="Orders per customer"
                    iconBg="bg-orange-50"
                    iconColor="text-orange-600"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-base font-extrabold text-gray-900 m-0">
                          Revenue Trend
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 m-0">
                          Last 7 days performance
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl">
                        📈
                      </div>
                    </div>
                    {chartLineData.length > 0 ? (
                      <LineChart
                        data={chartLineData}
                        height={200}
                        color="#4338ca"
                      />
                    ) : (
                      <div className="h-52 flex flex-col items-center justify-center text-gray-400">
                        <p className="text-4xl mb-2">📉</p>
                        <p className="text-sm">No revenue data yet</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-base font-extrabold text-gray-900 m-0">
                          Order Distribution
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 m-0">
                          Status breakdown
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-xl">
                        🎯
                      </div>
                    </div>
                    {orderStatusChart.length > 0 ? (
                      <DonutChart data={orderStatusChart} />
                    ) : (
                      <div className="h-52 flex flex-col items-center justify-center text-gray-400">
                        <p className="text-4xl mb-2">📊</p>
                        <p className="text-sm">No orders yet</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-base font-extrabold text-gray-900 m-0">
                          User Distribution
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 m-0">
                          Customer & vendor breakdown
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-xl">
                        👥
                      </div>
                    </div>
                    {userStatusChart.length > 0 ? (
                      <DonutChart data={userStatusChart} />
                    ) : (
                      <div className="h-52 flex flex-col items-center justify-center text-gray-400">
                        <p className="text-4xl mb-2">👥</p>
                        <p className="text-sm">No users yet</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-base font-extrabold text-gray-900 m-0">
                          Growth Metrics
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 m-0">
                          Month-over-month
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl">
                        🚀
                      </div>
                    </div>
                    <div className="space-y-4">
                      {[
                        {
                          label: "Revenue Growth",
                          current: stats?.revenue?.thisMonth || 0,
                          previous: stats?.revenue?.lastMonth || 0,
                          format: formatRupee,
                        },
                        {
                          label: "Orders Growth",
                          current: stats?.orders?.thisMonth || 0,
                          previous: stats?.orders?.lastMonth || 0,
                          format: (v) => v,
                        },
                      ].map((item) => {
                        const growth =
                          item.previous > 0
                            ? Math.round(
                                ((item.current - item.previous) /
                                  item.previous) *
                                  100,
                              )
                            : 100;
                        const isPositive = growth >= 0;
                        return (
                          <div
                            key={item.label}
                            className="border border-gray-100 rounded-xl p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-700">
                                {item.label}
                              </span>
                              <span
                                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                  isPositive
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {isPositive ? "▲" : "▼"} {Math.abs(growth)}%
                              </span>
                            </div>
                            <div className="flex items-end justify-between">
                              <div>
                                <p className="text-2xl font-black text-gray-900 m-0">
                                  {item.format(item.current)}
                                </p>
                                <p className="text-xs text-gray-400 m-0">
                                  This month
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500 font-semibold m-0">
                                  {item.format(item.previous)}
                                </p>
                                <p className="text-xs text-gray-400 m-0">
                                  Last month
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-base font-extrabold text-gray-900 mb-6 m-0">
                    📊 Key Metrics Overview
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      {
                        label: "Active Products",
                        value: stats?.products?.approved || 0,
                        icon: "✅",
                        color: "text-emerald-600",
                      },
                      {
                        label: "Total Views",
                        value: stats?.products?.totalViews || 0,
                        icon: "👁️",
                        color: "text-blue-600",
                      },
                      {
                        label: "Wishlisted",
                        value: stats?.products?.wishlisted || 0,
                        icon: "❤️",
                        color: "text-red-500",
                      },
                      {
                        label: "Reviews",
                        value: stats?.reviews?.total || 0,
                        icon: "⭐",
                        color: "text-yellow-500",
                      },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="text-center p-4 bg-gray-50 rounded-xl"
                      >
                        <div className={`text-3xl mb-2 ${m.color}`}>
                          {m.icon}
                        </div>
                        <p className="text-2xl font-black text-gray-900 m-0">
                          {m.value}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 m-0">
                          {m.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "coupons" && (
          <div className="fade-up">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 m-0">
                  🎟️ Coupon Management
                </h2>
                <p className="text-xs text-gray-500 mt-1 m-0">
                  {couponsData?.stats?.totalCoupons || 0} total ·{" "}
                  {couponsData?.stats?.activeCoupons || 0} active ·{" "}
                  {couponsData?.stats?.totalUsage || 0} used
                </p>
              </div>
              <button
                onClick={openCreateCoupon}
                className="bg-gradient-to-r from-[#4338ca] to-[#6366f1] text-white border-none rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer hover:brightness-110 transition font-[inherit] shadow-lg shadow-indigo-200"
              >
                + Create Coupon
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setCouponSearch(couponSearchInput);
                  setCouponPage(1);
                }}
                className="flex gap-2 flex-1"
              >
                <input
                  type="text"
                  placeholder="Search by code or description..."
                  value={couponSearchInput}
                  onChange={(e) => setCouponSearchInput(e.target.value)}
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="submit"
                  className="bg-[#4338ca] text-white border-none rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer hover:bg-[#3730a3] transition font-[inherit]"
                >
                  Search
                </button>
                {couponSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setCouponSearch("");
                      setCouponSearchInput("");
                    }}
                    className="bg-white text-gray-700 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer hover:bg-gray-50 transition font-[inherit]"
                  >
                    Clear
                  </button>
                )}
              </form>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { l: "All", v: "" },
                  { l: "Active", v: "active" },
                  { l: "Expired", v: "expired" },
                  { l: "Inactive", v: "inactive" },
                ].map((s) => (
                  <FilterBtn
                    key={s.v}
                    active={couponStatusFilter === s.v}
                    onClick={() => {
                      setCouponStatusFilter(s.v);
                      setCouponPage(1);
                    }}
                  >
                    {s.l}
                  </FilterBtn>
                ))}
                <select
                  value={couponTypeFilter}
                  onChange={(e) => setCouponTypeFilter(e.target.value)}
                  className="bg-white border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-xs cursor-pointer font-[inherit]"
                >
                  <option value="">All Types</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>
            </div>

            {couponsLoading && <Spinner text="Loading coupons..." />}
            {couponsData?.data?.length === 0 && !couponsLoading && (
              <EmptyState
                icon="🎟️"
                title="No coupons yet"
                subtitle="Create your first coupon to boost sales"
              />
            )}

            <div className="flex flex-col gap-3">
              {couponsData?.data?.map((coupon) => {
                const badge = getCouponStatusBadge(coupon);
                return (
                  <div
                    key={coupon._id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex gap-3.5 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center text-2xl shrink-0 border border-orange-200">
                          🎟️
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-[15px] font-extrabold text-gray-900 m-0">
                              {coupon.code}
                            </h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}
                            >
                              {badge.text}
                            </span>
                            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {coupon.discountType === "percentage" &&
                                `${coupon.discountValue}% OFF`}
                              {coupon.discountType === "fixed" &&
                                `${formatRupee(coupon.discountValue)} OFF`}
                              {coupon.discountType === "free_shipping" &&
                                "FREE SHIPPING"}
                            </span>
                            {coupon.firstTimeUserOnly && (
                              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                NEW USER
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] text-gray-600 m-0 mb-1">
                            {coupon.description}
                          </p>
                          <div className="flex gap-3 flex-wrap text-[11px] text-gray-400">
                            <span>
                              💰 Min: {formatRupee(coupon.minOrderAmount || 0)}
                            </span>
                            {coupon.maxDiscountAmount && (
                              <span>
                                🎯 Max: {formatRupee(coupon.maxDiscountAmount)}
                              </span>
                            )}
                            <span>
                              📊 Used: {coupon.usedCount}
                              {coupon.usageLimit ? `/${coupon.usageLimit}` : ""}
                            </span>
                            <span>
                              ⏰ Expires: {formatDate(coupon.expiryDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-wrap shrink-0">
                        <button
                          onClick={() => handleToggleCoupon(coupon._id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border-none font-[inherit] transition ${
                            coupon.isActive
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {coupon.isActive ? "Disable" : "Enable"}
                        </button>
                        <ActionBtn
                          variant="info"
                          onClick={() => openEditCoupon(coupon)}
                        >
                          Edit
                        </ActionBtn>
                        {deletingCouponId === coupon._id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() =>
                                handleDeleteCoupon(coupon._id, coupon.code)
                              }
                              className="bg-red-500 text-white border-none rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-red-600 transition font-[inherit]"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeletingCouponId(null)}
                              className="bg-white text-gray-700 border border-gray-200 rounded-lg px-2 py-1.5 text-xs cursor-pointer hover:bg-gray-50 font-[inherit]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <ActionBtn
                            variant="delete"
                            onClick={() => setDeletingCouponId(coupon._id)}
                          >
                            Delete
                          </ActionBtn>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {couponsData?.pagination?.pages > 1 && (
              <div className="flex justify-center gap-1.5 mt-6">
                <PageBtn
                  onClick={() => setCouponPage((p) => Math.max(1, p - 1))}
                  disabled={couponPage === 1}
                >
                  ← Prev
                </PageBtn>
                {Array.from(
                  { length: couponsData.pagination.pages },
                  (_, i) => i + 1,
                ).map((p) => (
                  <PageBtn
                    key={p}
                    active={couponPage === p}
                    onClick={() => setCouponPage(p)}
                  >
                    {p}
                  </PageBtn>
                ))}
                <PageBtn
                  onClick={() =>
                    setCouponPage((p) =>
                      Math.min(couponsData.pagination.pages, p + 1),
                    )
                  }
                  disabled={couponPage === couponsData.pagination.pages}
                >
                  Next →
                </PageBtn>
              </div>
            )}

            {showCouponForm && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7 mb-5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900 m-0">
                      {editingCoupon
                        ? "✏️ Edit Coupon"
                        : "🎟️ Create New Coupon"}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 m-0">
                      Fill all required fields to create a promotional coupon
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCouponForm(false)}
                    className="bg-gray-100 border-none text-gray-700 rounded-lg px-4 py-2 text-xs font-bold cursor-pointer hover:bg-gray-200 transition font-[inherit]"
                  >
                    ✕ Cancel
                  </button>
                </div>

                <form onSubmit={handleCouponSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Coupon Code *
                      </label>
                      <input
                        type="text"
                        value={couponForm.code}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            code: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="e.g. SAVE20, WELCOME50, FREESHIP"
                        required
                        className={`${inputCls} uppercase font-bold text-lg tracking-wider`}
                      />
                      <p className="text-[11px] text-gray-400 mt-1">
                        Customers will enter this code at checkout
                      </p>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Description *
                      </label>
                      <input
                        type="text"
                        value={couponForm.description}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="e.g. Get 20% off on your first order"
                        required
                        className={inputCls}
                      />
                      <p className="text-[11px] text-gray-400 mt-1">
                        Shown to customers when they see the coupon
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Discount Type *
                      </label>
                      <select
                        value={couponForm.discountType}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            discountType: e.target.value,
                          })
                        }
                        required
                        className={inputCls}
                      >
                        <option value="percentage">📊 Percentage (%)</option>
                        <option value="fixed">💵 Fixed Amount (₹)</option>
                        <option value="free_shipping">🚚 Free Shipping</option>
                      </select>
                    </div>

                    {couponForm.discountType !== "free_shipping" && (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                          Discount Value *{" "}
                          {couponForm.discountType === "percentage"
                            ? "(%)"
                            : "(₹)"}
                        </label>
                        <input
                          type="number"
                          value={couponForm.discountValue}
                          onChange={(e) =>
                            setCouponForm({
                              ...couponForm,
                              discountValue: e.target.value,
                            })
                          }
                          placeholder={
                            couponForm.discountType === "percentage"
                              ? "20"
                              : "100"
                          }
                          min="0"
                          max={
                            couponForm.discountType === "percentage"
                              ? "100"
                              : ""
                          }
                          required
                          className={inputCls}
                        />
                      </div>
                    )}

                    {couponForm.discountType === "percentage" && (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                          Max Discount Cap (₹)
                        </label>
                        <input
                          type="number"
                          value={couponForm.maxDiscountAmount}
                          onChange={(e) =>
                            setCouponForm({
                              ...couponForm,
                              maxDiscountAmount: e.target.value,
                            })
                          }
                          placeholder="500 (optional)"
                          min="0"
                          className={inputCls}
                        />
                        <p className="text-[11px] text-gray-400 mt-1">
                          Maximum discount amount even if % is higher
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Min Order Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={couponForm.minOrderAmount}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            minOrderAmount: e.target.value,
                          })
                        }
                        placeholder="0 (no minimum)"
                        min="0"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Expiry Date *
                      </label>
                      <input
                        type="date"
                        value={couponForm.expiryDate}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            expiryDate: e.target.value,
                          })
                        }
                        min={new Date().toISOString().split("T")[0]}
                        required
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Total Usage Limit
                      </label>
                      <input
                        type="number"
                        value={couponForm.usageLimit}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            usageLimit: e.target.value,
                          })
                        }
                        placeholder="Unlimited (leave empty)"
                        min="1"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Per User Limit
                      </label>
                      <input
                        type="number"
                        value={couponForm.usageLimitPerUser}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            usageLimitPerUser: e.target.value,
                          })
                        }
                        placeholder="1"
                        min="1"
                        className={inputCls}
                      />
                      <p className="text-[11px] text-gray-400 mt-1">
                        How many times one user can use this
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={couponForm.firstTimeUserOnly}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            firstTimeUserOnly: e.target.checked,
                          })
                        }
                        className="w-5 h-5 cursor-pointer accent-[#4338ca]"
                      />
                      <div>
                        <span className="text-sm font-bold text-gray-800 block">
                          🆕 First-time users only
                        </span>
                        <span className="text-[11px] text-gray-500">
                          Only new customers who haven't ordered before
                        </span>
                      </div>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={couponForm.isPublic}
                        onChange={(e) =>
                          setCouponForm({
                            ...couponForm,
                            isPublic: e.target.checked,
                          })
                        }
                        className="w-5 h-5 cursor-pointer accent-[#4338ca]"
                      />
                      <div>
                        <span className="text-sm font-bold text-gray-800 block">
                          🌐 Show publicly
                        </span>
                        <span className="text-[11px] text-gray-500">
                          Display on cart page for all customers
                        </span>
                      </div>
                    </label>
                  </div>

                  {couponForm.code && couponForm.discountType && (
                    <div className="mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-4">
                      <p className="text-xs font-bold text-orange-800 uppercase tracking-wide mb-2 m-0">
                        📋 Coupon Preview
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="bg-gradient-to-r from-[#D85A30] to-[#e8734d] text-white text-sm font-extrabold px-4 py-2 rounded-lg shadow">
                          {couponForm.code || "CODE"}
                        </span>
                        <span className="text-sm text-gray-700 font-semibold">
                          {couponForm.discountType === "percentage" &&
                            `${couponForm.discountValue || 0}% OFF`}
                          {couponForm.discountType === "fixed" &&
                            `₹${couponForm.discountValue || 0} OFF`}
                          {couponForm.discountType === "free_shipping" &&
                            "FREE SHIPPING"}
                        </span>
                        {couponForm.minOrderAmount > 0 && (
                          <span className="text-xs text-gray-500">
                            on orders above ₹{couponForm.minOrderAmount}
                          </span>
                        )}
                        {couponForm.maxDiscountAmount > 0 && (
                          <span className="text-xs text-gray-500">
                            up to ₹{couponForm.maxDiscountAmount}
                          </span>
                        )}
                      </div>
                      {couponForm.description && (
                        <p className="text-xs text-gray-600 mt-2 m-0">
                          {couponForm.description}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCouponForm(false)}
                      className="flex-1 bg-white text-gray-700 border-[1.5px] border-gray-200 rounded-xl py-3.5 text-sm font-bold cursor-pointer hover:bg-gray-50 transition font-[inherit]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingCoupon || updatingCoupon}
                      className="flex-[2] bg-gradient-to-r from-[#4338ca] to-[#6366f1] text-white border-none rounded-xl py-3.5 text-sm font-bold cursor-pointer disabled:opacity-70 hover:brightness-110 transition font-[inherit] shadow-lg shadow-indigo-200"
                    >
                      {creatingCoupon || updatingCoupon
                        ? "Saving..."
                        : editingCoupon
                          ? "✓ Update Coupon"
                          : "🎟️ Create Coupon"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === "vendors" && (
          <div className="flex flex-col gap-4 fade-up">
            <div className="flex items-center gap-2 flex-wrap">
              <FilterBtn
                active={vendorView === "pending"}
                onClick={() => setVendorView("pending")}
              >
                🕐 Pending ({pendingVendorCount})
              </FilterBtn>
              <FilterBtn
                active={vendorView === "all"}
                onClick={() => setVendorView("all")}
              >
                📋 All Vendors
              </FilterBtn>
            </div>

            {vendorView === "pending" && (
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-4 m-0">
                  Pending Vendor Applications
                </h2>
                {vendorsLoading && <Spinner text="Loading vendors..." />}
                {pendingData?.data?.length === 0 && !vendorsLoading && (
                  <EmptyState
                    icon="🎉"
                    title="All caught up!"
                    subtitle="No pending vendor applications"
                  />
                )}
                <div className="flex flex-col gap-3">
                  {pendingData?.data?.map((vendor) => (
                    <div
                      key={vendor._id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
                    >
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex gap-3.5 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl flex items-center justify-center text-2xl shrink-0 border border-indigo-200">
                            🏪
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="text-[15px] font-extrabold text-gray-900 m-0">
                                {vendor.storeName}
                              </h3>
                              {vendor.businessType && (
                                <span className="text-[10px] bg-indigo-100 text-[#4338ca] px-2 py-0.5 rounded-full font-bold capitalize">
                                  {vendor.businessType.replace(/_/g, " ")}
                                </span>
                              )}
                            </div>
                            <p className="text-[13px] text-gray-700 font-semibold m-0 mb-0.5">
                              {vendor.userId?.firstName}{" "}
                              {vendor.userId?.lastName}
                            </p>
                            <div className="flex gap-3 flex-wrap text-xs text-gray-500">
                              <span>📧 {vendor.userId?.email}</span>
                              <span>📱 {vendor.userId?.phone}</span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1 m-0">
                              Applied on {formatDate(vendor.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap shrink-0">
                          <ActionBtn
                            variant="view"
                            onClick={() =>
                              setExpandedVendor(
                                expandedVendor === vendor._id
                                  ? null
                                  : vendor._id,
                              )
                            }
                          >
                            {expandedVendor === vendor._id
                              ? "▲ Hide"
                              : "▼ Details"}
                          </ActionBtn>
                          <ActionBtn
                            variant="approve"
                            onClick={() => handleApprove(vendor._id)}
                          >
                            ✓ Approve
                          </ActionBtn>
                          <ActionBtn
                            variant="reject"
                            onClick={() =>
                              setRejectingId(
                                rejectingId === vendor._id ? null : vendor._id,
                              )
                            }
                          >
                            ✕ Reject
                          </ActionBtn>
                        </div>
                      </div>
                      <RejectPanel
                        show={rejectingId === vendor._id}
                        reason={rejectReason}
                        setReason={setRejectReason}
                        onConfirm={() => handleReject(vendor._id)}
                        onCancel={() => setRejectingId(null)}
                        placeholder="e.g. Documents unclear, Invalid PAN..."
                      />
                      {expandedVendor === vendor._id && (
                        <div className="border-t border-gray-200 p-5 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl p-4 border border-gray-200">
                              <SecTitle icon="👤" title="Personal & Business" />
                              <InfoRow
                                label="Full Name"
                                value={`${vendor.userId?.firstName} ${vendor.userId?.lastName}`}
                              />
                              <InfoRow
                                label="Email"
                                value={vendor.userId?.email}
                              />
                              <InfoRow
                                label="Phone"
                                value={vendor.userId?.phone}
                              />
                              <InfoRow label="Store" value={vendor.storeName} />
                              <InfoRow
                                label="Business Type"
                                value={vendor.businessType?.replace(/_/g, " ")}
                              />
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-gray-200">
                              <SecTitle icon="📋" title="Tax & Bank" />
                              <InfoRow
                                label="PAN"
                                value={vendor.panNumber}
                                mono
                              />
                              <InfoRow
                                label="GST"
                                value={vendor.gstNumber}
                                mono
                              />
                              <InfoRow
                                label="Account Holder"
                                value={vendor.bankDetails?.accountHolderName}
                              />
                              <InfoRow
                                label="Bank"
                                value={vendor.bankDetails?.bankName}
                              />
                              <InfoRow
                                label="Account"
                                value={
                                  vendor.bankDetails?.accountNumber
                                    ? `••••${vendor.bankDetails.accountNumber.slice(-4)}`
                                    : "—"
                                }
                                mono
                              />
                              <InfoRow
                                label="IFSC"
                                value={vendor.bankDetails?.ifscCode}
                                mono
                              />
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-gray-200">
                              <SecTitle icon="📍" title="Business Address" />
                              <InfoRow
                                label="Street"
                                value={vendor.businessAddress?.street}
                              />
                              <InfoRow
                                label="City"
                                value={vendor.businessAddress?.city}
                              />
                              <InfoRow
                                label="State"
                                value={vendor.businessAddress?.state}
                              />
                              <InfoRow
                                label="PIN"
                                value={vendor.businessAddress?.postalCode}
                                mono
                              />
                            </div>
                          </div>
                          <div className="mt-4 bg-white rounded-xl p-4 border border-gray-200">
                            <SecTitle icon="📁" title="Documents" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <DocPreview
                                label="PAN Card"
                                doc={vendor.panDocument}
                              />
                              <DocPreview
                                label="GST Certificate"
                                doc={vendor.gstDocument}
                              />
                              <DocPreview
                                label="Business Reg."
                                doc={vendor.businessRegistrationDoc}
                              />
                              <DocPreview
                                label="Cancelled Cheque"
                                doc={vendor.cancelledCheque}
                              />
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2.5 justify-end">
                            <ActionBtn
                              variant="reject"
                              onClick={() =>
                                setRejectingId(
                                  rejectingId === vendor._id
                                    ? null
                                    : vendor._id,
                                )
                              }
                              className="px-5 py-2.5 text-[13px]"
                            >
                              ✕ Reject
                            </ActionBtn>
                            <ActionBtn
                              variant="approve"
                              onClick={() => handleApprove(vendor._id)}
                              className="px-6 py-2.5 text-[13px]"
                            >
                              ✓ Approve Vendor
                            </ActionBtn>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vendorView === "all" && (
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h2 className="text-xl font-extrabold text-gray-900 m-0">
                    All Vendors ({allVendorsData?.pagination?.total || 0})
                  </h2>
                  <div className="flex gap-1.5 flex-wrap">
                    {["", "approved", "pending", "rejected", "suspended"].map(
                      (s) => (
                        <FilterBtn
                          key={s}
                          active={vendorStatusFilter === s}
                          onClick={() => {
                            setVendorStatusFilter(s);
                            setVendorPage(1);
                          }}
                        >
                          {s || "All"}
                        </FilterBtn>
                      ),
                    )}
                  </div>
                </div>
                {allVendorsLoading && <Spinner text="Loading vendors..." />}
                {allVendorsData?.data?.length === 0 && !allVendorsLoading && (
                  <EmptyState icon="🏪" title="No vendors found" />
                )}
                <div className="flex flex-col gap-3">
                  {allVendorsData?.data?.map((vendor) => (
                    <div
                      key={vendor._id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex gap-3 flex-1 min-w-0">
                          <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center text-xl border border-indigo-100 shrink-0">
                            🏪
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-extrabold text-gray-900 m-0">
                                {vendor.storeName}
                              </h3>
                              <Badge status={vendor.approvalStatus} />
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5 m-0">
                              {vendor.userId?.firstName}{" "}
                              {vendor.userId?.lastName} · {vendor.userId?.email}
                            </p>
                            <div className="flex gap-3 mt-1 flex-wrap text-[11px] text-gray-400">
                              <span>
                                Commission:{" "}
                                <strong className="text-gray-700">
                                  {vendor.commission}%
                                </strong>
                              </span>
                              {vendor.approvedAt && (
                                <span>
                                  Approved: {formatDate(vendor.approvedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-wrap shrink-0">
                          {vendor.approvalStatus === "approved" && (
                            <>
                              <button
                                onClick={() => {
                                  setCommissionEdit({ [vendor._id]: true });
                                  setCommissionValue(vendor.commission);
                                }}
                                className="bg-blue-50 text-blue-800 border border-blue-200 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-blue-100 transition font-[inherit]"
                              >
                                💰 Commission
                              </button>
                              <ActionBtn
                                variant="warn"
                                onClick={() =>
                                  setSuspendingId(
                                    suspendingId === vendor._id
                                      ? null
                                      : vendor._id,
                                  )
                                }
                              >
                                🚫 Suspend
                              </ActionBtn>
                            </>
                          )}
                          {vendor.approvalStatus === "suspended" && (
                            <ActionBtn
                              variant="approve"
                              onClick={() => handleUnsuspend(vendor._id)}
                            >
                              ✓ Unsuspend
                            </ActionBtn>
                          )}
                          {vendor.approvalStatus === "rejected" && (
                            <ActionBtn
                              variant="approve"
                              onClick={() => handleApprove(vendor._id)}
                            >
                              ✓ Approve
                            </ActionBtn>
                          )}
                        </div>
                      </div>
                      {commissionEdit[vendor._id] && (
                        <div className="mt-3 flex gap-2 items-center bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                          <span className="text-xs font-bold text-blue-800">
                            Commission %:
                          </span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={commissionValue}
                            onChange={(e) => setCommissionValue(e.target.value)}
                            className="border border-blue-200 rounded-lg px-3 py-1.5 text-sm w-20 outline-none focus:border-blue-500 font-[inherit]"
                          />
                          <button
                            onClick={() => handleUpdateCommission(vendor._id)}
                            className="bg-blue-600 text-white border-none rounded-lg px-4 py-1.5 text-xs font-bold cursor-pointer hover:bg-blue-700 transition font-[inherit]"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setCommissionEdit({})}
                            className="bg-white text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50 transition font-[inherit]"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {suspendingId === vendor._id && (
                        <RejectPanel
                          show={true}
                          reason={suspendReason}
                          setReason={setSuspendReason}
                          onConfirm={() => handleSuspend(vendor._id)}
                          onCancel={() => setSuspendingId(null)}
                          placeholder="Reason for suspension..."
                        />
                      )}
                      {vendor.rejectionReason &&
                        ["rejected", "suspended"].includes(
                          vendor.approvalStatus,
                        ) && (
                          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <p className="text-[11px] text-red-600 font-semibold m-0">
                              Reason: {vendor.rejectionReason}
                            </p>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
                {allVendorsData?.pagination?.pages > 1 && (
                  <div className="flex justify-center gap-1.5 mt-6">
                    <PageBtn
                      onClick={() => setVendorPage((p) => Math.max(1, p - 1))}
                      disabled={vendorPage === 1}
                    >
                      ← Prev
                    </PageBtn>
                    {Array.from(
                      { length: allVendorsData.pagination.pages },
                      (_, i) => i + 1,
                    ).map((p) => (
                      <PageBtn
                        key={p}
                        active={vendorPage === p}
                        onClick={() => setVendorPage(p)}
                      >
                        {p}
                      </PageBtn>
                    ))}
                    <PageBtn
                      onClick={() =>
                        setVendorPage((p) =>
                          Math.min(allVendorsData.pagination.pages, p + 1),
                        )
                      }
                      disabled={vendorPage === allVendorsData.pagination.pages}
                    >
                      Next →
                    </PageBtn>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "customers" && (
          <div className="fade-up">
            {selectedCustomer && customerDetailData?.data ? (
              <div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="flex items-center gap-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-2 cursor-pointer hover:bg-gray-50 transition mb-4 font-[inherit]"
                >
                  ← Back to Customers
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4338ca] to-[#6366f1] flex items-center justify-center text-white font-extrabold text-xl shrink-0">
                        {customerDetailData.data.firstName?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-gray-900 m-0">
                          {customerDetailData.data.firstName}{" "}
                          {customerDetailData.data.lastName}
                        </h3>
                        <Badge status={customerDetailData.data.status} />
                      </div>
                    </div>
                    <InfoRow
                      label="Email"
                      value={customerDetailData.data.email}
                    />
                    <InfoRow
                      label="Phone"
                      value={customerDetailData.data.phone}
                    />
                    <InfoRow
                      label="Joined"
                      value={formatDate(customerDetailData.data.createdAt)}
                    />
                    <InfoRow
                      label="Last Login"
                      value={
                        customerDetailData.data.lastLogin
                          ? formatDate(customerDetailData.data.lastLogin)
                          : "Never"
                      }
                    />
                    <InfoRow
                      label="Total Orders"
                      value={customerDetailData.data.totalOrders}
                    />
                    <InfoRow
                      label="Total Spent"
                      value={formatRupee(customerDetailData.data.totalSpent)}
                    />
                    <div className="flex gap-2 mt-4">
                      {customerDetailData.data.status === "active" ? (
                        <button
                          onClick={() =>
                            handleBlockCustomer(customerDetailData.data._id)
                          }
                          className="flex-1 bg-red-50 text-red-700 border border-red-200 rounded-xl py-2.5 text-xs font-bold cursor-pointer hover:bg-red-100 transition font-[inherit]"
                        >
                          🚫 Block
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleUnblockCustomer(customerDetailData.data._id)
                          }
                          className="flex-1 bg-green-50 text-green-700 border border-green-200 rounded-xl py-2.5 text-xs font-bold cursor-pointer hover:bg-green-100 transition font-[inherit]"
                        >
                          ✓ Unblock
                        </button>
                      )}
                      {deletingCustomerId === customerDetailData.data._id ? (
                        <div className="flex gap-1.5 flex-1">
                          <button
                            onClick={() =>
                              handleDeleteCustomer(customerDetailData.data._id)
                            }
                            className="flex-1 bg-red-500 text-white border-none rounded-xl py-2.5 text-xs font-bold cursor-pointer hover:bg-red-600 transition font-[inherit]"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeletingCustomerId(null)}
                            className="bg-white text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 text-xs cursor-pointer hover:bg-gray-50 transition font-[inherit]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            setDeletingCustomerId(customerDetailData.data._id)
                          }
                          className="flex-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl py-2.5 text-xs font-bold cursor-pointer hover:bg-gray-100 transition font-[inherit]"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-4 m-0">
                      Recent Orders ({customerDetailData.data.totalOrders})
                    </h3>
                    {customerDetailData.data.recentOrders?.length === 0 ? (
                      <EmptyState icon="📦" title="No orders yet" />
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {customerDetailData.data.recentOrders?.map((order) => (
                          <div
                            key={order._id}
                            className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 transition"
                          >
                            <div>
                              <p className="text-xs font-bold text-gray-900 m-0">
                                {order.orderNumber}
                              </p>
                              <p className="text-[11px] text-gray-400 m-0">
                                {formatDate(order.createdAt)} ·{" "}
                                {order.items?.length} item
                                {order.items?.length > 1 ? "s" : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge status={order.orderStatus} />
                              <span className="text-sm font-extrabold text-gray-900">
                                {formatRupee(order.total)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 m-0">
                      Customer Management
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 m-0">
                      {customersData?.pagination?.total || 0} total customers
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setCustomerSearch(customerSearchInput);
                      setCustomerPage(1);
                    }}
                    className="flex gap-2 flex-1"
                  >
                    <input
                      type="text"
                      placeholder="Search by name, email, phone..."
                      value={customerSearchInput}
                      onChange={(e) => setCustomerSearchInput(e.target.value)}
                      className={`${inputCls} flex-1`}
                    />
                    <button
                      type="submit"
                      className="bg-[#4338ca] text-white border-none rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer hover:bg-[#3730a3] transition font-[inherit]"
                    >
                      Search
                    </button>
                    {customerSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSearch("");
                          setCustomerSearchInput("");
                        }}
                        className="bg-white text-gray-700 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer hover:bg-gray-50 transition font-[inherit]"
                      >
                        Clear
                      </button>
                    )}
                  </form>
                  <div className="flex gap-1.5 flex-wrap">
                    {["", "active", "blocked"].map((s) => (
                      <FilterBtn
                        key={s}
                        active={customerStatusFilter === s}
                        onClick={() => {
                          setCustomerStatusFilter(s);
                          setCustomerPage(1);
                        }}
                      >
                        {s || "All"}
                      </FilterBtn>
                    ))}
                  </div>
                </div>
                {customersLoading && <Spinner text="Loading customers..." />}
                {customersData?.data?.length === 0 && !customersLoading && (
                  <EmptyState icon="👥" title="No customers found" />
                )}
                <div className="flex flex-col gap-2.5">
                  {customersData?.data?.map((customer) => (
                    <div
                      key={customer._id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 flex-wrap hover:shadow-md transition-all"
                    >
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center font-bold text-base text-[#4338ca] shrink-0">
                        {customer.firstName?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-extrabold text-gray-900 m-0">
                            {customer.firstName} {customer.lastName}
                          </h3>
                          <Badge status={customer.status} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 m-0">
                          {customer.email} · {customer.phone}
                        </p>
                        <div className="flex gap-4 mt-1 text-[11px] text-gray-400">
                          <span>📦 {customer.orderCount || 0} orders</span>
                          <span>
                            💰 {formatRupee(customer.totalSpent || 0)}
                          </span>
                          <span>Joined {formatDate(customer.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 flex-wrap">
                        <button
                          onClick={() => setSelectedCustomer(customer._id)}
                          className="bg-indigo-100 text-[#4338ca] border border-indigo-200 rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer hover:bg-indigo-200 transition font-[inherit]"
                        >
                          View Details
                        </button>
                        {customer.status === "active" ? (
                          blockingId === customer._id ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  handleBlockCustomer(customer._id)
                                }
                                className="bg-red-500 text-white border-none rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer hover:bg-red-600 transition font-[inherit]"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setBlockingId(null)}
                                className="bg-white text-gray-700 border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] cursor-pointer hover:bg-gray-50 transition font-[inherit]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setBlockingId(customer._id)}
                              className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer hover:bg-red-100 transition font-[inherit]"
                            >
                              🚫 Block
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => handleUnblockCustomer(customer._id)}
                            className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer hover:bg-green-100 transition font-[inherit]"
                          >
                            ✓ Unblock
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {customersData?.pagination?.pages > 1 && (
                  <div className="flex justify-center gap-1.5 mt-6">
                    <PageBtn
                      onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
                      disabled={customerPage === 1}
                    >
                      ← Prev
                    </PageBtn>
                    {Array.from(
                      { length: customersData.pagination.pages },
                      (_, i) => i + 1,
                    ).map((p) => (
                      <PageBtn
                        key={p}
                        active={customerPage === p}
                        onClick={() => setCustomerPage(p)}
                      >
                        {p}
                      </PageBtn>
                    ))}
                    <PageBtn
                      onClick={() =>
                        setCustomerPage((p) =>
                          Math.min(customersData.pagination.pages, p + 1),
                        )
                      }
                      disabled={customerPage === customersData.pagination.pages}
                    >
                      Next →
                    </PageBtn>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "admins" && (
          <div className="fade-up">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 m-0">
                  Admin Management
                </h2>
                <p className="text-xs text-gray-500 mt-1 m-0">
                  {adminsData?.data?.length || 0} admins total
                </p>
              </div>
              <button
                onClick={() => setShowAdminForm(!showAdminForm)}
                className="bg-gradient-to-r from-[#4338ca] to-[#6366f1] text-white border-none rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer font-[inherit] hover:brightness-110 transition shadow-lg shadow-indigo-200"
              >
                {showAdminForm ? "✕ Cancel" : "+ Create Admin"}
              </button>
            </div>
            {showAdminForm && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
                <h3 className="text-sm font-extrabold text-gray-900 mb-4 m-0">
                  Create New Admin Account
                </h3>
                <form
                  onSubmit={handleCreateAdmin}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      First Name *
                    </label>
                    <input
                      type="text"
                      placeholder="John"
                      value={adminForm.firstName}
                      onChange={(e) =>
                        setAdminForm({
                          ...adminForm,
                          firstName: e.target.value,
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Doe"
                      value={adminForm.lastName}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, lastName: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      placeholder="admin@example.com"
                      value={adminForm.email}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, email: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Phone *
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                        <span className="text-xs font-bold text-gray-600">
                          +91
                        </span>
                        <div className="w-px h-4 bg-gray-300" />
                      </div>
                      <input
                        type="text"
                        placeholder="9876543210"
                        value={adminForm.phone}
                        maxLength={10}
                        onChange={(e) =>
                          setAdminForm({ ...adminForm, phone: e.target.value })
                        }
                        className={`${inputCls} pl-[54px]`}
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminPassword ? "text" : "password"}
                        placeholder="Min 6 chars, 1 uppercase, 1 number"
                        value={adminForm.password}
                        onChange={(e) =>
                          setAdminForm({
                            ...adminForm,
                            password: e.target.value,
                          })
                        }
                        className={`${inputCls} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          {showAdminPassword ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          ) : (
                            <>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.8}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.8}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Min 6 characters, 1 uppercase letter, 1 number
                    </p>
                  </div>
                  {adminFormError && (
                    <div className="sm:col-span-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <p className="text-xs text-red-600 font-semibold m-0">
                        ⚠️ {adminFormError}
                      </p>
                    </div>
                  )}
                  <div className="sm:col-span-2 flex gap-3">
                    <button
                      type="submit"
                      disabled={adminFormLoading}
                      className="flex-1 bg-gradient-to-r from-[#4338ca] to-[#6366f1] text-white border-none rounded-xl py-3 text-sm font-bold cursor-pointer disabled:opacity-50 transition font-[inherit] hover:brightness-110 shadow-lg shadow-indigo-200"
                    >
                      {adminFormLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creating...
                        </span>
                      ) : (
                        "Create Admin Account"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAdminForm(false);
                        setAdminFormError("");
                        setAdminForm({
                          firstName: "",
                          lastName: "",
                          email: "",
                          phone: "",
                          password: "",
                        });
                      }}
                      className="bg-white text-gray-700 border border-gray-200 rounded-xl px-6 py-3 text-sm font-bold cursor-pointer hover:bg-gray-50 transition font-[inherit]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
            {adminsLoading && <Spinner text="Loading admins..." />}
            <div className="flex flex-col gap-2.5">
              {adminsData?.data?.map((admin) => (
                <div
                  key={admin._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 flex-wrap hover:shadow-md transition-all"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center font-extrabold text-base text-red-700 shrink-0">
                    {admin.firstName?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-extrabold text-gray-900 m-0">
                        {admin.firstName} {admin.lastName}
                      </h3>
                      <span className="text-[9px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-extrabold uppercase">
                        👑 Admin
                      </span>
                      {admin._id === (user?.id || user?._id) && (
                        <span className="text-[9px] bg-indigo-100 text-[#4338ca] border border-indigo-200 px-2 py-0.5 rounded-full font-extrabold">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 m-0">
                      {admin.email} · {admin.phone}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 m-0">
                      Joined {formatDate(admin.createdAt)}
                    </p>
                  </div>
                  <Badge status={admin.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "categories" && <AdminCategoryManager />}

        {activeTab === "products" && (
          <div className="fade-up">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 m-0">
                  Product Monitoring
                </h2>
                <p className="text-xs text-gray-500 mt-1 m-0">
                  {productsData?.pagination?.total || 0} total products
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setProductSearch(productSearchInput);
                }}
                className="flex gap-2 flex-1"
              >
                <input
                  type="text"
                  placeholder="Search by name, brand, SKU..."
                  value={productSearchInput}
                  onChange={(e) => setProductSearchInput(e.target.value)}
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="submit"
                  className="bg-[#4338ca] text-white border-none rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer hover:bg-[#3730a3] transition font-[inherit]"
                >
                  Search
                </button>
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setProductSearch("");
                      setProductSearchInput("");
                    }}
                    className="bg-white text-gray-700 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer hover:bg-gray-50 transition font-[inherit]"
                  >
                    Clear
                  </button>
                )}
              </form>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { l: "All", v: "" },
                  { l: "Live", v: "approved" },
                  { l: "Delisted", v: "delisted" },
                ].map((s) => (
                  <FilterBtn
                    key={s.v}
                    active={productStatusFilter === s.v}
                    onClick={() => setProductStatusFilter(s.v)}
                  >
                    {s.l}
                  </FilterBtn>
                ))}
              </div>
            </div>

            {productsLoading && <Spinner text="Loading products..." />}
            {productsData?.data?.length === 0 && !productsLoading && (
              <EmptyState icon="📦" title="No products found" />
            )}

            <div className="flex flex-col gap-3">
              {productsData?.data?.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="p-4 sm:p-5 flex items-start gap-3.5">
                    <ProductImg
                      src={product.images?.[0]?.url}
                      alt={product.name}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="text-[15px] font-extrabold text-gray-900 m-0 mb-1">
                            {product.name}
                          </h3>
                          <div className="flex gap-2.5 flex-wrap text-xs text-gray-500">
                            <span>📂 {product.category?.name}</span>
                            <span>
                              🏪{" "}
                              {product.vendorStore?.storeName ||
                                `${product.vendor?.firstName} ${product.vendor?.lastName}`}
                            </span>
                            {product.brand && <span>🏷️ {product.brand}</span>}
                            {product.sku && (
                              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                                SKU: {product.sku}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-3 mt-1.5 items-center flex-wrap">
                            <span className="text-base font-extrabold text-gray-900">
                              {formatRupee(product.price)}
                            </span>
                            {product.comparePrice > 0 && (
                              <span className="text-xs text-gray-400 line-through">
                                {formatRupee(product.comparePrice)}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              Stock: {product.stock}
                            </span>
                            <span className="text-xs text-gray-500">
                              👁 {product.views || 0} views
                            </span>
                            <span className="text-xs text-gray-500">
                              📦 {product.totalSold || 0} sold
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <Badge status={product.status} />
                            {product.isFeatured && (
                              <span className="text-[10px] bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-extrabold">
                                ⭐ Featured
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1.5 flex-wrap">
                            <ActionBtn
                              variant="view"
                              onClick={() =>
                                setExpandedProduct(
                                  expandedProduct === product._id
                                    ? null
                                    : product._id,
                                )
                              }
                            >
                              {expandedProduct === product._id
                                ? "▲ Hide"
                                : "▼ Details"}
                            </ActionBtn>
                            <button
                              onClick={() => handleFeatureProduct(product._id)}
                              className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer border transition-all font-[inherit] ${
                                product.isFeatured
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                              }`}
                            >
                              {product.isFeatured ? "★ Unfeature" : "☆ Feature"}
                            </button>
                            {product.status === "approved" && (
                              <button
                                onClick={() =>
                                  setDelistingId(
                                    delistingId === product._id
                                      ? null
                                      : product._id,
                                  )
                                }
                                className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3.5 py-2 text-xs font-bold cursor-pointer hover:bg-red-100 transition font-[inherit]"
                              >
                                🚫 Delist
                              </button>
                            )}
                            {product.status === "delisted" && (
                              <button
                                onClick={() => handleRelistProduct(product._id)}
                                className="bg-green-100 text-green-800 border border-green-200 rounded-lg px-3.5 py-2 text-xs font-bold cursor-pointer hover:bg-green-200 transition font-[inherit]"
                              >
                                ✓ Relist
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {delistingId === product._id && (
                    <div className="px-5 py-3 bg-red-50 border-t border-red-200">
                      <p className="text-xs font-bold text-red-600 mb-2 m-0">
                        ⚠️ Reason for delisting (will be shown to vendor)
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Counterfeit product, Policy violation..."
                          value={delistReason}
                          onChange={(e) => setDelistReason(e.target.value)}
                          className="flex-1 border border-red-200 rounded-lg px-3 py-2.5 text-[13px] outline-none focus:border-red-400 bg-white font-[inherit]"
                        />
                        <button
                          onClick={() => handleDelistProduct(product._id)}
                          className="bg-red-500 text-white border-none rounded-lg px-4 py-2.5 text-xs font-bold cursor-pointer hover:bg-red-600 transition font-[inherit]"
                        >
                          Confirm Delist
                        </button>
                        <button
                          onClick={() => {
                            setDelistingId(null);
                            setDelistReason("");
                          }}
                          className="bg-white text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-semibold cursor-pointer hover:bg-gray-50 transition font-[inherit]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {product.delistReason && product.status === "delisted" && (
                    <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200">
                      <p className="text-xs text-gray-600 font-semibold m-0">
                        Delist Reason: {product.delistReason}
                      </p>
                    </div>
                  )}

                  {expandedProduct === product._id && (
                    <div className="border-t border-gray-200 p-5 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <SecTitle icon="📦" title="Product Information" />
                          <InfoRow label="Name" value={product.name} />
                          <InfoRow
                            label="Category"
                            value={product.category?.name}
                          />
                          <InfoRow label="Brand" value={product.brand} />
                          <InfoRow label="SKU" value={product.sku} mono />
                          <InfoRow
                            label="Price"
                            value={formatRupee(product.price)}
                          />
                          <InfoRow
                            label="Compare Price"
                            value={
                              product.comparePrice > 0
                                ? formatRupee(product.comparePrice)
                                : "—"
                            }
                          />
                          <InfoRow label="Stock" value={product.stock} />
                          <InfoRow
                            label="Low Stock Alert"
                            value={product.lowStockThreshold}
                          />
                          <InfoRow
                            label="Weight"
                            value={product.weight ? `${product.weight}g` : "—"}
                          />
                          <InfoRow label="Views" value={product.views || 0} />
                          <InfoRow
                            label="Sold"
                            value={product.totalSold || 0}
                          />
                          <InfoRow
                            label="Rating"
                            value={
                              product.averageRating > 0
                                ? `${product.averageRating} ⭐`
                                : "No reviews"
                            }
                          />
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <SecTitle icon="🏪" title="Vendor Information" />
                          <InfoRow
                            label="Vendor"
                            value={`${product.vendor?.firstName} ${product.vendor?.lastName}`}
                          />
                          <InfoRow
                            label="Email"
                            value={product.vendor?.email}
                          />
                          <InfoRow
                            label="Store"
                            value={product.vendorStore?.storeName}
                          />
                          <InfoRow label="Status" value={product.status} />
                          <InfoRow
                            label="Featured"
                            value={product.isFeatured ? "Yes" : "No"}
                          />
                          <InfoRow
                            label="Listed"
                            value={formatDate(product.createdAt)}
                          />
                          {product.specifications?.length > 0 && (
                            <>
                              <SecTitle icon="📋" title="Specifications" />
                              {product.specifications.map((spec, i) => (
                                <InfoRow
                                  key={i}
                                  label={spec.key}
                                  value={spec.value}
                                />
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                      {product.images?.length > 0 && (
                        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
                          <SecTitle icon="🖼️" title="Product Images" />
                          <div className="flex gap-2.5 flex-wrap">
                            {product.images.map((img, i) => (
                              <a
                                key={i}
                                href={img.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ProductImg
                                  src={img.url}
                                  alt={`Product ${i + 1}`}
                                  size="90px"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {product.description && (
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <SecTitle icon="📝" title="Description" />
                          <p className="text-[13px] text-gray-700 m-0 leading-relaxed whitespace-pre-line">
                            {product.description}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 fade-up">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 m-0">
                  Order Monitoring
                </h2>
                <p className="text-xs text-gray-500 mt-1 m-0">
                  {ordersData?.pagination?.total || 0} total orders ·{" "}
                  {formatRupee(ordersData?.summary?.totalRevenue)} revenue
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setOrderSearch(orderSearchInput);
                  setOrderPage(1);
                }}
                className="flex gap-2 flex-1"
              >
                <input
                  type="text"
                  placeholder="Search order number..."
                  value={orderSearchInput}
                  onChange={(e) => setOrderSearchInput(e.target.value)}
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="submit"
                  className="bg-[#4338ca] text-white border-none rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer hover:bg-[#3730a3] transition font-[inherit]"
                >
                  Search
                </button>
                {orderSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setOrderSearch("");
                      setOrderSearchInput("");
                    }}
                    className="bg-white text-gray-700 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer hover:bg-gray-50 transition font-[inherit]"
                  >
                    Clear
                  </button>
                )}
              </form>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { l: "All", v: "" },
                  { l: "Confirmed", v: "confirmed" },
                  { l: "Processing", v: "processing" },
                  { l: "Shipped", v: "shipped" },
                  { l: "Delivered", v: "delivered" },
                  { l: "Cancelled", v: "cancelled" },
                ].map((item) => (
                  <FilterBtn
                    key={item.v}
                    active={orderStatusFilter === item.v}
                    onClick={() => {
                      setOrderStatusFilter(item.v);
                      setOrderPage(1);
                    }}
                  >
                    {item.l}
                  </FilterBtn>
                ))}
              </div>
            </div>

            {ordersLoading && <Spinner text="Loading orders..." />}
            {ordersData?.data?.length === 0 && !ordersLoading && (
              <EmptyState icon="📦" title="No orders found" />
            )}

            <div className="flex flex-col gap-3">
              {ordersData?.data?.map((order) => (
                <div
                  key={order._id}
                  className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <div className="p-4">
                    <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                      <div>
                        <p className="text-sm font-extrabold text-gray-900 m-0">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 m-0">
                          {order.user?.firstName} {order.user?.lastName} ·{" "}
                          {order.user?.email}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5 m-0">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge status={order.orderStatus} />
                        <p className="text-lg font-extrabold text-gray-900 mt-1.5 m-0">
                          {formatRupee(order.total)}
                        </p>
                        {order.couponCode && (
                          <p className="text-[10px] text-orange-600 font-bold m-0">
                            🎟️ {order.couponCode}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mb-3">
                      {order.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex gap-2.5 items-center bg-gray-50 rounded-xl p-2.5"
                        >
                          <div className="w-11 h-11 bg-white rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                            <img
                              src={
                                item.image || "https://placehold.co/44?text=P"
                              }
                              alt={item.name}
                              className="w-full h-full object-contain p-0.5"
                              onError={(e) => {
                                e.target.src = "https://placehold.co/44?text=P";
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 m-0 truncate">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-gray-500 m-0">
                              Qty: {item.quantity} ·{" "}
                              {formatRupee(item.price * item.quantity)} ·{" "}
                              {item.storeName}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5 mb-3 text-xs">
                      <p className="text-gray-600 m-0 font-medium">
                        📍 {order.shippingAddress?.fullName},{" "}
                        {order.shippingAddress?.phone}
                      </p>
                      <p className="text-gray-500 m-0">
                        {order.shippingAddress?.street},{" "}
                        {order.shippingAddress?.city},{" "}
                        {order.shippingAddress?.state} —{" "}
                        {order.shippingAddress?.postalCode}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-gray-100">
                      <p className="text-xs text-gray-500 m-0">
                        <strong>
                          {order.paymentMethod === "cod"
                            ? "💵 COD"
                            : "💳 Online"}
                        </strong>{" "}
                        ·{" "}
                        <span
                          className={`font-bold ${
                            order.paymentStatus === "paid"
                              ? "text-green-600"
                              : order.paymentStatus === "refunded"
                                ? "text-pink-600"
                                : "text-amber-600"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <span>Status managed by vendor</span>
                        {!["cancelled", "delivered", "refunded"].includes(
                          order.orderStatus,
                        ) && (
                          <button
                            onClick={() =>
                              setCancellingOrderId(
                                cancellingOrderId === order._id
                                  ? null
                                  : order._id,
                              )
                            }
                            className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-red-100 transition font-[inherit]"
                          >
                            Cancel (Admin)
                          </button>
                        )}
                      </div>
                    </div>

                    {order.cancelReason && (
                      <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <p className="text-[11px] text-red-600 font-semibold m-0">
                          Cancel Reason: {order.cancelReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {cancellingOrderId === order._id && (
                    <div className="px-5 py-3 bg-red-50 border-t border-red-200">
                      <p className="text-xs font-bold text-red-600 mb-2 m-0">
                        ⚠️ Admin cancellation — extreme cases only (fraud,
                        dispute)
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Reason for admin cancellation..."
                          value={cancelOrderReason}
                          onChange={(e) => setCancelOrderReason(e.target.value)}
                          className="flex-1 border border-red-200 rounded-lg px-3 py-2.5 text-[13px] outline-none focus:border-red-400 bg-white font-[inherit]"
                        />
                        <button
                          onClick={() =>
                            handleAdminCancelOrder(order._id, cancelOrderReason)
                          }
                          className="bg-red-500 text-white border-none rounded-lg px-4 py-2.5 text-xs font-bold cursor-pointer hover:bg-red-600 transition font-[inherit]"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => {
                            setCancellingOrderId(null);
                            setCancelOrderReason("");
                          }}
                          className="bg-white text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-semibold cursor-pointer hover:bg-gray-50 transition font-[inherit]"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {ordersData?.pagination?.pages > 1 && (
              <div className="flex justify-center gap-1.5 mt-6">
                <PageBtn
                  onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                  disabled={orderPage === 1}
                >
                  ← Prev
                </PageBtn>
                {Array.from(
                  { length: ordersData.pagination.pages },
                  (_, i) => i + 1,
                ).map((p) => (
                  <PageBtn
                    key={p}
                    active={orderPage === p}
                    onClick={() => setOrderPage(p)}
                  >
                    {p}
                  </PageBtn>
                ))}
                <PageBtn
                  onClick={() =>
                    setOrderPage((p) =>
                      Math.min(ordersData.pagination.pages, p + 1),
                    )
                  }
                  disabled={orderPage === ordersData.pagination.pages}
                >
                  Next →
                </PageBtn>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 fade-up">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4 m-0">
              Review Management
            </h2>
            <div className="flex flex-wrap gap-2.5 mb-5">
              <select
                value={reviewSort}
                onChange={(e) => {
                  setReviewSort(e.target.value);
                  setReviewPage(1);
                }}
                className="bg-white border border-gray-200 text-gray-700 rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-[#4338ca] transition font-[inherit] cursor-pointer shadow-sm"
              >
                <option value="newest">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
              <div className="flex gap-1.5 flex-wrap">
                {[5, 4, 3, 2, 1].map((star) => (
                  <FilterBtn
                    key={star}
                    active={reviewRatingFilter === star}
                    onClick={() => {
                      setReviewRatingFilter(
                        reviewRatingFilter === star ? undefined : star,
                      );
                      setReviewPage(1);
                    }}
                  >
                    {star} ★
                  </FilterBtn>
                ))}
                {reviewRatingFilter && (
                  <button
                    onClick={() => {
                      setReviewRatingFilter(undefined);
                      setReviewPage(1);
                    }}
                    className="px-3 py-2 text-xs text-gray-500 bg-transparent border-none cursor-pointer hover:text-gray-700 font-[inherit]"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {reviewsLoading && <Spinner text="Loading reviews..." />}
            {reviewsData?.data?.length === 0 && !reviewsLoading && (
              <EmptyState icon="💬" title="No reviews found" />
            )}
            <div className="flex flex-col gap-3">
              {reviewsData?.data?.map((review) => (
                <div
                  key={review._id}
                  className="border border-gray-100 rounded-2xl p-4 hover:border-[#4338ca]/20 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center shrink-0 font-bold text-sm text-[#4338ca]">
                        {review.user?.firstName?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-bold text-[13px] text-gray-900 m-0">
                          {review.user?.firstName} {review.user?.lastName}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5 m-0">
                          {review.user?.email}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span
                                key={s}
                                className={
                                  s <= review.rating
                                    ? "text-yellow-400 text-[13px]"
                                    : "text-gray-200 text-[13px]"
                                }
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          {review.isVerifiedPurchase && (
                            <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <p className="text-[11px] text-gray-400 m-0">
                        {formatDate(review.createdAt)}
                      </p>
                      {deletingReviewId === review._id ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="bg-red-500 text-white border-none rounded-md px-3 py-1.5 text-[11px] font-bold cursor-pointer hover:bg-red-600 transition font-[inherit]"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeletingReviewId(null)}
                            className="bg-white text-gray-700 border border-gray-200 rounded-md px-2.5 py-1.5 text-[11px] cursor-pointer hover:bg-gray-50 transition font-[inherit]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <ActionBtn
                          variant="delete"
                          onClick={() => setDeletingReviewId(review._id)}
                        >
                          Delete
                        </ActionBtn>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pl-[52px]">
                    {review.product && (
                      <div className="flex items-center gap-2 mb-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
                        {review.product?.images?.[0] && (
                          <img
                            src={review.product.images[0].url}
                            alt=""
                            className="w-5 h-5 rounded object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        )}
                        <span className="text-[11px] text-gray-600 font-semibold">
                          {review.product?.name}
                        </span>
                      </div>
                    )}
                    {review.title && (
                      <p className="font-bold text-[13px] text-gray-900 m-0 mb-1">
                        {review.title}
                      </p>
                    )}
                    {review.body && (
                      <p className="text-[13px] text-gray-700 m-0 leading-relaxed">
                        {review.body}
                      </p>
                    )}
                    {review.images?.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {review.images.map((img, i) => (
                          <img
                            key={i}
                            src={img.url}
                            alt=""
                            className="w-[52px] h-[52px] rounded-lg object-cover border border-gray-200"
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1.5 m-0">
                      👍 {review.helpfulVotes?.length || 0} found helpful
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {reviewsData?.pagination?.pages > 1 && (
              <div className="flex justify-center gap-1.5 mt-6">
                <PageBtn
                  onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                  disabled={reviewPage === 1}
                >
                  ← Prev
                </PageBtn>
                {Array.from(
                  { length: reviewsData.pagination.pages },
                  (_, i) => i + 1,
                ).map((p) => (
                  <PageBtn
                    key={p}
                    active={reviewPage === p}
                    onClick={() => setReviewPage(p)}
                  >
                    {p}
                  </PageBtn>
                ))}
                <PageBtn
                  onClick={() =>
                    setReviewPage((p) =>
                      Math.min(reviewsData.pagination.pages, p + 1),
                    )
                  }
                  disabled={reviewPage === reviewsData.pagination.pages}
                >
                  Next →
                </PageBtn>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
