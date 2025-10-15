// Demo data for dashboard and admin pages
export const demoProducts = [
  {
    id: 'prod-1',
    name: 'Starter Hosting',
    description: 'Perfect for small websites and blogs. Includes 1 hosting account, 1 domain, and basic support.',
    price_monthly: 9.99,
    price_yearly: 99.99,
    max_accounts: 1,
    max_domains: 1,
    max_databases: 1,
    max_emails: 5,
    features: {
      category: 'hosting',
      storage: '10GB',
      bandwidth: '100GB',
      ssl: true,
      backup: 'Daily',
      support: 'Email'
    },
    is_active: true,
    is_featured: true,
    sort_order: 1,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'prod-2',
    name: 'Professional Hosting',
    description: 'Ideal for growing businesses. Includes 5 hosting accounts, 5 domains, and priority support.',
    price_monthly: 29.99,
    price_yearly: 299.99,
    max_accounts: 5,
    max_domains: 5,
    max_databases: 10,
    max_emails: 25,
    features: {
      category: 'hosting',
      storage: '50GB',
      bandwidth: '500GB',
      ssl: true,
      backup: 'Daily',
      support: 'Priority',
      cdn: true
    },
    is_active: true,
    is_featured: true,
    sort_order: 2,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'prod-3',
    name: 'Enterprise Hosting',
    description: 'For large businesses and agencies. Unlimited resources and 24/7 phone support.',
    price_monthly: 99.99,
    price_yearly: 999.99,
    max_accounts: 999999,
    max_domains: 999999,
    max_databases: 999999,
    max_emails: 999999,
    features: {
      category: 'hosting',
      storage: 'Unlimited',
      bandwidth: 'Unlimited',
      ssl: true,
      backup: 'Real-time',
      support: '24/7 Phone',
      cdn: true,
      dedicated: true
    },
    is_active: true,
    is_featured: true,
    sort_order: 3,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'prod-4',
    name: 'Domain Registration',
    description: 'Register .com domains at wholesale prices. Includes free WHOIS privacy protection.',
    price_monthly: 0,
    price_yearly: 8.99,
    max_accounts: 0,
    max_domains: 1,
    max_databases: 0,
    max_emails: 0,
    features: {
      category: 'domain',
      tld: '.com',
      privacy: true,
      auto_renew: true,
      dns: 'Free'
    },
    is_active: true,
    is_featured: false,
    sort_order: 4,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'prod-5',
    name: 'SSL Certificate',
    description: 'Secure your website with our premium SSL certificate. Valid for 1 year.',
    price_monthly: 0,
    price_yearly: 29.99,
    max_accounts: 0,
    max_domains: 1,
    max_databases: 0,
    max_emails: 0,
    features: {
      category: 'ssl',
      validation: 'Domain',
      warranty: '$10,000',
      support: '24/7'
    },
    is_active: true,
    is_featured: false,
    sort_order: 5,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'prod-6',
    name: 'Email Hosting',
    description: 'Professional email hosting with 10GB storage per mailbox. Includes spam protection.',
    price_monthly: 4.99,
    price_yearly: 49.99,
    max_accounts: 0,
    max_domains: 0,
    max_databases: 0,
    max_emails: 10,
    features: {
      category: 'email',
      storage: '10GB',
      spam_protection: true,
      webmail: true,
      mobile_sync: true
    },
    is_active: true,
    is_featured: false,
    sort_order: 6,
    created_at: '2024-01-15T10:00:00Z'
  }
];

export const demoOrders = [
  {
    id: 'order-1',
    invoice_number: 'INV-2024-001',
    order_number: 'ORD-2024-001',
    customer_id: 'cust-1',
    customer: {
      id: 'cust-1',
      email: 'john.doe@example.com',
      full_name: 'John Doe',
      company_name: 'Acme Corp'
    },
    status: 'completed',
    subtotal: 29.99,
    discount_amount: 0,
    tax: 2.40,
    total: 32.39,
    amount_paid: 32.39,
    amount_due: 0,
    currency: 'USD',
    invoice_date: '2024-01-15T10:00:00Z',
    order_date: '2024-01-15T10:00:00Z',
    due_date: '2024-02-15T10:00:00Z',
    paid_at: '2024-01-15T11:30:00Z',
    items: [
      {
        id: 'item-1',
        product_id: 'prod-2',
        name: 'Professional Hosting',
        description: 'Monthly subscription',
        quantity: 1,
        price: 29.99,
        total: 29.99
      }
    ],
    notes: 'Customer requested priority setup',
    is_recurring: true,
    recurring_interval: 'monthly',
    sent_to_customer: true,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'order-2',
    invoice_number: 'INV-2024-002',
    order_number: 'ORD-2024-002',
    customer_id: 'cust-2',
    customer: {
      id: 'cust-2',
      email: 'jane.smith@techstart.com',
      full_name: 'Jane Smith',
      company_name: 'TechStart Inc'
    },
    status: 'pending',
    subtotal: 99.99,
    discount_amount: 10.00,
    tax: 7.20,
    total: 97.19,
    amount_paid: 0,
    amount_due: 97.19,
    currency: 'USD',
    invoice_date: '2024-01-20T14:30:00Z',
    order_date: '2024-01-20T14:30:00Z',
    due_date: '2024-02-20T14:30:00Z',
    paid_at: null,
    items: [
      {
        id: 'item-2',
        product_id: 'prod-3',
        name: 'Enterprise Hosting',
        description: 'Monthly subscription',
        quantity: 1,
        price: 99.99,
        total: 99.99
      }
    ],
    notes: 'New enterprise client - setup required',
    is_recurring: true,
    recurring_interval: 'monthly',
    sent_to_customer: false,
    created_at: '2024-01-20T14:30:00Z'
  },
  {
    id: 'order-3',
    invoice_number: 'INV-2024-003',
    order_number: 'ORD-2024-003',
    customer_id: 'cust-3',
    customer: {
      id: 'cust-3',
      email: 'bob.wilson@freelancer.com',
      full_name: 'Bob Wilson',
      company_name: null
    },
    status: 'processing',
    subtotal: 8.99,
    discount_amount: 0,
    tax: 0.72,
    total: 9.71,
    amount_paid: 0,
    amount_due: 9.71,
    currency: 'USD',
    invoice_date: '2024-01-22T09:15:00Z',
    order_date: '2024-01-22T09:15:00Z',
    due_date: '2025-01-22T09:15:00Z',
    paid_at: null,
    items: [
      {
        id: 'item-3',
        product_id: 'prod-4',
        name: 'Domain Registration',
        description: 'example.com - 1 year',
        quantity: 1,
        price: 8.99,
        total: 8.99
      }
    ],
    notes: 'Domain registration in progress',
    is_recurring: false,
    recurring_interval: null,
    sent_to_customer: true,
    created_at: '2024-01-22T09:15:00Z'
  },
  {
    id: 'order-4',
    invoice_number: 'INV-2024-004',
    order_number: 'ORD-2024-004',
    customer_id: 'cust-4',
    customer: {
      id: 'cust-4',
      email: 'sarah.jones@agency.com',
      full_name: 'Sarah Jones',
      company_name: 'Digital Agency LLC'
    },
    status: 'completed',
    subtotal: 49.99,
    discount_amount: 5.00,
    tax: 3.60,
    total: 48.59,
    amount_paid: 48.59,
    amount_due: 0,
    currency: 'USD',
    invoice_date: '2024-01-25T16:45:00Z',
    order_date: '2024-01-25T16:45:00Z',
    due_date: '2025-01-25T16:45:00Z',
    paid_at: '2024-01-25T17:20:00Z',
    items: [
      {
        id: 'item-4',
        product_id: 'prod-6',
        name: 'Email Hosting',
        description: '10 mailboxes - 1 year',
        quantity: 1,
        price: 49.99,
        total: 49.99
      }
    ],
    notes: 'Agency client - bulk email setup',
    is_recurring: true,
    recurring_interval: 'yearly',
    sent_to_customer: true,
    created_at: '2024-01-25T16:45:00Z'
  },
  {
    id: 'order-5',
    invoice_number: 'INV-2024-005',
    order_number: 'ORD-2024-005',
    customer_id: 'cust-5',
    customer: {
      id: 'cust-5',
      email: 'mike.brown@startup.io',
      full_name: 'Mike Brown',
      company_name: 'StartupIO'
    },
    status: 'overdue',
    subtotal: 29.99,
    discount_amount: 0,
    tax: 2.40,
    total: 32.39,
    amount_paid: 0,
    amount_due: 32.39,
    currency: 'USD',
    invoice_date: '2024-01-10T12:00:00Z',
    order_date: '2024-01-10T12:00:00Z',
    due_date: '2024-01-25T12:00:00Z',
    paid_at: null,
    items: [
      {
        id: 'item-5',
        product_id: 'prod-2',
        name: 'Professional Hosting',
        description: 'Monthly subscription',
        quantity: 1,
        price: 29.99,
        total: 29.99
      }
    ],
    notes: 'Payment reminder sent',
    is_recurring: true,
    recurring_interval: 'monthly',
    sent_to_customer: true,
    reminder_count: 2,
    created_at: '2024-01-10T12:00:00Z'
  }
];

export const demoCustomers = [
  {
    id: 'cust-1',
    customer_id: 'cust-1',
    email: 'john.doe@example.com',
    customer_email: 'john.doe@example.com',
    full_name: 'John Doe',
    customer_name: 'John Doe',
    company_name: 'Acme Corp',
    total_orders: 3,
    total_spent: 156.77,
    active_licenses: 2,
    percentage: 15.2,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'cust-2',
    customer_id: 'cust-2',
    email: 'jane.smith@techstart.com',
    customer_email: 'jane.smith@techstart.com',
    full_name: 'Jane Smith',
    customer_name: 'Jane Smith',
    company_name: 'TechStart Inc',
    total_orders: 5,
    total_spent: 485.95,
    active_licenses: 3,
    percentage: 47.3,
    created_at: '2024-01-05T00:00:00Z'
  },
  {
    id: 'cust-3',
    customer_id: 'cust-3',
    email: 'bob.wilson@freelancer.com',
    customer_email: 'bob.wilson@freelancer.com',
    full_name: 'Bob Wilson',
    customer_name: 'Bob Wilson',
    company_name: null,
    total_orders: 1,
    total_spent: 9.71,
    active_licenses: 1,
    percentage: 0.9,
    created_at: '2024-01-20T00:00:00Z'
  },
  {
    id: 'cust-4',
    customer_id: 'cust-4',
    email: 'sarah.jones@agency.com',
    customer_email: 'sarah.jones@agency.com',
    full_name: 'Sarah Jones',
    customer_name: 'Sarah Jones',
    company_name: 'Digital Agency LLC',
    total_orders: 4,
    total_spent: 194.36,
    active_licenses: 2,
    percentage: 18.9,
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'cust-5',
    customer_id: 'cust-5',
    email: 'mike.brown@startup.io',
    customer_email: 'mike.brown@startup.io',
    full_name: 'Mike Brown',
    customer_name: 'Mike Brown',
    company_name: 'StartupIO',
    total_orders: 2,
    total_spent: 64.78,
    active_licenses: 1,
    percentage: 6.3,
    created_at: '2024-01-08T00:00:00Z'
  }
];

export const demoStats = {
  total_customers: 5,
  active_customers: 4,
  total_orders: 5,
  completed_orders: 2,
  pending_orders: 1,
  processing_orders: 1,
  overdue_orders: 1,
  total_revenue: 1025.57,
  monthly_revenue: 485.95,
  weekly_revenue: 156.77,
  total_products: 6,
  active_products: 6,
  total_licenses: 9,
  active_licenses: 9,
  suspended_licenses: 0,
  expired_licenses: 0,
  total_domains: 2,
  active_domains: 2,
  total_invoices: 5,
  paid_invoices: 2,
  unpaid_invoices: 2,
  overdue_invoices: 1,
  partially_paid_invoices: 0,
  total_invoiced: 1025.57,
  total_paid: 156.77,
  total_outstanding: 868.80,
  overdue_amount: 32.39,
  active_subscriptions: 3,
  recent_signups: 1,
  recent_payments: 2,
  recent_orders: 3
};

// Helper function to get demo data with optional filtering
export const getDemoData = (type: 'products' | 'orders' | 'customers' | 'stats', filters?: any) => {
  switch (type) {
    case 'products':
      return demoProducts;
    case 'orders':
      return demoOrders;
    case 'customers':
      return demoCustomers;
    case 'stats':
      return demoStats;
    default:
      return [];
  }
};
