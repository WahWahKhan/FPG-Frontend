// pages/api/customers/list.ts
// Server-side filtered customer list. Never dumps all 6500+ records to the client.
// Reads from /public/customers.json (static, gzip-compressed by Vercel in transit).
//
// Query params:
//   q        - free text search (name or company), min 1 char
//   state    - 0=VIC/TAS 1=NSW/ACT 2=QLD 3=WA/SA/NT 4=Mobile (comma-separated for multi)
//   hasEmail - "1" to filter to contacts with email only
//   hasMobile- "1" to filter to contacts with mobile only
//   roleOnly - "1" to show only role contacts, "0" to hide them (omit = show all)
//   page     - 1-based page number (default 1)
//   limit    - records per page (default 50, max 100)

import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

// Compact record shape from customers.json
interface CompactCustomer {
  n?: string;  // name
  c?: string;  // company
  p?: string;  // phone
  m?: string;  // mobile
  e?: string;  // email
  s?: number;  // state index
  r?: number;  // isRole (1 = true, omitted = false)
}

export interface CustomerRecord {
  name: string;
  company: string;
  phone: string;
  mobile: string;
  email: string;
  stateIndex: number;    // -1 = unknown
  stateLabel: string;
  isRole: boolean;
}

const STATE_LABELS = ['VIC/TAS', 'NSW/ACT', 'QLD', 'WA/SA/NT', 'Mobile'];

function expand(c: CompactCustomer): CustomerRecord {
  const si = c.s ?? -1;
  return {
    name:       c.n || '',
    company:    c.c || '',
    phone:      c.p || '',
    mobile:     c.m || '',
    email:      c.e || '',
    stateIndex: si,
    stateLabel: si >= 0 ? STATE_LABELS[si] : 'Unknown',
    isRole:     c.r === 1,
  };
}

// Module-level cache — loaded once per serverless function cold start
let cachedCustomers: CustomerRecord[] | null = null;

function loadCustomers(): CustomerRecord[] {
  if (cachedCustomers) return cachedCustomers;
  const filePath = path.join(process.cwd(), 'public', 'customers.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  cachedCustomers = (parsed.customers as CompactCustomer[]).map(expand);
  return cachedCustomers;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const all = loadCustomers();

    const q          = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const stateParam = typeof req.query.state === 'string' ? req.query.state : '';
    const hasEmail   = req.query.hasEmail === '1';
    const hasMobile  = req.query.hasMobile === '1';
    const roleOnly   = req.query.roleOnly;           // '1', '0', or undefined
    const page       = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit      = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

    // Parse comma-separated state indices
    const stateFilter = stateParam
      ? stateParam.split(',').map(s => parseInt(s)).filter(n => !isNaN(n))
      : [];

    let results = all;

    // Text search
    if (q) {
      results = results.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q)
      );
    }

    // State filter
    if (stateFilter.length > 0) {
      results = results.filter(c => stateFilter.includes(c.stateIndex));
    }

    // Email / mobile filters
    if (hasEmail)  results = results.filter(c => !!c.email);
    if (hasMobile) results = results.filter(c => !!c.mobile);

    // Role filter
    if (roleOnly === '1')  results = results.filter(c => c.isRole);
    if (roleOnly === '0')  results = results.filter(c => !c.isRole);

    const total = results.length;
    const start = (page - 1) * limit;
    const paged = results.slice(start, start + limit);

    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1hr cache
    return res.status(200).json({
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      customers: paged,
    });
  } catch (err: any) {
    console.error('customers/list error:', err);
    return res.status(500).json({ error: 'Failed to load customer data' });
  }
}