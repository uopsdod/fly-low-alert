"""flight-save-subscription — POST /subscribe.

Takes {email, plan_name, target_price}, maps plan_name -> (origin, destination),
builds route = origin-destination, PutItem into DynamoDB `subscriptions`.
M1: NO subscription_status (that field is introduced in M2). Supabase is auth-only.
"""
import json
import time

import boto3

from common.ddb import to_decimal, json_dumps

# The two fixed plans the handler knows about. Reject anything else.
PLANS = {
    "tokyo": {"origin": "TPE", "destination": "TYO"},
    "seoul": {"origin": "TPE", "destination": "SEL"},
}

TABLE = boto3.resource("dynamodb").Table("subscriptions")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Content-Type": "application/json",
}


def _resp(status, body):
    return {"statusCode": status, "headers": CORS, "body": json_dumps(body)}


def handler(event, context):
    # CORS preflight
    method = (event.get("requestContext", {}).get("http", {}) or {}).get("method")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

    # Body may be a string (API Gateway proxy) or already a dict (direct invoke/test).
    raw = event.get("body", event)
    if isinstance(raw, str):
        try:
            data = json.loads(raw)
        except (ValueError, TypeError):
            return _resp(400, {"error": "invalid JSON body"})
    else:
        data = raw or {}

    email = (data.get("email") or "").strip().lower()
    plan_name = (data.get("plan_name") or "").strip().lower()
    target_price = data.get("target_price")

    if not email or "@" not in email:
        return _resp(400, {"error": "valid email is required"})
    if plan_name not in PLANS:
        return _resp(400, {"error": "plan_name must be one of: %s" % ", ".join(PLANS)})
    try:
        tp = float(target_price)
    except (TypeError, ValueError):
        return _resp(400, {"error": "target_price must be a number (TWD)"})
    if tp <= 0:
        return _resp(400, {"error": "target_price must be positive"})

    plan = PLANS[plan_name]
    route = "%s-%s" % (plan["origin"], plan["destination"])
    now = int(time.time())

    item = {
        "email": email,
        "route": route,
        "plan_name": plan_name,
        "origin": plan["origin"],
        "destination": plan["destination"],
        "target_price": to_decimal(tp),  # Decimal, not float — Rule 3
        "currency": "TWD",
        "created_at": now,
        "updated_at": now,
    }
    TABLE.put_item(Item=item)  # overwrites by (email, route) — idempotent in M1

    return _resp(200, {"ok": True, "subscription": item})
