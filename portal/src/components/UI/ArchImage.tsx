import { Box, SxProps, Theme } from "@mui/material";
import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  //* CSS aspect ratio, e.g. "4 / 5"
  ratio?: string;
  priority?: boolean;
  sizes?: string;
  //* Image slowly zooms in when it first appears
  reveal?: boolean;
  sx?: SxProps<Theme>;
};

//* Photo with an arched (rounded-top) mask, the hero/editorial image shape.
const ArchImage = ({ src, alt, ratio = "4 / 5", priority, sizes = "(max-width: 900px) 100vw, 50vw", reveal = true, sx }: Props) => (
  <Box
    sx={{
      position: "relative",
      aspectRatio: ratio,
      width: "100%",
      overflow: "hidden",
      borderRadius: "999px 999px var(--pf-radius-card) var(--pf-radius-card)",
      bgcolor: "var(--pf-sand)",
      ...sx,
    }}
  >
    <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={reveal ? "pf-arch-reveal" : undefined} style={{ objectFit: "cover" }} />
  </Box>
);

export default ArchImage;
