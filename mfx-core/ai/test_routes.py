"""
Local test for ai/routes.py — no Postman, no real JWT needed.
Run: python -m ai._test_routes
"""
import json
from fastapi import FastAPI
from fastapi.testclient import TestClient

from ai.routes import router as ai_router
from ai.service import get_categories
from auth.dependencies import get_current_user


# ---- build a minimal app with just the ai router ----
app = FastAPI()
app.include_router(ai_router)


# ---- override auth with a fake buyer ----
def fake_buyer():
    return {"id": "cdedd5f6-2726-44a8-9337-66da346dd628", "role": "buyer"}

def fake_shop():
    return {"id": "00000000-0000-0000-0000-000000000001", "role": "shop"}


client = TestClient(app)


def run():
    # ---- 1. POST /parse-request (happy path) ----
    app.dependency_overrides[get_current_user] = fake_buyer
    r = client.post(
        "/ai/parse-request",
        json={"text": "need a used mountain bike under 8000, urgent, in 560001"},
    )
    print(f"\n[1] POST parse-request → {r.status_code}")
    print(json.dumps(r.json(), indent=2))

    log_id = r.json().get("log_id")
    print(f"\n    captured log_id = {log_id}")

    # ---- 2. POST with empty text ----
    r = client.post("/ai/parse-request", json={"text": ""})
    print(f"\n[2] POST empty text → {r.status_code}")
    print(json.dumps(r.json(), indent=2))

    # ---- 3. POST as shop (should 403) ----
    app.dependency_overrides[get_current_user] = fake_shop
    r = client.post(
        "/ai/parse-request",
        json={"text": "need a bike"},
    )
    print(f"\n[3] POST as shop → {r.status_code}")
    print(json.dumps(r.json(), indent=2))

    # ---- 4. PATCH accepted ----
    app.dependency_overrides[get_current_user] = fake_buyer
    r = client.patch(
        f"/ai/parse-request/{log_id}",
        json={"buyer_action": "accepted"},
    )
    print(f"\n[4] PATCH accepted → {r.status_code}")
    print(json.dumps(r.json(), indent=2))

    # ---- 5. PATCH edited ----
    r = client.patch(
        f"/ai/parse-request/{log_id}",
        json={
            "buyer_action": "edited",
            "edited_fields": {"budget_max": 9000},
        },
    )
    print(f"\n[5] PATCH edited → {r.status_code}")
    print(json.dumps(r.json(), indent=2))

    # ---- 6. PATCH non-existent log ----
    r = client.patch(
        "/ai/parse-request/00000000-0000-0000-0000-000000000000",
        json={"buyer_action": "accepted"},
    )
    print(f"\n[6] PATCH missing log → {r.status_code}")
    print(json.dumps(r.json(), indent=2))

    # ---- 7. PATCH invalid action ----
    r = client.patch(
        f"/ai/parse-request/{log_id}",
        json={"buyer_action": "maybe"},
    )
    print(f"\n[7] PATCH invalid action → {r.status_code}")
    print(json.dumps(r.json(), indent=2))


if __name__ == "__main__":
    run()