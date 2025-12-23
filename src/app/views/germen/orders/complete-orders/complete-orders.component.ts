import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/admin.service';
import Swal from 'sweetalert2';
import { url } from 'src/app/config';

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
  url : any

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
      (error) => console.error('Error fetching drivers:', error)
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
      (error) => console.error('Error fetching orders:', error)
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
          (error) => {
            Swal.fire('Error', 'Failed to reassign driver.', 'error');
            console.error('Error reassigning driver:', error);
          }
        );
      }
    });
  }

  // View order details in a modal
  viewOrder(order: Order): void {
    Swal.fire({
      title: `Order Details - ${order.order_id}`,
      html: `
        <p><strong>Order ID:</strong> ${order.order_id}</p>
        <p><strong>User ID:</strong> ${order.user_id}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Delivery Person:</strong> ${order.driverName}</p>
        <p><strong>Delivery Date:</strong> ${this.extractDate(order.date)}</p>
        <p><strong>Complete Time:</strong> ${order.complete_time} hours</p>
        <p><strong>Complete Distance:</strong> ${order.complete_distance} km</p>
        <img src="${this.url}/${order.picture}" alt="Delivery Picture" style="width: 100px; height: 100px; object-fit: cover;">
      `,
      icon: 'info',
      confirmButtonText: 'Close',
    });
  }
}
