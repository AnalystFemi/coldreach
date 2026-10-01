export interface TimezoneResolution {
  iana: string;
  localTimeFormatted: string;
  hour: number;
  minute: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  isInSendWindow: boolean;
  windowStatus: string;
}

export function resolveTimezone(city: string, country: string): string {
  const cCity = (city || '').toLowerCase();
  const cCountry = (country || '').toLowerCase();

  // 1. UK & Ireland
  if (
    cCountry.includes('united kingdom') ||
    cCountry.includes('uk') ||
    cCountry.includes('great britain') ||
    cCity.includes('london') ||
    cCity.includes('manchester') ||
    cCity.includes('birmingham') ||
    cCity.includes('leeds') ||
    cCity.includes('glasgow') ||
    cCity.includes('edinburgh')
  ) {
    return 'Europe/London';
  }

  if (cCountry.includes('ireland') || cCity.includes('dublin')) {
    return 'Europe/Dublin';
  }

  // 2. UAE
  if (
    cCountry.includes('emirates') ||
    cCountry.includes('uae') ||
    cCity.includes('dubai') ||
    cCity.includes('abu dhabi') ||
    cCity.includes('sharjah')
  ) {
    return 'Asia/Dubai';
  }

  // 3. Australia
  if (
    cCountry.includes('australia') ||
    cCity.includes('sydney') ||
    cCity.includes('melbourne') ||
    cCity.includes('brisbane') ||
    cCity.includes('adelaide')
  ) {
    if (cCity.includes('perth')) return 'Australia/Perth';
    return 'Australia/Sydney';
  }

  // 4. Canada
  if (cCountry.includes('canada')) {
    if (cCity.includes('vancouver')) return 'America/Vancouver';
    if (cCity.includes('calgary') || cCity.includes('edmonton')) return 'America/Edmonton';
    return 'America/Toronto';
  }

  // 5. Germany & Central Europe
  if (
    cCountry.includes('germany') ||
    cCountry.includes('deutschland') ||
    cCountry.includes('switzerland') ||
    cCity.includes('berlin') ||
    cCity.includes('munich') ||
    cCity.includes('frankfurt') ||
    cCity.includes('zurich')
  ) {
    return 'Europe/Berlin';
  }

  // 6. Singapore
  if (cCountry.includes('singapore') || cCity.includes('singapore')) {
    return 'Asia/Singapore';
  }

  // 7. USA (Default by major regions)
  if (
    cCity.includes('los angeles') ||
    cCity.includes('san francisco') ||
    cCity.includes('seattle') ||
    cCity.includes('san diego') ||
    cCity.includes('las vegas') ||
    cCity.includes('portland') ||
    cCity.includes(', ca') ||
    cCity.includes(', wa') ||
    cCity.includes(', nv') ||
    cCity.includes(', or')
  ) {
    return 'America/Los_Angeles';
  }

  if (
    cCity.includes('denver') ||
    cCity.includes('phoenix') ||
    cCity.includes('salt lake') ||
    cCity.includes(', co') ||
    cCity.includes(', az') ||
    cCity.includes(', ut')
  ) {
    return 'America/Denver';
  }

  if (
    cCity.includes('dallas') ||
    cCity.includes('houston') ||
    cCity.includes('austin') ||
    cCity.includes('chicago') ||
    cCity.includes('san antonio') ||
    cCity.includes('minneapolis') ||
    cCity.includes(', tx') ||
    cCity.includes(', il') ||
    cCity.includes(', mn')
  ) {
    return 'America/Chicago';
  }

  // Default Eastern US (New York, Miami, Atlanta, etc.)
  return 'America/New_York';
}

export function checkTimezoneSendWindow(iana: string): TimezoneResolution {
  const now = new Date();

  // Get local hour, minute, and weekday
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: iana,
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
    weekday: 'short',
  });

  const parts = formatter.formatToParts(now);
  const hourPart = parts.find((p) => p.type === 'hour');
  const minutePart = parts.find((p) => p.type === 'minute');
  const weekdayPart = parts.find((p) => p.type === 'weekday');

  const hour = hourPart ? parseInt(hourPart.value, 10) : 12;
  const minute = minutePart ? parseInt(minutePart.value, 10) : 0;

  // Day of week check
  const weekdayStr = weekdayPart ? weekdayPart.value.toLowerCase() : '';
  const isWeekend = weekdayStr === 'sat' || weekdayStr === 'sun';

  // Format nice display time: e.g. "10:24 AM (Thu)"
  const displayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: iana,
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    weekday: 'short',
  });
  const localTimeFormatted = displayFormatter.format(now);

  // Send window: Monday-Friday, 9:00 AM - 11:30 AM or 1:30 PM - 4:30 PM
  let isInSendWindow = false;
  let windowStatus = '';

  if (isWeekend) {
    isInSendWindow = false;
    windowStatus = 'Weekend (Paused)';
  } else if (hour >= 9 && (hour < 11 || (hour === 11 && minute <= 30))) {
    isInSendWindow = true;
    windowStatus = 'Morning Prime Window (9:00 - 11:30 AM)';
  } else if (hour >= 13 && minute >= 30 && hour < 16) {
    isInSendWindow = true;
    windowStatus = 'Afternoon Window (1:30 - 4:00 PM)';
  } else if (hour < 9) {
    isInSendWindow = false;
    windowStatus = 'Before Business Hours (< 9:00 AM)';
  } else {
    isInSendWindow = false;
    windowStatus = 'After Business Hours (> 4:30 PM)';
  }

  return {
    iana,
    localTimeFormatted,
    hour,
    minute,
    dayOfWeek: now.getDay(),
    isInSendWindow,
    windowStatus,
  };
}
