import Meta from "@/components/Meta/MetaData";
import HeroSection from "@/components/UI/HomePage/HeroSection/HeroSection";
import CategoryTiles from "@/components/UI/HomePage/CategoryTiles/CategoryTiles";
import PetAdoptSection from "@/components/UI/HomePage/PetAdoptSection/PetAdoptSection";
import HowItWorks from "@/components/UI/HomePage/HowItWorks/HowItWorks";
import ReadyForHome from "@/components/UI/HomePage/ReadyForHome/ReadyForHome";
import AdoptionResources from "@/components/UI/HomePage/AdoptionResources/AdoptionResources";
import SuccessStories from "@/components/UI/HomePage/SuccessStories/SuccessStories";
import Testimonials from "@/components/UI/HomePage/Testimonials/Testimonials";
import PlanningAdopt from "@/components/UI/HomePage/PlanningAdopt/PlanningAdopt";
import Articles from "@/components/UI/HomePage/Articles/Articles";
import ShelterCta from "@/components/UI/HomePage/ShelterCta/ShelterCta";
import Marquee from "@/components/UI/Marquee";
import Reveal from "@/components/UI/Reveal";

const trustPhrases = ["Verified shelters", "Vet-checked pets", "Free to browse", "Meet before you adopt", "Transparent fees"];

const HomePage = () => {
  return (
    <>
      <Meta
        title="Home | Petfinder - Pet Adoption Platform & Management System"
        description="Find adoptable dogs, cats and other pets from verified shelters and owners near you."
      />
      <HeroSection />
      <Marquee items={trustPhrases} />
      <CategoryTiles />
      <Reveal><PetAdoptSection /></Reveal>
      <Reveal><HowItWorks /></Reveal>
      <Reveal><ReadyForHome /></Reveal>
      <Reveal><AdoptionResources /></Reveal>
      <Reveal><SuccessStories /></Reveal>
      <Reveal><Testimonials /></Reveal>
      <Reveal><PlanningAdopt /></Reveal>
      <Reveal><Articles /></Reveal>
      <Reveal><ShelterCta /></Reveal>
    </>
  );
};

export default HomePage;
