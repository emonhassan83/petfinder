import AddAdoptButton from "./AddAdoptButton";

//* Kept as a thin wrapper so the page API stays the same; auth state is read on the client.
export default function AdoptionButtonWrapper({
  petId,
  ownerId,
  acceptsApplications,
}: {
  petId: string;
  ownerId?: string;
  acceptsApplications?: boolean;
}) {
  return <AddAdoptButton petId={petId} ownerId={ownerId} acceptsApplications={acceptsApplications} />;
}
