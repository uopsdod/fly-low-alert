import boto3, json, time
from decimal import Decimal
PLANS={"tokyo":{"origin":"TPE","destination":"TYO"},"seoul":{"origin":"TPE","destination":"SEL"}}
T=boto3.resource("dynamodb").Table("subscriptions")
H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"content-type","Content-Type":"application/json"}
def enc(o):
    if isinstance(o,Decimal):return int(o) if o==o.to_integral_value() else float(o)
    raise TypeError
def r(s,b):return {"statusCode":s,"headers":H,"body":json.dumps(b,default=enc)}
def handler(event,context):
    m=(event.get("requestContext",{}).get("http",{}) or {}).get("method")
    if m=="OPTIONS":return r(200,{"ok":True})
    raw=event.get("body",event)
    if isinstance(raw,str):
        try:d=json.loads(raw)
        except Exception:return r(400,{"error":"invalid JSON body"})
    else:d=raw or {}
    email=(d.get("email") or "").strip().lower()
    pn=(d.get("plan_name") or "").strip().lower()
    tp=d.get("target_price")
    if not email or "@" not in email:return r(400,{"error":"valid email is required"})
    if pn not in PLANS:return r(400,{"error":"plan_name must be tokyo or seoul"})
    try:tp=float(tp)
    except Exception:return r(400,{"error":"target_price must be a number (TWD)"})
    if tp<=0:return r(400,{"error":"target_price must be positive"})
    p=PLANS[pn];route="%s-%s"%(p["origin"],p["destination"]);now=int(time.time())
    item={"email":email,"route":route,"plan_name":pn,"origin":p["origin"],"destination":p["destination"],"target_price":Decimal(str(tp)),"currency":"TWD","created_at":now,"updated_at":now}
    T.put_item(Item=item)
    return r(200,{"ok":True,"subscription":item})
