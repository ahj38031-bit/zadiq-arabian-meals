import { Toaster } from "sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Home from "./Home";

// Browser-only: reads localStorage during first render.
export default function ZadkApp() {
  return (
    <ThemeProvider defaultTheme="light" switchable>
      <Toaster position="bottom-center" richColors closeButton duration={3600} visibleToasts={4} />
      <Home />
    </ThemeProvider>
  );
}
