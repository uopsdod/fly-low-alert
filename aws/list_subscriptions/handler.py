"""flight-list-subscriptions — GET /subscriptions?email=...

Query DynamoDB `subscriptions` by email (PK) and return the user's rows so the
UI can show which plans are already subscribed. Read-only; M1 has no auth guard.
"""
import json
import boto3
from boto3.dynamodb.conditions import Key
from common.ddb import json_dumps

TABLE = boto3.resource("dynamodb").Table("subscriptions")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Content-Type": "application/json",
}


def _resp(status, body):
    return {"statusCode": status, "headers": CORS, "body": json_dumps(body)}


def handler(event, context):
    method = (event.get("requestContext", {}).get("http", {}) or {}).get("method")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})
    q = event.get("queryStringParameters") or {}
    email = (q.get("email") or "").strip().lower()
    if not email or "@" not in email:
        return _resp(400, {"error": "valid email is required"})
    res = TABLE.query(KeyConditionExpression=Key("email").eq(email))
    return _resp(200, {"ok": True, "subscriptions": res.get("Items", [])})
