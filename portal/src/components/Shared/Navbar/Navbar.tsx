"use client";

import {
  Box,
  Container,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Divider } from "@mui/material";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "@/components/UI/ThemeToggle";
import Logo from "../Logo";

interface NavbarProps {
  accessToken?: string;
  window?: () => Window;
}

const AuthButton = dynamic(() => import("@/components/UI/AuthButton/AuthButton"), { ssr: false });

const navItems = [
  { label: "Home", href: "/" },
  { label: "Find a pet", href: "/pets" },
  { label: "Shelters & Rescues", href: "/shelters" },
  { label: "Resources", href: "/blogs" },
  { label: "Donate", href: "/donate" },
  { label: "About", href: "/about-us" },
];

export default function Navbar({ accessToken, window }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname() || "/";
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const items = accessToken ? [...navItems, { label: "Dashboard", href: "/dashboard" }] : navItems;

  //* Teal underline that slides in on hover and stays on the active route
  const linkSx = (href: string) => ({
    color: isActive(href) ? "primary.main" : "text.primary",
    fontWeight: isActive(href) ? 700 : 600,
    fontSize: 15,
    position: "relative",
    py: 1,
    transition: "color .2s ease",
    "&::after": {
      content: '""',
      position: "absolute",
      left: "-6px",
      right: "-6px",
      bottom: 0,
      height: 2,
      borderRadius: 2,
      bgcolor: "primary.main",
      transform: isActive(href) ? "scaleX(1)" : "scaleX(0)",
      transformOrigin: "center",
      transition: "transform .25s cubic-bezier(0.22, 1, 0.36, 1)",
    },
    "&:hover": { color: "primary.main" },
    "&:hover::after": { transform: "scaleX(1)" },
  });

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: "flex", height: "72px" }}>
      <CssBaseline />
      <Box component="nav" aria-label="Main" sx={{ width: "100%", height: "72px", display: "flex", alignItems: "center" }}>
        <Container>
          <Toolbar disableGutters sx={{ gap: 2 }}>
            <IconButton
              color="inherit"
              aria-label="Open menu"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { lg: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ flexGrow: 1 }}>
              <Logo />
            </Box>

            <Box component="ul" sx={{ display: { xs: "none", lg: "flex" }, gap: 3.5, listStyle: "none", m: 0, p: 0, mr: 1 }}>
              {items.map((item) => (
                <li key={item.href}>
                  <Typography component={Link} href={item.href} sx={linkSx(item.href)} aria-current={isActive(item.href) ? "page" : undefined}>
                    {item.label}
                  </Typography>
                </li>
              ))}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <ThemeToggle />
              <AuthButton />
            </Box>
          </Toolbar>
        </Container>
      </Box>

      <Drawer
        container={container}
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: "block", lg: "none" }, "& .MuiDrawer-paper": { width: 280, p: 2 } }}
      >
        <Box onClick={() => setMobileOpen(false)}>
          <Box sx={{ mb: 2 }}>
            <Logo />
          </Box>
          <List>
            {items.map((item) => (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={isActive(item.href)}
                sx={{ borderRadius: 2, mb: 0.5, "&.Mui-selected": { bgcolor: "primary.light", color: "primary.main" } }}
              >
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 700 }} />
              </ListItemButton>
            ))}
            <ListItemButton component={Link} href="/dashboard/user/favorites" sx={{ borderRadius: 2 }}>
              <ListItemText primary="Saved pets" primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
          </List>
        </Box>
        <Divider sx={{ my: 1 }} />
        <ThemeToggle withLabel />
      </Drawer>
    </Box>
  );
}
