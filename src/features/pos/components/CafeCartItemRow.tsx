"use client";

// ============================================================================
// CafeCartItemRow: Ultra-compact 2-Row Barista Order Ticket Card
// Left: [Thumbnail] + [Row 1: Name (Size) + Pencil | Row 2: Price + Temp + Badges]
// Right: [Stepper (-) 1 (+) + Line Total] centered vertically between the 2 rows
// ============================================================================

import React, { memo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, Pencil, Coffee, Croissant, Trash2 } from "lucide-react";
import { CafeCartItem } from "../types/cafe.types";
import { formatLak } from "@/utils/formatLakCurrency";
import { useCafePosStore } from "../stores/cafe-pos.store";
import { triggerHapticFeedback } from "@/utils/haptics";

interface CafeCartItemRowProps {
  item: CafeCartItem;
}

export const CafeCartItemRow = memo(function CafeCartItemRow({
  item,
}: CafeCartItemRowProps) {
  const updateQuantity = useCafePosStore((s) => s.updateQuantity);
  const removeItem = useCafePosStore((s) => s.removeItem);
  const openModifierForEditItem = useCafePosStore((s) => s.openModifierForEditItem);

  const [isBouncing, setIsBouncing] = useState(false);
  const prevQtyRef = useRef<number>(item.quantity);

  useEffect(() => {
    if (item.quantity !== prevQtyRef.current) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 220);
      prevQtyRef.current = item.quantity;
      return () => clearTimeout(timer);
    }
    prevQtyRef.current = item.quantity;
  }, [item.quantity, item.totalPrice]);

  const isBakery =
    item.id.includes("_bakery") ||
    item.temperature === "ປົກກະຕິ" ||
    item.temperature === "ທຳມະດາ";

  const handleRowEdit = () => {
    if (isBakery) return;
    triggerHapticFeedback(20);
    openModifierForEditItem(item);
  };

  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback(15);
    if (item.quantity <= 1) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback(15);
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback(25);
    removeItem(item.id);
  };

  // Recipe formula calculations
  const hasRealSize =
    item.size &&
    item.size !== "STANDARD" &&
    item.size !== "ມາດຕະຖານ" &&
    item.size !== "REGULAR" &&
    item.size !== "1 ຊິ້ນ" &&
    item.size !== "1 ຊິ້ນ (Piece)";

  // Sweetness: ONLY show when DIFFERENT from 100% and not default
  const isDefaultSweetness =
    !item.sweetness ||
    item.sweetness === "100%" ||
    item.sweetness === "ປົກກະຕິ" ||
    item.sweetness === "100% ປົກກະຕິ";

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={
        isBouncing
          ? {
              opacity: 1,
              y: 0,
              scale: [1, 1.02, 1],
              backgroundColor: ["#FFFFFF", "#FEF3C7", "#FFFFFF"],
              borderColor: ["#E7E5E4", "#F59E0B", "#E7E5E4"],
            }
          : { opacity: 1, y: 0, scale: 1, backgroundColor: "#FFFFFF" }
      }
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onClick={handleRowEdit}
      className={`group relative flex items-center justify-between gap-2.5 rounded-xl bg-white border border-stone-200/80 hover:border-amber-400/90 p-2.5 shadow-2xs transition-all select-none ${
        isBakery ? "cursor-default" : "cursor-pointer"
      }`}
      title={isBakery ? item.name : "ກົດເພື່ອແກ້ໄຂສູດຊົງ (Edit Drink Formula)"}
    >
      {/* CỘT TRÁI: Ảnh Thumbnail + Khối 2 dòng (Tên món kèm Size ở dòng 1, Đơn giá + Badges ở dòng 2) */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Thumbnail tròn bo góc nhỏ gọn */}
        <div className="h-9 w-9 rounded-lg bg-stone-50 border border-stone-200/80 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-cover rounded-md"
            />
          ) : isBakery ? (
            <Croissant className="h-4 w-4 text-amber-700/60" />
          ) : (
            <Coffee className="h-4 w-4 text-amber-800/60" />
          )}
        </div>

        {/* Khối 2 dòng thông tin */}
        <div className="min-w-0 flex-1 space-y-1">
          {/* Hàng 1: Tên món + (Size) đằng sau + Icon Pencil */}
          <div className="flex items-center gap-1.5 min-w-0">
            <h5 className="text-[13px] font-bold text-stone-800 leading-snug line-clamp-1 truncate">
              {item.name}
              {hasRealSize && (
                <span className="ml-1 text-[12px] font-extrabold text-amber-900 font-mono">
                  ({item.size})
                </span>
              )}
            </h5>
            {!isBakery && (
              <Pencil className="h-3 w-3 text-stone-300 group-hover:text-amber-600 transition-colors shrink-0" />
            )}
          </div>

          {/* Hàng 2: Đơn giá nhỏ + Badges công thức */}
          <div className="flex flex-wrap items-center gap-1">
            {/* Đơn giá nhỏ */}
            <span className="text-[10.5px] font-semibold text-stone-400 tabular-nums mr-0.5">
              {formatLak(item.unitPrice)}
            </span>

            {/* Recipe Badges for Drinks */}
            {!isBakery && (
              <>
                {/* Kiểu pha (ví dụ: ເຢັນ, ຮ້ອນ, ປັ່ນ) - vì Size đã ghi cạnh tên món */}
                <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200/80 leading-none">
                  {item.temperature}
                </span>

                {/* Độ ngọt: ẨN 100%, chỉ hiện nếu khác 100% */}
                {!isDefaultSweetness && (
                  <span className="inline-flex items-center rounded-md bg-amber-100 text-amber-900 border border-amber-200/90 px-1.5 py-0.5 text-[10px] font-semibold leading-none">
                    ຫວານ {item.sweetness}
                  </span>
                )}

                {/* Ice Level: Only show if not already present in itemNote and not normal */}
                {item.temperature !== "ຮ້ອນ" &&
                  item.iceLevel &&
                  item.iceLevel !== "ປົກກະຕິ" &&
                  !item.itemNote?.includes(item.iceLevel) && (
                    <span className="inline-flex items-center rounded-md bg-stone-100 text-stone-700 border border-stone-200/80 px-1.5 py-0.5 text-[10px] font-semibold leading-none">
                      {item.iceLevel}
                    </span>
                  )}

                {/* Toppings Badges */}
                {item.selectedToppings?.map((top) => (
                  <span
                    key={top.id}
                    className="inline-flex items-center rounded-md bg-amber-50 text-amber-950 border border-amber-300/80 px-1.5 py-0.5 text-[10px] font-bold leading-none"
                  >
                    +{top.name}
                  </span>
                ))}
              </>
            )}

            {/* Ghi chú nhanh hoặc ghi chú bánh */}
            {item.itemNote && (
              <span className="inline-flex items-center rounded-md bg-stone-100 text-stone-700 border border-stone-200/80 px-1.5 py-0.5 text-[10px] font-medium leading-none italic">
                &quot;{item.itemNote}&quot;
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: Xếp dọc 2 hàng để tối ưu chiều ngang (Hàng 1: Thành tiền + Nút xóa; Hàng 2: Stepper) */}
      <div
        className="flex flex-col items-end justify-between self-stretch shrink-0 gap-1 pl-1"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hàng 1 (ngang hàng Tên món): Thành tiền + Nút xóa thùng rác */}
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-black text-stone-900 tabular-nums text-right">
            {formatLak(item.totalPrice)}
          </span>
          <button
            type="button"
            onClick={handleDelete}
            className="flex h-5.5 w-5.5 items-center justify-center rounded-md text-stone-300 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all cursor-pointer"
            title="ລຶບລາຍການນີ້ອອກຈາກອໍເດີ (Delete)"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Hàng 2 (ngang hàng Badges công thức): Stepper tăng giảm nhỏ gọn */}
        <div className="flex items-center h-6.5 rounded-lg border border-stone-200 bg-stone-50 p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={handleMinus}
            className="flex h-5.5 w-5.5 items-center justify-center rounded-md bg-white text-stone-700 shadow-2xs hover:bg-stone-100 hover:text-rose-600 active:scale-95 transition-all cursor-pointer"
            title={item.quantity <= 1 ? "ລຶບອອກຈາກກະຕ່າ" : "ຫຼຸດຈຳນວນ"}
          >
            <Minus className="h-2.5 w-2.5" />
          </button>
          <span className="w-5 text-center font-bold text-xs text-[#2C1810] font-mono leading-none">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={handlePlus}
            className="flex h-5.5 w-5.5 items-center justify-center rounded-md bg-white text-stone-700 shadow-2xs hover:bg-stone-100 active:scale-95 transition-all cursor-pointer"
            title="ເພີ່ມຈຳນວນ"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
});
