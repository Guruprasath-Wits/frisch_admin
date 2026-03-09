import { DOCUMENT, NgStyle } from '@angular/common';
import { Component, DestroyRef, effect, inject, OnInit, Renderer2, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ChartOptions } from 'chart.js';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../admin.service'; // Fixed import path
import {
  AvatarComponent,
  ButtonDirective,
  ButtonGroupComponent,
  CardBodyComponent,
  CardComponent,
  CardFooterComponent,
  CardHeaderComponent,
  ColComponent,
  FormCheckLabelDirective,
  GutterDirective,
  ProgressBarDirective,
  ProgressComponent,
  RowComponent,
  TableDirective,
  TextColorDirective
} from '@coreui/angular';
import { ChartjsComponent } from '@coreui/angular-chartjs';
import { IconDirective } from '@coreui/icons-angular';

import { WidgetsBrandComponent } from '../widgets/widgets-brand/widgets-brand.component';
import { WidgetsDropdownComponent } from '../widgets/widgets-dropdown/widgets-dropdown.component';
import { DashboardChartsData, IChartProps } from './dashboard-charts-data';

interface IUser {
  name: string;
  state: string;
  registered: string;
  country: string;
  usage: number;
  period: string;
  payment: string;
  activity: string;
  avatar: string;
  status: string;
  color: string;
}

import { TranslateModule } from '@ngx-translate/core';

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  standalone: true,
  imports: [TranslateModule, WidgetsDropdownComponent, TextColorDirective, CardComponent, CardBodyComponent, RowComponent, ColComponent, ButtonDirective, IconDirective, ReactiveFormsModule, ButtonGroupComponent, FormCheckLabelDirective, ChartjsComponent, NgStyle, CardFooterComponent, GutterDirective, ProgressBarDirective, ProgressComponent, WidgetsBrandComponent, CardHeaderComponent, TableDirective, AvatarComponent]
})
export class DashboardComponent implements OnInit {

  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #document: Document = inject(DOCUMENT);
  readonly #renderer: Renderer2 = inject(Renderer2);
  readonly #chartsData: DashboardChartsData = inject(DashboardChartsData);

  // New Charts Data - Initial Placeholders
  public categoryChartData: IChartProps = { type: 'doughnut', data: { labels: [], datasets: [] } };
  public productChartData: IChartProps = { type: 'bar', data: { labels: [], datasets: [] } };

  public mainChart: IChartProps = { type: 'line' };
  public mainChartRef: WritableSignal<any> = signal(undefined);
  #mainChartRefEffect = effect(() => {
    if (this.mainChartRef()) {
      this.setChartStyles();
    }
  });

  public chart: Array<IChartProps> = [];
  public trafficRadioGroup = new FormGroup({
    trafficRadio: new FormControl('Month')
  });

  public allOrders: any[] = [];
  public currentPeriod: string = 'Monthly';

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.initCharts();
    this.updateChartOnColorModeChange();
    this.fetchDashboardData();
  }

  fetchDashboardData() {
    forkJoin({
      orders: this.adminService.loadOrders(),
      subs: this.adminService.loadSubsOrders(),
      products: this.adminService.fetchProducts(),
      categories: this.adminService.getCategoryPro()
    }).subscribe({
      next: (res: any) => {
        const normalOrders = res.orders.orders || [];
        const subOrders = res.subs.subscribeData || [];
        this.allOrders = [...normalOrders, ...subOrders]; // Store all orders

        const products = res.products.product || [];
        const categories = res.categories.category || [];

        this.updateRevenueChart('Monthly'); // Default view
        this.processStatusChart(this.allOrders);
        this.processRevenueSourceChart(normalOrders, subOrders);
      },
      error: (err) => {
        console.error('Error fetching dashboard data', err);
      }
    });
  }

  setTrafficPeriod(period: string): void {
    this.currentPeriod = period;
    this.updateRevenueChart(period);
  }

  updateRevenueChart(period: string) {
    let labels: string[] = [];
    let dataPoints: number[] = [];
    const now = new Date();

    if (period === 'Weekly') {
      // Last 7 days
      labels = [];
      dataPoints = new Array(7).fill(0);

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        // Format: "Mon 12" or similar. Let's use short day name.
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        labels.push(dayName);
      }

      this.allOrders.forEach(order => {
        const date = new Date(order.created_at || order.delivery_date);
        if (!isNaN(date.getTime())) {
          const diffTime = Math.abs(now.getTime() - date.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Check if within last 7 days (roughly)
          // A better way: check if date matches one of our labels dates
          // Let's iterate backwards.
          for (let i = 0; i < 7; i++) {
            const targetDate = new Date();
            targetDate.setDate(now.getDate() - (6 - i));

            if (date.getDate() === targetDate.getDate() &&
              date.getMonth() === targetDate.getMonth() &&
              date.getFullYear() === targetDate.getFullYear()) {
              dataPoints[i] += parseFloat(order.price) || 0;
            }
          }
        }
      });

    } else if (period === 'Monthly') {
      // Days of current month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
      dataPoints = new Array(daysInMonth).fill(0);

      this.allOrders.forEach(order => {
        const date = new Date(order.created_at || order.delivery_date);
        if (!isNaN(date.getTime()) &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()) {
          const day = date.getDate();
          dataPoints[day - 1] += parseFloat(order.price) || 0;
        }
      });

    } else if (period === 'Yearly') {
      // Jan - Dec of current year
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      dataPoints = new Array(12).fill(0);

      this.allOrders.forEach(order => {
        const date = new Date(order.created_at || order.delivery_date);
        if (!isNaN(date.getTime()) && date.getFullYear() === now.getFullYear()) {
          const month = date.getMonth();
          dataPoints[month] += parseFloat(order.price) || 0;
        }
      });
    }

    this.mainChart.data = {
      labels: labels,
      datasets: [
        {
          label: 'Revenue (€)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderColor: '#f59e0b',
          pointHoverBackgroundColor: '#fff',
          borderWidth: 2,
          data: dataPoints,
          fill: true
        }
      ]
    };

    this.setChartStyles();
  }

  processStatusChart(orders: any[]) {
    const statusCounts: { [key: string]: number } = {};
    orders.forEach(order => {
      // Skip undefined, null, or 'unknown' statuses
      if (!order.status || order.status.toLowerCase() === 'unknown') {
        return;
      }

      const status = order.status;
      // Capitalize first letter
      const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
      statusCounts[formattedStatus] = (statusCounts[formattedStatus] || 0) + 1;
    });

    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);

    // Generate dynamic colors
    const backgroundColors = this.generateColors(labels.length);

    this.categoryChartData = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          hoverBackgroundColor: backgroundColors
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    };
  }

  processRevenueSourceChart(normalOrders: any[], subOrders: any[]) {
    let normalRevenue = 0;
    let subRevenue = 0;

    normalOrders.forEach(order => {
      normalRevenue += parseFloat(order.price) || 0;
    });

    subOrders.forEach(order => {
      subRevenue += parseFloat(order.price) || 0;
    });

    this.productChartData = {
      type: 'bar',
      data: {
        labels: ['One-time Orders', 'Subscriptions'],
        datasets: [{
          label: 'Revenue (€)',
          data: [normalRevenue, subRevenue],
          backgroundColor: ['#3b82f6', '#ec4899'], // Blue, Pink
          borderColor: ['#2563eb', '#db2777'],
          borderWidth: 1,
          borderRadius: 8,
          barPercentage: 0.6,
          categoryPercentage: 0.8
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { family: "'Outfit', sans-serif" } }
          },
          y: {
            beginAtZero: true,
            grid: { display: false },
            border: { display: false },
            ticks: { font: { family: "'Outfit', sans-serif" } }
          }
        }
      }
    };
  }

  generateColors(count: number, opacity: number = 0.7): string[] {
    const palette = [
      `rgba(245, 158, 11, ${opacity})`, // Warning (Gold)
      `rgba(59, 130, 246, ${opacity})`, // Primary (Blue)
      `rgba(16, 185, 129, ${opacity})`, // Success (Green)
      `rgba(239, 68, 68, ${opacity})`,  // Danger (Red)
      `rgba(139, 92, 246, ${opacity})`, // Purple
      `rgba(236, 72, 153, ${opacity})`, // Pink
      `rgba(6, 182, 212, ${opacity})`,  // Cyan
      `rgba(251, 146, 60, ${opacity})`   // Orange
    ];

    // Repeat palette if more items than colors
    return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
  }

  initCharts(): void {
    this.mainChart = this.#chartsData.mainChart;
  }

  handleChartRef($chartRef: any) {
    if ($chartRef) {
      this.mainChartRef.set($chartRef);
    }
  }

  updateChartOnColorModeChange() {
    const unListen = this.#renderer.listen(this.#document.documentElement, 'ColorSchemeChange', () => {
      this.setChartStyles();
    });

    this.#destroyRef.onDestroy(() => {
      unListen();
    });
  }

  setChartStyles() {
    if (this.mainChartRef()) {
      setTimeout(() => {
        const options: ChartOptions = { ...this.mainChart.options };
        const scales = this.#chartsData.getScales();
        this.mainChartRef().options.scales = { ...options.scales, ...scales };
        this.mainChartRef().update();
      });
    }
  }
}
