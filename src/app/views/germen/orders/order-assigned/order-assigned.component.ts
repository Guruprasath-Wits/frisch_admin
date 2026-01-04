import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/admin.service';
import Swal from 'sweetalert2';
import { catchError, forkJoin, of, zip } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Order {
  id: number;
  order_id: number;
  product: string;
  quantity: number;
  price: number;
  delivery_date: string;
  address: string;
  contact: string;
  instruction: string;
  status: string;
  driverName: string; // Resolved driver name
  customerName?: string; // Resolved customer name
  driver_id: number;
  lat: string;
  lng: string;
}

export interface Driver {
  id: number;
  username: string;
  role: string;
}

@Component({
  selector: 'app-order-assigned',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './order-assigned.component.html',
  styleUrls: ['./order-assigned.component.scss'],
})
export class OrderAssignedComponent implements OnInit {
  Orders: Order[] = [];
  drivers: Driver[] = [];
  searchTerm: string = '';
  searchEmail: string = '';
  searchPhone: string = '';
  searchOrderId: string = '';
  searchStatus: string = '';
  searchDate: string = '';
  searchDriver: string = '';
  selectedDriver: string = '';
  page: number = 1;
  itemsPerPage: number = 50;
  mergedOrders: any[] = [];
  hasDistanceColumn = false;
  hasTimeColumn = false;


  showSubscriptionOrders: boolean = false;
  subscriptionOrders: Order[] = [];
  allUsers: any[] = []; // Store all users for lookup
  isLoading = false;
  constructor(private router: Router, private adminService: AdminService, private http: HttpClient) { }

  ngOnInit(): void {
    this.loadDriversAndOrders();
    // this.loadOrders();
    this.loadDrivers();
    // this.loadSubsOrder();
    this.loadAllOrders();
  }

  loadSubsOrder(): void {
    this.adminService.loadSubsOrders().subscribe(
      (response: any) => {
        this.subscriptionOrders = response.subscribeData
          .filter((order: any) => {
            const status = (order.status || 'assigned').toLowerCase();
            return status === 'assigned';
          })
          .map((order: any) => ({
            id: order.id,
            user_id: order.user_id,
            order_id: order.order_id,
            zipcode: order.zipcode,
            price: order.price,
            delivery_date: order.delivery_date,
            address: order.address,
            contact: order.contact,
            instruction: order.instruction,
            status: order.status || 'assigned',
            tips: order.tips
          }));

      },


      error => {
        console.error('Error fetching Subscription Orders:', error);
      }
    );
  }

  SubscripOrders(): void {
    if (!this.showSubscriptionOrders && this.subscriptionOrders.length === 0) {
      this.loadSubsOrder();
    }
    this.showSubscriptionOrders = !this.showSubscriptionOrders;
    this.page = 1; // Reset to the first page when toggling.
  }

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
  loadOrders(): void {
    this.adminService.loadOrders().subscribe(
      (response: { orders: Order[] }) => {

        this.Orders = response.orders
          .filter(order => order.status?.toLowerCase() === 'assigned')
          .map(order => ({
            ...order,
            driverName: this.getDriverName(order.driver_id),
          }));
        console.log('Filtered and mapped Orders:', this.Orders);


      },
      (error) => console.error('Error fetching Orders:', error)
    );
  }


  loadDriversAndOrders(): void {
    this.adminService.loadUsers().subscribe(
      (response: { user: Driver[] }) => {
        // this.drivers = response.user.filter((user) => user.role === 'driver');
        // this.loadOrders(); 

        this.drivers = response.user.filter(
          (user: any) => user.role.toLowerCase() === "driver"
        );
      },
      (error) => console.error('Error fetching Drivers:', error)
    );
  }




  allOrders: any[] = [];         // Stores all fetched orders
  updateColumnFlags() {
    this.hasDistanceColumn = this.mergedOrders?.some(order => !!order.distanceKm) ?? false;
    this.hasTimeColumn = this.mergedOrders?.some(order => !!order.estimatedTimeInMinutes) ?? false;
  }

  GetOrder() {
    const order = {
      driver_id: this.selectedDriver,
      delivery_date: this.searchDate,
      status: "Assigned"
    };

    this.adminService.getOrder(order).subscribe(
      res => {
        console.log('Raw API response:', res);

        if (res.status === false) {
          Swal.fire('Please Select Required Fields', '', 'info');
          return;
        }

        console.log('Orders fetched successfully', res.orders);

        // Convert both sides to YYYY-MM-DD for comparison
        const filteredOrders = res.orders.filter((o: any) => {
          // Convert delivery_date to local YYYY-MM-DD
          const apiDate = new Date(o.delivery_date).toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD
          const searchDate = new Date(this.searchDate).toLocaleDateString('en-CA');
          return apiDate === searchDate;
        });

        console.log('Filtered Orders by Date:', filteredOrders);


        const sortedOrders = filteredOrders.sort((a: any, b: any) => a.index_id - b.index_id);

        const processedOrders = sortedOrders.map((order: any) => ({
          ...order,
          customerName: this.getUserName(order.user_id || order.userid || order.customer_id)
        }));

        this.allMergedOrders = [...processedOrders];
        this.mergedOrders = [...processedOrders];
        this.updateColumnFlags();

        this.showSubscriptionOrders = false;
      },
      err => {
        console.error('Error fetching orders', err);
        Swal.fire('Error', 'An error occurred while fetching orders.', 'error');
      }
    );
  }







  // loadOrders(): void {
  //   this.adminService.loadOrders().subscribe(
  //     (response: { orders: Order[] }) => {
  //       if (!response || !response.orders) {
  //         console.error('Invalid response:', response);
  //         return;
  //       }

  //       const referenceLat = 51.5177192; 
  //       const referenceLng = 7.4179611;

  //       this.Orders = response.orders
  //         .filter(order => order.status?.toLowerCase() === 'assigned')
  //         .map(order => {
  //           const distance = this.calculateDistance(referenceLat, referenceLng, Number(order.lat), Number(order.lng));
  //           const estimatedTime = this.getEstimatedTime(distance);

  //           return {
  //             ...order,
  //             driverName: this.getDriverName(order.driver_id),
  //             distance: distance,
  //             estimatedTimeInMinutes: estimatedTime
  //           };
  //         })
  //         .sort((a, b) => a.distance - b.distance);

  //         console.log(this.Orders)

  //       // ✅ Store to new table
  //       const ordersToStore = this.Orders.map(order => {
  //         const { id, ...rest } = order;
  //         return { ...rest }; // Only fields except `id`
  //       });

  //       console.log('Orders to store (without ID):', ordersToStore);

  //       this.adminService.storeProcessedOrders(ordersToStore).subscribe(
  //         res => console.log('Orders stored successfully', res),
  //         err => console.error('Error storing processed orders', err)
  //       );
  //     },
  //     (error) => console.error('Error fetching Orders:', error)
  //   );
  // }
  // async GetOrder(): Promise<void> {

  //   this.mergedOrders = []

  //   // Uncomment if you want to reload data every time
  //   // this.mergedOrders = [];
  //   // await this.loadAllOrders();

  //   const driverId = this.selectedDriver;
  //   const selectedDate = this.searchDate;
  //   const formattedSearchDate = selectedDate
  //     ? new Date(selectedDate).toISOString().split('T')[0]
  //     : null;

  //   // Assign the filtered result back to mergedOrders
  //   this.mergedOrders = this.allMergedOrders.filter((order: any) => {
  //     const isDriverMatch = driverId ? order.driver_id == driverId : true;

  //     const orderDate = new Date(order.delivery_date).toISOString().split('T')[0];
  //     const isDateMatch = formattedSearchDate ? orderDate === formattedSearchDate : true;

  //     const isStatusMatch = order.status?.toLowerCase() === 'assigned';

  //     return isDriverMatch && isDateMatch && isStatusMatch;
  //   });

  //   console.log('Filtered Merged Orders:', this.mergedOrders);
  // }






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

  // 🕒 Rough estimate based on average speed
  getEstimatedTime(distanceKm: number): number {
    const averageDrivingSpeed = 40; // km/h (realistic speed for city driving)
    const roadFactor = 1.1; // ~20% longer due to roads not being straight
    const adjustedDistance = distanceKm * roadFactor;

    const timeInHours = adjustedDistance / averageDrivingSpeed;
    return Math.round(timeInHours * 60); // in minutes
  }





  getDriverName(driverId: number): string {
    const driver = this.drivers.find((d) => d.id == driverId);
    return driver ? driver.username : 'Unassigned';
  }

  getUserName(userId: any): string {
    if (!userId) {
      console.warn('No userId provided for lookup');
      return 'Unknown Customer';
    }

    // Debug: log once if allUsers is populated
    if (this.allUsers.length > 0 && !this.allUsers[0].logged) {
      console.log('Sample User from allUsers:', this.allUsers[0]);
      this.allUsers[0].logged = true;
    }

    const user = this.allUsers.find((u: any) => u.id == userId);
    if (!user) {
      console.warn(`User not found in allUsers (length: ${this.allUsers.length}) for ID: ${userId}`);
      return `Unknown Customer (ID: ${userId})`;
    }

    // Prioritize username, then fname + lname, then company name
    if (user.username && user.username.trim() !== '') return user.username;
    if (user.fname || user.lname) {
      const fullName = `${user.fname || ''} ${user.lname || ''}`.trim();
      if (fullName !== '') return fullName;
    }
    if (user.company_name && user.company_name.trim() !== '') return user.company_name;

    return user.email || `Customer ${userId}`;
  }

  editOrder(order: Order): void {
    Swal.fire({
      title: 'Edit Driver Allocation',
      input: 'select',
      inputOptions: this.drivers.reduce((acc: Record<number, string>, driver) => {
        acc[driver.id] = driver.username;
        return acc;
      }, {}),
      inputPlaceholder: 'Select a driver',
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const newDriverId = Number(result.value);
        this.adminService.updateOrders(order.id, { driverId: newDriverId }).subscribe(
          () => {
            Swal.fire('Success', 'Driver reassigned successfully!', 'success');
            this.loadOrders(); // Refresh orders to update driver info
          },
          (error) => {
            Swal.fire('Error', 'Failed to reassign driver.', 'error');
            console.error('Error reassigning driver:', error);
          }
        );
      }
    });
  }


  editOrders(order: Order): void {
    Swal.fire({
      title: 'Edit Driver Allocation',
      input: 'select',
      inputOptions: this.drivers.reduce((acc: Record<number, string>, driver) => {
        acc[driver.id] = driver.username;
        return acc;
      }, {}),
      inputPlaceholder: 'Select a driver',
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const newDriverId = Number(result.value);
        this.adminService.updateSubscriptionOrders(order.id, { driverId: newDriverId }).subscribe(
          () => {
            Swal.fire('Success', 'Driver reassigned successfully!', 'success');
            this.loadOrders(); // Refresh orders to update driver info
          },
          (error) => {
            Swal.fire('Error', 'Failed to reassign driver.', 'error');
            console.error('Error reassigning driver:', error);
          }
        );
      }
    });
  }

  // loadAllOrders(): void {
  //   debugger
  //   forkJoin({
  //      normalOrders: this.adminService.loadOrders().pipe(
  //        catchError((error) => {
  //          console.error('Error loading normal orders:', error);
  //          return of({ orders: [] }); // fallback to empty array
  //        })
  //      ),
  //      subsOrders: this.adminService.loadSubsOrders().pipe(
  //        catchError((error) => {
  //          console.error('Error loading subscription orders:', error);
  //          return of({ subscribeData: [] }); // fallback to empty array
  //        })
  //      )
  //    }).subscribe(
  //     ({ normalOrders, subsOrders }: any) => {
  //       const processedOrders = (normalOrders.orders || [])
  //         .filter((order: any) => {
  //           const status = (order.status || '').toLowerCase();
  //           return status === 'Assigned' ;
  //         })
  //         .map((order: any) => ({
  //           id: order.id ?? '',
  //           order_id: order.order_id ?? '',
  //           price: order.price ?? 0,
  //           delivery_date: order.delivery_date ?? '',
  //           address: order.address ?? '',
  //           contact: order.contact ?? '',
  //           instruction: order.instruction ?? '',
  //           status: order.status ? order.status.toLowerCase() : '',
  //           type: 'normal', // To identify source if needed
  //           tips: null
  //         }));

  //       const processedSubsOrders = (subsOrders.subscribeData || [])
  //         .filter((order: any) => {
  //           const status = (order.status || 'Assigned').toLowerCase();
  //           return status === 'Assigned';
  //         })
  //         .map((order: any) => ({
  //           id: order.id ?? '',
  //           order_id: order.order_id ?? '',
  //           price: order.price ?? 0,
  //           delivery_date: order.delivery_date ?? '',
  //           address: order.address ?? '',
  //           contact: order.contact ?? '',
  //           instruction: order.instruction ?? '',
  //           status: order.status ? order.status.toLowerCase() : 'Assigned',
  //           type: 'subscription', // To identify source
  //           tips: order.tips ?? null
  //         }));

  //       // Merge both
  //       this.mergedOrders = [...processedOrders, ...processedSubsOrders];
  //        console.log('Merged Orders:', this.mergedOrders);
  //     },
  //     error => {
  //       console.error('Error loading all orders:', error);
  //     }
  //   );
  // }
  allMergedOrders: any = []
  loadAllOrders(): void {

    // First, load drivers
    this.adminService.loadUsers().pipe(
      catchError((error) => {
        console.error('Error loading drivers:', error);
        Swal.fire('Error', 'Failed to load drivers.', 'error');
        return of({ user: [] }); // fallback to empty users
      })
    ).subscribe((userResponse: any) => {
      this.allUsers = userResponse.user || []; // Store all users
      this.drivers = userResponse.user.filter((user: any) =>
        user.role?.toLowerCase() === 'driver'
      );

      forkJoin({
        normalOrders: this.adminService.loadOrders().pipe(
          catchError((error) => {
            console.error('Error loading normal orders:', error);
            return of({ orders: [] }); // fallback to empty
          })
        ),
        subsOrders: this.adminService.loadSubsOrders().pipe(
          catchError((error) => {
            console.error('Error loading subscription orders:', error);
            return of({ subscribeData: [] }); // fallback to empty
          })
        )
      }).subscribe(
        ({ normalOrders, subsOrders }: any) => {
          const processedOrders = (normalOrders.orders || [])
            .filter((order: any) => (order.status || '').toLowerCase() === 'assigned')
            .map((order: any) => ({
              id: order.id ?? '',
              order_id: order.order_id ?? '',
              price: order.price ?? 0,
              delivery_date: order.delivery_date ?? '',
              address: `${order.address ?? ''}`,
              // address: order.address ?? '' + ',' + order.zipcode ?? '' + ',' + order.ort ?? '',
              // address : order.address ?? '',
              // zipcode: order.zipcode ?? '',
              // ort: order.ort ?? '',
              contact: order.contact ?? '',
              instruction: order.instruction ?? '',
              status: order.status ? order.status.toLowerCase() : '',
              driver_id: order.driver_id ?? null,
              driverName: this.getDriverName(order.driver_id),
              customerName: this.getUserName(order.user_id),
              user_id: order.user_id ?? null,
              type: 'normal',
              tips: null
            }));

          const processedSubsOrders = (subsOrders.subscribeData || [])
            .filter((order: any) => (order.status || 'assigned').toLowerCase() === 'assigned')
            .map((order: any) => ({
              id: order.id ?? '',
              order_id: order.order_id ?? '',
              price: order.price ?? 0,
              delivery_date: order.delivery_date ?? '',
              address: `${order.address ?? ''}`,
              // address: order.address ?? '' + ',' + order.zipcode ?? '' + ',' + order.ort ?? '',
              //  address : order.address ?? '',
              // zipcode: order.zipcode ?? '',
              // ort: order.ort ?? '',
              contact: order.contact ?? '',
              instruction: order.instruction ?? '',
              status: order.status ? order.status.toLowerCase() : 'assigned',
              driver_id: order.driver_id ?? null,
              driverName: this.getDriverName(order.driver_id),
              customerName: this.getUserName(order.user_id || order.id),
              user_id: order.user_id ?? null,
              type: 'subscription',
              tips: order.tips ?? null
            }));

          this.allMergedOrders = [...processedOrders, ...processedSubsOrders];


          this.mergedOrders = [...this.allMergedOrders];
          console.log('Merged Orders with driver names:', this.mergedOrders);
        },
        error => {
          console.error('Error loading all orders:', error);
        }
      );
    });
  }


  get filteredOrders(): Order[] {
    const orders = this.showSubscriptionOrders ? this.subscriptionOrders : this.Orders;
    return this.mergedOrders.filter((order) =>
      (!this.searchTerm || order.product.toLowerCase().includes(this.searchTerm.toLowerCase())) &&
      (!this.searchEmail || order.address.toLowerCase().includes(this.searchEmail.toLowerCase())) &&
      (!this.searchPhone || order.contact.includes(this.searchPhone)) &&
      (!this.searchOrderId || order.order_id.toString().includes(this.searchOrderId)) &&
      (!this.searchStatus || order.status.toLowerCase().includes(this.searchStatus.toLowerCase())) &&
      (!this.searchDate || new Date(order.delivery_date).toISOString().split('T')[0] === this.searchDate) &&
      (!this.searchDriver || order.driverName.toLowerCase().includes(this.searchDriver.toLowerCase()))
    );
  }

  selectDateAndDownload(): void {
    Swal.fire({
      title: 'Select a Date and Category',
      html: `
       <div style="display: flex; flex-direction: column; align-items: center; gap: 5px;">
  <label for="deliveryDate"  font-weight: bold;">Select Delivery Date:</label>
  <input 
    type="date" 
    id="deliveryDate" 
    class="swal2-input" 
    style="text-align: center; width: 100%; max-width: 300px; padding: 10px; border-radius: 5px; border: 1px solid #ccc;"
  />
  <label for="categoryType"  font-weight: bold;">Select Category:</label>
  <select 
    id="categoryType" 
    class="swal2-select" 
    style="width: 100%; max-width: 300px; padding: 10px; border-radius: 5px; border: 1px solid #ccc;"
  >
    <option value="" disabled selected>Select Category</option>
    <option value="Bakkery">Bakkery_Items</option>
    <option value="Others">Others</option>
  </select>
</div>

      `,
      //     preConfirm: () => {
      //       const dateInput = document.getElementById('deliveryDate') as HTMLInputElement;
      //       const categorySelect = document.getElementById('categoryType') as HTMLSelectElement;

      //       if (!dateInput || !dateInput.value) {
      //         Swal.showValidationMessage('Please select a valid date.');
      //         return false;
      //       }

      //       if (!categorySelect || !categorySelect.value) {
      //         Swal.showValidationMessage('Please select a category.');
      //         return false;
      //       }


      //       const selectedDate = new Date(dateInput.value);
      //       const day = selectedDate.getDay();
      //       if (day !== 6 && day !== 0) { // Not Saturday or Sunday
      //         Swal.showValidationMessage('Only Saturdays and Sundays are allowed.');
      //         return false;
      //       }

      //       return {
      //         date: dateInput.value,
      //         category: categorySelect.value
      //       }; // Return both date and category
      //     },
      //   }).then(result => {
      //     if (result.isConfirmed) {
      //       const { date, category } = result.value;
      //       this.getLabels(date, category); // Pass the selected date and category
      //     }
      //   });
      // }
      preConfirm: async () => {
        const dateInput = document.getElementById('deliveryDate') as HTMLInputElement;
        const categorySelect = document.getElementById('categoryType') as HTMLSelectElement;

        if (!dateInput || !dateInput.value) {
          Swal.showValidationMessage('Please select a valid date.');
          return false;
        }

        if (!categorySelect || !categorySelect.value) {
          Swal.showValidationMessage('Please select a category.');
          return false;
        }

        // Parse input date
        const inputDate = new Date(dateInput.value);
        if (!inputDate) {
          Swal.showValidationMessage('Invalid date format.');
          return false;
        }

        const formattedDate = inputDate.toISOString().split('T')[0];

        // ✅ Check if holiday
        const isHoliday = await this.checkPublicHoliday(formattedDate);

        // ✅ Condition 1: Only Saturday and Sunday are allowed (if NOT holiday)
        const day = inputDate.getDay(); // 0 = Sunday, 6 = Saturday
        if (!isHoliday && day !== 6 && day !== 0) {
          Swal.showValidationMessage('Only Saturdays, Sundays, or public holidays are allowed.');
          return false;
        }

        return {
          date: dateInput.value,
          category: categorySelect.value
        };
      }
    }).then(result => {
      if (result.isConfirmed) {
        const { date, category } = result.value;
        this.getLabels(date, category); // ✅ Download report if valid
      }
    });
  }

  async checkPublicHoliday(date: string): Promise<boolean> {
    const apiUrl = `https://date.nager.at/api/v3/PublicHolidays/${new Date().getFullYear()}/DE`;
    return new Promise((resolve) => {
      this.http.get<{ date: string }[]>(apiUrl).subscribe(
        (holidays: { date: string }[]) => {
          const isHoliday = holidays.some((holiday: { date: string }) => holiday.date === date);
          resolve(isHoliday);
        },
        (error: any) => {
          console.error('Error fetching public holidays:', error);
          resolve(false); // treat errors as non-holiday
        }
      );
    });
  }


  // Fetch PDF from backend
  getLabels(date: string, category: string): void {
    this.isLoading = true; // Start loader

    this.adminService.getLabels(date, category).subscribe(
      (response: Blob) => {
        const blob = new Blob([response], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank'); // Open PDF in new tab
        this.isLoading = false; // Stop loader
      },
      (error) => {
        this.isLoading = false; // Stop loader on error
        console.error('Error fetching PDF:', error);
        Swal.fire('Error', 'There was an error fetching the labels. Please try again later.', 'error');
      }
    );
  }


  getLabelReport(): void {
    this.subscriptionOrders
    this.filteredOrders
    let data: any = [];
    if (this.showSubscriptionOrders) {
      data = this.mergedOrders;
    } else {
      data = this.mergedOrders;
    }
    this.adminService.getLabelReport(data).subscribe(
      (response: Blob) => {
        const blob = new Blob([response], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        Swal.fire('Success', 'File opened in a new tab.', 'success');
      },
      (error) => {
        Swal.fire('Error', 'Could not open file.', 'error');
      }
    );

    // this.adminService.getLabelReport(data).subscribe(
    //   (response: Blob) => {
    //     const blob = new Blob([response], { type: 'application/pdf' }); // Set the correct MIME type for PDF
    //     const blobUrl = URL.createObjectURL(blob);

    //     // Open the PDF in a new tab
    //     window.open(blobUrl, '_blank');

    //     // Optionally, revoke the URL after some time
    //     setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

    //     Swal.fire('Success', 'File is opened in a new tab.', 'success');
    //   },
    //   (error) => {
    //     console.error('Error opening the file:', error);
    //     Swal.fire('Error', 'There was an error opening the file. Please try again later.', 'error');
    //   }
    // );
  }






  viewOrder(order_id: any): void {
    const orderDetails$ = this.adminService.loadDetailsOrder(order_id);

    console.log("Order Detaisl", orderDetails$)


    const order$ = this.adminService.loadOrders();
    const subscriptionOrder$ = this.adminService.loadSubsOrders();

    Promise.all([orderDetails$.toPromise(), order$.toPromise(), subscriptionOrder$.toPromise()]).then(([orderDetailsResponse, ordersResponse, subscriptionOrdersResponse]: any[]) => {

      const orderDetails = orderDetailsResponse.orders.map((order: any) => ({
        product_name: order.product_name,
        quantity: order.quantity,
        price: order.price
      }));

      // console.log("orderDetails",orderDetails)

      const mergedOrders = [
        ...(ordersResponse.orders || []),
        ...(subscriptionOrdersResponse.subscribeData || [])
      ];
      // console.log("Merged Orders:", mergedOrders);

      // 🔍 Find the order by ID in merged array
      const order = mergedOrders.find((o: any) => o.order_id === order_id);
      console.log("Selected Order for modal (Normal):", order);

      if (order) {
        const userId = order.user_id || order.userid || order.customer_id;
        // Fallback: If user not in allUsers, fetch it
        const userExists = this.allUsers.find(u => u.id == userId);
        const userPromise = userExists ? Promise.resolve(userExists) : this.adminService.getUserById(userId).toPromise().then(res => res.user[0]).catch(() => null);

        userPromise.then(fetchedUser => {
          if (fetchedUser && !userExists) this.allUsers.push(fetchedUser);

          Swal.fire({
            title: `Order Details - ${order_id}`,
            html: `
            <style>
              table,th,td{
              border:1px solid black;
              
              }
            </style>
              <p><strong>Order ID:</strong> ${order.order_id}</p>
              <p><strong>Customer Name:</strong> ${this.getUserName(userId)}</p>
              <p><strong>Address:</strong> ${order.address}</p>
              <p><strong>Contact:</strong> ${order.contact}</p>
              <p><strong>Instruction:</strong> ${order.instruction}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              <p><strong>Delivery Date:</strong> ${order.delivery_date}</p>
              <p><strong>Tipps:</strong> ${order.tips}€</p>
              <p><strong>Total Price:</strong> ${(Number(order.price) + Number(order.tips)).toFixed(2)}€</p>
              <table style='margin-left:80px;width:300px'>
              <tr>
                <th>Bags</th>
                <th>Quantity</th?
              </tr>
              <tr>
                <td>Große Tüte</td>
                <td>${order.gro_bag}</td>
              </tr>

              <tr>
                <td>Mittlere Tüte</td>
                <td>${order.mitt_bag}</td>
              </tr>

              <tr>
                <td>Baguette Tüte</td>
                <td>${order.bagu_bag}</td>
              </tr>

              <tr>
                <td>Zusätzliche Tüte</td>
                <td>${order.zusätzliche_tüte}</td>
              </tr>
              </table>
              <hr>
              <h5>Products:</h5>
              <ul>
                ${orderDetails
                .map(
                  (detail: any) =>
                    `<li style='margin-top:10px;list-style-type:none'>${detail.product_name} - Quantity: ${detail.quantity} &nbsp; &nbsp; ${detail.price}€</li>`
                )
                .join("")}
              </ul>
            `,
            icon: "info",
            confirmButtonText: "Close",
            didOpen: () => {

              const bagSelect = document.getElementById("bag-select") as HTMLSelectElement;
              if (bagSelect) {
                bagSelect.addEventListener("change", (event: Event) => {
                  const selectedBag = (event.target as HTMLSelectElement).value;


                  this.adminService.updateOrderBag(order_id, { bag: selectedBag }).subscribe(
                    (response: any) => {
                      Swal.fire("Success", "Bag updated successfully!", "success");
                    },
                    (error) => {
                      Swal.fire("Error", "Failed to update bag. Please try again.", "error");
                      console.error("Error updating bag:", error);
                    }
                  );
                });
              }
            },
          });
        });
      } else {
        Swal.fire("Error", "Order not found!", "error");
      }
    })
      .catch((error: any) => {
        console.error("Error fetching order details:", error);
        Swal.fire("Error", "Failed to fetch order details. Please try again later.", "error");
      });
  }

  viewOrders(order_id: any): void {
    const orderDetails$ = this.adminService.loadDetailsSubscriptionOrder(order_id);


    const order$ = this.adminService.loadSubsOrders();


    Promise.all([orderDetails$.toPromise(), order$.toPromise()])
      .then(([orderDetailsResponse, ordersResponse]: any[]) => {

        const orderDetails = orderDetailsResponse.orders.map((order: any) => ({
          product_name: order.product_name,
          quantity: order.quantity,
          price: order.price
        }));


        const order = ordersResponse.orders.find((o: any) => o.order_id === order_id);
        console.log("Selected Order for modal (Subscription):", order);

        if (order) {
          const userId = order.user_id || order.userid || order.customer_id || order.id;
          // Fallback: If user not in allUsers, fetch it
          const userExists = this.allUsers.find(u => u.id == userId);
          const userPromise = userExists ? Promise.resolve(userExists) : this.adminService.getUserById(userId).toPromise().then((res: any) => res.user[0]).catch(() => null);

          userPromise.then((fetchedUser: any) => {
            if (fetchedUser && !userExists) this.allUsers.push(fetchedUser);

            Swal.fire({
              title: `Order Details - ${order_id}`,
              html: `
              <p><strong>User ID:</strong> ${order.id}</p>
              <p><strong>Order ID:</strong> ${order.order_id}</p>
              <p><strong>Customer Name:</strong> ${this.getUserName(userId)}</p>
              <p><strong>Address:</strong> ${order.address}</p>
              <p><strong>Contact:</strong> ${order.contact}</p>
              <p><strong>Instruction:</strong> ${order.instruction}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              <p><strong>Delivery Date:</strong> ${order.delivery_date}</p>
              <p><strong>Price:</strong> ${order.price}</p>
              <table style='margin-left:80px;width:300px'>
              <tr>
                <th>Bags</th>
                <th>Quantity</th?
              </tr>
              <tr>
                <td>Große Tüte</td>
                <td>${order.gro_bag}</td>
              </tr>

              <tr>
                <td>Mittlere Tüte</td>
                <td>${order.mitt_bag}</td>
              </tr>

              <tr>
                <td>Baguette Tüte</td>
                <td>${order.bagu_bag}</td>
              </tr>
              <tr>
                <td>Zusätzliche Tüte</td>
                <td>${order.zusätzliche_tüte}</td>
              </tr>
              </table>
              <hr>
              <h5>Products:</h5>
              <ul>
                ${orderDetails
                  .map(
                    (detail: any) =>
                      `<li style='margin-top:10px;list-style-type:none'>${detail.product_name} - Quantity: ${detail.quantity} &nbsp; &nbsp; ${detail.price}€</li>`
                  )
                  .join("")}
              </ul>

              
            `,
              icon: "info",
              confirmButtonText: "Close",
              didOpen: () => {

                const bagSelect = document.getElementById("bag-select") as HTMLSelectElement;
                if (bagSelect) {
                  bagSelect.addEventListener("change", (event: Event) => {
                    const selectedBag = (event.target as HTMLSelectElement).value;


                    this.adminService.updateSubcriptionOrderBag(order_id, { bag: selectedBag }).subscribe(
                      (response: any) => {
                        Swal.fire("Success", "Bag updated successfully!", "success");
                      },
                      (error) => {
                        Swal.fire("Error", "Failed to update bag. Please try again.", "error");
                        console.error("Error updating bag:", error);
                      }
                    );
                  });
                }
              },
            });
          });
        } else {
          Swal.fire("Error", "Order not found!", "error");
        }
      })
      .catch((error: any) => {
        console.error("Error fetching order details:", error);
        Swal.fire("Error", "Failed to fetch order details. Please try again later.", "error");
      });
  }

  get paginatedOrders(): Order[] {
    const startIndex = (this.page - 1) * this.itemsPerPage;
    return this.filteredOrders.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.itemsPerPage);
  }

  nextPage(): void {
    if (this.page < this.totalPages) this.page++;
  }

  previousPage(): void {
    if (this.page > 1) this.page--;
  }
}
