"use client";

// ============================================================================
// Tactile Barista Modifier Modal / Drawer - Heart of QuickOne Specialty Coffee POS
// Smart Defaults: Iced (ເຢັນ) + Size M + 100% Sweetness + Normal Ice (0.5s Single-Tap Add)
// ============================================================================

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Minus,
  Check,
  Flame,
  Snowflake,
  Wind,
  Coffee,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useCafePosStore } from "../stores/cafe-pos.store";
import {
  Temperature,
  CupSize,
  Sweetness,
  IceLevel,
  SelectedTopping,
  CafeCartItem,
} from "../types/cafe.types";
import { formatLak } from "@/utils/formatLakCurrency";
import { triggerHapticFeedback } from "@/utils/haptics";

const QUICK_NOTE_TAGS = [
  "ນ້ຳກ້ອນໜ້ອຍ",
  "ແຍກນ້ຳກ້ອນ",
  "ບໍ່ໃສ່ນ້ຳກ້ອນ",
  "ກາເຟເຂັ້ມ",
  "ກາເຟອ່ອນ",
  "ໃສ່ຖົງກັບບ້ານ",
  "ບໍ່ໃສ່ຫຼອດ",
  "ນົມໄຂມັນຕ່ຳ",
];

// Clean cup size labels: removes (12oz), (16oz), (22oz), (12), (16), (22), etc.
function cleanSizeLabel(name?: string, code?: string): string {
  if (!name && code) return `Size ${code}`;
  if (!name) return "";
  const cleaned = name
    .replace(/\s*\(\s*\d+\s*(?:oz|ml)?\s*\)/gi, "")
    .replace(/\s*\d+\s*oz\b/gi, "")
    .trim();
  return cleaned || (code ? `Size ${code}` : name);
}

export function BaristaModifierModal() {
  const isModifierModalOpen = useCafePosStore((s) => s.isModifierModalOpen);
  const selectedMenuItem = useCafePosStore((s) => s.selectedMenuItemForModifier);
  const editingCartItem = useCafePosStore((s) => s.editingCartItem);
  const closeModifierModal = useCafePosStore((s) => s.closeModifierModal);
  const addToCartWithModifiers = useCafePosStore((s) => s.addToCartWithModifiers);
  const updateCartItem = useCafePosStore((s) => s.updateCartItem);
  const toppingsList = useCafePosStore((s) => s.toppings);

  // Form State
  const [temperature, setTemperature] = useState<Temperature>("ເຢັນ");
  const [size, setSize] = useState<CupSize>("M");
  const [sweetness, setSweetness] = useState<Sweetness>("100%");
  const [iceLevel, setIceLevel] = useState<IceLevel>("ປົກກະຕິ");
  const [selectedToppings, setSelectedToppings] = useState<SelectedTopping[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [customNote, setCustomNote] = useState<string>("");

  // Initialize or prefill state when modal opens
  const matrix = selectedMenuItem?.pricing_matrix;

  // Temperature modes
  const allowsHot = useMemo(() => {
    if (!selectedMenuItem) return false;
    if (matrix) {
      return (
        matrix.hot?.enabled !== false &&
        Array.isArray(matrix.hot?.sizes) &&
        matrix.hot.sizes.some((s) => s.enabled)
      );
    }
    return (selectedMenuItem.available_temps || ["hot", "iced"]).includes("hot");
  }, [selectedMenuItem, matrix]);

  const allowsIced = useMemo(() => {
    if (!selectedMenuItem) return false;
    if (matrix) {
      return (
        matrix.iced?.enabled !== false &&
        Array.isArray(matrix.iced?.sizes) &&
        matrix.iced.sizes.some((s) => s.enabled)
      );
    }
    return (selectedMenuItem.available_temps || ["hot", "iced"]).includes("iced");
  }, [selectedMenuItem, matrix]);

  const allowsFrappe = useMemo(() => {
    if (!selectedMenuItem) return false;
    if (matrix) {
      return (
        matrix.frappe?.enabled !== false &&
        Array.isArray(matrix.frappe?.sizes) &&
        matrix.frappe.sizes.some((s) => s.enabled)
      );
    }
    return (selectedMenuItem.available_temps || []).includes("frappe");
  }, [selectedMenuItem, matrix]);

  useEffect(() => {
    if (!isModifierModalOpen || !selectedMenuItem) return;

    if (editingCartItem) {
      // Editing existing cart row
      setTemperature(editingCartItem.temperature as "ຮ້ອນ" | "ເຢັນ" | "ປັ່ນ");
      setSize(editingCartItem.size as "S" | "M" | "L");
      setSweetness(editingCartItem.sweetness as any);
      setIceLevel(editingCartItem.iceLevel as any);
      setSelectedToppings(editingCartItem.selectedToppings || []);
      setQuantity(editingCartItem.quantity);
      setCustomNote(editingCartItem.itemNote || "");
    } else {
      // Smart Defaults for new item:
      if (allowsIced) {
        setTemperature("ເຢັນ");
      } else if (allowsHot) {
        setTemperature("ຮ້ອນ");
      } else if (allowsFrappe) {
        setTemperature("ປັ່ນ");
      } else {
        setTemperature("ເຢັນ");
      }

      // Default size
      setSize("M");
      setSweetness("100%");
      setIceLevel("ປົກກະຕິ");
      setSelectedToppings([]);
      setQuantity(1);
      setCustomNote("");
    }
  }, [isModifierModalOpen, selectedMenuItem, editingCartItem, allowsIced, allowsHot, allowsFrappe]);

  // Compute base price according to temperature
  const basePriceForTemp = useMemo(() => {
    if (!selectedMenuItem) return 0;
    if (temperature === "ຮ້ອນ") {
      return Number(selectedMenuItem.price_hot) || Number(selectedMenuItem.base_price) || 0;
    }
    if (temperature === "ເຢັນ") {
      return Number(selectedMenuItem.price_iced) || Number(selectedMenuItem.base_price) || 0;
    }
    if (temperature === "ປັ່ນ") {
      return Number(selectedMenuItem.price_frappe) || Number(selectedMenuItem.base_price) || 0;
    }
    return Number(selectedMenuItem.base_price) || 0;
  }, [selectedMenuItem, temperature]);

  // Available sizes list for this beverage (Matrix-aware)
  const availableSizesList = useMemo(() => {
    if (matrix) {
      const tempConfig =
        temperature === "ຮ້ອນ"
          ? matrix.hot
          : temperature === "ປັ່ນ"
          ? matrix.frappe
          : matrix.iced;

      if (tempConfig?.sizes && tempConfig.sizes.length > 0) {
        const enabledSizes = tempConfig.sizes.filter((s) => s.enabled);
        if (enabledSizes.length > 0) {
          return enabledSizes.map((s) => ({
            code: s.code,
            name: cleanSizeLabel(s.name, s.code),
            price: Number(s.price),
            price_delta: 0,
          }));
        }
      }
    }

    if (selectedMenuItem?.available_sizes && selectedMenuItem.available_sizes.length > 0) {
      return selectedMenuItem.available_sizes.map((s) => ({
        ...s,
        name: cleanSizeLabel(s.name, s.code),
      }));
    }

    return [
      { code: "M", name: "Size M", price: basePriceForTemp, price_delta: 0 },
      { code: "L", name: "Size L", price: basePriceForTemp + 5000, price_delta: 5000 },
    ];
  }, [matrix, temperature, selectedMenuItem, basePriceForTemp]);

  // Automatically align selected size with available sizes for this temperature
  useEffect(() => {
    if (availableSizesList.length > 0 && !availableSizesList.some((s) => s.code === size)) {
      setSize(availableSizesList[0].code as "S" | "M" | "L");
    }
  }, [availableSizesList, size]);

  // Compute toppings total
  const toppingsTotal = useMemo(() => {
    return selectedToppings.reduce((sum, t) => sum + t.price, 0);
  }, [selectedToppings]);

  // Check if drink has multiple real sizes
  const isMultiSize = useMemo(() => {
    if (availableSizesList.length <= 1) return false;
    return availableSizesList.some((s) => s.code === "S" || s.code === "L");
  }, [availableSizesList]);

  // Single Cup Unit Price with exact size price support
  const calculatedUnitPrice = useMemo(() => {
    const sizeOpt = availableSizesList.find((s) => s.code === size) || availableSizesList[0];
    let unitBase = basePriceForTemp;

    if (sizeOpt?.price !== undefined && sizeOpt.price > 0) {
      unitBase = Number(sizeOpt.price);
      if (
        !matrix &&
        temperature === "ປັ່ນ" &&
        selectedMenuItem?.price_frappe &&
        selectedMenuItem?.price_iced &&
        selectedMenuItem.price_frappe > selectedMenuItem.price_iced
      ) {
        unitBase += (selectedMenuItem.price_frappe - selectedMenuItem.price_iced);
      }
    } else if (sizeOpt?.price_delta) {
      unitBase += Number(sizeOpt.price_delta);
    }

    return unitBase + toppingsTotal;
  }, [availableSizesList, size, basePriceForTemp, matrix, temperature, selectedMenuItem, toppingsTotal]);

  const calculatedTotalPrice = calculatedUnitPrice * quantity;

  if (!isModifierModalOpen || !selectedMenuItem) return null;

  const toggleTopping = (topping: { id: string; name: string; price: number }) => {
    triggerHapticFeedback(15);
    setSelectedToppings((prev) => {
      const exists = prev.some((t) => t.id === topping.id);
      if (exists) {
        return prev.filter((t) => t.id !== topping.id);
      } else {
        return [...prev, topping];
      }
    });
  };

  const handleQuickTagClick = (tag: string) => {
    triggerHapticFeedback(15);
    setCustomNote((prev) => {
      if (!prev) return tag;
      const parts = prev
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.includes(tag)) {
        // Toggle off if already selected
        const filtered = parts.filter((p) => p !== tag);
        return filtered.join(", ");
      } else {
        // Append tag
        return [...parts, tag].join(", ");
      }
    });
  };

  const handleConfirm = () => {
    triggerHapticFeedback(30);
    // Sort toppings by ID to guarantee identical composite keys
    const sortedToppings = [...selectedToppings].sort((a, b) => a.id.localeCompare(b.id));
    const toppingsKey = sortedToppings.map((t) => t.id).join("_");
    const uniqueKey = `${selectedMenuItem.id}_${temperature}_${size}_${sweetness}_${toppingsKey}_${customNote.trim()}`;

    // Resolve ice level for DB compatibility: if tag selected, store it; otherwise default "ປົກກະຕິ"
    let resolvedIceLevel: IceLevel = "ປົກກະຕິ";
    if (customNote.includes("ນ້ຳກ້ອນໜ້ອຍ")) resolvedIceLevel = "ນ້ຳກ້ອນໜ້ອຍ";
    else if (customNote.includes("ແຍກນ້ຳກ້ອນ")) resolvedIceLevel = "ແຍກນ້ຳກ້ອນ";
    else if (customNote.includes("ບໍ່ໃສ່ນ້ຳກ້ອນ")) resolvedIceLevel = "ບໍ່ໃສ່ນ້ຳກ້ອນ";

    const cartItem: CafeCartItem = {
      id: uniqueKey,
      menuItemId: selectedMenuItem.id,
      name: selectedMenuItem.name,
      name_en: selectedMenuItem.name_en,
      imageUrl: selectedMenuItem.image_url,
      temperature,
      size: isMultiSize ? size : "STANDARD",
      sweetness,
      iceLevel: temperature === "ຮ້ອນ" ? "ປົກກະຕິ" : resolvedIceLevel,
      selectedToppings: sortedToppings,
      itemNote: customNote.trim() || undefined,
      quantity,
      unitPrice: calculatedUnitPrice,
      subtotalPrice: calculatedTotalPrice,
      discountAmount: 0,
      totalPrice: calculatedTotalPrice,
    };

    if (editingCartItem) {
      updateCartItem(editingCartItem.id, cartItem);
    } else {
      addToCartWithModifiers(cartItem);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      {/* Background backdrop click */}
      <div className="fixed inset-0" onClick={closeModifierModal} />

      {/* Modal Dialog Body - Wide Horizontal 2-Column */}
      <div className="relative w-full max-w-4xl lg:max-w-5xl max-h-[88vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-stone-200/90 z-10 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-stone-200/80 bg-white px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2C1810] text-amber-300 shrink-0 shadow-2xs">
              <Coffee className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-[#2C1810] truncate leading-tight">
                {selectedMenuItem.name}
              </h3>
              <p className="text-[11px] text-stone-500 truncate font-medium">
                {selectedMenuItem.name_en || "Artisanal Drink"} • ເລີ່ມຕົ້ນ {formatLak(selectedMenuItem.base_price)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModifierModal}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2-Column Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden">
          {/* LEFT COLUMN: Drink Identity, Temperature, Size & Quantity */}
          <div className="lg:col-span-5 p-5 bg-stone-50/70 border-r border-stone-200/80 flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-4">
              {/* Product Visual & Live Price Box */}
              <div className="flex items-center gap-3.5 bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs">
                <div className="relative h-16 w-16 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {selectedMenuItem.image_url ? (
                    <img
                      src={selectedMenuItem.image_url}
                      alt={selectedMenuItem.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Coffee className="h-8 w-8 text-stone-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    ລາຄາຕໍ່ຈອກ (Per Cup)
                  </span>
                  <div className="text-lg font-black text-[#2C1810] font-mono leading-tight">
                    {formatLak(calculatedUnitPrice)}
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium truncate mt-0.5">
                    {isMultiSize ? `${temperature} • Size ${size}` : temperature}
                  </div>
                </div>
              </div>

              {/* SECTION 1: STYLE / TEMPERATURE (Minimal Segmented Control) */}
              {selectedMenuItem.has_variants && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                    1. ຮູບແບບ (Style & Temp):
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-200/70 rounded-2xl border border-stone-200">
                    {/* Hot */}
                    <button
                      type="button"
                      disabled={!allowsHot}
                      onClick={() => {
                        triggerHapticFeedback(15);
                        setTemperature("ຮ້ອນ");
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !allowsHot
                          ? "opacity-30 border-dashed border-stone-300 cursor-not-allowed bg-stone-100/50 text-stone-400"
                          : temperature === "ຮ້ອນ"
                          ? "bg-[#2C1810] text-amber-300 shadow-2xs font-black"
                          : "text-stone-700 hover:text-stone-900"
                      }`}
                    >
                      <Flame className="h-3.5 w-3.5 shrink-0" />
                      <span>ຮ້ອນ</span>
                    </button>

                    {/* Iced */}
                    <button
                      type="button"
                      disabled={!allowsIced}
                      onClick={() => {
                        triggerHapticFeedback(15);
                        setTemperature("ເຢັນ");
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !allowsIced
                          ? "opacity-30 border-dashed border-stone-300 cursor-not-allowed bg-stone-100/50 text-stone-400"
                          : temperature === "ເຢັນ"
                          ? "bg-[#2C1810] text-amber-300 shadow-2xs font-black"
                          : "text-stone-700 hover:text-stone-900"
                      }`}
                    >
                      <Snowflake className="h-3.5 w-3.5 shrink-0" />
                      <span>ເຢັນ</span>
                    </button>

                    {/* Frappe */}
                    <button
                      type="button"
                      disabled={!allowsFrappe}
                      onClick={() => {
                        triggerHapticFeedback(15);
                        setTemperature("ປັ່ນ");
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !allowsFrappe
                          ? "opacity-30 border-dashed border-stone-300 cursor-not-allowed bg-stone-100/50 text-stone-400"
                          : temperature === "ປັ່ນ"
                          ? "bg-[#2C1810] text-amber-300 shadow-2xs font-black"
                          : "text-stone-700 hover:text-stone-900"
                      }`}
                    >
                      <Wind className="h-3.5 w-3.5 shrink-0" />
                      <span>ປັ່ນ</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 2: CUP SIZE (ຂະໜາດຈອກ & ລາຄາ - Hidden if single size) */}
              {isMultiSize && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      2. ຂະໜາດຈອກ (Cup Size):
                    </label>
                    <span className="text-[10.5px] font-mono text-stone-400 font-semibold">
                      ເລືອກ Size {size}
                    </span>
                  </div>
                  <div
                    className={`grid gap-1.5 ${
                      availableSizesList.length === 3
                        ? "grid-cols-3"
                        : availableSizesList.length >= 4
                        ? "grid-cols-2 sm:grid-cols-4"
                        : "grid-cols-2"
                    }`}
                  >
                    {availableSizesList.map((sizeOpt) => {
                      const isSelected = size === sizeOpt.code;
                      let displayPrice = "";
                      if (sizeOpt.price !== undefined && sizeOpt.price !== null) {
                        let effective = Number(sizeOpt.price);
                        if (
                          !matrix &&
                          temperature === "ປັ່ນ" &&
                          selectedMenuItem?.price_frappe &&
                          selectedMenuItem?.price_iced &&
                          selectedMenuItem.price_frappe > selectedMenuItem.price_iced
                        ) {
                          effective += (selectedMenuItem.price_frappe - selectedMenuItem.price_iced);
                        }
                        displayPrice = formatLak(effective);
                      } else if (sizeOpt.price_delta) {
                        displayPrice = `+${formatLak(sizeOpt.price_delta)}`;
                      } else {
                        displayPrice = "ມາດຕະຖານ";
                      }

                      return (
                        <button
                          key={sizeOpt.code}
                          type="button"
                          onClick={() => {
                            triggerHapticFeedback(15);
                            setSize(sizeOpt.code as "S" | "M" | "L");
                          }}
                          className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#2C1810] text-white border-[#2C1810] shadow-2xs ring-1 ring-stone-900"
                              : "bg-white border-stone-200 text-stone-700 hover:bg-stone-100"
                          }`}
                        >
                          <span className="text-xs font-black">{cleanSizeLabel(sizeOpt.name, sizeOpt.code)}</span>
                          <span
                            className={`text-[10.5px] mt-0.5 font-mono font-bold ${
                              isSelected ? "text-amber-300" : "text-stone-500"
                            }`}
                          >
                            {displayPrice}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION: SWEETNESS (ລະດັບຄວາມຫວານ - ປັບເລກລຳດັບອັດຕະໂນມັດ) */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    {isMultiSize ? "3. ລະດັບຄວາມຫວານ (Sweetness Level):" : "2. ລະດັບຄວາມຫວານ (Sweetness Level):"}
                  </label>
                  <span className="text-[11px] font-bold text-stone-900 font-mono">
                    {sweetness}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 p-1 bg-stone-200/70 rounded-2xl border border-stone-200">
                  {(["0%", "25%", "50%", "100%", "120%"] as const).map((level) => {
                    const isSelected = sweetness === level;
                    const labelMap = {
                      "0%": "ບໍ່ຫວານ",
                      "25%": "ຫວານ 25%",
                      "50%": "ຫວານໜ້ອຍ",
                      "100%": "ປົກກະຕິ",
                      "120%": "ຫວານຫຼາຍ",
                    };
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => {
                          triggerHapticFeedback(15);
                          setSweetness(level);
                        }}
                        className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#2C1810] text-amber-300 font-black shadow-2xs"
                            : "text-stone-700 hover:text-stone-900 font-semibold"
                        }`}
                      >
                        <span className="text-xs leading-tight font-mono">{level}</span>
                        <span className={`text-[9px] mt-0.5 leading-none ${isSelected ? "text-amber-200" : "text-stone-400"}`}>
                          {labelMap[level]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Stepper in Left Column */}
            <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700">ຈຳນວນ (Qty):</span>
              <div className="flex items-center h-9 rounded-xl border border-stone-200 bg-white p-0.5 shadow-2xs">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => {
                    triggerHapticFeedback(15);
                    setQuantity((prev) => Math.max(1, prev - 1));
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-800 hover:bg-stone-200 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-9 text-center font-black text-sm text-[#2C1810] font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(15);
                    setQuantity((prev) => prev + 1);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-800 hover:bg-stone-200 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Customization Recipe & CTA */}
          <div className="lg:col-span-7 p-5 bg-white flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-4">
              {/* SECTION 4: TOPPINGS MULTI-SELECT (ເພີ່ມທ໊ອບປິ້ງ) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-stone-500" />
                    <span>4. ເພີ່ມທ໊ອບປິ້ງ (Extra Toppings):</span>
                  </label>
                  <span className="text-[10.5px] text-stone-400 font-medium">ເລືອກໄດ້ຫຼາຍລາຍການ</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {toppingsList.map((top) => {
                    const isSelected = selectedToppings.some((t) => t.id === top.id);
                    return (
                      <button
                        key={top.id}
                        type="button"
                        onClick={() => toggleTopping({ id: top.id, name: top.name, price: top.price })}
                        className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-stone-100 border-stone-800 text-stone-900 font-bold shadow-2xs"
                            : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50 font-medium"
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <p className="text-xs truncate leading-tight">{top.name}</p>
                          <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                            +{formatLak(top.price)}
                          </p>
                        </div>
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
                            isSelected
                              ? "bg-stone-900 border-stone-900 text-white"
                              : "border-stone-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 5: QUICK NOTE & CUSTOM NOTE (ໝາຍເຫດພິເສດ) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    5. ໝາຍເຫດພິເສດ (Special Notes):
                  </label>
                  <span className="text-[10.5px] text-stone-400 font-medium">
                    ແຕະເພື່ອເລືອກ / ຍົກເລີກ
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {QUICK_NOTE_TAGS.map((tag) => {
                    const isTagActive = customNote
                      .split(",")
                      .map((p) => p.trim())
                      .includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleQuickTagClick(tag)}
                        className={`rounded-xl border px-2.5 py-1 text-[11px] font-bold active:scale-95 transition-all cursor-pointer ${
                          isTagActive
                            ? "bg-[#2C1810] text-amber-300 border-[#2C1810] shadow-2xs font-black"
                            : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                        }`}
                      >
                        + {tag}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="ປ້ອນໝາຍເຫດເພີ່ມເຕີມສຳລັບ Barista..."
                  className="w-full h-8.5 rounded-xl border border-stone-200 bg-white px-3 text-xs text-stone-900 outline-none focus:border-stone-400 font-medium"
                />
              </div>
            </div>

            {/* Add to Order CTA Button - Aligned to Right, Compact & High-End */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-end">
              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center justify-between gap-4 rounded-2xl bg-[#2C1810] hover:bg-[#1A0D08] active:scale-[0.99] text-white px-5 h-11 shadow-md shadow-[#2C1810]/20 transition-all cursor-pointer min-w-[260px] sm:min-w-[300px]"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400" />
                  <span className="font-extrabold text-xs sm:text-sm">
                    {editingCartItem ? "ອັບເດດລາຍການ" : "ເພີ່ມໃສ່ອໍເດີ (Add to Cart)"}
                  </span>
                </div>
                <div className="font-black text-sm text-amber-300 font-mono tabular-nums">
                  {formatLak(calculatedTotalPrice)}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
