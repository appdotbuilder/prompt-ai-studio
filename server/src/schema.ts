import { z } from 'zod';

// Enum schemas
export const bookingStatusSchema = z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'failed']);
export const paymentStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed', 'refunded']);
export const transactionTypeSchema = z.enum(['flight', 'train', 'ppob', 'pulsa', 'bank_transfer']);
export const genderSchema = z.enum(['male', 'female']);
export const passengerTypeSchema = z.enum(['adult', 'child', 'infant']);

export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type Gender = z.infer<typeof genderSchema>;
export type PassengerType = z.infer<typeof passengerTypeSchema>;

// Pricing breakdown schema (standardized for KlikMBC API responses)
export const pricingBreakdownSchema = z.object({
  base_price: z.number(),
  taxes: z.number(),
  fees: z.number(),
  total: z.number(),
  agent_commission: z.number().optional(),
  currency: z.string().default('IDR'),
});

export type PricingBreakdown = z.infer<typeof pricingBreakdownSchema>;

// User schemas
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  phone: z.string().nullable(),
  full_name: z.string(),
  password_hash: z.string(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  full_name: z.string().min(1),
  password: z.string().min(6),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Passenger schemas
export const passengerSchema = z.object({
  id: z.number(),
  booking_id: z.number(),
  title: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  gender: genderSchema,
  birth_date: z.string(), // YYYY-MM-DD format
  nationality: z.string(),
  id_number: z.string().nullable(),
  passenger_type: passengerTypeSchema,
  seat_number: z.string().nullable(),
  meal_preference: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type Passenger = z.infer<typeof passengerSchema>;

export const createPassengerInputSchema = z.object({
  title: z.string(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  gender: genderSchema,
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  nationality: z.string().default('ID'),
  id_number: z.string().optional(),
  passenger_type: passengerTypeSchema,
  seat_number: z.string().optional(),
  meal_preference: z.string().optional(),
});

export type CreatePassengerInput = z.infer<typeof createPassengerInputSchema>;

// Flight schemas
export const flightSearchInputSchema = z.object({
  origin: z.string().length(3), // IATA airport code
  destination: z.string().length(3), // IATA airport code
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // For round trip
  adults: z.number().int().min(1).max(9),
  children: z.number().int().min(0).max(8).default(0),
  infants: z.number().int().min(0).max(8).default(0),
  cabin_class: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
});

export type FlightSearchInput = z.infer<typeof flightSearchInputSchema>;

export const flightOfferSchema = z.object({
  id: z.string(),
  airline_code: z.string(),
  airline_name: z.string(),
  flight_number: z.string(),
  aircraft_type: z.string(),
  departure_time: z.string(),
  arrival_time: z.string(),
  duration: z.string(),
  stops: z.number().int(),
  cabin_class: z.string(),
  fare_basis: z.string(),
  pricing: pricingBreakdownSchema,
  availability: z.number().int(),
  baggage_info: z.string().nullable(),
});

export type FlightOffer = z.infer<typeof flightOfferSchema>;

export const flightBookingInputSchema = z.object({
  flight_id: z.string(),
  passengers: z.array(createPassengerInputSchema).min(1),
  contact_info: z.object({
    email: z.string().email(),
    phone: z.string(),
  }),
  payment_method: z.string(),
});

export type FlightBookingInput = z.infer<typeof flightBookingInputSchema>;

// Train schemas
export const trainSearchInputSchema = z.object({
  origin: z.string(), // Station code
  destination: z.string(), // Station code
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  adults: z.number().int().min(1).max(8),
  infants: z.number().int().min(0).max(2).default(0),
});

export type TrainSearchInput = z.infer<typeof trainSearchInputSchema>;

export const trainScheduleSchema = z.object({
  id: z.string(),
  train_number: z.string(),
  train_name: z.string(),
  class: z.string(),
  subclass: z.string(),
  departure_time: z.string(),
  arrival_time: z.string(),
  duration: z.string(),
  available_seats: z.number().int(),
  pricing: pricingBreakdownSchema,
});

export type TrainSchedule = z.infer<typeof trainScheduleSchema>;

export const trainBookingInputSchema = z.object({
  schedule_id: z.string(),
  passengers: z.array(createPassengerInputSchema).min(1),
  contact_info: z.object({
    email: z.string().email(),
    phone: z.string(),
  }),
  payment_method: z.string(),
});

export type TrainBookingInput = z.infer<typeof trainBookingInputSchema>;

export const seatSelectionInputSchema = z.object({
  booking_id: z.number(),
  passenger_id: z.number(),
  seat_number: z.string(),
});

export type SeatSelectionInput = z.infer<typeof seatSelectionInputSchema>;

// PPOB schemas
export const ppobProductSchema = z.object({
  product_code: z.string(),
  product_name: z.string(),
  category: z.string(),
  provider: z.string(),
  denomination: z.number().nullable(),
  admin_fee: z.number(),
  is_active: z.boolean(),
  description: z.string().nullable(),
});

export type PpobProduct = z.infer<typeof ppobProductSchema>;

export const ppobBillCheckInputSchema = z.object({
  product_code: z.string(),
  customer_id: z.string(), // Bill number, meter number, etc.
});

export type PpobBillCheckInput = z.infer<typeof ppobBillCheckInputSchema>;

export const ppobBillInfoSchema = z.object({
  customer_id: z.string(),
  customer_name: z.string(),
  bill_amount: z.number(),
  admin_fee: z.number(),
  total_amount: z.number(),
  due_date: z.string().nullable(),
  penalty: z.number().optional(),
  period: z.string().nullable(),
  additional_info: z.record(z.any()).optional(),
});

export type PpobBillInfo = z.infer<typeof ppobBillInfoSchema>;

export const ppobPaymentInputSchema = z.object({
  product_code: z.string(),
  customer_id: z.string(),
  amount: z.number().positive(),
});

export type PpobPaymentInput = z.infer<typeof ppobPaymentInputSchema>;

// Pulsa/Data schemas
export const pulsaProductSchema = z.object({
  product_code: z.string(),
  operator: z.string(), // Telkomsel, Indosat, XL, etc.
  product_name: z.string(),
  denomination: z.number(),
  price: z.number(),
  product_type: z.enum(['pulsa', 'data', 'combo']),
  validity: z.string().nullable(), // For data packages
  description: z.string().nullable(),
});

export type PulsaProduct = z.infer<typeof pulsaProductSchema>;

export const pulsaTopupInputSchema = z.object({
  phone_number: z.string().regex(/^(\+62|62|0)\d{8,13}$/), // Indonesian phone number
  product_code: z.string(),
});

export type PulsaTopupInput = z.infer<typeof pulsaTopupInputSchema>;

// Bank Transfer schemas
export const bankSchema = z.object({
  bank_code: z.string(),
  bank_name: z.string(),
  is_active: z.boolean(),
  transfer_fee: z.number(),
  min_amount: z.number(),
  max_amount: z.number(),
});

export type Bank = z.infer<typeof bankSchema>;

export const bankInquiryInputSchema = z.object({
  to_bank: z.string(),
  to_account_number: z.string(),
});

export type BankInquiryInput = z.infer<typeof bankInquiryInputSchema>;

export const bankAccountInfoSchema = z.object({
  account_number: z.string(),
  account_name: z.string(),
  bank_name: z.string(),
  transfer_fee: z.number(),
});

export type BankAccountInfo = z.infer<typeof bankAccountInfoSchema>;

export const bankTransferInputSchema = z.object({
  to_bank: z.string(),
  to_account_number: z.string(),
  amount: z.number().positive(),
  notes: z.string().optional(),
});

export type BankTransferInput = z.infer<typeof bankTransferInputSchema>;

// Booking schemas
export const bookingSchema = z.object({
  id: z.number(),
  booking_code: z.string(),
  user_id: z.number(),
  transaction_type: transactionTypeSchema,
  status: bookingStatusSchema,
  total_amount: z.number(),
  currency: z.string(),
  booking_data: z.record(z.any()),
  external_booking_id: z.string().nullable(),
  expires_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Booking = z.infer<typeof bookingSchema>;

// Payment schemas
export const paymentSchema = z.object({
  id: z.number(),
  booking_id: z.number(),
  payment_method: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: paymentStatusSchema,
  external_payment_id: z.string().nullable(),
  payment_data: z.record(z.any()).nullable(),
  processed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Payment = z.infer<typeof paymentSchema>;

// Transaction schemas
export const ppobTransactionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  transaction_id: z.string(),
  product_code: z.string(),
  customer_id: z.string(),
  amount: z.number(),
  admin_fee: z.number(),
  total_amount: z.number(),
  status: paymentStatusSchema,
  bill_data: z.record(z.any()).nullable(),
  payment_data: z.record(z.any()).nullable(),
  external_ref: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type PpobTransaction = z.infer<typeof ppobTransactionSchema>;

export const walletTopupSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  transaction_id: z.string(),
  phone_number: z.string(),
  operator: z.string(),
  product_code: z.string(),
  denomination: z.number(),
  amount: z.number(),
  status: paymentStatusSchema,
  topup_data: z.record(z.any()).nullable(),
  external_ref: z.string().nullable(),
  processed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type WalletTopup = z.infer<typeof walletTopupSchema>;

export const bankTransferSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  transaction_id: z.string(),
  from_bank: z.string(),
  to_bank: z.string(),
  to_account_number: z.string(),
  to_account_name: z.string(),
  amount: z.number(),
  transfer_fee: z.number(),
  total_amount: z.number(),
  status: paymentStatusSchema,
  inquiry_data: z.record(z.any()).nullable(),
  transfer_data: z.record(z.any()).nullable(),
  external_ref: z.string().nullable(),
  processed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type BankTransferRecord = z.infer<typeof bankTransferSchema>;

// Ticket schemas
export const ticketSchema = z.object({
  id: z.number(),
  booking_id: z.number(),
  passenger_id: z.number().nullable(),
  ticket_number: z.string(),
  ticket_type: transactionTypeSchema,
  ticket_data: z.record(z.any()),
  ticket_url: z.string().nullable(),
  is_issued: z.boolean(),
  issued_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
});

export type Ticket = z.infer<typeof ticketSchema>;

// Idempotency schemas
export const idempotencyRecordSchema = z.object({
  id: z.number(),
  idempotency_key: z.string().uuid(),
  resource_type: z.string(),
  resource_id: z.string().nullable(),
  request_hash: z.string(),
  response_data: z.record(z.any()).nullable(),
  status: z.string(),
  expires_at: z.coerce.date(),
  created_at: z.coerce.date(),
});

export type IdempotencyRecord = z.infer<typeof idempotencyRecordSchema>;

// Webhook schemas
export const webhookEventSchema = z.object({
  id: z.number(),
  event_id: z.string(),
  event_type: z.string(),
  source: z.string(),
  payload: z.record(z.any()),
  processed: z.boolean(),
  processing_attempts: z.number().int(),
  last_error: z.string().nullable(),
  processed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
});

export type WebhookEvent = z.infer<typeof webhookEventSchema>;

// Audit log schemas
export const auditLogSchema = z.object({
  id: z.number(),
  user_id: z.number().nullable(),
  action: z.string(),
  resource_type: z.string(),
  resource_id: z.string().nullable(),
  old_values: z.record(z.any()).nullable(),
  new_values: z.record(z.any()).nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

// Generic response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

// Status check input
export const statusCheckInputSchema = z.object({
  transaction_id: z.string().optional(),
  booking_code: z.string().optional(),
}).refine((data) => data.transaction_id || data.booking_code, {
  message: "Either transaction_id or booking_code must be provided",
});

export type StatusCheckInput = z.infer<typeof statusCheckInputSchema>;