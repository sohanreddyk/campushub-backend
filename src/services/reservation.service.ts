import { AppError } from '../middleware/error.middleware';
import { IReservation, ReservationModel } from '../models/reservation.model';
import { CreateReservationInput } from '../types/reservation.types';

/**
 * Two half-open intervals [start, end) overlap when each one starts before
 * the other ends. Back-to-back bookings (one ends exactly when the next
 * starts) do not overlap.
 */
export const hasTimeOverlap = (
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean => {
  return startA.getTime() < endB.getTime() && startB.getTime() < endA.getTime();
};

/**
 * Creates a reservation for one resource inside one tenant.
 * Throws AppError(400) for an invalid window and AppError(409) when the
 * window collides with an existing confirmed reservation.
 */
export const createReservation = async (
  input: CreateReservationInput,
): Promise<IReservation> => {
  const { tenantId, resourceId, startTime, endTime } = input;

  if (endTime.getTime() <= startTime.getTime()) {
    throw new AppError('Reservation end time must be after start time', 400);
  }

  const existing = await ReservationModel.find({
    tenantId,
    resourceId,
    status: 'confirmed',
  }).exec();

  const hasConflict = existing.some((reservation) =>
    hasTimeOverlap(
      startTime,
      endTime,
      reservation.startTime,
      reservation.endTime,
    ),
  );

  if (hasConflict) {
    throw new AppError(
      'Resource is already reserved for the requested time window',
      409,
    );
  }

  return ReservationModel.create({ ...input, status: 'confirmed' });
};
