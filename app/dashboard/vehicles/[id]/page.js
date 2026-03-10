import { VehicleDetails } from './vehicle-details';

export default async function VehicleDetailsPage({ params }) {
  const { id } = await params;
  return <VehicleDetails id={id} />;
}
