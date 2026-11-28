import { Box, Container, Divider, Typography } from "@mui/material";
import Image from "next/image";
import LinkBox from "@/components/Shared/LinkBox";
import PageHeader from "@/components/Shared/PageHeader";
import BeforeAfter from "@/components/UI/BeforeAfter";
import { findStory, storyBody, successStories } from "@/mock/stories";
import { findPreviewShelter } from "@/mock/pets";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export const generateStaticParams = () => successStories.map((s) => ({ storyId: s.id }));

export const generateMetadata = async ({ params }: { params: Promise<{ storyId: string }> }) => {
  const story = findStory((await params).storyId);
  return story
    ? { title: `${story.petName}: ${story.title} | Petfinder`, description: story.excerpt }
    : { title: "Story not found | Petfinder" };
};

//* Single success story (preview data; GET /success-stories/:id in Phase 3f)
const StoryPage = async ({ params }: { params: Promise<{ storyId: string }> }) => {
  const { storyId } = await params;
  const story = findStory(storyId);

  if (!story) {
    return (
      <Container sx={{ py: 12, textAlign: "center" }}>
        <Typography variant="h4">Story not found</Typography>
        <LinkBox href="/stories" sx={{ display: "inline-block", mt: 2, color: "primary.main", fontWeight: 700 }}>
          See all stories →
        </LinkBox>
      </Container>
    );
  }

  const shelter = findPreviewShelter(story.shelterId);
  const more = successStories.filter((s) => s.id !== story.id).slice(0, 3);

  return (
    <>
      <PageHeader title={story.title} crumbs={[{ label: "Success stories", href: "/stories" }, { label: story.petName }]} subtitle={`${story.petName} · adopted by ${story.family}, ${story.city} · ${formatDate(story.adoptedOn)}`} />

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 7 } }}>
        {story.before && story.after ? (
          <BeforeAfter before={story.before} after={story.after} alt={story.petName} ratio="16 / 10" />
        ) : (
          <Box sx={{ position: "relative", aspectRatio: "16 / 10", borderRadius: "var(--pf-radius-card)", overflow: "hidden" }}>
            <Image src={story.image} alt={story.petName} fill priority sizes="(max-width: 900px) 100vw, 900px" style={{ objectFit: "cover" }} />
          </Box>
        )}

        <Box sx={{ mt: 5, display: "grid", gap: 2.5 }}>
          {storyBody(story).map((p, i) => (
            <Typography
              key={i}
              sx={
                i === 0
                  ? { fontFamily: "var(--font-heading), Georgia, serif", fontStyle: "italic", fontSize: { xs: 21, md: 25 }, lineHeight: 1.5 }
                  : { fontSize: 17, lineHeight: 1.8, color: "text.secondary" }
              }
            >
              {p}
            </Typography>
          ))}
        </Box>

        {shelter && (
          <Box sx={{ mt: 5, p: 3, borderRadius: "var(--pf-radius-card)", bgcolor: "var(--pf-soft)", display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ flex: 1, minWidth: 220 }}>
              <Typography variant="overline" sx={{ color: "text.secondary" }}>
                Adopted through
              </Typography>
              <Typography variant="h6">{shelter.name}</Typography>
            </Box>
            <LinkBox href={`/shelters/${shelter.id}`} sx={{ color: "primary.main", fontWeight: 700 }}>
              Visit shelter →
            </LinkBox>
            <LinkBox href="/pets" sx={{ px: 3, py: 1.25, borderRadius: 999, bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 700 }}>
              Find your own match
            </LinkBox>
          </Box>
        )}

        <Divider sx={{ my: 6 }} />

        <Typography variant="h4" sx={{ fontSize: { xs: 24, md: 30 }, mb: 3 }}>
          More happy tails
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 3 }}>
          {more.map((s) => (
            <LinkBox key={s.id} href={`/stories/${s.id}`} sx={{ display: "block", "&:hover h3": { color: "primary.main" } }}>
              <Box sx={{ position: "relative", aspectRatio: "4 / 3", borderRadius: "999px 999px 20px 20px", overflow: "hidden", mb: 1.5 }}>
                <Image src={s.image} alt={s.petName} fill sizes="(max-width: 600px) 100vw, 300px" style={{ objectFit: "cover" }} />
              </Box>
              <Typography variant="overline" sx={{ color: "text.secondary" }}>
                {s.petName}
              </Typography>
              <Typography variant="h6" component="h3" sx={{ lineHeight: 1.3, transition: "color .2s ease" }}>
                {s.title}
              </Typography>
            </LinkBox>
          ))}
        </Box>
      </Container>
    </>
  );
};

export default StoryPage;
