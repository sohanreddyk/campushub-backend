export interface CreateReservationInput {
  readonly tenantId: string;
  readonly resourceId: string;
  readonly userId: string;
  readonly startTime: Date;
  readonly endTime: Date;
}
