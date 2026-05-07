function switchPanel(panelId) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".side-main, .side-item").forEach(b => b.classList.remove("active"));

  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add("active");

  const activeBtn = document.querySelector(`[data-main="${panelId}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  const meta = pageMeta[panelId] || pageMeta.ledger;
  setText("pageTitle", meta[0]);
  setText("pageDesc", meta[1]);
}

document.querySelectorAll(".side-main").forEach(btn => {
  btn.addEventListener("click", () => {
    const groupId = btn.dataset.group;
    const panelId = btn.dataset.main;

    if (groupId) {
      document.querySelectorAll(".side-sub").forEach(s => s.classList.remove("active"));
      document.getElementById(groupId)?.classList.add("active");
      document.querySelectorAll(".side-main").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    }

    if (panelId) {
      switchPanel(panelId);
    }
  });
});

document.querySelectorAll(".side-item").forEach(btn => {
  btn.addEventListener("click", () => {
    switchPanel(btn.dataset.main);
  });
});

document.querySelectorAll(".inner-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".inner-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".detail-panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.detail)?.classList.add("active");
  });
});

function renderKpis() {
  setText("kpiTotal", employees.length);
  setText("kpiConcost", employees.filter(e => e.company === "CON-COST").length);
  setText("kpiVietqs", employees.filter(e => e.company === "Viet QS").length);
  setText("kpiActive", employees.filter(e => e.status === "재직").length);
  setText("kpiExpected", employees.filter(e => e.status === "입사예정").length);
}

function getSortValue(emp, key) {
  if (key === "name") return displayName(emp);
  if (key === "gradeOrder") return gradeOrder[emp.grade] || 999;
  return emp[key] || "";
}

function sortList(list) {
  return [...list].sort((a, b) => {
    const av = getSortValue(a, currentSortKey);
    const bv = getSortValue(b, currentSortKey);
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * sortDirection;
    return String(av).localeCompare(String(bv), "ko") * sortDirection;
  });
}

function toggleSort(key) {
  if (currentSortKey === key) {
    sortDirection *= -1;
  } else {
    currentSortKey = key;
    sortDirection = 1;
  }
  applyLedgerFilters(false);
}

function renderLedger(list = employees) {
  const tbody = document.getElementById("ledgerBody");
  if (!tbody) return;

  tbody.innerHTML = sortList(list).map(emp => `
    <tr>
      <td><div class="emp-photo">${displayName(emp)[0]}</div></td>
      <td>${emp.empNo}</td>
      <td><strong>${displayName(emp)}</strong></td>
      <td>${companyBadge(emp.company)}</td>
      <td>${emp.id}</td>
      <td>${emp.dept}</td>
      <td>${emp.grade}</td>
      <td>${statusBadge(emp.status)}</td>
      <td>${emp.join}</td>
      <td><span class="badge blue">${emp.eval}</span></td>
      <td>${emp.project}</td>
      <td><button class="btn btn-line" onclick="openCard('${emp.empNo}')">상세</button></td>
    </tr>
  `).join("");
}

function renderEmployeeList(list = employees) {
  const box = document.getElementById("employeeList");
  if (!box) return;

  if (!list.length) {
    box.innerHTML = `<div class="employee-empty">검색 결과가 없습니다.</div>`;
    return;
  }

  box.innerHTML = list.map(emp => `
    <button type="button" class="employee-item ${emp.empNo === selectedEmployeeId ? "active" : ""}" onclick="selectEmployee('${emp.empNo}', this, true)">
      <div class="emp-name">${displayName(emp)}</div>
      <div class="emp-meta">${emp.company} · ${emp.dept} · ${emp.grade} · ${emp.status}</div>
      <div class="emp-no">${emp.empNo}</div>
    </button>
  `).join("");
}

function setEmployeeTopListCollapsed(collapsed) {
  const card = document.getElementById("employeeTopCard");
  const btn = document.getElementById("employeeListToggleBtn");
  if (!card || !btn) return;

  card.classList.toggle("collapsed", collapsed);
  btn.textContent = collapsed ? "직원 목록 펼치기" : "직원 목록 접기";
}

function toggleEmployeeTopList() {
  const card = document.getElementById("employeeTopCard");
  if (!card) return;
  setEmployeeTopListCollapsed(!card.classList.contains("collapsed"));
}

function selectEmployee(empNo, el, autoCollapse = false) {
  const emp = employees.find(e => e.empNo === empNo);
  if (!emp) return;

  selectedEmployeeId = empNo;

  document.querySelectorAll(".employee-item").forEach(item => item.classList.remove("active"));
  if (el) el.classList.add("active");
  if (autoCollapse) setEmployeeTopListCollapsed(true);

  setText("profilePhoto", displayName(emp)[0]);
  setText("profileName", displayName(emp));
  setText("quickTenure", formatMonths(monthDiff(emp.join)));
  setText("quickCareer", formatMonths(monthDiff(emp.join) + emp.externalCareerMonths));
  setText("quickProject", emp.project);
  setText("quickGrade", emp.eval);

  const profileTags = document.getElementById("profileTags");
  if (profileTags) {
    profileTags.innerHTML = `
      ${companyBadge(emp.company)}
      <span class="badge blue">${emp.dept}</span>
      <span class="badge gray">${emp.grade}</span>
      ${statusBadge(emp.status)}
      <span class="badge blue">${emp.join} 입사</span>
      <span class="badge gray">${emp.empNo}</span>
    `;
  }

  setFormValue("cardName", emp.name);
  setFormValue("cardLocalName", emp.localName);
  setFormValue("cardKoreanName", emp.koreanName);
  setFormValue("cardEmpNo", emp.empNo);
  setFormValue("cardUserId", emp.id);
  setFormValue("cardCompany", emp.company);
  setFormValue("cardDept", emp.dept);
  setFormValue("cardGrade", emp.grade);
  setFormValue("cardPosition", emp.position);
  setFormValue("cardStatus", emp.status);
  setFormValue("cardJoin", emp.join);
  setFormValue("cardEndDate", emp.endDate);
  setFormValue("cardCorp", emp.company === "Viet QS" ? "베트남 지사" : "한국 본사");
  setFormValue("cardWorkplace", emp.workplace);
  setFormValue("cardEmail", emp.email);
  setFormValue("phoneCountry", emp.phoneCountry);
  setFormValue("phoneInput", emp.phone);
  setFormValue("cardAddress", emp.address);
  setFormValue("cardEmergency", emp.emergency);
  setFormValue("idCountry", emp.idCountry);
  setFormValue("nationalId", emp.nationalId);
  setFormValue("cardBirthday", emp.birthday);
  setFormValue("cardWedding", emp.wedding);
  setFormValue("cardNationality", emp.nationality);
  setFormValue("orgPath", emp.orgPath);
  setFormValue("reportLine", emp.reportLine);
  setFormValue("pmRole", emp.pmRole);
  setFormValue("multiDept", emp.multiDept);
  setText("basicAudit", emp.audit.basic);
  setText("detailAudit", emp.audit.detail);

  renderHistories(emp);
  renderRepeat(emp);
  renderEmployeeAssets(emp);
  renderWorklogs(emp);
  renderFiles(emp);
}

function renderHistories(emp) {
  renderHistoryRows("joinHistoryBody", emp.histories.join);
  renderHistoryRows("orgHistoryBody", emp.histories.org);
  renderHistoryRows("leaveHistoryBody", emp.histories.leave);
}

function renderHistoryRows(targetId, rows) {
  const tbody = document.getElementById(targetId);
  if (!tbody) return;

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">등록된 이력이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(row => `
    <tr>
      <td>${row.type}</td>
      <td>${row.before}</td>
      <td>${row.after}</td>
      <td>${row.date}</td>
      <td>${row.reason}</td>
      <td>${row.manager}</td>
    </tr>
  `).join("");
}

function renderRepeat(emp) {
  const tbody = document.getElementById("repeatBody");
  if (!tbody) return;

  if (!emp.repeat || emp.repeat.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">등록된 반복 정보가 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = emp.repeat.map(row => `
    <tr>
      <td>${row.type}</td>
      <td>${row.content}</td>
      <td>${row.start}</td>
      <td>${row.end}</td>
      <td>${row.period}</td>
      <td>${row.file}</td>
      <td>${row.note}</td>
    </tr>
  `).join("");
}

function renderEmployeeAssets(emp) {
  const tbody = document.getElementById("employeeAssetBody");
  if (!tbody) return;

  const assets = assetLedger.filter(a => a.owner === emp.name || a.owner === emp.localName || a.owner === displayName(emp));

  if (assets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">배정된 자산이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = assets.map(a => `
    <tr>
      <td>${a.category}</td>
      <td>${a.name}</td>
      <td>${a.code}</td>
      <td>${a.date}</td>
      <td>-</td>
      <td><span class="badge green">${a.status}</span></td>
    </tr>
  `).join("");
}

function renderWorklogs(emp) {
  setText("usedLeave", emp.usedLeave);
  setText("otTotal", emp.otTotal);
  setText("mainOtProject", emp.mainOtProject);

  const tbody = document.getElementById("worklogBody");
  if (!tbody) return;

  if (!emp.worklogs || emp.worklogs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">등록된 업무/야근 이력이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = emp.worklogs.map(row => `
    <tr>
      <td>${row.date}</td>
      <td>${row.type}</td>
      <td>${row.project}</td>
      <td>${row.time}</td>
      <td>${row.reason}</td>
      <td>${row.approver}</td>
    </tr>
  `).join("");
}

function renderFiles(emp) {
  const tbody = document.getElementById("fileBody");
  if (!tbody) return;

  if (!emp.files || emp.files.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">등록된 파일이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = emp.files.map(file => `
    <tr>
      <td>${file.type}</td>
      <td>${file.name}</td>
      <td>${file.date}</td>
      <td><span class="badge ${file.status === "승인완료" ? "green" : "yellow"}">${file.status}</span></td>
      <td><button class="btn btn-line">다운로드</button></td>
      <td><button class="btn btn-line">변경신청</button></td>
    </tr>
  `).join("");
}

function openCard(empNo) {
  switchPanel("card");
  setTimeout(() => selectEmployee(empNo), 0);
}

function filterEmployees(keyword = "") {
  const q = keyword.trim().toLowerCase();
  const company = document.getElementById("companyFilter")?.value || "전체";
  const dept = document.getElementById("deptFilter")?.value || "전체";
  const grade = document.getElementById("gradeFilter")?.value || "전체";
  const status = document.getElementById("statusFilter")?.value || "재직";
  const year = document.getElementById("yearFilter")?.value || "전체";

  return employees.filter(emp => {
    const searchTarget = [emp.name, emp.localName, emp.koreanName, emp.empNo, emp.id, emp.company, emp.dept, emp.email].join(" ").toLowerCase();

    return (!q || searchTarget.includes(q)) &&
      (company === "전체" || emp.company === company) &&
      (dept === "전체" || emp.dept === dept) &&
      (grade === "전체" || emp.grade === grade) &&
      (status === "전체" || emp.status === status) &&
      (year === "전체" || emp.join.startsWith(year));
  });
}

function applyLedgerFilters(show = true) {
  const keyword = document.getElementById("ledgerSearch")?.value || "";
  renderLedger(filterEmployees(keyword));
  if (show) showToast("검색 조건이 적용되었습니다.");
}

function filterEmployeesForList(keyword) {
  const q = keyword.trim().toLowerCase();
  return employees.filter(emp =>
    emp.name.toLowerCase().includes(q) ||
    emp.localName.toLowerCase().includes(q) ||
    emp.koreanName.toLowerCase().includes(q) ||
    emp.empNo.toLowerCase().includes(q) ||
    emp.id.toLowerCase().includes(q) ||
    emp.dept.toLowerCase().includes(q) ||
    emp.company.toLowerCase().includes(q) ||
    emp.email.toLowerCase().includes(q)
  );
}

function renderAnalysis() {
  const body = document.getElementById("analysisBody");
  const careerBody = document.getElementById("careerSummaryBody");
  if (!body || !careerBody) return;

  const companies = ["CON-COST", "Viet QS"];
  body.innerHTML = companies.map(company => {
    const target = employees.filter(e => e.company === company);
    return `
      <tr>
        <td>${company}</td>
        <td>${target.filter(e => e.status === "재직").length}</td>
        <td>${target.filter(e => e.join.startsWith("2026")).length}</td>
        <td>${target.filter(e => ["퇴사", "계약만료"].includes(e.status)).length}</td>
        <td>${target.filter(e => e.status === "입사예정").length}</td>
        <td>${target.filter(e => e.status === "휴직").length}</td>
      </tr>
    `;
  }).join("");

  careerBody.innerHTML = employees.map(emp => {
    const tenureMonths = monthDiff(emp.join);
    const totalCareer = tenureMonths + emp.externalCareerMonths;
    const rejoin = emp.histories.join.some(h => h.type === "재입사") ? "있음" : "없음";

    return `
      <tr>
        <td>${displayName(emp)}</td>
        <td>${companyBadge(emp.company)}</td>
        <td>${emp.join}</td>
        <td>${formatMonths(tenureMonths)}</td>
        <td>${formatMonths(emp.externalCareerMonths)}</td>
        <td>${formatMonths(totalCareer)}</td>
        <td>${rejoin}</td>
      </tr>
    `;
  }).join("");

  const join2026 = employees.filter(e => e.join.startsWith("2026")).length;
  const exit2026 = employees.filter(e => ["퇴사", "계약만료"].includes(e.status)).length;
  const avgTenure = Math.round(employees.reduce((sum, e) => sum + monthDiff(e.join), 0) / employees.length);
  const avgCareer = Math.round(employees.reduce((sum, e) => sum + monthDiff(e.join) + e.externalCareerMonths, 0) / employees.length);

  setText("analysisJoin", join2026);
  setText("analysisExit", exit2026);
  setText("analysisExitRate", `${Math.round((exit2026 / employees.length) * 100)}%`);
  setText("analysisAvgTenure", formatMonths(avgTenure));
  setText("analysisAvgCareer", formatMonths(avgCareer));
}

function renderAssetLedger() {
  const tbody = document.getElementById("assetLedgerBody");
  if (!tbody) return;

  tbody.innerHTML = assetLedger.map(a => `
    <tr>
      <td>${a.category}</td>
      <td>${a.name}</td>
      <td>${a.code}</td>
      <td>${a.owner}</td>
      <td>${a.date}</td>
      <td><span class="badge ${a.status === "사용중" ? "green" : "yellow"}">${a.status}</span></td>
      <td><button class="btn btn-line" onclick="showToast('자산 배정/반납 관리 예시입니다.')">관리</button></td>
    </tr>
  `).join("");
}

function renderPermissionRows() {
  const tbody = document.getElementById("permissionBody");
  if (!tbody) return;

  tbody.innerHTML = permissionRows.map(row => `
    <tr>
      <td>${row[0]}</td>
      <td>${row[1]}</td>
      <td>${row[2]}</td>
      <td>${row[3]}</td>
      <td>${row[4]}</td>
      <td>${row[5]}</td>
    </tr>
  `).join("");
}

function getActiveOrderRows(category) {
  return orderRows
    .filter(row => row[0] === category && row[4] === "사용")
    .sort((a, b) => Number(a[3]) - Number(b[3]));
}

function syncOrderRowsToOrgSettings() {
  Object.keys(gradeOrder).forEach(key => delete gradeOrder[key]);
  getActiveOrderRows("직급").forEach(row => {
    gradeOrder[row[2]] = Number(row[3]) || 999;
  });

  applyCodeOrderToSelects();
}

function applyCodeOrderToSelects() {
  const gradeNames = getActiveOrderRows("직급").map(row => row[2]);
  const gradeSelectIds = ["gradeFilter", "cardGrade"];

  gradeSelectIds.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;

    const previousValue = select.value;
    const hasAll = id === "gradeFilter";
    select.innerHTML = `${hasAll ? '<option value="전체">전체</option>' : ''}${gradeNames.map(name => `<option value="${name}">${name}</option>`).join("")}`;

    if ([...select.options].some(option => option.value === previousValue)) {
      select.value = previousValue;
    } else if (hasAll) {
      select.value = "전체";
    }
  });
}

function renderOrderRows() {
  const tbody = document.getElementById("orderBody");
  if (!tbody) return;

  syncOrderRowsToOrgSettings();

  const sortedRows = orderRows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const categoryCompare = String(a.row[0]).localeCompare(String(b.row[0]), "ko");
      if (categoryCompare !== 0) return categoryCompare;
      return Number(a.row[3]) - Number(b.row[3]);
    });

  tbody.innerHTML = sortedRows.map(({ row, index }) => `
    <tr>
      <td>
        <select class="order-cell-select" onchange="updateOrderRow(${index}, 0, this.value)">
          ${["직급", "직책", "부서", "재직상태"].map(category => `<option value="${category}" ${row[0] === category ? "selected" : ""}>${category}</option>`).join("")}
        </select>
      </td>
      <td><input class="order-code-input" value="${row[1]}" onchange="updateOrderRow(${index}, 1, this.value)"></td>
      <td><input value="${row[2]}" onchange="updateOrderRow(${index}, 2, this.value)"></td>
      <td><input type="number" min="1" value="${row[3]}" onchange="updateOrderRow(${index}, 3, this.value)"></td>
      <td>
        <select class="order-cell-select" onchange="updateOrderRow(${index}, 4, this.value)">
          <option value="사용" ${row[4] === "사용" ? "selected" : ""}>사용</option>
          <option value="미사용" ${row[4] === "미사용" ? "selected" : ""}>미사용</option>
        </select>
      </td>
      <td>
        <div class="order-actions">
          <button class="btn btn-line" onclick="moveOrderRow(${index}, -1)">↑</button>
          <button class="btn btn-line" onclick="moveOrderRow(${index}, 1)">↓</button>
          <button class="btn btn-danger" onclick="deleteOrderRow(${index})">삭제</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function updateOrderRow(index, cellIndex, value) {
  if (!orderRows[index]) return;
  orderRows[index][cellIndex] = cellIndex === 3 ? Number(value) || 999 : value.trim();
  normalizeOrderRows(orderRows[index][0]);
  renderOrderRows();
  refreshOrderLinkedViews();
  showToast("표시순서가 조직관리 화면에 반영되었습니다.");
}

function normalizeOrderRows(category) {
  const rows = orderRows
    .filter(row => row[0] === category)
    .sort((a, b) => Number(a[3]) - Number(b[3]));

  rows.forEach((row, idx) => {
    row[3] = idx + 1;
  });
}

function moveOrderRow(index, direction) {
  const row = orderRows[index];
  if (!row) return;

  const sameCategory = orderRows
    .map((target, targetIndex) => ({ target, targetIndex }))
    .filter(item => item.target[0] === row[0])
    .sort((a, b) => Number(a.target[3]) - Number(b.target[3]));

  const currentPosition = sameCategory.findIndex(item => item.targetIndex === index);
  const next = sameCategory[currentPosition + direction];
  if (!next) return;

  const currentOrder = row[3];
  row[3] = next.target[3];
  next.target[3] = currentOrder;

  renderOrderRows();
  refreshOrderLinkedViews();
  showToast("표시순서가 변경되어 조직관리 화면에 반영되었습니다.");
}

function getNextOrderCode(category) {
  const prefixMap = { 직급: "G", 직책: "R", 부서: "D", 재직상태: "S" };
  const prefix = prefixMap[category] || "C";
  const maxNumber = orderRows
    .filter(row => row[0] === category && String(row[1]).startsWith(prefix))
    .map(row => Number(String(row[1]).replace(prefix, "")) || 0)
    .reduce((max, value) => Math.max(max, value), 0);
  return `${prefix}${String(maxNumber + 1).padStart(3, "0")}`;
}

function addOrderRow() {
  const category = document.getElementById("orderAddCategory")?.value || "직급";
  const nameInput = document.getElementById("orderAddName");
  const name = (nameInput?.value || "").trim();

  if (!name) {
    showToast("추가할 표시명을 입력하세요.");
    nameInput?.focus();
    return;
  }

  const nextOrder = orderRows.filter(row => row[0] === category).length + 1;
  orderRows.push([category, getNextOrderCode(category), name, nextOrder, "사용"]);

  if (nameInput) nameInput.value = "";
  renderOrderRows();
  refreshOrderLinkedViews();
  showToast(`${category} 코드가 추가되고 조직관리 화면에 반영되었습니다.`);
}

function deleteOrderRow(index) {
  const row = orderRows[index];
  if (!row) return;

  if (!confirm(`${row[2]} 항목을 삭제할까요?`)) return;

  const category = row[0];
  orderRows.splice(index, 1);
  normalizeOrderRows(category);
  renderOrderRows();
  refreshOrderLinkedViews();
  showToast("표시순서 항목이 삭제되고 조직관리 화면에 반영되었습니다.");
}

function refreshOrderLinkedViews() {
  syncOrderRowsToOrgSettings();
  applyLedgerFilters(false);
  renderEmployeeList(filterEmployeesForList(document.getElementById("employeeSearch")?.value || ""));
  renderOrgEditor();
}

function validateRequired() {
  const activePanel = document.querySelector(".detail-panel.active");
  if (!activePanel) return;

  const requiredInputs = activePanel.querySelectorAll("[required]");
  let valid = true;

  requiredInputs.forEach(input => {
    if (!input.value.trim()) {
      input.classList.add("invalid");
      valid = false;
    } else {
      input.classList.remove("invalid");
    }
  });

  showToast(valid ? "필수 입력값 검증 완료. 저장 처리 예시입니다." : "* 필수 입력값을 확인해 주세요.");
}

function validateModal() {
  const modal = document.getElementById("employeeModal");
  if (!modal) return;

  const requiredInputs = modal.querySelectorAll("[required]");
  let valid = true;

  requiredInputs.forEach(input => {
    if (!input.value.trim()) {
      input.classList.add("invalid");
      valid = false;
    } else {
      input.classList.remove("invalid");
    }
  });

  if (valid) {
    closeModal();
    showToast("신규 직원 등록 예시가 저장되었습니다.");
  } else {
    showToast("* 필수 입력값을 확인해 주세요.");
  }
}

function openModal() {
  document.getElementById("employeeModal")?.classList.add("active");
}

function closeModal() {
  document.getElementById("employeeModal")?.classList.remove("active");
}

function openExcelModal() {
  document.getElementById("excelModal")?.classList.add("active");
}

function closeExcelModal() {
  document.getElementById("excelModal")?.classList.remove("active");
}

function openPermissionModal() {
  document.getElementById("permissionModal")?.classList.add("active");
}

function closePermissionModal() {
  document.getElementById("permissionModal")?.classList.remove("active");
}


function employeeById(empNo) {
  return employees.find(e => e.empNo === empNo);
}

function orgNodeLabel(node) {
  const emp = node?.employeeId ? employeeById(node.employeeId) : null;
  const title = node?.title || (emp ? emp.position || emp.grade : "조직");
  const name = emp ? displayName(emp) : (node?.displayName || "");
  return { emp, title, name };
}

function renderOrgPersonButton(node, extraClass = "") {
  const { emp, title, name } = orgNodeLabel(node);
  const labelName = name || title;
  const labelTitle = emp ? (emp.position || emp.grade || title) : title;
  const company = emp ? emp.company : "";
  const dept = emp ? emp.dept : "";
  const onclick = emp ? ` onclick="openMiniCardPopup('${emp.empNo}')"` : "";
  return `
    <button class="org-mini-person ${extraClass} ${emp ? "clickable" : ""}"${onclick}>
      <span>${labelTitle}</span>
      <strong>${labelName}</strong>
      ${company ? `<small>${company} · ${dept}</small>` : ""}
    </button>
  `;
}

function collectOrgMembers(node, rows = []) {
  if (node?.employeeId) rows.push(node);
  (node?.children || []).forEach(child => collectOrgMembers(child, rows));
  return rows;
}

function renderOrgBranchCard(node) {
  const { emp, title, name } = orgNodeLabel(node);
  const children = node.children || [];
  const directLead = emp ? renderOrgPersonButton(node, "lead") : "";
  const childMembers = children.flatMap(child => collectOrgMembers(child, []));
  const childOnly = childMembers.filter(child => child.employeeId !== node.employeeId);

  return `
    <section class="org-overview-card">
      <div class="org-overview-card-title">${title}</div>
      ${directLead || (name ? `<div class="org-overview-lead">${name}</div>` : "")}
      <div class="org-overview-members">
        ${childOnly.map(child => renderOrgPersonButton(child)).join("") || `<div class="org-empty">하위 인원 없음</div>`}
      </div>
    </section>
  `;
}

function splitOrgColumns(nodes, maxColumns = 3) {
  const list = (nodes || []).filter(Boolean);
  const columns = Math.min(maxColumns, Math.max(1, Math.ceil(list.length / 4)));
  const buckets = Array.from({ length: columns }, () => []);
  list.forEach((node, index) => buckets[index % columns].push(node));
  return buckets;
}

function renderOrgMemberColumns(nodes, maxColumns = 3) {
  const list = (nodes || []).filter(Boolean);
  if (!list.length) return `<div class="org-empty">하위 인원 없음</div>`;
  return `
    <div class="org-member-column-wrap cols-${Math.min(maxColumns, Math.max(1, Math.ceil(list.length / 4)))}">
      ${splitOrgColumns(list, maxColumns).map(col => `
        <div class="org-member-column">
          ${col.map(child => renderOrgPersonButton(child)).join("")}
        </div>
      `).join("")}
    </div>
  `;
}

function renderOrgDepartmentBlock(node, options = {}) {
  if (!node) return "";
  const { emp, title, name } = orgNodeLabel(node);
  const children = (node.children || []).filter(child => child.employeeId !== node.employeeId);
  const subGroups = children.filter(child => (child.children || []).length);
  const directMembers = children.filter(child => !(child.children || []).length);
  const colCount = options.columns || 3;

  return `
    <section class="org-chart-block ${options.className || ""}">
      <div class="org-block-title">${title}</div>
      ${emp ? renderOrgPersonButton(node, "lead") : (name ? `<div class="org-overview-lead">${name}</div>` : "")}
      ${directMembers.length ? `<div class="org-block-members">${renderOrgMemberColumns(directMembers, colCount)}</div>` : ""}
      ${subGroups.length ? `
        <div class="org-subpart-grid ${subGroups.length > 2 ? "wide" : ""}">
          ${subGroups.map(group => renderOrgDepartmentBlock(group, { className: "subpart", columns: 2 })).join("")}
        </div>
      ` : ""}
      ${!directMembers.length && !subGroups.length ? `<div class="org-empty">하위 인원 없음</div>` : ""}
    </section>
  `;
}


function isOrgActualLeaf(node) {
  return !(node?.children || []).length;
}

function actualOrgNodeClass(node, depth = 0) {
  const cls = [node.className || ""];
  if (depth === 0) cls.push("primary");
  if (depth === 1) cls.push("secondary");
  if (isOrgActualLeaf(node)) cls.push("leaf");
  if ((node.children || []).length) cls.push("branch");
  return cls.filter(Boolean).join(" ");
}

function renderActualOrgCard(node, depth = 0) {
  const { emp, title, name } = orgNodeLabel(node);
  const displayTitle = title || (emp ? emp.position || emp.grade : "조직");
  const displayNameText = emp ? displayName(emp) : (name || "직원 미연결");
  const meta = emp ? `${emp.company} · ${emp.dept}` : "조직 노드";
  const onclick = emp ? ` onclick="openMiniCardPopup('${emp.empNo}')"` : "";

  return `
    <button class="actual-org-card ${actualOrgNodeClass(node, depth)}"${onclick}>
      <span>${displayTitle}</span>
      <strong>${displayNameText}</strong>
      <small>${meta}</small>
    </button>
  `;
}

function renderActualOrgTreeNode(node, depth = 0, path = "0") {
  const { emp, title, name } = orgNodeLabel(node);
  const children = node.children || [];
  const displayTitle = title || (emp ? emp.position || emp.grade : "조직");
  const displayPerson = emp ? displayName(emp) : (name || "직원 미연결");
  const meta = emp ? `${emp.company} · ${emp.dept}` : "조직 노드";
  const onclick = emp ? ` onclick="openMiniCardPopup('${emp.empNo}')"` : "";
  const typeClass = node.className || "";
  const layoutClass = getOrgPopupNodeClass(node, depth).replaceAll("org-popup-", "actual-view-");

  const childItems = children.map((child, index) => ({ child, index }));
  const branchChildren = childItems.filter(item => isOrgBranchNode(item.child, depth + 1));
  const leafChildren = childItems.filter(item => !isOrgBranchNode(item.child, depth + 1));
  const memberColumns = getOrgMemberColumnCount(node);
  const branchColumns = Math.max(1, branchChildren.length);

  return `
    <div class="actual-view-node-wrap ${layoutClass}" data-path="${path}">
      <button class="actual-view-node ${typeClass} depth-${depth}"${onclick}>
        <span>${displayTitle}</span>
        <strong>${displayPerson}</strong>
        <em>${meta}</em>
      </button>

      ${branchChildren.length ? `
        <div class="actual-view-branch-children depth-${depth} count-${branchChildren.length}" style="grid-template-columns:repeat(${branchColumns}, max-content);">
          ${branchChildren.map(({ child, index }) => renderActualOrgTreeNode(child, depth + 1, `${path}-${index}`)).join("")}
        </div>
      ` : ""}

      ${leafChildren.length ? `
        <div class="actual-view-member-children depth-${depth} count-${leafChildren.length} cols-${memberColumns}" style="grid-template-columns:repeat(${memberColumns}, 92px);">
          ${leafChildren.map(({ child, index }) => renderActualOrgTreeNode(child, depth + 1, `${path}-${index}`)).join("")}
        </div>
      ` : ""}
    </div>
  `;
}
