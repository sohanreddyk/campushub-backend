import { IReservation } from '../models/reservation.model';
import { CreateReservationInput } from '../types/reservation.types';
import { createReservation, hasTimeOverlap } from './reservation.service';

// The service is tested without MongoDB: the Mongoose model is replaced by
// two jest mocks, so these tests run anywhere (including CI).
jest.mock('../models/reservation.model', () => ({
  ReservationModel: { find: jest.fn(), create: jest.fn() },
}));

interface MockedReservationModel {
  find: jest.Mock;
  create: jest.Mock;
}

const { ReservationModel } = jest.requireMock<{
  ReservationModel: MockedReservationModel;
}>('../models/reservation.model');

const at = (hour: number): Date => new Date(Date.UTC(2030, 0, 15, hour, 0, 0));

const existingBooking = (startHour: number, endHour: number): IReservation => ({
  tenantId: 'tenant-a',
  resourceId: 'room-101',
  userId: 'user-1',
  startTime: at(startHour),
  endTime: at(endHour),
  status: 'confirmed',
});

const bookingRequest = (
  startHour: number,
  endHour: number,
): CreateReservationInput => ({
  tenantId: 'tenant-a',
  resourceId: 'room-101',
  userId: 'user-2',
  startTime: at(startHour),
  endTime: at(endHour),
});

const givenExistingBookings = (rows: IReservation[]): void => {
  ReservationModel.find.mockReturnValue({
    exec: (): Promise<IReservation[]> => Promise.resolve(rows),
  });
};

beforeEach(() => {
  ReservationModel.create.mockImplementation((doc: IReservation) =>
    Promise.resolve(doc),
  );
});

describe('hasTimeOverlap', () => {
  it('detects partially overlapping ranges', () => {
    expect(hasTimeOverlap(at(9), at(11), at(10), at(12))).toBe(true);
  });

  it('detects a range fully contained in another', () => {
    expect(hasTimeOverlap(at(9), at(13), at(10), at(11))).toBe(true);
  });

  it('returns false for clearly separate ranges', () => {
    expect(hasTimeOverlap(at(9), at(10), at(11), at(12))).toBe(false);
  });

  it('treats back-to-back ranges as non-overlapping', () => {
    expect(hasTimeOverlap(at(9), at(10), at(10), at(11))).toBe(false);
  });
});

describe('createReservation', () => {
  it('creates a reservation when the resource has no bookings', async () => {
    givenExistingBookings([]);

    const result = await createReservation(bookingRequest(9, 10));

    expect(result.status).toBe('confirmed');
    expect(ReservationModel.create).toHaveBeenCalledTimes(1);
  });

  it('creates a reservation that does not overlap an existing one', async () => {
    givenExistingBookings([existingBooking(9, 10)]);

    await expect(createReservation(bookingRequest(11, 12))).resolves.toEqual(
      expect.objectContaining({ userId: 'user-2', status: 'confirmed' }),
    );
    expect(ReservationModel.create).toHaveBeenCalledTimes(1);
  });

  it('allows a booking that starts exactly when another ends', async () => {
    givenExistingBookings([existingBooking(9, 10)]);

    await expect(
      createReservation(bookingRequest(10, 11)),
    ).resolves.toBeDefined();
  });

  it('rejects a partially overlapping booking with 409', async () => {
    givenExistingBookings([existingBooking(9, 11)]);

    await expect(
      createReservation(bookingRequest(10, 12)),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(ReservationModel.create).not.toHaveBeenCalled();
  });

  it('rejects a booking fully inside an existing one with 409', async () => {
    givenExistingBookings([existingBooking(9, 13)]);

    await expect(
      createReservation(bookingRequest(10, 11)),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects an end time that is not after the start time with 400', async () => {
    givenExistingBookings([]);

    await expect(
      createReservation(bookingRequest(11, 10)),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(ReservationModel.find).not.toHaveBeenCalled();
  });

  it('only looks at confirmed bookings for the same tenant and resource', async () => {
    givenExistingBookings([]);

    await createReservation(bookingRequest(9, 10));

    expect(ReservationModel.find).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      resourceId: 'room-101',
      status: 'confirmed',
    });
  });
});
