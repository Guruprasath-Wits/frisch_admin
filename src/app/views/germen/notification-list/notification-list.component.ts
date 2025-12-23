import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import Swal from 'sweetalert2';
import { AdminService } from 'src/app/admin.service';

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
  filterStatus: string = 'all';

  constructor(private adminService: AdminService) {}

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
      (error) => {
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
    let htmlContent = `<p>${notification.desc}</p>`;
    if (notification.reason && notification.reason.trim() !== '') {
      htmlContent += `<p><strong>Reason:</strong> ${notification.reason}</p>`;
    }

    Swal.fire({
      title: notification.title,
      html: htmlContent,
      footer: `Date: ${new Date(notification.created_at).toLocaleString()}`,
      icon: 'info',
      confirmButtonText: 'Close',
    }).then(() => {
      this.adminService.updateStatus(notification.id, { status: 'read' }).subscribe(
        () => {
          console.log('Notification status updated successfully.');

          // Update the notification status in local array immediately
          notification.status = 'read';

          // Ensure filter update happens immediately
          this.onFilterChange(this.filterStatus as 'all' | 'unread' | 'read');
        },
        (error) => {
          console.error('Error updating notification status:', error);
        }
      );
    });
  }
}

  
  
  
  onFilterChange(filter: 'all' | 'unread' | 'read') {
    this.filterStatus = filter;
  }
}
