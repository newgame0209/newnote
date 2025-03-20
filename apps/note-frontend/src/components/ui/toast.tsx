import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/utils/utils"

const ToastProvider = React.createContext<{
  show: (message: string, options?: ToastOptions) => void;
  hide: () => void;
}>({
  show: () => {},
  hide: () => {}
});

export interface ToastOptions {
  duration?: number;
  variant?: "default" | "success" | "info" | "warning" | "error";
}

const toastVariants = cva(
  "fixed z-50 flex items-center p-4 rounded-lg shadow-md transition-all",
  {
    variants: {
      variant: {
        default: "bg-white text-gray-800",
        success: "bg-green-500 text-white",
        info: "bg-blue-500 text-white",
        warning: "bg-amber-500 text-white",
        error: "bg-red-500 text-white",
      },
      position: {
        "top-center": "top-4 left-1/2 transform -translate-x-1/2",
        "top-left": "top-4 left-4",
        "top-right": "top-4 right-4",
        "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
        "bottom-left": "bottom-4 left-4",
        "bottom-right": "bottom-4 right-4",
      },
    },
    defaultVariants: {
      variant: "default",
      position: "top-center",
    },
  }
)

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastContainer({ children }: ToastProviderProps) {
  const [visible, setVisible] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [options, setOptions] = React.useState<ToastOptions>({});
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const show = React.useCallback((message: string, options: ToastOptions = {}) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setMessage(message);
    setOptions(options);
    setVisible(true);

    const duration = options.duration || 3000;
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, duration);
  }, []);

  const hide = React.useCallback(() => {
    setVisible(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <ToastProvider.Provider value={{ show, hide }}>
      {children}
      
      {visible && (
        <div
          className={cn(
            toastVariants({
              variant: options.variant,
              position: "top-center"
            }),
            "animate-in slide-in-from-top-full duration-300"
          )}
        >
          <span className="flex-1">{message}</span>
          <button onClick={hide} className="ml-2 text-sm opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}
    </ToastProvider.Provider>
  );
}

export const useToast = () => React.useContext(ToastProvider);
