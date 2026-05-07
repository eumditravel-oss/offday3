function renderActualOrgTree(root, company) {
  return `
    <div class="actual-org-viewport">
      <div class="actual-org-fit ${company === "CON-COST" ? "concost" : "vietqs"}">
        ${company === "CON-COST" ? `<div class="actual-org-title-box">㈜컨코스트 조직도</div>` : ""}
        <div class="actual-org-scroll-note">편집창의 상위/하위 관계와 표시순서를 기준으로 자동 정렬됩니다.</div>
        <div class="actual-view-tree ${company === "CON-COST" ? "concost-tree" : "vietqs-tree"}">
          ${renderActualOrgTreeNode(root, 0, "0")}
        </div>
      </div>
    </div>
  `;
}

function renderConcostOrgChart(root) {
  return renderActualOrgTree(root, "CON-COST");
}

function renderVietqsOrgChart(root) {
  return renderActualOrgTree(root, "Viet QS");
}

let actualOrgChartScale = 1;
let actualOrgChartAutoScale = 1;

function renderOrgChart(company = currentOrgCompany) {
  const target = document.getElementById("orgChartContent");
  if (!target) return;

  const data = orgStructures[company];
  currentOrgCompany = company;

  const root = data.root;
  const totalMembers = collectOrgMembers(root, []).length;
  const linkedCards = new Set(collectOrgMembers(root, []).map(node => node.employeeId).filter(Boolean)).size;
  const chartMarkup = company === "CON-COST" ? renderConcostOrgChart(root) : renderVietqsOrgChart(root);

  target.innerHTML = `
    <div class="org-chart-header compact">
      <div>
        ${data.date ? `<span>${data.date}</span>` : ""}
        <h3>${data.title}</h3>
      </div>
      <div class="org-chart-header-actions">
        <div class="org-stat"><span>조직도 표기 인원</span><strong>${totalMembers}</strong></div>
        <div class="org-stat"><span>단일 인사카드</span><strong>${linkedCards}</strong></div>
        <button class="btn btn-line" onclick="switchPanel('orgEdit'); closeOrgChart();">조직도관리로 이동</button>
        <div class="actual-org-zoom-panel" aria-label="조직도 확대 축소">
          <button class="btn btn-line actual-zoom-btn" onclick="zoomActualOrgChart(-0.1)">−</button>
          <strong id="actualOrgZoomLabel">100%</strong>
          <button class="btn btn-line actual-zoom-btn" onclick="zoomActualOrgChart(0.1)">+</button>
          <button class="btn btn-line" onclick="fitActualOrgChartToView()">화면맞춤</button>
          <button class="btn btn-line" onclick="resetActualOrgChartZoom()">100%</button>
        </div>
      </div>
    </div>
    ${chartMarkup}
  `;

  requestAnimationFrame(() => {
    fitActualOrgChartToView();
    setupActualOrgChartViewportControls();
  });
}

function setActualOrgChartScale(scale, keepCenter = false) {
  const canvas = document.getElementById("orgChartContent");
  const viewport = canvas?.querySelector(".actual-org-viewport");
  const fit = canvas?.querySelector(".actual-org-fit");
  if (!canvas || !viewport || !fit) return;

  const previousScale = Number(fit.dataset.actualScale || actualOrgChartScale || 1);
  const safeScale = Math.min(1.8, Math.max(0.16, Number(scale.toFixed(3))));
  const centerX = viewport.scrollLeft + viewport.clientWidth / 2;
  const centerY = viewport.scrollTop + viewport.clientHeight / 2;
  const ratio = previousScale ? safeScale / previousScale : 1;

  actualOrgChartScale = safeScale;
  fit.dataset.actualScale = String(safeScale);
  fit.style.transform = "none";
  fit.style.zoom = String(safeScale);

  const label = document.getElementById("actualOrgZoomLabel");
  if (label) label.textContent = `${Math.round(safeScale * 100)}%`;

  if (keepCenter) {
    viewport.scrollLeft = Math.max(0, centerX * ratio - viewport.clientWidth / 2);
    viewport.scrollTop = Math.max(0, centerY * ratio - viewport.clientHeight / 2);
  } else {
    centerActualOrgChartViewport();
  }
}

function centerActualOrgChartViewport() {
  const viewport = document.querySelector("#orgChartContent .actual-org-viewport");
  if (!viewport) return;
  viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
  viewport.scrollTop = 0;
}

function fitActualOrgChartToView() {
  const canvas = document.getElementById("orgChartContent");
  const viewport = canvas?.querySelector(".actual-org-viewport");
  const fit = canvas?.querySelector(".actual-org-fit");
  if (!canvas || !viewport || !fit) return;

  fit.style.zoom = "1";
  fit.style.transform = "none";
  fit.dataset.actualScale = "1";

  const naturalWidth = Math.max(fit.scrollWidth, fit.offsetWidth, 1);
  const naturalHeight = Math.max(fit.scrollHeight, fit.offsetHeight, 1);
  const availableWidth = Math.max(360, viewport.clientWidth - 28);
  const availableHeight = Math.max(360, viewport.clientHeight - 24);

  const scale = Math.min(1, availableWidth / naturalWidth, availableHeight / naturalHeight);
  actualOrgChartAutoScale = Math.max(0.16, Number((scale * 0.985).toFixed(3)));
  setActualOrgChartScale(actualOrgChartAutoScale, false);
}

function zoomActualOrgChart(delta) {
  const fit = document.querySelector("#orgChartContent .actual-org-fit");
  const current = Number(fit?.dataset.actualScale || actualOrgChartScale || 1);
  setActualOrgChartScale(current + delta, true);
}

function resetActualOrgChartZoom() {
  setActualOrgChartScale(1, true);
}

function setupActualOrgChartViewportControls() {
  const viewport = document.querySelector("#orgChartContent .actual-org-viewport");
  if (!viewport || viewport.dataset.controlsReady === "1") return;
  viewport.dataset.controlsReady = "1";

  viewport.addEventListener("wheel", event => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    zoomActualOrgChart(event.deltaY > 0 ? -0.08 : 0.08);
  }, { passive: false });

  let isPanning = false;
  let startX = 0;
  let startY = 0;
  let scrollLeft = 0;
  let scrollTop = 0;

  viewport.addEventListener("mousedown", event => {
    if (event.button !== 1 && !(event.button === 0 && event.altKey)) return;
    event.preventDefault();
    isPanning = true;
    startX = event.clientX;
    startY = event.clientY;
    scrollLeft = viewport.scrollLeft;
    scrollTop = viewport.scrollTop;
    viewport.classList.add("panning");
  });

  window.addEventListener("mousemove", event => {
    if (!isPanning) return;
    viewport.scrollLeft = scrollLeft - (event.clientX - startX);
    viewport.scrollTop = scrollTop - (event.clientY - startY);
  });

  window.addEventListener("mouseup", () => {
    if (!isPanning) return;
    isPanning = false;
    viewport.classList.remove("panning");
  });
}

window.addEventListener("resize", () => {
  if (document.getElementById("orgChartModal")?.classList.contains("active")) {
    requestAnimationFrame(() => fitActualOrgChartToView());
  }
});

function switchOrgCompany(company, el) {
  document.querySelectorAll(".org-tab").forEach(tab => tab.classList.remove("active"));
  if (el) el.classList.add("active");
  renderOrgChart(company);
}

function flattenOrgRows(node, company, parent = "최상위", rows = []) {
  const { emp, title, name } = orgNodeLabel(node);
  rows.push({ company, parent, title, name: name || "-", empNo: emp ? emp.empNo : "-" });
  (node.children || []).forEach(child => flattenOrgRows(child, company, title, rows));
  return rows;
}


function getOrgNodeByPath(path, company = currentOrgEditorCompany) {
  const parts = String(path || "0").split("-").map(Number);
  let node = orgStructures[company]?.root;
  for (let i = 1; i < parts.length; i++) {
    node = node?.children?.[parts[i]];
  }
  return node || null;
}

function getOrgParentByPath(path, company = currentOrgEditorCompany) {
  const parts = String(path || "0").split("-").map(Number);
  if (parts.length <= 1) return null;
  return getOrgNodeByPath(parts.slice(0, -1).join("-"), company);
}

function getOrgEditorRows(node, company, path = "0", parent = "최상위", rows = []) {
  const { emp, title, name } = orgNodeLabel(node);
  rows.push({
    company,
    path,
    parent,
    title: title || "조직",
    name: name || "-",
    empNo: emp ? emp.empNo : "-"
  });
  (node.children || []).forEach((child, index) => {
    getOrgEditorRows(child, company, `${path}-${index}`, title || "조직", rows);
  });
  return rows;
}

function renderOrgEmployeeOptions(selectedEmpNo = "") {
  const currentCompany = currentOrgEditorCompany;
  const ordered = [...employees].sort((a, b) => {
    if (a.company !== b.company) return a.company === currentCompany ? -1 : 1;
    return displayName(a).localeCompare(displayName(b), "ko");
  });

  return `<option value="">직원 미연결</option>` + ordered.map(emp => `
    <option value="${emp.empNo}" ${emp.empNo === selectedEmpNo ? "selected" : ""}>
      ${displayName(emp)} · ${emp.company} · ${emp.dept} · ${emp.empNo}
    </option>
  `).join("");
}

function renderOrgParentOptions(selectedPath = "0") {
  const rows = getOrgEditorRows(orgStructures[currentOrgEditorCompany].root, currentOrgEditorCompany);
  const current = selectedPath;
  const parentPath = current.includes("-") ? current.split("-").slice(0, -1).join("-") : "";

  return rows
    .filter(row => row.path !== current && !row.path.startsWith(`${current}-`))
    .map(row => `
      <option value="${row.path}" ${row.path === parentPath ? "selected" : ""}>
        ${"— ".repeat(row.path.split("-").length - 1)}${row.title} ${row.name !== "-" ? `· ${row.name}` : ""}
      </option>
    `).join("");
}

function renderOrgVisualNode(node, path = "0") {
  const { emp, title, name } = orgNodeLabel(node);
  const children = node.children || [];
  const selected = path === selectedOrgNodePath ? "selected" : "";
  const typeClass = node.className || "";
  const displayTitle = title || (emp ? emp.position || emp.grade : "조직");
  const displayPerson = emp ? displayName(emp) : (name || "직원 미연결");
  const meta = emp ? `${emp.company} · ${emp.dept}` : "조직 노드";

  return `
    <div class="org-v-node-wrap">
      <div class="org-v-node ${selected} ${typeClass}" onclick="selectOrgVisualNode('${path}')">
        <div class="org-v-node-top">
          <span>${displayTitle}</span>
          <small>${path}</small>
        </div>
        <strong>${displayPerson}</strong>
        <em>${meta}</em>
        ${emp ? `<button class="org-card-link" onclick="event.stopPropagation(); openMiniCardPopup('${emp.empNo}')">인사카드</button>` : ""}
      </div>
      ${children.length ? `
        <div class="org-v-children">
          ${children.map((child, index) => renderOrgVisualNode(child, `${path}-${index}`)).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

function renderOrgVisualEditor() {
  const target = document.getElementById("orgVisualCanvas");
  if (!target) return;

  const data = orgStructures[currentOrgEditorCompany];
  if (!data) return;

  if (!getOrgNodeByPath(selectedOrgNodePath, currentOrgEditorCompany)) {
    selectedOrgNodePath = "0";
  }

  setText("orgEditorCompanyLabel", currentOrgEditorCompany);
  setText("orgEditorTitle", data.title);

  target.innerHTML = `
    <div class="org-v-scroll">
      <div class="org-v-tree">
        ${renderOrgVisualNode(data.root, "0")}
      </div>
    </div>
  `;

  updateOrgInspector();
}

function updateOrgInspector() {
  const node = getOrgNodeByPath(selectedOrgNodePath);
  const inspectorTitle = document.getElementById("orgInspectorTitle");
  const titleInput = document.getElementById("orgNodeTitleInput");
  const employeeSelect = document.getElementById("orgNodeEmployeeSelect");
  const parentSelect = document.getElementById("orgNodeParentSelect");
  const classSelect = document.getElementById("orgNodeClassSelect");
  const memberColumnsSelect = document.getElementById("orgNodeMemberColumnsSelect");
  const summary = document.getElementById("orgNodeSummary");

  if (!node) {
    if (inspectorTitle) inspectorTitle.textContent = "선택 노드 없음";
    if (summary) summary.textContent = "좌측 캔버스에서 편집할 조직 또는 직원을 선택하세요.";
    return;
  }

  const { emp, title, name } = orgNodeLabel(node);
  if (inspectorTitle) inspectorTitle.textContent = name || title || "조직 노드";
  if (titleInput) titleInput.value = node.title || "";
  if (employeeSelect) employeeSelect.innerHTML = renderOrgEmployeeOptions(node.employeeId || "");
  if (parentSelect) {
    parentSelect.innerHTML = selectedOrgNodePath === "0"
      ? `<option value="">최상위 노드는 상위조직 변경 불가</option>`
      : renderOrgParentOptions(selectedOrgNodePath);
    parentSelect.disabled = selectedOrgNodePath === "0";
  }
  if (classSelect) classSelect.value = node.className || "";
  if (memberColumnsSelect) memberColumnsSelect.value = String(getOrgMemberColumnCount(node));
  if (summary) {
    summary.innerHTML = `
      <strong>현재 선택 노드</strong>
      <span>회사: ${currentOrgEditorCompany}</span>
      <span>조직/직책: ${title || "-"}</span>
      <span>연결 직원: ${emp ? `${displayName(emp)} (${emp.empNo})` : "미연결"}</span>
      <span>하위 노드: ${(node.children || []).length}개</span>
    `;
  }
}

function selectOrgVisualNode(path) {
  selectedOrgNodePath = path;
  renderOrgVisualEditor();
}

function switchOrgEditorCompany(company, el) {
  currentOrgEditorCompany = company;
  currentOrgCompany = company;
  selectedOrgNodePath = "0";
  document.querySelectorAll("[data-org-editor-company]").forEach(tab => tab.classList.remove("active"));
  if (el) el.classList.add("active");
  renderOrgVisualEditor();
}

function updateSelectedOrgNodeField(field, value) {
  const node = getOrgNodeByPath(selectedOrgNodePath);
  if (!node) return;

  if (field === "employeeId" && !value) {
    delete node.employeeId;
  } else if (field === "title" && !value.trim()) {
    delete node.title;
  } else if (field === "className" && !value) {
    delete node.className;
  } else if (field === "memberColumns") {
    const nextColumns = Number(value);
    node.memberColumns = Math.max(1, Math.min(3, Number.isFinite(nextColumns) ? nextColumns : 3));
  } else {
    node[field] = value;
  }

  renderOrgVisualEditor();
  renderOrgChart(currentOrgEditorCompany);
}

function addOrgChildNode() {
  const node = getOrgNodeByPath(selectedOrgNodePath);
  if (!node) return showToast("하위 노드를 추가할 조직을 선택해 주세요.");
  if (!node.children) node.children = [];
  node.children.push({ title: "신규 조직", children: [] });
  selectedOrgNodePath = `${selectedOrgNodePath}-${node.children.length - 1}`;
  renderOrgVisualEditor();
  renderOrgChart(currentOrgEditorCompany);
  showToast("하위 노드를 추가했습니다.");
}

function addOrgSiblingNode(direction = "right") {
  if (selectedOrgNodePath === "0") {
    showToast("최상위 노드는 같은 단계 추가가 불가합니다. 하위 노드로 추가해 주세요.");
    return;
  }

  const parent = getOrgParentByPath(selectedOrgNodePath);
  if (!parent) return;
  if (!parent.children) parent.children = [];

  const parts = selectedOrgNodePath.split("-");
  const index = Number(parts.pop());
  const insertIndex = direction === "left" ? index : index + 1;

  parent.children.splice(insertIndex, 0, { title: "신규 조직", children: [] });
  const parentPath = parts.join("-");
  selectedOrgNodePath = parentPath ? `${parentPath}-${insertIndex}` : `${insertIndex}`;

  renderOrgVisualEditor();
  renderOrgChart(currentOrgEditorCompany);
  showToast(direction === "left" ? "왼쪽 같은 단계 노드를 추가했습니다." : "오른쪽 같은 단계 노드를 추가했습니다.");
}

function moveOrgNode(direction) {
  if (selectedOrgNodePath === "0") return showToast("최상위 노드는 이동할 수 없습니다.");
  const parent = getOrgParentByPath(selectedOrgNodePath);
  if (!parent?.children) return;
  const parts = selectedOrgNodePath.split("-");
  const index = Number(parts.pop());
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= parent.children.length) return showToast("더 이상 이동할 수 없습니다.");
  [parent.children[index], parent.children[nextIndex]] = [parent.children[nextIndex], parent.children[index]];
  selectedOrgNodePath = `${parts.join("-")}-${nextIndex}`;
  renderOrgVisualEditor();
  renderOrgChart(currentOrgEditorCompany);
}

function deleteOrgNode() {
  if (selectedOrgNodePath === "0") return showToast("최상위 노드는 삭제할 수 없습니다.");
  const parent = getOrgParentByPath(selectedOrgNodePath);
  if (!parent?.children) return;
  const index = Number(selectedOrgNodePath.split("-").pop());
  parent.children.splice(index, 1);
  selectedOrgNodePath = selectedOrgNodePath.split("-").slice(0, -1).join("-") || "0";
  renderOrgVisualEditor();
  renderOrgChart(currentOrgEditorCompany);
  showToast("선택 노드를 삭제했습니다.");
}

function changeSelectedOrgParent(newParentPath) {
  if (!newParentPath || selectedOrgNodePath === "0" || newParentPath === selectedOrgNodePath) return;
  const oldParent = getOrgParentByPath(selectedOrgNodePath);
  const movingNode = getOrgNodeByPath(selectedOrgNodePath);
  const newParent = getOrgNodeByPath(newParentPath);
  if (!oldParent?.children || !movingNode || !newParent) return;

  const oldIndex = Number(selectedOrgNodePath.split("-").pop());
  oldParent.children.splice(oldIndex, 1);
  if (!newParent.children) newParent.children = [];
  newParent.children.push(movingNode);
  selectedOrgNodePath = `${newParentPath}-${newParent.children.length - 1}`;
  renderOrgVisualEditor();
  renderOrgChart(currentOrgEditorCompany);
  showToast("상위 조직을 변경했습니다.");
}

function openSelectedOrgEmployeeCard() {
  const node = getOrgNodeByPath(selectedOrgNodePath);
  if (!node?.employeeId) return showToast("연결된 직원이 없습니다.");
  openMiniCardPopup(node.employeeId);
}

function saveOrgVisualEditor() {
  renderOrgVisualEditor();
  renderOrgChart(currentOrgEditorCompany);
  showToast("조직도 편집 설정이 저장되었습니다.");
}

function renderOrgEditor() {
  renderOrgVisualEditor();
}



let orgEditorPopupWindow = null;
let orgEditorDragSourcePath = null;
let orgEditorPopupZoom = 1;
let orgEditorPopupAutoFit = true;

function findOrgNodePathByReference(targetNode, company = currentOrgEditorCompany) {
  const root = orgStructures[company]?.root;
  let found = null;
  function walk(node, path) {
    if (!node || found) return;
    if (node === targetNode) {
      found = path;
      return;
    }
    (node.children || []).forEach((child, index) => walk(child, `${path}-${index}`));
  }
  walk(root, "0");
  return found;
}

function moveOrgNodeToParentByDrag(sourcePath, targetPath) {
  if (!sourcePath || !targetPath) return;
  if (sourcePath === "0") return showToast("최상위 노드는 드래그 이동할 수 없습니다.");
  if (sourcePath === targetPath || targetPath.startsWith(`${sourcePath}-`)) {
    return showToast("자기 자신 또는 하위 조직으로는 이동할 수 없습니다.");
  }

  const sourceParent = getOrgParentByPath(sourcePath);
  const movingNode = getOrgNodeByPath(sourcePath);
  const targetNode = getOrgNodeByPath(targetPath);
  if (!sourceParent?.children || !movingNode || !targetNode) return;

  const sourceIndex = Number(sourcePath.split("-").pop());
  sourceParent.children.splice(sourceIndex, 1);
  if (!targetNode.children) targetNode.children = [];
  targetNode.children.push(movingNode);
  selectedOrgNodePath = findOrgNodePathByReference(movingNode) || selectedOrgNodePath;

  renderOrgChart(currentOrgEditorCompany);
  renderOrgVisualEditor();
  renderOrgVisualEditorPopup();
  showToast("드래그한 노드를 선택 조직의 하위로 이동했습니다.");
}

function renderOrgPopupEmployeeOptions(selectedEmpNo = "") {
  const currentCompany = currentOrgEditorCompany;
  const ordered = [...employees].sort((a, b) => {
    if (a.company !== b.company) return a.company === currentCompany ? -1 : 1;
    return displayName(a).localeCompare(displayName(b), "ko");
  });
  return `<option value="">직원 미연결</option>` + ordered.map(emp => `
    <option value="${emp.empNo}" ${emp.empNo === selectedEmpNo ? "selected" : ""}>
      ${displayName(emp)} · ${emp.company} · ${emp.dept} · ${emp.empNo}
    </option>
  `).join("");
}

function renderOrgPopupParentOptions(selectedPath = "0") {
  const rows = getOrgEditorRows(orgStructures[currentOrgEditorCompany].root, currentOrgEditorCompany);
  const current = selectedPath;
  const parentPath = current.includes("-") ? current.split("-").slice(0, -1).join("-") : "";

  return rows
    .filter(row => row.path !== current && !row.path.startsWith(`${current}-`))
    .map(row => `
      <option value="${row.path}" ${row.path === parentPath ? "selected" : ""}>
        ${"— ".repeat(row.path.split("-").length - 1)}${row.title} ${row.name !== "-" ? `· ${row.name}` : ""}
      </option>
    `).join("");
}

function getOrgPopupNodeClass(node, depth) {
  const raw = (node.title || node.employeeId || "node").toString();
  const slug = raw
    .replace(/[^0-9a-zA-Z가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `depth-${depth} org-popup-${slug || "node"}`;
}

function isOrgBranchNode(node, depth = 0) {
  if (!node) return false;

  const children = Array.isArray(node.children) ? node.children : [];
  const title = String(node.title || "");
  const structuralTitlePattern = /(본부|센터|파트|팀|T\/F|TF|QC|마감|구조|토목|조경|개발|클레임|공사비|Management|Director|Finish|Structure|Civil|Internal|Partition|Opening|External|Vertical|Horizon|Foundation)/i;

  if (!node.employeeId) return true;
  if (children.length > 0) return true;
  if (structuralTitlePattern.test(title)) return true;
  if (depth <= 2 && title && !/^(대표|부사장|상무|본부장|실장|팀장|수석|책임|선임|프로|사원|Staff|Team Leader|Asst\. Team Leader)$/i.test(title)) return true;

  return false;
}

function getOrgMemberColumnCount(node) {
  const raw = Number(node?.memberColumns || node?.layoutColumns || 3);
  return Math.max(1, Math.min(3, Number.isFinite(raw) ? raw : 3));
}

function renderOrgPopupNode(node, path = "0", depth = 0) {
  const { emp, title, name } = orgNodeLabel(node);
  const children = node.children || [];
  const selected = path === selectedOrgNodePath ? "selected" : "";
  const typeClass = node.className || "";
  const layoutClass = getOrgPopupNodeClass(node, depth);
  const displayTitle = title || (emp ? emp.position || emp.grade : "조직");
  const displayPerson = emp ? displayName(emp) : (name || "직원 미연결");
  const meta = emp ? `${emp.company} · ${emp.dept}` : "조직 노드";

  const childItems = children.map((child, index) => ({ child, index }));
  const branchChildren = childItems.filter(item => isOrgBranchNode(item.child, depth + 1));
  const leafChildren = childItems.filter(item => !isOrgBranchNode(item.child, depth + 1));
  const memberColumns = getOrgMemberColumnCount(node);
  const branchColumns = Math.max(1, branchChildren.length);

  return `
    <div class="popup-node-wrap ${layoutClass}" data-path="${path}" data-title="${displayTitle}">
      <div class="popup-node ${selected} ${typeClass} depth-${depth}"
        draggable="true"
        ondragstart="if(event.ctrlKey){event.preventDefault();return false;} opener.startOrgPopupDrag('${path}')"
        ondragover="event.preventDefault(); this.classList.add('drop-ready')"
        ondragleave="this.classList.remove('drop-ready')"
        ondrop="event.preventDefault(); this.classList.remove('drop-ready'); opener.dropOrgPopupNode('${path}')"
        onclick="opener.selectOrgPopupNode('${path}')">
        <div class="popup-node-top"><span>${displayTitle}</span><small>${path}</small></div>
        <strong>${displayPerson}</strong>
        <em>${meta}</em>
        <div class="popup-node-actions">
          ${emp ? `<button onclick="event.stopPropagation(); opener.openMiniCardPopup('${emp.empNo}')">인사카드</button>` : `<button onclick="event.stopPropagation(); opener.selectOrgPopupNode('${path}')">속성편집</button>`}
        </div>
      </div>

      ${branchChildren.length ? `
        <div class="popup-branch-children depth-${depth} count-${branchChildren.length}" style="grid-template-columns:repeat(${branchColumns}, max-content);">
          ${branchChildren.map(({ child, index }) => renderOrgPopupNode(child, `${path}-${index}`, depth + 1)).join("")}
        </div>
      ` : ""}

      ${leafChildren.length ? `
        <div class="popup-member-children depth-${depth} count-${leafChildren.length} cols-${memberColumns}" style="grid-template-columns:repeat(${memberColumns}, 150px);">
          ${leafChildren.map(({ child, index }) => renderOrgPopupNode(child, `${path}-${index}`, depth + 1)).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

function buildOrgPopupHtml() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>CON-COST 조직도 대형 편집창</title>
<style>
  :root{--bg:#f4f6fb;--panel:#fff;--text:#0f172a;--muted:#64748b;--line:#dbe3ef;--blue:#2563eb;--blue2:#1d4ed8;--red:#dc2626;--shadow:0 16px 46px rgba(15,23,42,.10)}
  *{box-sizing:border-box;margin:0;padding:0} body{font-family:"Pretendard","Noto Sans KR",Arial,sans-serif;background:var(--bg);color:var(--text);overflow:hidden} button,input,select{font-family:inherit}
  .popup-shell{height:100vh;display:grid;grid-template-rows:64px 1fr}
  .popup-top{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:0 20px;background:#fff;border-bottom:1px solid var(--line)}
  .popup-title strong{display:block;font-size:18px}.popup-title span{display:block;margin-top:3px;color:var(--muted);font-size:12px;font-weight:800}.popup-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .btn{border:0;border-radius:13px;padding:10px 14px;font-weight:900;cursor:pointer;background:#fff;color:#334155;border:1px solid var(--line)}.btn-primary{background:var(--blue);color:#fff;border-color:var(--blue)}.btn-danger{background:#fee2e2;color:var(--red);border-color:#fecaca}.btn-dark{background:#0f172a;color:#fff;border-color:#0f172a}.btn:disabled{opacity:.45;cursor:not-allowed}
  .popup-main{display:grid;grid-template-columns:1fr 360px;height:calc(100vh - 64px);min-height:0}.popup-canvas-wrap{min-width:0;min-height:0;display:flex;flex-direction:column;background:#f8fafc}.canvas-head{height:56px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 16px;border-bottom:1px solid var(--line);background:#fff}.tabs{display:flex;gap:7px}.tab{border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 12px;font-weight:900;cursor:pointer}.tab.active{background:#0f172a;color:#fff;border-color:#0f172a}.guide{font-size:12px;color:var(--muted);font-weight:800}.popup-canvas{position:relative;flex:1;overflow:auto;background-color:#f8fbff;background-image:linear-gradient(#e8eef7 1px,transparent 1px),linear-gradient(90deg,#e8eef7 1px,transparent 1px);background-size:32px 32px;cursor:default}.popup-canvas.ctrl-pan{cursor:grabbing;user-select:none}.popup-tree{display:block;min-width:0;min-height:0;padding:46px 56px;transform-origin:top left}.popup-tree-inner{display:flex;justify-content:center;align-items:flex-start;transform-origin:top left}.popup-node-wrap{display:flex;flex-direction:column;align-items:center;position:relative}.popup-node-children{display:grid;grid-template-columns:repeat(auto-fit,minmax(184px,max-content));align-items:start;justify-content:center;gap:38px 20px;width:min(100%,1380px);padding-top:44px;position:relative}.popup-node-children::before{content:"";position:absolute;top:22px;left:40px;right:40px;height:2px;background:#bfccdc}.popup-node-wrap::before{content:"";position:absolute;top:-22px;width:2px;height:22px;background:#bfccdc}.popup-tree-inner>.popup-node-wrap::before{display:none}.popup-node{width:176px;min-height:116px;background:#fff;border:2px solid #cfe0f6;border-radius:18px;box-shadow:0 10px 24px rgba(15,23,42,.08);padding:12px;cursor:grab;line-height:1.35;transition:.12s}.popup-node:active{cursor:grabbing}.popup-node:hover{border-color:#2563eb;transform:translateY(-1px)}.popup-node.selected{border-color:#2563eb;box-shadow:0 0 0 4px rgba(37,99,235,.15),0 12px 28px rgba(15,23,42,.11)}.popup-node.drop-ready{outline:4px solid rgba(22,163,74,.22);border-color:#16a34a}.popup-node.primary{background:#1d4ed8;color:#fff;border-color:#1d4ed8}.popup-node.secondary{background:#3b82f6;color:#fff;border-color:#3b82f6}.popup-node.dotted{background:#94a3b8;color:#fff;border-color:#94a3b8}.popup-node-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px}.popup-node-top span{font-size:12px;font-weight:900;color:#1d4ed8}.popup-node.primary .popup-node-top span,.popup-node.secondary .popup-node-top span,.popup-node.dotted .popup-node-top span{color:#fff}.popup-node-top small{font-size:11px;color:#94a3b8;font-weight:900}.popup-node strong{display:block;font-size:15px;font-weight:900;margin-bottom:7px}.popup-node em{display:block;font-style:normal;color:#64748b;font-size:12px;font-weight:900}.popup-node.primary em,.popup-node.secondary em,.popup-node.dotted em{color:rgba(255,255,255,.86)}.popup-node-actions{margin-top:10px}.popup-node-actions button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:900;cursor:pointer}.inspector{background:#fff;border-left:1px solid var(--line);padding:18px;overflow:auto}.inspector h3{font-size:12px;color:#2563eb;letter-spacing:1px;margin-bottom:7px}.inspector-title{font-size:20px;font-weight:900;padding-bottom:14px;margin-bottom:16px;border-bottom:1px solid var(--line)}.field{margin-bottom:14px}.field label{display:block;font-size:13px;font-weight:900;margin-bottom:7px;color:#334155}.field input,.field select{width:100%;border:1px solid var(--line);border-radius:14px;padding:12px;background:#fff;font-size:14px;outline:none}.field input:focus,.field select:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(37,99,235,.10)}.inspector-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0}.summary{border:1px dashed #cfe0f6;background:#f8fbff;border-radius:16px;padding:13px;line-height:1.75;font-weight:800;color:#475569;font-size:12px}.summary strong{display:block;color:#0f172a;margin-bottom:6px}.summary span{display:block}.help{margin-top:14px;border:1px solid #fed7aa;background:#fff7ed;color:#9a3412;border-radius:16px;padding:12px;font-size:12px;line-height:1.7;font-weight:800}

  .popup-tree-inner.concost-tree{min-width:1550px;justify-content:center;}
  .popup-tree-inner.concost-tree>.popup-node-wrap>.popup-node-children.depth-0{display:flex;justify-content:center;width:100%;}
  .popup-tree-inner.concost-tree .popup-node-children.depth-1{display:grid;grid-template-columns:260px minmax(620px,1fr) 260px 170px;gap:34px;align-items:start;max-width:1480px;width:1480px;}
  .popup-tree-inner.concost-tree .popup-node-children.depth-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,max-content));gap:28px 16px;align-items:start;justify-content:center;}
  .popup-tree-inner.concost-tree .popup-node-children.depth-3,
  .popup-tree-inner.concost-tree .popup-node-children.depth-4{display:grid;grid-template-columns:repeat(3,174px);gap:12px 10px;align-items:start;justify-content:center;}
  .popup-tree-inner.concost-tree .depth-2>.popup-node:not(.primary):not(.secondary){background:#eff6ff;}
  .popup-tree-inner.concost-tree .depth-3>.popup-node,
  .popup-tree-inner.concost-tree .depth-4>.popup-node{width:160px;min-height:88px;padding:10px;border-radius:13px;}
  .popup-tree-inner.concost-tree .depth-3>.popup-node strong,
  .popup-tree-inner.concost-tree .depth-4>.popup-node strong{font-size:13px;}
  .popup-tree-inner.concost-tree .depth-3>.popup-node em,
  .popup-tree-inner.concost-tree .depth-4>.popup-node em{font-size:11px;}

  /* 조직도 기준 레이아웃 보정: 직원 노드와 부서 노드를 분리 배치하여 겹침 제거 */
  .popup-tree-inner.concost-tree{min-width:1760px;align-items:flex-start;justify-content:center;}
  .popup-tree-inner.concost-tree .popup-node-wrap{width:max-content;max-width:none;}
  .popup-tree-inner.concost-tree .popup-node-children{display:none;}
  .popup-member-children,.popup-branch-children{position:relative;display:grid;justify-content:center;align-items:start;width:max-content;margin-left:auto;margin-right:auto;}
  .popup-member-children::before,.popup-branch-children::before{content:"";position:absolute;top:18px;left:28px;right:28px;height:2px;background:#bfccdc;}
  .popup-member-children>.popup-node-wrap::before,.popup-branch-children>.popup-node-wrap::before{content:"";position:absolute;top:-22px;width:2px;height:22px;background:#bfccdc;}
  .popup-member-children{grid-template-columns:repeat(1,176px);gap:12px;padding-top:40px;}
  .popup-branch-children{grid-template-columns:repeat(auto-fit,minmax(190px,max-content));gap:34px 24px;padding-top:46px;}
  .popup-tree-inner.concost-tree>.popup-node-wrap>.popup-branch-children.depth-0{display:flex;justify-content:center;}
  .popup-tree-inner.concost-tree>.popup-node-wrap>.popup-branch-children.depth-0::before{display:none;}
  .popup-tree-inner.concost-tree .org-popup-부사장>.popup-branch-children.depth-1{grid-template-columns:300px 820px 260px 190px;gap:40px;align-items:start;}
  .popup-tree-inner.concost-tree .org-popup-경영지원본부>.popup-member-children{grid-template-columns:176px;}
  .popup-tree-inner.concost-tree .org-popup-경영지원본부>.popup-branch-children{grid-template-columns:repeat(2,190px);gap:28px;}
  .popup-tree-inner.concost-tree .org-popup-개발-t-f>.popup-member-children,.popup-tree-inner.concost-tree .org-popup-qc>.popup-member-children{grid-template-columns:176px;}
  .popup-tree-inner.concost-tree .org-popup-기술본부>.popup-branch-children{grid-template-columns:360px 430px;gap:54px;}
  .popup-tree-inner.concost-tree .org-popup-마감>.popup-member-children{grid-template-columns:repeat(3,176px);gap:12px 16px;}
  .popup-tree-inner.concost-tree .org-popup-구조-토목-조경>.popup-branch-children{grid-template-columns:repeat(3,190px);gap:24px;}
  .popup-tree-inner.concost-tree .org-popup-구조팀>.popup-member-children,.popup-tree-inner.concost-tree .org-popup-bim-파트>.popup-member-children,.popup-tree-inner.concost-tree .org-popup-토목-조경파트>.popup-member-children{grid-template-columns:176px;}
  .popup-tree-inner.concost-tree .org-popup-클레임센터>.popup-member-children{grid-template-columns:176px;}
  .popup-tree-inner.concost-tree .org-popup-공사비닷컴{padding-top:44px;}
  .popup-tree-inner.concost-tree .popup-member-children .popup-node{width:176px;min-height:94px;padding:10px 12px;border-radius:14px;}
  .popup-tree-inner.concost-tree .popup-member-children .popup-node strong{font-size:13px;}
  .popup-tree-inner.concost-tree .popup-member-children .popup-node em{font-size:11px;}
  .popup-tree-inner.concost-tree .popup-node-wrap .popup-node-wrap{margin:0;}

  .popup-member-children{grid-auto-flow:row;align-items:start;}
  .popup-branch-children{grid-auto-flow:column;align-items:start;}
  .popup-member-children.cols-1{grid-template-columns:repeat(1,176px)!important;}
  .popup-member-children.cols-2{grid-template-columns:repeat(2,176px)!important;}
  .popup-member-children.cols-3{grid-template-columns:repeat(3,176px)!important;}


  /* 좌우로 넓어지는 조직도 전체가 스크롤 범위 안에 들어오도록 여백과 캔버스 폭을 보정 */
  .popup-canvas{scrollbar-gutter:stable both-edges;}
  .popup-tree{padding:90px 260px 180px;min-width:max-content;min-height:max-content;}
  .popup-tree-inner{justify-content:flex-start;width:max-content;max-width:none;}
  .popup-tree-inner.concost-tree,.popup-tree-inner.vietqs-tree{justify-content:flex-start;}
  .popup-tree-inner.concost-tree{min-width:1880px;}
  .popup-tree-inner.vietqs-tree{min-width:2100px;}
  .popup-node-wrap{flex:0 0 auto;}
  .popup-branch-children,.popup-member-children{max-width:none;}
  .popup-tree-inner.concost-tree .org-popup-부사장>.popup-branch-children.depth-1{grid-template-columns:repeat(auto-fit,minmax(220px,max-content));gap:44px;align-items:start;}
  .popup-tree-inner.concost-tree .popup-branch-children.depth-2{grid-auto-flow:column;grid-auto-columns:max-content;gap:34px;}
  .popup-tree-inner.concost-tree .org-popup-마감>.popup-member-children.cols-1{grid-template-columns:repeat(1,176px)!important;}
  .popup-tree-inner.concost-tree .org-popup-마감>.popup-member-children.cols-2{grid-template-columns:repeat(2,176px)!important;}
  .popup-tree-inner.concost-tree .org-popup-마감>.popup-member-children.cols-3{grid-template-columns:repeat(3,176px)!important;}

  /* 마우스 휠 기반 편집 UX 및 세로형 노드 보정 */
  .popup-canvas{cursor:grab;}
  .popup-canvas.wheel-pan{cursor:grabbing;user-select:none;}
  .popup-canvas.ctrl-pan{cursor:grab;}
  .popup-node{width:150px;min-height:132px;padding:11px 10px;border-radius:16px;white-space:normal;word-break:keep-all;overflow-wrap:anywhere;}
  .popup-node-top{gap:6px;align-items:flex-start;}
  .popup-node-top span{max-width:88px;line-height:1.25;}
  .popup-node strong{font-size:14px;line-height:1.32;word-break:keep-all;overflow-wrap:anywhere;}
  .popup-node em{font-size:11px;line-height:1.35;word-break:keep-all;overflow-wrap:anywhere;}
  .popup-node-actions button{padding:6px 9px;font-size:11px;}
  .popup-member-children{grid-template-columns:repeat(1,150px);}
  .popup-member-children.cols-1{grid-template-columns:repeat(1,150px)!important;}
  .popup-member-children.cols-2{grid-template-columns:repeat(2,150px)!important;}
  .popup-member-children.cols-3{grid-template-columns:repeat(3,150px)!important;}
  .popup-tree-inner.concost-tree .popup-member-children .popup-node{width:150px;min-height:112px;padding:10px;border-radius:14px;}
  .popup-tree-inner.concost-tree .org-popup-경영지원본부>.popup-member-children,
  .popup-tree-inner.concost-tree .org-popup-개발-t-f>.popup-member-children,
  .popup-tree-inner.concost-tree .org-popup-qc>.popup-member-children,
  .popup-tree-inner.concost-tree .org-popup-구조팀>.popup-member-children,
  .popup-tree-inner.concost-tree .org-popup-bim-파트>.popup-member-children,
  .popup-tree-inner.concost-tree .org-popup-토목-조경파트>.popup-member-children,
  .popup-tree-inner.concost-tree .org-popup-클레임센터>.popup-member-children{grid-template-columns:150px!important;}
  .popup-tree-inner.concost-tree .org-popup-마감>.popup-member-children.cols-1{grid-template-columns:repeat(1,150px)!important;}
  .popup-tree-inner.concost-tree .org-popup-마감>.popup-member-children.cols-2{grid-template-columns:repeat(2,150px)!important;}
  .popup-tree-inner.concost-tree .org-popup-마감>.popup-member-children.cols-3{grid-template-columns:repeat(3,150px)!important;}

  /* 하위 노드 연결선이 실제 자식 범위 밖으로 과하게 뻗지 않도록 보정 */
  .popup-member-children::before,.popup-branch-children::before{left:50%;right:50%;}
  .popup-member-children.count-1::before,.popup-branch-children.count-1::before{display:none;}
  .popup-member-children.count-2::before,.popup-branch-children.count-2::before{left:25%;right:25%;}
  .popup-member-children.count-3::before,.popup-branch-children.count-3::before{left:16.66%;right:16.66%;}
  .popup-member-children.count-4::before,.popup-branch-children.count-4::before{left:12.5%;right:12.5%;}
  .popup-member-children.count-5::before,.popup-branch-children.count-5::before{left:10%;right:10%;}
  .popup-member-children.count-6::before,.popup-branch-children.count-6::before{left:8.33%;right:8.33%;}
  .popup-member-children.count-7::before,.popup-branch-children.count-7::before{left:7.14%;right:7.14%;}
  .popup-member-children.count-8::before,.popup-branch-children.count-8::before{left:6.25%;right:6.25%;}
  .popup-member-children.count-9::before,.popup-branch-children.count-9::before{left:5.55%;right:5.55%;}
  .popup-member-children.count-10::before,.popup-branch-children.count-10::before{left:5%;right:5%;}
  .popup-member-children>.popup-node-wrap::before,.popup-branch-children>.popup-node-wrap::before{top:-22px;height:22px;}
  .popup-node.selected{position:relative;z-index:3;}

</style>
</head>
<body>
  <div class="popup-shell">
    <header class="popup-top">
      <div class="popup-title"><strong>조직도 대형 편집창</strong><span>노드 선택 · 드래그 이동 · 직원 연결 · 인사카드 연동</span></div>
      <div class="popup-actions">
        <button class="btn" onclick="opener.addOrgChildNodeFromPopup()">+ 하위 노드</button>
        <button class="btn" onclick="opener.addOrgSiblingNodeLeftFromPopup()">← 왼쪽으로 추가</button>
        <button class="btn" onclick="opener.addOrgSiblingNodeRightFromPopup()">오른쪽으로 추가 →</button>
        <button class="btn" onclick="opener.moveOrgNodeFromPopup(-1)">← 순서</button>
        <button class="btn" onclick="opener.moveOrgNodeFromPopup(1)">순서 →</button>
        <button class="btn" onclick="opener.fitOrgPopupToView(true)">화면맞춤</button>
        <button class="btn" onclick="opener.scrollOrgPopupCanvas('left')">← 전체좌측</button>
        <button class="btn" onclick="opener.scrollOrgPopupCanvas('selected')">선택위치</button>
        <button class="btn" onclick="opener.scrollOrgPopupCanvas('right')">전체우측 →</button>
        <button class="btn" onclick="opener.exportOrgStructureForAI('json')">AI용 JSON</button>
        <button class="btn" onclick="opener.exportOrgStructureForAI('md')">AI용 MD</button>
        <button class="btn" onclick="opener.zoomOrgPopup(-0.1)">-</button>
        <button class="btn" onclick="opener.zoomOrgPopup(0.1)">+</button>
        <button class="btn btn-danger" onclick="opener.deleteOrgNodeFromPopup()">삭제</button>
        <button class="btn btn-primary" onclick="opener.saveOrgVisualEditor()">저장</button>
      </div>
    </header>
    <main class="popup-main">
      <section class="popup-canvas-wrap">
        <div class="canvas-head">
          <div class="tabs">
            <button id="popupTabConcost" class="tab" onclick="opener.switchOrgPopupCompany('CON-COST')">CON-COST</button>
            <button id="popupTabVietqs" class="tab" onclick="opener.switchOrgPopupCompany('Viet QS')">Viet QS</button>
          </div>
          <div class="guide">마우스 휠 위=확대, 아래=축소 · 마우스 휠 버튼을 누른 채 드래그하면 캔버스가 이동합니다. 노드는 다른 노드 위로 드래그하면 하위 조직으로 이동합니다.</div>
        </div>
        <div class="popup-canvas" id="popupCanvas"><div class="popup-tree" id="popupTree"></div></div>
      </section>
      <aside class="inspector">
        <h3>NODE INSPECTOR</h3>
        <div class="inspector-title" id="popupInspectorTitle">선택 노드 없음</div>
        <div class="field"><label>조직/직책명</label><input id="popupNodeTitleInput" oninput="opener.updateSelectedOrgNodeFieldFromPopup('title', this.value)" /></div>
        <div class="field"><label>연결 직원</label><select id="popupNodeEmployeeSelect" onchange="opener.updateSelectedOrgNodeFieldFromPopup('employeeId', this.value)"></select></div>
        <div class="field"><label>상위 조직 변경</label><select id="popupNodeParentSelect" onchange="opener.changeSelectedOrgParentFromPopup(this.value)"></select></div>
        <div class="field"><label>표시 타입</label><select id="popupNodeClassSelect" onchange="opener.updateSelectedOrgNodeFieldFromPopup('className', this.value)"><option value="">일반</option><option value="primary">대표/최상위</option><option value="secondary">임원/상위</option><option value="dotted">외부/참조</option></select></div>
        <div class="field"><label>하위 인원 배치</label><select id="popupNodeMemberColumnsSelect" onchange="opener.updateSelectedOrgNodeFieldFromPopup('memberColumns', this.value)"><option value="1">1열 배치</option><option value="2">2열 배치</option><option value="3">3열 배치</option></select></div>
        <div class="inspector-actions"><button class="btn" onclick="opener.openSelectedOrgEmployeeCard()">인사카드 열기</button><button class="btn btn-dark" onclick="opener.renderOrgVisualEditorPopup()">변경 반영</button></div>
        <div class="summary" id="popupNodeSummary">좌측 캔버스에서 편집할 조직 또는 직원을 선택하세요.</div>
        <div class="help">부서 추가는 ‘+ 하위 노드’, ‘왼쪽으로 추가’, ‘오른쪽으로 추가’를 사용합니다. 캔버스 이동은 마우스 휠 버튼 드래그, 확대/축소는 마우스 휠 스크롤, 조직 이동은 노드 드래그 앤 드롭을 사용합니다.</div>
      </aside>
    </main>
  </div>

<script>
(function(){
  let isPanning=false;
  let startX=0, startY=0, startLeft=0, startTop=0;
  function getCanvas(){return document.getElementById('popupCanvas');}

  document.addEventListener('wheel', function(e){
    const canvas=getCanvas();
    if(!canvas || !canvas.contains(e.target)) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    if(opener && typeof opener.zoomOrgPopupAtCursor === 'function'){
      opener.zoomOrgPopupAtCursor(delta, e.clientX, e.clientY);
    }else if(opener && typeof opener.zoomOrgPopup === 'function'){
      opener.zoomOrgPopup(delta);
    }
  }, {capture:true, passive:false});

  document.addEventListener('mousedown', function(e){
    const canvas=getCanvas();
    if(!canvas || e.button !== 1 || !canvas.contains(e.target)) return;
    isPanning=true;
    startX=e.clientX; startY=e.clientY;
    startLeft=canvas.scrollLeft; startTop=canvas.scrollTop;
    canvas.classList.add('wheel-pan');
    e.preventDefault();
  }, true);

  document.addEventListener('mousemove', function(e){
    if(!isPanning) return;
    const canvas=getCanvas();
    if(!canvas) return;
    canvas.scrollLeft = startLeft - (e.clientX - startX);
    canvas.scrollTop = startTop - (e.clientY - startY);
    e.preventDefault();
  }, true);

  document.addEventListener('mouseup', function(e){
    if(!isPanning || e.button !== 1) return;
    isPanning=false;
    const canvas=getCanvas();
    if(canvas) canvas.classList.remove('wheel-pan');
    e.preventDefault();
  }, true);

  document.addEventListener('auxclick', function(e){
    const canvas=getCanvas();
    if(canvas && canvas.contains(e.target) && e.button === 1) e.preventDefault();
  }, true);
})();
</script>
</body>
</html>`;
}

function openOrgVisualEditorWindow() {
  orgEditorPopupAutoFit = true;
  orgEditorPopupWindow = window.open("", "CONCOST_ORG_VISUAL_EDITOR", "width=1900,height=1050,left=40,top=20,resizable=yes,scrollbars=yes");
  if (!orgEditorPopupWindow) return showToast("팝업이 차단되었습니다. 브라우저 팝업 허용 후 다시 실행해 주세요.");
  orgEditorPopupWindow.document.open();
  orgEditorPopupWindow.document.write(buildOrgPopupHtml());
  orgEditorPopupWindow.document.close();
  orgEditorPopupWindow.opener = window;
  setTimeout(() => renderOrgVisualEditorPopup(), 50);
}

function renderOrgVisualEditorPopup() {
  const win = orgEditorPopupWindow;
  if (!win || win.closed) return;
  const doc = win.document;
  const data = orgStructures[currentOrgEditorCompany];
  if (!data) return;
  if (!getOrgNodeByPath(selectedOrgNodePath, currentOrgEditorCompany)) selectedOrgNodePath = "0";

  const tree = doc.getElementById("popupTree");
  if (tree) {
    tree.innerHTML = `<div class="popup-tree-inner ${currentOrgEditorCompany === "CON-COST" ? "concost-tree" : "vietqs-tree"}">${renderOrgPopupNode(data.root, "0", 0)}</div>`;
    applyOrgPopupScale();
    if (orgEditorPopupAutoFit) {
      win.requestAnimationFrame(() => fitOrgPopupToView(false));
    }
  }

  doc.getElementById("popupTabConcost")?.classList.toggle("active", currentOrgEditorCompany === "CON-COST");
  doc.getElementById("popupTabVietqs")?.classList.toggle("active", currentOrgEditorCompany === "Viet QS");
  updateOrgPopupInspector();
}

function applyOrgPopupScale() {
  const win = orgEditorPopupWindow;
  if (!win || win.closed) return;
  const doc = win.document;
  const tree = doc.getElementById("popupTree");
  const inner = tree?.querySelector(".popup-tree-inner");
  if (!tree || !inner) return;

  const scale = Number(orgEditorPopupZoom.toFixed(3));
  inner.style.transform = `scale(${scale})`;
  const baseWidth = Math.max(inner.scrollWidth || inner.offsetWidth || 0, 1);
  const baseHeight = Math.max(inner.scrollHeight || inner.offsetHeight || 0, 1);
  const horizontalSafeArea = 560;
  const verticalSafeArea = 320;
  tree.style.width = `${Math.ceil(baseWidth * scale + horizontalSafeArea)}px`;
  tree.style.height = `${Math.ceil(baseHeight * scale + verticalSafeArea)}px`;
  tree.style.transform = "none";
}

function fitOrgPopupToView(force = false) {
  const win = orgEditorPopupWindow;
  if (!win || win.closed) return;
  const doc = win.document;
  const canvas = doc.getElementById("popupCanvas");
  const tree = doc.getElementById("popupTree");
  const inner = tree?.querySelector(".popup-tree-inner");
  if (!canvas || !tree || !inner) return;

  if (force) orgEditorPopupAutoFit = true;

  inner.style.transform = "scale(1)";
  tree.style.width = "auto";
  tree.style.height = "auto";

  const baseWidth = Math.max(inner.scrollWidth || inner.offsetWidth || 1, 1);
  const baseHeight = Math.max(inner.scrollHeight || inner.offsetHeight || 1, 1);
  const availableWidth = Math.max(canvas.clientWidth - 220, 360);
  const availableHeight = Math.max(canvas.clientHeight - 180, 360);
  const nextScale = Math.min(1, availableWidth / baseWidth, availableHeight / baseHeight);

  orgEditorPopupZoom = Math.max(0.26, Math.min(1, Number(nextScale.toFixed(3))));
  applyOrgPopupScale();
  scrollOrgPopupCanvas(force ? "selected" : "center");
}
function scrollOrgPopupCanvas(mode = "center") {
  const win = orgEditorPopupWindow;
  if (!win || win.closed) return;
  const doc = win.document;
  const canvas = doc.getElementById("popupCanvas");
  const tree = doc.getElementById("popupTree");
  if (!canvas || !tree) return;

  if (mode === "left") {
    canvas.scrollLeft = 0;
    return;
  }
  if (mode === "right") {
    canvas.scrollLeft = Math.max(0, tree.scrollWidth - canvas.clientWidth);
    return;
  }
  if (mode === "center") {
    canvas.scrollLeft = Math.max(0, (tree.scrollWidth - canvas.clientWidth) / 2);
    canvas.scrollTop = 0;
    return;
  }

  const selected = doc.querySelector(".popup-node.selected");
  if (!selected) {
    canvas.scrollLeft = Math.max(0, (tree.scrollWidth - canvas.clientWidth) / 2);
    canvas.scrollTop = 0;
    return;
  }
  const canvasRect = canvas.getBoundingClientRect();
  const nodeRect = selected.getBoundingClientRect();
  canvas.scrollLeft += (nodeRect.left + nodeRect.width / 2) - (canvasRect.left + canvas.clientWidth / 2);
  canvas.scrollTop += (nodeRect.top + nodeRect.height / 2) - (canvasRect.top + canvas.clientHeight / 2);
}

function cloneOrgNodeForExport(node, path = "0", depth = 0, parentPath = "") {
  const { emp, title, name } = orgNodeLabel(node);
  const children = node.children || [];
  return {
    path,
    parentPath,
    depth,
    title: title || "",
    displayName: name || title || "",
    className: node.className || "",
    memberColumns: getOrgMemberColumnCount(node),
    employee: emp ? {
      empNo: emp.empNo,
      name: displayName(emp),
      company: emp.company,
      dept: emp.dept,
      grade: emp.grade,
      position: emp.position || "",
      status: emp.status || ""
    } : null,
    children: children.map((child, index) => cloneOrgNodeForExport(child, `${path}-${index}`, depth + 1, path))
  };
}

function flattenOrgForExport(node, rows = [], path = "0", depth = 0, parentPath = "", parentTitle = "") {
  const { emp, title, name } = orgNodeLabel(node);
  rows.push({
    path,
    parentPath,
    parentTitle,
    depth,
    title: title || "",
    displayName: name || title || "",
    employeeNo: emp?.empNo || "",
    employeeName: emp ? displayName(emp) : "",
    company: emp?.company || currentOrgEditorCompany,
    dept: emp?.dept || "",
    grade: emp?.grade || "",
    memberColumns: getOrgMemberColumnCount(node),
    childCount: (node.children || []).length
  });
  (node.children || []).forEach((child, index) => flattenOrgForExport(child, rows, `${path}-${index}`, depth + 1, path, title || name || ""));
  return rows;
}

function orgExportToMarkdown(company, root) {
  const rows = flattenOrgForExport(root, [], "0", 0, "", "");
  const lines = [];
  lines.push(`# ${company} 조직도 AI 판독용 자료`);
  lines.push("");
  lines.push(`- 생성일시: ${new Date().toLocaleString("ko-KR")}`);
  lines.push(`- 기준 회사: ${company}`);
  lines.push(`- 총 노드 수: ${rows.length}`);
  lines.push("- path는 조직도 내 위치이며, parentPath가 같으면 같은 단계의 형제 노드입니다.");
  lines.push("- memberColumns는 하위 인원을 1열/2열/3열 중 몇 열로 배치할지 나타냅니다.");
  lines.push("");
  lines.push("## 계층 구조");
  rows.forEach(row => {
    const indent = "  ".repeat(row.depth);
    const emp = row.employeeName ? ` / 직원: ${row.employeeName}(${row.employeeNo})` : " / 직원 미연결";
    lines.push(`${indent}- [${row.path}] ${row.title || row.displayName}${emp} / 상위: ${row.parentTitle || "-"} / 하위배치: ${row.memberColumns}열`);
  });
  lines.push("");
  lines.push("## 표 형식");
  lines.push("| path | parentPath | depth | 조직/직책 | 직원 | 회사 | 부서 | 직급 | 하위배치 | 하위수 |");
  lines.push("|---|---|---:|---|---|---|---|---|---:|---:|");
  rows.forEach(row => {
    lines.push(`| ${row.path} | ${row.parentPath || "-"} | ${row.depth} | ${row.title || row.displayName || "-"} | ${row.employeeName || "-"} | ${row.company || "-"} | ${row.dept || "-"} | ${row.grade || "-"} | ${row.memberColumns} | ${row.childCount} |`);
  });
  return lines.join("\n");
}

function downloadTextFile(filename, content, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 300);
}

function exportOrgStructureForAI(format = "json") {
  const company = currentOrgEditorCompany;
  const root = orgStructures[company]?.root;
  if (!root) return showToast("내보낼 조직도 자료가 없습니다.");
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  if (format === "md") {
    downloadTextFile(`org-chart-${company.replaceAll(" ", "-")}-${stamp}-AI.md`, orgExportToMarkdown(company, root), "text/markdown");
    showToast("AI 판독용 Markdown 조직도 자료를 내보냈습니다.");
    return;
  }
  const payload = {
    schema: "CON-COST_ORG_CHART_AI_EXPORT_V1",
    exportedAt: new Date().toISOString(),
    company,
    description: "path와 parentPath 기준으로 조직 관계를 판독합니다. 같은 parentPath를 가진 노드는 같은 단계의 형제 조직입니다.",
    root: cloneOrgNodeForExport(root),
    flatRows: flattenOrgForExport(root)
  };
  downloadTextFile(`org-chart-${company.replaceAll(" ", "-")}-${stamp}-AI.json`, JSON.stringify(payload, null, 2), "application/json");
  showToast("AI 판독용 JSON 조직도 자료를 내보냈습니다.");
}


function updateOrgPopupInspector() {
  const win = orgEditorPopupWindow;
  if (!win || win.closed) return;
  const doc = win.document;
  const node = getOrgNodeByPath(selectedOrgNodePath);
  if (!node) return;
  const { emp, title, name } = orgNodeLabel(node);

  const inspectorTitle = doc.getElementById("popupInspectorTitle");
  const titleInput = doc.getElementById("popupNodeTitleInput");
  const employeeSelect = doc.getElementById("popupNodeEmployeeSelect");
  const parentSelect = doc.getElementById("popupNodeParentSelect");
  const classSelect = doc.getElementById("popupNodeClassSelect");
  const memberColumnsSelect = doc.getElementById("popupNodeMemberColumnsSelect");
  const summary = doc.getElementById("popupNodeSummary");

  if (inspectorTitle) inspectorTitle.textContent = name || title || "조직 노드";
  if (titleInput) titleInput.value = node.title || "";
  if (employeeSelect) employeeSelect.innerHTML = renderOrgPopupEmployeeOptions(node.employeeId || "");
  if (parentSelect) {
    parentSelect.innerHTML = selectedOrgNodePath === "0"
      ? `<option value="">최상위 노드는 상위조직 변경 불가</option>`
      : renderOrgPopupParentOptions(selectedOrgNodePath);
    parentSelect.disabled = selectedOrgNodePath === "0";
  }
  if (classSelect) classSelect.value = node.className || "";
  if (memberColumnsSelect) memberColumnsSelect.value = String(getOrgMemberColumnCount(node));
  if (summary) {
    summary.innerHTML = `
      <strong>현재 선택 노드</strong>
      <span>회사: ${currentOrgEditorCompany}</span>
      <span>조직/직책: ${title || "-"}</span>
      <span>연결 직원: ${emp ? `${displayName(emp)} (${emp.empNo})` : "미연결"}</span>
      <span>하위 노드: ${(node.children || []).length}개</span>
      <span>하위 인원 배치: ${getOrgMemberColumnCount(node)}열</span>
      <span>경로: ${selectedOrgNodePath}</span>
    `;
  }
}

function selectOrgPopupNode(path) {
  selectedOrgNodePath = path;
  renderOrgVisualEditor();
  renderOrgVisualEditorPopup();
}

function startOrgPopupDrag(path) {
  orgEditorDragSourcePath = path;
}

function dropOrgPopupNode(targetPath) {
  moveOrgNodeToParentByDrag(orgEditorDragSourcePath, targetPath);
  orgEditorDragSourcePath = null;
}

function switchOrgPopupCompany(company) {
  currentOrgEditorCompany = company;
  currentOrgCompany = company;
  selectedOrgNodePath = "0";
  orgEditorPopupAutoFit = true;
  renderOrgVisualEditor();
  renderOrgVisualEditorPopup();
}

function updateSelectedOrgNodeFieldFromPopup(field, value) {
  updateSelectedOrgNodeField(field, value);
  renderOrgVisualEditorPopup();
}

function changeSelectedOrgParentFromPopup(value) {
  changeSelectedOrgParent(value);
  renderOrgVisualEditorPopup();
}

function addOrgChildNodeFromPopup() {
  addOrgChildNode();
  renderOrgVisualEditorPopup();
}

function addOrgSiblingNodeFromPopup() {
  addOrgSiblingNode("right");
  renderOrgVisualEditorPopup();
}

function addOrgSiblingNodeLeftFromPopup() {
  addOrgSiblingNode("left");
  renderOrgVisualEditorPopup();
}

function addOrgSiblingNodeRightFromPopup() {
  addOrgSiblingNode("right");
  renderOrgVisualEditorPopup();
}

function moveOrgNodeFromPopup(direction) {
  moveOrgNode(direction);
  renderOrgVisualEditorPopup();
}

function deleteOrgNodeFromPopup() {
  deleteOrgNode();
  renderOrgVisualEditorPopup();
}


function zoomOrgPopupAtCursor(delta, clientX, clientY) {
  const win = orgEditorPopupWindow;
  if (!win || win.closed) return;
  const doc = win.document;
  const canvas = doc.getElementById("popupCanvas");
  if (!canvas) return zoomOrgPopup(delta);

  orgEditorPopupAutoFit = false;
  const oldZoom = orgEditorPopupZoom;
  const nextZoom = Math.max(0.22, Math.min(1.8, Number((oldZoom + delta).toFixed(2))));
  if (nextZoom === oldZoom) return;

  const rect = canvas.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const beforeX = (canvas.scrollLeft + localX) / oldZoom;
  const beforeY = (canvas.scrollTop + localY) / oldZoom;

  orgEditorPopupZoom = nextZoom;
  renderOrgVisualEditorPopup();

  win.requestAnimationFrame(() => {
    canvas.scrollLeft = Math.max(0, beforeX * nextZoom - localX);
    canvas.scrollTop = Math.max(0, beforeY * nextZoom - localY);
  });
}

function zoomOrgPopup(delta) {
  orgEditorPopupAutoFit = false;
  orgEditorPopupZoom = Math.max(0.22, Math.min(1.8, Number((orgEditorPopupZoom + delta).toFixed(2))));
  renderOrgVisualEditorPopup();
}


function openOrgChart() {
  document.getElementById("orgChartModal")?.classList.add("active");
  renderOrgChart(currentOrgCompany);
  requestAnimationFrame(() => fitActualOrgChartToView());
}

function closeOrgChart() {
  document.getElementById("orgChartModal")?.classList.remove("active");
}

function openMiniCardPopup(empNo) {
  const emp = employees.find(e => e.empNo === empNo);
  if (!emp) return;

  setText("miniPopupPhoto", displayName(emp)[0]);
  setText("miniPopupName", displayName(emp));
  setText("miniPopupCompany", emp.company);
  setText("miniPopupDept", emp.dept);
  setText("miniPopupGrade", emp.grade);
  setText("miniPopupEmail", emp.email);
  setText("miniPopupPhone", emp.phone);
  setText("miniPopupWorkplace", emp.workplace);

  const tags = document.getElementById("miniPopupTags");
  if (tags) {
    tags.innerHTML = `
      ${companyBadge(emp.company)}
      <span class="badge blue">${emp.dept}</span>
      <span class="badge gray">${emp.grade}</span>
      ${statusBadge(emp.status)}
    `;
  }

  document.getElementById("miniCardModal")?.classList.add("active");
}

function closeMiniCardPopup() {
  document.getElementById("miniCardModal")?.classList.remove("active");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("active");
  setTimeout(() => toast.classList.remove("active"), 2200);
}

function formatPhoneByCountry(value, country) {
  const digits = value.replace(/\D/g, "");

  if (country === "VN") {
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 10)}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

function bindPhoneFormatter(inputSelector, countrySelector) {
  const input = document.querySelector(inputSelector);
  const country = document.querySelector(countrySelector);
  if (!input || !country) return;

  input.addEventListener("input", () => {
    input.value = formatPhoneByCountry(input.value, country.value);
  });

  country.addEventListener("change", () => {
    input.value = "";
    input.placeholder = country.value === "VN" ? "0987-654-321" : "010-1234-5678";
  });
}

function formatNationalId(value, country) {
  const digits = value.replace(/\D/g, "");
  if (country === "VN") return digits.slice(0, 13);
  if (digits.length <= 6) return digits;
  return `${digits.slice(0, 6)}-${digits.slice(6, 13)}`;
}

function bindNationalIdFormatter() {
  const input = document.getElementById("nationalId");
  const country = document.getElementById("idCountry");
  if (!input || !country) return;

  input.addEventListener("input", () => {
    input.value = formatNationalId(input.value, country.value);
  });

  country.addEventListener("change", () => {
    input.value = "";
    input.placeholder = country.value === "VN" ? "0792123456123" : "990301-1111111";
  });
}

document.addEventListener("click", e => {
  const employeeModal = document.getElementById("employeeModal");
  const permissionModal = document.getElementById("permissionModal");
  const excelModal = document.getElementById("excelModal");
  const orgChartModal = document.getElementById("orgChartModal");
  const miniCardModal = document.getElementById("miniCardModal");

  if (e.target === employeeModal) closeModal();
  if (e.target === permissionModal) closePermissionModal();
  if (e.target === excelModal) closeExcelModal();
  if (e.target === orgChartModal) closeOrgChart();
  if (e.target === miniCardModal) closeMiniCardPopup();
});

document.querySelectorAll(".switch-toggle input").forEach(toggle => {
  toggle.addEventListener("change", () => {
    showToast("관리자 설정값이 변경되었습니다. 저장 버튼을 눌러 반영하세요.");
  });
});

document.querySelectorAll(".permission-field, .permission-text, .permission-card").forEach(el => {
  el.addEventListener("click", openPermissionModal);
});

const ledgerSearch = document.getElementById("ledgerSearch");
if (ledgerSearch) {
  ledgerSearch.addEventListener("input", e => {
    renderLedger(filterEmployees(e.target.value));
  });
}

["companyFilter", "deptFilter", "gradeFilter", "statusFilter", "yearFilter"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("change", () => applyLedgerFilters(false));
});

const employeeSearch = document.getElementById("employeeSearch");
if (employeeSearch) {
  employeeSearch.addEventListener("input", e => {
    renderEmployeeList(filterEmployeesForList(e.target.value));
  });
}

bindPhoneFormatter("#phoneInput", "#phoneCountry");
bindPhoneFormatter(".modal-phone-input", ".modal-phone-country");
bindNationalIdFormatter();

renderKpis();
renderLedger(filterEmployees(""));
renderEmployeeList();
renderAnalysis();
renderAssetLedger();
renderPermissionRows();
renderOrderRows();
renderOrgEditor();
selectEmployee("EMP-2018-001");
