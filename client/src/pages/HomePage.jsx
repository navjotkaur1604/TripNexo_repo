import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calculator,
  CalendarRange,
  Compass,
  FileDown,
  MapPin,
  Route,
  Wallet,
} from 'lucide-react';
import { destinationAPI } from '../services/api';
import SearchBar from '../components/SearchBar';
import DestinationGrid from '../components/DestinationGrid';
import SafeImage from '../components/SafeImage';
import { CardSkeletonGrid } from '../components/LoadingSpinner';

const EXPERIENCES = [
  {
    title: 'Royal Heritage & Forts',
    interest: 'heritage',
    place: 'Jaipur · Jodhpur · Chittorgarh',
    caption: 'Walk sandstone ramparts, quiet stepwells, and hilltop citadels before the midday heat.',
    image:
      'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
    spanClass: 'lg:col-span-3',
  },
  {
    title: 'Lakes & Marble Palaces',
    interest: 'lake',
    place: 'Udaipur · Pushkar · Mount Abu',
    caption: 'Slow mornings beside Aravalli water, evening ghat bells, and late boat rides across Pichola.',
    image:
      'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=1200&q=80',
    spanClass: 'lg:col-span-3',
  },
  {
    title: 'Thar Desert & Dunes',
    interest: 'adventure',
    place: 'Jaisalmer · Barmer',
    caption: 'Golden sandstone lanes by day and open Sam and Mahabar dunes under clear desert skies.',
    image:
      'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1000&q=80',
    spanClass: 'lg:col-span-2',
  },
  {
    title: 'Wildlife & Birding',
    interest: 'wildlife',
    place: 'Ranthambore · Sariska · Bharatpur',
    caption: 'Dawn gypsy safaris through dry forest trails and quiet cycling paths past wetland flocks.',
    image:
      'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1000&q=80',
    spanClass: 'lg:col-span-2',
  },
  {
    title: 'Living Culture & Bazaars',
    interest: 'culture',
    place: 'Mandawa · Bundi · Nathdwara',
    caption: 'Painted Shekhawati havelis, pichwai workshops, folk evenings, and spice-lined old markets.',
    image:
      'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1000&q=80',
    spanClass: 'lg:col-span-2',
  },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Pick your cities & pace',
    text: 'Shortlist destinations by region, season, or travel mood, and decide whether your group prefers unhurried mornings or full sightseeing days.',
  },
  {
    step: '02',
    title: 'Shape a day-by-day route',
    text: 'TripNexo builds morning, afternoon, and evening slots without repeating places—and lets you reorder cities or rewrite any day on the spot.',
  },
  {
    step: '03',
    title: 'Check the numbers & save',
    text: 'See realistic rupee ranges for rooms, food, local rides, intercity legs, and safaris, inspect the map route, and download a clean PDF.',
  },
];

const SAMPLE_DAY = [
  { slot: 'Morning', title: 'Amber Fort & Sheesh Mahal', detail: 'Beat the midday heat on the hillside ramparts' },
  { slot: 'Afternoon', title: 'City Palace & Jantar Mantar', detail: 'Walled-city courtyards and astronomical instruments' },
  { slot: 'Evening', title: 'Nahargarh Ridge Sunset', detail: 'Overlook the Pink City lights before Johari Bazaar' },
];

const BUDGET_UNITS = [
  { category: 'Accommodation', rule: 'Nightly room rate × rooms (up to 3/room) × nights' },
  { category: 'Food & Dining', rule: 'Daily meal tier × adults & children × trip days' },
  { category: 'Local & Intercity Travel', rule: 'Per person on rail/bus, or per vehicle (up to 4/cab)' },
  { category: 'Activities & Safaris', rule: 'Pace-adjusted entry fees + shared jeep capacity' },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    destinationAPI
      .list({ featured: 'true', limit: 6 })
      .then((res) => setFeatured(res.destinations || []))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  const handleHeroSearch = (q) => {
    navigate(q.trim() ? `/explore?search=${encodeURIComponent(q.trim())}` : '/explore');
  };

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-[#070B14]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 animate-fade-up">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                <Compass className="h-3.5 w-3.5" />
                <span>Jaipur · Udaipur · Jodhpur · Jaisalmer</span>
              </div>

              <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.5rem] leading-[1.08]">
                Trace Rajasthan’s forts, lakes, and desert skies—at your own pace.
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                Deciding how many days Udaipur really needs, or whether a private cab makes more sense
                than trains for four friends, shouldn’t take twenty open tabs. Sketch your route, see
                honest rupee estimates, and keep every day in one calm workspace.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  to="/planner"
                  className="inline-flex items-center gap-2.5 rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-400"
                >
                  Start Planning Your Trip
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/budget"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-3.5 text-sm font-semibold text-slate-200 transition-colors hover:border-amber-500/50 hover:text-white"
                >
                  <Calculator className="h-4 w-4 text-amber-400" />
                  Estimate Trip Cost
                </Link>
              </div>

              <div className="mt-7 max-w-xl">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSubmit={handleHeroSearch}
                  placeholder="Where are you headed? Try Jaipur, Udaipur, wildlife..."
                  buttonLabel="Explore"
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  20 curated Rajasthan hubs
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Duplicate-free day schedules
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Unit-based INR cost breakdowns
                </span>
              </div>
            </div>

            {/* Editorial Photography Collage */}
            <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: '80ms' }}>
              <div className="grid grid-cols-12 gap-3.5">
                <Link
                  to="/destination/jaipur"
                  className="group relative col-span-12 sm:col-span-7 lg:col-span-7 h-72 sm:h-96 overflow-hidden rounded-2xl border border-slate-800/90"
                >
                  <SafeImage
                    src="https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80"
                    alt="Hawa Mahal in Jaipur, Rajasthan"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                      Dhundhar
                    </p>
                    <p className="font-display text-lg font-bold text-white">Jaipur</p>
                  </div>
                </Link>

                <div className="col-span-12 sm:col-span-5 lg:col-span-5 grid grid-cols-2 sm:grid-cols-1 gap-3.5">
                  <Link
                    to="/destination/udaipur"
                    className="group relative h-44 sm:h-[185px] overflow-hidden rounded-2xl border border-slate-800/90"
                  >
                    <SafeImage
                      src="https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=900&q=80"
                      alt="Lake Pichola and City Palace in Udaipur"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                        Mewar
                      </p>
                      <p className="font-display text-base font-bold text-white">Udaipur</p>
                    </div>
                  </Link>

                  <Link
                    to="/destination/jaisalmer"
                    className="group relative h-44 sm:h-[185px] overflow-hidden rounded-2xl border border-slate-800/90"
                  >
                    <SafeImage
                      src="https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=900&q=80"
                      alt="Sandstone fort and Thar desert in Jaisalmer"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                        Thar Desert
                      </p>
                      <p className="font-display text-base font-bold text-white">Jaisalmer</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-9">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
              Start With a Classic
            </p>
            <h2 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold text-white">
              Featured Destinations
            </h2>
            <p className="mt-2 text-sm text-slate-400 max-w-xl">
              From pink sandstone bazaars to quiet lakefront havelis—add any stop straight into your
              trip builder.
            </p>
          </div>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2.5 text-sm font-semibold text-amber-400 transition-colors hover:border-amber-500/40 hover:text-amber-300"
          >
            Browse all 20 destinations
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? <CardSkeletonGrid count={6} /> : <DestinationGrid destinations={featured} />}
      </section>

      {/* Travel Experiences */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-9 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
            Browse by Mood
          </p>
          <h2 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold text-white">
            Five ways to experience Rajasthan
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Every region carries its own rhythm. Pick what draws you most and explore places that fit.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {EXPERIENCES.map((exp) => (
            <Link
              key={exp.interest}
              to={`/explore?interest=${exp.interest}`}
              className={`group relative flex min-h-[250px] flex-col justify-end overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 ${exp.spanClass}`}
            >
              <SafeImage
                src={exp.image}
                alt={exp.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/15" />

              <div className="relative p-6">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                  {exp.place}
                </span>
                <h3 className="mt-1 font-display text-xl font-bold text-white">{exp.title}</h3>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                  {exp.caption}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 transition-transform duration-200 group-hover:translate-x-1">
                  Explore {exp.interest}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How TripNexo Works */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-800/90 bg-slate-900/50 p-7 sm:p-11">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                How TripNexo Works
              </p>
              <h2 className="mt-1.5 font-display text-3xl font-bold text-white">
                Three calm steps from a rough idea to a ready itinerary
              </h2>
            </div>
            <Link
              to="/planner"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400 hover:text-amber-300"
            >
              Try the planner now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative grid gap-8 md:grid-cols-3">
            <div
              className="hidden md:block absolute top-6 left-[10%] right-[10%] h-px bg-slate-800"
              aria-hidden="true"
            />
            {WORKFLOW_STEPS.map((item) => (
              <div key={item.step} className="relative">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/35 bg-[#070B14] font-display text-lg font-bold text-amber-400">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personalized Planning & Budget Estimation */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 items-start">
          {/* Itinerary Planning Explanation + Sample Day */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                Personalized Itineraries
              </p>
              <h2 className="mt-1.5 font-display text-3xl font-bold text-white">
                Schedules paced for real people, not checklists
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Tell TripNexo whether you travel relaxed, balanced, or packed, and what you care
                about—heritage forts, wildlife safaris, lakeside walks, or local craft markets. Days
                are divided proportionally across your stops without repeating the same monument twice,
                and every slot stays editable after saving.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                  <CalendarRange className="h-4 w-4" />
                  <span>Sample Day 1 · Jaipur (Balanced Pace)</span>
                </div>
                <span className="text-[11px] text-slate-400">Editable anytime</span>
              </div>
              <div className="space-y-3">
                {SAMPLE_DAY.map((entry) => (
                  <div key={entry.slot} className="flex items-start gap-3">
                    <span className="w-20 shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {entry.slot}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{entry.title}</p>
                      <p className="text-xs text-slate-400">{entry.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                Live OpenStreetMap route view
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileDown className="h-3.5 w-3.5 text-amber-400" />
                Offline PDF itinerary export
              </span>
            </div>
          </div>

          {/* Transparent Budget Estimation */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                Transparent Budget Math
              </p>
              <h2 className="mt-1.5 font-display text-3xl font-bold text-white">
                Honest rupee estimates before you book a single thing
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Instead of throwing out a vague per-person guess, TripNexo prices each part of your
                trip using the unit it actually follows—rooms per night, meals per traveller, cabs by
                vehicle count, automatic intercity legs between cities, and shared safari jeeps.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/75 divide-y divide-slate-800/80">
              {BUDGET_UNITS.map((item) => (
                <div key={item.category} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-5 py-3.5">
                  <span className="text-sm font-semibold text-white">{item.category}</span>
                  <span className="text-xs text-slate-400">{item.rule}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/budget"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400"
              >
                <Wallet className="h-4 w-4" />
                Open Budget Calculator
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500"
              >
                Read Methodology
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-3xl border border-amber-500/25 bg-slate-900/70 px-7 py-9 sm:px-10">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Ready to put your Rajasthan route together?
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Pick two cities or five, compare stay tiers, and leave with a schedule you can
              actually travel by.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/planner"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-colors hover:bg-amber-400"
            >
              Launch Trip Planner
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/map"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-amber-500/40"
            >
              <Route className="h-4 w-4 text-amber-400" />
              Explore Map
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
