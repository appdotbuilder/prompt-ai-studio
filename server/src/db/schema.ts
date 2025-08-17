import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  numeric, 
  integer, 
  boolean,
  jsonb,
  pgEnum,
  uuid,
  index
} from 'drizzle-orm/pg-core';

// Enums
export const bookingStatusEnum = pgEnum('booking_status', [
  'pending', 'confirmed', 'cancelled', 'completed', 'failed'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending', 'processing', 'completed', 'failed', 'refunded'
]);

export const transactionTypeEnum = pgEnum('transaction_type', [
  'flight', 'train', 'ppob', 'pulsa', 'bank_transfer'
]);

export const genderEnum = pgEnum('gender', ['male', 'female']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').unique().notNull(),
  phone: text('phone'),
  full_name: text('full_name').notNull(),
  password_hash: text('password_hash').notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}));

// Bookings table
export const bookingsTable = pgTable('bookings', {
  id: serial('id').primaryKey(),
  booking_code: text('booking_code').unique().notNull(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  transaction_type: transactionTypeEnum('transaction_type').notNull(),
  status: bookingStatusEnum('status').default('pending').notNull(),
  total_amount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').default('IDR').notNull(),
  booking_data: jsonb('booking_data').notNull(), // Flexible JSON for different booking types
  external_booking_id: text('external_booking_id'), // KlikMBC booking reference
  expires_at: timestamp('expires_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  bookingCodeIdx: index('bookings_booking_code_idx').on(table.booking_code),
  userIdIdx: index('bookings_user_id_idx').on(table.user_id),
  statusIdx: index('bookings_status_idx').on(table.status),
}));

// Payments table
export const paymentsTable = pgTable('payments', {
  id: serial('id').primaryKey(),
  booking_id: integer('booking_id').references(() => bookingsTable.id).notNull(),
  payment_method: text('payment_method').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').default('IDR').notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  external_payment_id: text('external_payment_id'), // KlikMBC payment reference
  payment_data: jsonb('payment_data'), // Additional payment details
  processed_at: timestamp('processed_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  bookingIdIdx: index('payments_booking_id_idx').on(table.booking_id),
  statusIdx: index('payments_status_idx').on(table.status),
}));

// Passengers table (for flights and trains)
export const passengersTable = pgTable('passengers', {
  id: serial('id').primaryKey(),
  booking_id: integer('booking_id').references(() => bookingsTable.id).notNull(),
  title: text('title').notNull(), // Mr, Mrs, Ms, etc.
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  gender: genderEnum('gender').notNull(),
  birth_date: text('birth_date').notNull(), // Format: YYYY-MM-DD
  nationality: text('nationality').default('ID').notNull(),
  id_number: text('id_number'), // KTP/Passport number
  passenger_type: text('passenger_type').notNull(), // adult, child, infant
  seat_number: text('seat_number'),
  meal_preference: text('meal_preference'),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  bookingIdIdx: index('passengers_booking_id_idx').on(table.booking_id),
}));

// Tickets table
export const ticketsTable = pgTable('tickets', {
  id: serial('id').primaryKey(),
  booking_id: integer('booking_id').references(() => bookingsTable.id).notNull(),
  passenger_id: integer('passenger_id').references(() => passengersTable.id),
  ticket_number: text('ticket_number').unique().notNull(),
  ticket_type: transactionTypeEnum('ticket_type').notNull(),
  ticket_data: jsonb('ticket_data').notNull(), // Flight/train specific data
  ticket_url: text('ticket_url'), // PDF/image URL
  is_issued: boolean('is_issued').default(false).notNull(),
  issued_at: timestamp('issued_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  ticketNumberIdx: index('tickets_ticket_number_idx').on(table.ticket_number),
  bookingIdIdx: index('tickets_booking_id_idx').on(table.booking_id),
}));

// PPOB Transactions table
export const ppobTransactionsTable = pgTable('ppob_transactions', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  transaction_id: text('transaction_id').unique().notNull(),
  product_code: text('product_code').notNull(),
  customer_id: text('customer_id').notNull(), // Bill number, meter number, etc.
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  admin_fee: numeric('admin_fee', { precision: 15, scale: 2 }).default('0'),
  total_amount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  bill_data: jsonb('bill_data'), // Bill details from check
  payment_data: jsonb('payment_data'), // Payment response data
  external_ref: text('external_ref'), // KlikMBC reference
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  transactionIdIdx: index('ppob_transaction_id_idx').on(table.transaction_id),
  userIdIdx: index('ppob_user_id_idx').on(table.user_id),
  statusIdx: index('ppob_status_idx').on(table.status),
}));

// Wallet Topups table (Pulsa/Data)
export const walletTopupsTable = pgTable('wallet_topups', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  transaction_id: text('transaction_id').unique().notNull(),
  phone_number: text('phone_number').notNull(),
  operator: text('operator').notNull(), // Telkomsel, Indosat, XL, etc.
  product_code: text('product_code').notNull(),
  denomination: numeric('denomination', { precision: 15, scale: 2 }).notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  topup_data: jsonb('topup_data'), // Additional topup details
  external_ref: text('external_ref'), // KlikMBC reference
  processed_at: timestamp('processed_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  transactionIdIdx: index('wallet_transaction_id_idx').on(table.transaction_id),
  userIdIdx: index('wallet_user_id_idx').on(table.user_id),
  phoneIdx: index('wallet_phone_idx').on(table.phone_number),
}));

// Bank Transfers table
export const bankTransfersTable = pgTable('bank_transfers', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  transaction_id: text('transaction_id').unique().notNull(),
  from_bank: text('from_bank').notNull(),
  to_bank: text('to_bank').notNull(),
  to_account_number: text('to_account_number').notNull(),
  to_account_name: text('to_account_name').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  transfer_fee: numeric('transfer_fee', { precision: 15, scale: 2 }).default('0'),
  total_amount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  inquiry_data: jsonb('inquiry_data'), // Account inquiry response
  transfer_data: jsonb('transfer_data'), // Transfer response data
  external_ref: text('external_ref'), // KlikMBC reference
  processed_at: timestamp('processed_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  transactionIdIdx: index('bank_transfer_transaction_id_idx').on(table.transaction_id),
  userIdIdx: index('bank_transfer_user_id_idx').on(table.user_id),
  statusIdx: index('bank_transfer_status_idx').on(table.status),
}));

// Idempotency table for preventing duplicate transactions
export const idempotencyTable = pgTable('idempotency', {
  id: serial('id').primaryKey(),
  idempotency_key: uuid('idempotency_key').unique().notNull(),
  resource_type: text('resource_type').notNull(), // booking, payment, transfer, etc.
  resource_id: text('resource_id'), // Reference to created resource
  request_hash: text('request_hash').notNull(),
  response_data: jsonb('response_data'),
  status: text('status').default('processing').notNull(), // processing, completed, failed
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  keyIdx: index('idempotency_key_idx').on(table.idempotency_key),
  expiresIdx: index('idempotency_expires_idx').on(table.expires_at),
}));

// Audit Logs table
export const auditLogsTable = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id),
  action: text('action').notNull(),
  resource_type: text('resource_type').notNull(),
  resource_id: text('resource_id'),
  old_values: jsonb('old_values'),
  new_values: jsonb('new_values'),
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('audit_user_id_idx').on(table.user_id),
  actionIdx: index('audit_action_idx').on(table.action),
  createdAtIdx: index('audit_created_at_idx').on(table.created_at),
}));

// Webhook Events table
export const webhookEventsTable = pgTable('webhook_events', {
  id: serial('id').primaryKey(),
  event_id: text('event_id').unique().notNull(),
  event_type: text('event_type').notNull(),
  source: text('source').default('klikmbc').notNull(),
  payload: jsonb('payload').notNull(),
  processed: boolean('processed').default(false).notNull(),
  processing_attempts: integer('processing_attempts').default(0).notNull(),
  last_error: text('last_error'),
  processed_at: timestamp('processed_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  eventIdIdx: index('webhook_event_id_idx').on(table.event_id),
  processedIdx: index('webhook_processed_idx').on(table.processed),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Booking = typeof bookingsTable.$inferSelect;
export type NewBooking = typeof bookingsTable.$inferInsert;

export type Payment = typeof paymentsTable.$inferSelect;
export type NewPayment = typeof paymentsTable.$inferInsert;

export type Passenger = typeof passengersTable.$inferSelect;
export type NewPassenger = typeof passengersTable.$inferInsert;

export type Ticket = typeof ticketsTable.$inferSelect;
export type NewTicket = typeof ticketsTable.$inferInsert;

export type PpobTransaction = typeof ppobTransactionsTable.$inferSelect;
export type NewPpobTransaction = typeof ppobTransactionsTable.$inferInsert;

export type WalletTopup = typeof walletTopupsTable.$inferSelect;
export type NewWalletTopup = typeof walletTopupsTable.$inferInsert;

export type BankTransfer = typeof bankTransfersTable.$inferSelect;
export type NewBankTransfer = typeof bankTransfersTable.$inferInsert;

export type IdempotencyRecord = typeof idempotencyTable.$inferSelect;
export type NewIdempotencyRecord = typeof idempotencyTable.$inferInsert;

export type AuditLog = typeof auditLogsTable.$inferSelect;
export type NewAuditLog = typeof auditLogsTable.$inferInsert;

export type WebhookEvent = typeof webhookEventsTable.$inferSelect;
export type NewWebhookEvent = typeof webhookEventsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  bookings: bookingsTable,
  payments: paymentsTable,
  passengers: passengersTable,
  tickets: ticketsTable,
  ppobTransactions: ppobTransactionsTable,
  walletTopups: walletTopupsTable,
  bankTransfers: bankTransfersTable,
  idempotency: idempotencyTable,
  auditLogs: auditLogsTable,
  webhookEvents: webhookEventsTable,
};