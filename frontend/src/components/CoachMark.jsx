import { useEffect, useRef } from "react";

export default function CoachMark({
    anchorRef,
    visible,
    onClose,
    storageKey,
    timeout = 20000,
    children,
}) {
    const guideRef = useRef(null);

    // Auto hide
    useEffect(() => {
        if (!visible) return;

        const timer = setTimeout(() => {
            onClose();
            localStorage.setItem(storageKey, "true");
        }, timeout);

        return () => clearTimeout(timer);
    }, [visible]);

    // Click outside
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
                 w-[90vw] max-w-[320px]
                 animate-fade-in"
            style={{
                top: isMobile
                    ? rect.bottom + 12
                    : rect.bottom + 8 + window.scrollY,
                left: isMobile
                    ? "50%"
                    : rect.left,
                transform: isMobile ? "translateX(-50%)" : "none",
            }}
        >
            <div
                className="absolute -top-2 left-6 w-4 h-4 bg-white
                 border-l border-t rotate-45"
            />
            {children}
        </div>
    );
}