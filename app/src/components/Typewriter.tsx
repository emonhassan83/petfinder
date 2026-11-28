import React, { useEffect, useState } from "react";
import { Text as RNText, TextStyle, StyleProp } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { Text } from "./Text";
import { colors } from "../theme";

//* Types `text` out character by character behind a blinking caret.
//* The untyped remainder is rendered transparent so line breaks never jump; screen readers get the full text.
//* Nested spans use RN's Text so they inherit the parent's font instead of resetting it.
export const Typewriter = ({ text, style, speed = 45, delay = 300, caretColor = colors.primary }: { text: string; style?: StyleProp<TextStyle>; speed?: number; delay?: number; caretColor?: string }) => {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? text.length : 0);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    if (reduce) {
      setN(text.length);
      return;
    }
    setN(0);
    let i = 0;
    let tick: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      tick = setInterval(() => {
        i += 1;
        setN(i);
        if (i >= text.length && tick) clearInterval(tick);
      }, speed);
    }, delay);
    return () => {
      clearTimeout(start);
      if (tick) clearInterval(tick);
    };
  }, [text, speed, delay, reduce]);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setBlink((b) => !b), 530);
    return () => clearInterval(t);
  }, [reduce]);

  return (
    <Text style={style} accessibilityLabel={text}>
      {text.slice(0, n)}
      {!reduce && <RNText style={{ color: blink ? caretColor : "transparent" }}>|</RNText>}
      <RNText style={{ color: "transparent" }}>{text.slice(n)}</RNText>
    </Text>
  );
};
