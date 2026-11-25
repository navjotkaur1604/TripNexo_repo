import { Link } from 'react-router-dom';
import { Calculator, Compass, Info, MapPin, Server } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
          About TripNexo
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
          Smart Travel Planning & Budget Estimation for Rajasthan
        </h1>
        <p className="text-base text-slate-300 leading-relaxed">
          TripNexo is a full-stack MERN travel-planning and cost-estimation platform engineered to
          simplify multi-destination itinerary design across Rajasthan, India.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-100 leading-relaxed">
          <strong>Important Planning Notice:</strong> TripNexo is strictly a travel planning and
          budget-estimation platform—not a booking engine. All accommodation, dining, transport, and
          sightseeing figures are indicative planning estimates in INR, not live vendor quotations.
        </p>
      </div>

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-6 space-y-2">
          <h2 className="text-lg font-bold text-white">Problem Statement</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Planning multi-city Rajasthan trips typically forces travellers to juggle dozens of blogs,
            manually guess transport units, and recalculate costs whenever group size or stay tiers
            change.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-6 space-y-2">
          <h2 className="text-lg font-bold text-white">Proposed Solution</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            TripNexo centralizes curated Rajasthan destinations in MongoDB, generates duplicate-free
            day-wise schedules in Express, applies unit-consistent budget formulas, maps coordinates
            on OpenStreetMap, and exports clean PDFs.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-6 space-y-4">
        <div className="flex items-center gap-2 text-amber-400">
          <Compass className="h-5 w-5" />
          <h2 className="text-lg font-bold text-white">How Itinerary Recommendations Work</h2>
        </div>
        <ul className="space-y-2 text-sm text-slate-300 list-disc pl-5">
          <li>Retrieves selected destinations and attractions directly from MongoDB.</li>
          <li>Allocates days proportionally using recommended durations, travel pace, or custom day overrides.</li>
          <li>Ranks attractions matching your chosen travel interests (heritage, wildlife, lakes, spiritual, culture).</li>
          <li>Assigns attractions into Morning, Afternoon, and Evening slots without duplicate recommendations.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-6 space-y-4">
        <div className="flex items-center gap-2 text-amber-400">
          <Calculator className="h-5 w-5" />
          <h2 className="text-lg font-bold text-white">How Budget Estimates Are Calculated</h2>
        </div>
        <ul className="space-y-2 text-sm text-slate-300 list-disc pl-5">
          <li><strong>Accommodation:</strong> Nightly room rate × rooms (up to 3 people/room) × nights.</li>
          <li><strong>Food:</strong> Daily per-person dining rate × effective travellers × days.</li>
          <li><strong>Transport:</strong> Public estimates scale per person; Private Cab and Self-Drive scale per vehicle (up to 4 people/vehicle).</li>
          <li><strong>Shared Safaris:</strong> Safari jeep estimates (e.g., Ranthambore, Sariska, Sam Dunes) divide by vehicle seating capacity.</li>
          <li><strong>Intercity Transport:</strong> Automatically estimated per person (public transit) or per vehicle (private cab / self-drive) based on your route legs.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-400">
          <MapPin className="h-5 w-5" />
          <h2 className="text-lg font-bold text-white">Geographical Scope & Technical Stack</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Covers 20 curated hubs across Dhundhar, Mewar, Marwar, Thar Desert, Hadoti, Mewat, and
          Shekhawati. Engineered with React, Vite, Tailwind CSS, Leaflet/OpenStreetMap, Express,
          MongoDB/Mongoose, Redis caching, API Gateway, Microservices, Docker, and GitHub Actions.
        </p>
        <div className="pt-2 flex flex-wrap gap-3">
          <Link
            to="/planner"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400"
          >
            <Server className="h-4 w-4" />
            Launch Smart Planner
          </Link>
        </div>
      </section>
    </div>
  );
}
