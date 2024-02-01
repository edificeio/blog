import { StrictMode } from "react";

import { OdeClientProvider, ThemeProvider } from "@edifice-ui/react";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ERROR_CODE } from "edifice-ts-client";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "./i18n";
import { router } from "./routes";
import "./index.css";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement!);

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (typeof error === "string") {
        if (error === ERROR_CODE.NOT_LOGGED_IN)
          window.location.replace("/auth/login");
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <OdeClientProvider
        params={{
          app: "blog",
        }}
      >
        <ThemeProvider>
          <RouterProvider router={router(queryClient)} />
        </ThemeProvider>
      </OdeClientProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
