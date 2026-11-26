"use client";

import { useState } from "react";
import { Box, Card, Chip, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography } from "@mui/material";
import { mockSubscriptions, mockTransactions } from "@/mock/admin";

const subColor: Record<string, "success" | "warning" | "default"> = { ACTIVE: "success", PAST_DUE: "warning", CANCELED: "default" };
const txColor: Record<string, "success" | "error"> = { PAID: "success", FAILED: "error" };

const SubscriptionsPage = () => {
  const [tab, setTab] = useState(0);
  const mrr = mockSubscriptions
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum, s) => sum + (s.plan === "Premium" ? 490 / 12 : 19), 0);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Subscriptions &amp; payments
      </Typography>
      <Card sx={{ p: 2.5, mb: 3, maxWidth: 260 }}>
        <Typography variant="body2" color="text.secondary">
          Est. monthly recurring revenue
        </Typography>
        <Typography variant="h4">${mrr.toFixed(0)}</Typography>
      </Card>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Subscriptions" />
        <Tab label="Transactions" />
      </Tabs>
      <Card sx={{ overflowX: "auto" }}>
        {tab === 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Account</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Billing</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Renews</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockSubscriptions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.account}</TableCell>
                  <TableCell>{s.plan}</TableCell>
                  <TableCell>{s.cycle}</TableCell>
                  <TableCell>
                    <Chip size="small" label={s.status.replace("_", " ")} color={subColor[s.status]} />
                  </TableCell>
                  <TableCell>{s.renews}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Account</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockTransactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.date}</TableCell>
                  <TableCell>{t.account}</TableCell>
                  <TableCell align="right">
                    {t.amount} {t.currency}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={t.status} color={txColor[t.status]} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Preview data. Real figures come from Stripe webhooks in Phase 3.
      </Typography>
    </Box>
  );
};

export default SubscriptionsPage;
