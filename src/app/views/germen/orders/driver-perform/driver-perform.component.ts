import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination'; // Import for pagination
import { AdminService } from '../../../../admin.service';
import Swal from 'sweetalert2'; // Import SweetAlert2

export interface Driver {
  id: number;
  username: string;
  role: string;
}

@Component({
  selector: 'app-driver-perform',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule], // Add NgxPaginationModule for pagination
  templateUrl: './driver-perform.component.html',
  styleUrls: ['./driver-perform.component.scss'],
})
export class DriverPerformComponent implements OnInit {
  orders: any[] = []; // Full list of orders
  filteredOrders: any[] = []; // Filtered list for table
  searchDriverId: string = ''; // Filter by Driver ID
  searchDate: string = ''; // Filter by Date
  searchStatus: string = ''; // Filter by Status (if applicable)
  selectedDriver: string = ''; // Selected driver ID for filtering
  fromDate: string = ''; // From date for filtering
  toDate: string = ''; // To date for filtering
  page: number = 1; // Current page
  itemsPerPage: number = 50; // Items per page
  totalPages: number = 1;
  drivers: Driver[] = [];// Total pages (calculated after fetching orders)
  totalDistance: number = 0; // Total distance for selected driver
  totalTime: number = 0; // Total time for selected driver
  totalDeliveries: number = 0; // Total deliveries for selected driver
  isDriverDropdownOpen: boolean = false;

  constructor(private driverPerformanceService: AdminService) { }

  ngOnInit(): void {
    this.loadDrivers();
    this.fetchOrders();
  }

  loadDrivers(): void {
    this.driverPerformanceService.loadUsers().subscribe(
      (response: { user: Driver[] }) => {
        this.drivers = response.user.filter((user) => user.role.toLowerCase() === 'driver');
      },
      (error: any) => console.error('Error fetching drivers:', error)
    );
  }

  fetchOrders(): void {
    this.driverPerformanceService.driverPerform().subscribe((response: any) => {
      if (response.status) {
        this.orders = response.orders.map((order: any) => ({
          driverId: order.driver_id, // Store driver_id instead of name
          driverName: this.getDriverName(order.driver_id),
          deliveryDate: order.delivery_date,
          deliveryTime: order.delivery_time,
          deliveryDistance: order.delivery_distance,
          status: 'Completed', // Assuming status is derived or static
          totalOrders: order.total_delivery

        }));
        this.filteredOrders = [...this.orders]; // Initialize filtered orders
        this.calculateTotalPages();
      }
    });
  }

  getDriverName(driverId: number): string {
    const driver = this.drivers.find((d) => d.id == driverId);
    return driver ? driver.username : 'Unassigned';
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
  }

  filterOrders(): void {
    // Filter orders based on selected driver, date range, and status
    this.filteredOrders = this.orders.filter((order) => {
      const matchesDriver = !this.selectedDriver || order.driverId == this.selectedDriver; // Filter by selected driver
      const matchesFromDate = !this.fromDate || new Date(order.deliveryDate) >= new Date(this.fromDate);
      const matchesToDate = !this.toDate || new Date(order.deliveryDate) <= new Date(this.toDate);
      const matchesStatus = !this.searchStatus || order.status.toLowerCase().includes(this.searchStatus.toLowerCase());

      return matchesDriver && matchesFromDate && matchesToDate && matchesStatus;
    });

    // After filtering, recalculate the total distance, time, and deliveries
    this.calculateTotalDistanceAndTime(); // Recalculate total distance and time based on filtered orders
    this.calculateTotalDeliveries(); // Calculate total deliveries
    this.calculateTotalPages(); // Recalculate total pages after filtering
  }

  calculateTotalDistanceAndTime(): void {
    // Reset totals before calculating
    this.totalDistance = 0;
    this.totalTime = 0;

    // Sum distance and time from the filtered orders
    this.filteredOrders.forEach(order => {
      this.totalDistance += order.deliveryDistance; // Sum delivery distances
      this.totalTime += order.deliveryTime; // Sum delivery times
    });
  }

  calculateTotalDeliveries(): void {
    this.totalDeliveries = this.filteredOrders.length;
  }

  getNextDay(dateString: string) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1); // add 1 day
    return date;
  }


  showCalculationResult(): void {
    // Display a SweetAlert with the calculation results
    const driverName = this.selectedDriver ? this.getDriverName(Number(this.selectedDriver)) : 'All Drivers';
    Swal.fire({
      title: 'Performance Overview',
      width: '600px',
      padding: '0',
      showCloseButton: true,
      customClass: {
        popup: 'premium-swal-popup',
        title: 'swal2-title',
        htmlContainer: 'swal2-html-container',
        confirmButton: 'swal2-confirm'
      },
      html: `
        <div class="section-title-premium"><i class="fas fa-chart-bar"></i> Efficiency Metrics</div>
        <div class="details-grid-premium">
          <div class="detail-item-premium">
            <label>Driver</label>
            <span>${driverName}</span>
          </div>
          <div class="detail-item-premium">
            <label>Total Deliveries</label>
            <span class="bag-val">${this.totalDeliveries}</span>
          </div>
          <div class="detail-item-premium">
            <label>Total Distance</label>
            <span class="metric-badge distance" style="display:inline-block; font-size:1.1rem; padding:8px 15px;">${this.totalDistance.toFixed(2)} km</span>
          </div>
          <div class="detail-item-premium">
            <label>Total Time</label>
            <span class="metric-badge time" style="display:inline-block; font-size:1.1rem; padding:8px 15px;">${this.totalTime.toFixed(0)} mins</span>
          </div>
        </div>
      `,
      confirmButtonText: 'Close'
    });
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
    }
  }

  toggleDriverDropdown(): void {
    this.isDriverDropdownOpen = !this.isDriverDropdownOpen;
  }

  selectDriverOption(driver: Driver): void {
    this.selectedDriver = driver.id.toString();
    this.isDriverDropdownOpen = false;
    this.filterOrders();
  }

  getSelectedDriverName(): string {
    const driver = this.drivers.find(d => d.id.toString() == this.selectedDriver);
    return driver ? driver.username : 'Select a Driver';
  }
}
