import { useEffect } from 'react';
import { useGuestStore } from '../stores/useGuestStore';

const COUNTRY_API_ENDPOINTS = [
  'https://ipapi.co/json/',
  'https://ip-api.com/json/',
  'https://ipinfo.io/json'
];

interface CountryResponse {
  country_name?: string;
  country?: string;
}

export function useCountry() {
  const { country, setCountry } = useGuestStore();

  useEffect(() => {
    if (country) return; // Already fetched and persisted

    const fetchCountry = async () => {
      for (const endpoint of COUNTRY_API_ENDPOINTS) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(endpoint, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) continue;

          const data = await response.json() as CountryResponse;
          const countryName = data.country_name || data.country;

          if (countryName) {
            setCountry(countryName);
            return;
          }
        } catch {
          continue;
        }
      }
    };

    fetchCountry();
  }, [country, setCountry]);

  return { country };
}
