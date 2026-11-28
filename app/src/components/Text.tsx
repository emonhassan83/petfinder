import React from "react";
import { StyleSheet, Text as RNText, TextInput as RNTextInput, TextInputProps, TextProps, TextStyle } from "react-native";
import { fonts } from "../theme";

//* Maps fontWeight to a Manrope family (custom fonts need one family per weight on Android).
//* An explicit fontFamily in the style (e.g. fonts.heading) wins.
const withFont = (style: TextProps["style"]) => {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  if (flat.fontFamily) return flat;
  const w = String(flat.fontWeight ?? "400");
  const family =
    w === "800" || w === "900" ? fonts.extrabold : w === "700" || w === "bold" ? fonts.bold : w === "600" ? fonts.semibold : w === "500" ? fonts.medium : fonts.body;
  return { ...flat, fontFamily: family, fontWeight: undefined } as TextStyle;
};

export const Text = ({ style, ...rest }: TextProps) => <RNText {...rest} style={withFont(style)} />;
export const TextInput = ({ style, ...rest }: TextInputProps) => <RNTextInput {...rest} style={withFont(style)} />;
