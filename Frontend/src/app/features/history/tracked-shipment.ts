export interface TrackedShipment {
  id: string;
  tracking_number: string;
  status?: string;
  meta_data: { [key: string]: any };
  note?: string;
  created_at: string;
}
