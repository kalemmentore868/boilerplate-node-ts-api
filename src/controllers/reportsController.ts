// src/controllers/reportController.ts
import PDFDocument from "pdfkit";
import OpenAI from "openai";
import { db } from "../db";
import { Customers, Orders, OrderItems, Products } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { NextFunction, Request, Response } from "express";

// Initialize OpenAI
const client = new OpenAI();

// Helper to build the chart renderer
const chartWidth = 800;
const chartHeight = 400;
const chartJs = new ChartJSNodeCanvas({
  width: chartWidth,
  height: chartHeight,
});

export async function generateCustomerReportPDF(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id: customerId } = req.params;

    // 1) Load customer + orders + order items + product categories
    const [customer] = await db
      .select()
      .from(Customers)
      .where(eq(Customers.id, customerId))
      .execute();

    const orders = await db
      .select()
      .from(Orders)
      .where(eq(Orders.customerId, customerId))
      .execute();

    const orderIds = orders.map((o) => o.id);

    const items = await db
      .select({
        orderId: OrderItems.orderId,
        quantity: OrderItems.quantity,
        productId: OrderItems.productId,
        totalPrice: OrderItems.totalPrice,
        category: Products.category,
      })
      .from(OrderItems)
      .innerJoin(Products, eq(OrderItems.productId, Products.id))
      .where(inArray(OrderItems.orderId, orderIds)) // ← correct
      .execute();

    // 2) Compute stats
    const totalOrders = orders.length;
    const totalRevenue = orders
      .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0)
      .toFixed(2);

    // Group orders by month for the last 9 months
    const byMonthMap: Record<string, number> = {};
    const monthLabels: string[] = [];
    const now = new Date();
    for (let i = 8; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = m.toISOString().slice(0, 7); // "YYYY-MM"
      byMonthMap[key] = 0;
      monthLabels.push(key);
    }
    orders.forEach((o) => {
      const mo = new Date(o.orderDate).toISOString().slice(0, 7);
      if (byMonthMap.hasOwnProperty(mo)) byMonthMap[mo]++;
    });

    // Toy category distribution
    const catMap: Record<string, number> = {};
    items.forEach((it) => {
      catMap[it.category] = (catMap[it.category] || 0) + it.quantity;
    });

    // 3) Generate narrative via GPT
    const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});
    const topStatuses = Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([s, c]) => `${s}(${c})`)
      .join(", ");

    // Compute product‐level counts
    const prodCounts: Record<string, { name: string; qty: number }> = {};
    // First fetch product names in bulk
    const productIds = items.map((it) => it.productId);

    // fetch names & categories for just those IDs
    const prods = await db
      .select({
        id: Products.id,
        name: Products.name,
        category: Products.category,
      })
      .from(Products)
      .where(inArray(Products.id, productIds))
      .execute();

    for (const it of items) {
      const prod = prods.find((p) => p.id === it.productId)!;
      if (!prodCounts[it.productId])
        prodCounts[it.productId] = { name: prod.name, qty: 0 };
      prodCounts[it.productId].qty += it.quantity;
    }
    const topProducts = Object.values(prodCounts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3)
      .map((p) => `${p.name}(${p.qty})`)
      .join(", ");

    // We already built `catMap`, so:
    const topCategories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, qty]) => `${cat}(${qty})`)
      .join(", ");

    // Seasonality: count by month
    const monthMap: Record<string, number> = {};
    orders.forEach((o) => {
      const m = new Date(o.orderDate).toLocaleString("default", {
        month: "long",
      });
      monthMap[m] = (monthMap[m] || 0) + 1;
    });
    const topMonth =
      Object.entries(monthMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    const months = monthLabels; // e.g. ["2024-12","2025-01",…]
    const monthCounts = months.map((m) => byMonthMap[m]);
    const ordersChart = await chartJs.renderToBuffer({
      type: "line",
      data: {
        labels: months,
        datasets: [
          {
            label: "Orders",
            data: monthCounts,
            fill: false,
            tension: 0.4,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: "Month" } },
          y: { title: { display: true, text: "Count" } },
        },
      },
    });

    // 2) Revised prompt
    const prompt = `
You are a business analyst specializing in retail toy sales for ToyOrbit.
Write a concise 4–5 sentence executive summary for customer ${customer.name}:
• Total orders: ${totalOrders}
• Total revenue: $${totalRevenue}
• Status breakdown: ${topStatuses}
• Recent daily order counts (last 9 months): ${months
      .map((m) => `${m}:${byMonthMap[m]}`)
      .join(", ")}
• Top products: ${topProducts}
• Top categories: ${topCategories}
• Peak purchase month: ${topMonth}
Highlight any interesting patterns in their buying behavior.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    const summary = completion.choices[0].message?.content?.trim() || "";

    // 4) Build chart images

    // 4b) Category distribution (pie chart)
    const categories = Object.keys(catMap);
    const catCounts = Object.values(catMap);
    const catChart = await chartJs.renderToBuffer({
      type: "pie",
      data: {
        labels: categories,
        datasets: [
          {
            label: "Toy Categories",
            data: catCounts,
            backgroundColor: [
              "#4f46e5",
              "#ea580c",
              "#16a34a",
              "#db2777",
              "#0369a1",
              "#eab308",
            ],
          },
        ],
      },
      options: {
        plugins: { legend: { position: "right" } },
      },
    });

    // 5) Stream PDF back
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=report-${customer.name}.pdf`
    );

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    // --- Header & Summary ---
    doc
      .fontSize(20)
      .text(`Customer Report: ${customer.name}`, { align: "center" })
      .moveDown();
    doc.fontSize(12).text(summary).moveDown();

    // --- Stats quick list ---
    doc.fontSize(14).text("Statistics", { underline: true });
    doc
      .fontSize(12)
      .list([
        `Total Orders: ${totalOrders}`,
        `Total Revenue: $${totalRevenue}`,
        `Status Breakdown: ${topStatuses}`,
      ])
      .moveDown();

    // --- Embed Orders Chart ---
    doc
      .fontSize(14)
      .text("Orders Over Last 9 Months", { underline: true })
      .moveDown(0.5);
    doc.image(ordersChart, { fit: [500, 300], align: "center" }).moveDown();

    // --- Embed Category Chart ---
    doc
      .fontSize(14)
      .text("Toy Category Distribution", { underline: true })
      .moveDown(0.5);
    doc.image(catChart, { fit: [400, 300], align: "center" }).moveDown();

    // --- Products Purchased Summary ---
    doc
      .addPage()
      .fontSize(14)
      .text("Products Purchased", { underline: true })
      .moveDown(0.5);

    // Render each product  total quantity
    Object.values(prodCounts).forEach(({ name, qty }) => {
      doc.fontSize(12).text(`• ${name}: ${qty}`, { indent: 20 }).moveDown(0.2);
    });
    doc.moveDown();

    // --- Orders Table ---
    doc.addPage();
    doc.fontSize(14).text("All Orders", { underline: true }).moveDown();
    // Table header
    const startX = 50;
    doc
      .fontSize(12)
      .text("Date", startX, doc.y, { continued: true })
      .text("Status", startX + 120, doc.y, { continued: true })
      .text("Total", startX + 260, doc.y);
    doc.moveDown(0.5);

    // Rows
    orders.forEach((o) => {
      doc
        .text(new Date(o.orderDate).toLocaleDateString(), startX, doc.y, {
          continued: true,
        })
        .text(o.status, startX + 120, doc.y, { continued: true })
        .text(`$${o.totalAmount}`, startX + 260, doc.y);
      doc.moveDown(0.3);
    });

    doc.end();
  } catch (e) {
    next(e);
  }
}
