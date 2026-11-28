"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Stack } from "@mui/material";
import Sidebar from "../Sidebar/Sidebar";
import { useGetMyProfileQuery } from "@/redux/api/userApi";
import AccountMenu from "../AccountMenu/AccountMenu";
import { ReactNode, useState } from "react";
import ThemeToggle from "@/components/UI/ThemeToggle";
import NotificationBell from "../NotificationBell/NotificationBell";
import { useAuthUser } from "@/hooks/useAuthUser";

const drawerWidth = 240;

export default function DashboardDrawer({
  children,
}: {
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { data, isLoading } = useGetMyProfileQuery({});
  const { user } = useAuthUser();
  //* The JWT carries no name: use the profile, then the email from the token while it loads
  const displayName = data?.name || user?.email?.split("@")[0] || "";

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          boxShadow: 0,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" }, color: "primary.main" }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Box>
              <Typography sx={{marginLeft: "15px"}} variant="body2" component="p" color="text.primary" fontWeight="600">
              
                {isLoading && !displayName ? "Welcome back" : displayName ? `Hello, ${displayName}!` : "Welcome back"}
              </Typography>
              {/* <Typography
                variant="body2"
                noWrap
                component="div"
                sx={{ color: "primary.main" }}
              >
                Welcome to pet finder!
              </Typography> */}
            </Box>
            <Stack direction="row" gap={1} alignItems="center">
              <ThemeToggle />
              {user?.role === "user" && <NotificationBell href="/dashboard/user/notifications" />}
              {/* <Avatar alt={data?.name} src={data?.profilePhoto} /> */}
              <AccountMenu/>
            </Stack>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          <Sidebar />
        </Drawer>
        {/* For mobile device */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          <Sidebar />
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Box>{children}</Box>
      </Box>
    </Box>
  );
}
