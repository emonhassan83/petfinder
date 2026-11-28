"use client";

import { useState } from "react";
import { Alert, Box, Button, Card, IconButton, List, ListItem, ListItemText, MenuItem, TextField, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { toast } from "sonner";
import QueryState from "@/components/Dashboard/Common/QueryState";
import {
  useAddShelterMemberMutation,
  useGetMyShelterQuery,
  useGetShelterMembersQuery,
  useRemoveShelterMemberMutation,
  useUpdateShelterMemberMutation,
} from "@/redux/api/shelterDashboardApi";
import { runMutation } from "@/utils/dashboardHelpers";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = [
  ["MANAGER", "Manager"],
  ["EDITOR", "Editor"],
  ["VIEWER", "Viewer"],
] as const;

const MembersPage = () => {
  const shelter = useGetMyShelterQuery({});
  //* Teams belong to shelter accounts; individual owners have none (the endpoint is SHELTER-only)
  const isOwnerType = shelter.data?.type === "OWNER";
  const members = useGetShelterMembersQuery({}, { skip: !shelter.data || isOwnerType });
  const [add, { isLoading: adding }] = useAddShelterMemberMutation();
  const [update] = useUpdateShelterMemberMutation();
  const [remove] = useRemoveShelterMemberMutation();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EDITOR");

  const invite = async () => {
    const value = email.trim().toLowerCase();
    if (!EMAIL.test(value)) return toast.error("Enter a valid email address.");
    const r = await runMutation(add({ email: value, role }), "Member added.");
    if (r.ok) setEmail("");
  };

  if (isOwnerType) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Team
        </Typography>
        <Alert severity="info" sx={{ maxWidth: 640 }}>
          Teams are available to shelter accounts. Individual owners manage their listings on their own.
        </Alert>
      </Box>
    );
  }

  const data = members.data;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Team
      </Typography>
      <QueryState isLoading={shelter.isLoading || members.isLoading} error={shelter.error || members.error}>
        <Card sx={{ maxWidth: 680, p: 2 }}>
          {data && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {data.used} of {data.limit} seats used. Upgrade your plan under Plan &amp; Billing for more.
            </Typography>
          )}
          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            <TextField sx={{ flex: 1, minWidth: 200 }} size="small" type="email" label="Add by email" value={email} onChange={(e) => setEmail(e.target.value)} helperText="They need an existing account." />
            <TextField select size="small" label="Role" value={role} onChange={(e) => setRole(e.target.value)} sx={{ minWidth: 120 }}>
              {ROLES.map(([v, l]) => (
                <MenuItem key={v} value={v}>
                  {l}
                </MenuItem>
              ))}
            </TextField>
            <Button disabled={adding} onClick={invite} sx={{ alignSelf: "flex-start" }}>
              Add
            </Button>
          </Box>
          <List>
            {data?.owner && (
              <ListItem divider>
                <ListItemText primary={`${data.owner.name} (you)`} secondary={`${data.owner.email} · Owner`} />
              </ListItem>
            )}
            {(data?.members ?? []).map((m: any) => (
              <ListItem
                key={m.id}
                divider
                secondaryAction={
                  <IconButton aria-label={`Remove ${m.user?.name}`} onClick={() => runMutation(remove(m.id), "Member removed.")}>
                    <DeleteOutlineIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={m.user?.name} secondary={m.user?.email} sx={{ pr: 14 }} />
                <TextField
                  select
                  size="small"
                  variant="standard"
                  value={m.role}
                  onChange={(e) => runMutation(update({ id: m.id, role: e.target.value }), "Role updated.")}
                  sx={{ minWidth: 100, mr: 5 }}
                >
                  {ROLES.map(([v, l]) => (
                    <MenuItem key={v} value={v}>
                      {l}
                    </MenuItem>
                  ))}
                </TextField>
              </ListItem>
            ))}
          </List>
        </Card>
      </QueryState>
    </Box>
  );
};

export default MembersPage;
