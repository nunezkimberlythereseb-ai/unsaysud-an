import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  ShoppingCart,
  Calendar,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  ArrowRight,
  Sparkles,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Check,
  X,
  FileText,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Download,
  Copy
} from 'lucide-react';
import {
  DishItem,
  SalesRecord,
  SalesItemEntry,
  SalesDateFilter,
  SalesDashboardMetrics
} from '../types';
import {
  fetchStallSalesAPI,
  saveSalesRecordAPI,
  updateSalesRecordAPI,
  deleteSalesRecordAPI
} from '../services/api';

interface SmartSalesTrackerProps {
  stallName: string;
  menuItems: DishItem[];
  onTriggerToast?: (msg: string) => void;
}

export const SmartSalesTracker: React.FC<SmartSalesTrackerProps> = ({
  stallName,
  menuItems,
  onTriggerToast
}) => {
  // Navigation View Modes within Tracker
  // 1. 'overview': Main dashboard cards, trends, top sellers & quick launcher
  // 2. 'daily_summary': Option 1 form (Daily financial summary after closing stall)
  // 3. 'itemized': Option 2 form (Per-item sales tracker with multi-item breakdown)
  // 4. 'history': Reports, date range filters, detailed records table
  const [activeView, setActiveView] = useState<'overview' | 'daily_summary' | 'itemized' | 'history'>('overview');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Sales Records & Backend Metrics State
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [metrics, setMetrics] = useState<SalesDashboardMetrics | null>(null);

  // History & Filter State
  const [selectedDateFilter, setSelectedDateFilter] = useState<SalesDateFilter>('this_week');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [recordTypeFilter, setRecordTypeFilter] = useState<'all' | 'daily_summary' | 'itemized'>('all');

  // Expanded itemized record row in history table
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // Deletion Confirmation Modal State
  const [recordToDelete, setRecordToDelete] = useState<SalesRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Duplicate Resolution Modal State
  const [duplicatePrompt, setDuplicatePrompt] = useState<{
    show: boolean;
    existingId: string;
    message: string;
    payloadToSave: any;
  } | null>(null);

  // Editing Record Modal / Form State
  const [editingRecord, setEditingRecord] = useState<SalesRecord | null>(null);

  // --------------------------------------------------------------------------
  // FORM 1: DAILY SALES SUMMARY (OPTION 1)
  // --------------------------------------------------------------------------
  const [summaryDate, setSummaryDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [summarySalesInput, setSummarySalesInput] = useState<string>('');
  const [summaryExpensesInput, setSummaryExpensesInput] = useState<string>('');
  const [summaryNotes, setSummaryNotes] = useState<string>('');

  // Real-time calculation for Daily Summary
  const parsedSummarySales = Math.max(0, parseFloat(summarySalesInput) || 0);
  const parsedSummaryExpenses = Math.max(0, parseFloat(summaryExpensesInput) || 0);
  const calculatedSummaryProfit = parsedSummarySales - parsedSummaryExpenses;

  // --------------------------------------------------------------------------
  // FORM 2: PER-ITEM SALES TRACKER (OPTION 2)
  // --------------------------------------------------------------------------
  const [itemizedDate, setItemizedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [itemizedExpensesInput, setItemizedExpensesInput] = useState<string>('');
  const [itemizedNotes, setItemizedNotes] = useState<string>('');
  
  // Dynamic list of items being sold
  interface ItemDraftRow {
    tempId: string;
    dishId?: number;
    foodName: string;
    quantitySold: number;
    sellingPrice: number;
    isCustomDish: boolean;
  }

  // Initialize with a clean blank or first actual stall menu item row
  const [itemRows, setItemRows] = useState<ItemDraftRow[]>(() => {
    const firstDish = menuItems[0];
    return [
      {
        tempId: 'row_1',
        dishId: firstDish ? firstDish.id : undefined,
        foodName: firstDish ? firstDish.name : '',
        quantitySold: 1,
        sellingPrice: firstDish ? firstDish.price : 0,
        isCustomDish: !firstDish
      }
    ];
  });

  // Real-time calculations for Per-Item Tracker
  const computedItemizedTotalSales = useMemo(() => {
    return itemRows.reduce((sum, row) => sum + (row.quantitySold * row.sellingPrice), 0);
  }, [itemRows]);

  const computedItemizedTotalQuantity = useMemo(() => {
    return itemRows.reduce((sum, row) => sum + row.quantitySold, 0);
  }, [itemRows]);

  const parsedItemizedExpenses = Math.max(0, parseFloat(itemizedExpensesInput) || 0);
  const computedItemizedProfit = computedItemizedTotalSales - parsedItemizedExpenses;

  // --------------------------------------------------------------------------
  // LOAD SALES DATA FROM BACKEND / DATABASE
  // --------------------------------------------------------------------------
  const loadSalesData = async () => {
    setIsLoading(true);
    setErrorBanner(null);
    try {
      const res = await fetchStallSalesAPI(
        stallName,
        selectedDateFilter,
        selectedDateFilter === 'custom' ? customStartDate : undefined,
        selectedDateFilter === 'custom' ? customEndDate : undefined,
        recordTypeFilter
      );

      if (res.success) {
        setRecords(res.records || []);
        if (res.metrics) {
          setMetrics(res.metrics);
        }
      } else {
        setErrorBanner(res.error || 'Could not load sales data from database.');
      }
    } catch (err: any) {
      setErrorBanner('Network connection error while fetching sales records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSalesData();
  }, [stallName, selectedDateFilter, customStartDate, customEndDate, recordTypeFilter]);

  const triggerFeedback = (msg: string) => {
    setSuccessBanner(msg);
    if (onTriggerToast) onTriggerToast(msg);
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  // --------------------------------------------------------------------------
  // OPTION 1: SAVE DAILY SALES REPORT
  // --------------------------------------------------------------------------
  const handleSaveDailySummary = async (overrideDuplicate = false) => {
    setErrorBanner(null);

    if (!summaryDate) {
      setErrorBanner('Please select a valid date for this daily report.');
      return;
    }

    if (summarySalesInput.trim() === '' || isNaN(parsedSummarySales) || parsedSummarySales < 0) {
      setErrorBanner('Total Sales must be a valid non-negative amount.');
      return;
    }

    if (summaryExpensesInput.trim() === '' || isNaN(parsedSummaryExpenses) || parsedSummaryExpenses < 0) {
      setErrorBanner('Total Expenses must be a valid non-negative amount.');
      return;
    }

    setIsSaving(true);
    const payload = {
      stallName,
      recordType: 'daily_summary' as const,
      date: summaryDate,
      totalSales: parsedSummarySales,
      totalExpenses: parsedSummaryExpenses,
      notes: summaryNotes.trim() || undefined,
      overrideDuplicate
    };

    const res = await saveSalesRecordAPI(payload);
    setIsSaving(false);

    if (res.duplicate && !overrideDuplicate) {
      setDuplicatePrompt({
        show: true,
        existingId: res.existingId || '',
        message: res.message || `A Daily Sales Report for ${summaryDate} already exists.`,
        payloadToSave: payload
      });
      return;
    }

    if (res.success) {
      triggerFeedback(`Daily sales report for ${summaryDate} saved successfully!`);
      setSummaryNotes('');
      setDuplicatePrompt(null);
      loadSalesData();
      setActiveView('overview');
    } else {
      setErrorBanner(res.error || 'Failed to save daily sales report.');
    }
  };

  // --------------------------------------------------------------------------
  // OPTION 2: PER-ITEM TRACKER ACTIONS & SAVE
  // --------------------------------------------------------------------------
  const handleAddItemRow = () => {
    const nextDish = menuItems.find(m => !itemRows.some(row => row.foodName === m.name)) || menuItems[0];
    const newRow: ItemDraftRow = {
      tempId: `row_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      dishId: nextDish ? nextDish.id : undefined,
      foodName: nextDish ? nextDish.name : '',
      quantitySold: 1,
      sellingPrice: nextDish ? nextDish.price : 50,
      isCustomDish: !nextDish
    };
    setItemRows([...itemRows, newRow]);
  };

  const handleRemoveItemRow = (tempId: string) => {
    if (itemRows.length <= 1) {
      setErrorBanner('At least one food item is required for the per-item sales tracker.');
      return;
    }
    setItemRows(itemRows.filter(r => r.tempId !== tempId));
  };

  const handleRowChange = (
    tempId: string,
    field: keyof ItemDraftRow,
    value: any
  ) => {
    setItemRows(prev =>
      prev.map(row => {
        if (row.tempId !== tempId) return row;
        const updated = { ...row, [field]: value };

        // When user picks an existing dish from menu dropdown
        if (field === 'foodName') {
          const selectedDish = menuItems.find(m => m.name === value);
          if (selectedDish) {
            updated.dishId = selectedDish.id;
            updated.sellingPrice = selectedDish.price;
            updated.isCustomDish = false;
          } else if (value === '__custom__') {
            updated.dishId = undefined;
            updated.foodName = '';
            updated.isCustomDish = true;
          }
        }
        return updated;
      })
    );
  };

  const handleSaveItemizedRecord = async (overrideDuplicate = false) => {
    setErrorBanner(null);

    if (!itemizedDate) {
      setErrorBanner('Please select a valid date.');
      return;
    }

    if (itemRows.length === 0) {
      setErrorBanner('Please add at least one food item.');
      return;
    }

    for (let i = 0; i < itemRows.length; i++) {
      const r = itemRows[i];
      if (!r.foodName.trim()) {
        setErrorBanner(`Item #${i + 1} is missing a food name. Please choose or enter a dish.`);
        return;
      }
      if (r.quantitySold <= 0) {
        setErrorBanner(`Item "${r.foodName}" has 0 quantity sold. Please enter 1 or more.`);
        return;
      }
      if (r.sellingPrice < 0) {
        setErrorBanner(`Item "${r.foodName}" has an invalid price.`);
        return;
      }
    }

    setIsSaving(true);
    const payload = {
      stallName,
      recordType: 'itemized' as const,
      date: itemizedDate,
      totalSales: computedItemizedTotalSales,
      totalExpenses: parsedItemizedExpenses,
      notes: itemizedNotes.trim() || undefined,
      items: itemRows.map((r, idx) => ({
        id: `item_${Date.now()}_${idx}`,
        dishId: r.dishId,
        foodName: r.foodName.trim(),
        quantitySold: r.quantitySold,
        sellingPrice: r.sellingPrice,
        totalSales: r.quantitySold * r.sellingPrice
      })),
      overrideDuplicate
    };

    const res = await saveSalesRecordAPI(payload);
    setIsSaving(false);

    if (res.duplicate && !overrideDuplicate) {
      setDuplicatePrompt({
        show: true,
        existingId: res.existingId || '',
        message: res.message || `An Itemized Sales Record for ${itemizedDate} already exists.`,
        payloadToSave: payload
      });
      return;
    }

    if (res.success) {
      triggerFeedback(`Per-item sales record for ${itemizedDate} saved with ${computedItemizedTotalQuantity} items sold!`);
      setItemizedNotes('');
      setDuplicatePrompt(null);
      loadSalesData();
      setActiveView('overview');
    } else {
      setErrorBanner(res.error || 'Failed to save per-item sales record.');
    }
  };

  // --------------------------------------------------------------------------
  // EDIT & DELETE ACTIONS
  // --------------------------------------------------------------------------
  const handleOpenEditRecord = (rec: SalesRecord) => {
    setEditingRecord(JSON.parse(JSON.stringify(rec)));
  };

  const handleSaveEditedRecord = async () => {
    if (!editingRecord) return;
    setIsSaving(true);
    setErrorBanner(null);

    const res = await updateSalesRecordAPI(editingRecord.id, {
      date: editingRecord.date,
      totalSales: editingRecord.totalSales,
      totalExpenses: editingRecord.totalExpenses,
      notes: editingRecord.notes,
      items: editingRecord.items
    });

    setIsSaving(false);
    if (res.success) {
      triggerFeedback('Record updated successfully.');
      setEditingRecord(null);
      loadSalesData();
    } else {
      setErrorBanner(res.error || 'Failed to update record.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    setIsDeleting(true);
    const res = await deleteSalesRecordAPI(recordToDelete.id);
    setIsDeleting(false);

    if (res.success) {
      triggerFeedback(`Record for ${recordToDelete.date} was deleted.`);
      setRecordToDelete(null);
      loadSalesData();
    } else {
      setErrorBanner(res.error || 'Failed to delete record.');
    }
  };

  // Format Currency in Philippine Peso
  const formatPeso = (val: number | undefined | null) => {
    if (typeof val !== 'number' || isNaN(val)) return '₱0.00';
    return `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatShortPeso = (val: number | undefined | null) => {
    if (typeof val !== 'number' || isNaN(val)) return '₱0';
    return `₱${val.toLocaleString('en-PH')}`;
  };

  // Helper for trend chart rendering
  const chartDays = useMemo(() => {
    const list: { date: string; label: string; sales: number; expenses: number; profit: number }[] = [];
    const dateMap = new Map<string, SalesRecord[]>();
    records.forEach(r => {
      const existing = dateMap.get(r.date) || [];
      existing.push(r);
      dateMap.set(r.date, existing);
    });

    // Sort ascending by date for chronological trend
    const sortedDates = Array.from(dateMap.keys()).sort();
    sortedDates.forEach(d => {
      const dayRecs = dateMap.get(d) || [];
      // Deduplicate: If both itemized and summary exist, prefer itemized
      const itemized = dayRecs.find(r => r.recordType === 'itemized');
      const rep = itemized || dayRecs[0];
      const sales = rep?.totalSales || 0;
      const expenses = rep?.totalExpenses || 0;
      const profit = rep?.estimatedProfit || 0;

      const dateObj = new Date(d);
      const label = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      list.push({ date: d, label, sales, expenses, profit });
    });

    return list.slice(-7); // show up to last 7 data points
  }, [records]);

  const maxChartVal = useMemo(() => {
    const maxVal = Math.max(
      ...chartDays.map(d => Math.max(d.sales, d.expenses)),
      1000
    );
    return maxVal;
  }, [chartDays]);

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-orange-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-stone-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-black uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
              <span>Smart Stall Bookkeeping & Performance</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-white font-display flex items-center gap-2.5">
              <span>Smart Sales Tracker</span>
            </h1>

            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl">
              Easy financial tracking for small stall owners. Record closing summaries, track individual meal sales, 
              monitor profit margins, and pinpoint your best-selling dishes with zero accounting jargon.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={() => setActiveView('daily_summary')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
                activeView === 'daily_summary'
                  ? 'bg-orange-500 text-white shadow-orange-900/50'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>+ Daily Summary</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('itemized')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
                activeView === 'itemized'
                  ? 'bg-orange-500 text-white shadow-orange-900/50'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>+ Per-Item Tracker</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('history')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
                activeView === 'history'
                  ? 'bg-orange-500 text-white shadow-orange-900/50'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Reports & History</span>
            </button>
          </div>
        </div>

        {/* View Mode Sub-tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-5 border-t border-white/10 mt-5 text-xs">
          <button
            type="button"
            onClick={() => setActiveView('overview')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
              activeView === 'overview'
                ? 'bg-white text-stone-900 shadow-2xs font-black'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Dashboard Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveView('daily_summary')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
              activeView === 'daily_summary'
                ? 'bg-white text-stone-900 shadow-2xs font-black'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Option 1: Daily Sales Summary
          </button>

          <button
            type="button"
            onClick={() => setActiveView('itemized')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
              activeView === 'itemized'
                ? 'bg-white text-stone-900 shadow-2xs font-black'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Option 2: Per-Item Sales Tracker
          </button>

          <button
            type="button"
            onClick={() => setActiveView('history')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
              activeView === 'history'
                ? 'bg-white text-stone-900 shadow-2xs font-black'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Full Sales History & Reports ({records.length})
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {errorBanner && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2 animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-rose-400 hover:text-rose-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-500 hover:text-emerald-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN DASHBOARD CARDS (Prompt Requirement #2)                           */}
      {/* Today's Total Sales | Today's Expenses | Estimated Profit | Items Sold |  */}
      {/* Best-Selling Item                                                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Today's Total Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-2xs space-y-1.5 relative overflow-hidden group hover:border-orange-200 transition">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
            <span className="uppercase tracking-wider text-[10px] text-stone-400">Total Sales</span>
            <div className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-stone-900 font-display block">
              {formatPeso(metrics?.todayTotalSales ?? 0)}
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              Today's recorded sales
            </span>
          </div>
        </div>

        {/* Card 2: Today's Expenses */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-2xs space-y-1.5 relative overflow-hidden group hover:border-orange-200 transition">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
            <span className="uppercase tracking-wider text-[10px] text-stone-400">Total Expenses</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-stone-900 font-display block">
              {formatPeso(metrics?.todayExpenses ?? 0)}
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              Ingredients & operational costs
            </span>
          </div>
        </div>

        {/* Card 3: Estimated Profit */}
        <div className={`p-4 sm:p-5 rounded-3xl border shadow-2xs space-y-1.5 relative overflow-hidden group transition ${
          (metrics?.todayEstimatedProfit ?? 0) >= 0
            ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950'
            : 'bg-rose-50/60 border-rose-200/80 text-rose-950'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="uppercase tracking-wider text-[10px] font-black opacity-75">Estimated Profit</span>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
              (metrics?.todayEstimatedProfit ?? 0) >= 0
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            }`}>
              {(metrics?.todayEstimatedProfit ?? 0) >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
            </div>
          </div>
          <div>
            <span className={`text-xl sm:text-2xl font-black font-display block ${
              (metrics?.todayEstimatedProfit ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {formatPeso(metrics?.todayEstimatedProfit ?? 0)}
            </span>
            <span className="text-[11px] opacity-75 font-semibold">
              Sales minus expenses
            </span>
          </div>
        </div>

        {/* Card 4: Items Sold */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-2xs space-y-1.5 relative overflow-hidden group hover:border-orange-200 transition">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
            <span className="uppercase tracking-wider text-[10px] text-stone-400">Items Sold</span>
            <div className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-stone-900 font-display block">
              {metrics?.todayItemsSold ?? 0}
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              Meals & drinks served today
            </span>
          </div>
        </div>

        {/* Card 5: Best-Selling Item */}
        <div className="col-span-2 lg:col-span-1 bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-2xs space-y-1.5 relative overflow-hidden group hover:border-orange-200 transition">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
            <span className="uppercase tracking-wider text-[10px] text-stone-400">Best Seller</span>
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-sm sm:text-base font-black text-stone-900 font-display block truncate" title={metrics?.todayBestSellingItem?.name || 'No sales recorded yet'}>
              {metrics?.todayBestSellingItem?.name || 'No sales yet'}
            </span>
            <span className="text-[11px] text-stone-500 font-medium block">
              {metrics?.todayBestSellingItem
                ? `${metrics.todayBestSellingItem.quantity} sold (${formatShortPeso(metrics.todayBestSellingItem.totalSales)})`
                : 'Start recording to track'}
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* TAB VIEW 1: OVERVIEW & INSIGHTS                                           */}
      {/* ========================================================================= */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          
          {/* Two Fast-Track Launcher Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Launcher Card 1: Option 1 (Daily Summary) */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs hover:border-orange-300 transition space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-800 text-[10px] font-black uppercase tracking-wider border border-orange-200">
                  Option 1
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-stone-900 font-display">
                  Daily Sales Summary
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Best for end-of-day closing. Record today's total cash collected and operational expenses to automatically compute net profit.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-stone-400 font-medium">Quick 1-minute entry</span>
                <button
                  type="button"
                  onClick={() => setActiveView('daily_summary')}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <span>Open Daily Summary</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Launcher Card 2: Option 2 (Per-Item Tracker) */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs hover:border-orange-300 transition space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Receipt className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-200">
                  Option 2
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-stone-900 font-display">
                  Per-Item Sales Tracker
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Track quantities of individual dishes (Chicken Skin, Siomai, Sisig, etc.). Auto-calculates per-dish revenue and highlights top earners.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-stone-400 font-medium">Itemized recipe inventory</span>
                <button
                  type="button"
                  onClick={() => setActiveView('itemized')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <span>Track Per-Item Sales</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Recent Visual Performance Chart */}
          <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-black text-stone-900 font-display flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-orange-600" />
                  <span>Recent Sales & Profit Trend</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Daily visual comparison between Total Sales, Expenses, and Estimated Profit
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold text-stone-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>Sales</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span>Expenses</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Profit</span>
                </span>
              </div>
            </div>

            {chartDays.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400 space-y-2">
                <Calendar className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="font-bold text-stone-600">No sales trend records available yet</p>
                <p className="text-[11px] text-stone-400">Save a daily report or per-item record to view visual trends.</p>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                  {chartDays.map((day) => {
                    const salesHeight = Math.max(12, Math.round((day.sales / maxChartVal) * 100));
                    const expensesHeight = Math.max(8, Math.round((day.expenses / maxChartVal) * 100));
                    const profitHeight = Math.max(8, Math.round((Math.max(0, day.profit) / maxChartVal) * 100));

                    return (
                      <div key={day.date} className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex flex-col justify-between space-y-2">
                        <div className="text-center">
                          <span className="text-xs font-black text-stone-800 block">
                            {day.label}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {day.date}
                          </span>
                        </div>

                        {/* Visual Bar Triplets */}
                        <div className="h-28 flex items-end justify-center gap-1.5 px-2 py-1 bg-white rounded-xl border border-stone-100">
                          {/* Sales Bar */}
                          <div
                            className="w-3 rounded-t-md bg-orange-500 transition-all hover:opacity-80"
                            style={{ height: `${salesHeight}%` }}
                            title={`Sales: ${formatPeso(day.sales)}`}
                          />
                          {/* Expenses Bar */}
                          <div
                            className="w-3 rounded-t-md bg-amber-400 transition-all hover:opacity-80"
                            style={{ height: `${expensesHeight}%` }}
                            title={`Expenses: ${formatPeso(day.expenses)}`}
                          />
                          {/* Profit Bar */}
                          <div
                            className="w-3 rounded-t-md bg-emerald-500 transition-all hover:opacity-80"
                            style={{ height: `${profitHeight}%` }}
                            title={`Profit: ${formatPeso(day.profit)}`}
                          />
                        </div>

                        <div className="text-center space-y-0.5 pt-1 border-t border-stone-200/60">
                          <span className="text-[11px] font-black text-stone-900 block">
                            {formatShortPeso(day.sales)}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 block">
                            +{formatShortPeso(day.profit)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Top Selling & Slow Selling Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Best Seller in selected period */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-md">
                  Star Performer
                </span>
                <span className="text-[11px] text-stone-400">Based on recorded quantities</span>
              </div>

              {metrics?.filterBestSellingItem ? (
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-stone-900 font-display">
                      {metrics.filterBestSellingItem.name}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-white font-black text-xs">
                      {metrics.filterBestSellingItem.quantity} Sold
                    </span>
                  </div>
                  <p className="text-xs text-amber-900">
                    Generated <strong className="text-stone-900">{formatPeso(metrics.filterBestSellingItem.totalSales)}</strong> in sales revenue. Keep extra portions prepped for peak rush!
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-stone-400">
                  No meal items recorded yet in this period.
                </div>
              )}
            </div>

            {/* Slow Selling Items */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-md">
                  Optimization Insights
                </span>
                <span className="text-[11px] text-stone-400">Inventory attention</span>
              </div>

              {metrics?.insufficientDataForSlowSelling ? (
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1">
                  <p className="font-bold text-stone-800">
                    ℹ️ Insufficient data to determine slow-moving items
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Record sales for at least 3 distinct menu items to unlock fair and accurate slow-seller detection.
                  </p>
                </div>
              ) : metrics?.slowSellingItems && metrics.slowSellingItems.length > 0 ? (
                <div className="space-y-2">
                  {metrics.slowSellingItems.map(item => (
                    <div key={item.name} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-black text-stone-900 block">{item.name}</span>
                        <span className="text-[10px] text-stone-500">{item.reason}</span>
                      </div>
                      <span className="px-2 py-1 bg-stone-200/80 text-stone-700 font-bold rounded-lg text-[11px]">
                        {item.quantity} sold
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
                  All menu items are currently moving at healthy average volumes!
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB VIEW 2: OPTION 1 - DAILY SALES SUMMARY (Prompt Requirement #3)        */}
      {/* ========================================================================= */}
      {activeView === 'daily_summary' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6 max-w-2xl mx-auto">
          
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 text-xs font-black uppercase tracking-wider mb-1">
                <span>Option 1 Form</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-display">
                Record Daily Sales Summary
              </h2>
              <p className="text-xs text-stone-500">
                Log your end-of-day stall figures. We'll automatically calculate your estimated net profit.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('overview')}
              className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-900 font-bold rounded-lg hover:bg-stone-100"
            >
              Cancel
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveDailySummary(false);
            }}
            className="space-y-5 text-xs"
          >
            {/* Field: Date */}
            <div>
              <label className="block font-black text-stone-800 mb-1">
                Report Date *
              </label>
              <input
                type="date"
                required
                value={summaryDate}
                onChange={(e) => setSummaryDate(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium text-stone-900"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Defaults to today. You can also pick previous dates to log backdated records.
              </span>
            </div>

            {/* Field: Total Sales (₱) */}
            <div>
              <label className="block font-black text-stone-800 mb-1">
                Total Sales Revenue (₱) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-stone-400 text-sm">
                  ₱
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="e.g. 3000"
                  value={summarySalesInput}
                  onChange={(e) => setSummarySalesInput(e.target.value)}
                  className="w-full text-xs sm:text-sm pl-8 p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-bold text-stone-900"
                />
              </div>
              <span className="text-[10px] text-stone-400 mt-1 block">
                Total cash collected from meal and beverage sales today.
              </span>
            </div>

            {/* Field: Total Expenses (₱) */}
            <div>
              <label className="block font-black text-stone-800 mb-1">
                Total Operational Expenses (₱) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-stone-400 text-sm">
                  ₱
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="e.g. 1800"
                  value={summaryExpensesInput}
                  onChange={(e) => setSummaryExpensesInput(e.target.value)}
                  className="w-full text-xs sm:text-sm pl-8 p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-bold text-stone-900"
                />
              </div>
              <span className="text-[10px] text-stone-400 mt-1 block">
                Cost of raw ingredients, meat, cooking gas, ice, cups, and staff allowance.
              </span>
            </div>

            {/* Live Computed Estimated Profit Box */}
            <div className={`p-4 rounded-2xl border transition ${
              calculatedSummaryProfit >= 0
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : 'bg-rose-50/80 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider block opacity-75">
                    Live Computed Estimated Profit
                  </span>
                  <span className="text-[10px] opacity-65">
                    Formula: Total Sales (₱{parsedSummarySales.toLocaleString()}) − Expenses (₱{parsedSummaryExpenses.toLocaleString()})
                  </span>
                </div>
                <div className={`text-xl sm:text-2xl font-black font-display ${
                  calculatedSummaryProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {formatPeso(calculatedSummaryProfit)}
                </div>
              </div>
            </div>

            {/* Field: Optional Notes */}
            <div>
              <label className="block font-black text-stone-800 mb-1">
                Optional Notes / Remarks
              </label>
              <textarea
                rows={2}
                value={summaryNotes}
                onChange={(e) => setSummaryNotes(e.target.value)}
                placeholder="e.g. Midterm week rush; high demand for extra rice; bought 10L cooking oil."
                className="w-full text-xs p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-stone-900"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveView('overview')}
                className="px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-100 font-bold transition text-xs"
              >
                Back to Dashboard
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Daily Report...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Daily Report</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB VIEW 3: OPTION 2 - PER-ITEM SALES TRACKER (Prompt Requirement #4)     */}
      {/* ========================================================================= */}
      {activeView === 'itemized' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6 max-w-4xl mx-auto">
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black uppercase tracking-wider mb-1">
                <span>Option 2: Itemized Tracker</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-display">
                Per-Item Sales Tracker
              </h2>
              <p className="text-xs text-stone-500">
                Track exact quantities sold per meal. Selling prices auto-fill from your live stall menu and can be adjusted anytime.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddItemRow}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('overview')}
                className="px-3 py-2 text-xs text-stone-500 hover:text-stone-900 font-bold rounded-lg hover:bg-stone-100"
              >
                Cancel
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveItemizedRecord(false);
            }}
            className="space-y-6 text-xs"
          >
            {/* Header Settings: Date & Day Expenses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Sales Record Date *
                </label>
                <input
                  type="date"
                  required
                  value={itemizedDate}
                  onChange={(e) => setItemizedDate(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-stone-200 rounded-xl font-medium text-stone-900"
                />
              </div>

              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Today's Operational Expenses (₱)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">
                    ₱
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={itemizedExpensesInput}
                    onChange={(e) => setItemizedExpensesInput(e.target.value)}
                    placeholder="0"
                    className="w-full text-xs pl-7 p-2.5 bg-white border border-stone-200 rounded-xl font-bold text-stone-900"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Items Table / Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-stone-800 uppercase tracking-wider text-[11px]">
                  Dishes Sold ({itemRows.length} item{itemRows.length > 1 ? 's' : ''})
                </span>
                <span className="text-[11px] text-stone-400">
                  Formula: Item Sales = Quantity Sold × Selling Price
                </span>
              </div>

              <div className="space-y-2.5">
                {itemRows.map((row, index) => {
                  const lineTotal = row.quantitySold * row.sellingPrice;

                  return (
                    <div
                      key={row.tempId}
                      className="p-3.5 sm:p-4 bg-white rounded-2xl border border-stone-200 hover:border-amber-300 transition shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4"
                    >
                      <div className="flex items-center gap-2 sm:w-8 shrink-0 text-stone-400 font-mono font-bold text-xs">
                        #{index + 1}
                      </div>

                      {/* Food Item Selection / Custom Name */}
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-black text-stone-500 uppercase tracking-wider mb-1 sm:hidden">
                          Food Item Name
                        </label>
                        {!row.isCustomDish ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={row.foodName}
                              onChange={(e) => handleRowChange(row.tempId, 'foodName', e.target.value)}
                              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 focus:bg-white"
                            >
                              <optgroup label="Your Live Stall Menu">
                                {menuItems.map(m => (
                                  <option key={m.id} value={m.name}>
                                    {m.name} (Menu: ₱{m.price})
                                  </option>
                                ))}
                              </optgroup>
                              <option value="__custom__">➕ + Custom Food Item...</option>
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              required
                              placeholder="Enter custom dish name"
                              value={row.foodName}
                              onChange={(e) => handleRowChange(row.tempId, 'foodName', e.target.value)}
                              className="w-full text-xs p-2.5 bg-amber-50/60 border border-amber-300 rounded-xl font-bold text-stone-900 focus:bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const fallback = menuItems[0];
                                handleRowChange(row.tempId, 'isCustomDish', false);
                                if (fallback) {
                                  handleRowChange(row.tempId, 'foodName', fallback.name);
                                  handleRowChange(row.tempId, 'sellingPrice', fallback.price);
                                }
                              }}
                              className="text-[10px] text-amber-700 font-bold hover:underline shrink-0 px-2"
                            >
                              Pick from Menu
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Quantity Stepper & Input */}
                      <div className="w-full sm:w-36 shrink-0">
                        <label className="block text-[10px] font-black text-stone-500 uppercase tracking-wider mb-1">
                          Quantity Sold
                        </label>
                        <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                          <button
                            type="button"
                            onClick={() => handleRowChange(row.tempId, 'quantitySold', Math.max(1, row.quantitySold - 1))}
                            className="px-2.5 py-2 text-stone-600 hover:bg-stone-200 font-black text-sm"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            required
                            value={row.quantitySold}
                            onChange={(e) => handleRowChange(row.tempId, 'quantitySold', Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-full text-center text-xs font-black bg-white py-2 focus:outline-none text-stone-900"
                          />
                          <button
                            type="button"
                            onClick={() => handleRowChange(row.tempId, 'quantitySold', row.quantitySold + 1)}
                            className="px-2.5 py-2 text-stone-600 hover:bg-stone-200 font-black text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Selling Price per Item */}
                      <div className="w-full sm:w-32 shrink-0">
                        <label className="block text-[10px] font-black text-stone-500 uppercase tracking-wider mb-1">
                          Price per Item (₱)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-stone-400">₱</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            value={row.sellingPrice}
                            onChange={(e) => handleRowChange(row.tempId, 'sellingPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full text-xs pl-6 p-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-900 focus:bg-white"
                          />
                        </div>
                      </div>

                      {/* Line Item Total (Calculated) */}
                      <div className="w-full sm:w-32 shrink-0 text-right">
                        <span className="block text-[10px] font-black text-stone-500 uppercase tracking-wider mb-1">
                          Item Total
                        </span>
                        <span className="text-sm font-black text-stone-900 block font-display">
                          {formatPeso(lineTotal)}
                        </span>
                      </div>

                      {/* Delete Row Button */}
                      <div className="shrink-0 text-right sm:text-center pt-1 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(row.tempId)}
                          disabled={itemRows.length <= 1}
                          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition disabled:opacity-30"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Add item button */}
              <button
                type="button"
                onClick={handleAddItemRow}
                className="w-full py-3 border border-dashed border-stone-300 hover:border-amber-400 hover:bg-amber-50/50 rounded-2xl text-stone-600 hover:text-amber-800 font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Food Item</span>
              </button>
            </div>

            {/* Combined Totals Summary Box (Prompt Requirement #4) */}
            <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Total Quantity
                  </span>
                  <span className="text-lg font-black text-stone-900 font-display">
                    {computedItemizedTotalQuantity} items
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Combined Total Sales
                  </span>
                  <span className="text-lg font-black text-stone-900 font-display">
                    {formatPeso(computedItemizedTotalSales)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Total Expenses
                  </span>
                  <span className="text-lg font-black text-amber-900 font-display">
                    {formatPeso(parsedItemizedExpenses)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Estimated Profit
                  </span>
                  <span className={`text-lg font-black font-display ${
                    computedItemizedProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {formatPeso(computedItemizedProfit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block font-black text-stone-800 mb-1">
                Optional Notes
              </label>
              <input
                type="text"
                value={itemizedNotes}
                onChange={(e) => setItemizedNotes(e.target.value)}
                placeholder="e.g. Lunch hour peak, dimsum siomai extra chili dip popular."
                className="w-full text-xs p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveView('overview')}
                className="px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-100 font-bold transition text-xs"
              >
                Back to Dashboard
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Per-Item Record...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Sales Record</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB VIEW 4: REPORTS & SALES HISTORY (Prompt Requirement #5 & #6)           */}
      {/* ========================================================================= */}
      {activeView === 'history' && (
        <div className="space-y-6">
          
          {/* Controls Bar: Date Filters + Record Type Filters */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 font-display flex items-center gap-2">
                  <Filter className="w-4 h-4 text-orange-600" />
                  <span>Sales Reports & History Filters</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Select a date range to filter your financial summaries and item breakdowns.
                </p>
              </div>

              {/* Date Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs font-bold text-stone-600">
                <button
                  type="button"
                  onClick={() => setSelectedDateFilter('today')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    selectedDateFilter === 'today' ? 'bg-white text-stone-900 shadow-2xs font-black' : 'hover:text-stone-900'
                  }`}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDateFilter('this_week')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    selectedDateFilter === 'this_week' ? 'bg-white text-stone-900 shadow-2xs font-black' : 'hover:text-stone-900'
                  }`}
                >
                  This Week
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDateFilter('this_month')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    selectedDateFilter === 'this_month' ? 'bg-white text-stone-900 shadow-2xs font-black' : 'hover:text-stone-900'
                  }`}
                >
                  This Month
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDateFilter('custom')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    selectedDateFilter === 'custom' ? 'bg-white text-stone-900 shadow-2xs font-black' : 'hover:text-stone-900'
                  }`}
                >
                  Custom Range
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDateFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    selectedDateFilter === 'all' ? 'bg-white text-stone-900 shadow-2xs font-black' : 'hover:text-stone-900'
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>

            {/* Custom Date Pickers */}
            {selectedDateFilter === 'custom' && (
              <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200 flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-700">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="p-2 bg-white border border-stone-200 rounded-xl text-stone-900 font-medium"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-700">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="p-2 bg-white border border-stone-200 rounded-xl text-stone-900 font-medium"
                  />
                </div>

                <button
                  type="button"
                  onClick={loadSalesData}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition"
                >
                  Apply Date Range
                </button>
              </div>
            )}

            {/* Record Type Mode & Double-Counting Safeguard (Requirement #6) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-600">Display Records:</span>
                <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRecordTypeFilter('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition text-[11px] ${
                      recordTypeFilter === 'all' ? 'bg-white text-stone-900 shadow-2xs font-black' : 'text-stone-500'
                    }`}
                  >
                    All Records (Smart Deduplicated)
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecordTypeFilter('daily_summary')}
                    className={`px-3 py-1 rounded-lg font-bold transition text-[11px] ${
                      recordTypeFilter === 'daily_summary' ? 'bg-white text-stone-900 shadow-2xs font-black' : 'text-stone-500'
                    }`}
                  >
                    Daily Summaries Only
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecordTypeFilter('itemized')}
                    className={`px-3 py-1 rounded-lg font-bold transition text-[11px] ${
                      recordTypeFilter === 'itemized' ? 'bg-white text-stone-900 shadow-2xs font-black' : 'text-stone-500'
                    }`}
                  >
                    Per-Item Sales Only
                  </button>
                </div>
              </div>

              <span className="text-[11px] text-stone-400">
                🛡️ Double-counting safeguard active
              </span>
            </div>

          </div>

          {/* Period Summary Metric Banner */}
          <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-5 rounded-3xl shadow-md border border-stone-700 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Period Total Sales
              </span>
              <span className="text-xl sm:text-2xl font-black text-white font-display">
                {formatPeso(metrics?.filterTotalSales ?? 0)}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Period Expenses
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-300 font-display">
                {formatPeso(metrics?.filterExpenses ?? 0)}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Estimated Net Profit
              </span>
              <span className={`text-xl sm:text-2xl font-black font-display ${
                (metrics?.filterEstimatedProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {formatPeso(metrics?.filterEstimatedProfit ?? 0)}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Total Items Sold
              </span>
              <span className="text-xl sm:text-2xl font-black text-orange-400 font-display">
                {metrics?.filterItemsSold ?? 0}
              </span>
            </div>
          </div>

          {/* History Records Table (Prompt Requirement #5) */}
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-2xs">
            <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h4 className="text-base font-black text-stone-900 font-display">
                  Saved Sales History Table
                </h4>
                <p className="text-xs text-stone-500">
                  Showing {records.length} record{records.length !== 1 ? 's' : ''} in selected range
                </p>
              </div>

              <button
                type="button"
                onClick={loadSalesData}
                disabled={isLoading}
                className="p-2 rounded-xl bg-stone-100 hover:bg-orange-50 text-stone-600 hover:text-orange-600 transition"
                title="Refresh table"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-xs text-stone-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500" />
                <p>Loading sales records...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="py-16 text-center text-xs text-stone-500 space-y-3 px-4">
                <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
                <p className="text-sm font-bold text-stone-700">No sales records found for this period</p>
                <p className="text-stone-400 max-w-sm mx-auto text-[11px]">
                  Use the Daily Sales Summary or Per-Item Tracker options above to record today's sales.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveView('daily_summary')}
                    className="px-4 py-2 bg-orange-600 text-white rounded-xl font-bold text-xs hover:bg-orange-700 transition"
                  >
                    + Record Daily Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('itemized')}
                    className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold text-xs hover:bg-amber-700 transition"
                  >
                    + Per-Item Tracker
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-black uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4 text-right">Total Sales</th>
                      <th className="py-3.5 px-4 text-right">Expenses</th>
                      <th className="py-3.5 px-4 text-right">Estimated Profit</th>
                      <th className="py-3.5 px-4">Items / Notes</th>
                      <th className="py-3.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {records.map((rec) => {
                      const isItemized = rec.recordType === 'itemized';
                      const isExpanded = expandedRecordId === rec.id;

                      return (
                        <React.Fragment key={rec.id}>
                          <tr className="hover:bg-orange-50/30 transition">
                            {/* Date */}
                            <td className="py-3.5 px-4 font-bold text-stone-900 whitespace-nowrap">
                              {rec.date}
                            </td>

                            {/* Record Type Badge */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {isItemized ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-300">
                                  <Receipt className="w-3 h-3" />
                                  <span>Per-Item ({rec.items?.length || 0})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-black border border-blue-300">
                                  <FileText className="w-3 h-3" />
                                  <span>Daily Summary</span>
                                </span>
                              )}
                            </td>

                            {/* Total Sales */}
                            <td className="py-3.5 px-4 text-right font-black text-stone-900 whitespace-nowrap">
                              {formatPeso(rec.totalSales)}
                            </td>

                            {/* Total Expenses */}
                            <td className="py-3.5 px-4 text-right font-bold text-stone-600 whitespace-nowrap">
                              {formatPeso(rec.totalExpenses)}
                            </td>

                            {/* Estimated Profit */}
                            <td className="py-3.5 px-4 text-right font-black whitespace-nowrap">
                              <span className={rec.estimatedProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                                {formatPeso(rec.estimatedProfit)}
                              </span>
                            </td>

                            {/* Items / Notes */}
                            <td className="py-3.5 px-4 max-w-xs">
                              {isItemized && rec.items && rec.items.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setExpandedRecordId(isExpanded ? null : rec.id)}
                                  className="text-stone-700 hover:text-orange-700 font-bold flex items-center gap-1 text-[11px]"
                                >
                                  <span>{rec.totalItemsSold || rec.items.reduce((s, i) => s + i.quantitySold, 0)} meals sold</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              ) : (
                                <span className="text-stone-500 truncate block text-[11px]" title={rec.notes}>
                                  {rec.notes || '—'}
                                </span>
                              )}
                            </td>

                            {/* Actions (View/Edit & Delete) */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditRecord(rec)}
                                  className="p-1.5 text-stone-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                                  title="View or edit this sales record"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setRecordToDelete(rec)}
                                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete sales record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Itemized Row Breakdown */}
                          {isItemized && isExpanded && rec.items && (
                            <tr className="bg-amber-50/40">
                              <td colSpan={7} className="p-4 border-t border-b border-amber-200">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs font-black text-amber-950">
                                    <span>Detailed Food Breakdown for {rec.date}</span>
                                    {rec.notes && <span className="text-[11px] font-normal text-stone-600">Note: {rec.notes}</span>}
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                                    {rec.items.map((it, idx) => (
                                      <div key={idx} className="p-2.5 bg-white rounded-xl border border-amber-200 text-xs flex items-center justify-between shadow-2xs">
                                        <div>
                                          <span className="font-bold text-stone-900 block truncate">{it.foodName}</span>
                                          <span className="text-[10px] text-stone-500">
                                            {it.quantitySold} × {formatPeso(it.sellingPrice)}
                                          </span>
                                        </div>
                                        <span className="font-black text-amber-900 text-xs">
                                          {formatPeso(it.totalSales)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT SAVED RECORD                                                */}
      {/* ========================================================================= */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 font-display">
                    Edit {editingRecord.recordType === 'daily_summary' ? 'Daily Summary' : 'Per-Item Record'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Stall: {editingRecord.stallName} • Record ID: {editingRecord.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-stone-800 mb-1">Date</label>
                <input
                  type="date"
                  value={editingRecord.date}
                  onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium"
                />
              </div>

              {editingRecord.recordType === 'daily_summary' ? (
                <>
                  <div>
                    <label className="block font-black text-stone-800 mb-1">Total Sales (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={editingRecord.totalSales}
                      onChange={(e) => {
                        const s = Math.max(0, parseFloat(e.target.value) || 0);
                        setEditingRecord({
                          ...editingRecord,
                          totalSales: s,
                          estimatedProfit: s - editingRecord.totalExpenses
                        });
                      }}
                      className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-stone-800 mb-1">Total Expenses (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={editingRecord.totalExpenses}
                      onChange={(e) => {
                        const exp = Math.max(0, parseFloat(e.target.value) || 0);
                        setEditingRecord({
                          ...editingRecord,
                          totalExpenses: exp,
                          estimatedProfit: editingRecord.totalSales - exp
                        });
                      }}
                      className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <label className="block font-black text-stone-800">Items Sold Breakdown</label>
                  {editingRecord.items?.map((it, idx) => (
                    <div key={idx} className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-800">{it.foodName}</span>
                        <span className="font-black text-stone-900">{formatPeso(it.quantitySold * it.sellingPrice)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-500 font-bold">Qty Sold</label>
                          <input
                            type="number"
                            min="1"
                            value={it.quantitySold}
                            onChange={(e) => {
                              const qty = Math.max(1, parseInt(e.target.value, 10) || 1);
                              const updatedItems = [...(editingRecord.items || [])];
                              updatedItems[idx] = { ...it, quantitySold: qty, totalSales: qty * it.sellingPrice };
                              const newSales = updatedItems.reduce((s, i) => s + i.totalSales, 0);
                              setEditingRecord({
                                ...editingRecord,
                                items: updatedItems,
                                totalSales: newSales,
                                estimatedProfit: newSales - editingRecord.totalExpenses
                              });
                            }}
                            className="w-full p-2 bg-white border border-stone-200 rounded-lg font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-stone-500 font-bold">Price (₱)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={it.sellingPrice}
                            onChange={(e) => {
                              const p = Math.max(0, parseFloat(e.target.value) || 0);
                              const updatedItems = [...(editingRecord.items || [])];
                              updatedItems[idx] = { ...it, sellingPrice: p, totalSales: it.quantitySold * p };
                              const newSales = updatedItems.reduce((s, i) => s + i.totalSales, 0);
                              setEditingRecord({
                                ...editingRecord,
                                items: updatedItems,
                                totalSales: newSales,
                                estimatedProfit: newSales - editingRecord.totalExpenses
                              });
                            }}
                            className="w-full p-2 bg-white border border-stone-200 rounded-lg font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div>
                    <label className="block font-black text-stone-800 mb-1">Expenses (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={editingRecord.totalExpenses}
                      onChange={(e) => {
                        const exp = Math.max(0, parseFloat(e.target.value) || 0);
                        setEditingRecord({
                          ...editingRecord,
                          totalExpenses: exp,
                          estimatedProfit: editingRecord.totalSales - exp
                        });
                      }}
                      className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Profit Preview */}
              <div className="p-3 bg-stone-100 rounded-xl flex items-center justify-between font-bold">
                <span className="text-stone-600">Recomputed Profit:</span>
                <span className={editingRecord.estimatedProfit >= 0 ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
                  {formatPeso(editingRecord.estimatedProfit)}
                </span>
              </div>

              <div>
                <label className="block font-black text-stone-800 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editingRecord.notes || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, notes: e.target.value })}
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 text-xs">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedRecord}
                disabled={isSaving}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black shadow-xs"
              >
                {isSaving ? 'Updating...' : 'Save Updates'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DELETE CONFIRMATION MODAL (Prompt Requirement #6)                */}
      {/* ========================================================================= */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-sm w-full p-6 shadow-2xl space-y-4">
            
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-stone-900 font-display">
                Delete Sales Record?
              </h3>
              <p className="text-xs text-stone-500">
                Are you sure you want to permanently delete the sales report for <strong>{recordToDelete.date}</strong> ({formatPeso(recordToDelete.totalSales)})?
              </p>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-[11px] text-rose-700">
              ⚠️ This will update all period totals, best-seller stats, and dashboard profits immediately.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-bold text-xs"
              >
                Keep Record
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Record'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DUPLICATE RECORD CONFIRMATION (Prompt Requirement #6)            */}
      {/* ========================================================================= */}
      {duplicatePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900 font-display">
                  Duplicate Date Detected
                </h3>
                <p className="text-xs text-stone-500">
                  A sales record for this date is already saved
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              {duplicatePrompt.message}
            </p>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900">
              Updating will replace the previously stored numbers for that date and avoid accidental duplicates.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDuplicatePrompt(null)}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (duplicatePrompt.payloadToSave.recordType === 'daily_summary') {
                    handleSaveDailySummary(true);
                  } else {
                    handleSaveItemizedRecord(true);
                  }
                }}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-xs"
              >
                Overwrite / Update Record
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
