"use client";

import { Button, Typography } from "@mui/material";
import AddAdoptModal from "./AddAdoptModal";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAdopterRole, useAuthUser } from "@/hooks/useAuthUser";

type Props = { petId: string; ownerId?: string; acceptsApplications?: boolean };

const AddAdoptButton = ({ petId, ownerId, acceptsApplications = true }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuthUser();
  const router = useRouter();
  const pathname = usePathname();

  if (!acceptsApplications) {
    return (
      <Button fullWidth disabled sx={{ mt: 4 }}>
        Not accepting applications
      </Button>
    );
  }

  if (!user) {
    return (
      <Button fullWidth onClick={() => router.push(`/login?redirect=${encodeURIComponent(pathname || "/pets")}`)} sx={{ mt: 4 }}>
        Log in to apply
      </Button>
    );
  }

  const ownListing = !!ownerId && ownerId === user.userId;
  const allowed = isAdopterRole(user.role) && !ownListing;

  return (
    <>
      {allowed && <AddAdoptModal open={isModalOpen} setOpen={setIsModalOpen} petId={petId} />}
      <Button fullWidth disabled={!allowed} onClick={() => setIsModalOpen(true)} sx={{ mt: 4 }}>
        Apply to Adopt
      </Button>
      {!allowed && (
        <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 1, textAlign: "center" }}>
          {ownListing ? "This is your own listing." : "Applications are made from an adopter account."}
        </Typography>
      )}
    </>
  );
};

export default AddAdoptButton;
