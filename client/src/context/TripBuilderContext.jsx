import { createContext, useContext, useReducer } from 'react';

const TripBuilderContext = createContext(null);

const initialState = {
  editingTripId: null,
  tripName: 'Royal Rajasthan Circuit',
  startingCity: 'Jaipur',
  startDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  travellers: 2,
  children: 0,
  duration: 0,
  travelPace: 'balanced',
  interests: ['heritage', 'culture'],
  accommodationPreference: 'moderate',
  transportPreference: 'private_cab',
  targetBudget: 50000,
  notes: '',
  selectedDestinations: [],
};

function tripBuilderReducer(state, action) {
  switch (action.type) {
    case 'ADD_DESTINATION': {
      const dest = action.payload;
      if (state.selectedDestinations.some((d) => d._id === dest._id)) {
        return state;
      }
      const next = [
        ...state.selectedDestinations,
        {
          ...dest,
          customDays: dest.recommendedDays || 2,
        },
      ];
      return {
        ...state,
        selectedDestinations: next,
        duration: next.reduce((sum, item) => sum + (item.customDays || 2), 0),
      };
    }
    case 'REMOVE_DESTINATION': {
      const next = state.selectedDestinations.filter((d) => d._id !== action.payload);
      return {
        ...state,
        selectedDestinations: next,
        duration: next.reduce((sum, item) => sum + (item.customDays || 2), 0),
      };
    }
    case 'REORDER_DESTINATION': {
      const { index, direction } = action.payload;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= state.selectedDestinations.length) return state;
      const next = [...state.selectedDestinations];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return { ...state, selectedDestinations: next };
    }
    case 'SET_DESTINATION_DAYS': {
      const { id, days } = action.payload;
      const parsedDays = Math.max(1, Math.min(14, Number(days) || 1));
      const next = state.selectedDestinations.map((d) =>
        d._id === id ? { ...d, customDays: parsedDays } : d
      );
      return {
        ...state,
        selectedDestinations: next,
        duration: next.reduce((sum, item) => sum + (item.customDays || 2), 0),
      };
    }
    case 'UPDATE_FIELDS': {
      return { ...state, ...action.payload };
    }
    case 'LOAD_SAVED_TRIP': {
      const trip = action.payload;
      const destList = (trip.destinations || [])
        .map((entry) => {
          const doc = entry.destinationId;
          if (!doc || !doc._id) return null;
          return {
            ...doc,
            customDays: entry.customDays || doc.recommendedDays || 2,
          };
        })
        .filter(Boolean);

      return {
        ...initialState,
        editingTripId: trip._id,
        tripName: trip.tripName,
        startingCity: trip.startingCity || 'Jaipur',
        startDate: trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : initialState.startDate,
        travellers: trip.travellers || 2,
        children: trip.children || 0,
        duration: trip.duration || destList.reduce((s, d) => s + d.customDays, 0),
        travelPace: trip.travelPace || 'balanced',
        interests: trip.interests || ['heritage'],
        accommodationPreference: trip.accommodationPreference || 'moderate',
        transportPreference: trip.transportPreference || 'private_cab',
        targetBudget: trip.budget?.targetMax ?? 50000,
        notes: trip.notes || '',
        selectedDestinations: destList,
      };
    }
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function TripBuilderProvider({ children }) {
  const [state, dispatch] = useReducer(tripBuilderReducer, initialState);

  return (
    <TripBuilderContext.Provider value={{ state, dispatch }}>
      {children}
    </TripBuilderContext.Provider>
  );
}

export function useTripBuilder() {
  const ctx = useContext(TripBuilderContext);
  if (!ctx) throw new Error('useTripBuilder must be used inside TripBuilderProvider');
  return ctx;
}
