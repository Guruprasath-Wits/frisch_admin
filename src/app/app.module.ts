import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';

registerLocaleData(localeDe);

@NgModule({
  declarations: [
    AppComponent,

  ],
  imports: [
    BrowserModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
    // ChartsModule

  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'de-DE' },
    { provide: MAT_DATE_LOCALE, useValue: 'de-DE' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
