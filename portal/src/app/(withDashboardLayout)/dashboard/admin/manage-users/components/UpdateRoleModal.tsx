import { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography } from "@mui/material";
import { useAdminChangeUserRoleMutation } from "@/redux/api/userApi";
import { runMutation } from "@/utils/dashboardHelpers";

const BASE_ROLES = ["USER", "OWNER", "SHELTER", "SHELTER_MEMBER"];
const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

type TProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data: any;
  //* ADMIN/SUPER_ADMIN options are offered to SUPER_ADMIN only (the server enforces it too)
  viewerIsSuperAdmin: boolean;
};

const UpdateUserRoleModal = ({ open, setOpen, data, viewerIsSuperAdmin }: TProps) => {
  const [changeRole, { isLoading }] = useAdminChangeUserRoleMutation();
  const [role, setRole] = useState("USER");

  useEffect(() => {
    if (data?.role) setRole(data.role);
  }, [data]);

  const options = viewerIsSuperAdmin ? [...BASE_ROLES, ...ADMIN_ROLES] : BASE_ROLES;

  const submit = async () => {
    const r = await runMutation(changeRole({ id: data.id, role }), "Role updated. The user's sessions were revoked.");
    if (r.ok) setOpen(false);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
      <DialogTitle>Change role</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {data?.name} ({data?.email})
        </Typography>
        <TextField select fullWidth label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
          {options.map((o) => (
            <MenuItem key={o} value={o}>
              {o}
            </MenuItem>
          ))}
          {!options.includes(role) && (
            <MenuItem value={role} disabled>
              {role}
            </MenuItem>
          )}
        </TextField>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="text" color="inherit" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button disabled={isLoading || role === data?.role} onClick={submit}>
          Update role
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateUserRoleModal;
