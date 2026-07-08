import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAdminGetSalesReportQuery } from "../features/auth/authApi";
import { formatPrice } from "../utils/priceHelper";
import { toast } from "../components/Toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const formatPricePDF = (amount) => {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatDateTime = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const AdminSalesReportPage = () => {
  const { currentCountry } = useSelector((s) => s.country);
  const [exporting, setExporting] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const getDefaultDates = () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return {
      dateFrom: from.toISOString().split("T")[0],
      dateTo: to.toISOString().split("T")[0],
    };
  };

  const [filters, setFilters] = useState({
    ...getDefaultDates(),
    groupBy: "day",
  });

  const { data, isLoading, refetch } = useAdminGetSalesReportQuery(filters);
  const report = data?.data;

  const overview = report?.overview || {};
  const revenue = report?.revenue || {};
  const vendors = report?.vendors || {};
  const geography = report?.geography || {};
  const payments = report?.payments || {};
  const coupons = report?.coupons || {};
  const products = report?.products || {};
  const categories = report?.categories || {};
  const customers = report?.customers || {};
  const alerts = report?.alerts || [];

  const setQuickRange = (days) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setFilters({
      ...filters,
      dateFrom: from.toISOString().split("T")[0],
      dateTo: to.toISOString().split("T")[0],
    });
  };

  const exportPDF = async () => {
    setExporting("pdf");
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 35, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("shop.design", 14, 15);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Platform Analytics Report", 14, 22);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("ADMIN SALES REPORT", pageWidth - 14, 15, { align: "right" });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${formatDateTime(new Date())}`, pageWidth - 14, 22, { align: "right" });

      doc.setTextColor(0, 0, 0);

      let y = 45;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Report Period: ${filters.dateFrom} to ${filters.dateTo}`, 14, y);
      y += 10;

      doc.setFillColor(239, 246, 255);
      doc.rect(14, y, pageWidth - 28, 45, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 64, 175);
      doc.text("PLATFORM OVERVIEW", 18, y + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      const kpis = [
        [`GMV:`, formatPricePDF(overview.gmv)],
        [`Platform Commission:`, formatPricePDF(overview.totalCommission)],
        [`Total Orders:`, String(overview.totalOrders || 0)],
        [`Paid Orders:`, String(overview.paidOrders || 0)],
        [`Active Vendors:`, String(overview.activeVendors || 0)],
        [`Total Customers:`, String(overview.totalCustomers || 0)],
        [`Avg Order Value:`, formatPricePDF(overview.avgOrderValue)],
        [`Growth Rate:`, `${revenue.growthRate || 0}%`],
      ];

      let sx = 18;
      let sy = y + 14;
      kpis.forEach(([label, value], i) => {
        if (i === 4) {
          sx = pageWidth / 2 + 5;
          sy = y + 14;
        }
        doc.setFont("helvetica", "bold");
        doc.text(label, sx, sy);
        doc.setFont("helvetica", "normal");
        doc.text(value, sx + 45, sy);
        sy += 6;
      });

      y += 55;

      if (vendors.top?.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Top 10 Vendors", 14, y);
        y += 5;

        autoTable(doc, {
          startY: y,
          head: [["#", "Store Name", "Orders", "Revenue", "Commission"]],
          body: vendors.top.map((v, i) => [
            String(i + 1),
            v.storeName,
            String(v.orders),
            formatPricePDF(v.revenue),
            formatPricePDF(v.commissionEarned),
          ]),
          theme: "grid",
          headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            2: { halign: "center" },
            3: { halign: "right" },
            4: { halign: "right" },
          },
        });

        y = doc.lastAutoTable.finalY + 10;
      }

      if (geography.topStates?.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Top States by Revenue", 14, y);
        y += 5;

        autoTable(doc, {
          startY: y,
          head: [["State", "Orders", "Revenue"]],
          body: geography.topStates.map((s) => [s.state, String(s.orders), formatPricePDF(s.revenue)]),
          theme: "grid",
          headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          columnStyles: { 1: { halign: "center" }, 2: { halign: "right" } },
        });

        y = doc.lastAutoTable.finalY + 10;
      }

      if (coupons.top?.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Top Coupons", 14, y);
        y += 5;

        autoTable(doc, {
          startY: y,
          head: [["Code", "Used", "Discount Given", "Revenue Gen.", "ROI"]],
          body: coupons.top.map((c) => [
            c.code,
            String(c.usedCount),
            formatPricePDF(c.totalDiscount),
            formatPricePDF(c.revenueGenerated),
            `${c.roi}x`,
          ]),
          theme: "grid",
          headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          columnStyles: {
            1: { halign: "center" },
            2: { halign: "right" },
            3: { halign: "right" },
            4: { halign: "center" },
          },
        });

        y = doc.lastAutoTable.finalY + 10;
      }

      if (products.top?.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Top Selling Products", 14, y);
        y += 5;

        autoTable(doc, {
          startY: y,
          head: [["#", "Product", "Units", "Revenue", "Vendors"]],
          body: products.top.map((p, i) => [
            String(i + 1),
            p.name,
            String(p.unitsSold),
            formatPricePDF(p.revenue),
            String(p.uniqueVendors),
          ]),
          theme: "grid",
          headStyles: { fillColor: [217, 70, 239], textColor: [255, 255, 255], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            2: { halign: "center" },
            3: { halign: "right" },
            4: { halign: "center" },
          },
        });
      }

      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
        doc.text(`shop.design - Admin Report - Quleep Pvt Ltd`, pageWidth / 2, doc.internal.pageSize.getHeight() - 5, { align: "center" });
      }

      doc.save(`admin-sales-report-${filters.dateFrom}-to-${filters.dateTo}.pdf`);
      toast.success("PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setExporting(null);
    }
  };

  const exportExcel = () => {
    setExporting("excel");
    try {
      const wb = XLSX.utils.book_new();

      const overviewSheet = XLSX.utils.aoa_to_sheet([
        ["SHOP.DESIGN - ADMIN SALES REPORT"],
        [""],
        ["Report Period:", `${filters.dateFrom} to ${filters.dateTo}`],
        ["Generated:", formatDateTime(new Date())],
        [""],
        ["PLATFORM OVERVIEW"],
        ["Metric", "Value"],
        ["Gross Merchandise Value (GMV)", overview.gmv || 0],
        ["Platform Commission Earned", overview.totalCommission || 0],
        ["Net Platform Revenue", overview.netPlatformRevenue || 0],
        ["Total Orders", overview.totalOrders || 0],
        ["Paid Orders", overview.paidOrders || 0],
        ["Delivered Orders", overview.deliveredOrders || 0],
        ["Conversion Rate", `${overview.conversionRate || 0}%`],
        ["Active Vendors", overview.activeVendors || 0],
        ["Profitable Vendors", overview.profitableVendors || 0],
        ["Total Customers", overview.totalCustomers || 0],
        ["Active Customers", overview.activeCustomers || 0],
        ["New Customers This Month", overview.newCustomersThisMonth || 0],
        ["Average Order Value", overview.avgOrderValue || 0],
        ["Customer Lifetime Value", overview.customerLifetimeValue || 0],
        ["Revenue Growth Rate", `${revenue.growthRate || 0}%`],
        ["This Month Revenue", revenue.thisMonth || 0],
        ["Last Month Revenue", revenue.lastMonth || 0],
      ]);
      overviewSheet["!cols"] = [{ wch: 35 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, overviewSheet, "Overview");

      if (vendors.top?.length > 0) {
        const vendorSheet = XLSX.utils.json_to_sheet(
          vendors.top.map((v, i) => ({
            Rank: i + 1,
            "Store Name": v.storeName,
            "Commission Rate": `${v.commission}%`,
            Orders: v.orders,
            "Items Sold": v.itemsSold,
            Revenue: v.revenue,
            "Commission Earned": v.commissionEarned,
            "Approval Status": v.approvalStatus,
          }))
        );
        vendorSheet["!cols"] = [{ wch: 6 }, { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, vendorSheet, "Top Vendors");
      }

      if (vendors.inactive?.length > 0) {
        const inactiveSheet = XLSX.utils.json_to_sheet(
          vendors.inactive.map((v) => ({
            "Store Name": v.storeName,
            "Commission Rate": `${v.commission}%`,
            Orders: v.orders,
            Revenue: v.revenue,
            Issue: v.issue,
          }))
        );
        inactiveSheet["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, inactiveSheet, "Inactive Vendors");
      }

      if (geography.topStates?.length > 0) {
        const stateSheet = XLSX.utils.json_to_sheet(
          geography.topStates.map((s, i) => ({
            Rank: i + 1,
            State: s.state,
            Orders: s.orders,
            Revenue: s.revenue,
          }))
        );
        stateSheet["!cols"] = [{ wch: 6 }, { wch: 25 }, { wch: 10 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, stateSheet, "Top States");
      }

      if (geography.topCities?.length > 0) {
        const citySheet = XLSX.utils.json_to_sheet(
          geography.topCities.map((c, i) => ({
            Rank: i + 1,
            City: c.city,
            Orders: c.orders,
            Revenue: c.revenue,
          }))
        );
        citySheet["!cols"] = [{ wch: 6 }, { wch: 25 }, { wch: 10 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, citySheet, "Top Cities");
      }

      if (coupons.top?.length > 0) {
        const couponSheet = XLSX.utils.json_to_sheet(
          coupons.top.map((c) => ({
            "Coupon Code": c.code,
            "Times Used": c.usedCount,
            "Discount Given": c.totalDiscount,
            "Revenue Generated": c.revenueGenerated,
            "ROI (x)": c.roi,
          }))
        );
        couponSheet["!cols"] = [{ wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, couponSheet, "Coupon Analytics");
      }

      if (products.top?.length > 0) {
        const productSheet = XLSX.utils.json_to_sheet(
          products.top.map((p, i) => ({
            Rank: i + 1,
            "Product Name": p.name,
            "Units Sold": p.unitsSold,
            Revenue: p.revenue,
            "Sold By Vendors": p.uniqueVendors,
          }))
        );
        productSheet["!cols"] = [{ wch: 6 }, { wch: 40 }, { wch: 12 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, productSheet, "Top Products");
      }

      if (categories.top?.length > 0) {
        const catSheet = XLSX.utils.json_to_sheet(
          categories.top.map((c) => ({
            Category: c.name,
            "Total Products": c.productCount,
            "Approved Products": c.approvedProducts,
            Orders: c.orders,
            Revenue: c.revenue,
          }))
        );
        catSheet["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 10 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, catSheet, "Categories");
      }

      const paymentData = [
        ["PAYMENT METHOD BREAKDOWN"],
        ["Method", "Count", "Revenue"],
        ...Object.entries(payments.methods || {}).map(([method, data]) => [
          method.toUpperCase(),
          data.count,
          data.revenue,
        ]),
        [""],
        ["PAYMENT STATUS"],
        ["Status", "Count"],
        ["Paid", payments.statusBreakdown?.paid || 0],
        ["Pending", payments.statusBreakdown?.pending || 0],
        ["Failed", payments.statusBreakdown?.failed || 0],
        ["Refunded", payments.statusBreakdown?.refunded || 0],
        [""],
        ["SUCCESS RATE", `${payments.successRate || 0}%`],
      ];
      const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);
      paymentSheet["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, paymentSheet, "Payments");

      XLSX.writeFile(wb, `admin-sales-report-${filters.dateFrom}-to-${filters.dateTo}.xlsx`);
      toast.success("Excel file downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Excel");
    } finally {
      setExporting(null);
    }
  };

  const exportCSV = () => {
    setExporting("csv");
    try {
      const lines = [
        "SHOP.DESIGN ADMIN SALES REPORT",
        "",
        `Period: ${filters.dateFrom} to ${filters.dateTo}`,
        `Generated: ${formatDateTime(new Date())}`,
        "",
        "OVERVIEW",
        `GMV,${overview.gmv || 0}`,
        `Commission,${overview.totalCommission || 0}`,
        `Total Orders,${overview.totalOrders || 0}`,
        `Active Vendors,${overview.activeVendors || 0}`,
        `Total Customers,${overview.totalCustomers || 0}`,
        `Growth Rate,${revenue.growthRate || 0}%`,
        "",
        "TOP VENDORS",
        "Rank,Store,Orders,Revenue,Commission",
        ...vendors.top.map((v, i) => `${i + 1},${v.storeName},${v.orders},${v.revenue},${v.commissionEarned}`),
        "",
        "TOP STATES",
        "State,Orders,Revenue",
        ...geography.topStates.map((s) => `${s.state},${s.orders},${s.revenue}`),
        "",
        "TOP COUPONS",
        "Code,Used,Discount,Revenue,ROI",
        ...coupons.top.map((c) => `${c.code},${c.usedCount},${c.totalDiscount},${c.revenueGenerated},${c.roi}x`),
      ].join("\n");

      const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `admin-sales-report-${filters.dateFrom}-to-${filters.dateTo}.csv`;
      link.click();
      toast.success("CSV downloaded!");
    } catch (err) {
      toast.error("Failed to generate CSV");
    } finally {
      setExporting(null);
    }
  };

  const chartMax = revenue.chartData?.length > 0
    ? Math.max(...revenue.chartData.map((d) => d.revenue), 1)
    : 1;

  const tabs = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "vendors", label: "Vendors", icon: "🏪" },
    { key: "geography", label: "Geography", icon: "📍" },
    { key: "payments", label: "Payments", icon: "💳" },
    { key: "coupons", label: "Coupons", icon: "🎟️" },
    { key: "products", label: "Products", icon: "📦" },
    { key: "customers", label: "Customers", icon: "👥" },
  ];

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-gray-500 text-[13px] font-semibold no-underline mb-5 hover:text-gray-700">
          ← Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 m-0 flex items-center gap-2">
              📊 Platform Sales Report
            </h1>
            <p className="text-sm text-gray-500 mt-1 m-0">
              Complete platform analytics · Amazon-level insights
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              disabled={exporting || isLoading}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 transition font-[inherit] shadow-md"
            >
              {exporting === "pdf" ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />PDF...</>
              ) : "📄 PDF"}
            </button>
            <button
              onClick={exportExcel}
              disabled={exporting || isLoading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 transition font-[inherit] shadow-md"
            >
              {exporting === "excel" ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Excel...</>
              ) : "📊 Excel"}
            </button>
            <button
              onClick={exportCSV}
              disabled={exporting || isLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 transition font-[inherit] shadow-md"
            >
              {exporting === "csv" ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />CSV...</>
              ) : "📋 CSV"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase">From:</label>
              <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-[inherit]" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase">To:</label>
              <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-[inherit]" />
            </div>
            <select value={filters.groupBy} onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm cursor-pointer font-[inherit]">
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
            <div className="flex gap-1.5 border-l border-gray-200 pl-3">
              {[{ label: "7D", days: 7 }, { label: "30D", days: 30 }, { label: "90D", days: 90 }, { label: "1Y", days: 365 }].map((r) => (
                <button key={r.label} onClick={() => setQuickRange(r.days)} className="text-xs font-bold text-gray-600 bg-gray-100 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-lg cursor-pointer transition font-[inherit] border-none">
                  {r.label}
                </button>
              ))}
            </div>
            <button onClick={() => refetch()} className="ml-auto text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg cursor-pointer transition font-[inherit] border-none">
              🔄 Refresh
            </button>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="flex flex-col gap-2 mb-6">
            {alerts.map((alert, i) => (
              <div key={i} className={`rounded-xl p-4 border-2 flex items-start gap-3 ${
                alert.type === "warning" ? "bg-amber-50 border-amber-200" :
                alert.type === "success" ? "bg-green-50 border-green-200" :
                "bg-blue-50 border-blue-200"
              }`}>
                <span className="text-xl shrink-0">
                  {alert.type === "warning" ? "⚠️" : alert.type === "success" ? "✅" : "💡"}
                </span>
                <div>
                  <p className={`text-sm font-bold m-0 ${
                    alert.type === "warning" ? "text-amber-900" :
                    alert.type === "success" ? "text-green-900" :
                    "text-blue-900"
                  }`}>{alert.title}</p>
                  <p className={`text-xs m-0 mt-1 ${
                    alert.type === "warning" ? "text-amber-700" :
                    alert.type === "success" ? "text-green-700" :
                    "text-blue-700"
                  }`}>{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Generating platform report...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: "GMV (Gross)",
                  value: formatPrice(overview.gmv || 0, currentCountry),
                  icon: "💰",
                  color: "from-blue-500 to-indigo-600",
                  sub: `${overview.totalOrders || 0} orders`,
                  trend: revenue.growthRate,
                },
                {
                  label: "Platform Earnings",
                  value: formatPrice(overview.totalCommission || 0, currentCountry),
                  icon: "💎",
                  color: "from-green-500 to-emerald-600",
                  sub: "Commission collected",
                },
                {
                  label: "Active Vendors",
                  value: overview.activeVendors || 0,
                  icon: "🏪",
                  color: "from-purple-500 to-violet-600",
                  sub: `${overview.profitableVendors || 0} profitable`,
                },
                {
                  label: "Total Customers",
                  value: overview.totalCustomers || 0,
                  icon: "👥",
                  color: "from-orange-500 to-red-600",
                  sub: `+${overview.newCustomersThisMonth || 0} this month`,
                },
              ].map((stat) => (
                <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{stat.icon}</span>
                      {stat.trend !== undefined && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stat.trend >= 0 ? "bg-white/20" : "bg-red-500/40"}`}>
                          {stat.trend >= 0 ? "▲" : "▼"} {Math.abs(stat.trend)}%
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-black m-0">{stat.value}</p>
                    <p className="text-xs opacity-80 mt-1 m-0">{stat.label}</p>
                    <p className="text-[10px] opacity-60 mt-0.5 m-0">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-1.5 mb-5 overflow-x-auto bg-white rounded-2xl p-2 border border-gray-100 shadow-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all whitespace-nowrap font-[inherit] border-none ${
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                      : "bg-transparent text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900 m-0">Revenue Trend</h3>
                      <p className="text-xs text-gray-500 mt-0.5 m-0">
                        {filters.groupBy === "day" ? "Daily" : filters.groupBy === "week" ? "Weekly" : "Monthly"} performance
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 m-0">This Month vs Last Month</p>
                      <p className={`text-lg font-black m-0 ${revenue.growthRate >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {revenue.growthRate >= 0 ? "+" : ""}{revenue.growthRate}%
                      </p>
                    </div>
                  </div>

                  {revenue.chartData?.length > 0 ? (
                    <div className="flex items-end gap-2 h-48">
                      {revenue.chartData.slice(-20).map((point, i) => {
                        const height = (point.revenue / chartMax) * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                            <div className="relative w-full flex items-end justify-center" style={{ height: "160px" }}>
                              <div
                                className="w-full bg-gradient-to-t from-indigo-600 to-blue-400 rounded-t-lg transition-all hover:from-indigo-700 cursor-pointer"
                                style={{ height: `${Math.max(height, 3)}%` }}
                              />
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                                {formatPrice(point.revenue, currentCountry)}
                              </div>
                            </div>
                            <span className="text-[9px] text-gray-500 font-semibold rotate-45 origin-top-left">
                              {point.period.slice(-5)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                      <p className="text-4xl mb-2">📊</p>
                      <p className="text-sm">No revenue data yet</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase m-0">💰 Financial Summary</p>
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">GMV</span>
                        <span className="font-bold">{formatPrice(overview.gmv || 0, currentCountry)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Commission</span>
                        <span className="font-bold text-green-600">+{formatPrice(overview.totalCommission || 0, currentCountry)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Refunds</span>
                        <span className="font-bold text-red-600">-{formatPrice((payments.statusBreakdown?.refunded || 0) * (overview.avgOrderValue || 0), currentCountry)}</span>
                      </div>
                      <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-black">
                        <span>Net Revenue</span>
                        <span className="text-green-700">{formatPrice(overview.netPlatformRevenue || 0, currentCountry)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase m-0">👥 Customer Segments</p>
                    <div className="mt-4 space-y-3">
                      {[
                        { label: "🔥 VIP (10+)", count: customers.segments?.vip || 0, color: "bg-red-500" },
                        { label: "⭐ Regular (3-9)", count: customers.segments?.regular || 0, color: "bg-yellow-500" },
                        { label: "📦 Occasional (1-2)", count: customers.segments?.occasional || 0, color: "bg-blue-500" },
                      ].map((seg) => {
                        const total = (customers.segments?.vip || 0) + (customers.segments?.regular || 0) + (customers.segments?.occasional || 0);
                        const pct = total > 0 ? (seg.count / total) * 100 : 0;
                        return (
                          <div key={seg.label}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-700 font-semibold">{seg.label}</span>
                              <span className="font-bold">{seg.count}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${seg.color} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                      <p className="text-xs text-gray-500 m-0">Customer Lifetime Value</p>
                      <p className="text-xl font-black text-gray-900 m-0 mt-1">{formatPrice(customers.clv || 0, currentCountry)}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase m-0">📊 Quick Stats</p>
                    <div className="mt-4 space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-[10px] text-blue-600 font-bold uppercase m-0">Avg Order Value</p>
                        <p className="text-lg font-black text-blue-900 m-0 mt-1">{formatPrice(overview.avgOrderValue || 0, currentCountry)}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-[10px] text-green-600 font-bold uppercase m-0">Conversion Rate</p>
                        <p className="text-lg font-black text-green-900 m-0 mt-1">{overview.conversionRate || 0}%</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-[10px] text-purple-600 font-bold uppercase m-0">Payment Success</p>
                        <p className="text-lg font-black text-purple-900 m-0 mt-1">{payments.successRate || 0}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "vendors" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h3 className="text-sm font-extrabold text-gray-900 m-0">🏆 Top 10 Vendors</h3>
                    <p className="text-xs text-gray-500 mt-0.5 m-0">Ranked by revenue</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Rank</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Store</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Comm.</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Orders</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Items</th>
                          <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">Revenue</th>
                          <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">Earned</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendors.top?.map((v, i) => (
                          <tr key={v.vendorId} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black ${
                                i === 0 ? "bg-yellow-100 text-yellow-700" :
                                i === 1 ? "bg-gray-200 text-gray-700" :
                                i === 2 ? "bg-amber-100 text-amber-700" :
                                "bg-gray-50 text-gray-500"
                              }`}>
                                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-bold text-gray-900 m-0">{v.storeName}</p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded">{v.commission}%</span>
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-bold text-gray-900">{v.orders}</td>
                            <td className="px-4 py-3 text-center text-sm text-gray-700">{v.itemsSold}</td>
                            <td className="px-4 py-3 text-right text-sm font-extrabold text-gray-900">
                              {formatPrice(v.revenue, currentCountry)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-extrabold text-green-700">
                              {formatPrice(v.commissionEarned, currentCountry)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {vendors.inactive?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-red-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-gray-100 bg-red-50">
                      <h3 className="text-sm font-extrabold text-red-900 m-0">⚠️ Inactive Vendors</h3>
                      <p className="text-xs text-red-600 mt-0.5 m-0">Need attention</p>
                    </div>
                    <div className="p-5 space-y-2">
                      {vendors.inactive.map((v) => (
                        <div key={v.vendorId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div>
                            <p className="text-sm font-bold text-gray-900 m-0">{v.storeName}</p>
                            <p className="text-xs text-red-600 m-0">{v.issue}</p>
                          </div>
                          <span className="text-xs font-bold text-red-700">{v.orders} orders</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "geography" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-4 m-0">📍 Top States by Revenue</h3>
                  <div className="space-y-2">
                    {geography.topStates?.map((s, i) => {
                      const pct = geography.topStates[0] ? (s.revenue / geography.topStates[0].revenue) * 100 : 0;
                      return (
                        <div key={s.state} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-gray-400">#{i + 1}</span>
                              <p className="text-sm font-bold text-gray-900 m-0">{s.state}</p>
                            </div>
                            <p className="text-sm font-extrabold text-gray-900">{formatPrice(s.revenue, currentCountry)}</p>
                          </div>
                          <div className="h-2 bg-white rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1 m-0">{s.orders} orders</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-4 m-0">🏙️ Top Cities</h3>
                  <div className="space-y-2">
                    {geography.topCities?.map((c, i) => (
                      <div key={c.city} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                            i === 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                          }`}>{i + 1}</span>
                          <div>
                            <p className="text-sm font-bold text-gray-900 m-0">{c.city}</p>
                            <p className="text-xs text-gray-500 m-0">{c.orders} orders</p>
                          </div>
                        </div>
                        <p className="text-sm font-extrabold text-blue-600">{formatPrice(c.revenue, currentCountry)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "payments" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-4 m-0">💳 Payment Methods</h3>
                  <div className="space-y-3">
                    {Object.entries(payments.methods || {}).map(([method, data]) => {
                      const total = Object.values(payments.methods).reduce((sum, m) => sum + m.count, 0);
                      const pct = total > 0 ? (data.count / total) * 100 : 0;
                      return (
                        <div key={method}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-gray-900 capitalize">{method}</span>
                            <span className="text-sm font-bold text-gray-700">{formatPrice(data.revenue, currentCountry)}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[10px] text-gray-500 m-0">{data.count} transactions · {Math.round(pct)}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-4 m-0">📊 Payment Status</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "paid", label: "Paid", color: "bg-green-500", icon: "✅" },
                      { key: "pending", label: "Pending", color: "bg-yellow-500", icon: "⏳" },
                      { key: "failed", label: "Failed", color: "bg-red-500", icon: "❌" },
                      { key: "refunded", label: "Refunded", color: "bg-pink-500", icon: "↺" },
                    ].map((s) => (
                      <div key={s.key} className="p-4 bg-gray-50 rounded-xl text-center">
                        <p className="text-2xl mb-1 m-0">{s.icon}</p>
                        <p className="text-2xl font-black text-gray-900 m-0">{payments.statusBreakdown?.[s.key] || 0}</p>
                        <p className="text-xs text-gray-500 m-0 mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl text-center">
                    <p className="text-xs text-green-700 font-bold uppercase m-0">Success Rate</p>
                    <p className="text-3xl font-black text-green-800 m-0 mt-1">{payments.successRate || 0}%</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "coupons" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-5 text-white">
                    <p className="text-xs opacity-80 font-bold uppercase m-0">Total Discount Given</p>
                    <p className="text-2xl font-black m-0 mt-1">{formatPrice(coupons.totalDiscount || 0, currentCountry)}</p>
                    <p className="text-xs opacity-70 mt-1 m-0">To customers</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
                    <p className="text-xs opacity-80 font-bold uppercase m-0">Revenue Generated</p>
                    <p className="text-2xl font-black m-0 mt-1">{formatPrice(coupons.totalRevenue || 0, currentCountry)}</p>
                    <p className="text-xs opacity-70 mt-1 m-0">From coupon orders</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
                    <p className="text-xs opacity-80 font-bold uppercase m-0">Orders w/ Coupons</p>
                    <p className="text-2xl font-black m-0 mt-1">{coupons.ordersWithCoupons || 0}</p>
                    <p className="text-xs opacity-70 mt-1 m-0">Total redemptions</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-100 bg-orange-50">
                    <h3 className="text-sm font-extrabold text-gray-900 m-0">🎟️ Top Performing Coupons</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Code</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Used</th>
                          <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">Discount</th>
                          <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">Revenue</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">ROI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coupons.top?.map((c) => (
                          <tr key={c.code} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded">{c.code}</span>
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-bold">{c.usedCount}x</td>
                            <td className="px-4 py-3 text-right text-sm text-red-600">-{formatPrice(c.totalDiscount, currentCountry)}</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-green-700">{formatPrice(c.revenueGenerated, currentCountry)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs font-black px-2 py-1 rounded ${c.roi > 5 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                {c.roi}x
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "products" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-100 bg-fuchsia-50">
                    <h3 className="text-sm font-extrabold text-gray-900 m-0">🔥 Top Selling Products (Platform-wide)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">#</th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Product</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Units Sold</th>
                          <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">Revenue</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Vendors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.top?.map((p, i) => (
                          <tr key={p.productId} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black bg-fuchsia-100 text-fuchsia-700">{i + 1}</span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-bold text-gray-900 m-0">{p.name}</p>
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-bold">{p.unitsSold}</td>
                            <td className="px-4 py-3 text-right text-sm font-extrabold text-fuchsia-700">
                              {formatPrice(p.revenue, currentCountry)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">{p.uniqueVendors}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-100 bg-blue-50">
                    <h3 className="text-sm font-extrabold text-gray-900 m-0">📦 Category Performance</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Category</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Products</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Approved</th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Orders</th>
                          <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.top?.map((c) => (
                          <tr key={c.categoryId} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-bold text-gray-900">{c.name}</td>
                            <td className="px-4 py-3 text-center text-sm">{c.productCount}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">{c.approvedProducts}</span>
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-bold">{c.orders}</td>
                            <td className="px-4 py-3 text-right text-sm font-extrabold text-blue-700">
                              {formatPrice(c.revenue, currentCountry)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "customers" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-5 text-white text-center">
                    <p className="text-2xl mb-2 m-0">🔥</p>
                    <p className="text-3xl font-black m-0">{customers.segments?.vip || 0}</p>
                    <p className="text-xs opacity-80 mt-1 m-0">VIP Customers</p>
                    <p className="text-[10px] opacity-60 m-0">10+ orders</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-5 text-white text-center">
                    <p className="text-2xl mb-2 m-0">⭐</p>
                    <p className="text-3xl font-black m-0">{customers.segments?.regular || 0}</p>
                    <p className="text-xs opacity-80 mt-1 m-0">Regular Customers</p>
                    <p className="text-[10px] opacity-60 m-0">3-9 orders</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white text-center">
                    <p className="text-2xl mb-2 m-0">📦</p>
                    <p className="text-3xl font-black m-0">{customers.segments?.occasional || 0}</p>
                    <p className="text-xs opacity-80 mt-1 m-0">Occasional</p>
                    <p className="text-[10px] opacity-60 m-0">1-2 orders</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white text-center">
                    <p className="text-2xl mb-2 m-0">🆕</p>
                    <p className="text-3xl font-black m-0">{customers.newThisMonth || 0}</p>
                    <p className="text-xs opacity-80 mt-1 m-0">New This Month</p>
                    <p className="text-[10px] opacity-60 m-0">Growth</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase m-0">Total Customers</p>
                      <p className="text-3xl font-black text-gray-900 m-0 mt-1">{customers.total || 0}</p>
                    </div>
                    <div className="border-l border-r border-gray-100">
                      <p className="text-xs text-gray-500 font-bold uppercase m-0">Active Customers</p>
                      <p className="text-3xl font-black text-blue-700 m-0 mt-1">{customers.active || 0}</p>
                      <p className="text-[10px] text-gray-400 m-0 mt-1">
                        {customers.total > 0 ? Math.round((customers.active / customers.total) * 100) : 0}% engagement
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase m-0">Customer LTV</p>
                      <p className="text-3xl font-black text-green-700 m-0 mt-1">{formatPrice(customers.clv || 0, currentCountry)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminSalesReportPage;