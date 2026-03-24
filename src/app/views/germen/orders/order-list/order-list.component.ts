import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/admin.service';
import Swal from 'sweetalert2';
import { catchError, forkJoin, of } from 'rxjs';

export interface Order {
  type?: string;
  id: number;
  order_id: string;
  user_id: number;
  tips: any;
  price: number;
  delivery_date: string;
  address: string;
  contact: string;
  instruction: string;
  status: string;
  zipcode?: string;
  ort?: string;
  is_age_verified?: number;
}

export interface OrderDetails {

  product_name: string;
  quantity: number;

}

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, TranslateModule],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit {
  Orders: Order[] = [];
  orderDetails: OrderDetails[] = [];
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


  constructor(private router: Router, private adminService: AdminService) { }

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
            status: order.status ? order.status.toLowerCase() : '',
            is_age_verified: order.is_age_verified ?? 0
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
            tips: order.tips,
            is_age_verified: order.is_age_verified ?? 0
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

  loadOrderDetails(order_id: any): void {
    this.adminService.loadDetailsOrder(order_id).subscribe(
      (response: any) => {
        this.orderDetails = response.orders.map((order: any) => ({

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
            title: `Bestellung Details`,
            width: '750px',
            padding: '0',
            showCloseButton: true,
            customClass: {
              popup: 'premium-swal-popup',
              title: 'swal2-title',
              htmlContainer: 'swal2-html-container',
              confirmButton: 'swal2-confirm'
            },
            html: `
              <div class="section-title-premium"><i class="fas fa-info-circle"></i> Kundendetails</div>
              <div class="details-grid-premium">
                <div class="detail-item-premium">
                  <label>Bestell-ID</label>
                  <span>#${order.order_id}</span>
                </div>
                <div class="detail-item-premium">
                  <label>Kunde</label>
                  <span>${order.username}</span>
                </div>
                <div class="detail-item-premium full-width">
                  <label>Lieferadresse</label>
                  <span>${order.address}</span>
                </div>
                <div class="detail-item-premium">
                  <label>Kontakt</label>
                  <span>${order.contact}</span>
                </div>
                <div class="detail-item-premium">
                  <label>Lieferdatum</label>
                  <span>${order.delivery_date}</span>
                </div>
              </div>

              <div class="section-title-premium"><i class="fas fa-shopping-basket"></i> Bestellauswahl</div>
              <div class="product-list-premium">
                ${orderDetails.map((detail: any) => `
                  <div class="product-row">
                    <span class="name">${detail.product_name}</span>
                    <span class="qty">x ${detail.quantity}</span>
                    <span class="price">€${detail.price}</span>
                  </div>
                `).join('')}
              </div>

              <div class="section-title-premium"><i class="fas fa-box"></i> Verpackung</div>
              <div class="bags-section-premium">
                <div class="bags-grid">
                  <div class="bag-input-group">
                    <label>Große Tüte</label>
                    <input id="große-tüte" type="number" placeholder="0">
                  </div>
                  <div class="bag-input-group">
                    <label>Mittlere Tüte</label>
                    <input id="mittlere-tüte" type="number" placeholder="0">
                  </div>
                  <div class="bag-input-group">
                    <label>Baguette Tüte</label>
                    <input id="baguette-tüte" type="number" placeholder="0">
                  </div>
                  <div class="bag-input-group">
                    <label>Zusätzliche Tüte</label>
                    <input id="zusätzliche_tüte" type="number" placeholder="0">
                  </div>
                </div>
              </div>

              <div class="pricing-summary-premium">
                <div class="total-label">Gesamtbetrag (inkl. Trinkgeld)</div>
                <div class="total-value">${(Number(order.price) + Number(order.tips)).toFixed(2)}€</div>
              </div>
            `,
            confirmButtonText: "Absenden",
            preConfirm: () => {
              const großeTüte = (document.getElementById("große-tüte") as HTMLInputElement)?.value || "0";
              const mittlereTüte = (document.getElementById("mittlere-tüte") as HTMLInputElement)?.value || "0";
              const baguetteTüte = (document.getElementById("baguette-tüte") as HTMLInputElement)?.value || "0";
              const ZusätzlicheTüte = (document.getElementById("zusätzliche_tüte") as HTMLInputElement)?.value || "0";

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
              const bagDetails = {
                gro_bag: großeTüte,
                mitt_bag: mittlereTüte,
                bagu_bag: baguetteTüte,
                zusätzliche_tüte: ZusätzlicheTüte,
              };

              this.adminService.updateOrderBag(order_id, bagDetails).subscribe(
                () => Swal.fire({ title: "Erfolg", text: "Tütenmengen erfolgreich aktualisiert!", icon: "success", timer: 2000, showConfirmButton: false }),
                (error) => {
                  Swal.fire("Fehler", "Tütenmengen konnten nicht aktualisiert werden.", "error");
                  console.error("Error updating bag quantities:", error);
                }
              );
            }
          });
        } else {
          Swal.fire("Fehler", "Bestellung nicht gefunden!", "error");
        }
      })
      .catch((error) => {
        console.error("Error fetching order details:", error);
        Swal.fire("Fehler", "Bestelldaten konnten nicht geladen werden.", "error");
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
            width: '750px',
            padding: '0',
            showCloseButton: true,
            customClass: {
              popup: 'premium-swal-popup',
              title: 'swal2-title',
              htmlContainer: 'swal2-html-container',
              confirmButton: 'swal2-confirm'
            },
            html: `
              <div class="section-title-premium"><i class="fas fa-info-circle"></i> Übersicht</div>
              <div class="details-grid-premium">
                <div class="detail-item-premium">
                  <label>User ID</label>
                  <span>#${order.id}</span>
                </div>
                <div class="detail-item-premium">
                  <label>Order ID</label>
                  <span>#${order.order_id}</span>
                </div>
                <div class="detail-item-premium full-width">
                  <label>Address</label>
                  <span>${order.address}</span>
                </div>
                <div class="detail-item-premium">
                  <label>Contact</label>
                  <span>${order.contact}</span>
                </div>
                <div class="detail-item-premium">
                  <label>Status</label>
                  <span style="text-transform: capitalize;">${order.status}</span>
                </div>
                <div class="detail-item-premium">
                  <label>Delivery Date</label>
                  <span>${order.delivery_date}</span>
                </div>
              </div>

              <div class="section-title-premium"><i class="fas fa-shopping-basket"></i> Products</div>
              <div class="product-list-premium">
                ${orderDetails.map((detail: any) => `
                  <div class="product-row">
                    <span class="name">${detail.product_name}</span>
                    <span class="qty">x ${detail.quantity}</span>
                    <span class="price">€${detail.price}</span>
                  </div>
                `).join('')}
              </div>

              <div class="section-title-premium"><i class="fas fa-box"></i> Packaging</div>
              <div class="bags-section-premium">
                <div class="bags-grid">
                  <div class="bag-input-group">
                    <label>Große Tüte</label>
                    <input id="große-tüte" type="number" placeholder="0">
                  </div>
                  <div class="bag-input-group">
                    <label>Mittlere Tüte</label>
                    <input id="mittlere-tüte" type="number" placeholder="0">
                  </div>
                  <div class="bag-input-group">
                    <label>Baguette Tüte</label>
                    <input id="baguette-tüte" type="number" placeholder="0">
                  </div>
                  <div class="bag-input-group">
                    <label>Zusätzliche Tüte</label>
                    <input id="zusätzliche_tüte" type="number" placeholder="0">
                  </div>
                </div>
              </div>

              <div class="pricing-summary-premium">
                <div class="total-label">Price</div>
                <div class="total-value">${order.price}€</div>
              </div>
            `,
            confirmButtonText: "Submit",
            preConfirm: () => {
              const großeTüte = (document.getElementById("große-tüte") as HTMLInputElement)?.value || "0";
              const mittlereTüte = (document.getElementById("mittlere-tüte") as HTMLInputElement)?.value || "0";
              const baguetteTüte = (document.getElementById("baguette-tüte") as HTMLInputElement)?.value || "0";
              const ZusätzlicheTüte = (document.getElementById("zusätzliche_tüte") as HTMLInputElement)?.value || "0";

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
              const bagDetails = {
                gro_bag: großeTüte,
                mitt_bag: mittlereTüte,
                bagu_bag: baguetteTüte,
                zusätzliche_tüte: ZusätzlicheTüte
              };

              this.adminService.updateOrderBag(order_id, bagDetails).subscribe(
                () => Swal.fire("Erfolg", "Tütenmengen erfolgreich aktualisiert!", "success"),
                (error) => {
                  Swal.fire("Fehler", "Tütenmengen konnten nicht aktualisiert werden.", "error");
                  console.error("Error updating bag quantities:", error);
                }
              );
            }
          });
        } else {
          Swal.fire("Fehler", "Bestellung nicht gefunden!", "error");
        }
      })
      .catch((error) => {
        console.error("Error fetching order details:", error);
        Swal.fire("Fehler", "Bestelldaten konnten nicht geladen werden.", "error");
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
            title: `Abonnement Details`,
            width: '750px',
            padding: '0',
            showCloseButton: true,
            customClass: {
              popup: 'premium-swal-popup',
              title: 'swal2-title',
              htmlContainer: 'swal2-html-container',
              confirmButton: 'swal2-confirm'
            },
            html: `
              <div class="section-title-premium"><i class="fas fa-info-circle"></i> Bestelldaten</div>
              <div class="details-grid-premium">
                <div class="detail-item-premium">
                  <label>Benutzer-ID</label>
                  <span>#${order.id}</span>
                </div>
                <div class="detail-item-premium">
                  <label>Bestell-ID</label>
                  <span>#${order.order_id}</span>
                </div>
                <div class="detail-item-premium full-width">
                  <label>Adresse</label>
                  <span>${order.address}</span>
                </div>
                <div class="detail-item-premium">
                  <label>Kontakt</label>
                  <span>${order.contact}</span>
                </div>
                <div class="detail-item-premium">
                  <label>Status</label>
                  <span style="text-transform: capitalize;">${order.status}</span>
                </div>
                <div class="detail-item-premium">
                  <label>Lieferdatum</label>
                  <span>${order.delivery_date}</span>
                </div>
              </div>

              <div class="section-title-premium"><i class="fas fa-shopping-basket"></i> Produkte</div>
              <div class="product-list-premium">
                ${orderDetails.map((detail: any) => `
                  <div class="product-row">
                    <span class="name">${detail.product_name}</span>
                    <span class="qty">x ${detail.quantity}</span>
                    <span class="price">€${detail.price}</span>
                  </div>
                `).join('')}
              </div>

              <div class="section-title-premium"><i class="fas fa-box"></i> Verpackung</div>
              <div class="bags-section-premium">
                <div class="bags-grid">
                  <div class="bag-input-group">
                    <label>Große Tüte</label>
                    <input id="große-tüte" type="number" placeholder="0">
                  </div>
                  <div class="bag-input-group">
                    <label>Mittlere Tüte</label>
                    <input id="mittlere-tüte" type="number" placeholder="0">
                  </div>
                  <div class="bag-input-group">
                    <label>Baguette Tüte</label>
                    <input id="baguette-tüte" type="number" placeholder="0">
                  </div>
                  <div class="bag-input-group">
                    <label>Zusätzliche Tüte</label>
                    <input id="zusätzliche_tüte" type="number" placeholder="0">
                  </div>
                </div>
              </div>

              <div class="pricing-summary-premium">
                <div class="total-label">Gesamtpreis</div>
                <div class="total-value">${order.price}€</div>
              </div>
            `,
            confirmButtonText: "Speichern",
            preConfirm: () => {
              const großeTüte = (document.getElementById("große-tüte") as HTMLInputElement)?.value || "0";
              const mittlereTüte = (document.getElementById("mittlere-tüte") as HTMLInputElement)?.value || "0";
              const baguetteTüte = (document.getElementById("baguette-tüte") as HTMLInputElement)?.value || "0";
              const ZusätzlicheTüte = (document.getElementById("zusätzliche_tüte") as HTMLInputElement)?.value || "0";

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
              const bagDetails = {
                gro_bag: großeTüte,
                mitt_bag: mittlereTüte,
                bagu_bag: baguetteTüte,
                zusätzliche_tüte: ZusätzlicheTüte
              };

              this.adminService.updateSubcriptionOrderBag(order_id, bagDetails).subscribe(
                () => Swal.fire({ title: "Erfolg", text: "Tütenmengen erfolgreich aktualisiert!", icon: "success", timer: 2000, showConfirmButton: false }),
                (error) => {
                  Swal.fire("Fehler", "Tütenmengen konnten nicht aktualisiert werden.", "error");
                  console.error("Error updating bag quantities:", error);
                }
              );
            }
          });
        } else {
          Swal.fire("Fehler", "Bestellung nicht gefunden!", "error");
        }
      })
      .catch((error) => {
        console.error("Error fetching order details:", error);
        Swal.fire("Fehler", "Bestelldaten konnten nicht geladen werden.", "error");
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
