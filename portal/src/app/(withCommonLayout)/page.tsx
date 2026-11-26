import Meta from "@/components/Meta/MetaData";
import HeroSection from "@/components/UI/HomePage/HeroSection/HeroSection";
import CategoryTiles from "@/components/UI/HomePage/CategoryTiles/CategoryTiles";
import PetAdoptSection from "@/components/UI/HomePage/PetAdoptSection/PetAdoptSection";
import AdoptionResources from "@/components/UI/HomePage/AdoptionResources/AdoptionResources";
import PlanningAdopt from "@/components/UI/HomePage/PlanningAdopt/PlanningAdopt";
import Articles from "@/components/UI/HomePage/Articles/Articles";
import ShelterCta from "@/components/UI/HomePage/ShelterCta/ShelterCta";
import Reveal from "@/components/UI/Reveal";

const HomePage = () => {
  return (
    <>
      <Meta
        title="Home | Petfinder - Pet Adoption Platform & Management System"
        description="Find adoptable dogs, cats and other pets from verified shelters and owners near you."
      />
      <HeroSection />
      <CategoryTiles />
      <Reveal><PetAdoptSection /></Reveal>
      <Reveal><AdoptionResources /></Reveal>
      <Reveal><PlanningAdopt /></Reveal>
      <Reveal><Articles /></Reveal>
      <Reveal><ShelterCta /></Reveal>
    </>
  );
};

export default HomePage;
