import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../../../admin.service';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs/operators';
import Swal from 'sweetalert2';

interface Faq {
  id: number;
  faq_qns: string;
  faq_ans: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent implements OnInit {

  faqs: Faq[] = []; // Initialize as an empty array
  faqForm: FormGroup;
  isEditMode: boolean = false;
  selectedFaq: Faq | null = null;
  page: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  constructor(private fb: FormBuilder, private faqService: AdminService) {
    this.faqForm = this.fb.group({
      faq_qns: ['', Validators.required],
      faq_ans: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadFaqs(); // Fetch FAQs on initialization
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.faqs.length / this.itemsPerPage);
  }

  loadFaqs(): void {

    this.faqService.getFaqs().subscribe(
      (response) => {
        if (response.status) {
          this.faqs = response.faq;
          this.calculateTotalPages();
        } else {
          console.error('Failed to fetch faq');
        }
      },
      (error) => console.error('Error fetching faq:', error)
    );


  }

  onSubmit(): void {
    if (this.faqForm.valid) {
      const faqData = this.faqForm.value;

      if (this.isEditMode && this.selectedFaq) {
        // Update FAQ
        const updatedFaq: Faq = { ...this.selectedFaq, ...faqData };
        this.faqService.updateFaq(updatedFaq).subscribe(
          (response) => {
            if (response.status) {
              const index = this.faqs.findIndex((f) => f.id === updatedFaq.id);
              this.faqs[index] = response.faq; // Update the FAQ in the list
              this.resetForm();
              this.calculateTotalPages();
              Swal.fire('Success', 'FAQ updated successfully', 'success');
            } else {
              console.error('Failed to update FAQ:', response.message);
            }
          },
          (error) => console.error('Error updating FAQ:', error)
        );
      } else {
        // Create new FAQ
        this.faqService.createFaq(faqData).subscribe(
          (response) => {
            if (response.status) {
              this.faqs.push(response.faq); // Add the new FAQ to the list
              this.resetForm();
              this.calculateTotalPages();
              Swal.fire('Success', 'FAQ added successfully', 'success');
            } else {
              console.error('Failed to create FAQ:', response.message);
            }
          },
          (error) => console.error('Error creating FAQ:', error)
        );
      }
    }
  }

  onEdit(faq: Faq): void {
    this.isEditMode = true;
    this.selectedFaq = faq;
    this.faqForm.patchValue({
      faq_qns: faq.faq_qns,
      faq_ans: faq.faq_ans,
    });
  }

  onDelete(faqId: number): void {
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
        this.faqService.deleteFaq(faqId).subscribe(
          (response) => {
            if (response.status) {
              this.faqs = this.faqs.filter((f) => f.id !== faqId); // Remove the deleted FAQ
              this.calculateTotalPages();
              Swal.fire('Deleted!', 'FAQ has been deleted.', 'success');
            } else {
              console.error('Failed to delete FAQ:', response.message);
            }
          },
          (error) => {
            console.error('Error deleting FAQ:', error);
            Swal.fire('Error', 'Failed to delete FAQ', 'error');
          }
        );
      }
    });
  }

  resetForm(): void {
    this.isEditMode = false;
    this.selectedFaq = null;
    this.faqForm.reset();
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

  get paginatedFaqs(): Faq[] {
    const start = (this.page - 1) * this.itemsPerPage;
    return this.faqs.slice(start, start + this.itemsPerPage);
  }
}
