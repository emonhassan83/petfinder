import PetFrom from "@/components/Forms/PetForm";
import PetInput from "@/components/Forms/PetInput";
import PetSelectField from "@/components/Forms/PetSelectField";
import PetModal from "@/components/Shared/PetModal/PetModal";
import { useUpdateAdoptionRequestMutation } from "@/redux/api/adoptionApi";
import { Button, Grid } from "@mui/material";
import { FieldValues } from "react-hook-form";
import { toast } from "sonner";

type TProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data: any;
};

const opinionOptions = ["YES", "NO"];
const AnimalSleepOptions = ["Outdoor", "Indoor", "Room", "Garage", "Crate"];

//* PUT /adoption-requests/:id accepts the answers only (applicant, PENDING only)
const answerKeys = [
  "petsHousehold",
  "petsNeutered",
  "secureOutdoorArea",
  "animalSleep",
  "animalAlonePeriodsTime",
  "detailsSupport",
  "petOwnershipExperience",
];

const UpdateAdoptRequestModal = ({ open, setOpen, data }: TProps) => {
  const [updateAdoptionRequest, { isLoading }] = useUpdateAdoptionRequestMutation();

  const handleFormSubmit = async (values: FieldValues) => {
    const body = Object.fromEntries(answerKeys.filter((k) => values[k]).map((k) => [k, values[k]]));
    try {
      await updateAdoptionRequest({ id: data.id, body }).unwrap();
      toast.success("Application updated");
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Could not update the application");
    }
  };

  const defaultValues = {
    petsNeutered: data?.petsNeutered,
    secureOutdoorArea: data?.secureOutdoorArea,
    animalSleep: data?.animalSleep,
    animalAlonePeriodsTime: data?.animalAlonePeriodsTime,
    petsHousehold: data?.petsHousehold,
    petOwnershipExperience: data?.petOwnershipExperience,
    detailsSupport: data?.detailsSupport,
  };

  return (
    <PetModal maxWidth="lg" open={open} setOpen={setOpen} title="Edit your application">
      <PetFrom onSubmit={handleFormSubmit} defaultValues={defaultValues}>
        <Grid container spacing={2} my={1}>
          <Grid item sm={12} md={6}>
            <PetSelectField name="petsNeutered" label="Are other pets neutered?" items={opinionOptions} />
          </Grid>
          <Grid item sm={12} md={6}>
            <PetSelectField name="secureOutdoorArea" label="Do you have a secure outdoor area?" items={opinionOptions} />
          </Grid>
          <Grid item sm={12} md={6}>
            <PetSelectField name="animalSleep" label="Where will the animal sleep at night?" items={AnimalSleepOptions} />
          </Grid>
          <Grid item sm={12} md={6}>
            <PetSelectField
              name="animalAlonePeriodsTime"
              label="Will the animal be left alone for long periods of time?"
              items={opinionOptions}
            />
          </Grid>
          <Grid item xs={12}>
            <PetInput
              name="petsHousehold"
              label="Details of other pets in household"
              type="text"
              multiline
              rows={3}
              fullWidth={true}
            />
          </Grid>
          <Grid item xs={12}>
            <PetInput
              name="petOwnershipExperience"
              label="Do you have any pet ownership experience?"
              type="text"
              multiline
              rows={3}
              fullWidth={true}
            />
          </Grid>
          <Grid item xs={12}>
            <PetInput
              name="detailsSupport"
              label="Any other details to support your application?"
              type="text"
              multiline
              rows={3}
              fullWidth={true}
            />
          </Grid>
        </Grid>

        <Button fullWidth={true} sx={{ margin: "10px 0" }} type="submit" disabled={isLoading}>
          Save changes
        </Button>
      </PetFrom>
    </PetModal>
  );
};

export default UpdateAdoptRequestModal;
