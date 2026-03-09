import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [
  {
    name: 'Dashboard',
    url: '/dashboard',
    iconComponent: { name: 'cil-speedometer' },
    // badge: {
    //   color: 'info',
    //   text: 'NEW'
    // }
  },


  {
    title: true,
    name: 'Products'
  },

  {
    name: 'Category',
    url: 'category',
    iconComponent: { name: 'cil-grid' }
  },
  {
    name: 'Steuer',
    url: 'tax',
    iconComponent: { name: 'cil-dollar' }
  },
  {
    name: 'Flasche',
    url: 'bottle',
    iconComponent: { name: 'cil-description' }
  },

  // {
  //   name: 'Sub-Category',
  //   url: '/theme/typography',
  //   iconComponent: { name: 'cil-list-filter' }
  // },
  {
    name: 'Product',
    url: 'products',
    iconComponent: { name: 'cil-pencil' }
  },
  {
    name: 'Fehlende Produkte',
    url: 'missing-products',
    iconComponent: { name: 'cil-magnifying-glass' }
  },
  {
    name: 'Combo Packs',
    url: 'combo-packs',
    iconComponent: { name: 'cil-layers' }
  },


  {
    name: 'Orders',
    title: true
  },

  {
    name: 'Customer_Enquiry',
    url: 'contactUs',
    iconComponent: { name: 'cil-envelope-closed' }
  },

  {
    name: 'Coupon Management',
    url: '/coupon-management',
    iconComponent: { name: 'cil-tags' },
    children: [
      {
        name: 'Voucher List',
        url: '/coupon-management/voucher-type',
        iconComponent: { name: 'cil-list' }
      },
      {
        name: 'Coupon List',
        url: '/coupon-management/manage-vouchers',
        iconComponent: { name: 'cil-spreadsheet' }
      }
    ]
  },


  {
    name: 'OrderList',
    url: '/orders',
    iconComponent: { name: 'cil-cart' },
    children: [
      {
        name: 'Received Order',
        url: '/orders/orders',
        iconComponent: { name: 'cil-inbox' }
      },
      {
        name: 'Processing',
        url: '/orders/processingOrders',
        iconComponent: { name: 'cil-task' }
      },
      {
        name: 'Assigned',
        url: '/orders/assignOrders',
        iconComponent: { name: 'cil-user-follow' }
      },
      {
        name: 'Completed',
        url: '/orders/completeOrders',
        iconComponent: { name: 'cil-check' }
      },
      {
        name: 'Driver Performance',
        url: '/orders/driverPerform',
        iconComponent: { name: 'cil-speedometer' }
      }
    ]
  },

  // {
  //   name: 'Payment Details',
  //   url: '/buttons',
  //   iconComponent: { name: 'cil-cursor' },
  //   children: [
  //     {
  //       name: 'Buttons',
  //       url: '/buttons/buttons',
  //       icon: 'nav-icon-bullet'
  //     },

  //   ]
  // },
  // {
  //   name: 'Payment Histroy',
  //   url: '/forms',
  //   iconComponent: { name: 'cil-notes' },
  //   children: [
  //     {
  //       name: 'Form Control',
  //       url: '/forms/form-control',
  //       icon: 'nav-icon-bullet'
  //     },


  //   ]
  // },

  // {
  //   name: 'Notifications',
  //   url: '/notifications',
  //   iconComponent: { name: 'cil-bell' },

  // },

  {
    title: true,
    name: 'Pages'
  },

  {
    name: 'Sample_Order',
    url: '/free-trial',
    iconComponent: { name: 'cil-basket' },

  },

  {
    name: 'Our_Delivery_Areas',
    url: '/our-delivery-area',
    iconComponent: { name: 'cil-location-pin' },

  },

  {
    name: 'User_Advantages',
    url: '/user-advantages',
    iconComponent: { name: 'cil-star' },

  },

  // {
  //   name: 'Imprint',
  //   url: '/imprint',
  //   iconComponent: { name: 'cil-description' },

  // },

  {
    name: 'Jobs',
    url: '/jobs',
    iconComponent: { name: 'cil-people' },

  },

  {
    name: 'Transactions',
    url: '/subscriptionTransactions',
    iconComponent: { name: 'cil-chart' },

  },

  {
    name: 'FAQ',
    url: '/faq',
    iconComponent: { name: 'cil-comment-square' },

  },

  {
    name: 'Imprint',
    url: '/imprint',
    iconComponent: { name: 'cil-description' },

  },









  {
    title: true,
    name: 'Extras'
  },

  {
    name: 'Roles',
    url: '/roles',
    iconComponent: { name: 'cil-lock-locked' },

  },

  {
    name: 'Permissions',
    url: '/permissions',
    iconComponent: { name: 'cil-lock-locked' },

  },

  {
    name: 'Users',
    url: '/users',
    iconComponent: { name: 'cil-user' },

  },

  {
    name: 'Settings',
    url: '/settings',
    iconComponent: { name: 'cil-settings' },
  },


  // {
  //   name: 'Impressum',
  //   url: '/imprint',
  //   iconComponent: { name: 'cil-settings' },

  // },

  // {
  //   title: true,
  //   name: 'Links',
  //   class: 'mt-auto'
  // },
  // {
  //   name: 'Docs',
  //   url: 'https://coreui.io/angular/docs/5.x/',
  //   iconComponent: { name: 'cil-description' },
  //   attributes: { target: '_blank' }
  // }
];
