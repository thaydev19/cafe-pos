"use client";

// ============================================================================
// Cafe Menu, Toppings & Category Management Page (ຈັດການເມນູ, ທ໊ອບປິ້ງ & ໝວດໝູ່)
// 100% Real Supabase - Zero Mock Data
// Supports:
// 1. Matrix Pricing by Temperature (Hot/Iced/Frappe x S/M/L) with independent toggles
// 2. Specialized Bakery / Food flow (single flat price, no S/M/L, optional reheat)
// 3. Complete Category Management CRUD (Name, English name, type, icon, sort order)
// ============================================================================

import React, { useState, useEffect, useMemo } from "react";
import {
  Coffee,
  Plus,
  Search,
  RefreshCw,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Layers,
  Save,
  Loader2,
  AlertCircle,
  Flame,
  Snowflake,
  Wind,
  Cake,
  CupSoda,
  IceCream,
  Utensils,
  Cookie,
  Milk,
  Apple,
  Check,
  Tag,
  Croissant,
  ListPlus,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatLak } from "@/utils/formatLakCurrency";
import { KipCurrencyInput } from "@/components/ui/kip-currency-input";
import {
  MenuItemEntity,
  ToppingEntity,
  CategoryEntity,
  SizeOption,
  PricingMatrix,
} from "@/types/database.types";
import { triggerHapticFeedback } from "@/utils/haptics";

// Category Icon Options for Picker
const CATEGORY_ICON_LIST = [
  { name: "Coffee", label: "ກາເຟ (Coffee)", Icon: Coffee },
  { name: "CupSoda", label: "ຊາ & ເຄື່ອງດື່ມ (Tea/Drink)", Icon: CupSoda },
  { name: "IceCream", label: "ປັ່ນ & ໄອສຄຣີມ (Frappe/Ice)", Icon: IceCream },
  { name: "Cake", label: "ເຄັກ & ເບເກີຣີ (Cake/Bakery)", Icon: Cake },
  { name: "Sparkles", label: "ມັດຊະ & ພິເສດ (Matcha/Special)", Icon: Sparkles },
  { name: "Utensils", label: "ອາຫານ (Food/Brunch)", Icon: Utensils },
  { name: "Cookie", label: "ຄຸກກີ້ (Cookie)", Icon: Cookie },
  { name: "Milk", label: "ນົມ (Milk)", Icon: Milk },
  { name: "Flame", label: "ຮ້ອນ (Hot)", Icon: Flame },
  { name: "Apple", label: "ໝາກໄມ້ (Fruit)", Icon: Apple },
];

function getCategoryIconComponent(iconName?: string) {
  const match = CATEGORY_ICON_LIST.find((item) => item.name === iconName);
  return match ? match.Icon : Coffee;
}

// Enterprise Single Source of Truth: strictly determined by DB column `item_type`
export function isBakeryCategory(cat?: CategoryEntity | null): boolean {
  if (!cat) return false;
  return cat.item_type === "bakery";
}

export function ProductsPage() {
  const [activeTab, setActiveTab] = useState<"menu" | "toppings" | "categories">("menu");
  const [categories, setCategories] = useState<CategoryEntity[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemEntity[]>([]);
  const [toppings, setToppings] = useState<ToppingEntity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>("all");

  // ============================================================================
  // Modal State for Menu Item (Drink or Bakery)
  // ============================================================================
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemEntity | null>(null);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  // Common Form Fields
  const [itemName, setItemName] = useState("");
  const [itemNameEn, setItemNameEn] = useState("");
  const [itemCatId, setItemCatId] = useState("");
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [itemType, setItemType] = useState<"beverage" | "bakery">("beverage");

  // Filtered categories strictly for Add/Edit Product Modal (Beverage vs Bakery)
  const filteredModalCategories = useMemo(() => {
    return categories.filter((c) =>
      itemType === "bakery" ? isBakeryCategory(c) : !isBakeryCategory(c)
    );
  }, [categories, itemType]);

  const handleItemTypeChange = (newType: "beverage" | "bakery") => {
    triggerHapticFeedback(15);
    setItemType(newType);

    const matching = categories.filter((c) =>
      newType === "bakery" ? isBakeryCategory(c) : !isBakeryCategory(c)
    );

    // If current category does not belong to new product type, auto-select first matching category
    if (!matching.some((c) => c.id === itemCatId)) {
      if (matching.length > 0) {
        setItemCatId(matching[0].id);
      }
    }
  };

  // Bakery-specific Fields
  const [bakeryPrice, setBakeryPrice] = useState<number>(25000);
  const [allowsReheat, setAllowsReheat] = useState<boolean>(true);

  // Beverage-specific Matrix State
  // 1. Hot
  const [hotActive, setHotActive] = useState<boolean>(true);
  const [hotSizeSActive, setHotSizeSActive] = useState<boolean>(true);
  const [hotSizeSPrice, setHotSizeSPrice] = useState<number>(22000);
  const [hotSizeMActive, setHotSizeMActive] = useState<boolean>(true);
  const [hotSizeMPrice, setHotSizeMPrice] = useState<number>(25000);
  const [hotSizeLActive, setHotSizeLActive] = useState<boolean>(false);
  const [hotSizeLPrice, setHotSizeLPrice] = useState<number>(30000);

  // 2. Iced
  const [icedActive, setIcedActive] = useState<boolean>(true);
  const [icedSizeSActive, setIcedSizeSActive] = useState<boolean>(true);
  const [icedSizeSPrice, setIcedSizeSPrice] = useState<number>(25000);
  const [icedSizeMActive, setIcedSizeMActive] = useState<boolean>(true);
  const [icedSizeMPrice, setIcedSizeMPrice] = useState<number>(30000);
  const [icedSizeLActive, setIcedSizeLActive] = useState<boolean>(true);
  const [icedSizeLPrice, setIcedSizeLPrice] = useState<number>(38000);

  // 3. Frappe
  const [frappeActive, setFrappeActive] = useState<boolean>(true);
  const [frappeSizeSActive, setFrappeSizeSActive] = useState<boolean>(false);
  const [frappeSizeSPrice, setFrappeSizeSPrice] = useState<number>(30000);
  const [frappeSizeMActive, setFrappeSizeMActive] = useState<boolean>(true);
  const [frappeSizeMPrice, setFrappeSizeMPrice] = useState<number>(35000);
  const [frappeSizeLActive, setFrappeSizeLActive] = useState<boolean>(true);
  const [frappeSizeLPrice, setFrappeSizeLPrice] = useState<number>(45000);

  // Computed: whether beverage matrix is in single-size mode (no S or L active)
  const isSingleMode = useMemo(() => {
    return !hotSizeSActive && !hotSizeLActive && !icedSizeSActive && !icedSizeLActive && !frappeSizeSActive && !frappeSizeLActive;
  }, [hotSizeSActive, hotSizeLActive, icedSizeSActive, icedSizeLActive, frappeSizeSActive, frappeSizeLActive]);

  // ============================================================================
  // Modal State for Category Management
  // ============================================================================
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryEntity | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryNameEn, setCategoryNameEn] = useState("");
  const [categoryItemType, setCategoryItemType] = useState<"beverage" | "bakery">("beverage");
  const [categoryIcon, setCategoryIcon] = useState("Coffee");
  const [categorySortOrder, setCategorySortOrder] = useState<number>(1);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  // ============================================================================
  // Modal State for Topping Management
  // ============================================================================
  const [isToppingModalOpen, setIsToppingModalOpen] = useState(false);
  const [editingTopping, setEditingTopping] = useState<ToppingEntity | null>(null);
  const [toppingName, setToppingName] = useState("");
  const [toppingPrice, setToppingPrice] = useState<number>(5000);
  const [isSubmittingTopping, setIsSubmittingTopping] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [catsRes, itemsRes, toppingsRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order", { ascending: true }),
        supabase.from("menu_items").select("*").order("name", { ascending: true }),
        supabase.from("toppings").select("*").order("price", { ascending: true }),
      ]);

      setCategories(catsRes.data || []);
      setMenuItems(itemsRes.data || []);
      setToppings(toppingsRes.data || []);
    } catch (err) {
      console.error("[ProductsPage] loadData error:", err);
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນເມນູໄດ້");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Toggle Menu Item Availability (86-ed)
  const handleToggleItemAvailability = async (item: MenuItemEntity) => {
    triggerHapticFeedback(15);
    const newStatus = !item.is_available;
    setMenuItems((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, is_available: newStatus } : m))
    );

    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: newStatus, updated_at: new Date().toISOString() })
        .eq("id", item.id);

      if (error) throw error;
      toast.success(
        newStatus ? `ເປີດຂາຍ ${item.name} ແລ້ວ` : `ຕັ້ງ ${item.name} ເປັນໝົດຊົ່ວຄາວ (86-ed) ແລ້ວ`
      );
    } catch {
      setMenuItems((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, is_available: !newStatus } : m))
      );
      toast.error("ອັບເດດສະຖານະບໍ່ສຳເລັດ");
    }
  };

  // 2. Toggle Category Status (Active/Inactive)
  const handleToggleCategoryActive = async (cat: CategoryEntity) => {
    triggerHapticFeedback(15);
    const newStatus = !cat.is_active;
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, is_active: newStatus } : c))
    );

    try {
      const { error } = await supabase
        .from("categories")
        .update({ is_active: newStatus })
        .eq("id", cat.id);

      if (error) throw error;
      toast.success(newStatus ? `ເປີດໃຊ້ໝວດໝູ່ "${cat.name}"` : `ປິດໝວດໝູ່ "${cat.name}"`);
    } catch {
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: !newStatus } : c))
      );
      toast.error("ອັບເດດໝວດໝູ່ບໍ່ສຳເລັດ");
    }
  };

  // 3. Toggle Topping Availability
  const handleToggleToppingAvailability = async (topping: ToppingEntity) => {
    triggerHapticFeedback(15);
    const newStatus = !topping.is_available;
    setToppings((prev) =>
      prev.map((t) => (t.id === topping.id ? { ...t, is_available: newStatus } : t))
    );

    try {
      const { error } = await supabase
        .from("toppings")
        .update({ is_available: newStatus })
        .eq("id", topping.id);

      if (error) throw error;
      toast.success(
        newStatus ? `ເປີດໃຊ້ທ໊ອບປິ້ງ ${topping.name}` : `ປິດທ໊ອບປິ້ງ ${topping.name}`
      );
    } catch {
      setToppings((prev) =>
        prev.map((t) => (t.id === topping.id ? { ...t, is_available: !newStatus } : t))
      );
      toast.error("ອັບເດດບໍ່ສຳເລັດ");
    }
  };

  // 4. Open Category Modal
  const openCategoryModal = (cat?: CategoryEntity) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryName(cat.name);
      setCategoryNameEn(cat.name_en || "");
      setCategoryItemType((cat.item_type as "beverage" | "bakery") || "beverage");
      setCategoryIcon(cat.icon || "Coffee");
      setCategorySortOrder(cat.sort_order || 1);
    } else {
      setEditingCategory(null);
      setCategoryName("");
      setCategoryNameEn("");
      setCategoryItemType("beverage");
      setCategoryIcon("Coffee");
      setCategorySortOrder(categories.length + 1);
    }
    setIsCategoryModalOpen(true);
  };

  // 5. Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error("ກະລຸນາປ້ອນຊື່ໝວດໝູ່");
      return;
    }

    setIsSubmittingCategory(true);
    try {
      const payload = {
        name: categoryName.trim(),
        name_en: categoryNameEn.trim() || null,
        item_type: categoryItemType,
        icon: categoryIcon || "Coffee",
        sort_order: Number(categorySortOrder) || 1,
        is_active: editingCategory ? editingCategory.is_active : true,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editingCategory.id);
        if (error) throw error;
        toast.success("ອັບເດດໝວດໝູ່ສຳເລັດແລ້ວ");
      } else {
        const { error } = await supabase.from("categories").insert([payload]);
        if (error) throw error;
        toast.success("ເພີ່ມໝວດໝູ່ໃໝ່ສຳເລັດແລ້ວ");
      }

      setIsCategoryModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || "ບັນທຶກໝວດໝູ່ບໍ່ສຳເລັດ");
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  // 6. Delete Category
  const handleDeleteCategory = async (cat: CategoryEntity) => {
    const itemsInCat = menuItems.filter((m) => m.category_id === cat.id);
    if (itemsInCat.length > 0) {
      const confirm = window.confirm(
        `ໝວດໝູ່ "${cat.name}" ມີ ${itemsInCat.length} ລາຍການສິນຄ້າ! ທ່ານຕ້ອງການລຶບແທ້ບໍ່? (ລາຍການສິນຄ້າຈະບໍ່ຖືກລຶບ ແຕ່ຈະຖືກຍ້າຍອອກຈາກໝວດໝູ່ນີ້)`
      );
      if (!confirm) return;
    } else {
      const confirm = window.confirm(`ທ່ານຕ້ອງການລຶບໝວດໝູ່ "${cat.name}" ແທ້ບໍ່?`);
      if (!confirm) return;
    }

    try {
      const { error } = await supabase.from("categories").delete().eq("id", cat.id);
      if (error) throw error;
      toast.success(`ໄດ້ລຶບໝວດໝູ່ ${cat.name} ແລ້ວ`);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (err: any) {
      toast.error(err?.message || "ລຶບໝວດໝູ່ບໍ່ສຳເລັດ");
    }
  };

  // 7. Open Menu Item Modal (Matrix-aware & Bakery-aware)
  const openItemModal = (item?: MenuItemEntity) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemNameEn(item.name_en || "");
      setItemCatId(item.category_id || (categories[0]?.id || ""));
      setItemImageUrl(item.image_url || "");

      const isBakery = item.item_type === "bakery" || item.has_variants === false;
      setItemType(isBakery ? "bakery" : "beverage");
      setBakeryPrice(Number(item.base_price) || 25000);
      setAllowsReheat(item.allows_reheat ?? true);

      // Populate Beverage Matrix
      if (item.pricing_matrix) {
        const m = item.pricing_matrix;
        // Hot
        setHotActive(m.hot?.enabled !== false);
        const sHot = m.hot?.sizes?.find((s) => s.code === "S");
        const mHot = m.hot?.sizes?.find((s) => s.code === "M" || s.code === "STANDARD" || s.code === "ມາດຕະຖານ");
        const lHot = m.hot?.sizes?.find((s) => s.code === "L");
        setHotSizeSActive(!!sHot && sHot.enabled !== false);
        setHotSizeSPrice(sHot?.price ?? 22000);
        setHotSizeMActive(!!mHot && mHot.enabled !== false);
        setHotSizeMPrice(mHot?.price ?? (item.price_hot || 25000));
        setHotSizeLActive(!!lHot && lHot.enabled !== false);
        setHotSizeLPrice(lHot?.price ?? 30000);

        // Iced
        setIcedActive(m.iced?.enabled !== false);
        const sIced = m.iced?.sizes?.find((s) => s.code === "S");
        const mIced = m.iced?.sizes?.find((s) => s.code === "M" || s.code === "STANDARD" || s.code === "ມາດຕະຖານ");
        const lIced = m.iced?.sizes?.find((s) => s.code === "L");
        setIcedSizeSActive(!!sIced && sIced.enabled !== false);
        setIcedSizeSPrice(sIced?.price ?? 25000);
        setIcedSizeMActive(!!mIced && mIced.enabled !== false);
        setIcedSizeMPrice(mIced?.price ?? (item.price_iced || 30000));
        setIcedSizeLActive(!!lIced && lIced.enabled !== false);
        setIcedSizeLPrice(lIced?.price ?? 38000);

        // Frappe
        setFrappeActive(m.frappe?.enabled !== false);
        const sFrappe = m.frappe?.sizes?.find((s) => s.code === "S");
        const mFrappe = m.frappe?.sizes?.find((s) => s.code === "M" || s.code === "STANDARD" || s.code === "ມາດຕະຖານ");
        const lFrappe = m.frappe?.sizes?.find((s) => s.code === "L");
        setFrappeSizeSActive(!!sFrappe && sFrappe.enabled !== false);
        setFrappeSizeSPrice(sFrappe?.price ?? 30000);
        setFrappeSizeMActive(!!mFrappe && mFrappe.enabled !== false);
        setFrappeSizeMPrice(mFrappe?.price ?? (item.price_frappe || 35000));
        setFrappeSizeLActive(!!lFrappe && lFrappe.enabled !== false);
        setFrappeSizeLPrice(lFrappe?.price ?? 45000);
      } else {
        // Fallback for items without pricing_matrix
        const temps = item.available_temps || ["hot", "iced"];
        setHotActive(temps.includes("hot"));
        setIcedActive(temps.includes("iced"));
        setFrappeActive(temps.includes("frappe"));

        const hasMultiSizes = (item.available_sizes || []).some((s) => s.code === "S" || s.code === "L");
        const sSize = item.available_sizes?.find((s) => s.code === "S");
        const mSize = item.available_sizes?.find((s) => s.code === "M" || s.code === "STANDARD" || s.code === "ມາດຕະຖານ");
        const lSize = item.available_sizes?.find((s) => s.code === "L");

        const baseM = mSize?.price ?? item.base_price ?? 30000;
        const baseS = sSize?.price ?? Math.max(0, baseM - 5000);
        const baseL = lSize?.price ?? baseM + 8000;

        setHotSizeSActive(hasMultiSizes && !!sSize);
        setHotSizeSPrice(item.price_hot ? Math.max(0, item.price_hot - 3000) : baseS);
        setHotSizeMActive(true);
        setHotSizeMPrice(item.price_hot || baseM);
        setHotSizeLActive(hasMultiSizes && !!lSize);
        setHotSizeLPrice(baseL);

        setIcedSizeSActive(hasMultiSizes && !!sSize);
        setIcedSizeSPrice(baseS);
        setIcedSizeMActive(true);
        setIcedSizeMPrice(item.price_iced || baseM);
        setIcedSizeLActive(hasMultiSizes && !!lSize);
        setIcedSizeLPrice(baseL);

        setFrappeSizeSActive(false);
        setFrappeSizeSPrice(baseS + 5000);
        setFrappeSizeMActive(true);
        setFrappeSizeMPrice(item.price_frappe || baseM + 5000);
        setFrappeSizeLActive(hasMultiSizes && !!lSize);
        setFrappeSizeLPrice(baseL + 5000);
      }
    } else {
      // New Item
      setEditingItem(null);
      setItemName("");
      setItemNameEn("");

      let initialCat: CategoryEntity | undefined;
      if (selectedCatFilter !== "all") {
        initialCat = categories.find((c) => c.id === selectedCatFilter);
      }
      if (!initialCat) {
        initialCat = categories.find((c) => !isBakeryCategory(c)) || categories[0];
      }

      const initialCatId = initialCat?.id || "";
      setItemCatId(initialCatId);
      setItemImageUrl("");

      const isDefaultBakery = initialCat ? isBakeryCategory(initialCat) : false;
      setItemType(isDefaultBakery ? "bakery" : "beverage");
      setBakeryPrice(25000);
      setAllowsReheat(true);

      // Default beverage matrix
      setHotActive(true);
      setHotSizeSActive(true);
      setHotSizeSPrice(22000);
      setHotSizeMActive(true);
      setHotSizeMPrice(25000);
      setHotSizeLActive(false);
      setHotSizeLPrice(30000);

      setIcedActive(true);
      setIcedSizeSActive(true);
      setIcedSizeSPrice(25000);
      setIcedSizeMActive(true);
      setIcedSizeMPrice(30000);
      setIcedSizeLActive(true);
      setIcedSizeLPrice(38000);

      setFrappeActive(true);
      setFrappeSizeSActive(false);
      setFrappeSizeSPrice(30000);
      setFrappeSizeMActive(true);
      setFrappeSizeMPrice(35000);
      setFrappeSizeLActive(true);
      setFrappeSizeLPrice(45000);
    }
    setIsItemModalOpen(true);
  };

  // 8. Handle Category change in Modal (Auto-suggest product type)
  const handleCategorySelectChange = (newCatId: string) => {
    setItemCatId(newCatId);
    if (!editingItem) {
      const found = categories.find((c) => c.id === newCatId);
      if (found) {
        setItemType(isBakeryCategory(found) ? "bakery" : "beverage");
      }
    }
  };

  // 9. Save Menu Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      toast.error("ກະລຸນາປ້ອນຊື່ສິນຄ້າ");
      return;
    }

    setIsSubmittingItem(true);
    try {
      let payload: any = {
        name: itemName.trim(),
        name_en: itemNameEn.trim() || null,
        category_id: itemCatId || null,
        item_type: itemType,
        image_url: itemImageUrl.trim() || null,
        is_available: editingItem ? editingItem.is_available : true,
        updated_at: new Date().toISOString(),
      };

      if (itemType === "bakery") {
        // Bakery: Single flat base price, no S/M/L, no drink variants
        payload = {
          ...payload,
          base_price: bakeryPrice,
          has_variants: false,
          allows_reheat: allowsReheat,
          available_temps: [],
          available_sizes: [
            { code: "M", name: "1 ຊິ້ນ (Piece)", price: bakeryPrice, price_delta: 0, is_default: true },
          ],
          pricing_matrix: null,
          price_hot: bakeryPrice,
          price_iced: bakeryPrice,
          price_frappe: bakeryPrice,
        };
      } else {
        // Beverage: Check if configured as Single Size or Multi Size S/M/L
        const isSingleMode =
          !hotSizeSActive && !hotSizeLActive && !icedSizeSActive && !icedSizeLActive && !frappeSizeSActive && !frappeSizeLActive;

        let pricingMatrix: PricingMatrix;
        let available_sizes: SizeOption[] = [];

        if (isSingleMode) {
          // Single size beverage: Only STANDARD size
          pricingMatrix = {
            hot: {
              enabled: hotActive,
              sizes: hotActive ? [{ code: "STANDARD", name: "ມາດຕະຖານ", price: hotSizeMPrice, enabled: true }] : [],
            },
            iced: {
              enabled: icedActive,
              sizes: icedActive ? [{ code: "STANDARD", name: "ມາດຕະຖານ", price: icedSizeMPrice, enabled: true }] : [],
            },
            frappe: {
              enabled: frappeActive,
              sizes: frappeActive ? [{ code: "STANDARD", name: "ມາດຕະຖານ", price: frappeSizeMPrice, enabled: true }] : [],
            },
          };

          const defaultPrice = (icedActive ? icedSizeMPrice : hotActive ? hotSizeMPrice : frappeSizeMPrice) || 25000;
          available_sizes = [
            {
              code: "STANDARD",
              name: "ມາດຕະຖານ",
              price: defaultPrice,
              price_delta: 0,
              is_default: true,
            },
          ];
        } else {
          // Multi size beverage: Matrix with S/M/L
          pricingMatrix = {
            hot: {
              enabled: hotActive,
              sizes: [
                ...(hotSizeSActive ? [{ code: "S", name: "Size S ", price: hotSizeSPrice, enabled: true }] : []),
                ...(hotSizeMActive ? [{ code: "M", name: "Size M ", price: hotSizeMPrice, enabled: true }] : []),
                ...(hotSizeLActive ? [{ code: "L", name: "Size L ", price: hotSizeLPrice, enabled: true }] : []),
              ],
            },
            iced: {
              enabled: icedActive,
              sizes: [
                ...(icedSizeSActive ? [{ code: "S", name: "Size S ", price: icedSizeSPrice, enabled: true }] : []),
                ...(icedSizeMActive ? [{ code: "M", name: "Size M ", price: icedSizeMPrice, enabled: true }] : []),
                ...(icedSizeLActive ? [{ code: "L", name: "Size L ", price: icedSizeLPrice, enabled: true }] : []),
              ],
            },
            frappe: {
              enabled: frappeActive,
              sizes: [
                ...(frappeSizeSActive ? [{ code: "S", name: "Size S ", price: frappeSizeSPrice, enabled: true }] : []),
                ...(frappeSizeMActive ? [{ code: "M", name: "Size M ", price: frappeSizeMPrice, enabled: true }] : []),
                ...(frappeSizeLActive ? [{ code: "L", name: "Size L ", price: frappeSizeLPrice, enabled: true }] : []),
              ],
            },
          };

          ["S", "M", "L"].forEach((code) => {
            const found =
              pricingMatrix.iced?.sizes.find((s) => s.code === code) ||
              pricingMatrix.hot?.sizes.find((s) => s.code === code) ||
              pricingMatrix.frappe?.sizes.find((s) => s.code === code);
            if (found) {
              available_sizes.push({
                code: found.code,
                name: found.name,
                price: found.price,
                price_delta: 0,
                is_default: found.code === "M",
              });
            }
          });

          if (available_sizes.length === 0) {
            available_sizes.push({ code: "M", name: "Size M", price: 25000, price_delta: 0, is_default: true });
          }
        }

        const availableTemps: string[] = [];
        if (hotActive) availableTemps.push("hot");
        if (icedActive) availableTemps.push("iced");
        if (frappeActive) availableTemps.push("frappe");

        const priceHot = isSingleMode ? (hotActive ? hotSizeMPrice : 0) : (hotSizeMActive ? hotSizeMPrice : hotSizeSPrice || 0);
        const priceIced = isSingleMode ? (icedActive ? icedSizeMPrice : 0) : (icedSizeMActive ? icedSizeMPrice : icedSizeSPrice || 0);
        const priceFrappe = isSingleMode ? (frappeActive ? frappeSizeMPrice : 0) : (frappeSizeMActive ? frappeSizeMPrice : frappeSizeLPrice || 0);
        const basePrice = priceIced || priceHot || priceFrappe || 25000;

        payload = {
          ...payload,
          base_price: basePrice,
          has_variants: true,
          allows_reheat: false,
          available_temps: availableTemps,
          available_sizes,
          pricing_matrix: pricingMatrix,
          price_hot: priceHot,
          price_iced: priceIced,
          price_frappe: priceFrappe,
        };
      }

      if (editingItem) {
        const { error } = await supabase.from("menu_items").update(payload).eq("id", editingItem.id);
        if (error) throw error;
        toast.success("ອັບເດດສິນຄ້າສຳເລັດແລ້ວ");
      } else {
        const { error } = await supabase.from("menu_items").insert([payload]);
        if (error) throw error;
        toast.success("ເພີ່ມສິນຄ້າໃໝ່ສຳເລັດແລ້ວ");
      }

      setIsItemModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || "ບັນທຶກສິນຄ້າບໍ່ສຳເລັດ");
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // 10. Delete Menu Item
  const handleDeleteItem = async (item: MenuItemEntity) => {
    const confirm = window.confirm(`ທ່ານຕ້ອງການລຶບເມນູ "${item.name}" ແທ້ບໍ່?`);
    if (!confirm) return;

    try {
      const { error } = await supabase.from("menu_items").delete().eq("id", item.id);
      if (error) throw error;
      toast.success(`ໄດ້ລຶບເມນູ ${item.name} ແລ້ວ`);
      setMenuItems((prev) => prev.filter((m) => m.id !== item.id));
    } catch (err: any) {
      toast.error(err?.message || "ລຶບເມນູບໍ່ສຳເລັດ");
    }
  };

  // 11. Save Topping
  const handleSaveTopping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toppingName.trim()) return;
    setIsSubmittingTopping(true);

    try {
      if (editingTopping) {
        const { error } = await supabase
          .from("toppings")
          .update({ name: toppingName.trim(), price: toppingPrice })
          .eq("id", editingTopping.id);
        if (error) throw error;
        toast.success("ອັບເດດທ໊ອບປິ້ງສຳເລັດ");
      } else {
        const { error } = await supabase
          .from("toppings")
          .insert([{ name: toppingName.trim(), price: toppingPrice, is_available: true }]);
        if (error) throw error;
        toast.success("ເພີ່ມທ໊ອບປິ້ງໃໝ່ສຳເລັດ");
      }
      setIsToppingModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || "ບັນທຶກບໍ່ສຳເລັດ");
    } finally {
      setIsSubmittingTopping(false);
    }
  };

  // Filtered menu items
  const filteredMenuItems = menuItems.filter((m) => {
    if (selectedCatFilter !== "all" && m.category_id !== selectedCatFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.name_en?.toLowerCase().includes(q);
    }
    return true;
  });

  // Helper for clean, minimal pricing summary in table
  const getItemPricingInfo = (item: MenuItemEntity) => {
    const isBakery = item.item_type === "bakery" || item.has_variants === false;
    if (isBakery) {
      return {
        priceText: formatLak(item.base_price),
        detailText: "ລາຄາດຽວ (Flat Price)",
        isRange: false,
      };
    }

    const allPrices: number[] = [];
    const sizeMap: Record<string, number> = {};
    let isSingleDrink = false;

    if (item.pricing_matrix) {
      const m = item.pricing_matrix;
      let hasSOrL = false;
      [m.hot, m.iced, m.frappe].forEach((temp) => {
        if (temp && temp.enabled !== false && Array.isArray(temp.sizes)) {
          temp.sizes.forEach((s) => {
            if (s.enabled && s.price > 0) {
              allPrices.push(s.price);
              if (s.code === "S" || s.code === "L") {
                hasSOrL = true;
                if (!sizeMap[s.code] || s.price < sizeMap[s.code]) {
                  sizeMap[s.code] = s.price;
                }
              } else {
                if (!sizeMap["M"] || s.price < sizeMap["M"]) {
                  sizeMap["M"] = s.price;
                }
              }
            }
          });
        }
      });
      if (!hasSOrL && allPrices.length > 0) {
        isSingleDrink = true;
      }
    }

    if (allPrices.length === 0 && item.available_sizes && item.available_sizes.length > 0) {
      const hasSOrL = item.available_sizes.some((s) => s.code === "S" || s.code === "L");
      if (!hasSOrL) isSingleDrink = true;
      item.available_sizes.forEach((s) => {
        const p = Number(s.price) || Number(item.base_price);
        if (p > 0) {
          allPrices.push(p);
          sizeMap[s.code] = p;
        }
      });
    }

    if (allPrices.length === 0) {
      allPrices.push(Number(item.base_price) || 25000);
      isSingleDrink = true;
    }

    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    const priceText = min === max ? formatLak(min) : `${formatLak(min)} - ${formatLak(max)}`;

    if (isSingleDrink) {
      return {
        priceText,
        detailText: "1 ຂະໜາດ (Single)",
        isRange: min !== max,
      };
    }

    const sizeParts: string[] = [];
    ["S", "M", "L"].forEach((code) => {
      if (sizeMap[code]) {
        sizeParts.push(`${code}: ${formatLak(sizeMap[code])}`);
      }
    });

    return {
      priceText,
      detailText: sizeParts.length > 0 ? sizeParts.join(" • ") : "",
      isRange: min !== max,
    };
  };

  return (
    <div className="space-y-4 select-none">
      {/* 1. Header with 3 Main Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2C1810] text-amber-300 shadow-xs">
            <Coffee className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-[#2C1810] leading-tight">
              ຈັດການເມນູ, ທ໊ອບປິ້ງ & ໝວດໝູ່ (Menu & Catalog)
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              ກຳນົດລາຄາ Ma trận (ຮ້ອນ/ເຢັນ/ປັ່ນ $\times$ S/M/L), ເບເກີຣີ & ໝວດໝູ່ (Supabase Real Data)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Main 3-Tab Toggle */}
          <div className="flex items-center rounded-2xl bg-stone-100 p-1 border border-stone-200 text-xs font-bold shadow-2xs">
            {/* Tab 1: Menu Items */}
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(15);
                setActiveTab("menu");
              }}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "menu"
                  ? "bg-[#2C1810] text-amber-300 shadow-xs font-black"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Coffee className="h-3.5 w-3.5" />
              <span>ລາຍການເມນູ ({menuItems.length})</span>
            </button>

            {/* Tab 2: Toppings */}
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(15);
                setActiveTab("toppings");
              }}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "toppings"
                  ? "bg-[#2C1810] text-amber-300 shadow-xs font-black"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <ListPlus className="h-3.5 w-3.5" />
              <span>ທ໊ອບປິ້ງ ({toppings.length})</span>
            </button>

            {/* Tab 3: Categories (NEW) */}
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(15);
                setActiveTab("categories");
              }}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "categories"
                  ? "bg-[#2C1810] text-amber-300 shadow-xs font-black"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>ໝວດໝູ່ ({categories.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
            title="ໂຫຼດຂໍ້ມູນໃໝ່"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-amber-700" : ""}`} />
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. TAB 1: MENU ITEMS */}
      {/* ==================================================================== */}
      {activeTab === "menu" && (
        <div className="space-y-3.5">
          {/* Filter Bar & Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ຄົ້ນຫາຊື່ເມນູ..."
                  className="h-10 w-full rounded-xl border border-stone-200 pl-9 pr-3 text-xs outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Category Dropdown */}
              <select
                value={selectedCatFilter}
                onChange={(e) => setSelectedCatFilter(e.target.value)}
                className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold text-stone-700 outline-none focus:border-amber-600 cursor-pointer"
              >
                <option value="all">ທຸກໝວດໝູ່</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => openItemModal()}
              className="flex items-center gap-1.5 rounded-xl bg-[#2C1810] text-amber-300 px-4 py-2.5 text-xs font-extrabold hover:bg-[#1A0D08] active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ ເພີ່ມເມນູໃໝ່</span>
            </button>
          </div>

          {/* Menu Items Table */}
          <div className="rounded-3xl border border-stone-200/90 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200/80 bg-stone-50/80 text-[10.5px] text-stone-500 uppercase font-bold tracking-wider">
                    <th className="py-3 px-4">ລາຍການສິນຄ້າ (Product)</th>
                    <th className="py-3 px-3">ປະເພດ</th>
                    <th className="py-3 px-3">ລາຄາຂາຍ (Price)</th>
                    <th className="py-3 px-3">ຮູບແບບ (Modes)</th>
                    <th className="py-3 px-3 text-center">ສະຖານະ (Status)</th>
                    <th className="py-3 px-4 text-right">ຈັດການ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredMenuItems.map((item) => {
                    const isBakery = item.item_type === "bakery" || item.has_variants === false;
                    const cat = categories.find((c) => c.id === item.category_id);
                    const pricing = getItemPricingInfo(item);

                    return (
                      <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                        {/* Name & Image */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="h-full w-full object-cover mix-blend-multiply"
                                />
                              ) : isBakery ? (
                                <Croissant className="h-5 w-5 text-stone-400" />
                              ) : (
                                <Coffee className="h-5 w-5 text-stone-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-stone-900 text-xs sm:text-sm leading-tight truncate">
                                {item.name}
                              </p>
                              {item.name_en && (
                                <p className="text-[11px] text-stone-400 font-medium truncate mt-0.5">
                                  {item.name_en}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Type Badge - Monochromatic Minimal */}
                        <td className="py-3 px-3">
                          {isBakery ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-stone-100 text-stone-700 border border-stone-200/80">
                              <Croissant className="h-3 w-3 text-stone-500" />
                              <span>ເບເກີຣີ</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-stone-100 text-stone-700 border border-stone-200/80">
                              <Coffee className="h-3 w-3 text-stone-500" />
                              <span>ເຄື່ອງດື່ມ</span>
                            </span>
                          )}
                        </td>

                        {/* Price - Clean Monospace Typographic Display */}
                        <td className="py-3 px-3">
                          <div className="font-mono text-xs sm:text-sm font-black text-[#2C1810]">
                            {pricing.priceText}
                          </div>
                          {pricing.detailText && (
                            <div className="text-[10px] font-mono text-stone-400 font-medium mt-0.5">
                              {pricing.detailText}
                            </div>
                          )}
                        </td>

                        {/* Modes - Minimalist Neutral */}
                        <td className="py-3 px-3">
                          {isBakery ? (
                            <span className="text-[11px] text-stone-500 font-medium">
                              {item.allows_reheat ? "ອຸ່ນຮ້ອນໄດ້" : "ພ້ອມກິນ"}
                            </span>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1">
                              {item.available_temps?.includes("hot") && (
                                <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/80 text-[10.5px] font-medium">
                                  ຮ້ອນ
                                </span>
                              )}
                              {item.available_temps?.includes("iced") && (
                                <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/80 text-[10.5px] font-medium">
                                  ເຢັນ
                                </span>
                              )}
                              {item.available_temps?.includes("frappe") && (
                                <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/80 text-[10.5px] font-medium">
                                  ປັ່ນ
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 86-ed Quick Toggle - Subtle Indicator */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleItemAvailability(item)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition-all cursor-pointer ${
                              item.is_available
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                : "bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                item.is_available ? "bg-emerald-600" : "bg-stone-400"
                              }`}
                            />
                            <span>{item.is_available ? "ພ້ອມຂາຍ" : "ໝົດຊົ່ວຄາວ"}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openItemModal(item)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                              title="ແກ້ໄຂສິນຄ້າ"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="ລຶບສິນຄ້າ"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. TAB 2: TOPPINGS (TABLE VIEW) */}
      {/* ==================================================================== */}
      {activeTab === "toppings" && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
            <p className="text-xs text-stone-500 font-semibold">
              ຈັດການລາຍການທ໊ອບປິ້ງເຄື່ອງດື່ມ (ໄຂ່ມຸກ, ວິບຄຣີມ, ຊີສໂຟມ...)
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingTopping(null);
                setToppingName("");
                setToppingPrice(5000);
                setIsToppingModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#2C1810] text-amber-300 px-4 py-2 text-xs font-extrabold hover:bg-[#1A0D08] active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ ເພີ່ມທ໊ອບປິ້ງໃໝ່</span>
            </button>
          </div>

          <div className="rounded-3xl border border-stone-200/90 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200/80 bg-stone-50/80 text-[10.5px] text-stone-500 uppercase font-bold tracking-wider">
                    <th className="py-3 px-4">ຊື່ທ໊ອບປິ້ງ (Topping Name)</th>
                    <th className="py-3 px-3">ລາຄາເພີ່ມ (Extra Price)</th>
                    <th className="py-3 px-3 text-center">ສະຖານະ (Status)</th>
                    <th className="py-3 px-4 text-right">ຈັດການ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {toppings.map((top) => (
                    <tr key={top.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center font-bold text-xs">
                            <ListPlus className="h-4 w-4 text-amber-700" />
                          </div>
                          <span className="font-bold text-stone-900 text-xs sm:text-sm">
                            {top.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs sm:text-sm font-black text-[#2C1810]">
                        +{formatLak(top.price)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleToppingAvailability(top)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black transition-all cursor-pointer ${
                            top.is_available
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-rose-100 text-rose-800 border border-rose-300"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${top.is_available ? "bg-emerald-600" : "bg-rose-600"}`} />
                          <span>{top.is_available ? "ເປີດໃຊ້" : "ປິດໃຊ້"}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTopping(top);
                              setToppingName(top.name);
                              setToppingPrice(top.price);
                              setIsToppingModalOpen(true);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                            title="ແກ້ໄຂ"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. TAB 3: CATEGORIES (TABLE VIEW) */}
      {/* ==================================================================== */}
      {activeTab === "categories" && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
            <div>
              <h3 className="text-sm font-black text-[#2C1810]">
                ຈັດການໝວດໝູ່ສິນຄ້າ (Category Management)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                ຈັດລະບຽບກຸ່ມເຄື່ອງດື່ມ & ເບເກີຣີ, ໄອຄອນ, ລຳດັບການສະແດງເທິງ POS
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCategoryModal()}
              className="flex items-center gap-1.5 rounded-xl bg-[#2C1810] text-amber-300 px-4 py-2 text-xs font-extrabold hover:bg-[#1A0D08] active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ ເພີ່ມໝວດໝູ່ໃໝ່</span>
            </button>
          </div>

          <div className="rounded-3xl border border-stone-200/90 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200/80 bg-stone-50/80 text-[10.5px] text-stone-500 uppercase font-bold tracking-wider">
                    <th className="py-3 px-4">ໝວດໝູ່ (Category)</th>
                    <th className="py-3 px-3">ປະເພດສິນຄ້າ</th>
                    <th className="py-3 px-3 text-center">ລຳດັບ (Sort)</th>
                    <th className="py-3 px-3 text-center">ຈຳນວນເມນູ</th>
                    <th className="py-3 px-3 text-center">ສະຖານະ (Status)</th>
                    <th className="py-3 px-4 text-right">ຈັດການ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {categories.map((cat) => {
                    const IconComponent = getCategoryIconComponent(cat.icon);
                    const itemCount = menuItems.filter((m) => m.category_id === cat.id).length;
                    const isBakeryCat = cat.item_type === "bakery";

                    return (
                      <tr key={cat.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80">
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-stone-900 text-xs sm:text-sm leading-tight truncate">
                                {cat.name}
                              </p>
                              {cat.name_en && (
                                <p className="text-[11px] text-stone-400 font-medium truncate mt-0.5">
                                  {cat.name_en}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {isBakeryCat ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Cake className="h-3 w-3" />
                              <span>ເບເກີຣີ</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-sky-100 text-sky-900 border border-sky-300">
                              <Coffee className="h-3 w-3" />
                              <span>ເຄື່ອງດື່ມ</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-lg text-[10.5px] font-mono font-black bg-stone-100 text-stone-700 border border-stone-200">
                            #{cat.sort_order}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-xs font-bold text-stone-700">
                            {itemCount} ລາຍການ
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleCategoryActive(cat)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black transition-all cursor-pointer ${
                              cat.is_active
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-stone-200 text-stone-600 border border-stone-300"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${cat.is_active ? "bg-emerald-600" : "bg-stone-500"}`} />
                            <span>{cat.is_active ? "ເປີດໃຊ້" : "ປິດໄວ້"}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openCategoryModal(cat)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                              title="ແກ້ໄຂໝວດໝູ່"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="ລຶບໝວດໝູ່"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD / EDIT MENU ITEM (MATRIX + BAKERY FLOW) */}
      {/* ==================================================================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200/80 bg-white px-6 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2C1810] text-amber-300 shadow-2xs">
                  {itemType === "bakery" ? <Croissant className="h-5 w-5" /> : <Coffee className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-[#2C1810] leading-tight">
                    {editingItem ? "ແກ້ໄຂລາຍການສິນຄ້າ" : "ເພີ່ມສິນຄ້າໃໝ່ (New Menu Item)"}
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium">
                    {itemType === "bakery"
                      ? "ໂໝດເບເກີຣີ & ອາຫານ (Bakery / Food • ລາຄາດຽວ)"
                      : "ໂໝດເຄື່ອງດື່ມ (Beverage • ຕາຕະລາງລາຄາ Matrix S/M/L)"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body - 2 Columns */}
            <form onSubmit={handleSaveItem} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-y-auto">
                {/* LEFT COLUMN: Basic Info, Category & Image Preview */}
                <div className="lg:col-span-5 p-5 sm:p-6 bg-stone-50/70 border-r border-stone-200/80 space-y-4 overflow-y-auto">
                  {/* Product Type Segmented Control */}
                  <div>
                    <label className="font-bold text-stone-700 block mb-1.5 uppercase tracking-wider text-[10.5px]">
                      ປະເພດສິນຄ້າ (Product Type):
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-200/70 rounded-2xl border border-stone-200">
                      <button
                        type="button"
                        onClick={() => handleItemTypeChange("beverage")}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          itemType === "beverage"
                            ? "bg-[#2C1810] text-amber-300 shadow-2xs font-black"
                            : "text-stone-600 hover:text-stone-900 font-semibold"
                        }`}
                      >
                        <Coffee className="h-4 w-4" />
                        <span>ເຄື່ອງດື່ມ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleItemTypeChange("bakery")}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          itemType === "bakery"
                            ? "bg-[#2C1810] text-amber-300 shadow-2xs font-black"
                            : "text-stone-600 hover:text-stone-900 font-semibold"
                        }`}
                      >
                        <Croissant className="h-4 w-4" />
                        <span>ເບເກີຣີ / 1 ລາຄາ</span>
                      </button>
                    </div>
                  </div>

                  {/* Category Dropdown (Filtered strictly by Item Type) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-stone-700 text-xs">
                        ໝວດໝູ່ ({itemType === "bakery" ? "ເບເກີຣີ / ອາຫານ" : "ເຄື່ອງດື່ມ"}): <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-stone-400 font-semibold">
                        {filteredModalCategories.length} ໝວດໝູ່
                      </span>
                    </div>
                    <select
                      value={itemCatId}
                      onChange={(e) => handleCategorySelectChange(e.target.value)}
                      className="w-full h-10 rounded-xl border border-stone-200 px-3 font-semibold text-stone-800 bg-white text-xs outline-none focus:border-stone-400 cursor-pointer"
                    >
                      {filteredModalCategories.length === 0 ? (
                        <option value="" disabled>
                          -- ບໍ່ມີໝວດໝູ່{itemType === "bakery" ? "ເບເກີຣີ" : "ເຄື່ອງດື່ມ"} (ກະລຸນາເພີ່ມໝວດໝູ່ກ່ອນ) --
                        </option>
                      ) : (
                        filteredModalCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.name_en ? `• ${c.name_en}` : ""}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Lao Name */}
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs">
                      ຊື່ສິນຄ້າ (ພາສາລາວ) <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder={itemType === "bakery" ? "ເຊັ່ນ: ຄົວຊອງເນີຍສົດ" : "ເຊັ່ນ: ອາເມຣິກາໂນ່ນ້ຳໝາກພ້າວ"}
                      className="w-full h-10 rounded-xl border border-stone-200 px-3 font-bold text-stone-900 bg-white text-xs outline-none focus:border-stone-400"
                    />
                  </div>

                  {/* English Name */}
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-xs">
                      ຊື່ພາສາອັງກິດ (English Name):
                    </label>
                    <input
                      type="text"
                      value={itemNameEn}
                      onChange={(e) => setItemNameEn(e.target.value)}
                      placeholder={itemType === "bakery" ? "e.g. Butter Croissant" : "e.g. Coconut Americano"}
                      className="w-full h-10 rounded-xl border border-stone-200 px-3 text-stone-800 bg-white text-xs outline-none focus:border-stone-400"
                    />
                  </div>

                  {/* Image URL & Live Preview Box */}
                  <div className="space-y-2">
                    <label className="font-bold text-stone-700 block text-xs">
                      ຮູບພາບ (Image URL):
                    </label>
                    <input
                      type="url"
                      value={itemImageUrl}
                      onChange={(e) => setItemImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full h-9 rounded-xl border border-stone-200 px-3 font-mono text-[11px] text-stone-800 bg-white outline-none focus:border-stone-400"
                    />

                    {/* Live Preview Box */}
                    <div className="relative h-24 w-full rounded-2xl border border-stone-200 bg-white overflow-hidden flex items-center justify-center shadow-2xs">
                      {itemImageUrl ? (
                        <img
                          src={itemImageUrl}
                          alt="Preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-stone-400 gap-1 text-[11px]">
                          {itemType === "bakery" ? (
                            <Croissant className="h-6 w-6 stroke-[1.5]" />
                          ) : (
                            <Coffee className="h-6 w-6 stroke-[1.5]" />
                          )}
                          <span>ຕົວຢ່າງຮູບພາບ (Live Preview)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Minimalist Pricing Matrix or Bakery Guide */}
                <div className="lg:col-span-7 p-5 sm:p-6 bg-white space-y-4 overflow-y-auto flex flex-col justify-between">
                  {itemType === "beverage" ? (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-stone-100">
                        <div>
                          <h4 className="text-xs font-black text-stone-800 uppercase tracking-wider">
                            ຕາຕະລາງກຳນົດລາຄາ (Pricing Matrix)
                          </h4>
                          <p className="text-[11px] text-stone-400">
                            ຕິກ [✓] ເພື່ອເປີດຂາຍ ແລະ ປ້ອນລາຄາແຕ່ລະຂະໜາດຈອກ (₭)
                          </p>
                        </div>

                        {/* Quick Size Mode Selector */}
                        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setHotSizeSActive(false);
                              setHotSizeMActive(true);
                              setHotSizeLActive(false);
                              setIcedSizeSActive(false);
                              setIcedSizeMActive(true);
                              setIcedSizeLActive(false);
                              setFrappeSizeSActive(false);
                              setFrappeSizeMActive(true);
                              setFrappeSizeLActive(false);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                              isSingleMode
                                ? "bg-[#2C1810] text-amber-300 shadow-2xs font-black"
                                : "text-stone-600 hover:text-stone-900"
                            }`}
                          >
                            1 ຂະໜາດ (Single)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setHotSizeSActive(true);
                              setHotSizeMActive(true);
                              setHotSizeLActive(true);
                              setIcedSizeSActive(true);
                              setIcedSizeMActive(true);
                              setIcedSizeLActive(true);
                              setFrappeSizeSActive(true);
                              setFrappeSizeMActive(true);
                              setFrappeSizeLActive(true);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                              !isSingleMode
                                ? "bg-[#2C1810] text-amber-300 shadow-2xs font-black"
                                : "text-stone-600 hover:text-stone-900"
                            }`}
                          >
                            3 ຂະໜາດ (S/M/L)
                          </button>
                        </div>
                      </div>

                      {/* Clean Spreadsheet Matrix Table */}
                      <div className="rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
                        {isSingleMode ? (
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-stone-50 border-b border-stone-200 text-[10.5px] font-bold text-stone-600 uppercase tracking-wider">
                                <th className="py-2.5 px-3">ຮູບແບບ (Style)</th>
                                <th className="py-2.5 px-4 text-right">ລາຄາຂາຍ (Price ₭)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 font-medium">
                              {/* 1. HOT ROW */}
                              <tr className={`transition-colors ${hotActive ? "bg-white" : "bg-stone-50/60 opacity-40"}`}>
                                <td className="py-3 px-3">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={hotActive}
                                      onChange={(e) => setHotActive(e.target.checked)}
                                      className="rounded text-stone-800 focus:ring-stone-600 h-4 w-4"
                                    />
                                    <span className="font-bold text-stone-800 text-xs">
                                      ຮ້ອນ (Hot)
                                    </span>
                                  </label>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end">
                                    <KipCurrencyInput
                                      disabled={!hotActive}
                                      value={hotSizeMPrice}
                                      onValueChange={setHotSizeMPrice}
                                      containerClassName="w-32"
                                      className="h-8 text-right font-mono text-xs font-bold text-stone-900 bg-white border-stone-200"
                                      suffix="₭"
                                    />
                                  </div>
                                </td>
                              </tr>

                              {/* 2. ICED ROW */}
                              <tr className={`transition-colors ${icedActive ? "bg-white" : "bg-stone-50/60 opacity-40"}`}>
                                <td className="py-3 px-3">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={icedActive}
                                      onChange={(e) => setIcedActive(e.target.checked)}
                                      className="rounded text-stone-800 focus:ring-stone-600 h-4 w-4"
                                    />
                                    <span className="font-bold text-stone-800 text-xs">
                                      ເຢັນ (Iced)
                                    </span>
                                  </label>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end">
                                    <KipCurrencyInput
                                      disabled={!icedActive}
                                      value={icedSizeMPrice}
                                      onValueChange={setIcedSizeMPrice}
                                      containerClassName="w-32"
                                      className="h-8 text-right font-mono text-xs font-bold text-stone-900 bg-white border-stone-200"
                                      suffix="₭"
                                    />
                                  </div>
                                </td>
                              </tr>

                              {/* 3. FRAPPE ROW */}
                              <tr className={`transition-colors ${frappeActive ? "bg-white" : "bg-stone-50/60 opacity-40"}`}>
                                <td className="py-3 px-3">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={frappeActive}
                                      onChange={(e) => setFrappeActive(e.target.checked)}
                                      className="rounded text-stone-800 focus:ring-stone-600 h-4 w-4"
                                    />
                                    <span className="font-bold text-stone-800 text-xs">
                                      ປັ່ນ (Frappe)
                                    </span>
                                  </label>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end">
                                    <KipCurrencyInput
                                      disabled={!frappeActive}
                                      value={frappeSizeMPrice}
                                      onValueChange={setFrappeSizeMPrice}
                                      containerClassName="w-32"
                                      className="h-8 text-right font-mono text-xs font-bold text-stone-900 bg-white border-stone-200"
                                      suffix="₭"
                                    />
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        ) : (
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-stone-50 border-b border-stone-200 text-[10.5px] font-bold text-stone-600 uppercase tracking-wider">
                                <th className="py-2.5 px-3">ຮູບແບບ (Style)</th>
                                <th className="py-2.5 px-2 text-center">Size S </th>
                                <th className="py-2.5 px-2 text-center">Size M </th>
                                <th className="py-2.5 px-2 text-center">Size L </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 font-medium">
                              {/* 1. HOT ROW */}
                              <tr className={`transition-colors ${hotActive ? "bg-white" : "bg-stone-50/60 opacity-40"}`}>
                                <td className="py-3 px-3">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={hotActive}
                                      onChange={(e) => setHotActive(e.target.checked)}
                                      className="rounded text-stone-800 focus:ring-stone-600 h-4 w-4"
                                    />
                                    <span className="font-bold text-stone-800 text-xs">
                                      ຮ້ອນ (Hot)
                                    </span>
                                  </label>
                                </td>
                                {/* S */}
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-1.5 justify-center">
                                    <input
                                      type="checkbox"
                                      disabled={!hotActive}
                                      checked={hotSizeSActive}
                                      onChange={(e) => setHotSizeSActive(e.target.checked)}
                                      className="rounded text-stone-800 h-3.5 w-3.5 shrink-0"
                                    />
                                    <KipCurrencyInput
                                      disabled={!hotActive || !hotSizeSActive}
                                      value={hotSizeSPrice}
                                      onValueChange={setHotSizeSPrice}
                                      containerClassName="w-22 sm:w-26"
                                      className="h-8 text-right font-mono text-xs font-bold text-stone-900 bg-white border-stone-200"
                                      suffix="₭"
                                    />
                                  </div>
                                </td>
                                {/* M */}
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-1.5 justify-center">
                                    <input
                                      type="checkbox"
                                      disabled={!hotActive}
                                      checked={hotSizeMActive}
                                      onChange={(e) => setHotSizeMActive(e.target.checked)}
                                      className="rounded text-stone-800 h-3.5 w-3.5 shrink-0"
                                    />
                                    <KipCurrencyInput
                                      disabled={!hotActive || !hotSizeMActive}
                                      value={hotSizeMPrice}
                                      onValueChange={setHotSizeMPrice}
                                      containerClassName="w-22 sm:w-26"
                                      className="h-8 text-right font-mono text-xs font-bold text-stone-900 bg-white border-stone-200"
                                      suffix="₭"
                                    />
                                  </div>
                                </td>
                                {/* L */}
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-1.5 justify-center">
                                    <input
                                      type="checkbox"
                                      disabled={!hotActive}
                                      checked={hotSizeLActive}
                                      onChange={(e) => setHotSizeLActive(e.target.checked)}
                                      className="rounded text-stone-800 h-3.5 w-3.5 shrink-0"
                                    />
                                    <KipCurrencyInput
                                      disabled={!hotActive || !hotSizeLActive}
                                      value={hotSizeLPrice}
                                      onValueChange={setHotSizeLPrice}
                                      containerClassName="w-22 sm:w-26"
                                      className="h-8 text-right font-mono text-xs font-bold text-stone-900 bg-white border-stone-200"
                                      suffix="₭"
                                    />
                                  </div>
                                </td>
                              </tr>

                              {/* 2. ICED ROW */}
                              <tr className={`transition-colors ${icedActive ? "bg-white" : "bg-stone-50/60 opacity-40"}`}>
                                <td className="py-3 px-3">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={icedActive}
                                      onChange={(e) => setIcedActive(e.target.checked)}
                                      className="rounded text-stone-800 focus:ring-stone-600 h-4 w-4"
                                    />
                                    <span className="font-bold text-stone-800 text-xs">
                                      ເຢັນ (Iced)
                                    </span>
                                  </label>
                                </td>
                                {/* S */}
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-1.5 justify-center">
                                    <input
                                      type="checkbox"
                                      disabled={!icedActive}
                                      checked={icedSizeSActive}
                                      onChange={(e) => setIcedSizeSActive(e.target.checked)}
                                      className="rounded text-stone-800 h-3.5 w-3.5 shrink-0"
                                    />
                                    <KipCurrencyInput
                                      disabled={!icedActive || !icedSizeSActive}
                                      value={icedSizeSPrice}
                                      onValueChange={setIcedSizeSPrice}
                                      containerClassName="w-22 sm:w-26"
                                      className="h-8 text-right font-mono text-xs font-bold text-stone-900 bg-white border-stone-200"
                                      suffix="₭"
                                    />
                                  </div>
                                </td>
                                {/* M */}
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-1.5 justify-center">
                                    <input
                                      type="checkbox"
                                      disabled={!icedActive}
                                      checked={icedSizeMActive}
                                      onChange={(e) => setIcedSizeMActive(e.target.checked)}
                                      className="rounded text-stone-800 h-3.5 w-3.5 shrink-0"
                                    />
                                    <KipCurrencyInput
                                      disabled={!icedActive || !icedSizeMActive}
                                      value={icedSizeMPrice}
                                      onValueChange={setIcedSizeMPrice}
                                      containerClassName="w-22 sm:w-26"
                                      className="h-8 text-right font-mono text-xs font-bold text-stone-900 bg-white border-stone-200"
                                      suffix="₭"
                                    />
                                  </div>
                                </td>
                                {/* L */}
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-1.5 justify-center">
                                    <input
                                      type="checkbox"
                                      disabled={!icedActive}
                                      checked={icedSizeLActive}
                                      onChange={(e) => setIcedSizeLActive(e.target.checked)}
                                      className="rounded text-stone-800 h-3.5 w-3.5 shrink-0"
                                    />
                                    <KipCurrencyInput
                                      disabled={!icedActive || !icedSizeLActive}
                                      value={icedSizeLPrice}
                                      onValueChange={setIcedSizeLPrice}
                                      containerClassName="w-22 sm:w-26"
                                      className="h-8 text-right font-mono text-xs font-bold text-stone-900 bg-white border-stone-200"
                                      suffix="₭"
                                    />
                                  </div>
                                </td>
                              </tr>

                              {/* 3. FRAPPE ROW */}
                              <tr className={`transition-colors ${frappeActive ? "bg-white" : "bg-stone-50/60 opacity-40"}`}>
                                <td className="py-3 px-3">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={frappeActive}
                                      onChange={(e) => setFrappeActive(e.target.checked)}
                                      className="rounded text-stone-800 focus:ring-stone-600 h-4 w-4"
                                    />
                                    <span className="font-bold text-stone-800 text-xs">
                                      ປັ່ນ (Frappe)
                                    </span>
                                  </label>
                                </td>
                                {/* S */}
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-1.5 justify-center">
                                    <input
                                      type="checkbox"
                                      disabled={!frappeActive}
                                      checked={frappeSizeSActive}
                                      onChange={(e) => setFrappeSizeSActive(e.target.checked)}
                                      className="rounded text-stone-800 h-3.5 w-3.5 shrink-0"
                                    />
                                    <KipCurrencyInput
                                      disabled={!frappeActive || !frappeSizeSActive}
                                      value={frappeSizeSPrice}
                                      onValueChange={setFrappeSizeSPrice}
                                      containerClassName="w-22 sm:w-26"
                                      className="h-8 text-right font-mono text-xs font-bold text-stone-900 bg-white border-stone-200"
                                      suffix="₭"
                                    />
                                  </div>
                                </td>
                                {/* M */}
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-1.5 justify-center">
                                    <input
                                      type="checkbox"
                                      disabled={!frappeActive}
                                      checked={frappeSizeMActive}
                                      onChange={(e) => setFrappeSizeMActive(e.target.checked)}
                                      className="rounded text-stone-800 h-3.5 w-3.5 shrink-0"
                                    />
                                    <KipCurrencyInput
                                      disabled={!frappeActive || !frappeSizeMActive}
                                      value={frappeSizeMPrice}
                                      onValueChange={setFrappeSizeMPrice}
                                      containerClassName="w-22 sm:w-26"
                                      className="h-8 text-right font-mono text-xs font-bold text-stone-900 bg-white border-stone-200"
                                      suffix="₭"
                                    />
                                  </div>
                                </td>
                                {/* L */}
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-1.5 justify-center">
                                    <input
                                      type="checkbox"
                                      disabled={!frappeActive}
                                      checked={frappeSizeLActive}
                                      onChange={(e) => setFrappeSizeLActive(e.target.checked)}
                                      className="rounded text-stone-800 h-3.5 w-3.5 shrink-0"
                                    />
                                    <KipCurrencyInput
                                      disabled={!frappeActive || !frappeSizeLActive}
                                      value={frappeSizeLPrice}
                                      onValueChange={setFrappeSizeLPrice}
                                      containerClassName="w-22 sm:w-26"
                                      className="h-8 text-right font-mono text-xs font-bold text-stone-900 bg-white border-stone-200"
                                      suffix="₭"
                                    />
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                      </div>

                      {isSingleMode ? (
                        <p className="text-[11px] text-stone-400 italic">
                          * ໂໝດ 1 ຂະໜາດ (Single): ສິນຄ້າຈະມີຂະໜາດດຽວມາດຕະຖານ, ຕອນຂາຍເທິງໜ້າ POS ຈະບໍ່ສະແດງປ້າຍ Size ໃຫ້ລົບກວນ.
                        </p>
                      ) : (
                        <p className="text-[11px] text-stone-400 italic">
                          * ຄຳແນະນຳ: ຫາກເມນູນີ້ບໍ່ມີຂະໜາດໃດໜຶ່ງ (ເຊັ່ນ: ບໍ່ມີ Size S ສຳລັບປັ່ນ), ພຽງແຕ່ເອົາເຄື່ອງໝາຍຕິກອອກ.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="pb-1 border-b border-stone-100">
                        <h4 className="text-xs font-black text-stone-800 uppercase tracking-wider">
                          ກຳນົດລາຄາ & ຮູບແບບການຂາຍ (Pricing & Sales Setup)
                        </h4>
                        <p className="text-[11px] text-stone-400">
                          ສິນຄ້າເບເກີຣີ & ອາຫານ ຂາຍລາຄາດຽວຕໍ່ຊິ້ນ (Flat Price), 1-ແຕະ ເພີ່ມໃສ່ກະຕ່າທັນທີ
                        </p>
                      </div>

                      {/* Selling Price Card */}
                      <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-4">
                        <div>
                          <label className="font-bold text-stone-800 block text-xs mb-1.5">
                            ລາຄາຂາຍຕໍ່ຊິ້ນ (Selling Price) <span className="text-rose-500">*</span>:
                          </label>
                          <KipCurrencyInput
                            value={bakeryPrice}
                            onValueChange={setBakeryPrice}
                            placeholder="0"
                            className="h-12 text-lg font-black font-mono text-[#2C1810] bg-white border-stone-200 text-right pr-9 shadow-2xs"
                            suffix="₭"
                            suffixClassName="text-sm font-black text-stone-500 right-3"
                          />
                        </div>

                        {/* Quick Preset Amount Chips */}
                        <div>
                          <span className="text-[10.5px] font-bold text-stone-500 block mb-1.5 uppercase tracking-wider">
                            ເລືອກລາຄາດ່ວນ (Quick Presets):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {[15000, 20000, 25000, 30000, 35000, 40000, 50000].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setBakeryPrice(preset)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                  bakeryPrice === preset
                                    ? "bg-[#2C1810] text-amber-300 shadow-2xs font-black"
                                    : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-100"
                                }`}
                              >
                                {formatLak(preset)}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Feature Badges */}
                        <div className="pt-2 border-t border-stone-200/80 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-stone-200 font-bold text-stone-700">
                            ⚡ 1-ແຕະ ເພີ່ມໃສ່ກະຕ່າທັນທີ
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-stone-200 font-bold text-stone-700">
                            🏷️ ລາຄາຄົງທີ່ (Flat Price)
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-stone-200 font-bold text-stone-700">
                            ✨ ບໍ່ມີປັອບອັບຂະໜາດ
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Action Footer */}
                  <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsItemModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-stone-200 font-bold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer text-xs"
                    >
                      ຍົກເລີກ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingItem}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2C1810] text-amber-300 font-black cursor-pointer shadow-xs active:scale-95 transition-all text-xs hover:bg-[#1A0D08]"
                    >
                      {isSubmittingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      <span>ບັນທຶກສິນຄ້າ</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD / EDIT CATEGORY */}
      {/* ==================================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h3 className="text-base font-black text-[#2C1810]">
                {editingCategory ? "ແກ້ໄຂໝວດໝູ່" : "ເພີ່ມໝວດໝູ່ໃໝ່ (New Category)"}
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              {/* Category Name Lao */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">ຊື່ໝວດໝູ່ (ພາສາລາວ) *:</label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="ເຊັ່ນ: ກາເຟສົດ ຫຼື ເບເກີຣີ"
                  className="w-full h-10 rounded-xl border border-stone-200 px-3 font-bold text-stone-900"
                />
              </div>

              {/* Category Name English */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">ຊື່ພາສາອັງກິດ (English Name):</label>
                <input
                  type="text"
                  value={categoryNameEn}
                  onChange={(e) => setCategoryNameEn(e.target.value)}
                  placeholder="e.g. Specialty Coffee"
                  className="w-full h-10 rounded-xl border border-stone-200 px-3"
                />
              </div>

              {/* Default Category Item Type */}
              <div>
                <label className="font-bold text-stone-700 block mb-1.5">
                  ປະເພດສິນຄ້າຫຼັກໃນໝວດນີ້:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoryItemType("beverage")}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      categoryItemType === "beverage"
                        ? "bg-[#2C1810] text-amber-300 border-[#2C1810]"
                        : "bg-white border-stone-200 text-stone-700"
                    }`}
                  >
                    <Coffee className="h-3.5 w-3.5" />
                    <span>ເຄື່ອງດື່ມ (Beverage)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategoryItemType("bakery")}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      categoryItemType === "bakery"
                        ? "bg-[#2C1810] text-amber-300 border-[#2C1810]"
                        : "bg-white border-stone-200 text-stone-700"
                    }`}
                  >
                    <Cake className="h-3.5 w-3.5" />
                    <span>ເບເກີຣີ / ອາຫານ (Bakery)</span>
                  </button>
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="font-bold text-stone-700 block mb-1.5">
                  ເລືອກໄອຄອນໝວດໝູ່ (Icon):
                </label>
                <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto p-1 border border-stone-100 rounded-2xl bg-stone-50/50">
                  {CATEGORY_ICON_LIST.map((ic) => {
                    const isSelected = categoryIcon === ic.name;
                    const IconComp = ic.Icon;
                    return (
                      <button
                        key={ic.name}
                        type="button"
                        onClick={() => setCategoryIcon(ic.name)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#2C1810] text-amber-300 border-[#2C1810] shadow-2xs"
                            : "bg-white border-stone-200 text-stone-600 hover:bg-stone-100"
                        }`}
                        title={ic.label}
                      >
                        <IconComp className="h-5 w-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">ລຳດັບສະແດງ (Sort Order):</label>
                <input
                  type="number"
                  value={categorySortOrder}
                  onChange={(e) => setCategorySortOrder(Number(e.target.value) || 1)}
                  className="w-full h-10 rounded-xl border border-stone-200 px-3 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 font-bold"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCategory}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C1810] text-amber-300 font-black cursor-pointer shadow-xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>ບັນທຶກ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD / EDIT TOPPING */}
      {/* ==================================================================== */}
      {isToppingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h3 className="text-sm font-black text-[#2C1810]">
                {editingTopping ? "ແກ້ໄຂທ໊ອບປິ້ງ" : "ເພີ່ມທ໊ອບປິ້ງໃໝ່"}
              </h3>
              <button
                type="button"
                onClick={() => setIsToppingModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTopping} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">ຊື່ທ໊ອບປິ້ງ:</label>
                <input
                  type="text"
                  required
                  value={toppingName}
                  onChange={(e) => setToppingName(e.target.value)}
                  placeholder="ເຊັ່ນ: ໄຂ່ມຸກບຣາວຊູກ້າ"
                  className="w-full h-9 rounded-xl border border-stone-200 px-3 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">ລາຄາ (Kip):</label>
                <KipCurrencyInput
                  value={toppingPrice}
                  onValueChange={setToppingPrice}
                  placeholder="0"
                  className="h-9 font-mono font-bold text-stone-900 bg-white border-stone-200 text-right pr-7"
                  suffix="₭"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsToppingModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-stone-200 font-bold"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTopping}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C1810] text-amber-300 font-black cursor-pointer shadow-xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>ບັນທຶກ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
