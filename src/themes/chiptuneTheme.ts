import { RaThemeOptions } from "react-admin";

/** Just for fun */

export const chiptuneTheme: RaThemeOptions = {
  palette: {
    mode: "dark" as const,
    primary: {
      main: "#0f0",
    },
    background: {
      default: "#111111",
      paper: "#212121",
    },
  },
  typography: {
    fontFamily: `'Pixelify Sans', cursive`,
  },
  components: {
    MuiAutocomplete: { defaultProps: { fullWidth: true } },
    MuiFormControl: { defaultProps: { fullWidth: true } },
    MuiTextField: { defaultProps: { fullWidth: true } },
    RaSimpleFormIterator: { defaultProps: { fullWidth: true } },
  },
};
