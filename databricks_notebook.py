# Databricks notebook source
from concurrent.futures import ThreadPoolExecutor
from datetime import date
import json
import os
import shutil
import urllib.request
from pyspark.sql import functions as F

API_BASE_URL = "https://103-41-205-131.sslip.io"
COMPANY_ID = 1202
PER_PAGE = 25

CATALOG = "workspace"
SCHEMA = "default"
VOLUME = "talenta_poc"
BASE_PATH = f"/Volumes/{CATALOG}/{SCHEMA}/{VOLUME}/mock_talenta"

REF_DATE = date(2026, 10, 28)
MONTH_START = date(2026, 10, 1)
FIELD_DIVISIONS = ["Product", "Sales", "Technical"]
RADIUS_KM = 0.15


def table_name(name):
    return f"{CATALOG}.{SCHEMA}.{name}"


try:
    spark.sql(f"CREATE VOLUME IF NOT EXISTS {CATALOG}.{SCHEMA}.{VOLUME}")
except Exception as e:
    print(e)

# COMMAND ----------


def fetch_json(endpoint):
    url = f"{API_BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "Databricks-PySpark-POC/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def write_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f)


shutil.rmtree(BASE_PATH, ignore_errors=True)

org_resp = fetch_json(f"/v2/talenta/v2/company/{COMPANY_ID}/organization")
write_json(f"{BASE_PATH}/organizations/organizations.json", org_resp)

emp_status_resp = fetch_json("/v2/talenta/v2/company/me/employment-status")
write_json(f"{BASE_PATH}/employment_status/employment_statuses.json", emp_status_resp)

policies_resp = fetch_json(f"/v2/talenta-ppe/v3/time-off/policies/companies/{COMPANY_ID}")
write_json(f"{BASE_PATH}/time_off_policies/policies.json", policies_resp)

employees = []
page_num = 1
while True:
    emp_page_resp = fetch_json(f"/v2/talenta/v3/employees?page={page_num}&limit={PER_PAGE}")
    write_json(f"{BASE_PATH}/employees/employees_page_{page_num}.json", emp_page_resp)

    page_items = emp_page_resp.get("data", {}).get("employees", [])
    employees.extend(page_items)

    last_page = emp_page_resp.get("data", {}).get("pagination", {}).get("last_page", 1)
    if page_num >= last_page:
        break
    page_num += 1


def fetch_employee_attendance(emp_record):
    u = emp_record["user_id"]
    hist_resp = fetch_json(
        f"/v2/talenta/v2/attendance/{u}/history-list?year={REF_DATE.year}&month={REF_DATE.month}"
    )
    write_json(f"{BASE_PATH}/attendance_history/{u}_{REF_DATE.strftime('%Y-%m')}.json", hist_resp)

    if emp_record.get("organization_name") in FIELD_DIVISIONS:
        live_resp = fetch_json(
            f"/v2/talenta/v3/live-attendance?user_id={u}&start_date={MONTH_START.isoformat()}&end_date={REF_DATE.isoformat()}"
        )
        write_json(
            f"{BASE_PATH}/live_attendance/{u}_{MONTH_START.isoformat()}_{REF_DATE.isoformat()}.json",
            live_resp,
        )


with ThreadPoolExecutor(max_workers=10) as executor:
    list(executor.map(fetch_employee_attendance, employees))

print(f"Berhasil mengambil data {len(employees)} karyawan dari {API_BASE_URL}")

# COMMAND ----------


def read_json(subdir):
    return spark.read.option("multiLine", True).json(f"{BASE_PATH}/{subdir}/*.json")


def save_table(df, name):
    df.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(table_name(name))


uid_from_file = F.regexp_extract(F.col("_metadata.file_name"), r"^(\d+)_", 1).cast("long")

save_table(
    read_json("employees").select(F.explode("data.employees").alias("e")).select("e.*"),
    "bronze_employees",
)

save_table(
    read_json("organizations").select(F.explode("data.organizations").alias("o")).select("o.*"),
    "bronze_organizations",
)

save_table(
    read_json("employment_status")
    .select(F.explode("data.employment_statuses").alias("s"))
    .select("s.*"),
    "bronze_employment_status",
)

save_table(
    read_json("time_off_policies")
    .select(F.explode("data.policies").alias("p"))
    .select("p.*"),
    "bronze_time_off_policies",
)

save_table(
    read_json("attendance_history")
    .select(uid_from_file.alias("user_id"), F.explode("data.attendance_history").alias("a"))
    .select("user_id", "a.*"),
    "bronze_attendance_history",
)

save_table(
    read_json("live_attendance")
    .select(uid_from_file.alias("user_id"), F.explode("data.attendances").alias("a"))
    .select("user_id", "a.*")
    .drop("timeoff"),
    "bronze_live_attendance",
)

# COMMAND ----------


def clean_date(col_name):
    col = F.col(col_name)
    return F.when(col.rlike(r"^\d{4}-\d{2}-\d{2}$") & (col != "0000-00-00"), F.to_date(col))


def blank_null(col_name):
    return F.when(F.trim(F.col(col_name)) != "", F.col(col_name))


save_table(
    spark.table(table_name("bronze_employees")).select(
        "user_id",
        "employee_id",
        F.trim(F.concat_ws(" ", "first_name", "last_name")).alias("employee_name"),
        "organization_id",
        "organization_name",
        "branch",
        "employment_status",
        clean_date("join_date").alias("join_date"),
        clean_date("end_date").alias("end_date"),
        clean_date("resign_date").alias("resign_date"),
    ),
    "silver_employees",
)

save_table(
    spark.table(table_name("bronze_employment_status")).select(
        F.col("name").alias("employment_status"),
        "is_end_date",
    ),
    "silver_employment_status",
)

save_table(
    spark.table(table_name("bronze_time_off_policies")).select("policy_code", "policy_name"),
    "silver_time_off_policies",
)

save_table(
    spark.table(table_name("bronze_attendance_history")).select(
        "user_id",
        clean_date("date").alias("date"),
        "shift",
        "schedule_in",
        "schedule_out",
        blank_null("checkin").alias("checkin"),
        blank_null("checkout").alias("checkout"),
        blank_null("attendance_code").alias("attendance_code"),
        blank_null("timeoff_code").alias("timeoff_code"),
        blank_null("timeoff_name").alias("timeoff_name"),
    ),
    "silver_attendance",
)

coord = F.col("live_attendance.check_in.coordinate")
valid_coord = coord.rlike(r"^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$")

save_table(
    spark.table(table_name("bronze_live_attendance")).select(
        "user_id",
        clean_date("date").alias("visit_date"),
        F.col("live_attendance.check_in.time").alias("check_in_time"),
        F.col("live_attendance.check_in.location").alias("location_name"),
        F.when(valid_coord, F.trim(F.split(coord, ",").getItem(0)).cast("double")).alias("lat"),
        F.when(valid_coord, F.trim(F.split(coord, ",").getItem(1)).cast("double")).alias("lng"),
    ),
    "silver_live_attendance",
)

# COMMAND ----------

emp = spark.table(table_name("silver_employees"))
policy = spark.table(table_name("silver_time_off_policies"))

att = (
    spark.table(table_name("silver_attendance"))
    .alias("a")
    .join(emp.alias("e"), "user_id")
    .where(
        (F.col("e.join_date") <= F.col("a.date"))
        & (F.col("e.resign_date").isNull() | (F.col("e.resign_date") >= F.col("a.date")))
    )
    .join(policy.alias("p"), F.col("a.timeoff_code") == F.col("p.policy_code"), "left")
)

resolved_policy_name = F.coalesce(F.col("p.policy_name"), F.col("a.timeoff_name"))
leave_type = (
    F.when(F.lower(resolved_policy_name).contains("sakit"), "Sakit")
    .when(F.lower(resolved_policy_name).contains("cuti"), "Cuti")
    .when(F.lower(resolved_policy_name).contains("izin"), "Izin")
    .otherwise("Cuti/Izin Lainnya")
)

is_workday = (F.col("a.schedule_in") != "00:00") & (
    ~F.lower(F.col("a.shift")).isin("dayoff", "national holiday")
)

status = (
    F.when((F.col("a.attendance_code") == "H") | F.col("a.checkin").isNotNull(), "Hadir")
    .when(~is_workday, "Libur")
    .when(
        F.col("a.timeoff_code").isNotNull(),
        F.when(resolved_policy_name.isNull(), "Kode cuti tidak dikenal").otherwise(leave_type),
    )
    .otherwise("Tidak Absen")
)

save_table(
    att.select(
        "user_id",
        "e.employee_id",
        "e.employee_name",
        F.col("e.organization_name").alias("division"),
        F.col("a.date").alias("date"),
        status.alias("status"),
    ),
    "gold_attendance_daily",
)

month_start = F.trunc(F.lit(REF_DATE), "month")
month_end = F.last_day(F.lit(REF_DATE))
st = spark.table(table_name("silver_employment_status"))

save_table(
    emp.join(st, "employment_status")
    .where(
        F.col("is_end_date")
        & F.col("end_date").between(month_start, month_end)
        & (F.col("resign_date").isNull() | (F.col("resign_date") >= F.lit(REF_DATE)))
    )
    .select(
        "user_id",
        "employee_id",
        "employee_name",
        F.col("organization_name").alias("division"),
        "employment_status",
        "end_date",
        F.datediff("end_date", F.lit(REF_DATE)).alias("days_left"),
    )
    .orderBy("end_date"),
    "gold_contract_ending",
)


def haversine_km(lat1, lng1, lat2, lng2):
    dlat, dlng = F.radians(lat2 - lat1), F.radians(lng2 - lng1)
    h = (
        F.sin(dlat / 2) ** 2
        + F.cos(F.radians(lat1)) * F.cos(F.radians(lat2)) * F.sin(dlng / 2) ** 2
    )
    return 2 * 6371.0 * F.asin(F.sqrt(h))


visits = (
    spark.table(table_name("silver_live_attendance"))
    .where(F.col("lat").isNotNull())
    .join(
        emp.select("user_id", "employee_name", F.col("organization_name").alias("division")),
        "user_id",
    )
    .where(F.col("division").isin(FIELD_DIVISIONS))
)

a = visits.select(*[F.col(c).alias(f"a_{c}") for c in visits.columns])
b = visits.select(*[F.col(c).alias(f"b_{c}") for c in visits.columns])

pairs = a.join(
    b,
    (F.col("a_visit_date") == F.col("b_visit_date"))
    & (haversine_km(F.col("a_lat"), F.col("a_lng"), F.col("b_lat"), F.col("b_lng")) <= RADIUS_KM),
)

per_anchor = pairs.groupBy("a_visit_date", "a_user_id").agg(
    F.min("b_user_id").alias("cluster_key"),
    F.array_sort(F.collect_set("b_division")).alias("divisions"),
    F.array_sort(F.collect_set("b_employee_name")).alias("members"),
    F.first("a_lat").alias("lat"),
    F.first("a_lng").alias("lng"),
    F.first("a_location_name").alias("location_name"),
)

save_table(
    per_anchor.groupBy(F.col("a_visit_date").alias("visit_date"), "cluster_key")
    .agg(
        F.first("divisions").alias("divisions"),
        F.first("members").alias("members"),
        F.first("lat").alias("lat"),
        F.first("lng").alias("lng"),
        F.first("location_name").alias("location_name"),
    )
    .withColumn("n_divisions", F.size("divisions"))
    .withColumn("all_three_divisions", F.col("n_divisions") == len(FIELD_DIVISIONS))
    .where(F.col("n_divisions") >= 2)
    .withColumn("divisions", F.concat_ws(", ", "divisions"))
    .withColumn("members", F.concat_ws(", ", "members"))
    .drop("cluster_key")
    .orderBy("visit_date"),
    "gold_visit_same_location",
)

# COMMAND ----------

D = REF_DATE.isoformat()
QUERIES = {
    "visit_same_location": f"""
        SELECT visit_date, location_name, divisions, members, n_divisions, all_three_divisions, lat, lng
        FROM {table_name('gold_visit_same_location')}
        ORDER BY all_three_divisions DESC, visit_date DESC
    """,
    "summary_today": f"""
        SELECT status, COUNT(*) AS jumlah
        FROM {table_name('gold_attendance_daily')}
        WHERE date = DATE'{D}'
        GROUP BY status
        ORDER BY jumlah DESC
    """,
    "absent_sick_leave_today": f"""
        SELECT employee_name, division, status
        FROM {table_name('gold_attendance_daily')}
        WHERE date = DATE'{D}' AND status NOT IN ('Hadir', 'Libur')
        ORDER BY status, division
    """,
    "monthly_recap_by_division": f"""
        SELECT division, status, COUNT(*) AS hari_orang
        FROM {table_name('gold_attendance_daily')}
        WHERE date BETWEEN trunc(DATE'{D}', 'MM') AND DATE'{D}' AND status NOT IN ('Hadir', 'Libur')
        GROUP BY division, status
        ORDER BY division, status
    """,
    "contract_ending": f"""
        SELECT employee_name, division, employment_status, end_date, days_left
        FROM {table_name('gold_contract_ending')}
        ORDER BY end_date
    """,
}

for title, q in QUERIES.items():
    display(spark.sql(q))
