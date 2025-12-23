import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/admin.service';
import Swal from 'sweetalert2';
import { catchError, forkJoin, of } from 'rxjs';

export interface Order {
  type: string;
  id: number;
  order_id: number;
  user_id:number;
  tips:any;
  price: number;
  delivery_date: string;
  address: string;
  contact: string;
  instruction: string;
  status: string;
  zipcode?: string;
  ort?: string
}

export interface OrderDetails{

  product_name: string;
  quantity: number;

}

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit {
  Orders: Order[] = [];
  orderDetails : OrderDetails[] = [];
  searchTerm: string = '';
  searchEmail: string = '';
  searchPhone: string = '';
  searchOrderId: string = '';
  searchStatus: string = '';
  searchDate: string = '';
  searchPrice: string = '';
  page: number = 1;
  validIndex: number = 0;
  itemsPerPage: number = 50;
  subscriptionOrders: Order[] = [];
  showSubscriptionOrders: boolean = false;
  mergedOrders: any[] = [];


  constructor(private router: Router, private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadOrder();
    this.loadSubsOrder();
    // this.loadAllOrders();
  }

loadOrder(): void {
  this.adminService.loadOrders().subscribe(
    (response: any) => {
      this.Orders = response.orders
        .filter((order: any) => {
          const status = (order.status || '').toLowerCase();
          return status === 'pending' || status === 'cancelling';
        })
        .map((order: any) => ({
          id: order.id ?? '',
          order_id: order.order_id ?? '',
          price: order.price ?? 0,
          delivery_date: order.delivery_date ?? '',
          address: order.address ?? '',
          zipcode: order.zipcode ?? '',
          ort: order.ort ?? '',
          contact: order.contact ?? '',
          instruction: order.instruction ?? '',
          status: order.status ? order.status.toLowerCase() : ''
        }));
    },
    error => {
      console.error('Error fetching Orders:', error);
    }
  );
}

  
  loadSubsOrder(): void {
  this.adminService.loadSubsOrders().subscribe(
    (response: any) => {
      this.subscriptionOrders = response.subscribeData
        .filter((order: any) => {
          const status = (order.status || "pending").toLowerCase();
          // return status == "pending" || status === 'cancelling';
                    return status == "pending";

        })
        .map((order: any) => ({
          id: order.id,
          user_id: order.user_id,
          order_id: order.order_id,
          price: order.price,
          delivery_date: order.delivery_date,
          address: order.address,
          zipcode: order.zipcode ?? '',
          ort: order.ort ?? '',
          contact: order.contact,
          instruction: order.instruction,
          status: order.status || 'pending',
          tips: order.tips
        }));
        
    },

    
    error => {
      console.error('Error fetching Subscription Orders:', error);
    }
  );
}


// loadAllOrders(): void {
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
//           return status === 'pending' || status === 'cancelling';
//         })
//         .map((order: any) => ({
//           id: order.id ?? '',
//           order_id: order.order_id ?? '',
//           price: order.price ?? 0,
//           delivery_date: order.delivery_date ?? '',
//           address: order.address ?? '',
//           zipcode: order.zipcode ?? '',
//           ort: order.ort ?? '',
//           contact: order.contact ?? '',
//           instruction: order.instruction ?? '',
//           status: order.status ? order.status.toLowerCase() : '',
//           type: 'normal', // To identify source if needed
//           tips: null
//         }));

//       const processedSubsOrders = (subsOrders.subscribeData || [])
//         .filter((order: any) => {
//           const status = (order.status || 'pending').toLowerCase();
//           return status === 'pending' || status === 'cancelling';
//         })
//         .map((order: any) => ({
//           id: order.id ?? '',
//           order_id: order.order_id ?? '',
//           price: order.price ?? 0,
//           delivery_date: order.delivery_date ?? '',
//           address: order.address ?? '',
//           zipcode: order.zipcode ?? '',
//           ort: order.ort ?? '',
//           contact: order.contact ?? '',
//           instruction: order.instruction ?? '',
//           status: order.status ? order.status.toLowerCase() : 'pending',
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

 

 get filteredOrders() {
    const orders = this.showSubscriptionOrders ? this.subscriptionOrders : this.Orders;
    return orders.filter(order =>
      (!this.searchEmail || order.address.toLowerCase().includes(this.searchEmail.toLowerCase())) &&
      (!this.searchPhone || order.contact.includes(this.searchPhone)) &&
      (!this.searchOrderId || order.order_id.toString().includes(this.searchOrderId)) &&
      (!this.searchPrice || order.price.toString().includes(this.searchPrice)) &&
      (!this.searchStatus || order.status.toLowerCase().includes(this.searchStatus.toLowerCase())) &&
      (!this.searchDate || new Date(order.delivery_date).toISOString().split('T')[0] === this.searchDate) 
    );
  }

  
  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.itemsPerPage);
  }


  updateOrderStatus(order: Order, status: string): void {
  Swal.fire({
    title: 'Are you sure?',
    text: `Do you want to update the status to '${status}'?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, update it!',
    cancelButtonText: 'No, cancel!'
  }).then(result => {
    if (result.isConfirmed) {
      order.status = status;

      const updateCall = order.type === 'subscription'
        ? this.adminService.updateSubscriptionOrders(order.id, { status })
        : this.adminService.updateOrders(order.id, { status });

      updateCall.subscribe(
        () => {
          this.mergedOrders = this.mergedOrders.filter(o => o.id !== order.id);
          Swal.fire('Updated!', `Order status has been updated to '${status}'.`, 'success');
        },
        error => {
          Swal.fire('Error', 'Failed to update status', 'error');
        }
      );
    }
  });
}


  // updateOrderStatus(order: Order, status: string): void {
  //   Swal.fire({
  //     title: 'Are you sure?',
  //     text: `Do you want to update the status to '${status}'?`,
  //     icon: 'warning',
  //     showCancelButton: true,
  //     confirmButtonText: 'Yes, update it!',
  //     cancelButtonText: 'No, cancel!'
  //   }).then(result => {
  //     if (result.isConfirmed) {
  //       order.status = status;
  //       this.adminService.updateOrders(order.id, { status: order.status }).subscribe(
  //         () => {
  //           this.Orders = this.Orders.filter((p) => p.id !== order.id);
  //           Swal.fire('Updated!', `Order status has been updated to '${status}'.`, 'success');
  //           // this.loadOrder();
  //         },
  //         error => {
  //           Swal.fire('Error', 'Failed to update status', 'error');
  //         }
  //       );
  //     }
  //   });
  // }

  updateSubscriptionOrderStatus(order: Order, status: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to update the status to '${status}'?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'No, cancel!'
    }).then(result => {
      if (result.isConfirmed) {
        order.status = status;
        this.adminService.updateSubscriptionOrders(order.id, { status: order.status }).subscribe(
          () => {
            this.Orders = this.Orders.filter((p) => p.id !== order.id);
            Swal.fire('Updated!', `Subscription Order status has been updated to '${status}'.`, 'success');
            this.loadOrder();
          },
          error => {
            Swal.fire('Error', 'Failed to update status', 'error');
          }
        );
      }
    });
  }

  loadOrderDetails(order_id:any):void{
    this.adminService.loadDetailsOrder(order_id).subscribe(
      (response:any) => {
        this.orderDetails = response.orders.map((order:any) => ({

           product_name: order.product_name,
           quantity: order.quantity,

        }))
      },
      error => {
        console.error('Error fetching OrdersDetails:', error);
      }
    )
  }


  updateSubOrderStatus(order: Order, status: string): void {

    console.log('====================================');
    console.log(order);
    console.log('====================================');
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to update the status to orderLists`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'No, cancel!'
    }).then(result => {
      if (result.isConfirmed) {
        order.status = status;
        this.adminService.updateSubOrders(order.id, order).subscribe(
          () => {
            Swal.fire('Updated!', `Order status has been updated to '${status}'.`, 'success');
            this.loadOrder();
          },
          error => {
            Swal.fire('Error', 'Failed to update status', 'error');
          }
        );
      }
    });
  }


  

 

  viewOrder(order_id: any): void {
    const orderDetails$ = this.adminService.loadDetailsOrder(order_id);
  
    
    const order$ = this.adminService.loadOrders();
  
    
    Promise.all([orderDetails$.toPromise(), order$.toPromise()])
      .then(([orderDetailsResponse, ordersResponse]: any[]) => {
       
        const orderDetails = orderDetailsResponse.orders.map((order: any) => ({
          product_name: order.product_name,
          quantity: order.quantity,
          price: order.price
        }));
  
      
        const order = ordersResponse.orders.find((o: any) => o.order_id === order_id);
  
        if (order) {
          Swal.fire({
            title: `Order Details - ${order_id}`,
            html: `
              <p><strong>Order ID:</strong> ${order.order_id}</p>
              <p><strong>Customer Name:</strong> ${order.username}</p>
              <p><strong>Address:</strong> ${order.address}</p>
              <p><strong>Contact:</strong> ${order.contact}</p>
              <p><strong>Instruction:</strong> ${order.instruction}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              <p><strong>Delivery Date:</strong> ${order.delivery_date}</p>
              <p><strong>Tipps:</strong> ${order.tips}€</p>
              <p><strong>Total Price:</strong> ${(Number(order.price) + Number(order.tips)).toFixed(2)}€</p>
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
        
              <label>Große Tüte</label> 
              <input id="große-tüte" type='number' style='width:100px'><br><br>
              <label>Mittlere Tüte</label> 
              <input id="mittlere-tüte" type='number' style='width:100px'><br><br>
              <label>Baguette Tüte</label> 
              <input id="baguette-tüte" type='number' style='width:100px'><br><br>
               <label>Zusätzliche Tüte</label>
              <input id="zusätzliche_tüte" type='number' style='width:100px'><br><br>
            `,
            icon: "info",
            confirmButtonText: "Submit",
            didOpen: () => {
              // No specific logic needed here for inputs; handled on confirm button click.
            },
            preConfirm: () => {
              // Fetch input values from the input fields.
              const großeTüte = (document.getElementById("große-tüte") as HTMLInputElement)?.value || "0";
              const mittlereTüte = (document.getElementById("mittlere-tüte") as HTMLInputElement)?.value || "0";
              const baguetteTüte = (document.getElementById("baguette-tüte") as HTMLInputElement)?.value || "0";
              const ZusätzlicheTüte = (document.getElementById("zusätzliche_tüte") as HTMLInputElement)?.value || "0";
        
              // Validate input values.
              if (!großeTüte && !mittlereTüte && !baguetteTüte && !ZusätzlicheTüte) {
                Swal.showValidationMessage("Please enter at least one bag quantity.");
                return null;
              }
        
              // Return the values to handle in `then` block.
              return {
                großeTüte: parseInt(großeTüte, 10),
                mittlereTüte: parseInt(mittlereTüte, 10),
                baguetteTüte: parseInt(baguetteTüte, 10),
                ZusätzlicheTüte: parseInt(ZusätzlicheTüte, 10)
              };
            },
          }).then((result) => {
            if (result.isConfirmed && result.value) {
              const { großeTüte, mittlereTüte, baguetteTüte, ZusätzlicheTüte } = result.value;
        
              // Prepare payload for API call.
              const bagDetails = {
                gro_bag: großeTüte,
                mitt_bag: mittlereTüte,
                bagu_bag: baguetteTüte,
                zusätzliche_tüte:ZusätzlicheTüte,
              };
        
              // Make API call to update the order bag details.
              this.adminService.updateOrderBag(order_id, bagDetails).subscribe(
                (response: any) => {
                  Swal.fire("Success", "Bag quantities updated successfully!", "success");
                },
                (error) => {
                  Swal.fire("Error", "Failed to update bag quantities. Please try again.", "error");
                  console.error("Error updating bag quantities:", error);
                }
              );
            }
          });
        }
         else {
          Swal.fire("Error", "Order not found!", "error");
        }
        
      })
      .catch((error) => {
        console.error("Error fetching order details:", error);
        Swal.fire("Error", "Failed to fetch order details. Please try again later.", "error");
      });
  }

  viewSubOrder(order_id: any): void {
    const orderDetails$ = this.adminService.loadDetailsOrder(order_id);
  
    
    const order$ = this.adminService.loadSubsOrders();
  
    
    Promise.all([orderDetails$.toPromise(), order$.toPromise()])
      .then(([orderDetailsResponse, ordersResponse]: any[]) => {
       
        const orderDetails = orderDetailsResponse.orders.map((order: any) => ({
          product_name: order.product_name,
          quantity: order.quantity,
          price: order.price
        }));


  
      
        const order = ordersResponse.subscribeData.find((o: any) => o.order_id == order_id);
  
        if (order) {
          Swal.fire({
            title: `Order Details - ${order_id}`,
            html: `
              <p><strong>User ID:</strong> ${order.id}</p>
              <p><strong>Order ID:</strong> ${order.order_id}</p>
              <p><strong>Address:</strong> ${order.address}</p>
              <p><strong>Contact:</strong> ${order.contact}</p>
              <p><strong>Instruction:</strong> ${order.instruction}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              <p><strong>Delivery Date:</strong> ${order.delivery_date}</p>
              <p><strong>Price:</strong> ${order.price}</p>
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
        
              <label>Große Tüte</label> 
              <input id="große-tüte" type='number' style='width:100px'><br><br>
              <label>Mittlere Tüte</label> 
              <input id="mittlere-tüte" type='number' style='width:100px'><br><br>
              <label>Baguette Tüte</label> 
              <input id="baguette-tüte" type='number' style='width:100px'><br><br>
               <label>Zusätzliche Tüte</label>
              <input id="zusätzliche_tüte" type='number' style='width:100px'><br><br>
            `,
            icon: "info",
            confirmButtonText: "Submit",
            didOpen: () => {
              // No specific logic needed here for inputs; handled on confirm button click.
            },
            preConfirm: () => {
              // Fetch input values from the input fields.
              const großeTüte = (document.getElementById("große-tüte") as HTMLInputElement)?.value || "0";
              const mittlereTüte = (document.getElementById("mittlere-tüte") as HTMLInputElement)?.value || "0";
              const baguetteTüte = (document.getElementById("baguette-tüte") as HTMLInputElement)?.value || "0";
              const ZusätzlicheTüte = (document.getElementById("zusätzliche_tüte") as HTMLInputElement)?.value || "0";
        
              // Validate input values.
              if (!großeTüte && !mittlereTüte && !baguetteTüte && !ZusätzlicheTüte) {
                Swal.showValidationMessage("Please enter at least one bag quantity.");
                return null;
              }
        
              // Return the values to handle in `then` block.
              return {
                großeTüte: parseInt(großeTüte, 10),
                mittlereTüte: parseInt(mittlereTüte, 10),
                baguetteTüte: parseInt(baguetteTüte, 10),
                ZusätzlicheTüte: parseInt(ZusätzlicheTüte, 10)
              };
            },
          }).then((result) => {
            if (result.isConfirmed && result.value) {
              const { großeTüte, mittlereTüte, baguetteTüte,ZusätzlicheTüte } = result.value;
        
              // Prepare payload for API call.
              const bagDetails = {
                gro_bag: großeTüte,
                mitt_bag: mittlereTüte,
                bagu_bag: baguetteTüte,
                zusätzliche_tüte:ZusätzlicheTüte
              };
        
              // Make API call to update the order bag details.
              this.adminService.updateOrderBag(order_id, bagDetails).subscribe(
                (response: any) => {
                  Swal.fire("Success", "Bag quantities updated successfully!", "success");
                },
                (error) => {
                  Swal.fire("Error", "Failed to update bag quantities. Please try again.", "error");
                  console.error("Error updating bag quantities:", error);
                }
              );
            }
          });
        }
         else {
          Swal.fire("Error", "Order not found!", "error");
        }
        
      })
      .catch((error) => {
        console.error("Error fetching order details:", error);
        Swal.fire("Error", "Failed to fetch order details. Please try again later.", "error");
      });
  }

  viewSubOrders(order_id: any): void {
    const orderDetails$ = this.adminService.loadDetailsSubscriptionOrder(order_id);
  
    
    const order$ = this.adminService.loadSubsOrders();
    
    Promise.all([orderDetails$.toPromise(), order$.toPromise()])
      .then(([orderDetailsResponse, ordersResponse]: any[]) => {
       
        const orderDetails = orderDetailsResponse.subscribeData.map((order: any) => ({
          product_name: order.product_name,
          quantity: order.quantity,
          price: order.price
        }));
  
      
        const order = ordersResponse.subscribeData.find((o: any) => o.order_id == order_id);
  
        if (order) {
          Swal.fire({
            title: `Order Details - ${order_id}`,
            html: `
              <p><strong>User ID:</strong> ${order.id}</p>
              <p><strong>Order ID:</strong> ${order.order_id}</p>
              <p><strong>Address:</strong> ${order.address}</p>
              <p><strong>Contact:</strong> ${order.contact}</p>
              <p><strong>Instruction:</strong> ${order.instruction}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              <p><strong>Delivery Date:</strong> ${order.delivery_date}</p>
              <p><strong>Price:</strong> ${order.price}</p>
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
        
              <label>Große Tüte</label> 
              <input id="große-tüte" type='number' style='width:100px'><br><br>
              <label>Mittlere Tüte</label> 
              <input id="mittlere-tüte" type='number' style='width:100px'><br><br>
              <label>Baguette Tüte</label> 
              <input id="baguette-tüte" type='number' style='width:100px'><br><br>
              <label>Zusätzliche Tüte</label>
              <input id="zusätzliche_tüte" type='number' style='width:100px'><br><br>
            `,
            icon: "info",
            confirmButtonText: "Submit",
            didOpen: () => {
              // No specific logic needed here for inputs; handled on confirm button click.
            },
            preConfirm: () => {
              // Fetch input values from the input fields.
              const großeTüte = (document.getElementById("große-tüte") as HTMLInputElement)?.value || "0";
              const mittlereTüte = (document.getElementById("mittlere-tüte") as HTMLInputElement)?.value || "0";
              const baguetteTüte = (document.getElementById("baguette-tüte") as HTMLInputElement)?.value || "0";
              const ZusätzlicheTüte = (document.getElementById("zusätzliche_tüte") as HTMLInputElement)?.value || "0";
        
              // Validate input values.
              if (!großeTüte && !mittlereTüte && !baguetteTüte && !ZusätzlicheTüte) {
                Swal.showValidationMessage("Please enter at least one bag quantity.");
                return null;
              }
        
              // Return the values to handle in `then` block.
              return {
                großeTüte: parseInt(großeTüte, 10),
                mittlereTüte: parseInt(mittlereTüte, 10),
                baguetteTüte: parseInt(baguetteTüte, 10),
                ZusätzlicheTüte: parseInt(ZusätzlicheTüte, 10)
              };
            },
          }).then((result) => {
            if (result.isConfirmed && result.value) {
              const { großeTüte, mittlereTüte, baguetteTüte, ZusätzlicheTüte } = result.value;
        
              // Prepare payload for API call.
              const bagDetails = {
                gro_bag: großeTüte,
                mitt_bag: mittlereTüte,
                bagu_bag: baguetteTüte,
                zusätzliche_tüte:ZusätzlicheTüte
              };
        
              // Make API call to update the order bag details.
              this.adminService.updateSubcriptionOrderBag(order_id, bagDetails).subscribe(
                (response: any) => {
                  Swal.fire("Success", "Bag quantities updated successfully!", "success");
                },
                (error) => {
                  Swal.fire("Error", "Failed to update bag quantities. Please try again.", "error");
                  console.error("Error updating bag quantities:", error);
                }
              );
            }
          });
        }
         else {
          Swal.fire("Error", "Order not found!", "error");
        }
        
      })
      .catch((error) => {
        console.error("Error fetching order details:", error);
        Swal.fire("Error", "Failed to fetch order details. Please try again later.", "error");
      });
  }

  get displayedOrders(): Order[] {
    return this.showSubscriptionOrders ? this.subscriptionOrders : this.filteredOrders;
  }

  SubscripOrders(): void {
    if (!this.showSubscriptionOrders && this.subscriptionOrders.length == 0) {
      this.loadSubsOrder();
    }
    this.showSubscriptionOrders = !this.showSubscriptionOrders;
    this.page = 1; // Reset to the first page when toggling.
  }
  


  

  onPageChange(newPage: number): void {
    this.page = newPage;
    
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
    }
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
    }
  }
}
