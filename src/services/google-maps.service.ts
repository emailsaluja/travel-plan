export interface DistanceInfo {
  distance: string;
  duration: string;
}

export class GoogleMapsService {
  private static placesService: google.maps.places.PlacesService | null = null;
  private static autocompleteService: google.maps.places.AutocompleteService | null = null;
  private static mapDiv: HTMLDivElement | null = null;

  public static getPlacesService(): google.maps.places.PlacesService {
    if (!this.placesService) {
      if (!this.mapDiv) {
        this.mapDiv = document.createElement('div');
        // Use a basic div without MapBox - Google Places API only needs a DOM element
        const map = new google.maps.Map(this.mapDiv, {
          center: { lat: 0, lng: 0 },
          zoom: 1,
          disableDefaultUI: true,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        this.placesService = new google.maps.places.PlacesService(map);
      } else {
        this.placesService = new google.maps.places.PlacesService(this.mapDiv);
      }
    }
    return this.placesService;
  }

  public static getAutocompleteService(): google.maps.places.AutocompleteService {
    if (!this.autocompleteService) {
      this.autocompleteService = new google.maps.places.AutocompleteService();
    }
    return this.autocompleteService;
  }

  // Clean up method
  public static cleanup() {
    this.placesService = null;
    this.autocompleteService = null;
    if (this.mapDiv) {
      this.mapDiv.remove();
      this.mapDiv = null;
    }
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