import { useState, useEffect } from 'react';

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
  const [country, setCountry] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountry = async () => {
      setLoading(true);
      setError(null);

      for (const endpoint of COUNTRY_API_ENDPOINTS) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(endpoint, {
            headers: {
              'Accept': 'application/json'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json() as CountryResponse;
          const countryName = data.country_name || data.country;

          if (countryName) {
            setCountry(countryName);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.warn(`Failed to fetch country from ${endpoint}:`, error);
          continue;
        }
      }

      setError('Could not determine location');
      setLoading(false);
    };

    fetchCountry();
  }, []);

  return { country, loading, error };
}