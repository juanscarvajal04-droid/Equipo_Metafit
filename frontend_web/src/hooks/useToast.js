import { useState, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState({ msg: "", type: "success" });

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    const timer = setTimeout(() => {
      setToast({ msg: "", type: "success" });
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return { toast, showToast };
}
