"use client";

import { useState } from "react";
import { Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, List, ListItem, ListItemText, Switch, TextField, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import QueryState from "@/components/Dashboard/Common/QueryState";
import {
  useAdminCreateFaqMutation,
  useAdminCreatePageMutation,
  useAdminDeleteFaqMutation,
  useAdminDeletePageMutation,
  useAdminGetFaqsQuery,
  useAdminGetPagesQuery,
  useAdminUpdateFaqMutation,
  useAdminUpdatePageMutation,
} from "@/redux/api/cmsAdminApi";
import { runMutation } from "@/utils/dashboardHelpers";

const CmsPage = () => {
  const faqs = useAdminGetFaqsQuery({});
  const pages = useAdminGetPagesQuery({});
  const [createFaq, { isLoading: creating }] = useAdminCreateFaqMutation();
  const [updateFaq] = useAdminUpdateFaqMutation();
  const [deleteFaq] = useAdminDeleteFaqMutation();
  const [createPage] = useAdminCreatePageMutation();
  const [updatePage, { isLoading: savingPage }] = useAdminUpdatePageMutation();
  const [deletePage] = useAdminDeletePageMutation();

  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  //* Page editor: id undefined = new page
  const [page, setPage] = useState<any>(null);

  const addFaq = async () => {
    const r = await runMutation(createFaq({ question: q.trim(), answer: a.trim() }), "FAQ added.");
    if (r.ok) {
      setQ("");
      setA("");
    }
  };

  const savePage = async () => {
    const body: any = { title: page.title.trim(), body: page.body, isPublished: page.isPublished };
    if (!page.id && page.slug.trim()) body.slug = page.slug.trim();
    const r = page.id ? await runMutation(updatePage({ id: page.id, body }), "Page saved.") : await runMutation(createPage(body), "Page created.");
    if (r.ok) setPage(null);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Content management
      </Typography>
      <Typography variant="h6" sx={{ mb: 1 }}>
        FAQs
      </Typography>
      <Card sx={{ p: 2, mb: 4, maxWidth: 760 }}>
        <QueryState isLoading={faqs.isLoading} error={faqs.error}>
          <List>
            {(faqs.data ?? []).map((f: any) => (
              <ListItem
                key={f.id}
                divider
                secondaryAction={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Switch size="small" checked={f.isPublished} inputProps={{ "aria-label": `Publish FAQ ${f.question}` }} onChange={(e) => runMutation(updateFaq({ id: f.id, body: { isPublished: e.target.checked } }))} />
                    <IconButton aria-label={`Delete FAQ ${f.question}`} onClick={() => runMutation(deleteFaq(f.id), "FAQ deleted.")}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText primary={f.question} secondary={f.answer} sx={{ pr: 12 }} />
              </ListItem>
            ))}
          </List>
        </QueryState>
        <Box sx={{ display: "grid", gap: 1, mt: 2 }}>
          <TextField size="small" label="Question" value={q} onChange={(e) => setQ(e.target.value)} />
          <TextField size="small" label="Answer" multiline minRows={2} value={a} onChange={(e) => setA(e.target.value)} />
          <Button sx={{ justifySelf: "start" }} disabled={creating || q.trim().length < 3 || !a.trim()} onClick={addFaq}>
            Add FAQ
          </Button>
        </Box>
      </Card>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 760, mb: 1 }}>
        <Typography variant="h6">Static pages</Typography>
        <Button size="small" variant="outlined" onClick={() => setPage({ title: "", slug: "", body: "", isPublished: true })}>
          New page
        </Button>
      </Box>
      <Card sx={{ maxWidth: 760 }}>
        <QueryState isLoading={pages.isLoading} error={pages.error}>
          <List>
            {(pages.data?.items ?? []).map((p: any) => (
              <ListItem
                key={p.id}
                divider
                secondaryAction={
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Button size="small" variant="outlined" onClick={() => setPage({ ...p, slug: p.slug })}>
                      Edit
                    </Button>
                    <IconButton aria-label={`Delete page ${p.title}`} onClick={() => runMutation(deletePage(p.id), "Page deleted.")}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <>
                      {p.title} {!p.isPublished && <Chip size="small" label="draft" sx={{ ml: 1 }} />}
                    </>
                  }
                  secondary={`/${p.slug}`}
                />
              </ListItem>
            ))}
          </List>
        </QueryState>
      </Card>

      <Dialog open={!!page} onClose={() => setPage(null)} fullWidth maxWidth="md">
        <DialogTitle>{page?.id ? "Edit page" : "New page"}</DialogTitle>
        {page && (
          <DialogContent sx={{ display: "grid", gap: 2, pt: "8px !important" }}>
            <TextField label="Title" value={page.title} onChange={(e) => setPage({ ...page, title: e.target.value })} />
            {!page.id && <TextField label="Slug (optional)" value={page.slug} onChange={(e) => setPage({ ...page, slug: e.target.value })} helperText="lowercase-with-dashes" />}
            <TextField label="Content" multiline minRows={8} value={page.body} onChange={(e) => setPage({ ...page, body: e.target.value })} />
            <FormControlLabel control={<Switch checked={page.isPublished} onChange={(e) => setPage({ ...page, isPublished: e.target.checked })} />} label="Published" />
          </DialogContent>
        )}
        <DialogActions sx={{ p: 2 }}>
          <Button variant="text" color="inherit" onClick={() => setPage(null)}>
            Cancel
          </Button>
          <Button disabled={savingPage || !page?.title?.trim() || !page?.body?.trim()} onClick={savePage}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Page content is shown as plain text on the public site.
      </Typography>
    </Box>
  );
};

export default CmsPage;
