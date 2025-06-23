document.addEventListener("DOMContentLoaded", function () {
  const criteriaTree = document.getElementById("criteriaTree");
  const searchInput = document.getElementById("searchInput");
  const addMainCriteriaBtn = document.getElementById("addMainCriteriaBtn");
  const criteriaSideBox = document.getElementById("criteriaSideBox");
  const sideBoxParent = document.getElementById("sideBoxParent");
  const sideBoxChildren = document.getElementById("sideBoxChildren");

  let currentMethodologyCriteriaId = null;
  let currentAttachmentCriteriaId = null;
  let currentDefinitionCriteriaId = null;
  let criteriaDataCache = [];

  // Fetch criteria data from API and render tree
  async function fetchCriteria() {
    try {
      const res = await fetch("/api/criteria");
      const data = await res.json();
      criteriaDataCache = data;
      renderCriteriaTree(data);
      applyPermissions();
    } catch (error) {
      console.error("Error fetching criteria:", error);
    }
  }

  // Render criteria tree recursively
  function renderCriteriaTree(
    criteriaList,
    parentUl = criteriaTree,
    expandAll = false // collapsed by default
  ) {
    parentUl.innerHTML = "";
    criteriaList.forEach((item) => {
      const li = document.createElement("li");
      li.dataset.id = item._id;

      let statusClass = item.status === "entered" ? "entered" : "not-entered";
      let statusText = item.status === "entered" ? "✓ تم الإدخال" : "✗ فارغ ";

      // Hide buttons for main type except definition
      let buttonsHtml = "";
      if (item.type !== "main") {
        buttonsHtml = `
        <button class="btn-methodology">إدخال منهجية</button>
        <button class="btn-definition">تعريف</button>
        <button class="btn-view-details">عرض التفاصيل</button>
        <button class="btn-attachment">رفع مرفقات</button>
      `;
      } else {
        buttonsHtml = `<button class="btn-definition">تعريف</button>`;
      }

      li.innerHTML = `
<span class="toggle-children" style="cursor:pointer;">&#9656;</span>
<span class="criteria-${item.type}">${item.name}</span>
${buttonsHtml}
<span class="status ${statusClass}">${statusText}</span>
<button class="addSubCriteriaBtn">+</button>
<button class="deleteCriteriaBtn">-</button>
<button class="btn-properties">خصائص</button>
`;

      parentUl.appendChild(li);

      // Add tooltips to dynamic buttons/fields
      addTooltip(li.querySelector(".addSubCriteriaBtn"), "addSubCriteriaBtn");
      addTooltip(li.querySelector(".deleteCriteriaBtn"), "deleteCriteriaBtn");
      addTooltip(li.querySelector(".btn-methodology"), "btnMethodology");
      addTooltip(li.querySelector(".btn-attachment"), "btnAttachment");
      addTooltip(li.querySelector(".btn-view-details"), "btnViewDetails");
      addTooltip(li.querySelector(".btn-definition"), "btnDefinition");
      addTooltip(li.querySelector(".btn-properties"), "btnProperties");

      // Render children if exist
      if (item.children && item.children.length > 0) {
        const ul = document.createElement("ul");
        li.appendChild(ul);
        renderCriteriaTree(item.children, ul, expandAll);
        ul.classList.add("collapsed");
      }

      attachEventListeners(li, item.type);

      // Toggle children
      const toggleBtn = li.querySelector(".toggle-children");
      const childUl = li.querySelector("ul");
      if (toggleBtn && childUl) {
        toggleBtn.style.visibility = "visible";
        toggleBtn.classList.remove("open");
        toggleBtn.innerHTML = "&#9656;"; // right arrow

        toggleBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (childUl.classList.contains("collapsed")) {
            childUl.classList.remove("collapsed");
            toggleBtn.classList.add("open");
            toggleBtn.innerHTML = "&#9662;"; // down arrow
          } else {
            childUl.classList.add("collapsed");
            toggleBtn.classList.remove("open");
            toggleBtn.innerHTML = "&#9656;"; // right arrow
          }
        });
      } else if (toggleBtn) {
        toggleBtn.style.visibility = "hidden";
      }

      // Side box show on click
      li.addEventListener("click", function (e) {
        e.stopPropagation();
        showCriteriaSideBox(item._id);
        criteriaTree
          .querySelectorAll("li")
          .forEach((el) => (el.style.background = "#fff"));
        li.style.background = "#e6f0ff";
      });
    });
  }

  // Apply permissions to UI elements
  function applyPermissions() {
    if (!userPermissions.includes("add_criteria")) {
      addMainCriteriaBtn.style.display = "none";
    } else {
      addMainCriteriaBtn.style.display = "block";
    }

    document.querySelectorAll(".addSubCriteriaBtn").forEach((btn) => {
      btn.style.display = userPermissions.includes("add_criteria")
        ? "inline-block"
        : "none";
    });

    document.querySelectorAll(".deleteCriteriaBtn").forEach((btn) => {
      btn.style.display = userPermissions.includes("delete_criteria")
        ? "inline-block"
        : "none";
    });

    document.querySelectorAll(".btn-methodology").forEach((btn) => {
      btn.style.display = userPermissions.includes("save_criteria_methodology")
        ? "inline-block"
        : "none";
    });

    document.querySelectorAll(".btn-attachment").forEach((btn) => {
      btn.style.display = userPermissions.includes("upload_criteria_attachment")
        ? "inline-block"
        : "none";
    });

    document.querySelectorAll(".btn-definition").forEach((btn) => {
      btn.style.display =
        userPermissions.includes("save_criteria_definition") ||
        userPermissions.includes("save_criteria_methodology")
          ? "inline-block"
          : "none";
    });

    document.querySelectorAll(".btn-properties").forEach((btn) => {
      btn.style.display = userPermissions.includes("edit_criteria_properties")
        ? "inline-block"
        : "none";
    });
  }

  // Attach event listeners to buttons
  function attachEventListeners(li, type) {
    const addBtn = li.querySelector(".addSubCriteriaBtn");
    const deleteBtn = li.querySelector(".deleteCriteriaBtn");
    const methodologyBtn = li.querySelector(".btn-methodology");
    const attachmentBtn = li.querySelector(".btn-attachment");
    const definitionBtn = li.querySelector(".btn-definition");
    const propertiesBtn = li.querySelector(".btn-properties");

    if (addBtn) {
      addBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!userPermissions.includes("add_criteria")) {
          alert("ليس لديك صلاحية إضافة معيار");
          return;
        }
        let newName = prompt("أدخل اسم المعيار الجديد:");
        if (!newName) return;

        let newType;
        if (type === "main") newType = "sub";
        else if (type === "sub") newType = "point";
        else {
          alert("لا يمكن إضافة عناصر فرعية لهذا النوع");
          return;
        }

        try {
          const res = await fetch("/api/criteria", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: newName,
              type: newType,
              parent: li.dataset.id,
            }),
          });
          if (res.ok) {
            fetchCriteria();
          } else {
            alert("فشل في إضافة المعيار");
          }
        } catch (error) {
          console.error("Error adding criteria:", error);
        }
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!userPermissions.includes("delete_criteria")) {
          alert("ليس لديك صلاحية حذف معيار");
          return;
        }
        if (!confirm("هل أنت متأكد من حذف هذا المعيار؟")) return;
        try {
          const res = await fetch(`/api/criteria/${li.dataset.id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            fetchCriteria();
          } else {
            alert("فشل في حذف المعيار");
          }
        } catch (error) {
          console.error("Error deleting criteria:", error);
        }
      });
    }

    if (methodologyBtn) {
      methodologyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!userPermissions.includes("save_criteria_methodology")) {
          alert("ليس لديك صلاحية تعديل المنهجية");
          return;
        }
        currentMethodologyCriteriaId = li.dataset.id;
        fetch("/api/criteria")
          .then((res) => res.json())
          .then((data) => {
            const criteria = findCriteriaById(
              data,
              currentMethodologyCriteriaId
            );
            document.getElementById("methodologyText").value =
              criteria?.methodology || "";
            document.getElementById("methodologyModal").style.display = "block";
          });
      });
    }

    if (attachmentBtn) {
      attachmentBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!userPermissions.includes("upload_criteria_attachment")) {
          alert("ليس لديك صلاحية رفع المرفقات");
          return;
        }
        currentAttachmentCriteriaId = li.dataset.id;
        document.getElementById("attachmentFileInput").value = "";
        document.getElementById("attachmentUploadStatus").textContent = "";
        document.getElementById("attachmentModal").style.display = "block";
      });
    }

    if (definitionBtn) {
      definitionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (
          !userPermissions.includes("save_criteria_definition") &&
          !userPermissions.includes("save_criteria_methodology")
        ) {
          alert("ليس لديك صلاحية تعديل التعريف");
          return;
        }
        currentDefinitionCriteriaId = li.dataset.id;
        fetch("/api/criteria")
          .then((res) => res.json())
          .then((data) => {
            const criteria = findCriteriaById(
              data,
              currentDefinitionCriteriaId
            );
            document.getElementById("definitionText").value =
              criteria?.definition || "";
            document.getElementById("definitionModal").style.display = "block";
          });
      });
    }

    if (propertiesBtn) {
      propertiesBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!userPermissions.includes("edit_criteria_properties")) {
          alert("ليس لديك صلاحية تعديل الخصائص");
          return;
        }
        currentPropertiesCriteriaId = li.dataset.id;
        fetch("/api/criteria")
          .then((res) => res.json())
          .then((data) => {
            const criteria = findCriteriaById(
              data,
              currentPropertiesCriteriaId
            );
            const properties = criteria?.properties || [];
            showPropertiesModal(properties);
          });
      });
    }
  }

  // Helper to find criteria by id in tree
  function findCriteriaById(criteriaList, id) {
    for (const item of criteriaList) {
      if (item._id === id) return item;
      if (item.children) {
        const found = findCriteriaById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to find parent of a node by id
  function findParentById(criteriaList, id, parent = null) {
    for (const item of criteriaList) {
      if (item._id === id) return parent;
      if (item.children) {
        const found = findParentById(item.children, id, item);
        if (found) return found;
      }
    }
    return null;
  }

  // Show side box with parent and children info
  function showCriteriaSideBox(id) {
    const node = findCriteriaById(criteriaDataCache, id);
    if (!node) {
      criteriaSideBox.style.display = "none";
      return;
    }
    const parent = findParentById(criteriaDataCache, id);
    if (parent && parent.name) {
      sideBoxParent.innerHTML = `<strong>الأب:</strong> <span>${parent.name}</span>`;
    } else if (parent && !parent.name) {
      sideBoxParent.innerHTML = `<strong>الأب:</strong> <span style="color:#aaa;">(لا يوجد اسم)</span>`;
    } else {
      sideBoxParent.innerHTML = `<strong>الأب:</strong> <span style="color:#aaa;">(لا يوجد)</span>`;
    }
    if (node.children && node.children.length > 0) {
      sideBoxChildren.innerHTML =
        `<strong>الأبناء:</strong><ul style="padding-right:18px; margin:0; margin-top:5px;">` +
        node.children
          .map(
            (child) =>
              `<li style="margin-bottom:4px;">${
                child.name
              } <span style="color:#888;font-size:0.95em;">(${
                child.type === "main"
                  ? "رئيسي"
                  : child.type === "sub"
                  ? "فرعي"
                  : "نقطة"
              })</span></li>`
          )
          .join("") +
        "</ul>";
    } else {
      sideBoxChildren.innerHTML = `<strong>الأبناء:</strong> <span style="color:#aaa;">(لا يوجد)</span>`;
    }
    criteriaSideBox.style.display = "block";
  }

  // Initial fetch
  fetchCriteria();

  // Tooltip definitions
  const tooltips = {
    searchInput: "يمكنك البحث عن أي معيار بكتابة اسمه هنا",
    addMainCriteriaBtn: "اضغط لإضافة معيار رئيسي جديد إلى القائمة",
    methodologyText: "أدخل المنهجية الخاصة بهذا المعيار هنا",
    saveMethodologyBtn: "حفظ المنهجية المدخلة",
    cancelMethodologyBtn: "إغلاق النافذة بدون حفظ",
    attachmentFileInput: "اختر ملف أو أكثر لرفعه كمرفق للمعيار",
    uploadAttachmentBtn: "رفع الملفات المحددة",
    cancelAttachmentBtn: "إغلاق النافذة بدون رفع",
    addSubCriteriaBtn: "إضافة عنصر فرعي جديد لهذا المعيار",
    deleteCriteriaBtn: "حذف هذا المعيار نهائياً",
    btnMethodology: "إدخال أو تعديل المنهجية الخاصة بهذا المعيار",
    btnAttachment: "رفع ملفات مرفقة لهذا المعيار",
    btnViewDetails: "عرض تفاصيل المنهجية والمرفقات لهذا المعيار",
    btnDefinition: "إدخال أو تعديل تعريف لهذا المعيار",
  };

  // Helper to add tooltip to an element
  function addTooltip(el, tipKey) {
    if (!el) return;
    el.classList.add("has-tooltip");
    let tip = document.createElement("span");
    tip.className = "custom-tooltip";
    tip.textContent = tooltips[tipKey] || "";
    el.appendChild(tip);
    if (
      tipKey === "addSubCriteriaBtn" ||
      tipKey === "deleteCriteriaBtn" ||
      tipKey === "btnMethodology" ||
      tipKey === "btnAttachment" ||
      tipKey === "btnViewDetails" ||
      tipKey === "btnDefinition"
    ) {
      tip.style.right = "110%";
      tip.style.left = "auto";
      tip.style.top = "50%";
      tip.style.transform = "translateY(-50%)";
    }
  }
});
