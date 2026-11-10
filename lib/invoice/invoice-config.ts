// lib/invoice/invoice-config.ts

export const COMPANY_INFO = {
  name: 'FluidPower Group Pty Ltd',
  address: {
    street: '44a Murrell Street',
    suburb: 'Wangaratta',
    state: 'Victoria',
    postcode: '3677',
    country: 'Australia'
  },
  abn: '29 644 885 932',
  website: 'www.fluidpowergroup.com.au',
  email: 'info@fluidpowergroup.com.au',
  phone: '03 4720 3323',
  bankDetails: {
    accountName: 'FluidPower Group Pty Ltd',
    bsb: '063 531',
    accountNumber: '1059 0324'
  },
  defaultPaymentTerms: 'EOM 30',
  defaultDueDays: 30
};

export const INVOICE_CONFIG = {
  gstRate: 0.1, // 10%
  targetFileSize: { min: 30, max: 50 }, // KB
};
