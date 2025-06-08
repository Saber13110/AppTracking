export interface PackageStatus {
  status: string;
  description: string;
  is_delivered: boolean;
}

export interface Location {
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface TrackingEvent {
  status: string;
  description: string;
  location?: Location;
  timestamp: string;
}

export interface PackageDetails {
  weight?: string;
  dimensions?: string;
  pieces?: number;
  insurance?: string;
  service_type?: string;
  packaging_description?: string;
}

export interface DeliveryDetails {
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  signed_by?: string;
  options?: string[]; // Example: ['Schedule Delivery', 'Change Address']
  delivery_location?: Location;
}

export interface TrackingInfo {
  tracking_number: string;
  carrier: string;
  status: PackageStatus;
  tracking_history: TrackingEvent[];
  package_details?: PackageDetails;
  delivery_details?: DeliveryDetails;
  origin?: Location;
  destination?: Location;
  metadata?: { [key: string]: any }; // Assuming metadata can be any key-value pairs
}

export interface TrackingResponse {
  tracking_info: TrackingInfo | null;
  error?: string;
} 
