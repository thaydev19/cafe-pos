"use client";

// ============================================================================
// Settings & Staff Management Page (ຕັ້ງຄ່າ & ພະນັກງານ)
// Optimized 100% for Touchscreen (Touch-First UI) & Real Hardware Control
// ESC/POS Thermal Printers, RJ11 Cash Drawers, VAT, BCEL OnePay & Staff PIN
// Zero Emojis - Lucide Icons Exclusively
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  Store,
  Printer,
  Users,
  Shield,
  Save,
  Wifi,
  Bluetooth,
  Usb,
  DollarSign,
  QrCode,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Settings,
  Send,
  Lock,
  X,
  CreditCard,
  Building,
  Phone,
  Receipt,
  FileSpreadsheet,
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  Wrench,
  Loader2,
  HardDrive,
  Cloud,
  Sparkles,
  Clock,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  scanMediaStorage,
  purgeOrphanedMedia,
  MediaAuditSummary,
} from "@/features/products/services/mediaCleanup.service";
import { DiningTableEntity } from "@/types/database.types";
import { DEFAULT_STORE } from "@/features/pos/constants/pos.constants";
import {
  HardwareService,
  PrinterSettings,
  DEFAULT_PRINTER_SETTINGS,
} from "@/features/pos/services/hardware.service";
import { triggerHapticFeedback } from "@/utils/haptics";

interface StaffAccount {
  id: string;
  name: string;
  username: string;
  role: "owner" | "store_manager" | "cashier";
  roleLabelLo: string;
  pin: string;
  isActive: boolean;
}

const DEFAULT_STAFF: StaffAccount[] = [
  {
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01",
    name: "ຜູ້ຈັດການໃຫຍ່ (Admin)",
    username: "admin@laochaleun.la",
    role: "owner",
    roleLabelLo: "ເຈົ້າຂອງຮ້ານ / Admin",
    pin: "123456",
    isActive: true,
  },
  {
    id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33",
    name: "ສົມພອນ (Somphone)",
    username: "manager@laochaleun.la",
    role: "store_manager",
    roleLabelLo: "ຜູ້ຈັດການຮ້ານ (Manager)",
    pin: "123456",
    isActive: true,
  },
  {
    id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22",
    name: "ສຸລິວັນ (Sourivanh)",
    username: "cashier@laochaleun.la",
    role: "cashier",
    roleLabelLo: "ພະນັກງານຂາຍ (Cashier)",
    pin: "123456",
    isActive: true,
  },
];

const PRESET_IPS = ["192.168.1.200", "192.168.0.200", "192.168.1.100"];

export function SettingsPage() {
  // --- Active Tab State ---
  const [activeTab, setActiveTab] = useState<"hardware" | "tables" | "staff" | "storage">("hardware");

  // --- Storage Management State ---
  const [storageAudit, setStorageAudit] = useState<MediaAuditSummary | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [isPurgingStorage, setIsPurgingStorage] = useState(false);

  const handleScanStorage = async () => {
    setIsLoadingStorage(true);
    triggerHapticFeedback(15);
    try {
      const summary = await scanMediaStorage();
      setStorageAudit(summary);
      toast.success(
        `ກວດພົບ ${summary.totalFiles} ໄຟລ໌ (${summary.activeFiles} ກຳລັງໃຊ້ງານ, ${summary.orphanedExpired} ໝົດອາຍຸ > 7 ມື້)`
      );
    } catch (err: any) {
      toast.error(err?.message || "ສະແກນພື້ນທີ່ບໍ່ສຳເລັດ");
    } finally {
      setIsLoadingStorage(false);
    }
  };

  const handlePurgeStorage = async (forceAll: boolean = false) => {
    if (forceAll) {
      const confirm = window.confirm(
        "ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບໄຟລ໌ຮູບພາບທີ່ບໍ່ໄດ້ໃຊ້ທັງໝົດທັນທີ (ຂ້າມໄລຍະ Grace Period 7 ມື້)?"
      );
      if (!confirm) return;
    }

    setIsPurgingStorage(true);
    triggerHapticFeedback(15);
    try {
      const res = await purgeOrphanedMedia(forceAll);
      if (res.purgedCount > 0) {
        toast.success(
          `ລຶບສຳເລັດ ${res.purgedCount} ໄຟລ໌ (ປະຢັດພື້ນທີ່ໄດ້ ${(res.freedBytes / 1024).toFixed(1)} KB)`
        );
      } else {
        toast.info("ບໍ່ມີໄຟລ໌ເກົ່າທີ່ຕ້ອງລຶບ");
      }
      const summary = await scanMediaStorage();
      setStorageAudit(summary);
    } catch (err: any) {
      toast.error(err?.message || "ລຶບໄຟລ໌ບໍ່ສຳເລັດ");
    } finally {
      setIsPurgingStorage(false);
    }
  };

  // --- Table & Zone Management State (Supabase Real Data) ---
  const [diningTables, setDiningTables] = useState<DiningTableEntity[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState<boolean>(false);
  const [selectedTableZone, setSelectedTableZone] = useState<string>("all");
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [editingTable, setEditingTable] = useState<DiningTableEntity | null>(null);
  const [tableCode, setTableCode] = useState("");
  const [tableZone, setTableZone] = useState("ໃນຮ້ານ (Indoor)");
  const [customZoneInput, setCustomZoneInput] = useState("");
  const [tableSeats, setTableSeats] = useState<number>(4);
  const [tableStatus, setTableStatus] = useState<"available" | "maintenance">("available");
  const [isSubmittingTable, setIsSubmittingTable] = useState<boolean>(false);

  const loadTables = async () => {
    setIsLoadingTables(true);
    try {
      const { data, error } = await supabase
        .from("dining_tables")
        .select("*")
        .order("table_code", { ascending: true });
      if (error) throw error;
      setDiningTables(data || []);
    } catch (err: any) {
      console.error("Failed to load tables:", err);
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນໂຕະໄດ້");
    } finally {
      setIsLoadingTables(false);
    }
  };

  useEffect(() => {
    if (activeTab === "tables") {
      loadTables();
    } else if (activeTab === "storage" && !storageAudit) {
      handleScanStorage();
    }
  }, [activeTab]);

  const distinctZones = Array.from(
    new Set(diningTables.map((t) => t.zone).filter(Boolean))
  );
  if (!distinctZones.includes("ໃນຮ້ານ (Indoor)")) distinctZones.unshift("ໃນຮ້ານ (Indoor)");
  if (!distinctZones.includes("ສວນ (Garden)")) distinctZones.push("ສວນ (Garden)");

  const filteredTables =
    selectedTableZone === "all"
      ? diningTables
      : diningTables.filter((t) => t.zone === selectedTableZone);

  const handleOpenAddTable = () => {
    triggerHapticFeedback(15);
    setEditingTable(null);
    setTableCode("");
    setTableZone(selectedTableZone !== "all" ? selectedTableZone : "ໃນຮ້ານ (Indoor)");
    setCustomZoneInput("");
    setTableSeats(4);
    setTableStatus("available");
    setIsTableModalOpen(true);
  };

  const handleOpenEditTable = (table: DiningTableEntity) => {
    triggerHapticFeedback(15);
    setEditingTable(table);
    setTableCode(table.table_code);
    setTableZone(table.zone);
    setCustomZoneInput("");
    setTableSeats(table.seats || 4);
    setTableStatus(table.status === "occupied" ? "available" : (table.status as any));
    setIsTableModalOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableCode.trim()) {
      toast.error("ກະລຸນາປ້ອນລະຫັດໂຕະ (ຕົວຢ່າງ: T01, VIP1)");
      return;
    }

    const finalZone = customZoneInput.trim() ? customZoneInput.trim() : tableZone;
    setIsSubmittingTable(true);
    try {
      if (editingTable) {
        const { error } = await supabase
          .from("dining_tables")
          .update({
            table_code: tableCode.trim().toUpperCase(),
            zone: finalZone,
            seats: Number(tableSeats) || 4,
            status: tableStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingTable.id);
        if (error) throw error;
        toast.success(`ອັບເດດໂຕະ ${tableCode} ສຳເລັດແລ້ວ`);
      } else {
        const { error } = await supabase.from("dining_tables").insert([
          {
            table_code: tableCode.trim().toUpperCase(),
            zone: finalZone,
            seats: Number(tableSeats) || 4,
            status: tableStatus,
          },
        ]);
        if (error) throw error;
        toast.success(`ເພີ່ມໂຕະ ${tableCode} ສຳເລັດແລ້ວ`);
      }
      setIsTableModalOpen(false);
      loadTables();
    } catch (err: any) {
      toast.error(err?.message || "ບັນທຶກໂຕະບໍ່ສຳເລັດ");
    } finally {
      setIsSubmittingTable(false);
    }
  };

  const handleDeleteTable = async (table: DiningTableEntity) => {
    if (table.status === "occupied") {
      toast.error("ໂຕະກຳລັງມີແຂກນັ່ງ ບໍ່ສາມາດລຶບໄດ້! ກະລຸນາເຄລຍໂຕະກ່ອນ.");
      return;
    }
    const confirm = window.confirm(`ທ່ານຕ້ອງການລຶບໂຕະ "${table.table_code}" ແທ້ບໍ່?`);
    if (!confirm) return;

    try {
      const { error } = await supabase.from("dining_tables").delete().eq("id", table.id);
      if (error) throw error;
      toast.success(`ໄດ້ລຶບໂຕະ ${table.table_code} ແລ້ວ`);
      setDiningTables((prev) => prev.filter((t) => t.id !== table.id));
    } catch (err: any) {
      toast.error(err?.message || "ລຶບໂຕະບໍ່ສຳເລັດ");
    }
  };

  const handleFreeTable = async (table: DiningTableEntity) => {
    triggerHapticFeedback(30);
    const confirm = window.confirm(`ທ່ານຕ້ອງການເຄລຍໂຕະ "${table.table_code}" ໃຫ້ເປັນໂຕະຫວ່າງແທ້ບໍ່?`);
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from("dining_tables")
        .update({ status: "available", updated_at: new Date().toISOString() })
        .eq("id", table.id);
      if (error) throw error;
      toast.success(`ເຄລຍໂຕະ ${table.table_code} ເປັນໂຕະຫວ່າງຮຽບຮ້ອຍ`);
      loadTables();
    } catch (err: any) {
      toast.error(err?.message || "ເຄລຍໂຕະບໍ່ສຳເລັດ");
    }
  };

  // --- Hardware state ---
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(DEFAULT_PRINTER_SETTINGS);
  const [testingPrint, setTestingPrint] = useState(false);
  const [testingDrawer, setTestingDrawer] = useState(false);
  const [scanningDevices, setScanningDevices] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<Array<{ name: string; address: string }>>([]);

  // --- Store profile state ---
  const [storeName, setStoreName] = useState(DEFAULT_STORE.name_lo);
  const [storeBranch, setStoreBranch] = useState(DEFAULT_STORE.branch);
  const [storePhone, setStorePhone] = useState(DEFAULT_STORE.phone);

  // --- VAT & Lao QR state ---
  const [vatRate, setVatRate] = useState<number>(7);
  const [qrAccountNo, setQrAccountNo] = useState("010-12-00-01234567-001");
  const [qrAccountName, setQrAccountName] = useState("QUICKONE POS");
  const [qrBankName, setQrBankName] = useState("BCEL OnePay / LAPNet");

  // --- Staff & PIN state ---
  const [staffList, setStaffList] = useState<StaffAccount[]>(DEFAULT_STAFF);
  const [editingStaffPin, setEditingStaffPin] = useState<StaffAccount | null>(null);
  const [newPinValue, setNewPinValue] = useState("");

  // --- Status Toast feedback ---
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Load initial settings
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hw = HardwareService.getSettings();
      setPrinterSettings(hw);

      // Load custom VAT & QR from localStorage if saved
      try {
        const storedVat = localStorage.getItem("pos_vat_rate");
        if (storedVat !== null) setVatRate(Number(storedVat));

        const storedQrAcc = localStorage.getItem("pos_qr_account_no");
        if (storedQrAcc) setQrAccountNo(storedQrAcc);

        const storedQrName = localStorage.getItem("pos_qr_account_name");
        if (storedQrName) setQrAccountName(storedQrName);

        const storedStaff = localStorage.getItem("pos_staff_accounts");
        if (storedStaff) setStaffList(JSON.parse(storedStaff));
      } catch (err) {
        console.warn("Error reading stored settings:", err);
      }
    }
  }, []);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSaveAll = () => {
    triggerHapticFeedback(50);
    HardwareService.saveSettings(printerSettings);

    try {
      localStorage.setItem("pos_vat_rate", String(vatRate));
      localStorage.setItem("pos_qr_account_no", qrAccountNo);
      localStorage.setItem("pos_qr_account_name", qrAccountName);
      localStorage.setItem("pos_staff_accounts", JSON.stringify(staffList));
    } catch {}

    setIsSaved(true);
    showToast("ບັນທຶກການຕັ້ງຄ່າທັງໝົດສຳເລັດຮຽບຮ້ອຍ", "success");
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Test Thermal Receipt Print
  const handleTestPrint = async () => {
    triggerHapticFeedback(50);
    setTestingPrint(true);
    try {
      const res = await HardwareService.testPrint();
      if (res.success) {
        showToast(res.message || "ພິມບິນທົດສອບສຳເລັດ", "success");
      } else {
        showToast(res.message || "ບໍ່ສາມາດພິມບິນທົດສອບໄດ້", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "ເກີດຂໍ້ຜິດພາດໃນການພິມບິນ", "error");
    } finally {
      setTestingPrint(false);
    }
  };

  // Test Open Cash Drawer
  const handleTestCashDrawer = async () => {
    triggerHapticFeedback(60);
    setTestingDrawer(true);
    try {
      const res = await HardwareService.openCashDrawer(printerSettings.drawerPin || 2);
      if (res.success) {
        showToast(res.message || "ສົ່ງສັນຍານໄຂລິ້ນຊັກເງິນສຳເລັດ", "success");
      } else {
        showToast(res.message || "ບໍ່ສາມາດໄຂລິ້ນຊັກເງິນໄດ້", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "ເກີດຂໍ້ຜິດພາດໃນການໄຂລິ້ນຊັກເງິນ", "error");
    } finally {
      setTestingDrawer(false);
    }
  };

  // Scan Bluetooth Devices
  const handleScanDevices = async () => {
    triggerHapticFeedback(40);
    setScanningDevices(true);
    try {
      const devices = await HardwareService.getBondedBluetoothDevices();
      setDiscoveredDevices(devices);
      if (devices.length > 0) {
        showToast(`ພົບອຸປະກອນ ${devices.length} ລາຍການ`, "success");
      } else {
        showToast("ບໍ່ພົບອຸປະກອນ Bluetooth ທີ່ຈັບຄູ່ໄວ້ (ກະລຸນາຈັບຄູ່ໃນ Android Settings)", "error");
      }
    } catch {
      showToast("ບໍ່ສາມາດຄົ້ນຫາອຸປະກອນໄດ້", "error");
    } finally {
      setScanningDevices(false);
    }
  };

  // Handle Staff PIN Change
  const handleSavePin = () => {
    if (!editingStaffPin) return;
    if (newPinValue.length !== 6 || !/^\d{6}$/.test(newPinValue)) {
      showToast("ລະຫັດ PIN ຕ້ອງເປັນຕົວເລກ 6 ຫຼັກເທົ່ານັ້ນ", "error");
      return;
    }

    const updated = staffList.map((s) =>
      s.id === editingStaffPin.id ? { ...s, pin: newPinValue } : s
    );
    setStaffList(updated);
    try {
      localStorage.setItem("pos_staff_accounts", JSON.stringify(updated));
    } catch {}

    showToast(`ປ່ຽນລະຫັດ PIN ຂອງ ${editingStaffPin.name} ສຳເລັດ`, "success");
    setEditingStaffPin(null);
    setNewPinValue("");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 select-none touch-manipulation">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-bold transition-all ${
            toastMessage.type === "success"
              ? "bg-[#2C1810] text-amber-300 border-amber-600/30"
              : "bg-rose-600 text-white border-rose-500"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-amber-400" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2C1810] text-amber-300 shadow-xs">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              ຕັ້ງຄ່າລະບົບ & ພະນັກງານ (Settings & Users)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ກຳນົດຄ່າເຄື່ອງພິມຄວາມຮ້ອນ, ລິ້ນຊັກເງິນ, ອັດຕາອາກອນ (VAT) ແລະ ບັນຊີພະນັກງານ
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className={`min-h-[48px] h-12 px-6 rounded-xl font-bold text-sm text-amber-300 shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
            isSaved ? "bg-[#1A0D08]" : "bg-[#2C1810] hover:bg-[#1A0D08]"
          }`}
        >
          {isSaved ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <Save className="h-5 w-5" />}
          <span>{isSaved ? "ບັນທຶກແລ້ວ" : "ບັນທຶກການຕັ້ງຄ່າ"}</span>
        </button>
      </div>

      {/* 3 Main Settings Tabs */}
      <div className="flex items-center rounded-2xl bg-zinc-100 p-1.5 border border-zinc-200 text-xs font-bold shadow-2xs">
        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback(15);
            setActiveTab("hardware");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === "hardware"
              ? "bg-[#2C1810] text-amber-300 shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Printer className="h-4 w-4" />
          <span>ອຸປະກອນ & ຮ້ານ (Hardware & Store)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback(15);
            setActiveTab("tables");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === "tables"
              ? "bg-[#2C1810] text-amber-300 shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" />
          <span>ຈັດການໂຕະ & ໂຊນ (Table & Zone Management)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback(15);
            setActiveTab("staff");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "staff"
              ? "bg-[#2C1810] text-amber-300 shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>ພະນັກງານ (Staff)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback(15);
            setActiveTab("storage");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "storage"
              ? "bg-[#2C1810] text-amber-300 shadow-xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <HardDrive className="h-4 w-4" />
          <span>ພື້ນທີ່ຮູບພາບ (Storage)</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: HARDWARE & STORE */}
      {/* ==================================================================== */}
      {activeTab === "hardware" && (
        <div className="space-y-6">
          {/* SECTION 1: Hardware Setup (Printers & Cash Drawer) */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                ເຄື່ອງພິມໃບບິນ & ລິ້ນຊັກເງິນ (Thermal Printer & Cash Drawer)
              </h3>
              <p className="text-xs text-slate-500">ຮອງຮັບເຄື່ອງພິມ ESC/POS ຂະໜາດ 80mm / 58mm ແລະ ສາຍ RJ11</p>
            </div>
          </div>
        </div>

        {/* 1.1 Connection Type Selection (3 Large Cards >= 56px) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            ຮູບແບບການເຊື່ອມຕໍ່ (Connection Type)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* LAN / Wi-Fi Card */}
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(30);
                setPrinterSettings({ ...printerSettings, connectionType: "lan" });
              }}
              className={`min-h-[56px] p-3.5 rounded-xl border-2 flex items-center gap-3 text-left transition-all active:scale-95 cursor-pointer ${
                printerSettings.connectionType === "lan"
                  ? "border-[#2C1810] bg-amber-50/70 text-[#2C1810] font-bold shadow-xs"
                  : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/70"
              }`}
            >
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                  printerSettings.connectionType === "lan"
                    ? "bg-[#2C1810] text-amber-300"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                <Wifi className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold leading-tight">LAN / Wi-Fi</p>
                <p className="text-xs text-slate-500">ຜ່ານເຄືອຂ່າຍ IP / Port</p>
              </div>
            </button>

            {/* Bluetooth Card */}
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(30);
                setPrinterSettings({ ...printerSettings, connectionType: "bluetooth" });
              }}
              className={`min-h-[56px] p-3.5 rounded-xl border-2 flex items-center gap-3 text-left transition-all active:scale-95 cursor-pointer ${
                printerSettings.connectionType === "bluetooth"
                  ? "border-[#2C1810] bg-amber-50/70 text-[#2C1810] font-bold shadow-xs"
                  : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/70"
              }`}
            >
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                  printerSettings.connectionType === "bluetooth"
                    ? "bg-[#2C1810] text-amber-300"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                <Bluetooth className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold leading-tight">Bluetooth</p>
                <p className="text-xs text-slate-500">ເຊື່ອມຕໍ່ໄຮ້ສາຍ Bluetooth</p>
              </div>
            </button>

            {/* USB OTG Card */}
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(30);
                setPrinterSettings({ ...printerSettings, connectionType: "usb" });
              }}
              className={`min-h-[56px] p-3.5 rounded-xl border-2 flex items-center gap-3 text-left transition-all active:scale-95 cursor-pointer ${
                printerSettings.connectionType === "usb"
                  ? "border-[#2C1810] bg-amber-50/70 text-[#2C1810] font-bold shadow-xs"
                  : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/70"
              }`}
            >
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                  printerSettings.connectionType === "usb"
                    ? "bg-[#2C1810] text-amber-300"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                <Usb className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold leading-tight">USB OTG</p>
                <p className="text-xs text-slate-500">ສຽບສາຍກົງ USB / OTG</p>
              </div>
            </button>
          </div>
        </div>

        {/* 1.2 Dynamic Parameters based on Connection Type */}
        {printerSettings.connectionType === "lan" && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  ທີ່ຢູ່ IP ເຄື່ອງພິມ (Printer IP Address)
                </label>
                <input
                  type="text"
                  value={printerSettings.lanIp}
                  onChange={(e) => setPrinterSettings({ ...printerSettings, lanIp: e.target.value })}
                  placeholder="192.168.1.200"
                  className="min-h-[48px] h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-mono font-bold text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  ພອດ (Port - ມາດຕະຖານ 9100)
                </label>
                <input
                  type="number"
                  value={printerSettings.lanPort}
                  onChange={(e) =>
                    setPrinterSettings({ ...printerSettings, lanPort: parseInt(e.target.value) || 9100 })
                  }
                  placeholder="9100"
                  className="min-h-[48px] h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-mono font-bold text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                />
              </div>
            </div>

            {/* Quick IP Presets */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1.5">ເລືອກ IP ດ່ວນ:</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_IPS.map((ip) => (
                  <button
                    key={ip}
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(20);
                      setPrinterSettings({ ...printerSettings, lanIp: ip });
                    }}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer ${
                      printerSettings.lanIp === ip
                        ? "bg-[#2C1810] text-amber-300 border-[#2C1810] shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {ip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {(printerSettings.connectionType === "bluetooth" || printerSettings.connectionType === "usb") && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700">
                  {printerSettings.connectionType === "bluetooth"
                    ? "ອຸປະກອນ Bluetooth ທີ່ຈັບຄູ່ແລ້ວ"
                    : "ອຸປະກອນ USB ທີ່ເຊື່ອມຕໍ່"}
                </p>
                <p className="text-xs text-slate-500">ກົດປຸ່ມຄົ້ນຫາເພື່ອອ່ານລາຍຊື່ອຸປະກອນຈາກລະບົບ</p>
              </div>

              <button
                type="button"
                onClick={handleScanDevices}
                disabled={scanningDevices}
                className="min-h-[44px] h-11 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-2 shadow-2xs active:scale-95 cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${scanningDevices ? "animate-spin text-amber-600" : ""}`} />
                <span>{scanningDevices ? "ກຳລັງຄົ້ນຫາ..." : "ຄົ້ນຫາອຸປະກອນ (Scan)"}</span>
              </button>
            </div>

            {discoveredDevices.length > 0 ? (
              <div className="space-y-2">
                {discoveredDevices.map((dev) => {
                  const isSelected = printerSettings.bluetoothMac === dev.address;
                  return (
                    <div
                      key={dev.address}
                      onClick={() => {
                        triggerHapticFeedback(30);
                        setPrinterSettings({
                          ...printerSettings,
                          bluetoothMac: dev.address,
                          bluetoothName: dev.name,
                        });
                      }}
                      className={`min-h-[48px] p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all active:scale-98 ${
                        isSelected
                          ? "border-[#2C1810] bg-amber-50/60"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Bluetooth className={`h-5 w-5 ${isSelected ? "text-amber-700" : "text-slate-400"}`} />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{dev.name || "Bluetooth Printer"}</p>
                          <p className="text-[11px] font-mono text-slate-500">{dev.address}</p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isSelected ? "bg-[#2C1810] text-amber-300 font-black" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isSelected ? "ເຊື່ອມຕໍ່ແລ້ວ (Connected)" : "ເລືອກອຸປະກອນນີ້"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center rounded-lg bg-white border border-dashed border-slate-200 text-xs text-slate-500">
                ຍັງບໍ່ໄດ້ເຊື່ອມຕໍ່ອຸປະກອນ Bluetooth/USB. ກົດ &ldquo;ຄົ້ນຫາອຸປະກອນ (Scan)&rdquo; ເພື່ອກວດສອບ.
              </div>
            )}
          </div>
        )}

        {/* 1.3 Paper Width & Print Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Paper Width Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              ຂະໜາດເຈ້ຍໃບບິນ (Paper Width)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(20);
                  setPrinterSettings({ ...printerSettings, paperWidth: "80mm" });
                }}
                className={`min-h-[48px] h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                  printerSettings.paperWidth === "80mm"
                    ? "border-[#2C1810] bg-amber-50 text-[#2C1810] font-black"
                    : "border-slate-200 bg-slate-50/50 text-slate-700"
                }`}
              >
                <FileSpreadsheet className="h-4 w-4 text-amber-700" />
                <span>80mm (ມາດຕະຖານ)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(20);
                  setPrinterSettings({ ...printerSettings, paperWidth: "58mm" });
                }}
                className={`min-h-[48px] h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                  printerSettings.paperWidth === "58mm"
                    ? "border-[#2C1810] bg-amber-50 text-[#2C1810] font-black"
                    : "border-slate-200 bg-slate-50/50 text-slate-700"
                }`}
              >
                <Receipt className="h-4 w-4 text-amber-700" />
                <span>58mm (ຂະໜາດນ້ອຍ)</span>
              </button>
            </div>
          </div>

          {/* Print Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              ຮູບແບບການພິມໃບບິນ (Print Mode)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["auto", "ask", "manual"] as const).map((mode) => {
                const isSelected = (printerSettings.printMode || "auto") === mode;
                const labels: Record<string, string> = {
                  auto: "ພິມທັນທີ",
                  ask: "ຖາມກ່ອນ",
                  manual: "ດ້ວຍຕົນເອງ",
                };
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(20);
                      setPrinterSettings({ ...printerSettings, printMode: mode });
                    }}
                    className={`min-h-[48px] h-12 rounded-xl border-2 flex items-center justify-center font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? "border-[#2C1810] bg-amber-50 text-[#2C1810] font-black"
                        : "border-slate-200 bg-slate-50/50 text-slate-700"
                    }`}
                  >
                    <span>{labels[mode]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 1.4 Cash Drawer RJ11 Configuration */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">
                ໄຂລິ້ນຊັກເງິນອັດຕະໂນມັດເມື່ອຊຳລະເງິນສົດ (Auto kick on cash)
              </p>
              <p className="text-xs text-slate-500">
                ສົ່ງສັນຍານ xung ESC/POS ຜ່ານສາຍ RJ11 ເມື່ອບັນທຶກຮັບເງິນສົດ
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(30);
                setPrinterSettings({
                  ...printerSettings,
                  autoOpenDrawer: !printerSettings.autoOpenDrawer,
                });
              }}
              className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer ${
                printerSettings.autoOpenDrawer ? "bg-[#2C1810]" : "bg-slate-300"
              }`}
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                  printerSettings.autoOpenDrawer ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-slate-700">ຊ່ອງສັນຍານ RJ11 Pin (Drawer Pin):</label>
              <p className="text-[11px] text-slate-500">ເລືອກ Pin 2 ສຳລັບເຄື່ອງພິມທົ່ວໄປ (0x00) ຫຼື Pin 5 (0x01)</p>
            </div>

            <div className="flex gap-2">
              {[2, 5].map((pin) => (
                <button
                  key={pin}
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(20);
                    setPrinterSettings({ ...printerSettings, drawerPin: pin as 2 | 5 });
                  }}
                  className={`min-h-[40px] px-4 rounded-lg border font-mono font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                    (printerSettings.drawerPin || 2) === pin
                      ? "bg-[#2C1810] text-amber-300 border-[#2C1810]"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Pin {pin}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 1.5 Direct Hardware Testing Buttons (min-h-[48px]) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Test Receipt Print */}
          <button
            type="button"
            onClick={handleTestPrint}
            disabled={testingPrint}
            className="min-h-[48px] h-12 rounded-xl bg-stone-100 hover:bg-stone-200/80 border border-stone-200 text-stone-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            {testingPrint ? (
              <RefreshCw className="h-4 w-4 animate-spin text-amber-700" />
            ) : (
              <Send className="h-4 w-4 text-amber-700" />
            )}
            <span>{testingPrint ? "ກຳລັງສົ່ງຄຳສັ່ງພິມ..." : "ທົດສອບພິມໃບບິນ (Test Print)"}</span>
          </button>

          {/* Test Cash Drawer Kick */}
          <button
            type="button"
            onClick={handleTestCashDrawer}
            disabled={testingDrawer}
            className="min-h-[48px] h-12 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            {testingDrawer ? (
              <RefreshCw className="h-4 w-4 animate-spin text-amber-700" />
            ) : (
              <CreditCard className="h-4 w-4 text-amber-700" />
            )}
            <span>{testingDrawer ? "ກຳລັງສົ່ງສັນຍານ..." : "ທົດສອບເປີດລິ້ນຊັກເງິນ (Test Open Drawer)"}</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: Store Profile, VAT & Lao QR Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Profile Card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">ຂໍ້ມູນຮ້ານຄ້າ (Store Profile)</h3>
              <p className="text-xs text-slate-500">ສະແດງເທິງຫົວໃບບິນຂາຍ ແລະ ລະບົບລາຍງານ</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">ຊື່ຮ້ານ (ພາສາລາວ)</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="min-h-[48px] h-12 w-full rounded-xl border border-slate-300 px-3.5 font-bold text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">ສາຂາ & ທີ່ຕັ້ງ</label>
              <input
                type="text"
                value={storeBranch}
                onChange={(e) => setStoreBranch(e.target.value)}
                className="min-h-[48px] h-12 w-full rounded-xl border border-slate-300 px-3.5 font-medium text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ເບີໂທລະສັບຕິດຕໍ່</label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="min-h-[48px] h-12 w-full rounded-xl border border-slate-300 px-3.5 font-medium text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ສະກຸນເງິນຫຼັກ</label>
                <input
                  type="text"
                  value="ກີບລາວ (LAK ₭)"
                  disabled
                  className="min-h-[48px] h-12 w-full rounded-xl border border-slate-200 px-3.5 bg-slate-50 font-bold text-slate-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* VAT & Lao QR Payment Card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                ອາກອນ VAT & BCEL OnePay / LAPNet
              </h3>
              <p className="text-xs text-slate-500">ອັດຕາອາກອນ ແລະ ບັນຊີຮັບເງິນ QR Code</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* VAT Rate Selectable Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                ອັດຕາອາກອນມູນຄ່າເພີ່ມ (VAT Rate)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { rate: 0, label: "0% (ຍົກເວັ້ນ)" },
                  { rate: 7, label: "7% (ມາດຕະຖານ 2024)" },
                  { rate: 10, label: "10%" },
                ].map((item) => (
                  <button
                    key={item.rate}
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(20);
                      setVatRate(item.rate);
                    }}
                    className={`min-h-[48px] h-12 rounded-xl border-2 font-bold text-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                      vatRate === item.rate
                        ? "border-[#2C1810] bg-amber-50 text-[#2C1810] font-black shadow-2xs"
                        : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* BCEL OnePay / LAPNet Config */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  ເລກບັນຊີ BCEL OnePay / LAPNet
                </label>
                <input
                  type="text"
                  value={qrAccountNo}
                  onChange={(e) => setQrAccountNo(e.target.value)}
                  placeholder="010-12-00-01234567-001"
                  className="min-h-[48px] h-12 w-full rounded-xl border border-slate-300 px-3.5 font-mono font-bold text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  ຊື່ເຈົ້າຂອງບັນຊີ (Account Name)
                </label>
                <input
                  type="text"
                  value={qrAccountName}
                  onChange={(e) => setQrAccountName(e.target.value)}
                  placeholder="QUICKONE POS"
                  className="min-h-[48px] h-12 w-full rounded-xl border border-slate-300 px-3.5 font-bold uppercase text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* ==================================================================== */}
      {/* TAB 2: TABLE & ZONE MANAGEMENT (ຈັດການໂຕະ & ໂຊນ - 100% SUPABASE) */}
      {/* ==================================================================== */}
      {activeTab === "tables" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Table Management Header & Zone Chips */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    ຜັງໂຕະ & ໂຊນທີ່ນັ່ງ (Dining Tables & Zones)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ຈັດການໂຕະ, ໂຊນ, ຈຳນວນບ່ອນນັ່ງ ແລະ ເຄລຍໂຕະຫວ່າງ (Supabase Real Data)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadTables}
                  disabled={isLoadingTables}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                  title="ໂຫຼດຂໍ້ມູນໃໝ່"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingTables ? "animate-spin text-amber-700" : ""}`} />
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddTable}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C1810] text-amber-300 font-bold text-xs hover:bg-stone-900 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ ເພີ່ມໂຕະໃໝ່</span>
                </button>
              </div>
            </div>

            {/* Zone Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedTableZone("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedTableZone === "all"
                    ? "bg-[#2C1810] text-amber-300 shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                ທຸກໂຊນ ({diningTables.length})
              </button>
              {distinctZones.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setSelectedTableZone(z)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTableZone === z
                      ? "bg-[#2C1810] text-amber-300 shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {z} ({diningTables.filter((t) => t.zone === z).length})
                </button>
              ))}
            </div>
          </div>

          {/* Table Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {filteredTables.map((table) => {
              const isOccupied = table.status === "occupied";
              const isMaintenance = table.status === "maintenance";

              return (
                <div
                  key={table.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between bg-white shadow-2xs ${
                    isOccupied
                      ? "border-amber-300 bg-amber-50/40"
                      : isMaintenance
                      ? "border-slate-300 bg-slate-100/70 opacity-75"
                      : "border-slate-200 hover:border-amber-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <div className="font-black text-lg font-mono text-[#2C1810]">
                        {table.table_code}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        {table.zone}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isOccupied
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : isMaintenance
                          ? "bg-slate-200 text-slate-700 border-slate-300"
                          : "bg-emerald-100 text-emerald-800 border-emerald-300"
                      }`}
                    >
                      {isOccupied ? "ມີແຂກ" : isMaintenance ? "ປັບປຸງ" : "ວ່າງ"}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 font-bold text-slate-600">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>{table.seats || 4} ບ່ອນນັ່ງ</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isOccupied && (
                        <button
                          type="button"
                          onClick={() => handleFreeTable(table)}
                          className="h-7 px-2 flex items-center gap-1 rounded-lg bg-orange-600 text-white hover:bg-orange-700 active:scale-90 transition-all cursor-pointer text-[10px] font-bold shadow-2xs"
                          title="ເຄລຍໂຕະຫວ່າງ (Free Table)"
                        >
                          <LogOut className="h-3 w-3" />
                          <span>ເຄລຍຫວ່າງ</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenEditTable(table)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-90 transition-all cursor-pointer"
                        title="ແກ້ໄຂໂຕະ"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTable(table)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-90 transition-all cursor-pointer"
                        title="ລຶບໂຕະ"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: STAFF MANAGEMENT & TOUCH PIN OVERRIDE */}
      {/* ==================================================================== */}
      {activeTab === "staff" && (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  ຈັດການພະນັກງານ & ລະຫັດ PIN (Staff & Manager PIN)
                </h3>
                <p className="text-xs text-slate-500">
                  ກຳນົດລະຫັດ PIN 6 ຫຼັກ ສຳລັບການຢືນຢັນສິດທິຜູ້ຈັດການ (Manager Override) ຢູ່ໜ້າຂາຍ
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                    <Shield className="h-5 w-5 text-amber-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{staff.name}</p>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          staff.role === "owner"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : staff.role === "store_manager"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-amber-100 text-amber-900 border border-amber-200"
                        }`}
                      >
                        {staff.roleLabelLo}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{staff.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <div className="font-mono text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold">
                    PIN: ••••••
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(30);
                      setEditingStaffPin(staff);
                      setNewPinValue("");
                    }}
                    className="min-h-[44px] h-11 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <KeyRound className="h-4 w-4 text-amber-700" />
                    <span>ປ່ຽນ PIN (Touch)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: STORAGE & MEDIA OPTIMIZATION (Supabase Storage menu-items) */}
      {/* ==================================================================== */}
      {activeTab === "storage" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* 1. Header Card */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-[#2C1810] flex items-center justify-center text-amber-300 shadow-2xs">
                  <HardDrive className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    ຈັດການພື້ນທີ່ຮູບພາບ & ສື່ (Supabase Storage Management)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bucket: <span className="font-mono font-bold text-amber-800">menu-items</span> • ລະບົບປ້ອງກັນ Grace Period 7 ມື້ & ອະນາໄມໄຟລ໌ເກົ່າອັດຕະໂນມັດ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isLoadingStorage || isPurgingStorage}
                  onClick={handleScanStorage}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingStorage ? "animate-spin text-amber-700" : ""}`} />
                  <span>ສະແກນພື້ນທີ່ (Scan Storage)</span>
                </button>
              </div>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {/* Card 1: Total Files */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  ໄຟລ໌ທັງໝົດໃນ Cloud
                </span>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {storageAudit ? storageAudit.totalFiles : "—"}
                  <span className="text-xs font-normal text-slate-400 ml-1">ໄຟລ໌</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Bucket: menu-items
                </span>
              </div>

              {/* Card 2: Active Files in Menu */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 block mb-1">
                  ✓ ກຳລັງໃຊ້ງານໃນເມນູ
                </span>
                <div className="text-2xl font-black text-emerald-900 font-mono">
                  {storageAudit ? storageAudit.activeFiles : "—"}
                  <span className="text-xs font-normal text-emerald-700 ml-1">ໄຟລ໌</span>
                </div>
                <span className="text-[10px] text-emerald-700 mt-0.5 block">
                  ຜູກຕິດກັບສິນຄ້າໃນຖານຂໍ້ມູນ
                </span>
              </div>

              {/* Card 3: Grace Period (< 7 days) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                <span className="text-[11px] font-bold text-amber-900 block mb-1">
                  ⏳ ໄລຍະປ້ອງກັນ Grace (&lt; 7 ມື້)
                </span>
                <div className="text-2xl font-black text-amber-950 font-mono">
                  {storageAudit ? storageAudit.orphanedGracePeriod : "—"}
                  <span className="text-xs font-normal text-amber-800 ml-1">ໄຟລ໌</span>
                </div>
                <span className="text-[10px] text-amber-800 mt-0.5 block">
                  ເກັບໄວ້ສຳຮອງປ້ອງກັນປ່ຽນໃຈ
                </span>
              </div>

              {/* Card 4: Expired Orphaned (>= 7 days) */}
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
                <span className="text-[11px] font-bold text-rose-800 block mb-1">
                  🗑️ ໄຟລ໌ເກົ່າໝົດອາຍຸ (≥ 7 ມື້)
                </span>
                <div className="text-2xl font-black text-rose-900 font-mono">
                  {storageAudit ? storageAudit.orphanedExpired : "—"}
                  <span className="text-xs font-normal text-rose-700 ml-1">ໄຟລ໌</span>
                </div>
                <span className="text-[10px] text-rose-700 mt-0.5 block">
                  ພ້ອມລຶບອັດຕະໂນມັດ
                </span>
              </div>
            </div>
          </div>

          {/* 2. Best Practice Explanation & Actions */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span>ຫຼັກການເຮັດວຽກທີ່ດີທີ່ສຸດ (Best Practice Architecture)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                <p className="font-black text-slate-900 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>1. Grace Period 7 ມື້</span>
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ເມື່ອມີການປ່ຽນຮູບໃໝ່ ຫຼື ລຶບສິນຄ້າ, ຮູບເກົ່າຈະຍັງບໍ່ຖືກລຶບທັນທີ ແຕ່ຈະຖືກເກັບໄວ້ 7 ມື້ ເພື່ອໃຫ້ທ່ານສາມາດຍົກເລີກ ຫຼື ປ່ຽນຄືນໄດ້.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                <p className="font-black text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>2. ບີບອັດ WebP &lt; 120KB</span>
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ຮູບຖ່າຍຈາກມືຖື 10MB-30MB ຈະຖືກ Canvas ຫຍໍ້ຂະໜາດ 1000px ເຫຼືອພຽງ ~80-120KB. 1GB Free ຂອງ Supabase ເກັບໄດ້ກວ່າ 10,000 ຮູບ.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                <p className="font-black text-slate-900 flex items-center gap-1.5">
                  <Cloud className="h-4 w-4 text-blue-600" />
                  <span>3. Auto-Cleanup ເບື້ອງຫຼັງ</span>
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ທຸກຄັ້ງທີ່ເປີດໜ້າຈັດການສິນຄ້າ, ລະບົບຈະກວດສອບ ແລະ ລຶບໄຟລ໌ທີ່ເກີນ 7 ມື້ໂດຍອັດຕະໂນມັດ ໂດຍບໍ່ກະທົບຕໍ່ຄວາມໄວຂອງແອັບ.
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {storageAudit && storageAudit.orphanedExpired > 0 ? (
                  <span className="font-bold text-amber-800">
                    💡 ພົບເຫັນ {storageAudit.orphanedExpired} ໄຟລ໌ໝົດອາຍຸ (ປະຢັດໄດ້ ~{(storageAudit.orphanedTotalBytes / 1024).toFixed(0)} KB) ທີ່ສາມາດອະນາໄມໄດ້.
                  </span>
                ) : (
                  <span className="font-bold text-emerald-700">
                    ✓ ລະບົບພື້ນທີ່ຈັດເກັບຮູບພາບສະອາດ ແລະ ປອດໄພດີ.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Purge Expired Only (Recommended) */}
                <button
                  type="button"
                  disabled={isPurgingStorage || isLoadingStorage || !storageAudit || storageAudit.orphanedExpired === 0}
                  onClick={() => handlePurgeStorage(false)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2C1810] text-amber-300 font-bold text-xs hover:bg-[#1A0D08] active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPurgingStorage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  <span>ລຶບໄຟລ໌ໝົດອາຍຸ &gt; 7 ມື້ (Purge Expired)</span>
                </button>

                {/* Force Purge All Unused */}
                <button
                  type="button"
                  disabled={isPurgingStorage || isLoadingStorage || !storageAudit || (storageAudit.orphanedGracePeriod === 0 && storageAudit.orphanedExpired === 0)}
                  onClick={() => handlePurgeStorage(true)}
                  className="flex items-center justify-center gap-1 px-3.5 py-2.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="ລຶບໄຟລ໌ຮູບພາບທີ່ບໍ່ໄດ້ໃຊ້ທັງໝົດທັນທີ (ຂ້າມ Grace Period)"
                >
                  <span>ລຶບໄຟລ໌ທີ່ບໍ່ໄດ້ໃຊ້ທັງໝົດທັນທີ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Touch PIN Editor with Large On-Screen Numpad */}
      {editingStaffPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-700" />
                <h3 className="text-base font-black text-slate-900">
                  ປ່ຽນລະຫັດ PIN: {editingStaffPin.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaffPin(null)}
                className="h-9 w-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 text-center">
              ກະລຸນາປ້ອນລະຫັດ PIN ໃໝ່ 6 ຕົວເລກ ສຳລັບ {editingStaffPin.roleLabelLo}
            </p>

            {/* PIN Display Dots */}
            <div className="flex justify-center gap-2.5 py-2">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const filled = index < newPinValue.length;
                return (
                  <div
                    key={index}
                    className={`h-4 w-4 rounded-full border-2 transition-all ${
                      filled
                        ? "border-[#2C1810] bg-[#2C1810] scale-110 shadow-xs"
                        : "border-slate-300 bg-slate-100"
                    }`}
                  />
                );
              })}
            </div>

            {/* Large On-Screen Numeric Keypad (48x48px - 56x56px touch targets) */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(20);
                    if (newPinValue.length < 6) {
                      setNewPinValue((prev) => prev + String(digit));
                    }
                  }}
                  className="min-h-[52px] h-13 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xl flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xs"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(20);
                  setNewPinValue("");
                }}
                className="min-h-[52px] h-13 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xs"
              >
                ລຶບໝົດ
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(20);
                  if (newPinValue.length < 6) {
                    setNewPinValue((prev) => prev + "0");
                  }
                }}
                className="min-h-[52px] h-13 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xl flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xs"
              >
                0
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(20);
                  setNewPinValue((prev) => prev.slice(0, -1));
                }}
                className="min-h-[52px] h-13 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xs"
              >
                ລຶບ
              </button>
            </div>

            {/* Confirm & Cancel buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingStaffPin(null)}
                className="min-h-[48px] h-12 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 active:scale-95 cursor-pointer"
              >
                ຍົກເລີກ
              </button>

              <button
                type="button"
                onClick={handleSavePin}
                disabled={newPinValue.length !== 6}
                className={`min-h-[48px] h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                  newPinValue.length === 6
                    ? "bg-[#2C1810] hover:bg-[#1A0D08] text-amber-300 shadow-xs"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>ຢືນຢັນ PIN</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Dining Table */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-amber-700" />
                <h3 className="text-base font-black text-slate-900">
                  {editingTable ? `ແກ້ໄຂໂຕະ ${editingTable.table_code}` : "ເພີ່ມໂຕະໃໝ່"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTableModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ລະຫັດໂຕະ (Table Code) *:</label>
                <input
                  type="text"
                  required
                  value={tableCode}
                  onChange={(e) => setTableCode(e.target.value)}
                  placeholder="ເຊັ່ນ: T16, VIP2, G05"
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 font-mono font-bold text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ໂຊນທີ່ຕັ້ງ (Zone):</label>
                <select
                  value={tableZone}
                  onChange={(e) => setTableZone(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 font-bold text-slate-800 bg-white"
                >
                  <option value="ໃນຮ້ານ (Indoor)">ໃນຮ້ານ (Indoor)</option>
                  <option value="ສວນ (Garden)">ສວນ (Garden)</option>
                  <option value="ຊັ້ນ 2 (2nd Floor)">ຊັ້ນ 2 (2nd Floor)</option>
                  <option value="ລະບຽງ (Balcony)">ລະບຽງ (Balcony)</option>
                  <option value="custom">+ ປ້ອນຊື່ໂຊນໃໝ່...</option>
                </select>
                {tableZone === "custom" && (
                  <input
                    type="text"
                    required
                    value={customZoneInput}
                    onChange={(e) => setCustomZoneInput(e.target.value)}
                    placeholder="ປ້ອນຊື່ໂຊນໃໝ່..."
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 font-bold text-slate-900 mt-2"
                  />
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ຈຳນວນບ່ອນນັ່ງ (Seats):</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={tableSeats}
                  onChange={(e) => setTableSeats(Number(e.target.value) || 2)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 font-mono font-bold text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ສະຖານະເລີ່ມຕົ້ນ:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTableStatus("available")}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                      tableStatus === "available"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-black"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>ພ້ອມຮັບແຂກ (Available)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableStatus("maintenance")}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                      tableStatus === "maintenance"
                        ? "bg-amber-50 text-amber-900 border-amber-300 font-black"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    <Wrench className="h-4 w-4" />
                    <span>ປິດປັບປຸງ</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTable}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2C1810] text-amber-300 font-black text-xs hover:bg-stone-900 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingTable ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>{editingTable ? "ບັນທຶກການແກ້ໄຂ" : "ບັນທຶກໂຕະໃໝ່"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
