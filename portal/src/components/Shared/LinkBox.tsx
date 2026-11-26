"use client";

import { Box, BoxProps } from "@mui/material";
import Link from "next/link";

//* MUI Box rendered as a Next link; lets server components use linked boxes
const LinkBox = ({ href, ...rest }: BoxProps & { href: string }) => <Box component={Link} href={href} {...rest} />;

export default LinkBox;
