import boto3, json
from decimal import Decimal
from boto3.dynamodb.conditions import Key
T=boto3.resource("dynamodb").Table("subscriptions")
H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"content-type","Content-Type":"application/json"}
def enc(o):
    if isinstance(o,Decimal):return int(o) if o==o.to_integral_value() else float(o)
    raise TypeError
def r(s,b):return {"statusCode":s,"headers":H,"body":json.dumps(b,default=enc)}
def handler(event,context):
    m=(event.get("requestContext",{}).get("http",{}) or {}).get("method")
    if m=="OPTIONS":return r(200,{"ok":True})
    q=event.get("queryStringParameters") or {}
    email=(q.get("email") or "").strip().lower()
    if not email or "@" not in email:return r(400,{"error":"valid email is required"})
    res=T.query(KeyConditionExpression=Key("email").eq(email))
    return r(200,{"ok":True,"subscriptions":res.get("Items",[])})
