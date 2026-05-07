/* =========================
   업무관리 > 프로젝트 관리
   기존 업무관리 프로젝트 상세 화면을 모듈화한 파일입니다.
   ========================= */

const pmProjectData = [
  {
    id: "PJT-001",
    name: "성수 복합개발 신축공사",
    client: "성수개발 주식회사",
    dept: "구조·BIM팀",
    pm: "김현수 실장",
    status: "진행중",
    orderDate: "2026-03-05",
    startDate: "2026-03-18",
    dueDate: "2026-08-30",
    delayReasonRequired: true,
    delayReasonApproved: true,
    delayReasonText: "수주 직후 기존 선행 프로젝트 마감 일정과 중복되어 즉시 착수가 불가하여 부서장이 착수 지연 사유서를 작성함. 이후 상부 승인 완료 후 2026-03-18 착수 처리.",
    orderHistory: [
      "2026-03-05 : 프로젝트 수주 등록",
      "2026-03-06 : 즉시 착수 불가 상태로 변경",
      "2026-03-07 : 부서장 착수 지연 사유서 작성",
      "2026-03-10 : 상부 승인 완료",
      "2026-03-18 : 프로젝트 착수일 등록"
    ],
    completionChanged: true,
    completionHistory: [
      "2026-03-05 : 최초 완료예정일 2026-08-20 등록",
      "2026-04-02 : 외부 협력사 도면 반영 지연으로 완료예정일 2026-08-30으로 변경"
    ],
    meetings: [
      { date: "2026-03-08", title: "착수 전 외부 협력사 킥오프 미팅", author: "박용진", body: "구조/마감 산출 제출 기준 공유, 도면 납품 포맷 협의, 주간 회의 운영 주기 확정" },
      { date: "2026-03-22", title: "1차 진행 상황 점검 회의", author: "이정민", body: "구조 파트 선행 물량 산출 진행 현황 공유, 마감팀 초기 투입 시점 조정" }
    ],
    assignments: [
      { category: "구조", teams: ["기초", "주차장 수평", "주차장 수직", "아파트 수평", "아파트 수직"].map(name => ({ name, members: ["팀장", "직원1", "직원2", "직원3"] })) },
      { category: "마감", teams: ["내부", "외부", "조적", "창호"].map(name => ({ name, members: ["팀장", "직원1", "직원2", "직원3"] })) },
      { category: "토목", teams: [{ name: "토목", members: ["팀장", "직원1", "직원2"] }] },
      { category: "클레임", teams: [{ name: "클레임", members: ["팀장", "직원1"] }] },
      { category: "ES", teams: [{ name: "ES", members: ["팀장", "직원1"] }] }
    ],
    emails: [
      { date: "2026-03-09", type: "수신", from: "abc@partner.com", to: "pm@concost.co.kr", subject: "[성수 복합개발] 도면 전달 일정 문의" },
      { date: "2026-03-10", type: "발신", from: "pm@concost.co.kr", to: "abc@partner.com", subject: "[성수 복합개발] 도면 전달 일정 회신" },
      { date: "2026-03-20", type: "수신", from: "client@sungsu.com", to: "manager@concost.co.kr", subject: "[성수 복합개발] 1차 납품 항목 확인" }
    ],
    deliveries: [
      { round: "1차 납품", date: "2026-04-10", fileName: "성수복합개발_1차납품자료.zip", approved: false },
      { round: "2차 납품", date: "2026-05-12", fileName: "성수복합개발_2차납품자료.zip", approved: true },
      { round: "3차 납품", date: "2026-06-07", fileName: "성수복합개발_3차납품자료.zip", approved: false }
    ]
  },
  {
    id: "PJT-002",
    name: "송도 주상복합 개발사업",
    client: "송도도시개발",
    dept: "마감팀",
    pm: "최민우 팀장",
    status: "진행중",
    orderDate: "2026-02-20",
    startDate: "2026-02-20",
    dueDate: "2026-07-25",
    delayReasonRequired: false,
    delayReasonApproved: false,
    delayReasonText: "즉시 착수 가능",
    orderHistory: ["2026-02-20 : 프로젝트 수주 등록", "2026-02-20 : 즉시 착수 처리"],
    completionChanged: false,
    completionHistory: ["2026-02-20 : 최초 완료예정일 2026-07-25 등록"],
    meetings: [{ date: "2026-02-21", title: "송도 주상복합 착수 회의", author: "최민우", body: "초기 투입 인력과 납품 일정 확인" }],
    assignments: [
      { category: "마감", teams: ["내부", "외부", "창호"].map(name => ({ name, members: ["팀장", "직원1", "직원2"] })) },
      { category: "구조", teams: [{ name: "기초", members: ["팀장", "직원1"] }] }
    ],
    emails: [{ date: "2026-02-22", type: "수신", from: "client@songdo.com", to: "pm@concost.co.kr", subject: "[송도] 착수 자료 송부" }],
    deliveries: [{ round: "1차 납품", date: "2026-03-30", fileName: "송도_1차납품.zip", approved: true }]
  }
];

let pmCurrentProjectIndex = 0;
let pmInitialized = false;

function initProjectManage() {
  if (!document.getElementById("pmProjectList")) return;
  if (!pmInitialized) {
    pmRenderProjectList();
    pmInitialized = true;
  }
  pmRenderProject(pmCurrentProjectIndex);
}

function pmRenderProjectList() {
  const list = document.getElementById("pmProjectList");
  if (!list) return;
  list.innerHTML = pmProjectData.map((p, index) => `
    <button class="pm-project-item ${index === pmCurrentProjectIndex ? "active" : ""}" type="button" onclick="pmRenderProject(${index})">
      <strong>${pmEscapeHtml(p.name)}</strong>
      <span>${pmEscapeHtml(p.client)} · ${pmEscapeHtml(p.pm)}</span>
    </button>
  `).join("");
}

function pmRenderProject(index = 0) {
  pmCurrentProjectIndex = index;
  const p = pmProjectData[index] || pmProjectData[0];
  if (!p) return;

  pmRenderProjectList();
  pmSetText("pmProjectTitle", p.name);
  pmSetText("pmProjectSubtitle", `${p.client} · ${p.dept} · ${p.pm}`);
  pmSetText("pmProjectStatusBadge", p.status);
  pmSetText("pmSummaryProjectName", p.name);
  pmSetText("pmSummaryClient", p.client);
  pmSetText("pmSummaryDept", p.dept);
  pmSetText("pmSummaryPm", p.pm);
  pmSetText("pmSummaryOrderDate", p.orderDate);
  pmSetText("pmSummaryStartDate", p.startDate);
  pmSetText("pmSummaryDueDate", p.dueDate);
  pmSetText("pmSummaryDeliveryCount", `${p.deliveries.length}차`);

  pmRenderMeetings(p.meetings);
  pmRenderAssignments(p.assignments);
  pmRenderEmails(p.emails);
  pmRenderTimeline("pmOrderTimeline", p.orderHistory);
  pmRenderTimeline("pmCompletionTimeline", p.completionHistory);
  pmRenderDeliveries(p.deliveries);
}

function pmRenderMeetings(items = []) {
  const body = document.getElementById("pmMeetingTableBody");
  if (!body) return;
  body.innerHTML = items.map(m => `<tr><td>${m.date}</td><td>${pmEscapeHtml(m.title)}</td><td>${pmEscapeHtml(m.author)}</td><td><button class="btn btn-line" onclick="showToast('${pmEscapeJs(m.title)} 회의록을 열었습니다.')">상세</button></td></tr>`).join("");
}

function pmRenderAssignments(assignments = []) {
  const grid = document.getElementById("pmAssignmentGrid");
  if (!grid) return;
  grid.innerHTML = assignments.map(group => `
    <div class="pm-assignment-card">
      <h4>${pmEscapeHtml(group.category)}</h4>
      ${group.teams.map(team => `<div class="pm-team-row"><b>${pmEscapeHtml(team.name)}</b><span>${team.members.map(pmEscapeHtml).join(" · ")}</span></div>`).join("")}
    </div>
  `).join("");
}

function pmRenderEmails(items = []) {
  const body = document.getElementById("pmEmailTableBody");
  if (!body) return;
  body.innerHTML = items.map(m => `<tr><td>${m.date}</td><td>${m.type}</td><td>${pmEscapeHtml(m.from)}</td><td>${pmEscapeHtml(m.to)}</td><td>${pmEscapeHtml(m.subject)}</td></tr>`).join("");
}

function pmRenderTimeline(targetId, items = []) {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.innerHTML = items.map(item => `<div class="pm-timeline-item">${pmEscapeHtml(item)}</div>`).join("");
}

function pmRenderDeliveries(items = []) {
  const grid = document.getElementById("pmDeliveryGrid");
  if (!grid) return;
  grid.innerHTML = items.map(d => `
    <div class="pm-delivery-card">
      <strong>${pmEscapeHtml(d.round)}</strong>
      <span>${pmEscapeHtml(d.date)}</span>
      <small>${pmEscapeHtml(d.fileName)}</small>
      <em class="${d.approved ? "done" : "pending"}">${d.approved ? "승인완료" : "승인대기"}</em>
    </div>
  `).join("");
}

function pmSimulateDelayReason() {
  const p = pmProjectData[pmCurrentProjectIndex];
  showToast(p.delayReasonText || "착수지연 사유가 등록되었습니다.");
}

function pmSimulateApproval() {
  showToast("상부 승인 처리 예시가 반영되었습니다.");
}

function pmSimulateCompletionChange() {
  const p = pmProjectData[pmCurrentProjectIndex];
  p.completionChanged = true;
  p.completionHistory.push(`${pmTodayText()} : 완료예정일 변경 시뮬레이션 반영`);
  pmRenderProject(pmCurrentProjectIndex);
  showToast("완료일정 변경 이력이 추가되었습니다.");
}

function pmSetText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "-";
}

function pmTodayText() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function pmEscapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[ch]));
}

function pmEscapeJs(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, " ");
}
