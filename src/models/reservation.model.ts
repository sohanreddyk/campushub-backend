import { Schema, model } from 'mongoose';

export const RESERVATION_STATUSES = ['confirmed', 'cancelled'] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export interface IReservation {
  tenantId: string;
  resourceId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
}

const reservationSchema = new Schema<IReservation>(
  {
    tenantId: { type: String, required: true },
    resourceId: { type: String, required: true },
    userId: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: [...RESERVATION_STATUSES],
      default: 'confirmed',
      required: true,
    },
  },
  { timestamps: true },
);

// Every tenant-scoped lookup filters on tenantId first (AGENTS.md §2).
reservationSchema.index({
  tenantId: 1,
  resourceId: 1,
  startTime: 1,
  endTime: 1,
});

export const ReservationModel = model<IReservation>(
  'Reservation',
  reservationSchema,
);
