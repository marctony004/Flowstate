import { Outlet } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import { Toaster } from "sonner";

const Providers = () => {
  return (
    <SessionProvider>
      <Outlet />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className:
            "bg-card text-foreground border-border",
        }}
      />
    </SessionProvider>
  );
};

export default Providers;
