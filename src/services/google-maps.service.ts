export interface DistanceInfo {
  distance: string;
  duration: string;
}

export const GoogleMapsService = {
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
}; 