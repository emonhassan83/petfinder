import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { Box, Paper, Typography } from "@mui/material";
import Link from "next/link";
import { useFavGetFavoritesQuery } from "@/redux/api/favoriteApi";
import { useVisitGetMineQuery } from "@/redux/api/visitApi";
import { useChatGetConversationsQuery } from "@/redux/api/conversationApi";

//* Adopter summary tiles: applications (from /meta), saved pets, upcoming visits, unread messages
const UserMetaDataSection = ({ metaData }: any) => {
  const { data: favorites } = useFavGetFavoritesQuery({ limit: 1 });
  const { data: visits } = useVisitGetMineQuery({ limit: 100 });
  const { data: conversations } = useChatGetConversationsQuery();

  const now = Date.now();
  const upcomingVisits = (visits?.items ?? []).filter(
    (v: any) => ["REQUESTED", "CONFIRMED"].includes(v.status) && new Date(v.slot?.endsAt ?? 0).getTime() > now
  ).length;
  const unread = (conversations?.items ?? []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const tiles = [
    { icon: <LocalOfferIcon fontSize="large" color="primary" />, count: metaData?.adoptionCount ?? 0, label: "My Applications", href: "/dashboard/user/manage-adoption" },
    { icon: <FavoriteBorderIcon fontSize="large" color="primary" />, count: favorites?.meta?.total ?? 0, label: "Saved Pets", href: "/dashboard/user/favorites" },
    { icon: <EventAvailableOutlinedIcon fontSize="large" color="primary" />, count: upcomingVisits, label: "Upcoming Visits", href: "/dashboard/user/visits" },
    { icon: <ChatBubbleOutlineIcon fontSize="large" color="primary" />, count: unread, label: "Unread Messages", href: "/dashboard/user/messages" },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
        gap: 2,
        mt: 4,
        flex: 1,
      }}
    >
      {tiles.map((item) => (
        <Paper
          key={item.label}
          component={Link}
          href={item.href}
          elevation={2}
          sx={{
            p: 2,
            borderRadius: "8px",
            textAlign: "center",
            paddingTop: { xs: 3, md: 6, lg: 7 },
            transition: "0.3s",
            "&:hover": { boxShadow: 7, transform: "scale(1.02)" },
          }}
        >
          {item.icon}
          <Typography variant="h6">{item.count}</Typography>
          <Typography variant="body2">{item.label}</Typography>
        </Paper>
      ))}
    </Box>
  );
};

export default UserMetaDataSection;
