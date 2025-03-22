export interface DistanceInfo {
  distance: string;
  duration: string;
}

class GoogleMapsServiceClass {
  private static instance: GoogleMapsServiceClass;
  private placesService: google.maps.places.PlacesService | null = null;
  private autocompleteService: google.maps.places.AutocompleteService | null = null;
  private dummyMap: google.maps.Map | null = null;

  private constructor() { }

  public static getInstance(): GoogleMapsServiceClass {
    if (!GoogleMapsServiceClass.instance) {
      GoogleMapsServiceClass.instance = new GoogleMapsServiceClass();
    }
    return GoogleMapsServiceClass.instance;
  }

  public initializeServices(): void {
    if (window.google && !this.placesService) {
      // Create a dummy map element (required by Places API)
      const mapDiv = document.createElement('div');
      this.dummyMap = new google.maps.Map(mapDiv);
      this.placesService = new google.maps.places.PlacesService(this.dummyMap);
      this.autocompleteService = new google.maps.places.AutocompleteService();
      console.log('Google Maps services initialized');
    }
  }

  public getPlacesService(): google.maps.places.PlacesService {
    if (!this.placesService) {
      this.initializeServices();
    }
    return this.placesService!;
  }

  public getAutocompleteService(): google.maps.places.AutocompleteService {
    if (!this.autocompleteService) {
      this.initializeServices();
    }
    return this.autocompleteService!;
  }

  async getDistanceAndDuration(origin: string, destination: string): Promise<DistanceInfo> {
    return new Promise((resolve, reject) => {
      const service = new google.maps.DistanceMatrixService();

      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
        },
        (response, status) => {
          if (status === 'OK' && response) {
            const element = response.rows[0].elements[0];
            if (element.status === 'OK') {
              resolve({
                distance: element.distance.text,
                duration: element.duration.text,
              });
            } else {
              resolve({
                distance: 'N/A',
                duration: 'N/A',
              });
            }
          } else {
            console.error('Error fetching distance and duration:', status);
            resolve({
              distance: 'N/A',
              duration: 'N/A',
            });
          }
        }
      );
    });
  }
}

export const GoogleMapsService = GoogleMapsServiceClass.getInstance(); 