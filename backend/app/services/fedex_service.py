import os
import httpx
import yaml
import logging
from typing import Dict, Any
from datetime import datetime, timedelta
from importlib import resources
from pathlib import Path
from ..models.tracking import (
    TrackingInfo, TrackingEvent, TrackingResponse, Location,
    PackageDetails, DeliveryDetails, PackageStatus, PackageType,
    KeyDates, CommercialInfo, ServiceType
)

logger = logging.getLogger(__name__)

class FedExService:
    def __init__(self, config_path: str | None = None):
        try:
            if config_path is None:
                try:
                    config_path = resources.files('backend.app.config').joinpath('fedex.yaml')
                except Exception:
                    config_path = Path(__file__).resolve().parents[1] / 'config' / 'fedex.yaml'

            logger.info(f"Loading FedEx configuration from {config_path}")
            with open(config_path, 'r') as file:
                config = yaml.safe_load(file)['prod']

            self.base_url = os.getenv("FEDEX_BASE_URL", "https://apis-sandbox.fedex.com")
            self.auth_url = os.path.expandvars(config['api_url'])
            self.cdict = {
                'client_id': os.path.expandvars(config['client_id']),
                'client_secret': os.path.expandvars(config['client_secret']),
                'account_number': os.path.expandvars(config['account_number'])
            }
            self.payload = {
                "grant_type": "client_credentials",
                'client_id': self.cdict['client_id'],
                'client_secret': self.cdict['client_secret']
            }
            self.headers = {'Content-Type': "application/x-www-form-urlencoded"}
            self._token: str | None = None
            self._token_expiry: datetime | None = None
        except Exception as e:
            logger.error(f"Error initializing FedEx service: {str(e)}")
            raise

    def _authenticate(self) -> None:
        """Fetch a new OAuth token from FedEx"""
        with httpx.Client() as client:
            response = client.post(self.auth_url, data=self.payload, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            self._token = data.get('access_token')
            expires_in = int(data.get('expires_in', 3600))
            self._token_expiry = datetime.utcnow() + timedelta(seconds=expires_in)

    def _get_auth_token(self) -> str:
        if not self._token or not self._token_expiry or datetime.utcnow() >= self._token_expiry:
            self._authenticate()
        return self._token

    async def get_proof_of_delivery(self, tracking_number: str) -> bytes:
        """Return the proof of delivery PDF for a tracking number."""
        file_path = Path(__file__).resolve().parents[1] / "static" / "proofs" / f"{tracking_number}.pdf"
        try:
            if file_path.exists():
                return file_path.read_bytes()

            access_token = self._get_auth_token()
            url = f"{self.base_url}/track/v1/shipments/{tracking_number}/proof-of-delivery"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/pdf",
            }

            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers)
                if response.status_code == 404:
                    raise FileNotFoundError(f"Proof of delivery for {tracking_number} not found")
                response.raise_for_status()
                pdf_bytes = response.content

            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_bytes(pdf_bytes)
            return pdf_bytes

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise FileNotFoundError(f"Proof of delivery for {tracking_number} not found") from e
            logger.error(f"FedEx API returned an error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error fetching proof of delivery: {str(e)}")
            raise

    def _map_fedex_status(self, fedex_status: str) -> PackageStatus:
        """Map FedEx status to our PackageStatus enum"""
        status_map = {
            "PENDING": PackageStatus.PENDING,
            "IN_TRANSIT": PackageStatus.IN_TRANSIT,
            "DELIVERED": PackageStatus.DELIVERED,
            "EXCEPTION": PackageStatus.EXCEPTION
        }
        return status_map.get(fedex_status.upper(), PackageStatus.UNKNOWN)

    def _map_fedex_service_type(self, service_type: str) -> PackageType:
        """Map FedEx service type to our PackageType enum"""
        service_map = {
            "GROUND": PackageType.GROUND,
            "EXPRESS": PackageType.EXPRESS,
            "FIRST_OVERNIGHT": PackageType.FIRST_OVERNIGHT,
            "PRIORITY_OVERNIGHT": PackageType.PRIORITY_OVERNIGHT,
            "STANDARD_OVERNIGHT": PackageType.STANDARD_OVERNIGHT,
            "INTERNATIONAL": PackageType.INTERNATIONAL
        }
        return service_map.get(service_type.upper(), PackageType.UNKNOWN)

    def _create_location(self, location_data: Dict[str, Any]) -> Location:
        """Create Location object from FedEx location data"""
        address = location_data.get('locationContactAndAddress', {}).get('address', {})
        return Location(
            city=address.get('city', ''),
            state=address.get('stateOrProvinceCode', ''),
            country=address.get('countryCode', ''),
            postal_code=address.get('postalCode'),
            coordinates={
                'latitude': location_data.get('coordinates', {}).get('latitude'),
                'longitude': location_data.get('coordinates', {}).get('longitude')
            } if location_data.get('coordinates') else None
        )

    def track_package(self, tracking_number: str) -> TrackingResponse:
        """
        Track a package using FedEx API
        """
        try:
            logger.info(f"Tracking package: {tracking_number}")
            access_token = self._get_auth_token()
            url = f"{self.base_url}/track/v1/trackingnumbers"
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            payload = {
                'trackingInfo': [{
                    'trackingNumberInfo': {
                        'trackingNumber': tracking_number
                    }
                }],
                'includeDetailedScans': True
            }
            with httpx.Client() as client:
                response = client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                tracking_data = response.json()
            
            if not tracking_data.get('output', {}).get('completeTrackResults', []):
                error_msg = "No tracking results found"
                logger.error(error_msg)
                return TrackingResponse(
                    success=False,
                    data=None,
                    error=error_msg,
                    metadata={
                        'timestamp': datetime.now().isoformat(),
                        'tracking_number': tracking_number
                    }
                )
                
            # Get the first tracking result
            track_result = tracking_data['output']['completeTrackResults'][0]['trackResults'][0]
            logger.info("Successfully received tracking data from FedEx")
            tracking_info = self._format_tracking_info(track_result)

            return TrackingResponse(
                success=True,
                data=tracking_info,
                error=None,
                metadata={
                    'response_time': response.elapsed.total_seconds(),
                    'timestamp': datetime.now().isoformat(),
                    'tracking_number': tracking_number,
                    'raw_response': tracking_data
                }
            )

        except httpx.RequestError as e:
            error_msg = f"HTTP request error while tracking package: {str(e)}"
            logger.error(error_msg)
            return TrackingResponse(
                success=False,
                data=None,
                error=error_msg,
                metadata={
                    'timestamp': datetime.now().isoformat(),
                    'tracking_number': tracking_number
                }
            )
        except httpx.HTTPStatusError as e:
            error_msg = f"FedEx API returned an error: {str(e)}"
            logger.error(error_msg)
            return TrackingResponse(
                success=False,
                data=None,
                error=error_msg,
                metadata={
                    'timestamp': datetime.now().isoformat(),
                    'tracking_number': tracking_number
                }
            )
        except Exception as e:
            error_msg = f"Error tracking package: {str(e)}"
            logger.error(error_msg)
            return TrackingResponse(
                success=False,
                data=None,
                error=error_msg,
                metadata={
                    'timestamp': datetime.now().isoformat(),
                    'tracking_number': tracking_number
                }
            )

    def _format_tracking_info(self, tracking_details: Dict[str, Any]) -> TrackingInfo:
        try:
            # Extract basic tracking information
            tracking_number = tracking_details.get('trackingNumberInfo', {}).get('trackingNumber', '')
            latest_status = tracking_details.get('latestStatusDetail', {})
            status = latest_status.get('code', 'UNKNOWN')
            service_detail = tracking_details.get('serviceDetail', {})
            service_type = self._get_service_type(service_detail.get('type', ''))

            # Extract origin and destination
            origin = self._extract_location(tracking_details.get('shipperInformation', {}).get('address', {}))
            destination = self._extract_location(tracking_details.get('recipientInformation', {}).get('address', {}))

            # Extract package details
            package_details = self._extract_package_details(tracking_details)

            # Extract delivery details
            delivery_details = self._extract_delivery_details(tracking_details)

            # Extract tracking events
            events = []
            for event in tracking_details.get('scanEvents', []):
                try:
                    event_location = self._extract_location(event.get('scanLocation', {}))
                    events.append(TrackingEvent(
                        status=event.get('eventType', ''),
                        description=event.get('eventDescription', ''),
                        timestamp=event.get('date', ''),
                        location=event_location,
                        event_type=event.get('eventType', ''),
                        event_code=event.get('exceptionCode', ''),
                        exception_code=event.get('exceptionCode', ''),
                        exception_description=event.get('exceptionDescription', '')
                    ))
                except Exception as e:
                    logger.error(f"Error formatting tracking event: {str(e)}")
                    continue

            # Extract key dates
            key_dates = self._extract_key_dates(tracking_details)

            # Extract commercial info
            commercial_info = self._extract_commercial_info(tracking_details)

            return TrackingInfo(
                tracking_number=tracking_number,
                status=status,
                carrier="FedEx",
                service_type=service_type,
                origin=origin,
                destination=destination,
                package_details=package_details,
                delivery_details=delivery_details,
                events=events,
                key_dates=key_dates,
                commercial_info=commercial_info,
                tracking_url=f"https://www.fedex.com/tracking?tracknumbers={tracking_number}"
            )
        except Exception as e:
            logger.error(f"Error formatting tracking info: {str(e)}")
            raise

    def _extract_location(self, location_data: Dict[str, Any]) -> Location:
        try:
            latitude = location_data.get('latitude')
            longitude = location_data.get('longitude')

            if (latitude is None or longitude is None) and location_data.get('coordinates'):
                coords = location_data.get('coordinates', {})
                latitude = coords.get('latitude')
                longitude = coords.get('longitude')

            coordinates = None
            if latitude is not None and longitude is not None:
                coordinates = {
                    'latitude': latitude,
                    'longitude': longitude
                }

            return Location(
                city=location_data.get('city', ''),
                state=location_data.get('stateOrProvinceCode', ''),
                country=location_data.get('countryCode', ''),
                postal_code=location_data.get('postalCode', ''),
                coordinates=coordinates
            )
        except Exception as e:
            logger.error(f"Error extracting location: {str(e)}")
            raise

    def _extract_package_details(self, tracking_details: Dict[str, Any]) -> PackageDetails:
        try:
            package_details = tracking_details.get('packageDetails', {})
            weight_and_dimensions = package_details.get('weightAndDimensions', {})
            
            # Extract weight
            weight = {}
            for w in weight_and_dimensions.get('weight', []):
                weight[w.get('unit', '')] = w.get('value', '')
            
            # Extract dimensions
            dimensions = {}
            for d in weight_and_dimensions.get('dimensions', []):
                dimensions[d.get('units', '')] = {
                    'length': d.get('length', 0),
                    'width': d.get('width', 0),
                    'height': d.get('height', 0)
                }

            return PackageDetails(
                weight=weight,
                dimensions=dimensions,
                service_type=tracking_details.get('serviceDetail', {}).get('type', ''),
                signature_required=False,  # Will be updated based on delivery details
                special_handling=[],
                declared_value=0.0,
                customs_value=0.0,
                package_count=int(package_details.get('count', 1)),
                packaging_description=package_details.get('packagingDescription', {}).get('description', '')
            )
        except Exception as e:
            logger.error(f"Error extracting package details: {str(e)}")
            raise

    def _extract_delivery_details(self, tracking_details: Dict[str, Any]) -> DeliveryDetails:
        try:
            delivery_details = tracking_details.get('deliveryDetails', {})
            delivery_option_eligibility = {}
            
            # Extract delivery option eligibility
            for option in delivery_details.get('deliveryOptionEligibilityDetails', []):
                delivery_option_eligibility[option.get('option', '')] = option.get('eligibility', '') == 'ELIGIBLE'

            # Get actual delivery date from dateAndTimes
            actual_delivery = None
            for date_info in tracking_details.get('dateAndTimes', []):
                if date_info.get('type') == 'ACTUAL_DELIVERY':
                    actual_delivery = date_info.get('dateTime', '')
                    break

            return DeliveryDetails(
                delivery_date=actual_delivery,
                delivery_time=actual_delivery,
                delivery_location=self._extract_location(delivery_details.get('actualDeliveryAddress', {})),
                delivery_instructions='',
                delivery_attempts=int(delivery_details.get('deliveryAttempts', 0)),
                delivery_exceptions=[],
                actual_delivery=actual_delivery,
                estimated_delivery=tracking_details.get('standardTransitTimeWindow', {}).get('window', {}).get('ends', ''),
                received_by_name=delivery_details.get('receivedByName', ''),
                delivery_option_eligibility=delivery_option_eligibility
            )
        except Exception as e:
            logger.error(f"Error extracting delivery details: {str(e)}")
            raise

    def _extract_key_dates(self, tracking_details: Dict[str, Any]) -> KeyDates:
        try:
            dates = tracking_details.get('dateAndTimes', [])
            key_dates = {}
            for date_info in dates:
                date_type = date_info.get('type', '')
                if date_type == 'ACTUAL_DELIVERY':
                    key_dates['actual_delivery'] = date_info.get('dateTime', '')
                elif date_type == 'ACTUAL_PICKUP':
                    key_dates['actual_pickup'] = date_info.get('dateTime', '')
                elif date_type == 'SHIP':
                    key_dates['ship'] = date_info.get('dateTime', '')
                elif date_type == 'ACTUAL_TENDER':
                    key_dates['actual_tender'] = date_info.get('dateTime', '')
                elif date_type == 'ANTICIPATED_TENDER':
                    key_dates['anticipated_tender'] = date_info.get('dateTime', '')
            return KeyDates(**key_dates)
        except Exception as e:
            logger.error(f"Error extracting key dates: {str(e)}")
            raise

    def _extract_commercial_info(self, tracking_details: Dict[str, Any]) -> CommercialInfo:
        try:
            tracking_info = tracking_details.get('trackingNumberInfo', {})
            additional_info = tracking_details.get('additionalTrackingInfo', {})
            
            package_identifiers = []
            for identifier in additional_info.get('packageIdentifiers', []):
                for value in identifier.get('values', []):
                    package_identifiers.append({
                        'type': identifier.get('type', ''),
                        'value': value
                    })

            return CommercialInfo(
                tracking_number_unique_id=tracking_info.get('trackingNumberUniqueId', ''),
                package_identifiers=package_identifiers,
                service_detail=tracking_details.get('serviceDetail', {}).get('description', ''),
                available_notifications=tracking_details.get('availableNotifications', [])
            )
        except Exception as e:
            logger.error(f"Error extracting commercial info: {str(e)}")
            raise

    def _get_service_type(self, service_code: str) -> ServiceType:
        service_mapping = {
            'GROUND': ServiceType.GROUND,
            'EXPRESS': ServiceType.EXPRESS,
            'FIRST_OVERNIGHT': ServiceType.FIRST_OVERNIGHT,
            'PRIORITY_OVERNIGHT': ServiceType.PRIORITY_OVERNIGHT,
            'STANDARD_OVERNIGHT': ServiceType.STANDARD_OVERNIGHT,
            'INTERNATIONAL': ServiceType.INTERNATIONAL,
            'HOME_DELIVERY': ServiceType.HOME_DELIVERY,
            'GROUND_ECONOMY': ServiceType.GROUND_ECONOMY,
            'CUSTOM_CRITICAL': ServiceType.CUSTOM_CRITICAL,
            'FREIGHT': ServiceType.FREIGHT,
            'SMART_POST': ServiceType.SMART_POST
        }
        return service_mapping.get(service_code, ServiceType.UNKNOWN) 
