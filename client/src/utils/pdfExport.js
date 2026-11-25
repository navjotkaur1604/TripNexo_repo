import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './formatters';

function pdfINR(amount) {
  return `INR ${Math.round(Number(amount) || 0).toLocaleString('en-IN')}`;
}

/**
 * Generates and downloads a clean, evaluator-ready TripNexo PDF itinerary & budget report.
 */
export function exportTripToPDF(trip) {
  if (!trip) return;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(11, 17, 32);
  doc.rect(0, 0, pageWidth, 88, 'F');
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('TripNexo — Rajasthan Smart Travel Plan', 40, 38);

  doc.setTextColor(226, 232, 240);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(trip.tripName || 'Untitled Trip', 40, 62);
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Indicative Planning & Budget Estimate (Non-Booking Platform)', 40, 76);

  // Trip Overview Metadata
  let y = 112;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Trip Summary', 40, y);

  const destNames = (trip.destinations || [])
    .map((d) => d.destinationId?.name || d.name || '')
    .filter(Boolean)
    .join(' -> ');

  autoTable(doc, {
    startY: y + 8,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [30, 41, 59], textColor: [248, 250, 252] },
    body: [
      ['Starting City', trip.startingCity || 'Jaipur', 'Start Date', formatDate(trip.startDate)],
      [
        'Travellers',
        `${trip.travellers || 1} Adult(s), ${trip.children || 0} Child(ren)`,
        'Duration',
        `${trip.duration || trip.itinerary?.length || 1} Day(s)`,
      ],
      [
        'Preferences',
        `${trip.accommodationPreference || 'moderate'} stay / ${(trip.transportPreference || 'private_cab').replace('_', ' ')}`,
        'Pace',
        trip.travelPace || 'balanced',
      ],
      ['Route', destNames || 'Rajasthan', 'Total Est.', `${pdfINR(trip.estimatedCost?.min)} - ${pdfINR(trip.estimatedCost?.max)}`],
    ],
  });

  // Budget Breakdown Table
  y = doc.lastAutoTable.finalY + 22;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Budget Breakdown (Indicative INR)', 40, y);

  const breakdown = trip.estimatedCost?.breakdown || {};
  const budgetRows = [
    ['Accommodation', pdfINR(breakdown.accommodation?.min), pdfINR(breakdown.accommodation?.max)],
    ['Food & Dining', pdfINR(breakdown.food?.min), pdfINR(breakdown.food?.max)],
    ['Local Transport', pdfINR(breakdown.localTransport?.min), pdfINR(breakdown.localTransport?.max)],
    ['Intercity Transport', pdfINR(breakdown.intercityTransport?.min), pdfINR(breakdown.intercityTransport?.max)],
    ['Activities & Sightseeing', pdfINR(breakdown.activities?.min), pdfINR(breakdown.activities?.max)],
    [
      'TOTAL ESTIMATED EXPENDITURE',
      pdfINR(trip.estimatedCost?.min),
      pdfINR(trip.estimatedCost?.max),
    ],
    [
      'Per-Person Estimate',
      pdfINR(trip.estimatedCost?.perPersonMin),
      pdfINR(trip.estimatedCost?.perPersonMax),
    ],
  ];

  autoTable(doc, {
    startY: y + 8,
    head: [['Category', 'Minimum Estimate', 'Maximum Estimate']],
    body: budgetRows,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255] },
  });

  // Day-wise Itinerary
  y = doc.lastAutoTable.finalY + 24;
  if (y > 700) {
    doc.addPage();
    y = 44;
  }
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Day-Wise Itinerary', 40, y);

  const dayRows = (trip.itinerary || []).map((day) => {
    const formatSlot = (items = []) => items.map((i) => i.title).join(', ') || 'Free time';
    return [
      `Day ${day.dayNumber}\n${formatDate(day.date)}`,
      day.destinationName || 'Rajasthan',
      `Morning: ${formatSlot(day.activities?.morning)}\nAfternoon: ${formatSlot(day.activities?.afternoon)}\nEvening: ${formatSlot(day.activities?.evening)}`,
      `${pdfINR(day.estimatedCost?.min)} - ${pdfINR(day.estimatedCost?.max)}`,
    ];
  });

  autoTable(doc, {
    startY: y + 8,
    head: [['Day / Date', 'Destination', 'Schedule & Attractions', 'Est. Day Cost']],
    body: dayRows,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 6, overflow: 'linebreak' },
    headStyles: { fillColor: [15, 23, 42], textColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 72 },
      1: { cellWidth: 80 },
      2: { cellWidth: 270 },
      3: { cellWidth: 90 },
    },
  });

  const safeSlug = String(trip.tripName || 'tripnexo-itinerary')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  doc.save(`${safeSlug}.pdf`);
}
