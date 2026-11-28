"use client";

import List from "@mui/material/List";
import { Box } from "@mui/material";
import { UserRole } from "@/types";
import { getUserInfo } from "@/services/auth.services";
import { useEffect, useState } from "react";
import { drawerItems } from "@/utils/drawerItems";
import SidebarItem from "./SidebarItems";
import Logo from "@/components/Shared/Logo";

const Sidebar = () => {
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const { role } = getUserInfo() as any;
    setUserRole(role);
  }, []);

  return (
    <Box>
      {/* Same logo as the public site (follows light/dark mode) */}
      <Box sx={{ py: 1.5, mt: 0.5, ml: 2.5 }}>
        <Logo />
      </Box>
      {/* Drawer Item */}
      <List>
        {drawerItems(userRole as UserRole).map((item, index) => (
          <SidebarItem key={index} item={item} />
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;
