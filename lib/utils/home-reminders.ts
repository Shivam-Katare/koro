import type { Product, RestockOrder, StockMovement, SalesSlip } from "@/lib/supabase/types";
import type { DashboardTab } from "@/lib/hooks/use-dashboard-nav";

export interface GentleReminder {
  id: string;
  category: "memory" | "operational" | "seasonal" | "reassurance";
  priority: "high" | "medium" | "low";
  iconType: "package" | "alert" | "truck" | "calendar" | "map-pin" | "check-circle" | "sparkles" | "trending-up";
  title: string;
  description: string;
  timeTag: string;
  actionLabel?: string;
  actionTab?: DashboardTab;
  badgeText?: string;
  badgeVariant?: "default" | "destructive" | "outline" | "secondary";
}

interface ComputeRemindersInput {
  products: Product[];
  restockOrders?: RestockOrder[];
  stockMovements?: StockMovement[];
  salesSlips?: SalesSlip[];
  shopCategory?: string | null;
}

// Key Retail & Festive Seasons in India with approximate annual periods
const FESTIVAL_CALENDAR = [
  { name: "Holi Festival of Colors", month: 3, day: 15, tag: "Holi Preparation" },
  { name: "Eid Festive Season", month: 4, day: 1, tag: "Festive Apparel & Beauty" },
  { name: "Raksha Bandhan", month: 8, day: 19, tag: "Gifting & Bangles" },
  { name: "Navratri & Dussehra", month: 10, day: 2, tag: "Puja & Fashion Rush" },
  { name: "Karwa Chauth", month: 10, day: 20, tag: "Sringar & Jewelry Peak" },
  { name: "Diwali & Dhanteras", month: 11, day: 1, tag: "Grand Festive Season" },
  { name: "Wedding Season & New Year", month: 12, day: 15, tag: "Wedding Shopping Rush" },
];

export function computeGentleReminders({
  products,
  restockOrders = [],
  stockMovements = [],
  salesSlips = [],
  shopCategory = "General Store",
}: ComputeRemindersInput): GentleReminder[] {
  const reminders: GentleReminder[] = [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // --------------------------------------------------------------------------
  // 1. RECENT MEMORY ANCHORS: Yesterday's Stock Additions & Locations
  // --------------------------------------------------------------------------
  // Look for stock movements in the last 48 hours
  const recentMovements = stockMovements.filter((m) => {
    const moveDate = new Date(m.created_at);
    return moveDate >= twoDaysAgo;
  });

  // Check if any product was placed or updated with a location recently
  const recentRestocks = recentMovements.filter(
    (m) => m.reason === "delivery_restock" || m.reason === "manual_adjustment" || m.quantity_delta > 0
  );

  if (recentRestocks.length > 0) {
    const topMove = recentRestocks[0];
    const matchingProduct = products.find((p) => p.id === topMove.product_id);
    const prodName = matchingProduct?.name || "Inventory stock";
    const location = matchingProduct?.storage_location;
    const isYesterday = new Date(topMove.created_at) < oneDayAgo;

    if (location) {
      reminders.push({
        id: `memory-stock-loc-${topMove.id}`,
        category: "memory",
        priority: "medium",
        iconType: "map-pin",
        title: `${prodName} placed at ${location}`,
        description: `${isYesterday ? "Yesterday" : "Recently"}, you updated stock (+${topMove.quantity_delta} units) at ${location}.`,
        timeTag: isYesterday ? "Yesterday's Update" : "Recent Update",
        actionLabel: `View in Products →`,
        actionTab: "products",
        badgeText: "Location Anchor",
        badgeVariant: "secondary",
      });
    } else {
      reminders.push({
        id: `memory-stock-add-${topMove.id}`,
        category: "memory",
        priority: "medium",
        iconType: "package",
        title: `Restocked ${topMove.quantity_delta} units of ${prodName}`,
        description: `Your stock was updated to ${topMove.new_stock} total units. Ready for today's walk-in customers.`,
        timeTag: isYesterday ? "Yesterday's Restock" : "Today's Restock",
        actionLabel: `Check Products →`,
        actionTab: "products",
        badgeText: "Stock Update",
        badgeVariant: "secondary",
      });
    }
  }

  // --------------------------------------------------------------------------
  // 2. RECENT MEMORY ANCHORS: Pending Supplier Slips
  // --------------------------------------------------------------------------
  const pendingOrders = restockOrders.filter((o) => o.status === "ordered");
  if (pendingOrders.length > 0) {
    const latestOrder = pendingOrders[0];
    const orderDate = new Date(latestOrder.order_date || latestOrder.created_at);
    const isYesterdayOrEarlier = orderDate < oneDayAgo;

    reminders.push({
      id: `operational-pending-order-${latestOrder.id}`,
      category: "operational",
      priority: "high",
      iconType: "truck",
      title: `Supplier Delivery Pending (${latestOrder.total_items} items)`,
      description: `${
        isYesterdayOrEarlier ? "You created a restock slip yesterday" : "You have an active restock order"
      } for ${latestOrder.total_units} total units (Slip #${latestOrder.order_number}). Have they arrived?`,
      timeTag: isYesterdayOrEarlier ? "Pending Delivery" : "Order Placed",
      actionLabel: `Record Stock Arrival →`,
      actionTab: "restock",
      badgeText: "Order Follow-up",
      badgeVariant: "default",
    });
  }

  // --------------------------------------------------------------------------
  // 3. IMMEDIATE ATTENTION: Low Stock & Out of Stock Warnings
  // --------------------------------------------------------------------------
  const outOfStock = products.filter(
    (p) => p.current_stock <= 0 || p.stock_status === "out_of_stock"
  );
  const lowStock = products.filter(
    (p) =>
      p.current_stock > 0 &&
      (p.current_stock <= (p.min_stock_threshold ?? 5) || p.stock_status === "low_stock")
  );

  if (outOfStock.length > 0) {
    const sampleNames = outOfStock.slice(0, 2).map((p) => p.name).join(", ");
    reminders.push({
      id: "operational-out-of-stock",
      category: "operational",
      priority: "high",
      iconType: "alert",
      title: `${outOfStock.length} item${outOfStock.length > 1 ? "s" : ""} completely out of stock`,
      description: `${sampleNames}${
        outOfStock.length > 2 ? ` and ${outOfStock.length - 2} more` : ""
      } have 0 stock remaining. Customers asking for these will return empty-handed.`,
      timeTag: "Needs Reorder",
      actionLabel: `Prepare Restock Slip →`,
      actionTab: "restock",
      badgeText: "Urgent",
      badgeVariant: "destructive",
    });
  } else if (lowStock.length > 0) {
    const sampleNames = lowStock.slice(0, 2).map((p) => p.name).join(", ");
    reminders.push({
      id: "operational-low-stock",
      category: "operational",
      priority: "medium",
      iconType: "alert",
      title: `${lowStock.length} product${lowStock.length > 1 ? "s" : ""} running low`,
      description: `${sampleNames} reached the reorder threshold. Restock before the weekend rush.`,
      timeTag: "Low Stock Alert",
      actionLabel: `Review in Restock →`,
      actionTab: "restock",
      badgeText: "Threshold Reached",
      badgeVariant: "default",
    });
  }

  // --------------------------------------------------------------------------
  // 4. MEMORY ANCHORS: Yesterday's Sales Recap
  // --------------------------------------------------------------------------
  const yesterdaySlips = salesSlips.filter((s) => {
    const sDate = new Date(s.created_at);
    return sDate >= twoDaysAgo && sDate < oneDayAgo;
  });

  if (yesterdaySlips.length > 0) {
    const totalAmount = yesterdaySlips.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
    const totalItems = yesterdaySlips.reduce((sum, s) => sum + (Number(s.total_items) || 0), 0);

    reminders.push({
      id: "memory-yesterday-sales",
      category: "memory",
      priority: "low",
      iconType: "trending-up",
      title: `Yesterday's Counter Sales: ₹${totalAmount.toLocaleString("en-IN")}`,
      description: `${totalItems} items were sold across ${yesterdaySlips.length} counter slips. Stock deductions are recorded.`,
      timeTag: "Yesterday's Summary",
      actionLabel: `View Sales Slips →`,
      actionTab: "sales",
      badgeText: "Daily Sales",
      badgeVariant: "secondary",
    });
  }

  // --------------------------------------------------------------------------
  // 5. UNASSIGNED SHELF LOCATIONS (Operational Hygiene)
  // --------------------------------------------------------------------------
  const unassignedLocationProducts = products.filter(
    (p) => !p.storage_location || p.storage_location.trim() === ""
  );

  if (unassignedLocationProducts.length > 0 && reminders.length < 4) {
    reminders.push({
      id: "operational-unassigned-location",
      category: "operational",
      priority: "low",
      iconType: "map-pin",
      title: `${unassignedLocationProducts.length} item${
        unassignedLocationProducts.length > 1 ? "s" : ""
      } without a shelf location`,
      description: `Assign rack, shelf, or drawer numbers so you or your staff can locate products in seconds.`,
      timeTag: "Quick Tip",
      actionLabel: `Assign Locations →`,
      actionTab: "products",
      badgeText: "Organization",
      badgeVariant: "outline",
    });
  }

  // --------------------------------------------------------------------------
  // 6. SEASONAL & FESTIVAL CALENDAR PULSE (India Context)
  // --------------------------------------------------------------------------
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  // Find next festival within 30 days
  const upcomingFestival = FESTIVAL_CALENDAR.find((fest) => {
    if (fest.month === currentMonth && fest.day >= currentDay) {
      return fest.day - currentDay <= 28;
    }
    if (fest.month === currentMonth + 1) {
      const daysLeftInMonth = 30 - currentDay;
      return daysLeftInMonth + fest.day <= 28;
    }
    return false;
  });

  if (upcomingFestival) {
    reminders.push({
      id: `seasonal-${upcomingFestival.name.toLowerCase().replace(/\s+/g, "-")}`,
      category: "seasonal",
      priority: "medium",
      iconType: "calendar",
      title: `${upcomingFestival.name} is approaching`,
      description: `Customer footfall and demand for ${
        shopCategory || "retail goods"
      } surge 1-2 weeks in advance. Start planning your inventory early.`,
      timeTag: "Upcoming Festival",
      actionLabel: `Plan Restock Order →`,
      actionTab: "restock",
      badgeText: upcomingFestival.tag,
      badgeVariant: "default",
    });
  }

  // --------------------------------------------------------------------------
  // 7. ALL CLEAR REASSURANCE (If store is 100% healthy)
  // --------------------------------------------------------------------------
  if (reminders.length === 0 && products.length > 0) {
    reminders.push({
      id: "reassurance-all-healthy",
      category: "reassurance",
      priority: "low",
      iconType: "check-circle",
      title: "All shelves are healthy & stocked",
      description: "No pending distributor deliveries or out-of-stock items today. Your shop is running smoothly!",
      timeTag: "All Clear",
      actionLabel: "View Catalog →",
      actionTab: "products",
      badgeText: "Smooth Operations",
      badgeVariant: "secondary",
    });
  }

  return reminders;
}
