import { Box, Chip, Container, Typography } from "@mui/material";
import Image from "next/image";
import Meta from "@/components/Meta/MetaData";
import PageHeader from "@/components/Shared/PageHeader";
import { previewArticles, unsplash } from "@/mock/pets";

const categories = ["Adopting a pet", "Dog care", "Cat care", "Health & safety", "Behaviour & training", "Pet insurance", "Rehoming"];

type Article = { id: string; title: string; excerpt: string; image: string; category: string; meta: string };

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "");

//* Resources hub: API blogs when available, preview articles otherwise
const BlogsPage = async () => {
  let articles: Article[] = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/blog`, { next: { revalidate: 30 } });
    if (res.ok) {
      const data = await res.json();
      articles = (data?.data || []).map((b: any) => ({
        id: b.id,
        title: b.title,
        excerpt: b.description?.length > 140 ? `${b.description.slice(0, 140)}…` : b.description,
        image: b.image,
        category: b.category || "Pet care",
        meta: [b.author?.name, fmtDate(b.publishedAt)].filter(Boolean).join(" · "),
      }));
    }
  } catch {
    /* API offline: fall back below */
  }
  if (!articles.length) {
    articles = previewArticles.map((a) => ({ id: a.id, title: a.title, excerpt: a.excerpt, image: a.image, category: a.category, meta: `${a.read} read` }));
  }

  const [featured, ...rest] = articles;

  return (
    <>
      <Meta title="Pet care & adoption resources | Petfinder" description="Articles on adopting, caring for and training your pet." />
      <PageHeader
        title="Pet care &"
        highlight="adoption resources"
        crumbs={[{ label: "Resources" }]}
        subtitle="Advice from vets, trainers and adopters to help you and your new pet thrive."
        image={unsplash("1544568100-847a948585b9", 600)}
      >
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {categories.map((c) => (
            <Chip key={c} label={c} clickable sx={{ bgcolor: "background.paper", fontWeight: 600, "&:hover": { bgcolor: "primary.main", color: "#fff" } }} />
          ))}
        </Box>
      </PageHeader>

      <Container sx={{ py: { xs: 4, md: 7 } }}>
        {featured && (
          <Box
            className="pf-fade-up"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" },
              bgcolor: "background.paper",
              borderRadius: 5,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "var(--pf-shadow)",
              "&:hover img": { transform: "scale(1.04)" },
            }}
          >
            <Box sx={{ position: "relative", minHeight: { xs: 240, md: 380 }, overflow: "hidden" }}>
              <Image src={featured.image} alt="" fill priority sizes="(max-width: 900px) 100vw, 60vw" style={{ objectFit: "cover", transition: "transform .8s ease" }} />
            </Box>
            <Box sx={{ p: { xs: 3, md: 5 }, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <Chip label="Featured" color="secondary" size="small" sx={{ alignSelf: "flex-start", mb: 2 }} />
              <Typography variant="h3" sx={{ fontSize: { xs: "1.5rem", md: "2.1rem" } }}>
                {featured.title}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: 17 }}>
                {featured.excerpt}
              </Typography>
              <Typography variant="body2" sx={{ mt: 2, color: "primary.main", fontWeight: 700 }}>
                {featured.category} · {featured.meta}
              </Typography>
            </Box>
          </Box>
        )}

        {rest.length > 0 && (
          <>
            <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 28 }, mt: 7, mb: 3 }}>
              Latest articles
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
              {rest.map((a, i) => (
                <Box
                  key={a.id}
                  component="article"
                  className="pf-fade-up pf-lift"
                  style={{ animationDelay: `${i * 0.06}s` }}
                  sx={{ bgcolor: "background.paper", borderRadius: 4, overflow: "hidden", border: "1px solid", borderColor: "divider", "&:hover img": { transform: "scale(1.07)" } }}
                >
                  <Box sx={{ position: "relative", height: 200, overflow: "hidden" }}>
                    <Image src={a.image} alt="" fill sizes="(max-width: 600px) 100vw, 33vw" style={{ objectFit: "cover", transition: "transform .6s ease" }} />
                  </Box>
                  <Box sx={{ p: 2.5 }}>
                    <Typography variant="body2" sx={{ color: "var(--pf-rust)", fontWeight: 700 }}>
                      {a.category}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.5, lineHeight: 1.3 }}>
                      {a.title}
                    </Typography>
                    <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                      {a.excerpt}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                      {a.meta}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Container>
    </>
  );
};

export default BlogsPage;
