"""Provider interfaces. Adding a real provider = one new adapter class, no core changes."""

from abc import ABC, abstractmethod

from models.search import ExploreSearchRequest, FlightSearchRequest, StaySearchRequest
from models.trip import ExploreOption, FlightOption, StayOption


class ProviderError(RuntimeError):
    """Raised by an adapter when the upstream provider fails or times out."""


class FlightProvider(ABC):
    name: str
    mode: str

    @abstractmethod
    async def search(self, request: FlightSearchRequest) -> list[FlightOption]: ...


class StayProvider(ABC):
    name: str
    mode: str

    @abstractmethod
    async def search(self, request: StaySearchRequest) -> list[StayOption]: ...


class ExploreProvider(ABC):
    """Covers restaurants, nightlife, activities and places behind one canonical model."""
    name: str
    mode: str

    @abstractmethod
    async def search(self, request: ExploreSearchRequest) -> list[ExploreOption]: ...
