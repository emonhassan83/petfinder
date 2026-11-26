"use client";

import AccountMenu from "@/components/Dashboard/AccountMenu/AccountMenu";
import { isLoggedIn } from "@/services/auth.services";
import { Button } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import Link from "next/link";

const AuthButton = () => {
  const loginUser = isLoggedIn();

  return loginUser ? (
    <AccountMenu />
  ) : (
    <Button
      variant="text"
      component={Link}
      href="/login"
      startIcon={<PersonOutlineIcon />}
      sx={{ color: "primary.main", px: 1.5, "&:hover": { bgcolor: "primary.light" } }}
    >
      Login/Signup
    </Button>
  );
};

export default AuthButton;
