"""Shared DynamoDB helpers — one correct place for Decimal conversion (aws-best-practice Rule 3)."""
import json
from decimal import Decimal


def to_decimal(value):
    """float/int/str -> Decimal via str (avoids binary-float artifacts)."""
    return Decimal(str(value))


class DecimalEncoder(json.JSONEncoder):
    """Decimal -> int when whole, else float. Use as json.dumps(..., cls=DecimalEncoder)."""
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o == o.to_integral_value() else float(o)
        return super().default(o)


def json_dumps(obj):
    return json.dumps(obj, cls=DecimalEncoder)
