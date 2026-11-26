"use client";

import { Experimental_CssVarsProvider as CssVarsProvider } from "@mui/material/styles";
import { theme } from "../theme/theme";
import { Provider } from "react-redux";
import { store } from "@/redux/store";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <CssVarsProvider theme={theme} defaultMode="system">
        {children}
      </CssVarsProvider>
    </Provider>
  );
};

export default Providers;
