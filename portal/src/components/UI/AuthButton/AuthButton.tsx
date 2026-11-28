"use client";

import AccountMenu from "@/components/Dashboard/AccountMenu/AccountMenu";
import { isLoggedIn } from "@/services/auth.services";
import { Box, Button } from "@mui/material";
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
      aria-label="Login or sign up"
      sx={{
        color: "primary.main",
        px: { xs: 1, sm: 1.5 },
        minWidth: 0,
        "&:hover": { bgcolor: "primary.light" },
        //* Icon only on phones so the navbar fits 360-390 px screens
        "& .MuiButton-startIcon": { mr: { xs: 0, sm: 1 }, ml: { xs: 0, sm: -0.5 } },
      }}
    >
      <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
        Login/Signup
      </Box>
    </Button>
  );
};

export default AuthButton;
