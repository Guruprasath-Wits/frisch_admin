import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { AdminService } from 'src/app/admin.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
declare const google: any;




export interface Order {
  type: string;
  id: number;
  order_id: string;
  user_id: number;
  delivery_date: string;
  price: string;
  tips: string;
  address: string;
  contact: string;
  instruction: string | null;
  status: string;
  gro_bag: string | null;
  mitt_bag: string | null;
  bagu_bag: string | null;
  driver_id: number;
  created_at: string;
  lat: string;   // <-- Add this
  lng: string;   // <-- Add this
  payment_status: string | null;
  zipcode: string;
  zusätzliche_tüte: string | null;
  ort: string;
  selected: boolean;
  distanceKm?: number
  distanceDiffKm?: number;
  estimatedTimeInMinutes?: number;  // optional

}

export interface Driver {
  id: number;
  role: string;
  username: string;
}

@Component({
  selector: 'app-order-processing',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './order-processing.component.html',
  styleUrls: ['./order-processing.component.scss'],
})
export class OrderProcessingComponent implements OnInit {
  Orders: Order[] = [];
  drivers: Driver[] = [];
  assignEnabled = false;
  selectedDriver: number | null = null;
  allOrdersMerged: Order[] = [];

  showSubscriptionOrders: boolean = false;
  selectedOrder: Order | null = null; // To store the selected order
  userLatitude: number = 51.5177192; // Sample latitude (User's location)
  userLongitude: number = 7.4179611;

  totalEstimatedTime: number = 0;
  isDriverDropdownOpen: boolean = false;


  // Search Fields
  searchZipcode: string = '';
  searchTerm = '';
  searchEmail = '';
  searchPhone = '';
  searchOrderId = '';
  searchStatus = '';
  searchDate = '';
  subscriptionOrders: Order[] = [];

  // Pagination
  page = 1;
  itemsPerPage = 50;

  constructor(private adminService: AdminService, private router: Router, private http: HttpClient) { }

  ngOnInit(): void {
    this.loadOrders();
    this.loadDrivers();
    this.loadSubsOrder();
    this.loadAllOrders();
  }


  loadOrders(): void {
    this.adminService.loadOrders().subscribe(
      (response: { orders: Order[] }) => {
        if (!response || !response.orders) {
          console.error('Invalid response:', response);
          return;
        }

        const referenceLat = 51.5177192;
        const referenceLng = 7.4179611;

        this.Orders = response.orders
          .filter(order => order.status?.toLowerCase() === 'processing')
          .map(order => {
            const distance = this.calculateDistance(referenceLat, referenceLng, Number(order.lat), Number(order.lng));
            const estimatedTime = this.getEstimatedTime(distance);

            return {
              ...order,
              driverName: this.getDriverName(order.driver_id),
              distance: distance,
              // estimatedTimeInMinutes: estimatedTime
            };
          })
          .sort((a, b) => a.distance - b.distance);

        console.log(this.Orders)

        // ✅ Store to new table
        const ordersToStore = this.Orders.map(order => {
          const { id, ...rest } = order;
          return { ...rest }; // Only fields except `id`
        });

        console.log('Orders to store (without ID):', ordersToStore);

        // this.adminService.storeProcessedOrders(ordersToStore).subscribe(
        //   res => console.log('Orders stored successfully', res),
        //   err => console.error('Error storing processed orders', err)
        // );
      },
      (error) => console.error('Error fetching Orders:', error)
    );
  }


  getDriverName(driverId: number): string {
    const driver = this.drivers.find((d) => d.id == driverId);
    return driver ? driver.username : 'Unassigned';
  }



  calculateChainedDistances(): void {
    const addressChain = [
      'Bäckerei Vorwerk, Höfkerstraße 38, 44149 Dortmund',
      'Lessingstraße 5, 44147 Dortmund, Germany',
      'Wellinghofer Str. 155, 44263 Dortmund, Germany',
      'Hörder Bahnhofstraße 81, 44263 Dortmund, Germany',
      'Am Ostentor 27, 58239 Schwerte, Germany',
      'Fliederweg 9, 68723 Schwetzingen, Germany'
    ];

    const service = new google.maps.DistanceMatrixService();
    const resultsArray: any[] = [];

    const getDistanceStep = (i: number) => {
      if (i >= addressChain.length - 1) {
        console.log('✅ Final results:', resultsArray);
        return;
      }

      const origin = addressChain[i];
      const destination = addressChain[i + 1];

      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC
        },
        (response: any, status: any) => {
          if (status !== 'OK' || !response.rows[0].elements[0]) {
            console.error(`❌ Failed to get distance from "${origin}" to "${destination}"`);
            resultsArray.push({
              from: origin,
              to: destination,
              distanceKm: 0,
              durationMin: 0
            });
          } else {
            const element = response.rows[0].elements[0];
            const distanceMeters = element.distance.value;
            const durationSeconds = element.duration.value;

            resultsArray.push({
              from: origin,
              to: destination,
              distanceKm: +(distanceMeters / 1000).toFixed(3),
              durationMin: Math.ceil(durationSeconds / 60)
            });

            console.log(`✅ From: ${origin} → ${destination}`);
            console.log(`   📍 Distance: ${(distanceMeters / 1000).toFixed(2)} km`);
            console.log(`   🕒 Time: ${Math.ceil(durationSeconds / 60)} minutes`);
          }

          // Move to next pair
          getDistanceStep(i + 1);
        }
      );
    };

    // Start chaining
    getDistanceStep(0);
  }

  loadOrdersWithDistance(): void {
    const selectedOrders = this.Orders?.filter((order: any) => order.selected);

    if (!selectedOrders || selectedOrders.length === 0) {
      alert('Please select at least one order to calculate distance and time.');
      return;
    }

    const validOrders = selectedOrders.filter((order: any) => {
      const hasValidLatLng = order.lat && order.lng &&
        !isNaN(Number(order.lat)) && !isNaN(Number(order.lng));
      if (!hasValidLatLng) {
        console.warn('Skipping invalid coordinates:', order.address);
      }
      return hasValidLatLng;
    });

    if (validOrders.length === 0) {
      alert('Selected orders have invalid location data.');
      return;
    }

    const origin = 'Bäckerei Vorwerk, Höfkerstraße 38, 44149 Dortmund';
    const destinations = validOrders.map(order =>
      new google.maps.LatLng(Number(order.lat), Number(order.lng))
    );

    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (distanceResponse: any, status: any) => {
        if (status !== 'OK' || !distanceResponse?.rows?.length) {
          console.error('❌ DistanceMatrixService failed:', status);
          return;
        }

        const elements = distanceResponse.rows[0].elements;

        validOrders.forEach((order, index) => {
          const element = elements[index];
          if (element.status === 'OK') {
            const distanceKm = +(element.distance.value / 1000).toFixed(2);
            const previousDistance = index > 0 ? Number(validOrders[index - 1]?.distanceKm ?? 0) : 0;
            const distanceDiffKm = +(distanceKm - previousDistance).toFixed(2);

            const currentHour = new Date().getHours();
            const isPeakHour = (currentHour >= 8 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 20);
            const averageSpeedKmph = isPeakHour ? 35 : 45;
            const estimatedTimeInMinutes = Math.ceil((distanceDiffKm / averageSpeedKmph) * 60);

            order.distanceKm = distanceKm;
            order.distanceDiffKm = distanceDiffKm;
            order.estimatedTimeInMinutes = estimatedTimeInMinutes;
          } else {
            order.distanceKm = 0;
            order.distanceDiffKm = 0;
            order.estimatedTimeInMinutes = 0;
          }
        });

        // Optional: force UI refresh
        this.Orders = [...this.Orders];

        console.log('✅ Distance & time calculated for selected orders:', selectedOrders);
      }
    );
  }





  loadSubsOrder(): void {
    this.adminService.loadSubsOrders().subscribe(
      (response: any) => {
        console.log('Subscription Orders API Response:', response);
        this.subscriptionOrders = response.subscribeData
          .filter((order: any) => {
            const status = (order.status || 'pending').toLowerCase();
            return status === 'processing' || status === 'assigned';
          })
          .map((order: any) => ({
            id: order.id,
            user_id: order.user_id,
            order_id: order.order_id,
            price: order.price,
            delivery_date: order.delivery_date,
            address: order.address,
            contact: order.contact,
            instruction: order.instruction,
            status: order.status || 'pending',
            tips: order.tips
          }));
      },
      (error) => {
        console.error('Error fetching Subscription Orders:', error);
      }
    );
  }


  loadAllOrders(): void {
    const referenceLat = 51.5177192;
    const referenceLng = 7.4179611;

    forkJoin({
      normalOrders: this.adminService.loadOrders().pipe(
        catchError((error) => {
          console.error('Error loading normal orders:', error);
          return of({ orders: [] }); // fallback to empty array
        })
      ),
      subsOrders: this.adminService.loadSubsOrders().pipe(
        catchError((error) => {
          console.error('Error loading subscription orders:', error);
          return of({ subscribeData: [] }); // fallback to empty array
        })
      )
    }).subscribe(
      ({ normalOrders, subsOrders }: any) => {
        const processedNormalOrders = (normalOrders.orders || [])
          .filter((order: any) => order.status?.toLowerCase() === 'processing')
          .map((order: any) => {
            const distance = this.calculateDistance(referenceLat, referenceLng, Number(order.lat), Number(order.lng));
            const estimatedTime = this.getEstimatedTime(distance);

            return {
              ...order,
              driverName: this.getDriverName(order.driver_id),
              distance,
              type: 'normal'
            };
          });

        const processedSubscriptionOrders = (subsOrders.subscribeData || [])
          .filter((order: any) => {
            const status = (order.status || '').toLowerCase();
            return status === 'processing';
          })
          .map((order: any) => {
            const distance = this.calculateDistance(referenceLat, referenceLng, Number(order.lat), Number(order.lng));
            const estimatedTime = this.getEstimatedTime(distance);

            return {
              ...order,
              driverName: this.getDriverName(order.driver_id),
              distance,
              type: 'subscription'
            };
          });

        this.allOrdersMerged = [...processedNormalOrders, ...processedSubscriptionOrders].sort(
          (a, b) => a.distance - b.distance
        );

        console.log('Merged Orders:', this.allOrdersMerged);

        const ordersToStore = this.filteredOrders?.map(({ id, ...rest }) => ({ ...rest })) || [];
        console.log('Orders to store (without ID):', ordersToStore);
      },
      (error) => {
        console.error('Unexpected error in forkJoin:', error);
      }
    );
  }


  // loadAllOrders(): void {
  //   const referenceLat = 51.5177192;
  //   const referenceLng = 7.4179611;

  //   forkJoin({
  //     normalOrders: this.adminService.loadOrders(),
  //     subsOrders: this.adminService.loadSubsOrders()
  //   }).subscribe(
  //     ({ normalOrders, subsOrders }: any) => {
  //       if (!normalOrders || !normalOrders.orders || !subsOrders || !subsOrders.subscribeData) {
  //         console.error('Invalid response from API', { normalOrders, subsOrders });
  //         return;
  //       }

  //       const processedNormalOrders = normalOrders.orders
  //         .filter((order: any) => order.status?.toLowerCase() === 'processing')
  //         .map((order: any) => {
  //           const distance = this.calculateDistance(referenceLat, referenceLng, Number(order.lat), Number(order.lng));
  //           const estimatedTime = this.getEstimatedTime(distance);

  //           return {
  //             ...order,
  //             driverName: this.getDriverName(order.driver_id),
  //             distance,

  //             type: 'normal'
  //           };
  //         });

  //         console.log("processedNormalOrders :", processedNormalOrders)

  //       const processedSubscriptionOrders = subsOrders.subscribeData
  //         .filter((order: any) => {
  //           const status = (order.status || '').toLowerCase();
  //           return status === 'processing' || status === 'assigned';
  //         })
  //         .map((order: any) => {
  //           const distance = this.calculateDistance(referenceLat, referenceLng, Number(order.lat), Number(order.lng));
  //           const estimatedTime = this.getEstimatedTime(distance);

  //           return {
  //             ...order,
  //             driverName: this.getDriverName(order.driver_id),
  //             distance,

  //             type: 'subscription'
  //           };
  //         });

  //         console.log("processedSubscriptionOrders :", processedSubscriptionOrders)

  //       this.allOrdersMerged = [...processedNormalOrders, ...processedSubscriptionOrders].sort(
  //         (a, b) => a.distance - b.distance
  //       );


  //       console.log('Merged Orders:', this.allOrdersMerged);


  //       const ordersToStore = this.filteredOrders.map(({ id, ...rest }) => ({ ...rest }));
  //       console.log('Orders to store (without ID):', ordersToStore);


  //     },
  //     (error) => {
  //       console.error('Error loading orders:', error);
  //     }
  //   );
  // }


  loadDrivers(): void {
    this.adminService.loadUsers().subscribe(
      (response: any) => {
        this.drivers = response.user.filter(
          (user: any) => user.role.toLowerCase() === "driver"
        );

        console.log('====================================');
        console.log(this.drivers);
        console.log('====================================');
      },
      (error) => {
        console.error('Error fetching drivers:', error);
        Swal.fire('Error', 'Failed to load drivers. Please try again.', 'error');
      }
    );
  }

  selectAllOrders(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.Orders.forEach((order) => (order.selected = isChecked));
  }

  indexCounter = 0;

  // assignOrdersToDrivers(): void {
  //   if (!this.selectedDriver) {
  //     Swal.fire('Error', 'Please select a driver', 'error');
  //     return;
  //   }

  //   const driverId = this.selectedDriver;
  //   const driverObj = this.drivers.find(driver => driver.id == driverId);

  //   // ✅ Use nearest-first route result instead of random selection order
  //   const selectedOrders = this.subscriptionOrders;

  //   if (!selectedOrders || selectedOrders.length === 0) {
  //     Swal.fire('Error', 'Please select at least one order', 'error');
  //     return;
  //   }

  //   const selectedNormalOrders = selectedOrders.filter((order: any) => order.type === 'normal');
  //   const selectedSubscriptionOrders = selectedOrders.filter((order: any) => order.type === 'subscription');

  //   if (selectedNormalOrders.length !== 0) {
  //     this.adminService.assignOrdersToDriver({
  //       driverId: driverId,
  //       orderIds: selectedOrders.map(order => order.id),
  //     }).subscribe(
  //       (response: any) => {
  //         // ✅ Assign unique index_id based on nearest-first order
  //         const ordersToStore = selectedOrders.map((order: any, idx: number) => {
  //           const { id, ...rest } = order;

  //           let updatedDeliveryDate: string | null = null;
  //           if (order.delivery_date) {
  //             const d = new Date(order.delivery_date);
  //             updatedDeliveryDate =
  //               d.getFullYear() + '-' +
  //               String(d.getMonth() + 1).padStart(2, '0') + '-' +
  //               String(d.getDate()).padStart(2, '0');
  //           }

  //           this.indexCounter++;

  //           return {
  //             ...rest,
  //             delivery_date: updatedDeliveryDate,
  //             index_id: idx + 1,  // ✅ order by nearest
  //             status: "Assigned",
  //             driver_id: driverObj?.id || driverId,
  //             driverName: driverObj?.username || '',
  //           };
  //         });

  //         console.log('✅ Orders to store (nearest-first):', ordersToStore);

  //         this.adminService.storeProcessedOrders(ordersToStore).subscribe(
  //           res => console.log('Orders stored successfully', res),
  //           err => console.error('Error storing processed orders', err)
  //         );

  //         ordersToStore.forEach(order => {
  //           const driverPerformance = {
  //             driver_id: driverObj?.id || this.selectedDriver,
  //             driverName: order.driverName,
  //             delivery_date: order.delivery_date,
  //             delivery_time: parseInt(order.estimatedTimeInMinutes, 10) || 0,
  //             delivery_distance: parseFloat(order.distanceKm) || 0,
  //             total_delivery: 1,
  //           };

  //           this.adminService.createDriverPerformance(driverPerformance).subscribe(
  //             res => console.log('Driver performance stored successfully', res),
  //             err => console.error('Error storing driver performance', err)
  //           );
  //         });

  //         Swal.fire('Success', response.message || 'Orders assigned successfully', 'success');
  //         this.loadOrders();
  //       },
  //       (error) => {
  //         console.error('Error assigning orders:', error);
  //         Swal.fire('Error', error.error.message || 'Failed to assign orders', 'error');
  //       }
  //     );
  //   }

  //   if (selectedSubscriptionOrders.length !== 0) {
  //     this.assignOrdersToDriverss();
  //   }

  //   this.selectedDriver = null;
  //   this.router.navigate(['/orders/assignOrders']);
  // }





  // calculateRouteThroughOrders(): void {
  //   const selectedOrders = this.allOrdersMerged.filter(order => order.selected);

  //   if (selectedOrders.length === 0) {
  //     Swal.fire('Error', 'Please select at least one order', 'error');
  //     return;
  //   }

  //   const origin = 'Bäckerei Vorwerk, Höfkerstraße 38, 44149 Dortmund';
  //   const destinations = selectedOrders.map(order => order.address);

  //   if (destinations.length === 0) {
  //     Swal.fire('Error', 'No valid destination addresses found', 'error');
  //     return;
  //   }

  //   const waypoints = destinations.slice(0, -1).map(address => ({
  //     location: address,
  //     stopover: true
  //   }));

  //   const destination = destinations[destinations.length - 1];

  //   const directionsService = new google.maps.DirectionsService();
  //   directionsService.route(
  //     {
  //       origin,
  //       destination,
  //       waypoints,
  //       travelMode: google.maps.TravelMode.DRIVING,
  //       optimizeWaypoints: false,
  //       drivingOptions: {
  //         departureTime: new Date(Date.now() + 2 * 60 * 1000),
  //         trafficModel: google.maps.TrafficModel.BEST_GUESS
  //       }
  //     },
  //     (result: any, status: any) => {
  //       if (status !== 'OK' || !result?.routes?.length) {
  //         Swal.fire('Error', 'Failed to get directions', 'error');
  //         return;
  //       }

  //       const legs = result.routes[0].legs;

  //       let totalDistanceKm = 0;
  //       let totalTimeMin = 0;

  //       legs.forEach((leg: any, index: number) => {
  //         const distanceKm = leg.distance?.value ? leg.distance.value / 1000 : 0;
  //         const durationMin = leg.duration?.value ? leg.duration.value / 60 : 0;

  //         totalDistanceKm += distanceKm;
  //         totalTimeMin += durationMin;

  //         const order = selectedOrders[index];
  //         if (order) {
  //           order.distanceKm = parseFloat(distanceKm.toFixed(1));
  //           order.estimatedTimeInMinutes = Math.ceil(durationMin);
  //         }
  //       });

  //       // ✅ Limit total route time to 4 hours (240 mins)
  //       let cumulativeTime = 0;
  //       const maxAllowedTime = 240;
  //       const cleanedOrders: any[] = [];
  //       let removedCount = 0;

  //       for (const order of selectedOrders) {
  //         const time = order.estimatedTimeInMinutes || 0;
  //         if (cumulativeTime + time <= maxAllowedTime) {
  //           cumulativeTime += time;
  //           cleanedOrders.push(order);
  //         } else {
  //           order.selected = false;
  //           removedCount++;
  //         }
  //       }

  //       if (removedCount > 0) {
  //         Swal.fire('Time Limit Exceeded', `${removedCount} orders were unselected to stay within 4 hours`, 'warning');
  //       }

  //       this.subscriptionOrders = cleanedOrders.map(order => ({
  //         ...order,
  //         selected: true
  //       }));

  //       this.Orders.forEach(order => {
  //         if (!cleanedOrders.find(o => o.order_id === order.order_id)) {
  //           order.selected = false;
  //           order.distanceKm = undefined;
  //           order.estimatedTimeInMinutes = undefined;
  //         }
  //       });

  //       this.totalEstimatedTime = Math.ceil(cumulativeTime);
  //       console.log('✅ Final Selected Orders within Time Limit:', this.subscriptionOrders);
  //       this.assignEnabled = true;
  //     }
  //   );
  // }

  assignOrdersToDrivers(): void {

    if (!this.selectedDriver) {
      Swal.fire('Error', 'Please select a driver', 'error');
      return;
    }

    const driverId = this.selectedDriver;
    const driverObj = this.drivers.find(d => d.id == driverId);

    const selectedOrders = this.subscriptionOrders.filter(o => o.selected);

    if (selectedOrders.length === 0) {
      Swal.fire('Error', 'Please select at least one order', 'error');
      return;
    }

    const normalOrders = selectedOrders.filter(o => o.type === 'normal');
    const subscriptionOrders = selectedOrders.filter(o => o.type === 'subscription');

    /* ================= CALL BOTH APIS ================= */

    const apiCalls: any[] = [];

    // ✅ NORMAL → assignOrdersToDrivers
    if (normalOrders.length > 0) {
      apiCalls.push(
        this.adminService.assignOrdersToDriver({
          driverId,
          orderIds: normalOrders.map(o => o.id)
        })
      );
    }

    // ✅ SUBSCRIPTION → assignOrdersToDriverss
    if (subscriptionOrders.length > 0) {
      apiCalls.push(
        this.adminService.assignOrdersToDrivers({
          driverId,
          orderIds: subscriptionOrders.map(o => o.id)
        })
      );
    }

    /* ================= EXECUTE APIS ================= */

    if (apiCalls.length > 0) {
      forkJoin(apiCalls).subscribe(
        () => {
          this.storeAndPerformance(selectedOrders, driverId, driverObj);
        },
        err => {
          console.error('Assign error:', err);
          Swal.fire('Error', 'Failed to assign orders', 'error');
        }
      );
    } else {
      // safety fallback
      this.storeAndPerformance(selectedOrders, driverId, driverObj);
    }
  }



  private storeAndPerformance(
    orders: any[],
    driverId: any,
    driverObj: any
  ): void {

    const ordersToStore = orders.map((order: any, idx: number) => {

      const { id, ...rest } = order;

      let delivery_date = null;
      if (order.delivery_date) {
        const d = new Date(order.delivery_date);
        delivery_date =
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }

      return {
        ...rest,
        delivery_date,
        index_id: idx + 1,
        status: 'Assigned',
        driver_id: driverObj?.id || driverId,
        driverName: driverObj?.username || '',
      };
    });

    // STORE
    this.adminService.storeProcessedOrders(ordersToStore).subscribe();

    // PERFORMANCE
    ordersToStore.forEach(order => {
      this.adminService.createDriverPerformance({
        driver_id: driverObj?.id || driverId,
        driverName: order.driverName,
        delivery_date: order.delivery_date,
        delivery_time: parseInt(order.estimatedTimeInMinutes, 10) || 0,
        delivery_distance: parseFloat(order.distanceKm) || 0,
        total_delivery: 1,
      }).subscribe();
    });

    Swal.fire('Success', 'Orders assigned successfully', 'success');
    this.loadOrders();
    this.selectedDriver = null;
    this.router.navigate(['/orders/assignOrders']);
  }



  calculateRouteThroughOrders(): void {
    const selectedOrders = this.allOrdersMerged.filter(order => order.selected);

    if (selectedOrders.length === 0) {
      Swal.fire('Error', 'Please select at least one order', 'error');
      return;
    }

    const origin = 'Bäckerei Vorwerk, Höfkerstraße 38, 44149 Dortmund';
    const directionsService = new google.maps.DirectionsService();

    let currentOrigin = origin;
    let cumulativeTime = 0;
    const maxAllowedTime = 240; // 4 hours
    const finalOrders: any[] = [];
    let removedCount = 0;

    const remainingOrders = [...selectedOrders];

    const processNext = () => {
      if (remainingOrders.length === 0) {
        if (removedCount > 0) {
          Swal.fire(
            'Time Limit Exceeded',
            `${removedCount} orders were unselected to stay within 4 hours`,
            'warning'
          );
        }

        this.subscriptionOrders = finalOrders.map(o => ({
          ...o,
          selected: true
        }));

        this.Orders.forEach(order => {
          if (!finalOrders.find(o => o.order_id === order.order_id)) {
            order.selected = false;
            order.distanceKm = undefined;
            order.estimatedTimeInMinutes = undefined;
            order.lat = '';
            order.lng = '';
          }
        });

        this.totalEstimatedTime = Math.ceil(cumulativeTime);
        console.log('✅ Final Route Sequence:', this.subscriptionOrders);
        this.assignEnabled = true;
        return;
      }

      // Handle same-address orders
      const lastOrder = finalOrders[finalOrders.length - 1];

      for (let i = 0; i < remainingOrders.length; i++) {
        const order = remainingOrders[i];

        if (lastOrder && lastOrder.address === order.address) {
          // Same location as last order
          order.distanceKm = 0;
          order.estimatedTimeInMinutes = 0;
          order.lat = lastOrder.lat;
          order.lng = lastOrder.lng;
          finalOrders.push(order);
          remainingOrders.splice(i, 1);
          i--; // adjust index after removal
          continue;
        }
      }

      if (remainingOrders.length === 0) {
        processNext();
        return;
      }

      // Calculate routes to all remaining orders from currentOrigin
      let results: { order: any; result: any; status: any }[] = [];
      let processed = 0;

      remainingOrders.forEach(order => {
        directionsService.route(
          {
            origin: currentOrigin,
            destination: order.address,
            travelMode: google.maps.TravelMode.DRIVING
          },
          (result: any, status: any) => {
            results.push({ order, result, status });
            processed++;

            if (processed === remainingOrders.length) {
              const valid = results.filter(r => r.status === 'OK' && r.result?.routes?.length);
              if (!valid.length) {
                Swal.fire('Error', 'Failed to get directions for remaining orders', 'error');
                return;
              }

              // Pick nearest by duration
              valid.sort((a, b) => {
                const durA = a.result.routes[0].legs[0].duration?.value || Infinity;
                const durB = b.result.routes[0].legs[0].duration?.value || Infinity;
                return durA - durB;
              });

              const nearest = valid[0];
              const leg = nearest.result.routes[0].legs[0];
              const distanceKm = leg.distance?.value ? leg.distance.value / 1000 : 0;
              const durationMin = leg.duration?.value ? leg.duration.value / 60 : 0;

              console.log(
                `📍 Nearest order chosen from "${currentOrigin}" ->`,
                nearest.order.address,
                `(${distanceKm.toFixed(2)} km, ${Math.ceil(durationMin)} min)`
              );

              if (cumulativeTime + durationMin <= maxAllowedTime) {
                nearest.order.distanceKm = parseFloat(distanceKm.toFixed(1));
                nearest.order.estimatedTimeInMinutes = Math.ceil(durationMin);
                nearest.order.lat = leg.end_location?.lat();
                nearest.order.lng = leg.end_location?.lng();

                cumulativeTime += durationMin;
                finalOrders.push(nearest.order);

                currentOrigin = nearest.order.address;
              } else {
                nearest.order.selected = false;
                removedCount++;
              }

              const idx = remainingOrders.findIndex(o => o.order_id === nearest.order.order_id);
              if (idx !== -1) remainingOrders.splice(idx, 1);

              processNext();
            }
          }
        );
      });
    };

    processNext();
  }









  assignOrdersToDriverss(): void {
    if (!this.selectedDriver) {
      Swal.fire('Error', 'Please select a driver', 'error');
      return;
    }
    const selectedOrders = this.subscriptionOrders.filter((order) => order.selected);
    if (selectedOrders.length === 0) {
      Swal.fire('Error', 'Please select at least one order', 'error');
      return;
    }


    const orderData = {
      driverId: this.selectedDriver,
      orderIds: selectedOrders.map((order) => order.id),
    };


    this.adminService.assignOrdersToDrivers(orderData).subscribe(

      (response: any) => {
        console.log("Response :", response.orders);

        Swal.fire('Success', response.message || 'Orders assigned successfully', 'success');
        this.loadOrders();
      },
      (error) => {
        console.error('Error assigning orders:', error);
        Swal.fire('Error', error.error.message || 'Failed to assign orders', 'error');
      }
    );

    this.selectedDriver = null;

    this.router.navigate(['/orders/assignOrders']);
  }

  nextPage(): void {
    if (this.page < this.totalPages) this.page++;
  }

  previousPage(): void {
    if (this.page > 1) this.page--;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.itemsPerPage);
  }


  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
      return Number.MAX_VALUE;
    }

    const R = 6371; // Radius of Earth in km
    const dLat = this.degToRad(lat2 - lat1);
    const dLng = this.degToRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  calculateDistanceAndTime(order: any): void {
    const orderLat = parseFloat(order.lat);
    const orderLng = parseFloat(order.lng);
    const distanceKm = this.calculateDistance(this.userLatitude, this.userLongitude, orderLat, orderLng);

    const currentHour = new Date().getHours();
    const isPeakHour = (currentHour >= 8 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 20);
    const averageSpeedKmph = isPeakHour ? 35 : 45;
    const estimatedTimeInMinutes = Math.ceil((distanceKm / averageSpeedKmph) * 60);

    order.distanceKm = +distanceKm.toFixed(2);
    order.estimatedTimeInMinutes = estimatedTimeInMinutes;

    this.selectedOrder = order;
    this.updateTotalTime();
  }

  checkTotalTimeLimit(clickedOrder: any, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (isChecked) {
      const totalTime = this.getTotalEstimatedTime(clickedOrder);

      if (totalTime > 240) {
        Swal.fire({
          icon: 'warning',
          title: 'Time Limit Exceeded',
          text: 'Adding this order exceeds the 4-hour limit!',
          confirmButtonText: 'OK',
        }).then(() => {
          clickedOrder.selected = false;
          this.updateTotalTime();
        });
      } else {
        this.updateTotalTime();
      }
    } else {
      this.updateTotalTime();
    }
  }

  updateTotalTime(): void {
    const selectedOrders = this.filteredOrders?.filter(order => order.selected) || [];
    this.totalEstimatedTime = selectedOrders.reduce((sum, order) => {
      return sum + (order.estimatedTimeInMinutes || 0);
    }, 0);
  }

  getTotalEstimatedTime(newOrder: any): number {
    const selectedOrders = this.filteredOrders?.filter(order => order.selected) || [];
    const currentTotal = selectedOrders.reduce((sum, order) => {
      return sum + (order.estimatedTimeInMinutes || 0);
    }, 0);
    return currentTotal + (newOrder.estimatedTimeInMinutes || 0);
  }









  toRad(value: number): number {
    return value * Math.PI / 180;
  }



  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }


  getEstimatedTime(distanceKm: number, isPeakHours: boolean = false): number {
    const roadFactor = 1.1;
    const speed = isPeakHours ? 35 : 45;

    const adjustedDistance = distanceKm * roadFactor;
    return Math.round((adjustedDistance / speed) * 60);
  }


  get filteredOrders(): Order[] {
    return this.allOrdersMerged.filter((order) => {
      const matchesZipcode = !this.searchZipcode || (order.zipcode && order.zipcode.includes(this.searchZipcode));
      return matchesZipcode;
    });
  }





  get displayedOrders(): Order[] {
    return this.showSubscriptionOrders ? this.subscriptionOrders : this.filteredOrders;
  }

  SubscripOrders(): void {
    if (!this.showSubscriptionOrders && this.subscriptionOrders.length === 0) {
      this.loadSubsOrder();
    }
    this.showSubscriptionOrders = !this.showSubscriptionOrders;
    this.page = 1;
  }




  private formatDate(date: string): string {
    return new Date(date).toISOString().split('T')[0];
  }

  toggleDriverDropdown(): void {
    this.isDriverDropdownOpen = !this.isDriverDropdownOpen;
  }

  selectDriverOption(driver: Driver): void {
    this.selectedDriver = driver.id;
    this.isDriverDropdownOpen = false;
  }

  getSelectedDriverName(): string {
    const driver = this.drivers.find(d => d.id == this.selectedDriver);
    return driver ? driver.username : 'Choose a driver...';
  }
}
