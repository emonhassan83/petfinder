"use client";

import { useState } from "react";
import { Box, Button, Card, IconButton, MenuItem, Switch, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import QueryState from "@/components/Dashboard/Common/QueryState";
import { LookupKind, useCreateLookupMutation, useDeleteLookupMutation, useGetLookupsQuery, useUpdateLookupMutation } from "@/redux/api/lookupAdminApi";
import { runMutation } from "@/utils/dashboardHelpers";

const KINDS: { kind: LookupKind; label: string }[] = [
  { kind: "species", label: "Species" },
  { kind: "breeds", label: "Breeds" },
  { kind: "locations", label: "Locations" },
];

const LookupsPage = () => {
  const [tab, setTab] = useState(0);
  const { kind, label } = KINDS[tab];
  const [name, setName] = useState("");
  const [parent, setParent] = useState("");
  const [city, setCity] = useState("");

  const list = useGetLookupsQuery({ kind, includeInactive: true });
  const speciesList = useGetLookupsQuery({ kind: "species", includeInactive: true });
  const [create, { isLoading: creating }] = useCreateLookupMutation();
  const [update] = useUpdateLookupMutation();
  const [remove] = useDeleteLookupMutation();

  const rows: any[] = list.data ?? [];
  const speciesName = (id: string) => (speciesList.data ?? []).find((s: any) => s.id === id)?.name ?? "";

  const add = async () => {
    const v = name.trim();
    if (!v) return;
    const body: any = { name: v };
    if (kind === "breeds") body.speciesId = parent;
    if (kind === "locations" && city.trim()) body.city = city.trim();
    const r = await runMutation(create({ kind, body }), `${label.replace(/s$/, "")} added.`);
    if (r.ok) {
      setName("");
      setCity("");
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Species, breeds &amp; locations
      </Typography>
      <Tabs
        value={tab}
        onChange={(_, v) => {
          setTab(v);
          setName("");
          setParent("");
          setCity("");
        }}
        sx={{ mb: 2 }}
      >
        {KINDS.map((k) => (
          <Tab key={k.kind} label={k.label} />
        ))}
      </Tabs>
      <Card sx={{ p: 3, maxWidth: 760 }}>
        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
          {kind === "breeds" && (
            <TextField select size="small" label="Species" value={parent} onChange={(e) => setParent(e.target.value)} sx={{ minWidth: 140 }}>
              {(speciesList.data ?? []).map((s: any) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField size="small" label={`Add to ${label.toLowerCase()}`} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} sx={{ flex: 1, minWidth: 180 }} />
          {kind === "locations" && <TextField size="small" label="City" value={city} onChange={(e) => setCity(e.target.value)} />}
          <Button onClick={add} disabled={creating || !name.trim() || (kind === "breeds" && !parent)}>
            Add
          </Button>
        </Box>
        <QueryState isLoading={list.isLoading} error={list.error}>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  {kind === "breeds" && <TableCell>Species</TableCell>}
                  {kind === "locations" && <TableCell>City</TableCell>}
                  <TableCell align="center">Active</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    {kind === "breeds" && <TableCell>{speciesName(r.speciesId)}</TableCell>}
                    {kind === "locations" && <TableCell>{r.city ?? ""}</TableCell>}
                    <TableCell align="center">
                      <Switch
                        size="small"
                        checked={r.isActive}
                        inputProps={{ "aria-label": `${r.name} active` }}
                        onChange={(e) => runMutation(update({ kind, id: r.id, body: { isActive: e.target.checked } }))}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton aria-label={`Delete ${r.name}`} onClick={() => runMutation(remove({ kind, id: r.id }), "Deleted.")}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Nothing yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </QueryState>
      </Card>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        A value that pets still use cannot be deleted; deactivate it instead to hide it from new listings.
      </Typography>
    </Box>
  );
};

export default LookupsPage;
