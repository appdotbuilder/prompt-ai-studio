import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  loginInputSchema,
  flightSearchInputSchema,
  flightBookingInputSchema,
  trainSearchInputSchema,
  trainBookingInputSchema,
  seatSelectionInputSchema,
  ppobBillCheckInputSchema,
  ppobPaymentInputSchema,
  pulsaTopupInputSchema,
  bankInquiryInputSchema,
  bankTransferInputSchema,
  statusCheckInputSchema
} from './schema';

// Import handlers
import { registerUser, loginUser, getUserById } from './handlers/auth';
import { 
  searchFlights, 
  getFlightPrice, 
  bookFlight, 
  issueTicket, 
  getFlightBookingStatus 
} from './handlers/flights';
import { 
  searchTrainSchedules, 
  bookTrain, 
  getTrainSeatMap, 
  selectTrainSeat, 
  changeTrainSeat, 
  getTrainBookingStatus 
} from './handlers/trains';
import { 
  getPpobProducts, 
  checkPpobBill, 
  payPpobBill, 
  getPpobTransactionStatus, 
  getPpobTransactionHistory 
} from './handlers/ppob';
import { 
  getPulsaProducts, 
  getOperatorFromPhoneNumber, 
  topupPulsa, 
  getPulsaTransactionStatus, 
  getPulsaTransactionHistory 
} from './handlers/pulsa';
import { 
  getSupportedBanks, 
  inquiryBankAccount, 
  transferBank, 
  getBankTransferStatus, 
  getBankTransferHistory, 
  validateTransferAmount 
} from './handlers/bank_transfer';
import { 
  getBookingById, 
  getBookingByCode, 
  getUserBookings, 
  cancelBooking, 
  updateBookingStatus, 
  getBookingPayments, 
  checkBookingExpiration, 
  getGeneralTransactionStatus 
} from './handlers/booking';
import { 
  handleKlikMBCWebhook, 
  processWebhookEvent, 
  getWebhookEvents, 
  retryFailedWebhooks 
} from './handlers/webhook';
import { 
  getAllBookings, 
  getAllTransactions, 
  getSystemStats, 
  getAuditLogs, 
  createAuditLog, 
  getRevenueReport, 
  getFailedTransactions, 
  retryFailedTransaction, 
  getWebhookEventLogs 
} from './handlers/admin';
import { 
  checkIdempotency, 
  createIdempotencyRecord, 
  updateIdempotencyRecord, 
  cleanupExpiredIdempotencyRecords, 
  generateIdempotencyKey, 
  validateIdempotencyKey, 
  withIdempotency 
} from './handlers/idempotency';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Auth routes
  auth: router({
    register: publicProcedure
      .input(createUserInputSchema)
      .mutation(({ input }) => registerUser(input)),
    
    login: publicProcedure
      .input(loginInputSchema)
      .mutation(({ input }) => loginUser(input)),
    
    getUser: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(({ input }) => getUserById(input.userId)),
  }),

  // Flight routes
  flights: router({
    search: publicProcedure
      .input(flightSearchInputSchema)
      .query(({ input }) => searchFlights(input)),
    
    getPrice: publicProcedure
      .input(z.object({ flightId: z.string(), passengers: z.number().int().positive() }))
      .query(({ input }) => getFlightPrice(input.flightId, input.passengers)),
    
    book: publicProcedure
      .input(flightBookingInputSchema.extend({ userId: z.number() }))
      .mutation(({ input }) => bookFlight(input, input.userId)),
    
    issueTicket: publicProcedure
      .input(z.object({ bookingId: z.number() }))
      .mutation(({ input }) => issueTicket(input.bookingId)),
    
    getBookingStatus: publicProcedure
      .input(z.object({ bookingCode: z.string() }))
      .query(({ input }) => getFlightBookingStatus(input.bookingCode)),
  }),

  // Train routes
  trains: router({
    searchSchedules: publicProcedure
      .input(trainSearchInputSchema)
      .query(({ input }) => searchTrainSchedules(input)),
    
    book: publicProcedure
      .input(trainBookingInputSchema.extend({ userId: z.number() }))
      .mutation(({ input }) => bookTrain(input, input.userId)),
    
    getSeatMap: publicProcedure
      .input(z.object({ scheduleId: z.string(), classType: z.string() }))
      .query(({ input }) => getTrainSeatMap(input.scheduleId, input.classType)),
    
    selectSeat: publicProcedure
      .input(seatSelectionInputSchema)
      .mutation(({ input }) => selectTrainSeat(input)),
    
    changeSeat: publicProcedure
      .input(seatSelectionInputSchema)
      .mutation(({ input }) => changeTrainSeat(input)),
    
    getBookingStatus: publicProcedure
      .input(z.object({ bookingCode: z.string() }))
      .query(({ input }) => getTrainBookingStatus(input.bookingCode)),
  }),

  // PPOB routes
  ppob: router({
    getProducts: publicProcedure
      .query(() => getPpobProducts()),
    
    checkBill: publicProcedure
      .input(ppobBillCheckInputSchema)
      .query(({ input }) => checkPpobBill(input)),
    
    payBill: publicProcedure
      .input(ppobPaymentInputSchema.extend({ userId: z.number() }))
      .mutation(({ input }) => payPpobBill(input, input.userId)),
    
    getTransactionStatus: publicProcedure
      .input(z.object({ transactionId: z.string() }))
      .query(({ input }) => getPpobTransactionStatus(input.transactionId)),
    
    getTransactionHistory: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().optional(), offset: z.number().optional() }))
      .query(({ input }) => getPpobTransactionHistory(input.userId, input.limit, input.offset)),
  }),

  // Pulsa routes
  pulsa: router({
    getProducts: publicProcedure
      .input(z.object({ operator: z.string().optional() }))
      .query(({ input }) => getPulsaProducts(input.operator)),
    
    getOperator: publicProcedure
      .input(z.object({ phoneNumber: z.string() }))
      .query(({ input }) => getOperatorFromPhoneNumber(input.phoneNumber)),
    
    topup: publicProcedure
      .input(pulsaTopupInputSchema.extend({ userId: z.number() }))
      .mutation(({ input }) => topupPulsa(input, input.userId)),
    
    getTransactionStatus: publicProcedure
      .input(z.object({ transactionId: z.string() }))
      .query(({ input }) => getPulsaTransactionStatus(input.transactionId)),
    
    getTransactionHistory: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().optional(), offset: z.number().optional() }))
      .query(({ input }) => getPulsaTransactionHistory(input.userId, input.limit, input.offset)),
  }),

  // Bank Transfer routes
  bankTransfer: router({
    getSupportedBanks: publicProcedure
      .query(() => getSupportedBanks()),
    
    inquiryAccount: publicProcedure
      .input(bankInquiryInputSchema)
      .query(({ input }) => inquiryBankAccount(input)),
    
    transfer: publicProcedure
      .input(bankTransferInputSchema.extend({ userId: z.number() }))
      .mutation(({ input }) => transferBank(input, input.userId)),
    
    validateAmount: publicProcedure
      .input(z.object({ bankCode: z.string(), amount: z.number() }))
      .query(({ input }) => validateTransferAmount(input.bankCode, input.amount)),
    
    getTransactionStatus: publicProcedure
      .input(z.object({ transactionId: z.string() }))
      .query(({ input }) => getBankTransferStatus(input.transactionId)),
    
    getTransactionHistory: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().optional(), offset: z.number().optional() }))
      .query(({ input }) => getBankTransferHistory(input.userId, input.limit, input.offset)),
  }),

  // Booking routes
  bookings: router({
    getById: publicProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(({ input }) => getBookingById(input.bookingId)),
    
    getByCode: publicProcedure
      .input(z.object({ bookingCode: z.string() }))
      .query(({ input }) => getBookingByCode(input.bookingCode)),
    
    getUserBookings: publicProcedure
      .input(z.object({ 
        userId: z.number(), 
        transactionType: z.string().optional(), 
        limit: z.number().optional(), 
        offset: z.number().optional() 
      }))
      .query(({ input }) => getUserBookings(
        input.userId, 
        input.transactionType as any, 
        input.limit, 
        input.offset
      )),
    
    cancel: publicProcedure
      .input(z.object({ bookingId: z.number(), userId: z.number() }))
      .mutation(({ input }) => cancelBooking(input.bookingId, input.userId)),
    
    updateStatus: publicProcedure
      .input(z.object({ bookingId: z.number(), status: z.string() }))
      .mutation(({ input }) => updateBookingStatus(input.bookingId, input.status)),
    
    getPayments: publicProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(({ input }) => getBookingPayments(input.bookingId)),
    
    checkExpiration: publicProcedure
      .mutation(() => checkBookingExpiration()),
    
    getGeneralStatus: publicProcedure
      .input(statusCheckInputSchema)
      .query(({ input }) => getGeneralTransactionStatus(input)),
  }),

  // Webhook routes (for admin/internal use)
  webhooks: router({
    handle: publicProcedure
      .input(z.object({ payload: z.any(), eventType: z.string() }))
      .mutation(({ input }) => handleKlikMBCWebhook(input.payload, input.eventType)),
    
    getEvents: publicProcedure
      .input(z.object({ 
        processed: z.boolean().optional(), 
        limit: z.number().optional(), 
        offset: z.number().optional() 
      }))
      .query(({ input }) => getWebhookEvents(input.processed, input.limit, input.offset)),
    
    retryFailed: publicProcedure
      .input(z.object({ maxAttempts: z.number().default(3) }))
      .mutation(({ input }) => retryFailedWebhooks(input.maxAttempts)),
  }),

  // Admin routes
  admin: router({
    getAllBookings: publicProcedure
      .input(z.object({ 
        limit: z.number().optional(), 
        offset: z.number().optional(), 
        status: z.string().optional(),
        transactionType: z.string().optional() 
      }))
      .query(({ input }) => getAllBookings(input.limit, input.offset, input.status, input.transactionType)),
    
    getAllTransactions: publicProcedure
      .input(z.object({ 
        limit: z.number().optional(),
        offset: z.number().optional(),
        status: z.string().optional(),
        type: z.enum(['ppob', 'pulsa', 'bank_transfer']).optional() 
      }))
      .query(({ input }) => getAllTransactions(input.limit, input.offset, input.status, input.type)),
    
    getSystemStats: publicProcedure
      .query(() => getSystemStats()),
    
    getAuditLogs: publicProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        userId: z.number().optional(),
        action: z.string().optional(),
        resourceType: z.string().optional()
      }))
      .query(({ input }) => getAuditLogs(
        input.limit,
        input.offset,
        input.userId,
        input.action,
        input.resourceType
      )),
    
    getRevenueReport: publicProcedure
      .input(z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        transactionType: z.string().optional()
      }))
      .query(({ input }) => getRevenueReport(input.startDate, input.endDate, input.transactionType)),
    
    getFailedTransactions: publicProcedure
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
      .query(({ input }) => getFailedTransactions(input.limit, input.offset)),
    
    retryTransaction: publicProcedure
      .input(z.object({
        transactionId: z.string(),
        transactionType: z.enum(['booking', 'ppob', 'pulsa', 'bank_transfer'])
      }))
      .mutation(({ input }) => retryFailedTransaction(input.transactionId, input.transactionType)),
    
    getWebhookEventLogs: publicProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        processed: z.boolean().optional(),
        eventType: z.string().optional()
      }))
      .query(({ input }) => getWebhookEventLogs(
        input.limit,
        input.offset,
        input.processed,
        input.eventType
      )),
  }),

  // Idempotency utilities (for internal use)
  idempotency: router({
    check: publicProcedure
      .input(z.object({
        idempotencyKey: z.string(),
        resourceType: z.string(),
        requestData: z.any()
      }))
      .query(({ input }) => checkIdempotency(input.idempotencyKey, input.resourceType, input.requestData)),
    
    create: publicProcedure
      .input(z.object({
        idempotencyKey: z.string(),
        resourceType: z.string(),
        requestData: z.any(),
        expiresInMinutes: z.number().default(60)
      }))
      .mutation(({ input }) => createIdempotencyRecord(
        input.idempotencyKey,
        input.resourceType,
        input.requestData,
        input.expiresInMinutes
      )),
    
    generateKey: publicProcedure
      .query(() => ({ key: generateIdempotencyKey() })),
    
    validateKey: publicProcedure
      .input(z.object({ key: z.string() }))
      .query(({ input }) => ({ valid: validateIdempotencyKey(input.key) })),
    
    cleanup: publicProcedure
      .mutation(() => cleanupExpiredIdempotencyRecords()),
  }),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      // CORS configuration for travel app
      cors({
        origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
        credentials: true,
      })(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  
  server.listen(port);
  console.log(`🚀 Prompt AI Studio Travel API server listening at port: ${port}`);
  console.log(`📖 API documentation available at: http://localhost:${port}/api/docs`);
  console.log(`🌏 Timezone: ${process.env['TZ'] || 'Asia/Jakarta'}`);
  console.log(`🔗 KlikMBC API Base: ${process.env['API_BASE'] || 'https://api.klikmbc.biz'}`);
}

start();