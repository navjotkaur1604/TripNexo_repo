import DestinationCard from './DestinationCard';

export default function DestinationGrid({ destinations = [] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {destinations.map((dest) => (
        <DestinationCard key={dest._id} destination={dest} />
      ))}
    </div>
  );
}
