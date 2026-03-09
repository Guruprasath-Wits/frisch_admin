import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { Router } from '@angular/router';
import { AdminService } from '../../../../admin.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent implements OnInit {

  page: number = 1;
  itemsPerPage: number = 5;
  contactUs: any[] = [];
  filteredcontactUs: any[] = [];

  constructor(private router: Router, private contactUservice: AdminService) { }

  ngOnInit(): void {
    this.loadContactUs();
  }

  loadContactUs() {
    this.contactUservice.loadContactUs().subscribe(
      (response) => {
        if (response.status) {
          this.contactUs = response.contactUs.map((item: any) => ({
            id: item.id,
            firstname: item.firstname,
            lastname: item.lastname,
            email: item.email,
            phone: item.phone,
            description: item.description
          }));
          this.filteredcontactUs = [...this.contactUs]; // Initialize filtered list
        }
      },
      (error) => {
        console.error('Error fetching contactUs:', error);
      }
    );
  }


  deleteContact(id: number) {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6"
    }).then(result => {
      if (result.isConfirmed) {
        this.contactUservice.removecontactUS(id).subscribe(
          response => {
            if (response.status) {
              // Remove from both arrays and refresh the filtered data
              this.contactUs = this.contactUs.filter(contact => contact.id !== id);
              this.filteredcontactUs = [...this.contactUs]; // Update the filtered list

              Swal.fire('Deleted!', 'Contact has been deleted.', 'success');
            } else {
              Swal.fire('Error', 'Failed to delete contact', 'error');
            }
          },
          error => {
            Swal.fire('Error', 'Failed to delete contact', 'error');
          }
        );
      }
    });
  }


  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
    }
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredcontactUs.length / this.itemsPerPage);
  }
}
