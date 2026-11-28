import PetFrom from "@/components/Forms/PetForm";
import PetInput from "@/components/Forms/PetInput";
import PetSelectField from "@/components/Forms/PetSelectField";
import PetModal from "@/components/Shared/PetModal/PetModal";
import { Button, Grid } from "@mui/material";
import { FieldValues } from "react-hook-form";
import { useAdminUpdatePetMutation } from "@/redux/api/adminApi";
import { runMutation } from "@/utils/dashboardHelpers";
import { toast } from "sonner";
import { colorOptions, genderOptions, healthOptions, sizeOptions } from "@/components/Shared/SelectOptions/SelectOptions";


type TProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data: any;
};

const UpdatePetModal = ({ open, setOpen, data }: TProps) => {
  const [updatePet] = useAdminUpdatePetMutation();

  const handleFormSubmit = async (values: FieldValues) => {
    //* Only fields the API accepts; empty optional text is dropped, lookup ids stay untouched
    const { status, ...rest } = values;
    const body: Record<string, any> = {};
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") body[k] = v;
    });
    body.age = Number(values.age);
    const r = await runMutation(updatePet({ id: data.id, body }), "Pet updated successfully!");
    if (r.ok) setOpen(false);
  };

  const defaultValues = {
    name: data?.name,
    status: data?.status,
    image: data?.image,
    species: data?.species,
    breed: data?.breed,
    color: data?.color,
    age: data?.age,
    gender: data?.gender,
    size: data?.size,
    location: data?.location,
    temperament: data?.temperament,
    healthStatus: data?.healthStatus,
    description: data?.description,
    medicalHistory: data?.medicalHistory,
    adoptionRequirements: data?.adoptionRequirements,
  };
  // console.log(data);

  return (
    <PetModal maxWidth="lg" open={open} setOpen={setOpen} title="Update A Pet">
      <PetFrom onSubmit={handleFormSubmit} defaultValues={defaultValues} >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <PetInput
              name="name"
              label="Pet Name"
              type="text"
              fullWidth={true}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <PetInput
              name="image"
              label="Image Url"
              type="text"
              fullWidth={true}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <PetInput
              name="species"
              label="Species"
              type="text"
              fullWidth={true}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <PetInput name="breed" label="Breed" type="text" fullWidth={true} />
          </Grid>
          <Grid item xs={12} md={4}>
            <PetSelectField
              name="color"
              label="Color"
              items={colorOptions}
              fullWidth={true}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <PetInput name="age" label="Age" type="text" fullWidth={true} />
          </Grid>
          <Grid item xs={12} md={4}>
            <PetSelectField
              name="gender"
              label="Gender"
              items={genderOptions}
              fullWidth={true}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <PetSelectField
              name="size"
              label="size"
              items={sizeOptions}
              fullWidth={true}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <PetInput
              name="location"
              label="Location"
              type="text"
              fullWidth={true}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <PetInput
              name="temperament"
              label="Temperament"
              type="text"
              fullWidth={true}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <PetSelectField
              name="healthStatus"
              label="Health Status"
              items={healthOptions}
              fullWidth={true}
            />
          </Grid>
          <Grid item xs={12}>
            <PetInput
              name="description"
              label="Description"
              type="text"
              multiline
              rows={3}
              fullWidth={true}
            />
          </Grid>
          <Grid item xs={12}>
            <PetInput
              name="medicalHistory"
              label="Medical History"
              type="text"
              multiline
              rows={3}
              fullWidth={true}
            />
          </Grid>
          <Grid item xs={12}>
            <PetInput
              name="adoptionRequirements"
              label="Adoption Requirements"
              type="text"
              multiline
              rows={3}
              fullWidth={true}
            />
          </Grid>
        </Grid>

        <Button
          fullWidth={true}
          sx={{
            margin: "10px 0",
          }}
          type="submit"
        >
          Update A Pet
        </Button>
      </PetFrom>
    </PetModal>
  );
};

export default UpdatePetModal;
