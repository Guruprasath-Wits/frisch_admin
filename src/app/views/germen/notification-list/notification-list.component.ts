import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { AdminService } from '../../../admin.service';

// Update the interface based on your API response structure
interface Notification {
  id: number;
  title: string;
  desc: string;
  status: string;
  created_at: string;
  reason: string;
}

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss']
})
export class NotificationListComponent implements OnInit {
  notifications: Notification[] = [];
  filterStatus: string = 'unread';

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadNotification();
  }

  loadNotification() {
    this.adminService.getNotification().subscribe(
      (response: any) => {
        if (response.status) {
          this.notifications = response.nodification;
          console.log('Loaded notifications:', this.notifications);
        }
      },
      (error: any) => {
        console.error('Error fetching notifications:', error);
      }
    );
  }

  get filteredNotifications() {
    if (this.filterStatus === 'all') {
      return this.notifications;
    }
    return this.notifications.filter(notification => notification.status === this.filterStatus);
  }

  // viewNotification(id: number) {
  //   const notification = this.notifications.find(n => n.id === id);
  //   if (notification) {
  //     Swal.fire({
  //       title: notification.title,
  //       text: notification.desc,
  //       footer: `Date: ${new Date(notification.created_at).toLocaleString()}`,
  //       icon: 'info',
  //       confirmButtonText: 'Close',
  //     }).then(() => {

  //       this.adminService.updateStatus(notification.id, { status: 'read' }).subscribe(
  //         () => {
  //           // notification.status = 'read'; 
  //           console.log('Notification status updated successfully.');
  //         },
  //         (error) => {
  //           console.error('Error updating notification status:', error);
  //         }
  //       );
  //     });
  //   }
  // }

  viewNotification(id: number) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      Swal.fire({
        title: notification.title,
        width: '480px',
        padding: '0',
        showCloseButton: true,
        customClass: {
          popup: 'premium-swal-popup',
          title: 'swal2-title',
          htmlContainer: 'swal2-html-container',
          confirmButton: 'swal2-confirm'
        },
        html: `
          <div style="padding: 10px 5px;">
            <!-- Premium Header Meta -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; background: #fff9e6; padding: 12px 20px; border-radius: 14px; border-left: 5px solid #f7ce3e;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <i class="${this.getIcon(notification.title)}" style="color: #f7ce3e; font-size: 1.1rem;"></i>
                <span style="font-weight: 800; color: #856404; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;">Notification Details</span>
              </div>
              <span style="background: white; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; color: #f7ce3e; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                ${new Date(notification.created_at).toLocaleDateString()}
              </span>
            </div>

            <!-- Content Card -->
            <div style="background: #ffffff; border: 2px solid #f1f2f6; border-radius: 20px; padding: 25px; margin-bottom: 20px; position: relative;">
               <span style="position: absolute; top: -11px; left: 20px; background: white; padding: 0 10px; font-size: 0.65rem; font-weight: 900; color: #a29bfe; text-transform: uppercase; letter-spacing: 1.2px;">Message</span>
               <p style="font-size: 1.05rem; line-height: 1.6; color: #2d3436; font-weight: 600; margin: 0;">
                 ${notification.desc}
               </p>
            </div>

            ${notification.reason && notification.reason.trim() !== '' ? `
            <div style="background: #fff8f8; border: 2px solid #ffecec; border-radius: 20px; padding: 22px; position: relative;">
               <span style="position: absolute; top: -11px; left: 20px; background: #fff8f8; padding: 0 10px; font-size: 0.65rem; font-weight: 900; color: #ff7675; text-transform: uppercase; letter-spacing: 1.2px;">Additional Reason</span>
               <div style="display: flex; align-items: flex-start; gap: 12px;">
                 <i class="fas fa-exclamation-circle" style="color: #ff7675; margin-top: 4px;"></i>
                 <p style="font-size: 0.95rem; color: #d63031; font-weight: 700; margin: 0; line-height: 1.5;">${notification.reason}</p>
               </div>
            </div>
            ` : ''}

            <!-- Timestamp Details -->
            <div style="margin-top: 25px; text-align: center; border-top: 1px dashed #edeff2; padding-top: 15px;">
              <span style="font-size: 0.75rem; color: #b2bec3; font-weight: 600;">
                <i class="far fa-clock" style="margin-right: 5px;"></i> Full Timestamp: ${new Date(notification.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        `,
        confirmButtonText: '<i class="fas fa-check-circle" style="margin-right: 8px;"></i> Acknowledge',
      }).then(() => {
        this.adminService.updateStatus(notification.id, { status: 'read' }).subscribe(
          () => {
            console.log('Notification status updated successfully.');
            notification.status = 'read';
            this.onFilterChange(this.filterStatus as 'all' | 'unread' | 'read');
          },
          (error: any) => {
            console.error('Error updating notification status:', error);
          }
        );
      });
    }
  }




  onFilterChange(filter: 'all' | 'unread' | 'read') {
    this.filterStatus = filter;
  }

  getIcon(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('order')) return 'fas fa-shopping-cart';
    if (lowerTitle.includes('job') || lowerTitle.includes('application')) return 'fas fa-briefcase';
    if (lowerTitle.includes('user') || lowerTitle.includes('account')) return 'fas fa-user';
    if (lowerTitle.includes('payment') || lowerTitle.includes('transaction')) return 'fas fa-credit-card';
    return 'fas fa-bell';
  }

  getIconColor(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('order')) return '#28a745'; // Green
    if (lowerTitle.includes('job') || lowerTitle.includes('application')) return '#17a2b8'; // Blue
    if (lowerTitle.includes('user') || lowerTitle.includes('account')) return '#ffc107'; // Yellow
    if (lowerTitle.includes('payment') || lowerTitle.includes('transaction')) return '#dc3545'; // Red
    return '#6c757d'; // Gray
  }
}
