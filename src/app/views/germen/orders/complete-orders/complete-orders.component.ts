import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { Router } from '@angular/router';
import { AdminService } from '../../../../admin.service';
import Swal from 'sweetalert2';
import { url } from '../../../../config';

// Define the Order interface to match the API response structure
export interface Order {
  id: number;
  delivery_person_id: number;
  order_id: string;
  user_id: number;
  complete_time: number;
  complete_distance: number;
  picture: string;
  date: string | null; // ISO date string or null
  status: string;
  time: string;
  driverName?: string; // Resolved driver name (optional)
}

export interface Driver {
  id: number;
  username: string;
  role: string;
}

@Component({
  selector: 'app-complete-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './complete-orders.component.html',
  styleUrls: ['./complete-orders.component.scss']
})
export class CompleteOrdersComponent implements OnInit {
  Orders: Order[] = [];
  drivers: Driver[] = [];
  searchOrderId: string = '';
  searchStatus: string = '';
  searchDate: string = '';
  page: number = 1;
  itemsPerPage: number = 50;
  url: any

  constructor(private router: Router, private adminService: AdminService) {
    this.url = url
  }

  ngOnInit(): void {
    this.loadDrivers();
    this.loadOrders();
  }

  // Load drivers from the backend
  loadDrivers(): void {
    this.adminService.loadUsers().subscribe(
      (response: { user: Driver[] }) => {
        this.drivers = response.user.filter((user) => user.role.toLowerCase() === 'driver');
      },
      (error: any) => console.error('Error fetching drivers:', error)
    );
  }

  // Load orders from the backend
  loadOrders(): void {
    this.adminService.deliverycompleteAll().subscribe(
      (response: { orders: Order[] }) => {
        this.Orders = response.orders.map((order) => ({
          ...order,
          driverName: this.getDriverName(order.delivery_person_id) // Map driver name to the order
        }));
      },
      (error: any) => console.error('Error fetching orders:', error)
    );
  }

  // Get driver name based on delivery_person_id
  getDriverName(driverId: number): string {
    const driver = this.drivers.find((d) => d.id === driverId);
    return driver ? driver.username : 'Unassigned';
  }

  // Filtered orders for the table
  get filteredOrders(): Order[] {
    return this.Orders.filter((order) => {
      const orderDate = this.extractDate(order.date); // Extract the date from the datetime
      return (
        (!this.searchOrderId || order.order_id.toLowerCase().includes(this.searchOrderId.toLowerCase())) &&
        (!this.searchStatus || order.status.toLowerCase().includes(this.searchStatus.toLowerCase())) &&
        (!this.searchDate || orderDate === this.searchDate)
      );
    });
  }

  // Utility function to extract date in YYYY-MM-DD format
  // Utility function to normalize the date format
  extractDate(dateTime: string | null): string {
    if (!dateTime) return ''; // Handle null or undefined values

    // Attempt parsing based on known formats
    let date: Date;
    if (/^\d{4}-\d{2}-\d{2}/.test(dateTime)) {
      date = new Date(dateTime); // ISO format
    } else if (/^\d{2}-\d{2}-\d{4}/.test(dateTime)) {
      const [day, month, year] = dateTime.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      console.warn('Unrecognized date format:', dateTime);
      return ''; // Return empty string for invalid formats
    }

    // Validate the parsed date
    return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]; // Normalize to YYYY-MM-DD
  }


  // Pagination logic
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

  // Edit driver allocation for an order
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
        this.adminService.updateOrders(order.id, { delivery_person_id: newDriverId }).subscribe(
          () => {
            Swal.fire('Success', 'Driver reassigned successfully!', 'success');
            this.loadOrders(); // Refresh orders to update driver info
          },
          (error: any) => {
            Swal.fire('Error', 'Failed to reassign driver.', 'error');
            console.error('Error reassigning driver:', error);
          }
        );
      }
    });
  }

  // View order details in a modal
  viewOrder(order: Order): void {
    const deliveryImage = order.picture ? order.picture : '';

    Swal.fire({
      title: `Order Details - ${order.order_id}`,
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
        <div class="section-title-premium"><i class="fas fa-info-circle"></i> Delivery Summary</div>
        <div class="details-grid-premium">
          <div class="detail-item-premium">
            <label>Order ID</label>
            <span>#${order.order_id}</span>
          </div>
          <div class="detail-item-premium">
            <label>User ID</label>
            <span>#${order.user_id}</span>
          </div>
          <div class="detail-item-premium">
            <label>Driver</label>
            <span>${order.driverName}</span>
          </div>
          <div class="detail-item-premium">
            <label>Delivery Date</label>
            <span>${this.extractDate(order.date)}</span>
          </div>
          <div class="detail-item-premium">
            <label>Complete Time</label>
            <span>${order.time || 'N/A'}</span>
          </div>
          <div class="detail-item-premium">
            <label>Status</label>
            <span style="text-transform: capitalize;">${order.status}</span>
          </div>
        </div>

        ${deliveryImage ? `
          <div class="section-title-premium"><i class="fas fa-camera"></i> Delivery Evidence</div>
          <div style="text-align: center; margin-top: 15px;">
            <img src="${deliveryImage}" alt="Evidence" style="width: 100%; max-height: 300px; border-radius: 15px; object-fit: contain; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 2px solid #fff;">
          </div>
        ` : `
          <div class="section-title-premium"><i class="fas fa-camera-slash"></i> Delivery Evidence</div>
          <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 12px; color: #b2bec3;">
            <i class="fas fa-image fa-2x mb-2"></i>
            <p style="margin: 0; font-size: 0.9rem;">No picture available for this delivery</p>
          </div>
        `}
      `,
      confirmButtonText: 'Close',
    });
  }
}
