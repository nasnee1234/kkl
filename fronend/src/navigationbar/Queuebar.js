import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";

export default function QueueRequest() {
  const navigate = useNavigate();
  const [pressed, setPressed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTakeQueue = () => {
    setPressed(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    // Get current max queue number
    const bookings = await base44.entities.QueueBooking.list("-queue_number", 1);
    const nextNumber = bookings.length > 0 ? bookings[0].queue_number + 1 : 1;

    let customerName = "";
    try {
      const user = await base44.auth.me();
      customerName = user.full_name || "";
    } catch {}

    const booking = await base44.entities.QueueBooking.create({
      queue_number: nextNumber,
      status: "waiting",
      customer_name: customerName,
    });

    navigate(`/queue/success?number=${nextNumber}&id=${booking.id}`);
  };

  return (
    <div className="px-5 pt-6 flex flex-col items-center min-h-[calc(100vh-5rem)]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 w-full"
      >
        <h1 className="text-2xl font-bold text-foreground">รับคิว</h1>
        <p className="text-muted-foreground text-sm mt-1">
          กดปุ่มด้านล่างเพื่อรับคิวของคุณ
        </p>
      </motion.div>

      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Big Queue Button */}
        <motion.button
          onClick={handleTakeQueue}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.03 }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className={`w-44 h-44 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-300 ${
            pressed
              ? "bg-primary/80 shadow-primary/20"
              : "bg-primary shadow-primary/30 hover:shadow-primary/40 hover:shadow-xl"
          }`}
        >
          <Clock className="h-10 w-10 text-primary-foreground mb-2" />
          <span className="text-primary-foreground text-xl font-bold">
            รับคิว
          </span>
        </motion.button>

        {/* Confirm Button */}
        <AnimatePresence>
          {pressed && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="mt-10 w-full max-w-xs"
            >
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground text-lg font-semibold shadow-lg shadow-accent/20"
              >
                {loading ? (
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "ยืนยันคิวของคุณ"
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}