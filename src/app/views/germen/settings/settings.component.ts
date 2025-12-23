import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../admin.service';
import { WidgetsDropdownComponent } from '../../widgets/widgets-dropdown/widgets-dropdown.component';
import Swal from 'sweetalert2';
import { url } from 'src/app/config';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, WidgetsDropdownComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  logoPreview: string | null = null;
  bannerPreviews: string[] = []; // multiple banner previews
  settingForm: FormGroup;
  isEditMode = false;
  currentSettingId: string | null = null;
  newurl: any;

  constructor(private fb: FormBuilder, private settingService: AdminService) {
    this.newurl = url;
    this.settingForm = this.fb.group({
      company_name: ['', Validators.required],
      weekend_fee: ['', Validators.required],
      weekday_fee: ['', Validators.required],
      agb: [''],
      data_protection: [''],
      cancellation_policy: [''],
      description: [''],
      logo_img: [null],
      banner_img: [[]], // store array of files
      breaking_news: [''],
      webshop: [''],
      telephone: ['']
    });
  }

  ngOnInit(): void {
    this.getSettings();
  }

  getSettings(): void {
    this.settingService.loadSettings().subscribe(
      (response: any) => {
        if (response?.status && response?.setting) {
          const setting = response.setting;
          this.settingForm.patchValue(setting);
          this.currentSettingId = setting.id;

          // Logo
          if (setting.logo_img) {
            this.logoPreview = this.getFullImagePath(setting.logo_img);
          }

          // Banners
          if (setting.banner_img) {
            const banners = setting.banner_img.split(',');
            this.bannerPreviews = banners.map((b: string) => this.getFullImagePath(b.trim()));
          }
        }
      },
      (error) => console.error('Error fetching settings:', error)
    );
  }

  getFullImagePath(imagePath: string): string {
    const baseUrl = this.newurl;
    return imagePath.startsWith('http') ? imagePath : `${baseUrl}${imagePath}`;
  }

  onFileChange(event: Event, fieldName: string): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    if (fieldName === 'logo_img') {
      const file = input.files[0];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire('Error', 'Only JPG, PNG, and JPEG formats are allowed.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => (this.logoPreview = reader.result as string);
      reader.readAsDataURL(file);
      this.settingForm.patchValue({ logo_img: file });
    }

    if (fieldName === 'banner_img') {
      const files = Array.from(input.files);
      const invalidFile = files.find(f => !allowedTypes.includes(f.type));

      if (invalidFile) {
        Swal.fire('Error', 'Only JPG, PNG, and JPEG formats are allowed.', 'error');
        return;
      }

      const previews: string[] = [];
      let loaded = 0;

      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          previews.push(reader.result as string);
          loaded++;
          if (loaded === files.length) {
            // ✅ Append to existing previews
            this.bannerPreviews = [...this.bannerPreviews, ...previews];

            // ✅ Append files to existing banner files in form
            const existingFiles = this.settingForm.get('banner_img')?.value || [];
            this.settingForm.patchValue({ banner_img: [...existingFiles, ...files] });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeBanner(index: number): void {
    this.bannerPreviews.splice(index, 1);

    const files = this.settingForm.get('banner_img')?.value as File[];
    if (files && files.length > index) {
      files.splice(index, 1);
      this.settingForm.patchValue({ banner_img: files });
    }
  }

  removeImage(fieldName: string): void {
    if (fieldName === 'logo_img') {
      this.logoPreview = null;
      this.settingForm.patchValue({ logo_img: null });
    }
  }

  onSubmit(): void {
    if (this.settingForm.invalid) {
      this.settingForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    Object.keys(this.settingForm.controls).forEach(key => {
      const value = this.settingForm.get(key)?.value;
      if (key === 'banner_img' && Array.isArray(value)) {
        value.forEach((file: File) => formData.append('banner_img', file)); // multiple files
      } else {
        formData.append(key, value);
      }
    });

    // ✅ Include existing banners (those from DB, not newly uploaded)
    const existingBanners = this.bannerPreviews.filter(b => b.startsWith(this.newurl));
    if (existingBanners.length > 0) {
      formData.append(
        'existing_banners',
        existingBanners.map(b => b.replace(this.newurl, '')).join(',')
      );
    }

    if (this.currentSettingId) {
      this.updateSetting(formData);
    }
  }

  updateSetting(formData: FormData): void {
    if (!this.currentSettingId) return;

    this.settingService.updateSetting(this.currentSettingId, formData).subscribe(
      (response) => {
        if (response.status) {
          Swal.fire('Success', 'Updated successfully', 'success');
          this.getSettings();
          // ✅ Reset file input after success
          const input = document.getElementById('banner_img') as HTMLInputElement;
          if (input) input.value = '';
        } else {
          Swal.fire('Error', response.message || 'Failed to update setting', 'error');
        }
      },
      (error) => {
        console.error('Error updating setting:', error);
        Swal.fire('Error', 'An error occurred while updating the setting', 'error');
      }
    );
  }
}
