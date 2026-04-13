import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  User,
  Phone,
  Edit3,
  CalendarCheck,
  Tag,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const me = await base44.auth.me();
      setUser(me);
      setPhone(me.phone || "");
      setLoading(false);
    }
    loadUser();
  }, []);

  const handleSavePhone = async () => {
    setSaving(true);
    await base44.auth.updateMe({ phone });
    setUser((prev) => ({ ...prev, phone }));
    setSaving(false);
    setEditOpen(false);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const menuItems = [
    {
      icon: CalendarCheck,
      label: "รายการการจอง",
      to: "/bookings",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      icon: Tag,
      label: "โปรโมชั่น / คูปอง",
      to: "/promotions",
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="px-5 pt-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-foreground">โปรไฟล์</h1>
      </motion.div>

      {/* User Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border/50 p-5 mb-6 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg text-foreground truncate">
              {user?.full_name || "ผู้ใช้งาน"}
            </h2>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-0.5">
              <Phone className="h-3.5 w-3.5" />
              <span>{user?.phone || "ยังไม่ได้ระบุเบอร์โทร"}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl h-10 w-10 shrink-0"
            onClick={() => setEditOpen(true)}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Menu Items */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm mb-6"
      >
        {menuItems.map((item, i) => (
          <Link
            key={item.label}
            to={item.to}
            className={`flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors ${
              i < menuItems.length - 1 ? "border-b border-border/40" : ""
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}
            >
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <span className="flex-1 font-medium text-sm text-foreground">
              {item.label}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full h-12 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive font-medium"
        >
          <LogOut className="h-4 w-4 mr-2" />
          ออกจากระบบ
        </Button>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขโปรไฟล์</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                เบอร์โทรศัพท์
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0xx-xxx-xxxx"
                className="rounded-xl h-11"
              />
            </div>
            <Button
              onClick={handleSavePhone}
              disabled={saving}
              className="w-full h-11 rounded-xl"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}