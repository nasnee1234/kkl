import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MenuCard from "../components/MenuCard";
import { motion } from "framer-motion";

const ITEMS_PER_PAGE = 4;

export default function FoodMenu() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchMenu() {
      setLoading(true);
      const items = await base44.entities.MenuItem.list();
      setMenuItems(items);
      setLoading(false);
    }
    fetchMenu();
  }, []);

  const filtered = menuItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="px-5 pt-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-foreground">เมนูอาหาร</h1>
        <p className="text-muted-foreground text-sm mt-1">
          เลือกชมเมนูไก่กอและสุดอร่อย
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative mb-6"
      >
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ค้นหาเมนู..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-card border-border/60 rounded-xl h-11 text-sm"
        />
      </motion.div>

      {/* Menu Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : paged.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">ไม่พบเมนูที่ค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {paged.map((item, i) => (
            <MenuCard key={item.id} item={item} index={i} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 mb-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className="w-9 h-9 rounded-full text-sm"
            >
              {page}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}