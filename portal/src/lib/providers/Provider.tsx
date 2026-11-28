"use client";

import { Experimental_CssVarsProvider as CssVarsProvider } from "@mui/material/styles";
import { MotionConfig } from "framer-motion";
import { theme } from "../theme/theme";
import { Provider } from "react-redux";
import { store } from "@/redux/store";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <CssVarsProvider theme={theme} defaultMode="system">
        {/* Honour the OS "reduce motion" setting for every framer-motion animation */}
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </CssVarsProvider>
    </Provider>
  );
};

export default Providers;
