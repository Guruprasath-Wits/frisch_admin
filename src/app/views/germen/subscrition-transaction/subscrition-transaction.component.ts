import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/admin.service';
import Swal from 'sweetalert2'; 
export interface Transaction {
  user_id: number;
  username: string;
  amount: string;
  payment_id: string | null;
  status: string;
  billing_month: string;
  error_message: string;
  created_at: string;
}
@Component({
  selector: 'app-subscrition-transaction',
  standalone: true,
   imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './subscrition-transaction.component.html',
  styleUrl: './subscrition-transaction.component.scss'
})
export class SubscritionTransactionComponent {

  transactions: Transaction[] = [];
    // searchTerm: string = '';
    selectedMonth : any;
   
    page: number = 1;
    itemsPerPage: number = 10;
  
    constructor(private router: Router, private adminService: AdminService) { }
  
    ngOnInit(): void {

            const now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth(); // getMonth() is 0-based, so this is last month
      if (month === 0) {
        month = 12;
        year--;
      }
      const data = {
        year: year,
        month: month
      };
  
      this.loadTransaction(data);
      this.loadMonth()
  
    }
  
    
    loadTransaction(data:any): void {
      this.adminService.getSubscription(data.year, data.month).subscribe(
        (response: any) => {
          console.log(response);
          this.transactions = response.transactions;
        },
        error => {
          console.error('Error fetching users:', error);
        }
      );
    }

    onMonthChange(): void {
      if (this.selectedMonth) {
        // Assuming selectedMonth is in format 'YYYY-MM'
        const [year, month] = this.selectedMonth.split('-');
        const data = {
          year: Number(year),
          month: Number(month)
        };
        this.loadTransaction(data);
      }
    }
transactionsMonth : any;
     loadMonth(): void {

       this.adminService.getSubscriptionMonth().subscribe(
         (response: any) => {
           this.transactionsMonth = response.months;
         },
         error => {
           console.error('Error fetching users:', error);
         }
       );
     }




    get totalPages() {
      return Math.ceil(this.transactions.length / this.itemsPerPage);
    }
    onPageChange(newPage: number) {
      this.page = newPage;
    }

    // Methods for pagination
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

}

    
    