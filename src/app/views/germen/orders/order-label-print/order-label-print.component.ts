import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-label-print',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="print-container">
      <div class="label-grid">
        <div class="label-box" *ngFor="let order of orders; let i = index">
          <div class="label-header">
            <div class="driver-number">{{ i + 1 }}</div>
          </div>
          <div class="label-content">
            <div class="customer-name">{{ order.customerName }}</div>
            <div class="address">{{ order.address }}</div>
            <div class="product-list">
              {{ getProductString(order) }}
            </div>
            <div class="instruction" *ngIf="order.instruction">
              <i class="fas fa-info-circle"></i> {{ order.instruction }}
            </div>
          </div>
        </div>
      </div>
      <div class="print-actions no-print">
        <button (click)="print()" class="btn-print"><i class="fas fa-print"></i> Print Labels</button>
        <button (click)="close()" class="btn-close">Close</button>
      </div>
    </div>
  `,
  styles: [`
    @page {
      size: A4;
      margin: 0 !important; /* Forces browser to hide headers/footers */
    }
    .print-container {
      background: #f0f2f5;
      min-height: 100vh;
      padding: 0;
    }
    .label-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      width: 210mm; /* Full A4 Width */
      margin: 0 auto;
      background: white;
      padding: 10mm; /* Internal padding to act as paper margin */
      box-sizing: border-box;
      min-height: 297mm;
    }
    .label-box {
      border: 0.1pt solid #eee;
      padding: 10mm 4mm 4mm 4mm;
      height: 60mm;
      position: relative;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    .label-header {
      position: absolute;
      top: 3mm;
      right: 3mm;
    }
    .driver-number {
      width: 24px;
      height: 24px;
      border: 1.5pt solid #2d3436;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 0.9rem;
      color: #2d3436;
    }
    .customer-name {
      font-weight: 800;
      font-size: 0.95rem;
      color: #000;
      margin-bottom: 2px;
      text-transform: uppercase;
      line-height: 1.1;
      padding-right: 25px; /* Leave space for badge */
      word-break: break-word;
    }
    .address {
      font-weight: 700;
      font-size: 0.8rem;
      color: #2d3436;
      margin-bottom: 6px;
      line-height: 1.2;
      word-break: break-word;
      overflow-wrap: break-word;
    }
    .product-list {
      font-size: 0.72rem;
      color: #444;
      flex-grow: 1;
      border-top: 0.5pt solid #f1f2f6;
      padding-top: 5px;
      line-height: 1.2;
      word-break: break-word;
      overflow-wrap: break-word;
    }
    .instruction {
      margin-top: 4px;
      font-size: 0.7rem;
      font-style: italic;
      color: #d63031;
      font-weight: 700;
      background: #fff5f5;
      padding: 2px 5px;
      border-radius: 3px;
      display: flex;
      align-items: center;
      gap: 4px;
      border-left: 2pt solid #d63031;
      line-height: 1.2;
      word-break: break-word;
    }
    .print-actions {
      position: fixed;
      bottom: 25px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 15px;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.95);
      padding: 12px 30px;
      border-radius: 60px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.2);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(0,0,0,0.05);
    }
    .btn-print {
      background: #f7ce3e;
      color: #2d3436;
      border: none;
      padding: 12px 25px;
      border-radius: 50px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      transition: all 0.2s;
      &:hover { transform: scale(1.05); box-shadow: 0 5px 15px rgba(247, 206, 62, 0.4); }
    }
    .btn-close {
      background: #edeff2;
      color: #2d3436;
      border: none;
      padding: 12px 35px;
      border-radius: 50px;
      font-weight: 800;
      cursor: pointer;
      font-size: 0.95rem;
      transition: all 0.2s;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      &:hover { background: #dcdde1; transform: translateY(-2px); }
    }
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
      .print-container { padding: 0; background: white; }
      .label-grid { 
        box-shadow: none; 
        width: 190mm; 
        margin: 0;
        border: none;
      }
      .label-box { 
        border: 0.2pt solid #ddd; 
        break-inside: avoid;
      }
    }
  `]
})
export class OrderLabelPrintComponent implements OnInit {
  orders: any[] = [];

  ngOnInit() {
    const data = localStorage.getItem('printOrders');
    if (data) {
      this.orders = JSON.parse(data);
      // Optional: Clear after reading? Maybe keep it.
    }
  }

  getProductString(order: any): string {
    // This logic might need to be refined based on how products are stored in mergedOrders
    // Currently mergedOrders doesn't seem to have full product details unless loaded separately
    return order.productsSummary || 'Products details not loaded';
  }

  print() {
    window.print();
  }

  close() {
    window.close();
  }
}
