export interface PublicHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

export class HolidayService {
  private static cache: Map<string, PublicHoliday[]> = new Map();

  /**
   * Fetches the public holidays for a given year in the US.
   * If the API call fails, it gracefully falls back to an empty array so as to not block reservation creation.
   */
  static async getHolidays(year: number): Promise<PublicHoliday[]> {
    const cacheKey = `US-${year}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      console.log(`[HolidayService] Fetching holidays from Nager.Date API for year ${year}`);
      const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/US`);
      
      if (!response.ok) {
        throw new Error(`Nager.Date API responded with status: ${response.status}`);
      }

      const holidays = (await response.json()) as PublicHoliday[];
      this.cache.set(cacheKey, holidays);
      return holidays;
    } catch (error) {
      console.error(`[HolidayService] Failed to fetch holidays for ${year}. Defaulting to no holidays. Error:`, error);
      // Fulfilling Phase 2 requirement: "succeed with a warning"
      return [];
    }
  }

  /**
   * Checks if a given date string (YYYY-MM-DD) or Date object falls on a public holiday.
   * Returns the holiday name if it does, or null if it doesn't.
   */
  static async getHolidayWarningForDate(dateInput: string | Date): Promise<string | null> {
    const date = new Date(dateInput);
    
    // Ensure date is valid
    if (isNaN(date.getTime())) return null;

    const year = date.getUTCFullYear();
    const holidays = await this.getHolidays(year);

    // Format date to YYYY-MM-DD for comparison with Nager.Date API output
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const matchedHoliday = holidays.find(h => h.date === dateString);
    
    if (matchedHoliday) {
      return `Warning: The selected date falls on a public holiday (${matchedHoliday.name}).`;
    }

    return null;
  }
}
