/* =========================
   업무관리 탭 / QC 체크리스트
   ========================= */
const workPageMeta = {
  projectReceive: ["프로젝트 접수", "해당 업무관리 카테고리는 화면 준비 영역입니다."],
  pmSchedule: ["PM 배정 / 일정", "해당 업무관리 카테고리는 화면 준비 영역입니다."],
  projectManage: ["프로젝트 관리", "프로젝트 개요, 회의록, 배정인원, 관련메일, 수주일정, 완료시점, 납품관리를 통합 관리합니다."],
  quantityChecklist: ["프로젝트 질의응답 관리", "수량산출 체크리스트, 체크리스트 검토, 이의제기, 오류 소거, 최종 수량 검토를 한 화면에서 관리합니다."],
  qcReview: ["프로젝트 질의응답 관리", "수량산출 체크리스트, 체크리스트 검토, 이의제기, 오류 소거, 최종 수량 검토를 한 화면에서 관리합니다."],
  deliveryData: ["납품 및 데이터관리", "해당 업무관리 카테고리는 화면 준비 영역입니다."],
  dailyReport: ["업무일지 / 진행률", "해당 업무관리 카테고리는 화면 준비 영역입니다."]
};


const checklistCategoryOptions = [
  "프로젝트 수주 시점(PM,작업자,발주처 송부용)",
  "QC팀 전달사항(유형 및 특이사항 관리)",
  "작업 착수 전 확인 필요사항(PM)",
  "작업 진행 중 추가 전달사항(PM)",
  "자가검토 체크리스트(QC)",
  "제출자료 검토사항(PM)",
  "최종자료 검토사항(QC)",
  "Z1. 질의사항(1차)",
  "Z2. 질의사항(2차)",
  "Z3. 질의사항(3차)",
  "Z4. 질의사항(4차)",
  "Z5. 질의사항(5차)",
  "Z6. 질의사항(6차)",
  "Z7. 견적조건(최종)"
];


let selectedChecklistCategoryFilter = "전체";
let checklistCategoryPanelOpen = false;
const collapsedChecklistGroups = new Set();
const checklistCategoryAliases = {
  "프로젝트 수주시": "프로젝트 수주 시점(PM,작업자,발주처 송부용)",
  "프로젝트 수주 시": "프로젝트 수주 시점(PM,작업자,발주처 송부용)",
  "프로젝트 초기": "작업 착수 전 확인 필요사항(PM)",
  "기초 산출 담당자": "작업 착수 전 확인 필요사항(PM)",
  "전체 공통": "자가검토 체크리스트(QC)",
  "기둥": "자가검토 체크리스트(QC)",
  "기초": "제출자료 검토사항(PM)",
  "보": "제출자료 검토사항(PM)",
  "슬라브": "제출자료 검토사항(PM)",
  "옹벽": "제출자료 검토사항(PM)"
};

const questionCategories = checklistCategoryOptions.filter(category => category.startsWith("Z") && category.includes("질의사항"));
const checklistSentCategories = new Set();
const firstCategoryName = checklistCategoryOptions[0];


const currentWorkViewer = {
  name: "박용진 수석",
  roles: ["QC TEAM", "PM", "실장", "본부장"]
};

const checklistAdminTemplates = [
  { id: "template-structure-common", division: "구조", process: "전체 공통", trade: "도면목록표", item: "도면목록표와 도서가 일치하는지 확인", method: "PM과 산출 담당자가 도면 누락분, 최신본 여부, 구조/건축/토목 도서 간 불일치 여부를 확인", targets: ["PM", "산출 담당자"] },
  { id: "template-structure-start", division: "구조", process: "작업착수", trade: "기초", item: "기초 산출 전 지내력, 파일, 기초 형식 확인", method: "구조도면, 지질보고서, 특기시방서 기준으로 기초 산출 조건을 확인하고 특이사항을 코멘트에 기록", targets: ["산출 담당자"] },
  { id: "template-finish-process", division: "마감", process: "공정별", trade: "마감", item: "마감 공정별 산출 기준 및 누락 가능 항목 확인", method: "내부/외부/조적/창호 공정별 체크리스트 기준으로 산출 범위와 제외 조건을 확인", targets: ["PM", "산출 담당자"] },
  { id: "template-civil-common", division: "토목", process: "전체 공통", trade: "토공사", item: "토공사 산출 유무 및 가시설 연계 여부 확인", method: "토목 도면, 흙막이 도면, 가시설 계획도 수령 여부를 확인하고 건축 터파기 산출 범위와 중복 여부를 협의", targets: ["PM"] },
  { id: "template-final-qc", division: "QC", process: "최종검토", trade: "최종자료", item: "납품 전 유사 프로젝트 오류 및 누락 항목 재확인", method: "기존 프로젝트 오류 DB와 비교하여 PM이 누락한 검토 항목, 개수 확인, 유사 프로젝트 비교 필요 여부를 점검", targets: ["PM", "산출 담당자"] }
];

function getCurrentViewerRoles() {
  return currentWorkViewer.roles || [];
}

function getChecklistTemplateOptions() {
  return checklistAdminTemplates.map(t => `${t.division} / ${t.process} / ${t.trade} - ${t.item}`);
}

function renderChecklistAdminTemplateBox() {
  const box = document.getElementById("checklistAdminTemplateBox");
  if (!box) return;
  const rows = checklistAdminTemplates.map(t => `
    <tr>
      <td>${escapeHtml(t.division)}</td>
      <td>${escapeHtml(t.process)}</td>
      <td>${escapeHtml(t.trade)}</td>
      <td>${escapeHtml(t.item)}</td>
      <td>${escapeHtml(t.targets.join(" / "))}</td>
      <td><button class="btn btn-line template-mini-btn" onclick="applyChecklistTemplate('${escapeJs(t.id)}')">적용</button></td>
    </tr>
  `).join("");
  box.innerHTML = `
    <div class="template-headline">
      <div>
        <strong>관리자 체크리스트 템플릿</strong>
        <span>회의 반영: 구분·공정·부서별 기본 틀은 어드민에서 관리하고, 필요 시 프로젝트별로 추가합니다.</span>
      </div>
      <button class="btn btn-line" onclick="toggleChecklistTemplateBox()" id="checklistTemplateToggleBtn">접기</button>
    </div>
    <div class="template-body" id="checklistTemplateBody">
      <div class="table-wrap template-table-wrap">
        <table class="template-table">
          <thead><tr><th>부서</th><th>유형</th><th>공종</th><th>기본 검토항목</th><th>기본 요청 대상</th><th>반영</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function toggleChecklistTemplateBox() {
  const body = document.getElementById("checklistTemplateBody");
  const btn = document.getElementById("checklistTemplateToggleBtn");
  if (!body || !btn) return;
  const collapsed = body.classList.toggle("collapsed");
  btn.textContent = collapsed ? "펼치기" : "접기";
}

function applyChecklistTemplate(templateId) {
  const template = checklistAdminTemplates.find(t => t.id === templateId);
  if (!template) return;
  const projectName = document.getElementById("checklistProject")?.value || "ㅇㅇ시설 신축공사";
  const selectedGroup = template.process === "최종검토" ? "최종자료 검토사항(QC)" : template.process === "작업착수" ? "작업 착수 전 확인 필요사항(PM)" : "QC팀 전달사항(유형 및 특이사항 관리)";
  const row = {
    project: projectName,
    group: selectedGroup,
    trade: template.trade,
    no: nextChecklistNo(),
    item: template.item,
    method: template.method,
    owner: template.targets.join(", "),
    targets: [...template.targets],
    creator: getCurrentWorkerName(),
    createdAt: getChecklistTimeText(),
    comment: `${template.division} / ${template.process} 템플릿에서 반영`,
    attachments: [],
    history: [{ action: "최초작성", worker: getCurrentWorkerName(), time: getChecklistTimeText() }]
  };
  normalizeChecklistRow(row);
  checklistRows.push(row);
  selectedChecklistCategoryFilter = selectedGroup;
  renderChecklistGrid();
  showToast("관리자 템플릿 항목을 현재 프로젝트에 반영했습니다.");
}

function applyChecklistFeedback(index) {
  const row = checklistRows[index];
  if (!row) return;
  normalizeChecklistRow(row);
  const value = prompt("발주처 회신 또는 내부 피드백 내용을 입력하세요.", row.feedback || "");
  if (value === null) return;
  const worker = getCurrentWorkerName();
  const time = getChecklistTimeText();
  row.feedback = value.trim();
  row.feedbackAt = row.feedback ? time : "";
  row.feedbackBy = row.feedback ? worker : "";
  row.history = Array.isArray(row.history) ? row.history : [];
  row.history.push({ action: row.feedback ? "회신반영" : "회신삭제", worker, time });
  renderChecklistGrid();
}

function bulkApplyQuestionFeedback() {
  const category = selectedChecklistCategoryFilter !== "전체" ? selectedChecklistCategoryFilter : "Z1. 질의사항(1차)";
  const rows = checklistRows.filter(row => normalizeChecklistGroupName(row.group) === category);
  if (!rows.length) {
    showToast("회신을 반영할 질의사항이 없습니다.");
    return;
  }
  const value = prompt(`${category} 회신 요약을 입력하세요. 선택 차수 전체에 동일하게 기록됩니다.`, "");
  if (value === null || !value.trim()) return;
  const worker = getCurrentWorkerName();
  const time = getChecklistTimeText();
  rows.forEach(row => {
    normalizeChecklistRow(row);
    row.feedback = value.trim();
    row.feedbackAt = time;
    row.feedbackBy = worker;
    row.history.push({ action: "차수회신반영", worker, time });
  });
  renderChecklistGrid();
  showToast(`${category} 회신 내용을 전체 현황에 반영했습니다.`);
}

function normalizeChecklistGroupName(group) {
  const value = String(group || "").trim();
  return checklistCategoryAliases[value] || value || firstCategoryName;
}

function getQuestionCategoryIndex(category) {
  return questionCategories.indexOf(category);
}

function isQuestionCategory(category) {
  return questionCategories.includes(category);
}

function isChecklistCategoryLocked(category) {
  return checklistSentCategories.has(category);
}

function canUseChecklistCategory(category, currentGroup = "") {
  category = normalizeChecklistGroupName(category);
  currentGroup = normalizeChecklistGroupName(currentGroup);
  if (!category) return false;
  if (category === currentGroup) return true;
  if (isChecklistCategoryLocked(category)) return false;
  const idx = getQuestionCategoryIndex(category);
  if (idx <= 0) return true;
  return checklistSentCategories.has(questionCategories[idx - 1]);
}

function getNextQuestionCategory(category) {
  const idx = getQuestionCategoryIndex(category);
  if (idx >= 0 && idx < questionCategories.length - 1) return questionCategories[idx + 1];
  return "";
}

let checklistRows = [
  {
    "group": "프로젝트 수주 시점(PM,작업자,발주처 송부용)",
    "trade": "계약",
    "no": "001",
    "item": "프로젝트 업무 특성 파악\n(구조선수행, 입찰, 본실행,\n설계내역 등)",
    "method": "접수자료 확인. 특이사항 작성 후 프로젝트\nPM 전달",
    "owner": "PM",
    "targets": [
      "PM"
    ],
    "creator": "QC TEAM",
    "createdAt": "2026-04-29 09:00",
    "comment": "",
    "attachments": []
  },
  {
    "group": "프로젝트 수주 시점(PM,작업자,발주처 송부용)",
    "trade": "접수자료",
    "no": "002",
    "item": "입찰 내역서, 산출기준서, 공사\n특기사항 접수 파악",
    "method": "접수자료 확인. 특이사항 작성 후 프로젝트\nPM 전달",
    "owner": "PM",
    "targets": [
      "PM"
    ],
    "creator": "QC TEAM",
    "createdAt": "2026-04-29 09:00",
    "comment": "",
    "attachments": []
  },
  {
    "group": "프로젝트 수주 시점(PM,작업자,발주처 송부용)",
    "trade": "도면검토",
    "no": "003",
    "item": "도면 접수 여부 확인 (구조 / 건축 /\n토목)",
    "method": "도면목록표와 접수 도면상 일치 확인",
    "owner": "PM",
    "targets": [
      "PM"
    ],
    "creator": "QC TEAM",
    "createdAt": "2026-04-29 09:00",
    "comment": "",
    "attachments": []
  },
  {
    "group": "프로젝트 수주 시점(PM,작업자,발주처 송부용)",
    "trade": "접수자료",
    "no": "004",
    "item": "내역서, 산출서, 기준서 접수 여부\n확인",
    "method": "내역서, 산출서, 기준서 파일 수신 여부 확인",
    "owner": "PM",
    "targets": [
      "PM"
    ],
    "creator": "QC TEAM",
    "createdAt": "2026-04-29 09:00",
    "comment": "",
    "attachments": []
  },
  {
    "group": "QC팀 전달사항(유형 및 특이사항 관리)",
    "trade": "프로젝트\n유형",
    "no": "005",
    "item": "프로젝트 유형 파악 (입찰 / 본실행\n/ 구조선수행 등)",
    "method": "계약방식과 발주처 요청사항 기준으로 유형\n분류",
    "owner": "PM",
    "targets": [
      "PM"
    ],
    "creator": "QC TEAM",
    "createdAt": "2026-04-29 09:00",
    "comment": "",
    "attachments": []
  },
  {
    "group": "QC팀 전달사항(유형 및 특이사항 관리)",
    "trade": "토공사",
    "no": "008",
    "item": "토공사 산출유무 확인",
    "method": "토목팀 투입 유무 확인 및 건축터파기 산출\n여부 협의",
    "owner": "PM",
    "targets": [
      "PM"
    ],
    "creator": "QC TEAM",
    "createdAt": "2026-04-29 09:00",
    "comment": "",
    "attachments": []
  },
  {
    "group": "QC팀 전달사항(유형 및 특이사항 관리)",
    "trade": "합벽",
    "no": "009",
    "item": "합벽유무 및 합벽구간 추가이음\n발생 여부 확인",
    "method": "토목도면 흙막이 또는 가시설계획도 확인",
    "owner": "PM",
    "targets": [
      "PM"
    ],
    "creator": "QC TEAM",
    "createdAt": "2026-04-29 09:00",
    "comment": "",
    "attachments": []
  },
  {
    "group": "QC팀 전달사항(유형 및 특이사항 관리)",
    "trade": "도면목록표",
    "no": "019",
    "item": "도면목록표와 도서가 일치하는지\n확인",
    "method": "PM과 산출 담당자 모두 도면 누락본 확인할\n것",
    "owner": "PM, 산출 담당자",
    "targets": [
      "PM",
      "산출 담당자"
    ],
    "creator": "QC TEAM",
    "createdAt": "2026-04-29 18:25",
    "comment": "누락본이 있을 시 질의사항 작성 바랍니다.",
    "attachments": [],
    "checks": [
      {
        "target": "PM",
        "done": true,
        "checkedBy": "박용진 수석",
        "checkedAt": "2026-04-29 18:25"
      },
      {
        "target": "산출 담당자",
        "done": true,
        "checkedBy": "박용진 수석",
        "checkedAt": "2026-04-29 18:25"
      }
    ],
    "history": [
      {
        "action": "확인완료(PM)",
        "worker": "박용진 수석",
        "time": "2026-04-29 18:25"
      },
      {
        "action": "확인완료(산출 담당자)",
        "worker": "박용진 수석",
        "time": "2026-04-29 18:25"
      },
      {
        "action": "최초작성",
        "worker": "QC TEAM",
        "time": "2026-04-29 18:25"
      }
    ]
  },
  {
    "group": "작업 착수 전 확인 필요사항(PM)",
    "trade": "특이사항",
    "no": "006",
    "item": "프로젝트별 특이사항 확인 및 정리",
    "method": "정리 완료 후 내부 PM 및 외부 발주처\n담당자에게 동시 발송",
    "owner": "산출 담당자",
    "targets": [
      "산출 담당자"
    ],
    "creator": "PM",
    "createdAt": "2026-04-29 09:00",
    "comment": "",
    "attachments": []
  },
  {
    "group": "작업 착수 전 확인 필요사항(PM)",
    "trade": "파일공사",
    "no": "007",
    "item": "파일길이 및 항타장비, 동재하\n정재하 시험횟수 확인",
    "method": "지질조서도 확인",
    "owner": "산출 담당자",
    "targets": [
      "산출 담당자"
    ],
    "creator": "PM",
    "createdAt": "2026-04-29 09:00",
    "comment": "",
    "attachments": []
  },
  {
    "group": "작업 착수 전 확인 필요사항(PM)",
    "trade": "끊어치기",
    "no": "010",
    "item": "끊어치기(C.J Joint) 구간 확인",
    "method": "발주처 및 건설사 질의사항 작성. Zoning 및\n분할타설 계획도 요청",
    "owner": "산출 담당자",
    "targets": [
      "산출 담당자"
    ],
    "creator": "PM",
    "createdAt": "2026-04-29 09:00",
    "comment": "",
    "attachments": []
  },
  {
    "group": "작업 진행 중 추가 전달사항(PM)",
    "trade": "철근\n규격\n변경",
    "no": "020",
    "item": "데크 슬라브 구분이 필요하여 H-\nBAR → D-BAR 구분 필요",
    "method": "데크슬라브 철근만 D-BAR로 구분 바랍니다.",
    "owner": "산출 담당자",
    "targets": [
      "산출 담당자"
    ],
    "creator": "PM",
    "createdAt": "2026-04-29 18:26",
    "comment": "만약 이음 값이 데이터에 입력되지 않았다면 질의 바랍니다.",
    "attachments": []
  },
  {
    "group": "작업 진행 중 추가 전달사항(PM)",
    "trade": "띠장\n이음",
    "no": "021",
    "item": "띠장구간 이음1회 추가",
    "method": "띠장 도면 참조하여 띠장이 걸리는 구간은 1회\n이음을 추가 해 주세요",
    "owner": "산출 담당자",
    "targets": [
      "PM"
    ],
    "creator": "PM",
    "createdAt": "2026-04-29 18:27",
    "comment": "",
    "attachments": []
  },
  {
    "group": "자가검토 체크리스트(QC)",
    "trade": "커플러",
    "no": "011",
    "item": "커플러 산출기준 확인",
    "method": "건설사별 견적지침서 확인. 별도 표현 없음 시\n담당자 확인",
    "owner": "산출 담당자",
    "targets": [
      "산출 담당자"
    ],
    "creator": "QC TEAM",
    "createdAt": "2026-04-29 09:00",
    "comment": "",
    "attachments": []
  },
  {
    "group": "자가검토 체크리스트(QC)",
    "trade": "철근강도",
    "no": "012",
    "item": "철근 강도에 따른 정착/이음값 오류\n확인",
    "method": "구조일반사항 및 구조계산서 검토",
    "owner": "산출 담당자",
    "targets": [
      "산출 담당자"
    ],
    "creator": "QC TEAM",
    "createdAt": "2026-04-29 09:00",
    "comment": "",
    "attachments": []
  },
  {
    "group": "자가검토 체크리스트(QC)",
    "trade": "내진철근",
    "no": "013",
    "item": "내진철근 적용 유무 확인",
    "method": "SD400S, SD500S, SD600S 등의 표현 유무\n확인",
    "owner": "산출 담당자",
    "targets": [
      "산출 담당자"
    ],
    "creator": "QC TEAM",
    "createdAt": "2026-04-29 09:00",
    "comment": "",
    "attachments": []
  },
  {
    "group": "자가검토 체크리스트(QC)",
    "trade": "기둥",
    "no": "015",
    "item": "기초두께 입력시 이음 산출 유무\n확인",
    "method": "산출식 확인 후 기초두께 입력 시 주근 이음\n산출 여부 검토",
    "owner": "산출 담당자",
    "targets": [
      "산출 담당자"
    ],
    "creator": "QC TEAM",
    "createdAt": "2026-04-29 09:00",
    "comment": "",
    "attachments": []
  },
  {
    "group": "제출자료 검토사항(PM)",
    "trade": "기초",
    "no": "014",
    "item": "버림두께 확인",
    "method": "건축단면도 기준 적용. 미표현 시 60mm 적용",
    "owner": "산출 담당자",
    "targets": [
      "산출 담당자"
    ],
    "creator": "PM",
    "createdAt": "2026-04-29 09:00",
    "comment": "",
    "attachments": []
  },
  {
    "group": "제출자료 검토사항(PM)",
    "trade": "보",
    "no": "016",
    "item": "각 층별 슬라브 두께별 공제 확인",
    "method": "산출내용 재확인",
    "owner": "산출 담당자",
    "targets": [
      "산출 담당자"
    ],
    "creator": "PM",
    "createdAt": "2026-04-29 09:00",
    "comment": "",
    "attachments": []
  },
  {
    "group": "제출자료 검토사항(PM)",
    "trade": "슬라브",
    "no": "017",
    "item": "부호별 데크타입 오류 확인",
    "method": "RC 평면자료를 Excel 변환 후 필터로\n데크부호별 코드입력 체크",
    "owner": "산출 담당자",
    "targets": [
      "산출 담당자"
    ],
    "creator": "PM",
    "createdAt": "2026-04-29 09:00",
    "comment": "",
    "attachments": []
  },
  {
    "group": "제출자료 검토사항(PM)",
    "trade": "옹벽",
    "no": "018",
    "item": "옹벽 상부 슬라브 또는 보 공제값\n오류 체크",
    "method": "RC 프로그램 산식 확인",
    "owner": "산출 담당자",
    "targets": [
      "산출 담당자"
    ],
    "creator": "PM",
    "createdAt": "2026-04-29 09:00",
    "comment": "",
    "attachments": []
  },
  {
    "group": "제출자료 검토사항(PM)",
    "trade": "보",
    "no": "022",
    "item": "B2G1 늑근 간격 150mm가 아닌\n300mm로 잘못 산출 됨",
    "method": "배근의 전반적인 검토가 필요함.",
    "owner": "산출 담당자",
    "targets": [
      "산출 담당자"
    ],
    "creator": "PM",
    "createdAt": "2026-04-29 18:29",
    "comment": "",
    "attachments": []
  },
  {
    "group": "최종자료 검토사항(QC)",
    "trade": "계수",
    "no": "023",
    "item": "유사 프로젝트 대비 콘크리트 계수\n확인",
    "method": "비슷한 형태의 프로젝트를 찾아 콘크리트\n계수가 비슷한지 확인 해 주세요",
    "owner": "PM, 산출 담당자",
    "targets": [
      "PM",
      "산출 담당자"
    ],
    "creator": "QC TEAM",
    "createdAt": "2026-04-29 18:32",
    "comment": "",
    "attachments": []
  },
  {
    "group": "최종자료 검토사항(QC)",
    "trade": "계수",
    "no": "024",
    "item": "유사프로젝트 거푸집 계수 검토",
    "method": "비슷한 형식의 프로젝트를 찾아 거푸집 계수\n확인을 해 주세요",
    "owner": "PM, 산출 담당자",
    "targets": [
      "PM",
      "산출 담당자"
    ],
    "creator": "QC TEAM",
    "createdAt": "2026-04-29 18:32",
    "comment": "",
    "attachments": []
  },
  {
    "group": "최종자료 검토사항(QC)",
    "trade": "계수",
    "no": "025",
    "item": "유사 프로젝트 대비 철근 계수 검토",
    "method": "비슷한 유형의 프로젝트를 찾아서 계수 검토\n해 주세요",
    "owner": "PM, 산출 담당자",
    "targets": [
      "PM",
      "산출 담당자"
    ],
    "creator": "QC TEAM",
    "createdAt": "2026-04-29 18:33",
    "comment": "",
    "attachments": []
  },
  {
    "group": "Z1. 질의사항(1차)",
    "trade": "동구분",
    "no": "026",
    "item": "구조 작업 상 실 구분으로 이뤄진\n경우 하나의 동으로 포함 산출\n※ APT\n- 주동부 지상(6401~6405 각\n동별 산출)\n- 주동부 PIT(6401~6405 각\n동별 산출)\n※ 주차장\n- 주차장+기계실\n※ 부대시설\n- 경로당\n- 어린이집\n- 다함께돌봄센터+작은도서관\n- 지역편의시설1+2+피트니스\n- 지역편의시설3\n- 자원봉사관+관리사무소\n- 게스트하우스+파티룸\n- 경비실1+키즈스테이션+문주\n- 경비실2\n- 근린생활시설",
    "method": "동 구분 확인 후 반영 예정",
    "owner": "PM",
    "targets": [
      "PM"
    ],
    "creator": "PM",
    "createdAt": "2026-04-30 09:51",
    "comment": "발주처 우선 송부 필요",
    "attachments": []
  },
  {
    "group": "Z1. 질의사항(1차)",
    "trade": "동바리",
    "no": "027",
    "item": "기준서 기준에 따르면 전이보를\n포함한 높이를 시스템으로\n작업하는 것으로 보이는데, 아래와\n같은 경우 산출기준 확인\n바랍니다.\n① 빨간색 영역 전체(전이보 밑면\n중복 계산)를 시스템(5.85m)산출\n② 보밑면 면적(초록색)무시하고\n빨간색 영역 전체 시스템(5.85m)\n산출\n③ 초록색 영역을 제외한 나머지\n영역 5.85m, 초록색 하부 5.15m\n상부 공간(빨간색 걸침영역)\n강관 산출",
    "method": "답변 후 적용",
    "owner": "PM",
    "targets": [
      "PM"
    ],
    "creator": "산출 담당자",
    "createdAt": "2026-04-30 09:53",
    "comment": "",
    "attachments": [
      {
        "name": "동바리_질의첨부.png",
        "dataUrl": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNDAiIGhlaWdodD0iMTgwIiB2aWV3Qm94PSIwIDAgMjQwIDE4MCI+CiAgPHJlY3Qgd2lkdGg9IjI0MCIgaGVpZ2h0PSIxODAiIHJ4PSIxOCIgZmlsbD0iIzBmMTcyYSIvPgogIDxyZWN0IHg9IjE4IiB5PSIxOCIgd2lkdGg9IjIwNCIgaGVpZ2h0PSIxNDQiIHJ4PSIxMiIgZmlsbD0iIzExMTgyNyIgc3Ryb2tlPSIjMjU2M2ViIiBzdHJva2Utd2lkdGg9IjQiLz4KICA8dGV4dCB4PSIxMjAiIHk9IjgyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjIiIGZvbnQtd2VpZ2h0PSI3MDAiIGZpbGw9IiNmZmZmZmYiPuuPmeuwlOumrDwvdGV4dD4KICA8dGV4dCB4PSIxMjAiIHk9IjExMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iNzAwIiBmaWxsPSIjOTNjNWZkIj7sp4jsnZgg7LKo67aAPC90ZXh0Pgo8L3N2Zz4=",
        "addedBy": "산출 담당자",
        "addedAt": "2026-04-30 09:53"
      }
    ]
  },
  {
    "group": "Z7. 견적조건(최종)",
    "trade": "옥탑장식물",
    "no": "028",
    "item": "옥탑장식물 표기가 건축입면도 외\n확인이 되지 않습니다.\n옥탑장식물에 대한 도면 제공이\n가능한지 확인 바랍니다.",
    "method": "우선 임의 반영.",
    "owner": "PM",
    "targets": [
      "PM"
    ],
    "creator": "산출 담당자",
    "createdAt": "2026-04-30 10:01",
    "comment": "",
    "attachments": [
      {
        "name": "옥탑장식물_견적조건첨부.png",
        "dataUrl": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNDAiIGhlaWdodD0iMTgwIiB2aWV3Qm94PSIwIDAgMjQwIDE4MCI+CiAgPHJlY3Qgd2lkdGg9IjI0MCIgaGVpZ2h0PSIxODAiIHJ4PSIxOCIgZmlsbD0iIzBmMTcyYSIvPgogIDxyZWN0IHg9IjE4IiB5PSIxOCIgd2lkdGg9IjIwNCIgaGVpZ2h0PSIxNDQiIHJ4PSIxMiIgZmlsbD0iIzExMTgyNyIgc3Ryb2tlPSIjMjU2M2ViIiBzdHJva2Utd2lkdGg9IjQiLz4KICA8dGV4dCB4PSIxMjAiIHk9IjgyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjIiIGZvbnQtd2VpZ2h0PSI3MDAiIGZpbGw9IiNmZmZmZmYiPuyYpe2DkeyepeyLneusvDwvdGV4dD4KICA8dGV4dCB4PSIxMjAiIHk9IjExMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iNzAwIiBmaWxsPSIjOTNjNWZkIj7qsqzsoIHsobDqsbQg7LKo67aAPC90ZXh0Pgo8L3N2Zz4=",
        "addedBy": "산출 담당자",
        "addedAt": "2026-04-30 10:01"
      }
    ]
  }
];
// QC 체크리스트 더미데이터가 기존 브라우저 저장값에 덮이지 않도록 초기 표시용 저장값만 제거
try {
  localStorage.removeItem("qcChecklistRows");
  localStorage.removeItem("checklistRows");
  localStorage.removeItem("workQcChecklistRows");
} catch (e) {}


const checklistStatuses = ["진행전", "진행중", "확인완료", "PM 검토", "수정요청", "최종완료"];
const checklistOwners = ["QC TEAM", "PM", "산출 담당자", "실장", "본부장", "경영지원"];

function switchTopModule(moduleName) {
  document.querySelectorAll(".module-view").forEach(view => view.classList.remove("active"));
  document.querySelectorAll("[data-module-tab]").forEach(tab => tab.classList.remove("active"));

  const support = document.getElementById("supportModule");
  const work = document.getElementById("workModule");
  const mail = document.getElementById("mailModule");

  if (moduleName === "mail") {
    mail?.classList.add("active");
    document.querySelector('[data-module-tab="mail"]')?.classList.add("active");
    renderMailInbox(currentMailFilter || "전체");
    return;
  }

  if (moduleName === "work") {
    work?.classList.add("active");
    document.querySelector('[data-module-tab="work"]')?.classList.add("active");

    const activeWork = document.querySelector("[data-work-main].active");
    switchWorkPanel(activeWork?.dataset.workMain || "projectReceive");
  } else {
    support?.classList.add("active");
    document.querySelector('[data-module-tab="support"]')?.classList.add("active");
  }
}

let currentMailFilter = "전체";
let currentMailBox = "inbox";
let reviewNotificationRead = false;

function getChecklistReviewRequestRows() {
  const projectInput = document.getElementById("checklistProject");
  const fallbackProject = projectInput?.value || "ㅇㅇ시설 신축공사";
  return checklistRows
    .map((row, realIndex) => ({ row: normalizeChecklistRow(row), realIndex }))
    .filter(({ row }) => normalizeChecklistGroupName(row.group) === "제출자료 검토사항(PM)")
    .map(({ row, realIndex }) => {
      const itemText = String(row.item || "검토항목").replace(/\s+/g, " ").trim();
      return {
        id: `review-${realIndex}`,
        type: "검토요청",
        project: row.project || fallbackProject,
        sender: row.creator || "PM",
        title: `${row.project || fallbackProject} 검토요청_${itemText}`,
        item: row.item || "-",
        method: row.method || "-",
        trade: row.trade || "-",
        no: row.no || "-",
        targets: getChecklistTargets(row).join(", ") || "산출 담당자",
        createdAt: row.createdAt || "2026-04-29 09:00",
        comment: row.comment || "",
        rowIndex: realIndex
      };
    });
}

function getMailItems() {
  const reviewRequests = getChecklistReviewRequestRows();
  const projectName = document.getElementById("checklistProject")?.value || "ㅇㅇ시설 신축공사";
  const staticMails = [
    {
      id: "mail-checklist-001",
      type: "체크리스트",
      sender: "QC TEAM",
      title: `${projectName} 체크리스트 확인 요청`,
      createdAt: "2026-04-29 09:00",
      item: "프로젝트 수주 시점 체크리스트",
      method: "체크리스트 구분별 확인 필요",
      comment: ""
    },
    {
      id: "mail-question-001",
      type: "질의사항",
      sender: "PM",
      title: `${projectName} 질의사항(1차) 확인 요청`,
      createdAt: "2026-04-30 13:00",
      item: "동구분 관련 질의사항",
      method: "발주처 회신 후 반영 예정",
      comment: ""
    },
    {
      id: "mail-delivery-001",
      type: "납품메일",
      sender: "PM",
      title: `${projectName} 납품자료 송부 확인`,
      createdAt: "2026-04-30 15:30",
      item: "납품자료 체크",
      method: "송부 전 최종 확인",
      comment: ""
    }
  ];
  return [...reviewRequests, ...staticMails];
}

function setMailBox(boxName) {
  currentMailBox = boxName || "inbox";
  document.querySelectorAll("[data-mail-box]").forEach(btn => btn.classList.toggle("active", btn.dataset.mailBox === currentMailBox));
  renderMailInbox(currentMailFilter || "전체");
}

function clearMailFilters() {
  const search = document.getElementById("mailSearchInput");
  const project = document.getElementById("mailProjectFilter");
  const tag = document.getElementById("mailTagFilter");
  if (search) search.value = "";
  if (project) project.value = "전체";
  if (tag) tag.value = "전체";
  renderMailInbox("전체");
}

function getFilteredMailItems(filter = "전체") {
  const searchValue = (document.getElementById("mailSearchInput")?.value || "").trim().toLowerCase();
  const projectValue = document.getElementById("mailProjectFilter")?.value || "전체";
  const tagValue = document.getElementById("mailTagFilter")?.value || "전체";

  let items = getMailItems();
  if (currentMailBox && currentMailBox !== "inbox") items = [];
  if (filter !== "전체") items = items.filter(mail => mail.type === filter);
  if (tagValue !== "전체") items = items.filter(mail => mail.type === tagValue);
  if (projectValue !== "전체") items = items.filter(mail => (mail.project || "").includes(projectValue));
  if (searchValue) {
    items = items.filter(mail => [mail.sender, mail.title, mail.item, mail.method, mail.project, mail.type]
      .join(" ").toLowerCase().includes(searchValue));
  }
  return items;
}

function renderMailInbox(filter = "전체") {
  currentMailFilter = filter;
  document.querySelectorAll(".mail-filter").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mailFilter === filter);
  });

  const list = document.getElementById("mailInboxList");
  const badge = document.getElementById("mailCountBadge");
  const sideCount = document.getElementById("mailInboxSideCount");
  if (!list) return;

  const inboxTotal = getMailItems().length;
  if (sideCount) sideCount.textContent = inboxTotal;

  const items = getFilteredMailItems(filter);
  if (badge) badge.textContent = `이메일 1~${items.length}개 표시 / 총 ${items.length}개`;

  if (!items.length) {
    list.innerHTML = `<tr><td colspan="5"><div class="empty-mail-box">표시할 메일이 없습니다.</div></td></tr>`;
    return;
  }

  list.innerHTML = items.map(mail => `
    <tr class="mail-row ${mail.type === "검토요청" ? "review-mail" : ""}" onclick="openMailDetail('${escapeJs(mail.id)}')">
      <td class="mail-star-col">☆</td>
      <td><strong>${escapeHtml(mail.sender)}</strong></td>
      <td><span class="mail-type-chip ${mail.type === "검토요청" ? "review" : ""}">${escapeHtml(mail.type)}</span></td>
      <td>
        <div class="mail-subject-line">
          <strong>${escapeHtml(mail.title)}</strong>
          <span>${escapeHtml(mail.method || mail.item || "")}</span>
        </div>
      </td>
      <td class="mail-time-cell">${escapeHtml(formatMailTime(mail.createdAt))}</td>
    </tr>
  `).join("");
}

function formatMailTime(value) {
  const text = String(value || "");
  if (!text) return "-";
  const datePart = text.split(" ")[0];
  return datePart.replace(/^2026-/, "").replace(/-/g, "/");
}

function openMailDetail(mailId) {
  const mail = getMailItems().find(item => item.id === mailId);
  if (!mail) return;
  if (mail.type === "검토요청") {
    openReviewNotificationPanel(mail.rowIndex);
    return;
  }
  showToast(`${mail.title} 메일을 열었습니다.`);
}

function openReviewNotificationPanel(focusRowIndex = null) {
  const panel = document.getElementById("reviewNotificationPanel");
  const list = document.getElementById("reviewNotificationList");
  if (!panel || !list) return;

  let requests = getChecklistReviewRequestRows();
  if (focusRowIndex !== null && focusRowIndex !== undefined) {
    const focused = requests.find(item => String(item.rowIndex) === String(focusRowIndex));
    if (focused) requests = [focused, ...requests.filter(item => item.rowIndex !== focused.rowIndex)];
  }

  list.innerHTML = requests.length ? requests.slice(0, 6).map(req => `
    <article class="review-popover-item" onclick="switchTopModule('mail'); renderMailInbox('검토요청'); closeReviewNotificationPanel();">
      <div class="review-popover-title">
        <strong>${escapeHtml(req.title)}</strong>
        <span>검토요청</span>
      </div>
      <p>${escapeHtml(req.method || req.item || "")}</p>
      <small>${escapeHtml(req.createdAt)} · 발신자 ${escapeHtml(req.sender)}</small>
    </article>
  `).join("") : `<div class="empty-mail-box">도착한 검토 요청이 없습니다.</div>`;

  panel.classList.toggle("active");
}

function closeReviewNotificationPanel() {
  document.getElementById("reviewNotificationPanel")?.classList.remove("active");
}

function markReviewNotificationsRead() {
  reviewNotificationRead = true;
  closeReviewNotificationPanel();
  updateBellReviewCount();
}

function updateBellReviewCount() {
  const bell = document.querySelector(".bell");
  if (!bell) return;
  const count = reviewNotificationRead ? 0 : getChecklistReviewRequestRows().length;
  bell.setAttribute("data-count", String(count));
  bell.classList.toggle("has-count", count > 0);
  bell.title = `검토 요청 알림 ${count}건`;
}


function switchWorkPanel(panelId) {
  const targetPanelId = panelId || "projectReceive";

  document.querySelectorAll(".work-panel").forEach(panel => panel.classList.remove("active"));
  document.querySelectorAll("[data-work-main]").forEach(btn => btn.classList.remove("active"));

  document.getElementById(targetPanelId)?.classList.add("active");
  document.querySelector(`[data-work-main="${targetPanelId}"]`)?.classList.add("active");

  const meta = workPageMeta[targetPanelId] || workPageMeta.projectReceive;
  setText("workPageTitle", meta[0]);
  setText("workPageDesc", meta[1]);

  if (targetPanelId === "qcReview" || targetPanelId === "quantityChecklist") {
    renderChecklistCategoryButtons();
    renderChecklistGrid();
  }
}


function getChecklistCreatorByGroup(group) {
  const normalized = normalizeChecklistGroupName(group);
  const creatorMap = {
    "프로젝트 수주 시점(PM,작업자,발주처 송부용)": "QC TEAM",
    "QC팀 전달사항(유형 및 특이사항 관리)": "QC TEAM",
    "작업 착수 전 확인 필요사항(PM)": "PM",
    "작업 진행 중 추가 전달사항(PM)": "PM",
    "자가검토 체크리스트(QC)": "QC TEAM",
    "제출자료 검토사항(PM)": "PM",
    "최종자료 검토사항(QC)": "QC TEAM"
  };
  return creatorMap[normalized] || "경영지원";
}

function getChecklistTargetsByGroup(group) {
  const normalized = normalizeChecklistGroupName(group);
  const targetMap = {
    "프로젝트 수주 시점(PM,작업자,발주처 송부용)": ["PM"],
    "작업 착수 전 확인 필요사항(PM)": ["산출 담당자"],
    "자가검토 체크리스트(QC)": ["산출 담당자"],
    "제출자료 검토사항(PM)": ["산출 담당자"]
  };
  return targetMap[normalized] || null;
}

function isObjectionAllowedRow(row) {
  return normalizeChecklistGroupName(row?.group) === "제출자료 검토사항(PM)";
}

function ensureChecklistAttachments(row) {
  if (!Array.isArray(row.attachments)) row.attachments = [];
  if (!Array.isArray(row.objectionFiles)) row.objectionFiles = [];
}

function renderChecklistAttachmentCell(row, realIndex) {
  ensureChecklistAttachments(row);
  const attachments = Array.isArray(row.attachments) ? row.attachments : [];

  if (!attachments.length) {
    return `<div class="attachment-cell readonly-attachment-cell"><div class="attach-count">첨부 없음</div></div>`;
  }

  const thumbs = attachments.map((file, idx) => {
    const src = getAttachmentImageSource(file);
    const name = file.name || `첨부 이미지 ${idx + 1}`;
    return `
      <button class="attach-thumb" type="button" onclick="openChecklistAttachmentImage(${realIndex}, ${idx})" title="${escapeHtml(name)}">
        <img src="${escapeHtml(src)}" alt="${escapeHtml(name)}">
      </button>
    `;
  }).join("");

  return `
    <div class="attachment-cell readonly-attachment-cell">
      <button type="button" class="attach-count-btn" onclick="openChecklistAttachmentGallery(${realIndex})">${attachments.length}개 첨부</button>
      <div class="attach-thumb-list">${thumbs}</div>
    </div>
  `;
}

function addChecklistAttachments(index, files) {
  const row = checklistRows[index];
  if (!row || !files || !files.length) return;
  normalizeChecklistRow(row);
  ensureChecklistAttachments(row);
  const fileList = Array.from(files).filter(file => file.type.startsWith("image/"));
  if (!fileList.length) {
    showToast("이미지 파일만 첨부할 수 있습니다.");
    return;
  }
  let loaded = 0;
  fileList.forEach(file => {
    const reader = new FileReader();
    reader.onload = event => {
      row.attachments.push({ name: file.name, dataUrl: event.target.result, addedAt: getChecklistTimeText(), addedBy: getCurrentWorkerName() });
      loaded += 1;
      if (loaded === fileList.length) {
        row.history.push({ action: "사진첨부", worker: getCurrentWorkerName(), time: getChecklistTimeText() });
        renderChecklistGrid();
        showToast(`${fileList.length}개 사진을 첨부했습니다.`);
      }
    };
    reader.readAsDataURL(file);
  });
}

function openImagePreview(src, title = "첨부 이미지") {
  openAttachmentImageWindow(src || makeAttachmentFallbackImage(title), title);
}

let pendingObjectionFiles = [];

function openObjectionModal(index) {
  const row = checklistRows[index];
  if (!row) return;
  normalizeChecklistRow(row);
  if (!isObjectionAllowedRow(row)) return;
  document.getElementById("objectionRowIndex").value = String(index);
  document.getElementById("objectionText").value = row.objection?.text || "";
  document.getElementById("objectionPreview").innerHTML = (row.objectionFiles || []).map(file => `<div class="attach-preview"><img src="${file.dataUrl}" alt="${escapeHtml(file.name)}"><span>${escapeHtml(file.name)}</span></div>`).join("");
  pendingObjectionFiles = [];
  document.getElementById("objectionModal")?.classList.add("active");
}

function closeObjectionModal() {
  document.getElementById("objectionModal")?.classList.remove("active");
  const files = document.getElementById("objectionFiles");
  if (files) files.value = "";
  pendingObjectionFiles = [];
}

function previewObjectionFiles(input) {
  pendingObjectionFiles = [];
  const preview = document.getElementById("objectionPreview");
  if (preview) preview.innerHTML = "";
  const files = Array.from(input.files || []).filter(file => file.type.startsWith("image/"));
  if (!files.length) return;
  let loaded = 0;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = event => {
      pendingObjectionFiles.push({ name: file.name, dataUrl: event.target.result, addedAt: getChecklistTimeText(), addedBy: getCurrentWorkerName() });
      if (preview) {
        preview.insertAdjacentHTML("beforeend", `<div class="attach-preview"><img src="${event.target.result}" alt="${escapeHtml(file.name)}"><span>${escapeHtml(file.name)}</span></div>`);
      }
      loaded += 1;
    };
    reader.readAsDataURL(file);
  });
}

function saveObjectionModal() {
  const index = Number(document.getElementById("objectionRowIndex")?.value);
  const row = checklistRows[index];
  if (!row) return;
  normalizeChecklistRow(row);
  const text = document.getElementById("objectionText")?.value.trim() || "";
  row.objection = {
    text,
    by: getCurrentWorkerName(),
    at: getChecklistTimeText(),
    accepted: false
  };
  row.objectionFiles = [...(row.objectionFiles || []), ...pendingObjectionFiles];
  row.history.push({ action: "이의제기", worker: row.objection.by, time: row.objection.at });
  closeObjectionModal();
  renderChecklistGrid();
  showToast("이의제기가 저장되었습니다.");
}

function toggleObjectionDetail(index) {
  const row = checklistRows[index];
  if (!row) return;
  row.showObjection = !row.showObjection;
  renderChecklistGrid();
}

function acceptObjectionAndEliminate(index) {
  const row = checklistRows[index];
  if (!row || !row.objection) return;
  normalizeChecklistRow(row);
  row.objection.accepted = true;
  row.eliminated = true;
  row.history.push({ action: "이의제기 인정·소거", worker: getCurrentWorkerName(), time: getChecklistTimeText() });
  renderChecklistGrid();
  showToast("이의제기 인정으로 해당 검토사항을 소거 처리했습니다.");
}

function renderObjectionArea(row, realIndex) {
  if (!isObjectionAllowedRow(row)) return "";
  const hasObjection = !!row.objection;
  const detail = hasObjection && row.showObjection ? `
    <div class="objection-detail-box">
      <strong>이의제기 내용</strong>
      <p>${escapeHtml(row.objection.text || "내용 없음")}</p>
      <small>${escapeHtml(row.objection.by)} · ${escapeHtml(row.objection.at)}</small>
      <div class="attach-thumb-list objection-thumbs">
        ${(row.objectionFiles || []).map(file => `<button class="attach-thumb" type="button" onclick="openImagePreview('${escapeJs(file.dataUrl)}')"><img src="${file.dataUrl}" alt="${escapeHtml(file.name)}"></button>`).join("")}
      </div>
      <button class="btn btn-line" onclick="acceptObjectionAndEliminate(${realIndex})">이의 인정 · 소거</button>
    </div>
  ` : "";
  return `
    <div class="objection-area">
      <button class="btn-objection" onclick="openObjectionModal(${realIndex})">이의제기</button>
      ${hasObjection ? `<button class="btn btn-line btn-mini" onclick="toggleObjectionDetail(${realIndex})">${row.showObjection ? "접기" : "내용보기"}</button>` : ""}
      ${detail}
    </div>
  `;
}


function normalizeSpecialChecklistCreator(row) {
  const group = normalizeChecklistGroupName(row.group);
  const no = String(row.no || "");

  if (group === "Z1. 질의사항(1차)" && no === "026") {
    row.creator = "PM";
    row.createdBy = "PM";
  }

  if (group === "Z1. 질의사항(1차)" && no === "027") {
    row.creator = "산출 담당자";
    row.createdBy = "산출 담당자";
  }

  if (group === "Z7. 견적조건(최종)" && no === "028") {
    row.creator = "산출 담당자";
    row.createdBy = "산출 담당자";
  }

  if (Array.isArray(row.history)) {
    row.history = row.history.map(history => {
      if (history && history.action === "최초작성") {
        return { ...history, worker: row.creator || row.createdBy || history.worker };
      }
      return history;
    });
  }

  return row;
}


function normalizeChecklistRow(row) {
  if (!row) return row;
  row.group = normalizeChecklistGroupName(row.group);
  row.project = row.project || "ㅇㅇ시설 신축공사";
  normalizeSpecialChecklistCreator(row);
  row.creator = getChecklistCreatorByGroup(row.group);
  if (!row.createdAt) row.createdAt = "2026-04-29 09:00";
  ensureChecklistAttachments(row);
  row.history = Array.isArray(row.history) ? row.history : [];
  row.history = row.history.filter(h => h.action !== "최초작성");
  row.history.push({ action: "최초작성", worker: row.creator, time: row.createdAt });

  const groupTargets = getChecklistTargetsByGroup(row.group);
  if (groupTargets) {
    row.targets = [...groupTargets];
  } else if (!Array.isArray(row.targets) || !row.targets.length) {
    row.targets = String(row.owner || "QC TEAM").split(/[,/]/).map(v => v.trim()).filter(Boolean);
  }

  if (!Array.isArray(row.checks)) row.checks = [];
  row.targets.forEach(target => {
    if (!row.checks.some(c => c.target === target)) row.checks.push({ target, done: false, checkedBy: "", checkedAt: "" });
  });
  row.checks = row.checks.filter(c => row.targets.includes(c.target));
  row.owner = row.targets.join(", ");
  row.done = isChecklistRowDone(row);
  row.status = row.done ? "확인완료" : getChecklistDoneState(row);
  return normalizeSpecialChecklistCreator(row);}

function getChecklistDoneState(row) {
  const checks = Array.isArray(row?.checks) ? row.checks : [];
  if (!checks.length || checks.every(c => !c.done)) return "미확인";
  if (checks.every(c => c.done)) return "확인완료";
  return "부분완료";
}

function isChecklistRowDone(row) {
  const checks = Array.isArray(row?.checks) ? row.checks : [];
  return checks.length > 0 && checks.every(c => c.done);
}

function getChecklistTargets(row) {
  normalizeChecklistRow(row);
  return Array.isArray(row.targets) ? row.targets : [];
}


function getChecklistCategoryLabel(category) {
  if (category === "전체") return "전체보기";
  return category;
}

function setChecklistCategoryFilter(category) {
  selectedChecklistCategoryFilter = category || "전체";
  checklistCategoryPanelOpen = false;
  renderChecklistGrid();
}

function toggleChecklistCategoryPanel() {
  checklistCategoryPanelOpen = !checklistCategoryPanelOpen;
  renderChecklistCategoryButtons();
}

function getVisibleChecklistGroups() {
  const groups = [];
  getChecklistFilteredRows().forEach(({ row }) => {
    const group = normalizeChecklistGroupName(row.group);
    if (!groups.includes(group)) groups.push(group);
  });
  return groups;
}

function areAllVisibleChecklistGroupsCollapsed() {
  const groups = getVisibleChecklistGroups();
  return groups.length > 0 && groups.every(group => collapsedChecklistGroups.has(group));
}

function toggleChecklistDetailVisibility() {
  if (areAllVisibleChecklistGroupsCollapsed()) {
    expandAllChecklistGroups();
  } else {
    collapseAllChecklistGroups();
  }
}

function toggleChecklistGroupCollapse(group) {
  const normalized = normalizeChecklistGroupName(group);
  if (collapsedChecklistGroups.has(normalized)) {
    collapsedChecklistGroups.delete(normalized);
  } else {
    collapsedChecklistGroups.add(normalized);
  }
  renderChecklistGrid();
}

function expandAllChecklistGroups() {
  collapsedChecklistGroups.clear();
  renderChecklistGrid();
}

function collapseAllChecklistGroups() {
  getChecklistFilteredRows().forEach(({ row }) => collapsedChecklistGroups.add(normalizeChecklistGroupName(row.group)));
  renderChecklistGrid();
}

function renderChecklistCategoryButtons() {
  const wrap = document.getElementById("checklistCategoryFilter");
  if (!wrap) return;

  const categoryCounts = checklistCategoryOptions.reduce((acc, category) => {
    acc[category] = checklistRows.filter(row => normalizeChecklistGroupName(row.group) === category).length;
    return acc;
  }, {});

  const visibleCategories = checklistCategoryOptions.filter(category => categoryCounts[category] > 0);
  const categories = ["전체", ...visibleCategories];

  if (selectedChecklistCategoryFilter !== "전체" && !visibleCategories.includes(selectedChecklistCategoryFilter)) {
    selectedChecklistCategoryFilter = "전체";
  }

  const activeLabel = getChecklistCategoryLabel(selectedChecklistCategoryFilter);
  const activeCount = selectedChecklistCategoryFilter === "전체" ? checklistRows.length : (categoryCounts[selectedChecklistCategoryFilter] || 0);
  const optionButtons = categories.map(category => {
    const active = selectedChecklistCategoryFilter === category ? "active" : "";
    const count = category === "전체" ? checklistRows.length : categoryCounts[category];
    return `<button type="button" class="category-filter-btn ${active}" onclick="setChecklistCategoryFilter('${escapeJs(category)}')"><span class="category-name">${escapeHtml(getChecklistCategoryLabel(category))}</span><span class="category-count">${count}</span></button>`;
  }).join("");

  const allVisibleCollapsed = areAllVisibleChecklistGroupsCollapsed();
  const detailButtonLabel = allVisibleCollapsed ? "펼치기" : "접기";
  const detailButtonTitle = allVisibleCollapsed ? "현재 조회된 구분의 세부 항목을 모두 펼칩니다." : "현재 조회된 구분의 세부 항목을 모두 숨기고 구분명만 표시합니다.";

  wrap.innerHTML = `
    <div class="checklist-filter-shell ${checklistCategoryPanelOpen ? "open" : ""}">
      <div class="checklist-filter-summary" onclick="toggleChecklistCategoryPanel()" title="클릭하면 구분 선택 목록을 열고 닫습니다.">
        <div class="filter-summary-main">
          <span class="filter-summary-label">구분 필터</span>
          <strong>${escapeHtml(activeLabel)}</strong>
          <em>${activeCount}건</em>
        </div>
        <div class="filter-summary-actions">
          <button type="button" class="category-filter-reset ${selectedChecklistCategoryFilter === "전체" ? "disabled" : ""}" onclick="event.stopPropagation(); setChecklistCategoryFilter('전체')">전체보기</button>
          <button type="button" class="category-filter-toggle ${checklistCategoryPanelOpen ? "active" : ""}" onclick="event.stopPropagation(); toggleChecklistCategoryPanel()">구분 선택 <span>${checklistCategoryPanelOpen ? "닫기" : "열기"}</span></button>
          <button type="button" class="category-detail-toggle ${allVisibleCollapsed ? "expand" : "collapse"}" title="${detailButtonTitle}" onclick="event.stopPropagation(); toggleChecklistDetailVisibility()">${detailButtonLabel}</button>
        </div>
      </div>
      <div class="category-filter-panel ${checklistCategoryPanelOpen ? "open" : ""}">
        <div class="category-filter-grid">${optionButtons}</div>
      </div>
    </div>`;
}
function getChecklistFilteredRows() {
  checklistRows.forEach(normalizeChecklistRow);

  const project = (document.getElementById("checklistProject")?.value || "").trim();
  const owner = document.getElementById("checklistOwnerFilter")?.value || "전체";
  const doneFilter = document.getElementById("checklistDoneFilter")?.value || "전체";
  const search = (document.getElementById("checklistSearch")?.value || "").trim().toLowerCase();
  const scope = document.getElementById("checklistScopeFilter")?.value || "전체";
  const categoryFilter = selectedChecklistCategoryFilter || "전체";

  return checklistRows.map((row, realIndex) => ({ row, realIndex })).filter(({ row }) => {
    const targets = getChecklistTargets(row);
    const viewerRoles = getCurrentViewerRoles();
    const scopeOk = scope === "전체" || scope === "PM 이상 전체 현황" || targets.some(target => viewerRoles.includes(target));
    const rowProject = row.project || "ㅇㅇ시설 신축공사";
    const projectOk = !project || rowProject.includes(project) || project.includes(rowProject);
    const group = normalizeChecklistGroupName(row.group);
    const categoryOk = categoryFilter === "전체" || group === categoryFilter;
    const ownerOk = owner === "전체" || targets.includes(owner);
    const state = getChecklistDoneState(row);
    const doneOk = doneFilter === "전체" || state === doneFilter;
    const text = `${rowProject} ${row.group} ${row.trade} ${row.no} ${row.item} ${row.method} ${targets.join(" ")} ${state} ${row.comment}`.toLowerCase();

    return projectOk && categoryOk && ownerOk && doneOk && scopeOk && (!search || text.includes(search));
  });
}

function renderChecklistGrid() {
  renderChecklistAdminTemplateBox();
  renderChecklistCategoryButtons();
  const body = document.getElementById("checklistGridBody");
  if (!body) return;
  const rows = getChecklistFilteredRows().sort((a, b) => {
    const ai = checklistCategoryOptions.indexOf(a.row.group);
    const bi = checklistCategoryOptions.indexOf(b.row.group);
    const ag = ai < 0 ? 999 : ai;
    const bg = bi < 0 ? 999 : bi;
    if (ag !== bg) return ag - bg;
    return String(a.row.no).localeCompare(String(b.row.no), "ko", { numeric: true });
  });
  let lastGroup = "";
  body.innerHTML = rows.map(({ row, realIndex }) => {
    normalizeChecklistRow(row);
    const locked = isChecklistCategoryLocked(row.group);
    const normalizedGroup = normalizeChecklistGroupName(row.group);
    const isFirstInGroup = normalizedGroup !== lastGroup;
    const groupBand = isFirstInGroup ? renderChecklistGroupBand(normalizedGroup) : "";
    lastGroup = normalizedGroup;

    if (collapsedChecklistGroups.has(normalizedGroup)) {
      return groupBand;
    }

    return `${groupBand}
      <tr class="checklist-detail-row ${row.done ? "row-done" : ""} ${locked ? "locked-row" : ""} ${row.eliminated ? "eliminated-row" : ""}">
        <td><input type="checkbox" ${row.checked ? "checked" : ""} ${locked ? "disabled" : ""} onchange="updateChecklistCheck(${realIndex}, this.checked)" title="행 선택"></td>
        <td><div class="cell" ${locked ? "" : "contenteditable=\"true\""} onblur="updateChecklistCell(${realIndex}, 'trade', this.innerText)">${escapeHtml(row.trade)}</div></td>
        <td><div class="cell" ${locked ? "" : "contenteditable=\"true\""} onblur="updateChecklistCell(${realIndex}, 'no', this.innerText)">${escapeHtml(row.no)}</div></td>
        <td><div class="cell" ${locked ? "" : "contenteditable=\"true\""} onblur="updateChecklistCell(${realIndex}, 'item', this.innerText)">${escapeHtml(row.item)}</div></td>
        <td><div class="cell" ${locked ? "" : "contenteditable=\"true\""} onblur="updateChecklistCell(${realIndex}, 'method', this.innerText)">${escapeHtml(row.method)}</div></td>
        <td><div class="target-chip-list">${getChecklistTargets(row).map(t => `<span class="target-chip">${escapeHtml(t)}</span>`).join("")}</div></td>
        <td class="done-cell">${renderChecklistTargetChecks(row, realIndex)}</td>
        <td><div class="cell" ${locked ? "" : "contenteditable=\"true\""} onblur="updateChecklistCell(${realIndex}, 'comment', this.innerText)">${escapeHtml(row.comment)}</div></td>
        <td>${renderChecklistAttachmentCell(row, realIndex)}</td>
        <td><div class="feedback-cell ${row.feedback ? "has-feedback" : ""}"><button class="btn btn-line feedback-btn" onclick="applyChecklistFeedback(${realIndex})">${row.feedback ? "회신수정" : "회신입력"}</button>${row.feedback ? `<p>${escapeHtml(row.feedback)}</p><span>${escapeHtml(row.feedbackBy || "")} · ${escapeHtml(row.feedbackAt || "")}</span>` : `<span>회신/피드백 미반영</span>`}</div></td>
        <td><div class="history-cell">${renderChecklistHistory(row)}</div></td>
        <td><div class="row-actions"><button class="btn btn-line" ${locked ? "disabled" : ""} onclick="openChecklistModal(${realIndex})">수정</button><button class="btn btn-danger" ${locked ? "disabled" : ""} onclick="deleteChecklistRow(${realIndex})">삭제</button></div></td>
      </tr>`;
  }).join("");
  updateBellReviewCount();
}

function renderChecklistGroupBand(group) {
  group = normalizeChecklistGroupName(group);
  const isQuestion = isQuestionCategory(group);
  const isFinalEstimateCondition = group === "Z7. 견적조건(최종)";
  const locked = isChecklistCategoryLocked(group);
  const collapsed = collapsedChecklistGroups.has(group);
  const count = checklistRows.filter(row => normalizeChecklistGroupName(row.group) === group).length;
  const controls = [];

  if (group === firstCategoryName) {
    controls.push(`<button class="btn btn-line group-mini-btn" onclick="event.stopPropagation(); downloadFirstCategoryCsv();">발주처 송부용 엑셀 다운로드</button>`);
  }

  if (isQuestion || isFinalEstimateCondition) {
    controls.push(`<button class="btn btn-line group-mini-btn" onclick="event.stopPropagation(); downloadQuestionCategoryCsv('${escapeJs(group)}')">질의 엑셀</button>`);
  }

  if (isQuestion) {
    controls.push(`<button class="btn ${locked ? "btn-line" : "btn-primary"} group-mini-btn" ${locked ? "disabled" : ""} onclick="event.stopPropagation(); markQuestionCategorySent('${escapeJs(group)}')">${locked ? "송부완료" : "송부 완료 체크"}</button>`);
    const next = getNextQuestionCategory(group);
    if (locked && next) controls.push(`<span class="next-round-guide">다음 작성 가능: ${escapeHtml(next)}</span>`);
  }

  return `<tr class="group-separator-row ${locked ? "group-locked" : ""} ${collapsed ? "group-collapsed" : ""}" onclick="toggleChecklistGroupCollapse('${escapeJs(group)}')"><td colspan="11"><div class="group-band-inner"><div class="group-band-title"><button type="button" class="group-toggle-btn" aria-label="구분 접기 펼치기"><span class="group-toggle-icon">⌄</span></button><span>구분</span><strong>${escapeHtml(group)}</strong><em>${count}건</em>${locked ? `<b>잠금</b>` : ""}<small>${collapsed ? "클릭하여 펼치기" : "클릭하여 접기"}</small></div><div class="group-band-actions">${controls.join("")}</div></div></td></tr>`;
}

function renderChecklistTargetChecks(row, realIndex) {
  normalizeChecklistRow(row);
  const locked = isChecklistCategoryLocked(row.group);
  const checks = row.checks.map((check, checkIndex) => `
    <label class="done-check-wrap target-done-wrap" title="${escapeHtml(check.target)} 확인 체크">
      <input type="checkbox" ${check.done ? "checked" : ""} ${locked ? "disabled" : ""} onchange="toggleChecklistDone(${realIndex}, ${checkIndex}, this.checked)">
      <span>${escapeHtml(check.target)} · ${check.done ? "확인완료" : "미확인"}</span>
    </label>
  `).join("");
  return `${checks}${renderObjectionArea(row, realIndex)}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
}
function escapeJs(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
function getCurrentWorkerName() {
  return document.querySelector(".user")?.textContent?.trim() || "현재 작업자";
}

function getChecklistTimeText() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}


function formatHistoryBlock(worker, action, time) {
  const safeWorker = worker || "";
  const safeAction = action || "";
  const safeTime = time || "";

  const parts = String(safeTime).split(" ");
  const datePart = parts[0] || "";
  const timePart = parts.slice(1).join(" ") || "";

  return formatHistoryBlock(created.worker, created.action, created.time);
}

function renderChecklistHistory(row) {
  normalizeChecklistRow(row);
  const history = Array.isArray(row.history) ? row.history : [];
  if (!history.length) return `<span class="history-empty">이력 없음</span>`;
  return history.slice(-4).reverse().map(item => `
    <div class="history-line ${item.action === "최초작성" ? "created" : ""}"><strong>${escapeHtml(item.worker)}</strong><span>${escapeHtml(item.target ? item.action + "(" + item.target + ")" : item.action)} · ${escapeHtml(item.time)}</span></div>
  `).join("");
}

function toggleChecklistDone(index, checkIndex, checked) {
  const row = checklistRows[index];
  if (!row) return;
  normalizeChecklistRow(row);
  if (isChecklistCategoryLocked(row.group)) {
    showToast("송부 완료된 질의차수는 수정할 수 없습니다.");
    renderChecklistGrid();
    return;
  }
  const check = row.checks[checkIndex];
  if (!check) return;
  const worker = getCurrentWorkerName();
  const time = getChecklistTimeText();
  check.done = checked;
  check.checkedBy = checked ? worker : "";
  check.checkedAt = checked ? time : "";
  row.history = Array.isArray(row.history) ? row.history : [];
  row.history = row.history.filter(h => !(h.action === "확인완료" && h.target === check.target));
  if (checked) {
    row.history.push({ action: "확인완료", target: check.target, worker, time });
    showToast(`${row.no}번 항목의 ${check.target} 확인완료가 기록되었습니다.`);
  } else {
    showToast(`${row.no}번 항목의 ${check.target} 확인완료 로그를 제거했습니다.`);
  }
  row.done = isChecklistRowDone(row);
  row.status = getChecklistDoneState(row);
  renderChecklistGrid();
}

function updateChecklistCell(index, key, value) {
  if (!checklistRows[index]) return;
  normalizeChecklistRow(checklistRows[index]);
  if (isChecklistCategoryLocked(checklistRows[index].group)) {
    showToast("송부 완료된 질의차수는 수정할 수 없습니다.");
    renderChecklistGrid();
    return;
  }
  checklistRows[index][key] = key === "group" ? normalizeChecklistGroupName(value) : String(value).trim();
  if (key === "owner") {
    checklistRows[index].targets = String(value).split(/[,/]/).map(v => v.trim()).filter(Boolean);
    checklistRows[index].checks = [];
    normalizeChecklistRow(checklistRows[index]);
  }
}

function updateChecklistCheck(index, checked) { if (checklistRows[index]) checklistRows[index].checked = checked; }
function toggleAllChecklistRows(box) { getChecklistFilteredRows().forEach(({ realIndex }) => checklistRows[realIndex].checked = box.checked); renderChecklistGrid(); }
function nextChecklistNo() { const nums = checklistRows.map(r => Number(String(r.no).replace(/\D/g, ""))).filter(Boolean); return String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0"); }

function renderChecklistCategoryOptions(selectedGroup = "") {
  const select = document.getElementById("checklistModalGroup");
  if (!select) return;
  const current = normalizeChecklistGroupName(selectedGroup);
  select.innerHTML = checklistCategoryOptions.map(category => {
    const disabled = !canUseChecklistCategory(category, current);
    const label = isChecklistCategoryLocked(category) ? `${category} · 송부완료` : category;
    return `<option value="${escapeHtml(category)}" ${category === current ? "selected" : ""} ${disabled ? "disabled" : ""}>${escapeHtml(label)}</option>`;
  }).join("");
  if (current && checklistCategoryOptions.includes(current)) select.value = current;
}

function renderChecklistTargetOptions(selectedTargets = []) {
  const wrap = document.getElementById("checklistTargetChecks");
  if (!wrap) return;
  wrap.innerHTML = checklistOwners.map(owner => `
    <label class="target-option"><input type="checkbox" value="${escapeHtml(owner)}" ${selectedTargets.includes(owner) ? "checked" : ""}> <span>${escapeHtml(owner)}</span></label>
  `).join("");
}

function getSelectedChecklistTargets() {
  return Array.from(document.querySelectorAll('#checklistTargetChecks input[type="checkbox"]:checked')).map(input => input.value);
}


let checklistModalAttachments = [];

function renderChecklistModalAttachmentPreview() {
  const preview = document.getElementById("checklistModalPreview");
  if (!preview) return;
  if (!checklistModalAttachments.length) {
    preview.innerHTML = `<div class="empty-attach-box">첨부된 사진이 없습니다.</div>`;
    return;
  }
  preview.innerHTML = checklistModalAttachments.map((file, idx) => `
    <div class="attach-preview">
      <img src="${file.dataUrl}" alt="${escapeHtml(file.name)}" onclick="openImagePreview('${escapeJs(file.dataUrl)}')">
      <span>${escapeHtml(file.name)}</span>
      <button type="button" class="attach-remove-btn" onclick="removeChecklistModalAttachment(${idx})">제거</button>
    </div>
  `).join("");
}

function previewChecklistModalFiles(input) {
  const files = Array.from(input.files || []).filter(file => file.type.startsWith("image/"));
  if (!files.length) return;
  let loaded = 0;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      checklistModalAttachments.push({
        name: file.name,
        dataUrl: e.target.result,
        addedBy: getCurrentWorkerName(),
        addedAt: getChecklistTimeText()
      });
      loaded += 1;
      if (loaded === files.length) {
        renderChecklistModalAttachmentPreview();
        input.value = "";
      }
    };
    reader.readAsDataURL(file);
  });
}

function removeChecklistModalAttachment(index) {
  checklistModalAttachments.splice(index, 1);
  renderChecklistModalAttachmentPreview();
}

function openChecklistModal(index = null) {
  renderChecklistTargetOptions();
  const isEdit = Number.isInteger(index) && checklistRows[index];
  const row = isEdit ? normalizeChecklistRow(checklistRows[index]) : null;
  if (row && isChecklistCategoryLocked(row.group)) {
    showToast("송부 완료된 질의차수는 수정할 수 없습니다.");
    return;
  }
  setText("checklistModalTitle", isEdit ? "수량산출 체크리스트 수정" : "수량산출 체크리스트 추가");
  const editIndex = document.getElementById("checklistEditIndex");
  if (editIndex) editIndex.value = isEdit ? String(index) : "";
  const values = {
    checklistModalGroup: row?.group || firstCategoryName,
    checklistModalTrade: row?.trade || "",
    checklistModalNo: row?.no || nextChecklistNo(),
    checklistModalItem: row?.item || "",
    checklistModalMethod: row?.method || "",
    checklistModalComment: row?.comment || ""
  };
  Object.entries(values).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = value;
      el.classList.remove("invalid");
    }
  });
  renderChecklistCategoryOptions(row?.group || firstCategoryName);
  renderChecklistTargetOptions(row ? getChecklistTargets(row) : (getChecklistTargetsByGroup(firstCategoryName) || ["QC TEAM"]));
  document.getElementById("checklistTargetError")?.classList.remove("show");
  checklistModalAttachments = row?.attachments ? [...row.attachments] : [];
  renderChecklistModalAttachmentPreview();
  const fileInput = document.getElementById("checklistModalFiles");
  if (fileInput) fileInput.value = "";
  document.getElementById("checklistItemModal")?.classList.add("active");
}

function closeChecklistModal() {
  document.getElementById("checklistItemModal")?.classList.remove("active");
  checklistModalAttachments = [];
  const preview = document.getElementById("checklistModalPreview");
  if (preview) preview.innerHTML = "";
  const fileInput = document.getElementById("checklistModalFiles");
  if (fileInput) fileInput.value = "";
}

function saveChecklistModal() {
  const requiredIds = ["checklistModalGroup", "checklistModalTrade", "checklistModalItem", "checklistModalMethod"];
  let ok = true;
  requiredIds.forEach(id => {
    const el = document.getElementById(id);
    const valid = !!el?.value.trim();
    el?.classList.toggle("invalid", !valid);
    if (!valid) ok = false;
  });
  const targets = getSelectedChecklistTargets();
  const targetError = document.getElementById("checklistTargetError");
  if (!targets.length) {
    targetError?.classList.add("show");
    ok = false;
  } else {
    targetError?.classList.remove("show");
  }
  if (!ok) return;

  const selectedGroup = normalizeChecklistGroupName(document.getElementById("checklistModalGroup")?.value || "");
  const editIndexRaw = document.getElementById("checklistEditIndex")?.value || "";
  const editIndex = editIndexRaw === "" ? null : Number(editIndexRaw);
  const previous = Number.isInteger(editIndex) ? checklistRows[editIndex] : null;
  const previousGroup = previous ? normalizeChecklistGroupName(previous.group) : "";
  if (!canUseChecklistCategory(selectedGroup, previousGroup)) {
    showToast("이전 질의차수가 송부 완료되어야 다음 차수 작성이 가능하거나, 이미 송부 완료된 차수입니다.");
    return;
  }
  const creator = previous?.creator || getCurrentWorkerName();
  const createdAt = previous?.createdAt || getChecklistTimeText();
  const row = {
    checked: previous?.checked || false,
    done: false,
    checkedBy: "",
    checkedAt: "",
    history: Array.isArray(previous?.history) ? previous.history.filter(h => h.action === "최초작성" || (h.action === "확인완료" && targets.includes(h.target))) : [],
    group: selectedGroup,
    trade: document.getElementById("checklistModalTrade").value.trim(),
    no: document.getElementById("checklistModalNo").value.trim() || nextChecklistNo(),
    item: document.getElementById("checklistModalItem").value.trim(),
    method: document.getElementById("checklistModalMethod").value.trim(),
    owner: targets.join(", "),
    targets,
    checks: targets.map(target => {
      const old = previous?.checks?.find(c => c.target === target);
      return old ? { ...old } : { target, done: false, checkedBy: "", checkedAt: "" };
    }),
    status: "미확인",
    comment: document.getElementById("checklistModalComment").value.trim(),
    creator: getChecklistCreatorByGroup(selectedGroup),
    createdAt,
    attachments: [...checklistModalAttachments],
    objection: previous?.objection || null,
    objectionFiles: Array.isArray(previous?.objectionFiles) ? previous.objectionFiles : [],
    eliminated: previous?.eliminated || false,
    showObjection: previous?.showObjection || false
  };
  normalizeChecklistRow(row);
  if (Number.isInteger(editIndex) && checklistRows[editIndex]) {
    checklistRows[editIndex] = row;
    showToast("체크리스트 항목이 수정되었습니다.");
  } else {
    checklistRows.push(row);
    showToast("체크리스트 항목이 추가되었습니다.");
  }
  closeChecklistModal();
  renderChecklistGrid();
}

function addChecklistRow() { openChecklistModal(); }
function insertChecklistRowAfter(index) { openChecklistModal(index); }
function deleteChecklistRow(index) { 
  if (!checklistRows[index]) return;
  normalizeChecklistRow(checklistRows[index]);
  if (isChecklistCategoryLocked(checklistRows[index].group)) {
    showToast("송부 완료된 질의차수는 삭제할 수 없습니다.");
    return;
  }
  checklistRows.splice(index, 1); 
  renderChecklistGrid(); 
}
function deleteCheckedRows() { 
  const before = checklistRows.length; 
  checklistRows = checklistRows.filter(row => {
    normalizeChecklistRow(row);
    return !row.checked || isChecklistCategoryLocked(row.group);
  }); 
  renderChecklistGrid(); 
  showToast(`${before - checklistRows.length}개 행을 삭제했습니다. 송부 완료된 항목은 제외되었습니다.`); 
}
function duplicateCheckedRows() {
  const duplicated = checklistRows.filter(row => { normalizeChecklistRow(row); return row.checked && !isChecklistCategoryLocked(row.group); }).map(row => {
    const copy = JSON.parse(JSON.stringify(row));
    copy.checked = false;
    copy.no = nextChecklistNo();
    copy.creator = getCurrentWorkerName();
    copy.createdAt = getChecklistTimeText();
    copy.history = [{ action: "최초작성", worker: copy.creator, time: copy.createdAt }];
    copy.checks = (copy.targets || [copy.owner || "QC TEAM"]).map(target => ({ target, done: false, checkedBy: "", checkedAt: "" }));
    copy.done = false;
    copy.status = "미확인";
    return copy;
  });
  checklistRows.push(...duplicated);
  renderChecklistGrid();
  showToast(`${duplicated.length}개 행을 복제했습니다.`);
}
function buildChecklistCsv(rows, fileName) {
  rows.forEach(normalizeChecklistRow);
  const headers = ["구분", "공종", "일련번호", "검토항목", "검토방법", "요청 대상", "체크 상태", "코멘트", "첨부사진수", "회신/피드백", "회신반영자", "회신반영일시", "이의제기", "소거여부", "최초 작성자", "최초 작성일시", "확인완료 이력", "송부완료여부"];
  const bodyRows = rows.map(r => [
    r.group,
    r.trade,
    r.no,
    r.item,
    r.method,
    getChecklistTargets(r).join(" / "),
    getChecklistDoneState(r),
    r.comment,
    (r.attachments || []).length,
    r.feedback || "",
    r.feedbackBy || "",
    r.feedbackAt || "",
    r.objection?.text || "",
    r.eliminated ? "소거" : "",
    r.creator || "",
    r.createdAt || "",
    (r.history || []).filter(h => h.action === "확인완료").map(h => `${h.target}/${h.worker}/${h.time}`).join(" | "),
    isChecklistCategoryLocked(r.group) ? "송부완료" : ""
  ]);
  const csv = [headers, ...bodyRows].map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadChecklistCsv() {
  buildChecklistCsv(checklistRows, "QC_수량산출_체크리스트_전체.csv");
}

function downloadFirstCategoryCsv() {
  const rows = checklistRows.filter(row => normalizeChecklistGroupName(row.group) === firstCategoryName);
  if (!rows.length) {
    showToast("1번 항목에 다운로드할 데이터가 없습니다.");
    return;
  }
  buildChecklistCsv(rows, "프로젝트_수주_시점_PM_작업자_발주처_송부용.csv");
}

function downloadQuestionCategoryCsv(category) {
  category = normalizeChecklistGroupName(category);
  const rows = checklistRows.filter(row => normalizeChecklistGroupName(row.group) === category);
  if (!rows.length) {
    showToast("해당 질의차수에 다운로드할 데이터가 없습니다.");
    return;
  }
  buildChecklistCsv(rows, `${category.replace(/[\\/:*?"<>|]/g, "_")}.csv`);
}

function markQuestionCategorySent(category) {
  category = normalizeChecklistGroupName(category);
  if (!isQuestionCategory(category)) return;
  const rows = checklistRows.filter(row => normalizeChecklistGroupName(row.group) === category);
  if (!rows.length) {
    showToast("송부 완료 처리할 질의사항이 없습니다.");
    return;
  }
  const worker = getCurrentWorkerName();
  const time = getChecklistTimeText();
  checklistSentCategories.add(category);
  rows.forEach(row => {
    normalizeChecklistRow(row);

    // 송부완료로 질의차수가 잠금 처리되면, 해당 차수의 PM 확인 상태를 일괄 완료 처리한다.
    // 화면상 "PM · 미확인"으로 남지 않고 "PM · 확인완료"로 표시되도록 checks/history/status를 함께 동기화한다.
    const pmCheck = Array.isArray(row.checks) ? row.checks.find(check => check.target === "PM") : null;
    if (pmCheck) {
      pmCheck.done = true;
      pmCheck.checkedBy = worker;
      pmCheck.checkedAt = time;
      row.history = row.history.filter(h => !(h.action === "확인완료" && h.target === "PM"));
      row.history.push({ action: "확인완료", target: "PM", worker, time });
    }

    row.done = isChecklistRowDone(row);
    row.status = getChecklistDoneState(row);
    row.history = row.history.filter(h => h.action !== "송부완료");
    row.history.push({ action: "송부완료", worker, time });
  });
  const next = getNextQuestionCategory(category);
  renderChecklistGrid();
  showToast(next ? `${category} 송부 완료. PM 확인완료 처리 후 ${next} 작성이 가능합니다.` : `${category} 송부 완료 및 PM 확인완료 처리되었습니다.`);
}



document.querySelectorAll("[data-work-main]").forEach(btn => {
  btn.addEventListener("click", () => switchWorkPanel(btn.dataset.workMain));
});
renderChecklistGrid();


// QC 체크리스트 내부 스크롤 제거 보정
function removeInternalChecklistScroll() {
  const selectors = [
    ".work-qc-table-wrap",
    ".qc-review-table-wrap",
    "#qcReviewTableWrap",
    "#workQcPanel .table-wrap",
    "#workQcApproval .table-wrap",
    ".excel-grid-wrap",
    ".checklist-grid-wrap",
    ".grid-scroll",
    ".table-scroll"
  ];

  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.style.maxHeight = "none";
      el.style.height = "auto";
      el.style.overflowY = "visible";
    });
  });
}

document.addEventListener("DOMContentLoaded", removeInternalChecklistScroll);
window.addEventListener("resize", removeInternalChecklistScroll);


function renderAttachmentCell(row, rowIndex) {
  const attachments = Array.isArray(row.attachments) ? row.attachments : [];
  if (!attachments.length) {
    return `<div class="attachment-cell empty">첨부 없음</div>`;
  }

  return `
    <div class="attachment-cell has-attachment">
      <button type="button" class="attach-count-btn" onclick="openAttachmentGallery(${rowIndex})">${attachments.length}개 첨부</button>
      <div class="attach-thumb-list">
        ${attachments.map((file, fileIndex) => `
          <button type="button" class="attach-thumb" title="${escapeHtml(file.name || "첨부 이미지")}" onclick="openAttachmentImage(${rowIndex}, ${fileIndex})">
            <img src="${escapeHtml(file.dataUrl || file.url || "")}" alt="${escapeHtml(file.name || "첨부 이미지")}">
          </button>
        `).join("")}
      </div>
    </div>
  `;
}



function openAttachmentImage(rowIndex, fileIndex = 0) {
  openChecklistAttachmentImage(rowIndex, fileIndex);
}

function openAttachmentGallery(rowIndex) {
  openChecklistAttachmentGallery(rowIndex);
}

function openAttachmentImageWindow(imageUrl, title = "첨부 이미지") {
  const src = imageUrl || makeAttachmentFallbackImage(title);
  const popup = window.open("", "_blank", "width=1400,height=920,resizable=yes,scrollbars=yes");

  if (!popup) {
    showToast("팝업 차단을 해제해주세요.");
    return null;
  }

  popup.document.open();
  popup.document.write(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(title)}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{min-height:100%;background:#0f172a;font-family:"Pretendard","Noto Sans KR",Arial,sans-serif}
        body{display:flex;align-items:center;justify-content:center;padding:24px;overflow:auto}
        .viewer{width:100%;min-height:calc(100vh - 48px);display:flex;align-items:center;justify-content:center}
        img{display:block;max-width:100%;max-height:calc(100vh - 48px);width:auto;height:auto;object-fit:contain;background:#fff;border-radius:14px;box-shadow:0 18px 60px rgba(0,0,0,.45)}
        .title{position:fixed;top:16px;left:20px;right:20px;color:#e5e7eb;font-size:13px;font-weight:800;text-align:center;pointer-events:none}
      </style>
    </head>
    <body>
      <div class="title">${escapeHtml(title)}</div>
      <div class="viewer"><img src="${src}" alt="${escapeHtml(title)}"></div>
    </body>
    </html>
  `);
  popup.document.close();
  return popup;
}


function openAttachmentGalleryByData(rowIndex) {
  openChecklistAttachmentGallery(rowIndex);
}


function makeAttachmentFallbackImage(label = "첨부 이미지") {
  const safeLabel = String(label || "첨부 이미지").replace(/[<>&"]/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620">
      <rect width="900" height="620" rx="34" fill="#0f172a"/>
      <rect x="54" y="54" width="792" height="512" rx="28" fill="#111827" stroke="#2563eb" stroke-width="10"/>
      <text x="450" y="288" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="800" fill="#ffffff">${safeLabel}</text>
      <text x="450" y="360" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#93c5fd">첨부 이미지 미리보기</text>
    </svg>
  `;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}


function getAttachmentImageSource(file) {
  if (!file) return "";
  return file.dataUrl || file.url || file.src || file.preview || file.imageUrl || file.base64 || makeAttachmentFallbackImage(file.name || "첨부 이미지");
}


function openChecklistAttachmentImage(rowIndex, fileIndex = 0) {
  const row = checklistRows[rowIndex];
  if (!row || !Array.isArray(row.attachments) || !row.attachments[fileIndex]) {
    showToast("첨부 이미지를 찾을 수 없습니다.");
    return;
  }

  const file = row.attachments[fileIndex];
  const src = getAttachmentImageSource(file);
  const title = file.name || `${row.trade || "첨부"} 이미지`;
  openAttachmentImageWindow(src, title);
}


function openChecklistAttachmentGallery(rowIndex) {
  const row = checklistRows[rowIndex];
  if (!row || !Array.isArray(row.attachments) || !row.attachments.length) {
    showToast("첨부 이미지가 없습니다.");
    return;
  }

  if (row.attachments.length === 1) {
    openChecklistAttachmentImage(rowIndex, 0);
    return;
  }

  const popup = window.open("", "_blank", "width=1400,height=920,resizable=yes,scrollbars=yes");
  if (!popup) {
    showToast("팝업 차단을 해제해주세요.");
    return;
  }

  const title = `${row.trade || "첨부"} 첨부 이미지`;
  const cards = row.attachments.map((file, index) => {
    const src = getAttachmentImageSource(file);
    const name = escapeHtml(file.name || `첨부 이미지 ${index + 1}`);
    return `
      <figure class="image-card">
        <img src="${src}" alt="${name}">
        <figcaption>${name}</figcaption>
      </figure>
    `;
  }).join("");

  popup.document.open();
  popup.document.write(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(title)}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{min-height:100vh;background:#0f172a;color:#fff;font-family:"Pretendard","Noto Sans KR",Arial,sans-serif;padding:28px}
        h1{font-size:22px;margin-bottom:18px;letter-spacing:-.4px}
        .gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:20px}
        .image-card{background:#111827;border:1px solid rgba(148,163,184,.35);border-radius:18px;padding:14px;box-shadow:0 20px 60px rgba(0,0,0,.35)}
        .image-card img{display:block;width:100%;max-height:78vh;object-fit:contain;background:#fff;border-radius:14px}
        figcaption{margin-top:10px;color:#cbd5e1;font-size:13px;font-weight:800;text-align:center}
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      <section class="gallery">${cards}</section>
    </body>
    </html>
  `);
  popup.document.close();
}


/* FINAL_ATTACHMENT_IMAGE_OPEN_PATCH */

function makeAttachmentFallbackImage(label = "첨부 이미지") {
  const safeLabel = String(label || "첨부 이미지").replace(/[<>&"]/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620">
      <rect width="900" height="620" rx="34" fill="#0f172a"/>
      <rect x="54" y="54" width="792" height="512" rx="28" fill="#111827" stroke="#2563eb" stroke-width="10"/>
      <text x="450" y="288" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="800" fill="#ffffff">${safeLabel}</text>
      <text x="450" y="360" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#93c5fd">첨부 이미지 미리보기</text>
    </svg>
  `;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function getAttachmentImageSource(file) {
  if (!file) return "";
  return file.dataUrl || file.url || file.src || file.preview || file.imageUrl || file.base64 || makeAttachmentFallbackImage(file.name || "첨부 이미지");
}

function openChecklistAttachmentImage(rowIndex, fileIndex = 0) {
  const row = checklistRows[rowIndex];
  if (!row || !Array.isArray(row.attachments) || !row.attachments[fileIndex]) {
    showToast("첨부 이미지를 찾을 수 없습니다.");
    return;
  }

  const file = row.attachments[fileIndex];
  const src = getAttachmentImageSource(file);
  const title = file.name || `${row.trade || "첨부"} 이미지`;
  openAttachmentImageWindow(src, title);
}

function openChecklistAttachmentGallery(rowIndex) {
  const row = checklistRows[rowIndex];
  if (!row || !Array.isArray(row.attachments) || !row.attachments.length) {
    showToast("첨부 이미지가 없습니다.");
    return;
  }

  if (row.attachments.length === 1) {
    openChecklistAttachmentImage(rowIndex, 0);
    return;
  }

  const popup = window.open("", "_blank", "width=1400,height=920,resizable=yes,scrollbars=yes");
  if (!popup) {
    showToast("팝업 차단을 해제해주세요.");
    return;
  }

  const title = `${row.trade || "첨부"} 첨부 이미지`;
  const cards = row.attachments.map((file, index) => {
    const src = getAttachmentImageSource(file);
    const name = escapeHtml(file.name || `첨부 이미지 ${index + 1}`);
    return `
      <figure class="image-card">
        <img src="${src}" alt="${name}">
        <figcaption>${name}</figcaption>
      </figure>
    `;
  }).join("");

  popup.document.open();
  popup.document.write(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(title)}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{min-height:100vh;background:#0f172a;color:#fff;font-family:"Pretendard","Noto Sans KR",Arial,sans-serif;padding:28px}
        h1{font-size:22px;margin-bottom:18px;letter-spacing:-.4px}
        .gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:20px}
        .image-card{background:#111827;border:1px solid rgba(148,163,184,.35);border-radius:18px;padding:14px;box-shadow:0 20px 60px rgba(0,0,0,.35)}
        .image-card img{display:block;width:100%;max-height:78vh;object-fit:contain;background:#fff;border-radius:14px}
        figcaption{margin-top:10px;color:#cbd5e1;font-size:13px;font-weight:800;text-align:center}
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      <section class="gallery">${cards}</section>
    </body>
    </html>
  `);
  popup.document.close();
}

function openAttachmentImageWindow(imageUrl, title = "첨부 이미지") {
  const src = imageUrl || makeAttachmentFallbackImage(title);
  const popup = window.open("", "_blank", "width=1400,height=920,resizable=yes,scrollbars=yes");

  if (!popup) {
    showToast("팝업 차단을 해제해주세요.");
    return null;
  }

  popup.document.open();
  popup.document.write(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(title)}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{min-height:100%;background:#0f172a;font-family:"Pretendard","Noto Sans KR",Arial,sans-serif}
        body{display:flex;align-items:center;justify-content:center;padding:24px;overflow:auto}
        .viewer{width:100%;min-height:calc(100vh - 48px);display:flex;align-items:center;justify-content:center}
        img{display:block;max-width:100%;max-height:calc(100vh - 48px);width:auto;height:auto;object-fit:contain;background:#fff;border-radius:14px;box-shadow:0 18px 60px rgba(0,0,0,.45)}
        .title{position:fixed;top:16px;left:20px;right:20px;color:#e5e7eb;font-size:13px;font-weight:800;text-align:center;pointer-events:none}
      </style>
    </head>
    <body>
      <div class="title">${escapeHtml(title)}</div>
      <div class="viewer"><img src="${src}" alt="${escapeHtml(title)}"></div>
    </body>
    </html>
  `);
  popup.document.close();
  return popup;
}

function openImagePreview(src, title = "첨부 이미지") {
  openAttachmentImageWindow(src || makeAttachmentFallbackImage(title), title);
}

function openAttachmentGalleryByData(rowIndex) {
  openChecklistAttachmentGallery(rowIndex);
}

function openAttachmentImage(rowIndex, fileIndex = 0) {
  openChecklistAttachmentImage(rowIndex, fileIndex);
}

function openAttachmentGallery(rowIndex) {
  openChecklistAttachmentGallery(rowIndex);
}


function applyChecklistDisplayOverrides() {
  checklistRows.forEach(row => normalizeSpecialChecklistCreator(row));
}
