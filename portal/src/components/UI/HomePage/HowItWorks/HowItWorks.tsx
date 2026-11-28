import { Container } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import SectionHeading from "@/components/Shared/SectionHeading";
import Timeline from "../../Timeline";

const steps = [
  { title: "Find your match", text: "Search by species, breed, size and location, and save the pets you love.", icon: <SearchIcon /> },
  { title: "Meet in person", text: "Chat with the shelter and book a meet-and-greet at a time that suits you.", icon: <EventAvailableOutlinedIcon /> },
  { title: "Apply", text: "Send one simple application and follow its status from your dashboard.", icon: <DescriptionOutlinedIcon /> },
  { title: "Welcome home", text: "Agree the handover, pay the listed fee to the shelter, and start your life together.", icon: <HomeOutlinedIcon /> },
];

//* "How adoption works" (anchor target of the hero's secondary button)
const HowItWorks = () => (
  <Container component="section" id="how-it-works" aria-labelledby="how-it-works-title" sx={{ py: { xs: 6, md: 10 }, scrollMarginTop: 80 }}>
    <SectionHeading id="how-it-works-title" overline="How it works" title={<>Four steps to a <em>forever</em> home</>} />
    <Timeline steps={steps} />
  </Container>
);

export default HowItWorks;
