"use client";

// ============================================================================
// DrinkStudioCard: Artisanal Beverage & Bakery Card for Cafe Barista POS
// Zero Barcodes, Edge-to-Edge White Image with mix-blend-multiply scale-110
// Corner Temperature Pills (Hot/Iced/Frappe), Bold Charcoal Typography
// ============================================================================

import React, { memo } from "react";
import { motion } from "framer-motion";
import { Plus, Coffee, Ban, Croissant } from "lucide-react";
import { MenuItemEntity, CafeCartItem } from "../types/cafe.types";
import { formatLak } from "@/utils/formatLakCurrency";
import { useCafePosStore } from "../stores/cafe-pos.store";
import { triggerHapticFeedback } from "@/utils/haptics";
import { toast } from "sonner";

interface DrinkStudioCardProps {
  item: MenuItemEntity;
}

export const DrinkStudioCard = memo(function DrinkStudioCard({
  item,
}: DrinkStudioCardProps) {
  const openModifierForNewItem = useCafePosStore((s) => s.openModifierForNewItem);
  const addToCartWithModifiers = useCafePosStore((s) => s.addToCartWithModifiers);

  const isBakery = item.item_type === "bakery" || item.has_variants === false;

  const handleCardClick = () => {
    if (!item.is_available) return;
    triggerHapticFeedback(20);

    if (isBakery) {
      const cartItem: CafeCartItem = {
        id: `${item.id}_bakery`,
        menuItemId: item.id,
        name: item.name,
        name_en: item.name_en,
        imageUrl: item.image_url,
        temperature: "ປົກກະຕິ",
        size: "ມາດຕະຖານ",
        sweetness: "ປົກກະຕິ",
        iceLevel: "ປົກກະຕິ",
        selectedToppings: [],
        itemNote: item.allows_reheat ? undefined : undefined,
        quantity: 1,
        unitPrice: Number(item.base_price) || 0,
        subtotalPrice: Number(item.base_price) || 0,
        discountAmount: 0,
        totalPrice: Number(item.base_price) || 0,
      };
      addToCartWithModifiers(cartItem);
      toast.success(`ເພີ່ມ ${item.name} ໃສ່ອໍເດີແລ້ວ`, { duration: 1200 });
    } else {
      openModifierForNewItem(item);
    }
  };

  const matrix = item.pricing_matrix;
  const temps = item.available_temps || ["hot", "iced"];
  const hasHot = matrix ? (matrix.hot?.enabled !== false && (matrix.hot?.sizes?.some(s => s.enabled) ?? false)) : temps.includes("hot");
  const hasIced = matrix ? (matrix.iced?.enabled !== false && (matrix.iced?.sizes?.some(s => s.enabled) ?? false)) : temps.includes("iced");
  const hasFrappe = matrix ? (matrix.frappe?.enabled !== false && (matrix.frappe?.sizes?.some(s => s.enabled) ?? false)) : temps.includes("frappe");

  return (
    <motion.div
      whileTap={item.is_available ? { scale: 0.96 } : {}}
      onClick={handleCardClick}
      className={`group relative flex flex-col h-full rounded-2xl border transition-all select-none touch-manipulation overflow-hidden ${
        !item.is_available
          ? "border-stone-200/60 bg-stone-100/50 opacity-60 cursor-not-allowed"
          : "border-stone-200/90 bg-white hover:border-amber-500/80 hover:shadow-md cursor-pointer"
      } p-2 pb-2.5 shadow-2xs`}
    >
      {/* 1. Beverage Image Frame: Edge-to-Edge Clean White */}
      <div className="relative h-36 sm:h-40 w-full bg-white rounded-xl overflow-hidden flex items-center justify-center border border-stone-100">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-amber-800/40 bg-stone-50">
            <Coffee className="h-10 w-10" />
          </div>
        )}

        {/* 86-ed / Sold Out Overlay */}
        {!item.is_available && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-2xs flex flex-col items-center justify-center text-white z-20">
            <Ban className="h-6 w-6 text-rose-400 mb-0.5" />
            <span className="text-xs font-black uppercase tracking-wider text-rose-200">
              ໝົດຊົ່ວຄາວ
            </span>
            <span className="text-[9px] text-stone-300">86-ed Out of stock</span>
          </div>
        )}
      </div>

      {/* 2. Text Meta: Name in Bold Charcoal & Price in Espresso Black */}
      <div className="px-1 pt-2 flex flex-col justify-between flex-1 min-w-0">
        <div>
          <h4 className="text-[13.5px] sm:text-[14px] font-bold text-stone-800 leading-snug line-clamp-2 min-h-[38px] flex items-center">
            {item.name}
          </h4>
          {item.name_en && (
            <p className="text-[10.5px] text-stone-400 truncate mt-0.5 font-medium">
              {item.name_en}
            </p>
          )}
        </div>

        {/* Bottom Row: Price & 1-Touch Quick Add Plus Button */}
        <div className="mt-2 pt-1.5 flex items-center justify-between border-t border-stone-100">
          <div className="flex items-baseline gap-1">
            <span className="text-[14px] sm:text-[15px] font-extrabold text-[#2C1810] tracking-tight tabular-nums">
              {formatLak(item.base_price)}
            </span>
          </div>

          <div
            className={`flex h-7.5 w-7.5 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl transition-all shadow-2xs ${
              !item.is_available
                ? "bg-stone-200 text-stone-400"
                : "bg-amber-50 text-[#D97706] group-hover:bg-[#2C1810] group-hover:text-amber-300 active:scale-95"
            }`}
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
          </div>
        </div>
      </div>
    </motion.div>
  );
});
