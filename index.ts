import { Hono } from "hono";
import { cors } from "hono/cors";
import { apiReference } from "@scalar/hono-api-reference";

const app = new Hono();
app.use("*", cors());

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return function () {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createSeededRandom(42);

function randomInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

const COMPANY_ID = 1202;
const BRANCH_ID = 2078;
const ATTENDANCE_BRANCH_ID = 2513;

const ORGANIZATIONS = [
  { id: 19601, name: "Product", parent_organization_id: 0, branch_id: BRANCH_ID, code: "" },
  { id: 19602, name: "Sales", parent_organization_id: 0, branch_id: BRANCH_ID, code: "" },
  { id: 19603, name: "Technical", parent_organization_id: 0, branch_id: BRANCH_ID, code: "" },
  { id: 19604, name: "Finance", parent_organization_id: 0, branch_id: BRANCH_ID, code: "" },
  { id: 19605, name: "HRD & GA", parent_organization_id: 0, branch_id: BRANCH_ID, code: "" },
];

const EMPLOYMENT_STATUSES = [
  { id: 994, name: "PKWT I", is_end_date: true },
  { id: 995, name: "PKWT II", is_end_date: true },
  { id: 996, name: "Permanent", is_end_date: false },
  { id: 997, name: "PKWTT", is_end_date: false },
];

const TIMEOFF_POLICIES = [
  {
    id: 50121,
    company_id: COMPANY_ID,
    policy_name: "Sakit dengan Surat Dokter",
    policy_code: "SKT",
    hourly_conversion: "0",
    policy_flag: 0,
    use_block_leave: 0,
    effective_date: "2025-01-01",
    policy_expired_date: null,
    policy_description: "Sakit",
    balance_type: "Fixed Balance",
    emerge_type: "Unlimited",
    minute_request_increment: null,
    hour_request_increment: null,
    country_code: null,
  },
  {
    id: 50122,
    company_id: COMPANY_ID,
    policy_name: "Cuti Tahunan",
    policy_code: "CT",
    hourly_conversion: "0",
    policy_flag: 0,
    use_block_leave: 0,
    effective_date: "2025-01-01",
    policy_expired_date: null,
    policy_description: "Cuti Tahunan",
    balance_type: "Fixed Balance",
    emerge_type: "Annually",
    minute_request_increment: null,
    hour_request_increment: null,
    country_code: null,
  },
  {
    id: 50123,
    company_id: COMPANY_ID,
    policy_name: "Izin Khusus",
    policy_code: "IZN",
    hourly_conversion: "0",
    policy_flag: 0,
    use_block_leave: 0,
    effective_date: "2025-01-01",
    policy_expired_date: null,
    policy_description: "Izin",
    balance_type: "Fixed Balance",
    emerge_type: "Unlimited",
    minute_request_increment: null,
    hour_request_increment: null,
    country_code: null,
  },
];

const FIRST_NAMES = [
  "Budi", "Andi", "Siti", "Dewi", "Rizky", "Fajar", "Nadia", "Putri", "Dimas", "Arif",
  "Rina", "Hendra", "Lestari", "Bayu", "Ayu", "Reza", "Maya", "Taufik", "Indah", "Wahyu",
  "Dian", "Galih", "Ratna", "Bagus", "Kartika", "Ilham", "Sari", "Yoga", "Novi", "Agus",
  "Fitri", "Adi", "Wulan", "Eko", "Mega", "Rama", "Yuni", "irfan", "Intan", "Lukman",
  "Tari", "Deni", "Amel", "Chandra", "Vina", "Farhan", "Nisa", "Gilang", "Citra", "danu",
  "Silvia", "Hadi", "Melati", "Rangga", "Tiara", "Zaki", "Laras", "Bambang", "Anggi", "Surya"
];

const LAST_NAMES = [
  "Santoso", "Wijaya", "Pratama", "Saputra", "Hidayat", "Kusuma", "Nugroho", "Lestari", "Setiawan", "Purnomo",
  "Permata", "Gunawan", "Utami", "Wibowo", "Susanto", "Siregar", "Hakim", "Nasution", "Putra", "Ramadhan",
  "Hardiansyah", "Firmansyah", "Maulana", "Kurniawan", "Hermawan", "Yulianto", "Sulistyo", "wardhana", "Pangestu", "Syahputra",
  "Rahmawati", "Oktaviani", "Maharani", "Anggraini", "Handayani", "Budiman", "Mulyadi", "Irawan", "Prabowo", "Suryadi",
  "Adriansyah", "Setiawati", "Nuraini", "Hartono", "Subagyo", "Prakoso", "Zulkarnain", "Firdaus", "winata", "Halim",
  "Simanjuntak", "Hutapea", "Sinaga", "Baskoro", "Pamungkas", "Wicaksono", "Sudrajat", "Kurnia", "Cahyono", "utama"
];

const DIVISION_QUOTAS = [
  { orgId: 19601, orgName: "Product", count: 10, jobPositionBase: 55001 },
  { orgId: 19602, orgName: "Sales", count: 14, jobPositionBase: 55002 },
  { orgId: 19603, orgName: "Technical", count: 14, jobPositionBase: 55003 },
  { orgId: 19604, orgName: "Finance", count: 12, jobPositionBase: 55004 },
  { orgId: 19605, orgName: "HRD & GA", count: 10, jobPositionBase: 55005 },
];

export interface EmployeeRecord {
  user_id: number;
  sso_id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  branch_id: number;
  branch: string;
  organization_id: number;
  organization_name: string;
  company_id: number;
  job_position_id: number;
  employment_status: string;
  join_date: string;
  end_date: string;
  resign_date: string;
  grade: string;
  class: string;
  barcode: string;
  email: string;
  birth_place: string;
  birth_date: string;
  address: string;
  mobile_phone: string;
  religion: string;
  postal_code: string;
  identity_type: string;
  identity_number: string;
  gender: string;
  avatar: string;
  phone: string;
  blood_type: string;
  nationality_code: string;
  submit_resign_date: string;
  marital_status: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceHistoryItem {
  id: number;
  type: string;
  time: string;
  clock_datetime: string;
  has_location: boolean;
  show_detail: boolean;
  date: string;
  shift: string;
  schedule_in: string;
  schedule_out: string;
  checkin: string;
  checkout: string;
  overtime: string;
  attendance_code: string;
  timeoff_code: string;
  timeoff_name: string;
  overnight: boolean;
  branch: number;
  barcode: string;
  source: string;
}

export interface LiveAttendanceItem {
  date: string;
  shift: string;
  schedule_in: string;
  schedule_out: string;
  final_check_in: string;
  final_check_out: string;
  live_attendance: {
    check_in: {
      time: string;
      photo: string;
      location: string;
      coordinate: string;
      body_temperature: number;
      wearing_mask: string;
      description: string;
      source: string;
    };
    check_out: {
      time: string;
      photo: string;
      location: string;
      coordinate: string;
      body_temperature: number;
      wearing_mask: string;
      description: string;
      source: string;
    };
  };
  attendance_code: string;
  overtime: string;
  timeoff_code: string;
  timeoff: null | {
    policy_code: string;
    policy_name: string;
  };
  breaks: {
    schedule_break_in: string;
    schedule_break_out: string;
    break_start: string;
    break_end: string;
  };
}

const PKWT_OCT_END_DATES: Record<number, string> = {
  3000001: "2026-10-28",
  3000004: "2026-10-15",
  3000016: "2026-10-29",
  3000029: "2026-10-30",
  3000039: "2026-10-31",
  3000051: "2026-10-31",
};

const DECOY_PKWTT_USER_ID = 3000005;

const RESIGNED_EMPLOYEES: Record<number, { resign_date: string; submit_resign_date: string }> = {
  3000048: { resign_date: "2026-09-10", submit_resign_date: "2026-08-10" },
  3000049: { resign_date: "2026-09-20", submit_resign_date: "2026-08-20" },
  3000050: { resign_date: "2026-09-28", submit_resign_date: "2026-08-28" },
  3000060: { resign_date: "2026-10-14", submit_resign_date: "2026-09-14" },
};

const OCT_28_SICK_USERS = new Set([3000006, 3000017, 3000030]);
const OCT_28_LEAVE_USERS = new Set([3000007, 3000018, 3000031]);
const OCT_28_ABSENT_USERS = new Set([3000008, 3000019, 3000032, 3000040]);

const VISIT_OVERRIDES: Record<string, { location: string; coordinate: string }> = {
  "3000001_2026-10-26": { location: "Customer A", coordinate: "-6.225012,106.809034" },
  "3000011_2026-10-26": { location: "Customer A", coordinate: "-6.225110,106.809120" },
  "3000025_2026-10-26": { location: "Customer A", coordinate: "-6.224920,106.808940" },

  "3000012_2026-10-27": { location: "Customer B", coordinate: "-6.175380,106.827150" },
  "3000026_2026-10-27": { location: "Customer B", coordinate: "-6.175490,106.827260" },

  "3000013_2026-10-22": { location: "Customer C", coordinate: "-6.261480,106.780970" },
  "3000014_2026-10-22": { location: "Customer C", coordinate: "-6.261560,106.781080" },

  "3000002_2026-10-20": { location: "Customer D", coordinate: "-6.190010,106.900010" },
  "3000027_2026-10-21": { location: "Customer D", coordinate: "-6.190025,106.900030" },

  "3000003_2026-10-23": { location: "Cluster North", coordinate: "-6.200000,106.800000" },
  "3000015_2026-10-23": { location: "Cluster Central", coordinate: "-6.218000,106.800000" },
  "3000028_2026-10-23": { location: "Cluster South", coordinate: "-6.236000,106.800000" },
};

const employees: EmployeeRecord[] = [];
let empCounter = 0;

for (const div of DIVISION_QUOTAS) {
  for (let i = 0; i < div.count; i++) {
    empCounter++;
    const userId = 3000000 + empCounter;
    const empIdStr = `EMP-${String(empCounter).padStart(4, "0")}`;
    const firstName =
      empCounter === 1
        ? "Budi"
        : FIRST_NAMES[(empCounter - 1) % FIRST_NAMES.length].replace(/^./, (c) => c.toUpperCase());
    const lastName =
      empCounter === 1
        ? "Santoso"
        : LAST_NAMES[(empCounter - 1) % LAST_NAMES.length].replace(/^./, (c) => c.toUpperCase());

    let employmentStatus = "Permanent";
    let endDate = "";
    const joinYear = 2022 + (empCounter % 3);
    const joinMonth = pad2(((empCounter * 3) % 12) + 1);
    const joinDay = pad2(((empCounter * 5) % 25) + 1);
    const joinDate = empCounter === 1 ? "2023-07-12" : `${joinYear}-${joinMonth}-${joinDay}`;

    if (PKWT_OCT_END_DATES[userId]) {
      employmentStatus = "PKWT I";
      endDate = PKWT_OCT_END_DATES[userId];
    } else if (userId === DECOY_PKWTT_USER_ID) {
      employmentStatus = "PKWTT";
      endDate = "2026-10-20";
    } else if (empCounter % 4 === 0) {
      employmentStatus = "PKWT II";
      endDate = `2027-0${(empCounter % 6) + 1}-15`;
    } else if (empCounter % 3 === 0) {
      employmentStatus = "PKWT I";
      endDate = `2027-0${(empCounter % 5) + 2}-28`;
    } else if (empCounter % 2 === 0) {
      employmentStatus = "PKWTT";
      endDate = "";
    }

    const resignInfo = RESIGNED_EMPLOYEES[userId];
    const resignDate = resignInfo ? resignInfo.resign_date : "";
    const submitResignDate = resignInfo ? resignInfo.submit_resign_date : "";

    const phone = empCounter === 1 ? "08123456789" : `0812${String(3000000 + empCounter).slice(1)}`;
    const gender = empCounter % 3 === 0 ? "Female" : "Male";
    const maritalStatus = empCounter % 2 === 1 ? "Single" : "Married";

    employees.push({
      user_id: userId,
      sso_id: "",
      employee_id: empIdStr,
      first_name: firstName,
      last_name: lastName,
      branch_id: BRANCH_ID,
      branch: "Jakarta",
      organization_id: div.orgId,
      organization_name: div.orgName,
      company_id: COMPANY_ID,
      job_position_id: div.jobPositionBase,
      employment_status: employmentStatus,
      join_date: joinDate,
      end_date: endDate,
      resign_date: resignDate,
      grade: "*****",
      class: "*****",
      barcode: `BC${userId}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      birth_place: "*****",
      birth_date: "*****",
      address: "*****",
      mobile_phone: phone,
      religion: "*****",
      postal_code: "11171",
      identity_type: "KTP",
      identity_number: String(empCounter).padStart(4, "0"),
      gender,
      avatar: "https://talenta.oss-ap-southeast-5.aliyuncs.com/avatar/blank.jpg",
      phone,
      blood_type: "",
      nationality_code: "",
      submit_resign_date: submitResignDate,
      marital_status: maritalStatus,
      created_at: `${joinDate} 14:32:09`,
      updated_at: "2026-10-01 08:00:00",
    });
  }
}

const attendanceHistoryByUser = new Map<number, AttendanceHistoryItem[]>();
const liveAttendanceByUser = new Map<number, LiveAttendanceItem[]>();

let historyIdCounter = 5615;

for (const emp of employees) {
  const historyList: AttendanceHistoryItem[] = [];
  const liveList: LiveAttendanceItem[] = [];

  for (let day = 1; day <= 28; day++) {
    const dateStr = `2026-10-${pad2(day)}`;

    if (emp.resign_date && emp.resign_date < dateStr) {
      continue;
    }

    const dateObj = new Date(`${dateStr}T00:00:00Z`);
    const dayOfWeek = dateObj.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    historyIdCounter++;

    if (isWeekend) {
      historyList.push({
        id: historyIdCounter,
        type: "dayoff",
        time: "",
        clock_datetime: "",
        has_location: false,
        show_detail: false,
        date: dateStr,
        shift: "dayoff",
        schedule_in: "00:00",
        schedule_out: "00:00",
        checkin: "",
        checkout: "",
        overtime: "00:00",
        attendance_code: "OFF",
        timeoff_code: "",
        timeoff_name: "",
        overnight: false,
        branch: ATTENDANCE_BRANCH_ID,
        barcode: emp.barcode,
        source: "live_attendance",
      });

      liveList.push({
        date: dateStr,
        shift: "DAYOFF",
        schedule_in: "00:00:00",
        schedule_out: "00:00:00",
        final_check_in: "",
        final_check_out: "",
        live_attendance: {
          check_in: {
            time: "",
            photo: "",
            location: "",
            coordinate: "",
            body_temperature: 0,
            wearing_mask: "",
            description: "",
            source: "mobileweb",
          },
          check_out: {
            time: "",
            photo: "",
            location: "",
            coordinate: "",
            body_temperature: 0,
            wearing_mask: "",
            description: "",
            source: "mobileweb",
          },
        },
        attendance_code: "OFF",
        overtime: "",
        timeoff_code: "",
        timeoff: null,
        breaks: {
          schedule_break_in: "00:00:00",
          schedule_break_out: "00:00:00",
          break_start: "",
          break_end: "",
        },
      });
      continue;
    }

    let statusType: "H" | "SKT" | "CT" | "ABSENT" = "H";
    if (dateStr === "2026-10-28") {
      if (OCT_28_SICK_USERS.has(emp.user_id)) {
        statusType = "SKT";
      } else if (OCT_28_LEAVE_USERS.has(emp.user_id)) {
        statusType = "CT";
      } else if (OCT_28_ABSENT_USERS.has(emp.user_id)) {
        statusType = "ABSENT";
      }
    }

    if (statusType === "SKT" || statusType === "CT") {
      const timeoffCode = statusType;
      const timeoffName = statusType === "SKT" ? "Sakit dengan Surat Dokter" : "Cuti Tahunan";

      historyList.push({
        id: historyIdCounter,
        type: "timeoff",
        time: "",
        clock_datetime: "",
        has_location: false,
        show_detail: true,
        date: dateStr,
        shift: "office",
        schedule_in: "09:00",
        schedule_out: "18:00",
        checkin: "",
        checkout: "",
        overtime: "00:00",
        attendance_code: timeoffCode,
        timeoff_code: timeoffCode,
        timeoff_name: timeoffName,
        overnight: false,
        branch: ATTENDANCE_BRANCH_ID,
        barcode: emp.barcode,
        source: "live_attendance",
      });

      liveList.push({
        date: dateStr,
        shift: "OFFICE",
        schedule_in: "09:00:00",
        schedule_out: "18:00:00",
        final_check_in: "",
        final_check_out: "",
        live_attendance: {
          check_in: {
            time: "",
            photo: "",
            location: "",
            coordinate: "",
            body_temperature: 0,
            wearing_mask: "",
            description: "",
            source: "mobileweb",
          },
          check_out: {
            time: "",
            photo: "",
            location: "",
            coordinate: "",
            body_temperature: 0,
            wearing_mask: "",
            description: "",
            source: "mobileweb",
          },
        },
        attendance_code: timeoffCode,
        overtime: "",
        timeoff_code: timeoffCode,
        timeoff: {
          policy_code: timeoffCode,
          policy_name: timeoffName,
        },
        breaks: {
          schedule_break_in: "12:00:00",
          schedule_break_out: "13:00:00",
          break_start: "",
          break_end: "",
        },
      });
      continue;
    }

    if (statusType === "ABSENT") {
      historyList.push({
        id: historyIdCounter,
        type: "absent",
        time: "",
        clock_datetime: "",
        has_location: false,
        show_detail: false,
        date: dateStr,
        shift: "office",
        schedule_in: "09:00",
        schedule_out: "18:00",
        checkin: "",
        checkout: "",
        overtime: "00:00",
        attendance_code: "",
        timeoff_code: "",
        timeoff_name: "",
        overnight: false,
        branch: ATTENDANCE_BRANCH_ID,
        barcode: emp.barcode,
        source: "live_attendance",
      });

      liveList.push({
        date: dateStr,
        shift: "OFFICE",
        schedule_in: "09:00:00",
        schedule_out: "18:00:00",
        final_check_in: "",
        final_check_out: "",
        live_attendance: {
          check_in: {
            time: "",
            photo: "",
            location: "",
            coordinate: "",
            body_temperature: 0,
            wearing_mask: "",
            description: "",
            source: "mobileweb",
          },
          check_out: {
            time: "",
            photo: "",
            location: "",
            coordinate: "",
            body_temperature: 0,
            wearing_mask: "",
            description: "",
            source: "mobileweb",
          },
        },
        attendance_code: "",
        overtime: "",
        timeoff_code: "",
        timeoff: null,
        breaks: {
          schedule_break_in: "12:00:00",
          schedule_break_out: "13:00:00",
          break_start: "",
          break_end: "",
        },
      });
      continue;
    }

    const inMinute = emp.user_id === 3000001 && (day === 1 || day === 26) ? 55 : randomInt(40, 59);
    const outMinute = emp.user_id === 3000001 && (day === 1 || day === 26) ? 5 : randomInt(1, 30);
    const checkinShort = `08:${pad2(inMinute)}`;
    const checkoutShort = `18:${pad2(outMinute)}`;
    const checkinFull = `${checkinShort}:00`;
    const checkoutFull = `${checkoutShort}:00`;

    const overrideKey = `${emp.user_id}_${dateStr}`;
    const visitOverride = VISIT_OVERRIDES[overrideKey];

    const defaultLat = (-6.2088 + ((emp.user_id % 60) * 0.008) + day * 0.002).toFixed(6);
    const defaultLng = (106.8456 + ((emp.user_id % 60) * 0.008) - day * 0.002).toFixed(6);
    const location = visitOverride ? visitOverride.location : "Head Office Jakarta";
    const coordinate = visitOverride ? visitOverride.coordinate : `${defaultLat},${defaultLng}`;

    historyList.push({
      id: historyIdCounter,
      type: "clock_out",
      time: checkoutShort,
      clock_datetime: `${dateStr} ${checkoutFull}`,
      has_location: true,
      show_detail: true,
      date: dateStr,
      shift: "office",
      schedule_in: "09:00",
      schedule_out: "18:00",
      checkin: checkinShort,
      checkout: checkoutShort,
      overtime: "00:00",
      attendance_code: "H",
      timeoff_code: "",
      timeoff_name: "",
      overnight: false,
      branch: ATTENDANCE_BRANCH_ID,
      barcode: emp.barcode,
      source: "live_attendance",
    });

    liveList.push({
      date: dateStr,
      shift: "OFFICE",
      schedule_in: "09:00:00",
      schedule_out: "18:00:00",
      final_check_in: checkinFull,
      final_check_out: checkoutFull,
      live_attendance: {
        check_in: {
          time: `${dateStr} ${checkinFull}`,
          photo: "",
          location,
          coordinate,
          body_temperature: 0,
          wearing_mask: "",
          description: "",
          source: "mobileweb",
        },
        check_out: {
          time: `${dateStr} ${checkoutFull}`,
          photo: "",
          location,
          coordinate,
          body_temperature: 0,
          wearing_mask: "",
          description: "",
          source: "mobileweb",
        },
      },
      attendance_code: "H",
      overtime: "",
      timeoff_code: "",
      timeoff: null,
      breaks: {
        schedule_break_in: "12:00:00",
        schedule_break_out: "13:00:00",
        break_start: "",
        break_end: "",
      },
    });
  }

  attendanceHistoryByUser.set(emp.user_id, historyList);
  liveAttendanceByUser.set(emp.user_id, liveList);
}

app.get("/v2/talenta/v3/employees", (c) => {
  const page = Math.max(1, Number(c.req.query("page") || 1));
  const limit = Math.max(1, Number(c.req.query("limit") || 25));
  const total = employees.length;
  const lastPage = Math.max(1, Math.ceil(total / limit));
  const fromIdx = (page - 1) * limit;
  const sliced = employees.slice(fromIdx, fromIdx + limit);
  const from = sliced.length > 0 ? fromIdx + 1 : 0;
  const to = fromIdx + sliced.length;

  const baseUrl = new URL(c.req.url).origin + "/v2/talenta/v3/employees";
  const firstPageUrl = `${baseUrl}?page=1&limit=${limit}`;
  const lastPageUrl = `${baseUrl}?page=${lastPage}&limit=${limit}`;
  const nextPageUrl = page < lastPage ? `${baseUrl}?page=${page + 1}&limit=${limit}` : "";
  const prevPageUrl = page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}` : "";

  return c.json({
    message: "Successfully get employee list",
    data: {
      employees: sliced,
      pagination: {
        current_page: page,
        first_page_url: firstPageUrl,
        from,
        last_page: lastPage,
        last_page_url: lastPageUrl,
        next_page_url: nextPageUrl,
        path: baseUrl,
        per_page: limit,
        prev_page_url: prevPageUrl,
        to,
        total,
      },
    },
  });
});

app.get("/v2/talenta/v2/company/:companyId/organization", (c) => {
  return c.json({
    message: "get organizations successfully",
    data: {
      organizations: ORGANIZATIONS,
      total: ORGANIZATIONS.length,
      pagination: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 10,
        to: ORGANIZATIONS.length,
        total: ORGANIZATIONS.length,
      },
    },
  });
});

app.get("/v2/talenta/v2/company/me/employment-status", (c) => {
  return c.json({
    message: "success",
    data: {
      employment_statuses: EMPLOYMENT_STATUSES,
      total: EMPLOYMENT_STATUSES.length,
      pagination: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 10,
        to: EMPLOYMENT_STATUSES.length,
        total: EMPLOYMENT_STATUSES.length,
      },
    },
  });
});

app.get("/v2/talenta-ppe/v3/time-off/policies/companies/:companyId", (c) => {
  const companyId = Number(c.req.param("companyId")) || COMPANY_ID;
  const policies = TIMEOFF_POLICIES.map((p) => ({ ...p, company_id: companyId }));

  return c.json({
    message: "Successfully retrieved time-off policies",
    data: {
      policies,
      pagination: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 10,
        to: policies.length,
        total: policies.length,
      },
    },
    request_id: "7424df438156c2948198ee8c827334e6",
  });
});

app.get("/v2/talenta/v2/attendance/:userId/history-list", (c) => {
  const userId = Number(c.req.param("userId"));
  const year = Number(c.req.query("year") || 2026);
  const month = Number(c.req.query("month") || 10);
  const prefix = `${year}-${pad2(month)}`;

  const list = attendanceHistoryByUser.get(userId) || [];
  const filtered = list.filter((item) => item.date.startsWith(prefix));

  return c.json({
    message: "Successfully get history attendance list",
    data: {
      attendance_history: filtered,
    },
  });
});

app.get("/v2/talenta/v3/live-attendance", (c) => {
  const userId = Number(c.req.query("user_id") || 3000001);
  const startDate = c.req.query("start_date") || "2026-10-01";
  const endDate = c.req.query("end_date") || "2026-10-28";

  const list = liveAttendanceByUser.get(userId) || [];
  const filtered = list.filter((item) => item.date >= startDate && item.date <= endDate);

  return c.json({
    message: "Successfully retrieved employee live attendance",
    data: {
      attendances: filtered,
    },
    request_id: "14655dd2ef7fa1935d08d118d25c9390",
  });
});

const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Mekari Talenta Mock API — Databricks PySpark POC",
    version: "1.0.0",
    description:
      "Mock Backend REST API yang meniru struktur response Mekari Talenta API secara presisi menggunakan seeded random generator (seed = 42).\n\n" +
      "### Tujuan POC Databricks (PySpark):\n" +
      "1. **Dashboard Kunjungan Lintas Divisi**: Mendeteksi kunjungan divisi `Product`, `Sales`, dan `Technical` pada lokasi yang sama dalam 1 hari (radius <= 150 meter).\n" +
      "2. **Dashboard Ketidakhadiran Karyawan**: Rekapitulasi karyawan Tidak Absen (Alpha/Belum Clock-in), Sakit (`SKT`), dan Cuti (`CT`) pada `REF_DATE = 2026-10-28`.\n" +
      "3. **Dashboard Kontrak Berakhir (PKWT)**: Monitoring karyawan aktif berstatus `PKWT` yang akan berakhir masa kontraknya di bulan berjalan (`Oktober 2026`).",
  },
  servers: [
    {
      url: "/",
      description: "Current Server",
    },
  ],
  tags: [
    { name: "Employees", description: "Master data karyawan, organisasi, dan status kepegawaian" },
    { name: "Time Off", description: "Kebijakan cuti, sakit, dan izin perusahaan" },
    { name: "Attendance", description: "Riwayat absensi dan live attendance beserta koordinat GPS" },
  ],
  paths: {
    "/v2/talenta/v3/employees": {
      get: {
        tags: ["Employees"],
        summary: "Get Employee List",
        description: "Mengambil daftar karyawan dengan dukungan paginasi (total 60 karyawan lintas 5 divisi).",
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1 },
            description: "Nomor halaman (default: 1)",
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 25 },
            description: "Jumlah data per halaman (default: 25)",
          },
        ],
        responses: {
          "200": {
            description: "Successfully get employee list",
            content: {
              "application/json": {
                example: {
                  message: "Successfully get employee list",
                  data: {
                    employees: [employees[0]],
                    pagination: {
                      current_page: 1,
                      first_page_url: "http://localhost:3000/v2/talenta/v3/employees?page=1&limit=25",
                      from: 1,
                      last_page: 3,
                      last_page_url: "http://localhost:3000/v2/talenta/v3/employees?page=3&limit=25",
                      next_page_url: "http://localhost:3000/v2/talenta/v3/employees?page=2&limit=25",
                      path: "http://localhost:3000/v2/talenta/v3/employees",
                      per_page: 25,
                      prev_page_url: "",
                      to: 25,
                      total: 60,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/v2/talenta/v2/company/{companyId}/organization": {
      get: {
        tags: ["Employees"],
        summary: "Get Company Organizations",
        description: "Mengambil daftar organisasi/divisi pada perusahaan (Product, Sales, Technical, Finance, HRD & GA).",
        parameters: [
          {
            name: "companyId",
            in: "path",
            required: true,
            schema: { type: "integer", default: 1202 },
            description: "ID Perusahaan (contoh: 1202)",
          },
        ],
        responses: {
          "200": {
            description: "get organizations successfully",
            content: {
              "application/json": {
                example: {
                  message: "get organizations successfully",
                  data: {
                    organizations: ORGANIZATIONS,
                    total: 5,
                    pagination: {
                      current_page: 1,
                      from: 1,
                      last_page: 1,
                      per_page: 10,
                      to: 5,
                      total: 5,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/v2/talenta/v2/company/me/employment-status": {
      get: {
        tags: ["Employees"],
        summary: "Get Employment Statuses",
        description: "Mengambil daftar status kepegawaian beserta indikator kontrak (`is_end_date`).",
        responses: {
          "200": {
            description: "success",
            content: {
              "application/json": {
                example: {
                  message: "success",
                  data: {
                    employment_statuses: EMPLOYMENT_STATUSES,
                    total: 4,
                    pagination: {
                      current_page: 1,
                      from: 1,
                      last_page: 1,
                      per_page: 10,
                      to: 4,
                      total: 4,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/v2/talenta-ppe/v3/time-off/policies/companies/{companyId}": {
      get: {
        tags: ["Time Off"],
        summary: "Get Time-Off Policies",
        description: "Mengambil daftar kebijakan time-off perusahaan (SKT, CT, IZN).",
        parameters: [
          {
            name: "companyId",
            in: "path",
            required: true,
            schema: { type: "integer", default: 1202 },
            description: "ID Perusahaan (contoh: 1202)",
          },
        ],
        responses: {
          "200": {
            description: "Successfully retrieved time-off policies",
            content: {
              "application/json": {
                example: {
                  message: "Successfully retrieved time-off policies",
                  data: {
                    policies: TIMEOFF_POLICIES,
                    pagination: {
                      current_page: 1,
                      from: 1,
                      last_page: 1,
                      per_page: 10,
                      to: 3,
                      total: 3,
                    },
                  },
                  request_id: "7424df438156c2948198ee8c827334e6",
                },
              },
            },
          },
        },
      },
    },
    "/v2/talenta/v2/attendance/{userId}/history-list": {
      get: {
        tags: ["Attendance"],
        summary: "Get Attendance History List",
        description: "Mengambil riwayat absensi bulanan per karyawan.",
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "integer", default: 3000001 },
            description: "User ID karyawan (3000001 s/d 3000060)",
          },
          {
            name: "year",
            in: "query",
            required: false,
            schema: { type: "integer", default: 2026 },
            description: "Tahun absensi (contoh: 2026)",
          },
          {
            name: "month",
            in: "query",
            required: false,
            schema: { type: "integer", default: 10 },
            description: "Bulan absensi (contoh: 10)",
          },
        ],
        responses: {
          "200": {
            description: "Successfully get history attendance list",
            content: {
              "application/json": {
                example: {
                  message: "Successfully get history attendance list",
                  data: {
                    attendance_history: [attendanceHistoryByUser.get(3000001)?.[0]],
                  },
                },
              },
            },
          },
        },
      },
    },
    "/v2/talenta/v3/live-attendance": {
      get: {
        tags: ["Attendance"],
        summary: "Get Employee Live Attendance",
        description: "Mengambil data live attendance beserta koordinat GPS check-in & check-out per rentang tanggal.",
        parameters: [
          {
            name: "user_id",
            in: "query",
            required: true,
            schema: { type: "integer", default: 3000001 },
            description: "User ID karyawan (contoh: 3000001)",
          },
          {
            name: "start_date",
            in: "query",
            required: false,
            schema: { type: "string", default: "2026-10-01" },
            description: "Tanggal mulai (YYYY-MM-DD)",
          },
          {
            name: "end_date",
            in: "query",
            required: false,
            schema: { type: "string", default: "2026-10-28" },
            description: "Tanggal akhir (YYYY-MM-DD)",
          },
        ],
        responses: {
          "200": {
            description: "Successfully retrieved employee live attendance",
            content: {
              "application/json": {
                example: {
                  message: "Successfully retrieved employee live attendance",
                  data: {
                    attendances: [
                      liveAttendanceByUser
                        .get(3000001)
                        ?.find((a) => a.date === "2026-10-26"),
                    ],
                  },
                  request_id: "14655dd2ef7fa1935d08d118d25c9390",
                },
              },
            },
          },
        },
      },
    },
  },
};

app.get("/openapi.json", (c) => c.json(openApiSpec));

const scalarMiddleware = apiReference({
  pageTitle: "Mekari Talenta Mock API — Scalar Reference",
  theme: "deepSpace",
  spec: {
    url: "/openapi.json",
  },
});

app.get("/", scalarMiddleware);
app.get("/docs", scalarMiddleware);

const port = Number(process.env.PORT || 3000);

console.log(`🚀 Server berjalan di: http://localhost:${port}`);
console.log(`📖 Dokumentasi API (Scalar UI): http://localhost:${port}/docs`);
console.log(`📄 OpenAPI JSON: http://localhost:${port}/openapi.json`);

export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
