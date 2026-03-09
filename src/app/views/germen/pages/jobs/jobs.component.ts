import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { AdminService } from '../../../../admin.service';
import { CommonModule } from '@angular/common';

interface Job {
  id: number;
  title: string;
  description: string;
}

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class JobsComponent implements OnInit {
  jobs: Job[] = [];
  jobForm: FormGroup;
  isEditMode: boolean = false;
  selectedJob: Job | null = null;
  page: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  constructor(private fb: FormBuilder, private jobService: AdminService) {
    this.jobForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadJobs(); // Fetch jobs on initialization
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.jobs.length / this.itemsPerPage);
  }

  loadJobs(): void {
    this.jobService.getJobs().subscribe(
      (response) => {
        if (response.status) {
          this.jobs = response.jobs; // Assuming `response.jobs` is an array of job objects
          this.calculateTotalPages();
        } else {
          console.error('Failed to fetch jobs');
        }
      },
      (error) => console.error('Error fetching jobs:', error)
    );
  }

  onSubmit(): void {
    if (this.jobForm.valid) {
      const jobData = this.jobForm.value;

      if (this.isEditMode && this.selectedJob) {
        // Update job
        jobData.id = this.selectedJob.id; // Include the ID for update
        this.jobService.updateJobs(jobData).subscribe(
          (response: any) => {
            if (response.status) {
              this.loadJobs(); // Refresh job list
              this.resetForm();
              Swal.fire('Success', 'Job updated successfully', 'success');
            }
          },
          (error) => console.error('Error updating job:', error)
        );
      } else {
        // Create new job
        this.jobService.createJobs(jobData).subscribe(
          (response: any) => {
            if (response.status) {
              this.loadJobs(); // Refresh job list
              this.resetForm();
              Swal.fire('Success', 'Job added successfully', 'success');
            }
          },
          (error) => console.error('Error adding job:', error)
        );
      }
    }
  }

  formatDescription(description: string): string {
    return description.replace(/\n/g, '<br>');
  }


  onEdit(job: Job): void {
    this.isEditMode = true;
    this.selectedJob = job;
    this.jobForm.patchValue({
      title: job.title,
      description: job.description,
    });
  }

  onDelete(jobId: number): void {

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
        // this.jobService.deleteAdvantages(jobId).subscribe(

        this.jobService.deleteJobs(jobId).subscribe(
          response => {
            this.jobs = this.jobs.filter(area => area.id !== jobId);
            Swal.fire('Deleted!', ' Jobs has been deleted.', 'success');
            this.loadJobs();
          },
          error => {
            Swal.fire('Error', 'Failed to delete  Jobs', 'error');
          }
        );
      }
    });
  }

  resetForm(): void {
    this.isEditMode = false;
    this.selectedJob = null;
    this.jobForm.reset();
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

  get paginatedJobs(): Job[] {
    const start = (this.page - 1) * this.itemsPerPage;
    return this.jobs.slice(start, start + this.itemsPerPage);
  }
}
