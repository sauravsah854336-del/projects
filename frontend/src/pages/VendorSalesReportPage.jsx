import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetSalesReportQuery } from "../features/auth/authApi";
import { formatPrice } from "../utils/priceHelper";
import { toast } from "../components/Toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import PlatformLogo from "../assets/PlatformLogo.jpeg";

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

const VendorSalesReportPage = () => {
  const { currentCountry } = useSelector((s) => s.country);
  const [exporting, setExporting] = useState(null);
  const [refreshTs, setRefreshTs] = useState(Date.now());

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
    status: "all",
    groupBy: "day",
  });

  const { data, isLoading, isFetching } = useGetSalesReportQuery({
    ...filters,
    _t: refreshTs,
  });

  const report = data?.data;
  const summary = report?.summary || {};
  const orders = report?.orders || [];
  const chartData = report?.chartData || [];
  const topProducts = report?.topProducts || [];
  const topStates = report?.topStates || [];
  const statusBreakdown = report?.statusBreakdown || {};

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
      doc.text("Design your space, delivered", 14, 22);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SALES REPORT", pageWidth - 14, 15, { align: "right" });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${formatDateTime(new Date())}`, pageWidth - 14, 22, {
        align: "right",
      });

      doc.setTextColor(0, 0, 0);

      let y = 45;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Store: ${report?.vendor?.storeName || "N/A"}`, 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Report Period: ${filters.dateFrom} to ${filters.dateTo}`,
        14,
        y,
      );
      y += 5;
      doc.text(`Commission Rate: ${summary.commissionRate}%`, 14, y);
      y += 10;

      doc.setFillColor(239, 246, 255);
      doc.rect(14, y, pageWidth - 28, 30, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 64, 175);
      doc.text("SUMMARY", 18, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      const summaryData = [
        [`Total Orders:`, String(summary.totalOrders || 0)],
        [`Paid Orders:`, String(summary.totalPaidOrders || 0)],
        [`Delivered:`, String(summary.totalDeliveredOrders || 0)],
        [`Gross Revenue:`, formatPricePDF(summary.totalGross || 0)],
        [`Commission:`, formatPricePDF(summary.totalCommission || 0)],
        [`Net Earnings:`, formatPricePDF(summary.totalNet || 0)],
      ];

      let sx = 18;
      let sy = y + 12;
      summaryData.forEach(([label, value], i) => {
        if (i === 3) {
          sx = pageWidth / 2 + 5;
          sy = y + 12;
        }
        doc.setFont("helvetica", "bold");
        doc.text(label, sx, sy);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), sx + 35, sy);
        sy += 5;
      });

      y += 40;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Order Details", 14, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        head: [
          [
            "Order #",
            "Date",
            "Customer",
            "Qty",
            "Gross",
            "Commission",
            "Net",
            "Status",
          ],
        ],
        body: orders
          .slice(0, 50)
          .map((o) => [
            o.orderNumber,
            formatDate(o.date),
            o.customer,
            String(o.totalQuantity),
            formatPricePDF(o.grossAmount),
            formatPricePDF(o.commission),
            formatPricePDF(o.netEarning),
            o.orderStatus.toUpperCase(),
          ]),
        theme: "grid",
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold",
        },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 18 },
          2: { cellWidth: 24 },
          3: { cellWidth: 10, halign: "center" },
          4: { cellWidth: 22, halign: "right" },
          5: { cellWidth: 22, halign: "right" },
          6: { cellWidth: 22, halign: "right" },
          7: { cellWidth: 25 },
        },
      });

      let finalY = doc.lastAutoTable.finalY + 10;

      if (topProducts.length > 0) {
        if (finalY > 240) {
          doc.addPage();
          finalY = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Top Selling Products", 14, finalY);
        finalY += 5;

        autoTable(doc, {
          startY: finalY,
          head: [["Product", "Quantity Sold", "Revenue"]],
          body: topProducts
            .slice(0, 10)
            .map((p) => [p.name, String(p.qty), formatPricePDF(p.revenue)]),
          theme: "grid",
          headStyles: {
            fillColor: [16, 185, 129],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: "bold",
          },
          bodyStyles: { fontSize: 8 },
          alternateRowStyles: { fillColor: [240, 253, 244] },
          columnStyles: {
            1: { halign: "center" },
            2: { halign: "right" },
          },
        });

        finalY = doc.lastAutoTable.finalY + 10;
      }

      if (topStates.length > 0) {
        if (finalY > 240) {
          doc.addPage();
          finalY = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Top Locations", 14, finalY);
        finalY += 5;

        autoTable(doc, {
          startY: finalY,
          head: [["State", "Orders", "Revenue"]],
          body: topStates.map((s) => [
            s.state,
            String(s.orders),
            formatPricePDF(s.revenue),
          ]),
          theme: "grid",
          headStyles: {
            fillColor: [124, 58, 237],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: "bold",
          },
          bodyStyles: { fontSize: 8 },
          alternateRowStyles: { fillColor: [250, 245, 255] },
          columnStyles: {
            1: { halign: "center" },
            2: { halign: "right" },
          },
        });
      }

      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" },
        );
        doc.text(
          `shop.design - A product of Quleep Pvt Ltd`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 5,
          { align: "center" },
        );
      }

      const filename = `sales-report-${filters.dateFrom}-to-${filters.dateTo}.pdf`;
      doc.save(filename);
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setExporting(null);
    }
  };

  const exportCSV = () => {
    setExporting("csv");
    try {
      const headers = [
        "Order Number",
        "Date",
        "Customer",
        "City",
        "State",
        "Items",
        "Quantity",
        "Gross Amount",
        "Commission",
        "Net Earning",
        "Payment Method",
        "Payment Status",
        "Order Status",
        "Coupon",
      ];

      const rows = orders.map((o) => [
        o.orderNumber,
        formatDate(o.date),
        o.customer,
        o.customerCity,
        o.customerState,
        o.itemCount,
        o.totalQuantity,
        o.grossAmount,
        o.commission,
        o.netEarning,
        o.paymentMethod,
        o.paymentStatus,
        o.orderStatus,
        o.couponCode,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

      const summaryHeader = [
        "",
        "SUMMARY REPORT",
        "",
        `Period: ${filters.dateFrom} to ${filters.dateTo}`,
        `Store: ${report?.vendor?.storeName}`,
        `Total Orders: ${summary.totalOrders}`,
        `Gross Revenue: ${summary.totalGross}`,
        `Commission: ${summary.totalCommission}`,
        `Net Earnings: ${summary.totalNet}`,
        "",
        "",
      ].join("\n");

      const finalCsv = summaryHeader + csvContent;

      const blob = new Blob([finalCsv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `sales-report-${filters.dateFrom}-to-${filters.dateTo}.csv`;
      link.click();

      toast.success("CSV downloaded successfully!");
    } catch (err) {
      toast.error("Failed to generate CSV");
    } finally {
      setExporting(null);
    }
  };

  const exportExcel = () => {
    setExporting("excel");
    try {
      const wb = XLSX.utils.book_new();

      const summarySheet = XLSX.utils.aoa_to_sheet([
        ["SHOP.DESIGN - SALES REPORT"],
        [""],
        ["Store Name:", report?.vendor?.storeName || "N/A"],
        ["Report Period:", `${filters.dateFrom} to ${filters.dateTo}`],
        ["Generated:", formatDateTime(new Date())],
        [""],
        ["SUMMARY"],
        ["Metric", "Value"],
        ["Total Orders", summary.totalOrders || 0],
        ["Paid Orders", summary.totalPaidOrders || 0],
        ["Delivered Orders", summary.totalDeliveredOrders || 0],
        ["Total Quantity Sold", summary.totalQuantity || 0],
        ["Gross Revenue", summary.totalGross || 0],
        ["Commission", summary.totalCommission || 0],
        ["Net Earnings", summary.totalNet || 0],
        ["Average Order Value", summary.averageOrderValue || 0],
        ["Commission Rate", `${summary.commissionRate}%`],
        ["Conversion Rate", `${summary.conversionRate}%`],
      ]);

      summarySheet["!cols"] = [{ wch: 25 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

      const ordersSheet = XLSX.utils.json_to_sheet(
        orders.map((o) => ({
          "Order Number": o.orderNumber,
          Date: formatDate(o.date),
          Customer: o.customer,
          City: o.customerCity,
          State: o.customerState,
          "Item Count": o.itemCount,
          Quantity: o.totalQuantity,
          "Gross Amount": o.grossAmount,
          Commission: o.commission,
          "Net Earning": o.netEarning,
          "Payment Method": o.paymentMethod,
          "Payment Status": o.paymentStatus,
          "Order Status": o.orderStatus,
          Coupon: o.couponCode,
        })),
      );

      ordersSheet["!cols"] = [
        { wch: 18 },
        { wch: 12 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 10 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 12 },
        { wch: 14 },
        { wch: 14 },
        { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, ordersSheet, "Orders");

      const productsSheet = XLSX.utils.json_to_sheet(
        topProducts.map((p, i) => ({
          Rank: i + 1,
          "Product Name": p.name,
          "Quantity Sold": p.qty,
          Revenue: p.revenue,
        })),
      );
      productsSheet["!cols"] = [
        { wch: 8 },
        { wch: 40 },
        { wch: 15 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, productsSheet, "Top Products");

      const statesSheet = XLSX.utils.json_to_sheet(
        topStates.map((s, i) => ({
          Rank: i + 1,
          State: s.state,
          Orders: s.orders,
          Revenue: s.revenue,
        })),
      );
      statesSheet["!cols"] = [
        { wch: 8 },
        { wch: 25 },
        { wch: 12 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, statesSheet, "Top Locations");

      XLSX.writeFile(
        wb,
        `sales-report-${filters.dateFrom}-to-${filters.dateTo}.xlsx`,
      );
      toast.success("Excel file downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Excel");
    } finally {
      setExporting(null);
    }
  };

  const maxChart =
    chartData.length > 0 ? Math.max(...chartData.map((d) => d.gross), 1) : 1;

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Link
          to="/vendor/dashboard"
          className="inline-flex items-center gap-1.5 text-gray-500 text-[13px] font-semibold no-underline mb-5 hover:text-gray-700"
        >
          ← Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 m-0 flex items-center gap-2">
              📊 Sales Report
            </h1>
            <p className="text-sm text-gray-500 mt-1 m-0">
              Complete sales analytics & downloadable reports
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              disabled={exporting || isLoading || orders.length === 0}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition font-[inherit] shadow-md"
            >
              {exporting === "pdf" ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  PDF...
                </>
              ) : (
                <>📄 Download PDF</>
              )}
            </button>
            <button
              onClick={exportExcel}
              disabled={exporting || isLoading || orders.length === 0}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition font-[inherit] shadow-md"
            >
              {exporting === "excel" ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Excel...
                </>
              ) : (
                <>📊 Excel</>
              )}
            </button>
            <button
              onClick={exportCSV}
              disabled={exporting || isLoading || orders.length === 0}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition font-[inherit] shadow-md"
            >
              {exporting === "csv" ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  CSV...
                </>
              ) : (
                <>📋 CSV</>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase">
                From:
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters({ ...filters, dateFrom: e.target.value })
                }
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-[inherit]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase">
                To:
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters({ ...filters, dateTo: e.target.value })
                }
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-[inherit]"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm cursor-pointer font-[inherit]"
            >
              <option value="all">All Status</option>
              <option value="delivered">Delivered</option>
              <option value="shipped">Shipped</option>
              <option value="processing">Processing</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filters.groupBy}
              onChange={(e) =>
                setFilters({ ...filters, groupBy: e.target.value })
              }
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm cursor-pointer font-[inherit]"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>

            <div className="flex gap-1.5 border-l border-gray-200 pl-3">
              {[
                { label: "7D", days: 7 },
                { label: "30D", days: 30 },
                { label: "90D", days: 90 },
                { label: "1Y", days: 365 },
              ].map((r) => (
                <button
                  key={r.label}
                  onClick={() => setQuickRange(r.days)}
                  className="text-xs font-bold text-gray-600 bg-gray-100 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-lg cursor-pointer transition font-[inherit] border-none"
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setRefreshTs(Date.now());
                toast.info("🔄 Refreshing report...");
              }}
              disabled={isFetching}
              className="ml-auto flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg cursor-pointer transition font-[inherit] border-none disabled:opacity-50"
            >
              {isFetching ? (
                <>
                  <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Refreshing...
                </>
              ) : (
                "🔄 Refresh"
              )}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Generating your report...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: "Gross Revenue",
                  value: formatPrice(summary.totalGross || 0, currentCountry),
                  icon: "💰",
                  color: "from-blue-500 to-blue-600",
                  sub: `${summary.totalPaidOrders || 0} paid orders`,
                },
                {
                  label: "Net Earnings",
                  value: formatPrice(summary.totalNet || 0, currentCountry),
                  icon: "💎",
                  color: "from-green-500 to-emerald-600",
                  sub: `After ${summary.commissionRate}% commission`,
                },
                {
                  label: "Avg Order Value",
                  value: formatPrice(
                    summary.averageOrderValue || 0,
                    currentCountry,
                  ),
                  icon: "📈",
                  color: "from-purple-500 to-indigo-600",
                  sub: `${summary.totalQuantity || 0} items sold`,
                },
                {
                  label: "Conversion Rate",
                  value: `${summary.conversionRate || 0}%`,
                  icon: "🎯",
                  color: "from-orange-500 to-red-600",
                  sub: `${summary.totalDeliveredOrders || 0} delivered`,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`bg-gradient-to-br ${stat.color} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{stat.icon}</span>
                    </div>
                    <p className="text-2xl font-black m-0">{stat.value}</p>
                    <p className="text-xs opacity-80 mt-1 m-0">{stat.label}</p>
                    <p className="text-[10px] opacity-60 mt-0.5 m-0">
                      {stat.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 m-0">
                      Revenue Trend
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 m-0">
                      {filters.groupBy === "day"
                        ? "Daily"
                        : filters.groupBy === "week"
                          ? "Weekly"
                          : "Monthly"}{" "}
                      breakdown
                    </p>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold">
                    {chartData.length} periods
                  </span>
                </div>

                {chartData.length > 0 ? (
                  <div className="flex items-end gap-2 h-48">
                    {chartData.slice(-15).map((point, i) => {
                      const height = (point.gross / maxChart) * 100;
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-1 group"
                        >
                          <div
                            className="relative w-full flex items-end justify-center"
                            style={{ height: "160px" }}
                          >
                            <div
                              className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-700 hover:to-blue-500 cursor-pointer"
                              style={{ height: `${Math.max(height, 3)}%` }}
                              title={`${point.period}: ${formatPrice(point.gross, currentCountry)}`}
                            />
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                              {formatPrice(point.gross, currentCountry)}
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
                    <p className="text-sm">No sales data in this period</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-extrabold text-gray-900 mb-4 m-0">
                  Order Status
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      label: "Delivered",
                      key: "delivered",
                      color: "bg-green-500",
                    },
                    { label: "Shipped", key: "shipped", color: "bg-blue-500" },
                    {
                      label: "Processing",
                      key: "processing",
                      color: "bg-yellow-500",
                    },
                    {
                      label: "Confirmed",
                      key: "confirmed",
                      color: "bg-indigo-500",
                    },
                    { label: "Pending", key: "pending", color: "bg-gray-400" },
                    {
                      label: "Cancelled",
                      key: "cancelled",
                      color: "bg-red-500",
                    },
                  ].map((item) => {
                    const count = statusBreakdown[item.key] || 0;
                    const total = summary.totalOrders || 1;
                    const percent = (count / total) * 100;
                    return (
                      <div key={item.key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 font-semibold">
                            {item.label}
                          </span>
                          <span className="font-bold text-gray-900">
                            {count}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-extrabold text-gray-900 mb-4 m-0 flex items-center gap-2">
                  🏆 Top Selling Products
                </h3>
                {topProducts.length > 0 ? (
                  <div className="space-y-2">
                    {topProducts.slice(0, 5).map((product, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                      >
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            i === 0
                              ? "bg-yellow-100 text-yellow-700"
                              : i === 1
                                ? "bg-gray-100 text-gray-600"
                                : i === 2
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-50 text-gray-400"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 m-0 truncate">
                            {product.name}
                          </p>
                          <p className="text-[10px] text-gray-500 m-0">
                            {product.qty} units sold
                          </p>
                        </div>
                        <span className="text-sm font-extrabold text-green-600">
                          {formatPrice(product.revenue, currentCountry)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-gray-400 py-8">
                    No product data
                  </p>
                )}
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-extrabold text-gray-900 mb-4 m-0 flex items-center gap-2">
                  📍 Top Locations
                </h3>
                {topStates.length > 0 ? (
                  <div className="space-y-2">
                    {topStates.map((state, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                      >
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            i === 0
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-50 text-gray-400"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-gray-900 m-0">
                            {state.state}
                          </p>
                          <p className="text-[10px] text-gray-500 m-0">
                            {state.orders} orders
                          </p>
                        </div>
                        <span className="text-sm font-extrabold text-blue-600">
                          {formatPrice(state.revenue, currentCountry)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-gray-400 py-8">
                    No location data
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-gray-900 m-0">
                  📋 Order Details
                </h3>
                <span className="text-xs text-gray-500">
                  Showing {orders.length} orders
                </span>
              </div>
              {orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                          Order #
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                          Customer
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                          Qty
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                          Gross
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                          Commission
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                          Net
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.orderId}
                          className="border-b border-gray-50 hover:bg-gray-50 transition"
                        >
                          <td className="px-4 py-3 text-xs font-bold text-gray-900">
                            {order.orderNumber}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {formatDate(order.date)}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-700">
                            <p className="font-semibold m-0">
                              {order.customer}
                            </p>
                            {order.customerCity && (
                              <p className="text-[10px] text-gray-400 m-0">
                                {order.customerCity}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-center font-bold text-gray-900">
                            {order.totalQuantity}
                          </td>
                          <td className="px-4 py-3 text-xs text-right font-bold text-gray-900">
                            {formatPrice(order.grossAmount, currentCountry)}
                          </td>
                          <td className="px-4 py-3 text-xs text-right font-bold text-red-600">
                            -{formatPrice(order.commission, currentCountry)}
                          </td>
                          <td className="px-4 py-3 text-xs text-right font-extrabold text-green-700">
                            {formatPrice(order.netEarning, currentCountry)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                order.orderStatus === "delivered"
                                  ? "bg-green-100 text-green-700"
                                  : order.orderStatus === "shipped"
                                    ? "bg-blue-100 text-blue-700"
                                    : order.orderStatus === "cancelled"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {order.orderStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-3 text-sm font-black text-gray-900"
                        >
                          TOTAL
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-black text-gray-900">
                          {formatPrice(summary.totalGross, currentCountry)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-black text-red-600">
                          -
                          {formatPrice(summary.totalCommission, currentCountry)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-black text-green-700">
                          {formatPrice(summary.totalNet, currentCountry)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-16 text-center">
                  <p className="text-5xl mb-3">📊</p>
                  <p className="text-lg font-bold text-gray-900">
                    No orders in this period
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Try changing your date range or filters
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-2xl shrink-0">💡</span>
              <div>
                <p className="text-sm font-bold text-blue-900 m-0">
                  Export Options
                </p>
                <p className="text-xs text-blue-700 m-0 mt-1 leading-relaxed">
                  <strong>PDF:</strong> Professional printable report with
                  summary and details.
                  <br />
                  <strong>Excel:</strong> Multiple sheets (Summary, Orders, Top
                  Products, Locations) — perfect for analysis.
                  <br />
                  <strong>CSV:</strong> Universal format for accounting software
                  and data import.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VendorSalesReportPage;
