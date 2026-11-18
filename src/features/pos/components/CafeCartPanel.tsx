"use client";

// ============================================================================
// CafeCartPanel: Barista Order Ticket Sidebar
// Order Mode Selector (Dine-in / Takeaway / Delivery) + Table/Buzzer Selector
// Recipe Badges & Fast Checkout Button (F8)
// ============================================================================

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  UtensilsCrossed,
  Package,
  Bike,
  BellRing,
  Coffee,
  Check,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useCafePosStore } from "../stores/cafe-pos.store";
import { CafeCartItemRow } from "./CafeCartItemRow";
import { formatLak } from "@/utils/formatLakCurrency";
import { triggerHapticFeedback } from "@/utils/haptics";
import { CafePaymentModal } from "./CafePaymentModal";

export function CafeCartPanel() {
  const cart = useCafePosStore((s) => s.cart);
  const totals = useCafePosStore((s) => s.totals);
  const orderType = useCafePosStore((s) => s.orderType);
  const setOrderType = useCafePosStore((s) => s.setOrderType);
  const selectedTable = useCafePosStore((s) => s.selectedTable);
  const setSelectedTable = useCafePosStore((s) => s.setSelectedTable);
  const buzzerNumber = useCafePosStore((s) => s.buzzerNumber);
  const setBuzzerNumber = useCafePosStore((s) => s.setBuzzerNumber);
  const clearCart = useCafePosStore((s) => s.clearCart);
  const diningTables = useCafePosStore((s) => s.diningTables);

  const [isTablePickerOpen, setIsTablePickerOpen] = useState(false);
  const [isBuzzerPickerOpen, setIsBuzzerPickerOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Keyboard shortcut listener (F8: Checkout)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F8") {
        e.preventDefault();
        if (cart.length > 0) {
          setIsPaymentOpen(true);
        } else {
          toast.info("ບໍ່ມີເຄື່ອງດື່ມໃນກະຕ່າ");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart]);

  const handleClearCart = () => {
    if (cart.length === 0) return;
    const confirm = window.confirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລ້າງລາຍການທັງໝົດໃນກະຕ່າ?");
    if (confirm) {
      triggerHapticFeedback(25);
      clearCart();
      toast.success("ໄດ້ລ້າງກະຕ່າຮຽບຮ້ອຍແລ້ວ");
    }
  };

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-3xl border border-stone-200/90 bg-white shadow-xs overflow-hidden select-none">
      {/* 1. Header: Order Mode Selector (Dine-in, Takeaway, Delivery) */}
      <div className="border-b border-stone-100 bg-stone-50/70 p-3 space-y-2.5 shrink-0">
        <div className="grid grid-cols-3 gap-1 bg-stone-200/60 p-1 rounded-2xl text-xs font-bold">
          {/* Dine-in */}
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback(15);
              setOrderType("dine_in");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl transition-all cursor-pointer ${
              orderType === "dine_in"
                ? "bg-[#2C1810] text-amber-300 shadow-xs font-black"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <UtensilsCrossed className="h-3.5 w-3.5" />
            <span>ກິນທີ່ຮ້ານ</span>
          </button>

          {/* Takeaway */}
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback(15);
              setOrderType("takeaway");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl transition-all cursor-pointer ${
              orderType === "takeaway"
                ? "bg-[#2C1810] text-amber-300 shadow-xs font-black"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>ກັບບ້ານ</span>
          </button>

          {/* Delivery */}
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback(15);
              setOrderType("delivery");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl transition-all cursor-pointer ${
              orderType === "delivery"
                ? "bg-[#2C1810] text-amber-300 shadow-xs font-black"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Bike className="h-3.5 w-3.5" />
            <span>Delivery</span>
          </button>
        </div>

        {/* Sub-selector: Table Selector (if Dine-in) OR Buzzer Number (if Takeaway) */}
        <div className="flex items-center gap-2">
          {orderType === "dine_in" ? (
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setIsTablePickerOpen(!isTablePickerOpen)}
                className={`w-full flex items-center justify-between h-9 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedTable
                    ? "bg-amber-50 border-amber-300 text-[#2C1810]"
                    : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <UtensilsCrossed className="h-3.5 w-3.5 text-amber-700" />
                  <span>
                    {selectedTable
                      ? `ໂຕະ: ${selectedTable.table_code} (${selectedTable.zone})`
                      : "ເລືອກເລກໂຕະ (Select Table)..."}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
              </button>

              {/* Table Picker Dropdown Grid */}
              {isTablePickerOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 p-2 bg-white rounded-2xl border border-stone-200 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex justify-between items-center mb-1.5 px-1">
                    <span className="text-[11px] font-bold text-stone-500">ເລືອກໂຕະນັ່ງ:</span>
                    {selectedTable && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTable(null);
                          setIsTablePickerOpen(false);
                        }}
                        className="text-[10px] text-rose-600 font-bold hover:underline"
                      >
                        ຍົກເລີກເລືອກໂຕະ
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto no-scrollbar">
                    {diningTables.map((t) => {
                      const isSel = selectedTable?.id === t.id;
                      const isOcc = t.status === "occupied";
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            triggerHapticFeedback(15);
                            setSelectedTable(t);
                            setIsTablePickerOpen(false);
                          }}
                          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center font-bold text-xs transition-all cursor-pointer ${
                            isSel
                              ? "bg-[#2C1810] text-amber-300 ring-2 ring-amber-400"
                              : isOcc
                              ? "bg-amber-100/70 border border-amber-300 text-amber-900"
                              : "bg-stone-100 hover:bg-stone-200 text-stone-800"
                          }`}
                        >
                          <span>{t.table_code}</span>
                          <span className="text-[8px] opacity-70">
                            {isOcc ? "ມີແຂກ" : "ວ່າງ"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setIsBuzzerPickerOpen(!isBuzzerPickerOpen)}
                className={`w-full flex items-center justify-between h-9 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  buzzerNumber
                    ? "bg-amber-50 border-amber-300 text-[#2C1810]"
                    : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <BellRing className="h-3.5 w-3.5 text-amber-700" />
                  <span>
                    {buzzerNumber
                      ? `ເບີເຄື່ອງສັ່ນ / ຄິວ: #${buzzerNumber}`
                      : "ເລືອກເບີເຄື່ອງສັ່ນ"}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
              </button>

              {/* Buzzer Picker Dropdown Grid (01 to 30) */}
              {isBuzzerPickerOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 p-2 bg-white rounded-2xl border border-stone-200 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex justify-between items-center mb-1.5 px-1">
                    <span className="text-[11px] font-bold text-stone-500">ເບີເຄື່ອງສັ່ນ (#01 - #30):</span>
                    {buzzerNumber && (
                      <button
                        type="button"
                        onClick={() => {
                          setBuzzerNumber("");
                          setIsBuzzerPickerOpen(false);
                        }}
                        className="text-[10px] text-rose-600 font-bold hover:underline"
                      >
                        ລຶບເບີສັ່ນ
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 max-h-44 overflow-y-auto no-scrollbar">
                    {Array.from({ length: 30 }, (_, i) => {
                      const numStr = String(i + 1).padStart(2, "0");
                      const isSel = buzzerNumber === numStr;
                      return (
                        <button
                          key={numStr}
                          type="button"
                          onClick={() => {
                            triggerHapticFeedback(15);
                            setBuzzerNumber(numStr);
                            setIsBuzzerPickerOpen(false);
                          }}
                          className={`py-1.5 rounded-xl text-center font-bold text-xs font-mono transition-all cursor-pointer ${
                            isSel
                              ? "bg-[#2C1810] text-amber-300"
                              : "bg-stone-100 hover:bg-stone-200 text-stone-800"
                          }`}
                        >
                          #{numStr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Clear Cart Button */}
          {cart.length > 0 && (
            <button
              type="button"
              onClick={handleClearCart}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
              title="ລ້າງລາຍການທັງໝົດ"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Order Lines List (Scrollable Area) */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 no-scrollbar min-h-0 bg-stone-50/30">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center text-stone-400 select-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-300 mb-2.5">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-stone-600">
              ຍັງບໍ່ມີລາຍການໃນອໍເດີ
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5 max-w-[200px] leading-relaxed">
              ແຕະເລືອກເຄື່ອງດື່ມ ຫຼື ເບເກີຣີຈາກລາຍການດ້ານຊ້າຍ
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            {cart.map((item) => (
              <CafeCartItemRow key={item.id} item={item} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* 3. Totals & Checkout Button (Sticky Footer) */}
      <div className="border-t border-stone-200/90 bg-white p-3.5 select-none shrink-0 space-y-2.5">
        {/* Totals Summary */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-stone-600">
            <span>ລວມຍ່ອຍ ({totals.totalItemCount} ຈອກ):</span>
            <span className="font-bold tabular-nums text-stone-900">
              {formatLak(totals.subtotal)}
            </span>
          </div>

          {totals.discount > 0 && (
            <div className="flex justify-between text-rose-600 font-medium">
              <span>ສ່ວນຫຼຸດ:</span>
              <span className="font-bold tabular-nums">
                -{formatLak(totals.discount)}
              </span>
            </div>
          )}

          <div className="flex items-baseline justify-between border-t border-stone-200 pt-1.5">
            <span className="text-sm font-black text-[#2C1810]">
              ຍອດລວມສຸດທິ:
            </span>
            <span className="text-xl font-black text-[#2C1810] tabular-nums">
              {formatLak(totals.finalTotal)}
            </span>
          </div>
        </div>

        {/* Fast Checkout CTA (F8) */}
        <motion.button
          type="button"
          disabled={cart.length === 0}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHapticFeedback(25);
            setIsPaymentOpen(true);
          }}
          className="flex h-12 w-full items-center justify-between rounded-2xl bg-[#2C1810] px-4 font-bold text-white shadow-md shadow-[#2C1810]/20 hover:bg-[#1A0D08] active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <span className="rounded-md bg-amber-500/30 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-300">
              F8
            </span>
            <span className="text-xs sm:text-sm font-extrabold">ຊຳລະເງິນ (Checkout)</span>
          </div>

          <div className="flex items-center gap-1.5 text-sm sm:text-base font-black tabular-nums text-amber-300">
            <span>{formatLak(totals.finalTotal)}</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </motion.button>
      </div>

      {/* Payment Modal */}
      <CafePaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
      />
    </div>
  );
}
