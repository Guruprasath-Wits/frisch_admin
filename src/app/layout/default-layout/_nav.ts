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
    iconComponent: { name: 'cil-align-left' }
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
    name: 'Orders',
    title: true
  },

  {
    name: 'Customer_Enquiry',
    url: 'contactUs',
    iconComponent: { name: 'cil-user' }
  },
  {
    name: 'OrderList',
    url: '/orders',
    iconComponent: { name: 'cil-puzzle' },
    children: [
      {
        name: 'Received Order',
        url: '/orders/orders',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Processing',
        url: '/orders/processingOrders',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Assigned',
        url: '/orders/assignOrders',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Completed',
        url: '/orders/completeOrders',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Driver Performance',
        url: '/orders/driverPerform',
        icon: 'nav-icon-bullet'
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
    iconComponent: { name: 'cil-description' },
  
  },

  {
    name: 'Our_Delivery_Areas',
    url: '/our-delivery-area',
    iconComponent: { name: 'cil-description' },
  
  },

  {
    name: 'User_Advantages',
    url: '/user-advantages',
    iconComponent: { name: 'cil-description' },
  
  },

  // {
  //   name: 'Imprint',
  //   url: '/imprint',
  //   iconComponent: { name: 'cil-description' },
  
  // },

  {
    name: 'Jobs',
    url: '/jobs',
    iconComponent: { name: 'cil-description' },
  
  },

     {
    name: 'Subscription_Transactions',
    url: '/subscriptionTransactions',
    iconComponent: { name: 'cil-description' },
  
  },

  {
    name: 'FAQ',
    url: '/faq',
    iconComponent: { name: 'cil-description' },
  
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

  // {
  //   name: 'Settings',
  //   url: '/settings',
  //   iconComponent: { name: 'cil-settings' },
  
  // },


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
