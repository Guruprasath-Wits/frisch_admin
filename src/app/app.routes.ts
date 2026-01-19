import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './layout';
import { EdituserComponent } from './views/germen/users/edituser/edituser.component';
import { AdduserComponent } from './views/germen/users/adduser/adduser.component';
import {NotificationListComponent} from './views/germen/notification-list/notification-list.component'
import { FaqComponent} from './views/germen/pages/faq/faq.component'
import {DeliveryAreasComponent} from './views/germen/pages/delivery-areas/delivery-areas.component'
import {FreeTrialComponent} from './views/germen/pages/free-trial/free-trial.component'
import {JobsComponent} from './views/germen/pages/jobs/jobs.component'
import {ImprintComponent} from './views/germen/pages/imprint/imprint.component'
import {UserAdvantagesComponent} from './views/germen/pages/user-advantages/user-advantages.component'
import {SettingsComponent} from './views/germen/settings/settings.component'
import { OrderProcessingComponent } from './views/germen/orders/order-processing/order-processing.component';
import {OrderAssignedComponent} from './views/germen/orders/order-assigned/order-assigned.component'
import {ContactUsComponent} from './views/germen/pages/contact-us/contact-us.component';
import { AuthGuard } from './auth.guard';
import {PermissionComponent} from './views/germen/permission/permission.component';
import {DriverPerformComponent} from './views/germen/orders/driver-perform/driver-perform.component'
import {CompleteOrdersComponent} from './views/germen/orders/complete-orders/complete-orders.component'
import { SubscritionTransactionComponent } from './views/germen/subscrition-transaction/subscrition-transaction.component';



export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '',
    component: DefaultLayoutComponent,
    data: {
      title: 'Home'
    },
    children: [
    
      {
        path: 'users',
        loadChildren: () => import('./views/germen/users/routes').then((m) => m.routes),
        canActivate: [AuthGuard],
      },
      {
        path: 'category',
        loadChildren: () => import('./views/germen/category/routes').then((m) => m.routes),
        canActivate: [AuthGuard],
      },
      {
        path: 'products',
        loadChildren: () => import('./views/germen/products/routes').then((m) => m.routes),
        canActivate: [AuthGuard],
        title:'Products'
      },
      {
        path: 'roles',
        loadChildren: () => import('./views/germen/roles/routes').then((m) => m.routes),
        canActivate: [AuthGuard],
      },
      {
        path: 'orders/orders',
        loadChildren: () => import('./views/germen/orders/route').then((m) => m.routes),
        title:'OrdersList',
        canActivate: [AuthGuard],
      },

      {
        path: 'contactUs',
        component:ContactUsComponent,
        title:'ProcessingOrders',
        canActivate: [AuthGuard],
      },

            {
        path: 'subscriptionTransactions',
        component:SubscritionTransactionComponent,
        title:'Subscription_Transactions',
        canActivate: [AuthGuard],
      },

      {
        path: 'permissions',
        component:PermissionComponent,
        title:'Permissions',
        canActivate: [AuthGuard],
      },
      {
        path: 'orders/processingOrders',
        component:OrderProcessingComponent,
        title:'ProcessingOrders',
        canActivate: [AuthGuard],
      },
      {
        path: 'orders/assignOrders',
        component:OrderAssignedComponent,
        title:'AssignedOrders',
        canActivate: [AuthGuard],
      },
      {
        path: 'orders/completeOrders',
        component:CompleteOrdersComponent,
        title:'CompleteOrders',
        canActivate: [AuthGuard],
      },
      {
        path: 'orders/driverPerform',
        component:DriverPerformComponent,
        title:'Driver Perform',
        canActivate: [AuthGuard],
      },
      {
        path: 'notifications',
        component:NotificationListComponent,
        title:'Notifications',
        canActivate: [AuthGuard],
      },

      {
        path: 'faq',
        component:FaqComponent,
        title:'FAQ',
        canActivate: [AuthGuard],
      },

      {
        path: 'our-delivery-area',
        component:DeliveryAreasComponent,
        title:'Our Delivery Area',
        canActivate: [AuthGuard],
      },

      {
        path: 'free-trial',
        component:FreeTrialComponent,
        title:'Free Trial',
        canActivate: [AuthGuard],
      },

      {
        path: 'jobs',
        component:JobsComponent,
        title:'Jobs',
        canActivate: [AuthGuard],
      },

      {
        path: 'user-advantages',
        component:UserAdvantagesComponent,
        title:'User Advantages',
        canActivate: [AuthGuard],
      },

      {
        path: 'imprint',
        component:ImprintComponent,
        title:'Imprint',
        canActivate: [AuthGuard],
      },

      {
        path: 'dashboard',
        component:SettingsComponent,
        title:'Settings',
        canActivate: [AuthGuard],
      },

        {
        path: 'theme',
        loadChildren: () => import('./views/theme/routes').then((m) => m.routes),
        canActivate: [AuthGuard],
      },
      
      {
        path: 'theme',
        loadChildren: () => import('./views/theme/routes').then((m) => m.routes),
        canActivate: [AuthGuard],
      },
      {
        path: 'base',
        loadChildren: () => import('./views/base/routes').then((m) => m.routes),
        canActivate: [AuthGuard],
      },
      {
        path: 'buttons',
        loadChildren: () => import('./views/buttons/routes').then((m) => m.routes),

      },
      {
        path: 'forms',
        loadChildren: () => import('./views/forms/routes').then((m) => m.routes)
      },
      {
        path: 'icons',
        loadChildren: () => import('./views/icons/routes').then((m) => m.routes)
      },
      // {
      //   path: 'notifications',
      //   loadChildren: () => import('./views/notifications/routes').then((m) => m.routes)
      // },
      {
        path: 'widgets',
        loadChildren: () => import('./views/widgets/routes').then((m) => m.routes)
      },
      {
        path: 'charts',
        loadChildren: () => import('./views/charts/routes').then((m) => m.routes)
      },
      {
        path: 'pages',
        loadChildren: () => import('./views/pages/routes').then((m) => m.routes),
        canActivate: [AuthGuard],
      }
    ]
  },
  {
    path: '404',
    loadComponent: () => import('./views/pages/page404/page404.component').then(m => m.Page404Component),
    data: {
      title: 'Page 404'
    }
  },
  {
    path: '500',
    loadComponent: () => import('./views/pages/page500/page500.component').then(m => m.Page500Component),
    data: {
      title: 'Page 500'
    }
  },
  {
    path: 'login',
    loadComponent: () => import('./views/pages/login/login.component').then(m => m.LoginComponent),
    data: {
      title: 'Login Page'
    }
  },
  {
    path: 'register',
    loadComponent: () => import('./views/pages/register/register.component').then(m => m.RegisterComponent),
    data: {
      title: 'Register Page'
    }
  },
  { path: '**', redirectTo: 'dashboard' }
];
