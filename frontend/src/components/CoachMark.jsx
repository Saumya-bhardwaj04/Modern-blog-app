import { useEffect, useRef } from "react";

export default function CoachMark({
  anchorRef,
  visible,
  onClose,
  storageKey,
  timeout = 12000,
  children,
}) {
  const guideRef = useRef(null);

  // 🔹 Auto hide (timeout)
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      onClose();
      localStorage.setItem(storageKey, "true");
    }, timeout);

    return () => clearTimeout(timer);
  }, [visible]);

  // 🔹 Hide on scroll (NEW — FIX)
  useEffect(() => {
    if (!visible) return;

    const handleScroll = () => {
      onClose();
      localStorage.setItem(storageKey, "true");
    };

    window.addEventListener("scroll", handleScroll, { once: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [visible]);

  // 🔹 Click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        guideRef.current &&
        !guideRef.current.contains(e.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
        localStorage.setItem(storageKey, "true");
      }
    }

    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible]);

  if (!visible || !anchorRef.current) return null;

  const rect = anchorRef.current.getBoundingClientRect();
  const isMobile = window.innerWidth < 640;

  return (
    <div
      ref={guideRef}
      className="fixed z-50 bg-white border shadow-xl rounded-xl p-4
                 w-[90vw] max-w-[320px] animate-fade-in"
      style={{
        top: rect.bottom + 12,
        left: isMobile ? "50%" : rect.left,
        transform: isMobile ? "translateX(-50%)" : "none",
      }}
    >
      {/* Arrow */}
      <div
        className="absolute -top-2 left-6 w-4 h-4 bg-white
                   border-l border-t rotate-45"
      />
      {children}
    </div>
  );
}