// Table Editor Dialog

import { insertText } from "./editor";

let dialog: HTMLElement | null = null;
let rowsInput: HTMLInputElement | null = null;
let colsInput: HTMLInputElement | null = null;
let previewTable: HTMLElement | null = null;
let headerCells: HTMLInputElement[] = [];
let onInsertCallback: ((markdown: string) => void) | null = null;

export function initTableDialog(): void {
  dialog = document.getElementById("table-dialog");
  rowsInput = document.getElementById("table-rows") as HTMLInputElement;
  colsInput = document.getElementById("table-cols") as HTMLInputElement;
  previewTable = document.getElementById("table-preview");

  // Event listeners
  document.getElementById("table-cancel")?.addEventListener("click", hideTableDialog);
  document.getElementById("table-insert")?.addEventListener("click", insertTable);

  rowsInput?.addEventListener("change", updatePreview);
  colsInput?.addEventListener("change", updatePreview);

  // Close on backdrop click
  dialog?.addEventListener("click", (e) => {
    if (e.target === dialog) {
      hideTableDialog();
    }
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog && !dialog.classList.contains("hidden")) {
      hideTableDialog();
    }
  });
}

export function showTableDialog(insertCallback?: (markdown: string) => void): void {
  if (!dialog) return;

  onInsertCallback = insertCallback || null;

  // Reset to defaults
  if (rowsInput) rowsInput.value = "3";
  if (colsInput) colsInput.value = "3";

  updatePreview();
  dialog.classList.remove("hidden");

  // Focus first header cell after preview is built
  setTimeout(() => {
    if (headerCells.length > 0) {
      headerCells[0].focus();
    }
  }, 50);
}

export function hideTableDialog(): void {
  if (!dialog) return;
  dialog.classList.add("hidden");
  onInsertCallback = null;
}

function updatePreview(): void {
  if (!previewTable || !rowsInput || !colsInput) return;

  const rows = Math.max(1, Math.min(10, parseInt(rowsInput.value) || 3));
  const cols = Math.max(1, Math.min(10, parseInt(colsInput.value) || 3));

  // Update input values if clamped
  rowsInput.value = rows.toString();
  colsInput.value = cols.toString();

  headerCells = [];

  // Build preview table
  let html = '<table class="table-preview-grid">';

  // Header row
  html += "<thead><tr>";
  for (let c = 0; c < cols; c++) {
    html += `<th><input type="text" class="table-cell-input table-header-input" data-col="${c}" placeholder="Header ${c + 1}" /></th>`;
  }
  html += "</tr></thead>";

  // Data rows
  html += "<tbody>";
  for (let r = 0; r < rows; r++) {
    html += "<tr>";
    for (let c = 0; c < cols; c++) {
      html += `<td><input type="text" class="table-cell-input" data-row="${r}" data-col="${c}" placeholder="" /></td>`;
    }
    html += "</tr>";
  }
  html += "</tbody></table>";

  previewTable.innerHTML = html;

  // Store header cell references
  const headerInputs = previewTable.querySelectorAll(".table-header-input");
  headerCells = Array.from(headerInputs) as HTMLInputElement[];

  // Add tab navigation between cells
  const allInputs = previewTable.querySelectorAll(".table-cell-input") as NodeListOf<HTMLInputElement>;
  allInputs.forEach((input, index) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Tab" && !e.shiftKey && index === allInputs.length - 1) {
        e.preventDefault();
        allInputs[0].focus();
      } else if (e.key === "Enter") {
        e.preventDefault();
        insertTable();
      }
    });
  });
}

function insertTable(): void {
  if (!previewTable || !rowsInput || !colsInput) return;

  const rows = parseInt(rowsInput.value) || 3;
  const cols = parseInt(colsInput.value) || 3;

  // Collect header values
  const headers: string[] = [];
  headerCells.forEach((input) => {
    headers.push(input.value || `Column ${parseInt(input.dataset.col || "0") + 1}`);
  });

  // Collect cell values
  const cells: string[][] = [];
  for (let r = 0; r < rows; r++) {
    cells[r] = [];
    for (let c = 0; c < cols; c++) {
      const input = previewTable.querySelector(`input[data-row="${r}"][data-col="${c}"]`) as HTMLInputElement;
      cells[r][c] = input?.value || "";
    }
  }

  // Calculate column widths for alignment
  const colWidths: number[] = [];
  for (let c = 0; c < cols; c++) {
    let maxWidth = headers[c].length;
    for (let r = 0; r < rows; r++) {
      maxWidth = Math.max(maxWidth, cells[r][c].length);
    }
    colWidths[c] = Math.max(maxWidth, 3); // Minimum 3 chars
  }

  // Generate markdown
  let markdown = "\n";

  // Header row
  markdown += "|";
  for (let c = 0; c < cols; c++) {
    markdown += ` ${headers[c].padEnd(colWidths[c])} |`;
  }
  markdown += "\n";

  // Separator row
  markdown += "|";
  for (let c = 0; c < cols; c++) {
    markdown += ` ${"-".repeat(colWidths[c])} |`;
  }
  markdown += "\n";

  // Data rows
  for (let r = 0; r < rows; r++) {
    markdown += "|";
    for (let c = 0; c < cols; c++) {
      markdown += ` ${(cells[r][c] || "").padEnd(colWidths[c])} |`;
    }
    markdown += "\n";
  }

  markdown += "\n";

  // Insert the markdown
  if (onInsertCallback) {
    onInsertCallback(markdown);
  } else {
    insertText(markdown);
  }

  hideTableDialog();
}
