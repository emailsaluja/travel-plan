import { useEffect, useState } from 'react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_LIBRARIES = ['places'];
const SCRIPT_ID = 'google-maps-script';

export const useGoogleMapsScript = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if script is already loaded
    if (document.getElementById(SCRIPT_ID)) {
      setIsLoaded(true);
      return;
    }

    if (!window.google) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;  // Add an ID to the script
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=${GOOGLE_MAPS_LIBRARIES.join(',')}`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
    }

    // Cleanup function
    return () => {
      // Optional: Remove script on component unmount if needed
      // const script = document.getElementById(SCRIPT_ID);
      // if (script) script.remove();
    };
  }, []);

  return isLoaded;
}; 