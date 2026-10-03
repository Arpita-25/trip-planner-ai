"""Provider registry. PROVIDER_MODE=mock|real selects adapters; mock is the default."""

import logging
import os

from providers.base import ExploreProvider, FlightProvider, StayProvider
from providers.mock import MockExploreProvider, MockStayProvider, MockFlightProvider

logger = logging.getLogger(__name__)


def provider_mode() -> str:
    return os.environ.get("PROVIDER_MODE", "mock").strip().lower()


def flight_provider() -> FlightProvider:
    if provider_mode() == "real":
        # Real adapters register here once credentials/partner approval exist. Until then
        # we fall back to the labelled mock rather than pretend an API is wired.
        logger.warning("PROVIDER_MODE=real but no real flight adapter is configured; using mock")
    return MockFlightProvider()


def stay_provider() -> StayProvider:
    if provider_mode() == "real":
        logger.warning("PROVIDER_MODE=real but no real stay adapter is configured; using mock")
    return MockStayProvider()


def explore_provider() -> ExploreProvider:
    if provider_mode() == "real":
        logger.warning("PROVIDER_MODE=real but no real explore adapter is configured; using mock")
    return MockExploreProvider()
