import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import "./index.css";
import TaskpaneApp from "./components/taskpane-app";

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    const root = createRoot(document.getElementById("root")!);
    root.render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <TaskpaneApp />
          <Toaster />
        </QueryClientProvider>
      </StrictMode>
    );
  }
});
