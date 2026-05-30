/**
 * ToastProvider — RN port of src/components/ToastProvider.tsx.
 * Top-anchored stack, spring in/out, max 3, auto-dismiss after 2s,
 * colored status dot per variant.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";
import { View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../theme/ThemeProvider";
import { AppText } from "./ui/Typography";

type ToastVariant = "default" | "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "default") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => {
        const next = [...prev, { id, message, variant }];
        return next.length > 3 ? next.slice(-3) : next;
      });
      setTimeout(() => removeToast(id), 2000);
    },
    [removeToast],
  );

  const dotColor = (v: ToastVariant) =>
    v === "success"
      ? colors.semanticGreen
      : v === "error"
        ? colors.semanticRed
        : v === "info"
          ? colors.primaryOnDark
          : "rgba(255,255,255,0.5)";

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: insets.top + 12,
          left: 0,
          right: 0,
          alignItems: "center",
          gap: 8,
        }}
      >
        {toasts.map((toast) => (
          <Animated.View
            key={toast.id}
            entering={FadeInUp.springify().damping(25).stiffness(350)}
            exiting={FadeOutUp.duration(200)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: colors.ink === "#1d1d1f" ? "#1d1d1f" : "#2a2a2c",
              paddingLeft: 14,
              paddingRight: 20,
              paddingVertical: 12,
              borderRadius: 9999,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 9999,
                backgroundColor: dotColor(toast.variant),
              }}
            />
            <AppText
              variant="caption-strong"
              style={{ color: "#ffffff" }}
            >
              {toast.message}
            </AppText>
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  );
};
