/**
 * Custom rule creator page
 */
import { t } from '../i18n';
import { setPageTitle } from '../utils/page-title';
import { customRulesService } from '../services/storage/custom-rules-service';
import { makeUrl } from '../utils/url-helpers';
import type { RuleDto, GanaOption } from '../services/storage/rule-dto';
import {
  MAX_LINES,
  MIN_LINES,
  DEFAULT_LINE_COUNT,
  MAX_MATRAS,
  MIN_THRESHOLD,
  SELECTORS,
  ELEMENT_IDS
} from './rule-creator-constants';
import {
  collectYatiFromRows,
  generateIdentifierFromName,
  validateRule,
  getElement,
  getRequiredElement
} from './rule-creator-helpers';

/**
 * State management for row counter
 */
class RuleCreatorState {
  private rowCounter = 0;

  incrementRow(): number {
    return ++this.rowCounter;
  }

  reset(): void {
    this.rowCounter = 0;
  }

  getCurrentCount(): number {
    return this.rowCounter;
  }
}

const state = new RuleCreatorState();

/**
 * Main function to render the rule creator page
 */
export async function renderRuleCreatorPage() {
  setPageTitle('Create Rule');

  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = renderRuleCreatorHTML();

  // Initialize form
  initializeForm();
  attachEventHandlers();
}

/**
 * Generate the main HTML structure
 */
function renderRuleCreatorHTML(): string {
  return `
    <div class="rule-creator-page">
      <h2>${t('creator_page_title')}</h2>

      <!-- SECTION 1: Basic Info + Classification + Same Rules (CONSOLIDATED) -->
      <div class="editor-section">
        <div class="editor-toolbar compact-toolbar">
          <div class="editor-context-group">
            <label for="rule-name">${t('creator_label_name')}</label>
            <input type="text" id="rule-name" class="name-input compact" placeholder="${t('creator_label_name')}">
            <span class="separator">|</span>
            <select id="padyam-type" class="dropdown-select compact">
              <option value="Vruttam" selected>${t('padyam_type_vruttam')}</option>
              <option value="Jati">${t('padyam_type_jati')}</option>
              <option value="UpaJati">${t('padyam_type_upajati')}</option>
            </select>
            <span class="separator">|</span>
            <select id="gana-type" class="dropdown-select compact">
              <option value="Name">${t('gana_type_name')}</option>
            </select>
          </div>

          <div class="editor-actions">
            <label class="toggle-switch compact">
              <input type="checkbox" id="same-rules" checked>
              <span class="toggle-slider"></span>
              <span class="toggle-label">${t('creator_option_same_rules')}</span>
            </label>
            <select id="lines" class="dropdown-select compact"></select>
          </div>
        </div>
      </div>

      <!-- SECTION 2: Rule Pattern Editor -->
      <div class="editor-section pattern-section">
        <div class="editor-toolbar">
          <div class="editor-context-group">
            <span class="editor-context">${t('creator_section_pattern')}</span>
          </div>
          <div class="editor-actions">
            <button id="add-pada-btn" class="btn-icon" title="${t('creator_btn_add_row')}">${t('creator_btn_add_row_icon')}</button>
            <button id="remove-pada-btn" class="btn-icon btn-danger" title="${t('creator_btn_remove_row')}">${t('creator_btn_remove_row_icon')}</button>
          </div>
        </div>

        <div id="pattern-rows-container" class="pattern-rows-container">
          <!-- Rows dynamically added -->
        </div>
      </div>

      <!-- SECTION 3: Options + Actions (CONSOLIDATED) -->
      <div class="editor-section">
        <div class="controls-bar">
          <div class="toggle-group">
            <label class="toggle-switch">
              <input type="checkbox" id="prasa" checked>
              <span class="toggle-slider"></span>
              <span class="toggle-label">${t('creator_option_prasa')}</span>
            </label>
            <span class="separator">|</span>
            <label class="toggle-switch">
              <input type="checkbox" id="prasa-yati">
              <span class="toggle-slider"></span>
              <span class="toggle-label">${t('creator_option_prasa_yati')}</span>
            </label>
            <span class="separator">|</span>
            <label class="toggle-switch">
              <input type="checkbox" id="anthya-prasa">
              <span class="toggle-slider"></span>
              <span class="toggle-label">${t('creator_option_anthya_prasa')}</span>
            </label>
          </div>

          <div class="main-actions">
            <button id="cancel-btn" class="btn-secondary">${t('creator_btn_cancel')}</button>
            <button id="create-rule-btn" class="btn-primary">${t('creator_btn_create')}</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize form with default values
 */
function initializeForm() {
  state.reset();

  // Populate lines dropdown
  const linesSelect = getElement<HTMLSelectElement>(ELEMENT_IDS.LINES);
  if (linesSelect) {
    for (let i = MIN_LINES; i <= MAX_LINES; i++) {
      const option = document.createElement('option');
      option.value = i.toString();
      option.textContent = `${i} ${i === 1 ? t('pada_singular') : t('pada_plural')}`;
      if (i === DEFAULT_LINE_COUNT) {
        option.selected = true;
      }
      linesSelect.appendChild(option);
    }
  }

  // Set Same Rules checked by default
  const sameRulesCheckbox = getElement<HTMLInputElement>(ELEMENT_IDS.SAME_RULES);
  if (sameRulesCheckbox) {
    sameRulesCheckbox.checked = true;
  }

  // Update gana type based on initial padyam type
  updateGanaTypeDropdown('Vruttam');

  // Add first row
  addPatternRow();

  // Apply initial Same Rules state
  updateSameRulesState(true);
}

/**
 * Attach all event handlers
 */
function attachEventHandlers() {
  // Padyam type change
  const padyamType = getElement<HTMLSelectElement>(ELEMENT_IDS.PADYAM_TYPE);
  padyamType?.addEventListener('change', (e) => {
    const value = (e.target as HTMLSelectElement).value;
    updateGanaTypeDropdown(value);
    regenerateAllRows();
  });

  // Gana type change
  const ganaType = getElement<HTMLSelectElement>(ELEMENT_IDS.GANA_TYPE);
  ganaType?.addEventListener('change', () => {
    regenerateAllRows();
  });

  // Same rules toggle
  const sameRules = getElement<HTMLInputElement>(ELEMENT_IDS.SAME_RULES);
  sameRules?.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    updateSameRulesState(checked);
  });

  // Add pada button (toolbar)
  const addPadaBtn = getElement<HTMLButtonElement>(ELEMENT_IDS.ADD_PADA_BTN);
  addPadaBtn?.addEventListener('click', () => addPatternRow());

  // Remove pada button (toolbar)
  const removePadaBtn = getElement<HTMLButtonElement>(ELEMENT_IDS.REMOVE_PADA_BTN);
  removePadaBtn?.addEventListener('click', () => removeLastPatternRow());

  // Cancel button
  const cancelBtn = getElement<HTMLButtonElement>('cancel-btn');
  cancelBtn?.addEventListener('click', () => window.location.href = makeUrl('/'));

  // Create button
  const createBtn = getElement<HTMLButtonElement>('create-rule-btn');
  createBtn?.addEventListener('click', async () => await handleCreateRule());

  // Event delegation for row actions (prevent memory leaks)
  attachRowEventDelegation();
}

/**
 * Remove the last pattern row from toolbar button
 */
function removeLastPatternRow() {
  const container = getElement(ELEMENT_IDS.PATTERN_ROWS_CONTAINER);
  const rows = container?.querySelectorAll(SELECTORS.PATTERN_ROW);
  if (rows && rows.length > 1) {
    rows[rows.length - 1].remove();
  }
}

/**
 * Attach event delegation for row actions to prevent memory leaks
 */
function attachRowEventDelegation() {
  const container = getElement(ELEMENT_IDS.PATTERN_ROWS_CONTAINER);
  container?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // Add gana button
    if (target.classList.contains('add-gana-btn') || target.closest('.add-gana-btn')) {
      const btn = target.closest('.add-gana-btn') as HTMLElement;
      const rowNum = parseInt(btn?.getAttribute('data-row') || '0');
      if (rowNum > 0) {
        addGanaDropdown(rowNum);
        updateGanaCountDisplay(rowNum);
      }
    }
    // Remove gana button
    else if (target.classList.contains('remove-gana-btn') || target.closest('.remove-gana-btn')) {
      const btn = target.closest('.remove-gana-btn') as HTMLElement;
      const rowNum = parseInt(btn?.getAttribute('data-row') || '0');
      if (rowNum > 0) {
        removeLastGana(rowNum);
        updateGanaCountDisplay(rowNum);
      }
    }
    // Remove row button
    else if (target.classList.contains('remove-row-btn') || target.closest('.remove-row-btn')) {
      const btn = target.closest('.remove-row-btn') as HTMLElement;
      const rowNum = parseInt(btn?.getAttribute('data-row') || '0');
      if (rowNum > 0) {
        removePatternRow(rowNum);
      }
    }
  });
}

/**
 * Update gana type dropdown based on padyam type
 */
function updateGanaTypeDropdown(padyamType: string) {
  const ganaTypeSelect = getElement<HTMLSelectElement>(ELEMENT_IDS.GANA_TYPE);
  if (!ganaTypeSelect) return;

  ganaTypeSelect.innerHTML = '';

  if (padyamType === 'Vruttam') {
    const option = document.createElement('option');
    option.value = 'Name';
    option.textContent = t('gana_type_name');
    ganaTypeSelect.appendChild(option);
  } else if (padyamType === 'Jati') {
    const typeOption = document.createElement('option');
    typeOption.value = 'Type';
    typeOption.textContent = t('gana_type_type');
    ganaTypeSelect.appendChild(typeOption);

    const weightOption = document.createElement('option');
    weightOption.value = 'Weight';
    weightOption.textContent = t('gana_type_weight');
    ganaTypeSelect.appendChild(weightOption);
  } else if (padyamType === 'UpaJati') {
    const option = document.createElement('option');
    option.value = 'Type';
    option.textContent = t('gana_type_type');
    ganaTypeSelect.appendChild(option);
  }
}

/**
 * Update UI state based on Same Rules checkbox
 */
function updateSameRulesState(checked: boolean) {
  const addPadaBtn = getElement<HTMLButtonElement>(ELEMENT_IDS.ADD_PADA_BTN);
  const removePadaBtn = getElement<HTMLButtonElement>(ELEMENT_IDS.REMOVE_PADA_BTN);

  if (checked) {
    // Same Rules ON: disable row add/remove buttons
    if (addPadaBtn) {
      addPadaBtn.disabled = true;
      addPadaBtn.classList.add('disabled');
    }
    if (removePadaBtn) {
      removePadaBtn.disabled = true;
      removePadaBtn.classList.add('disabled');
    }

    // Hide per-row remove buttons
    document.querySelectorAll(SELECTORS.REMOVE_ROW_BTN).forEach(btn => {
      (btn as HTMLElement).style.display = 'none';
    });
  } else {
    // Same Rules OFF: enable row add/remove buttons
    if (addPadaBtn) {
      addPadaBtn.disabled = false;
      addPadaBtn.classList.remove('disabled');
    }
    if (removePadaBtn) {
      removePadaBtn.disabled = false;
      removePadaBtn.classList.remove('disabled');
    }

    // Show per-row remove buttons
    document.querySelectorAll(SELECTORS.REMOVE_ROW_BTN).forEach(btn => {
      (btn as HTMLElement).style.display = 'inline-block';
    });
  }
}

/**
 * Regenerate all rows with new gana options
 */
function regenerateAllRows() {
  const container = getElement(ELEMENT_IDS.PATTERN_ROWS_CONTAINER);
  if (!container) return;

  const rows = container.querySelectorAll(SELECTORS.PATTERN_ROW);
  rows.forEach((_, index) => {
    const rowNum = index + 1;
    const ganaContainer = document.getElementById(`gana-container-${rowNum}`);
    if (ganaContainer) {
      const ganaCount = ganaContainer.querySelectorAll('select').length;
      ganaContainer.innerHTML = '';
      for (let j = 0; j < ganaCount; j++) {
        addGanaDropdown(rowNum);
      }
    }
  });
}

/**
 * Add a new pattern row (inline layout)
 */
function addPatternRow() {
  const container = getElement(ELEMENT_IDS.PATTERN_ROWS_CONTAINER);
  if (!container) return;

  const rowNum = state.incrementRow();

  const rowDiv = document.createElement('div');
  rowDiv.id = `row-${rowNum}`;
  rowDiv.className = 'pattern-row-inline';

  rowDiv.innerHTML = `
    <span class="row-badge">${rowNum}</span>
    <span class="gana-count" id="row-header-${rowNum}">1 ${t('creator_gana_count_singular')}</span>

    <div class="row-gana-actions">
      <button class="btn-icon-sm add-gana-btn" data-row="${rowNum}"
              title="${t('creator_btn_add_gana')}">${t('creator_btn_add_gana')}</button>
      <button class="btn-icon-sm remove-gana-btn" data-row="${rowNum}"
              title="${t('creator_btn_remove_gana')}">${t('creator_btn_remove_gana')}</button>
      <button class="btn-icon-sm btn-danger remove-row-btn" data-row="${rowNum}"
              title="${t('creator_btn_remove_row')}">${t('creator_btn_remove_row_icon')}</button>
    </div>

    <span class="separator">|</span>

    <div class="gana-dropdowns-inline" id="gana-container-${rowNum}"></div>

    <span class="separator">|</span>

    <div class="yati-input-inline">
      <label class="yati-label">${t('creator_label_yati')}:</label>
      <input type="text" id="yati-${rowNum}" class="yati-input-compact"
             placeholder="${t('creator_placeholder_yati')}"
             aria-label="${t('creator_label_yati')} ${rowNum}">
    </div>
  `;

  container.appendChild(rowDiv);

  // Event listeners are handled by delegation (attachRowEventDelegation)
  // No inline event listeners needed

  // Add first gana dropdown
  addGanaDropdown(rowNum);
  updateGanaCountDisplay(rowNum);
}

/**
 * Remove a pattern row
 */
function removePatternRow(rowNum: number) {
  const container = getElement(ELEMENT_IDS.PATTERN_ROWS_CONTAINER);
  if (!container) return;

  // Don't allow removing the last row
  const rows = container.querySelectorAll(SELECTORS.PATTERN_ROW);
  if (rows.length <= MIN_LINES) {
    return;
  }

  const row = document.getElementById(`row-${rowNum}`);
  if (row) {
    row.remove();
  }
}

/**
 * Add a gana dropdown to a specific row
 */
function addGanaDropdown(rowNum: number) {
  const container = document.getElementById(`gana-container-${rowNum}`);
  if (!container) return;

  const ganaCount = container.querySelectorAll('select').length + 1;
  const select = document.createElement('select');
  select.id = `gana-${rowNum}-${ganaCount}`;
  select.className = 'gana-select dropdown-select';

  const options = getGanaDropdownOptions();
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    select.appendChild(option);
  });

  container.appendChild(select);
}

/**
 * Remove the last gana dropdown from a row
 */
function removeLastGana(rowNum: number) {
  const container = document.getElementById(`gana-container-${rowNum}`);
  if (!container) return;

  const selects = container.querySelectorAll('select');
  if (selects.length > 1) {
    selects[selects.length - 1].remove();
  }
}

/**
 * Update gana count display for a row
 */
function updateGanaCountDisplay(rowNum: number) {
  const rowHeader = document.getElementById(`row-header-${rowNum}`);
  const ganaContainer = document.getElementById(`gana-container-${rowNum}`);
  if (rowHeader && ganaContainer) {
    const ganaCount = ganaContainer.querySelectorAll('select').length;
    const label = ganaCount === 1 ? t('creator_gana_count_singular') : t('creator_gana_count_plural');
    rowHeader.textContent = `${ganaCount} ${label}`;
  }
}

/**
 * Get gana dropdown options based on current gana type
 */
function getGanaDropdownOptions(): GanaOption[] {
  const ganaTypeSelect = getElement<HTMLSelectElement>(ELEMENT_IDS.GANA_TYPE);
  if (!ganaTypeSelect) return [];

  const ganaType = ganaTypeSelect.value;

  switch (ganaType) {
    case 'Name': // Vruttam
      return [
        { label: t('gana_ya'), value: 'య' },
        { label: t('gana_ma'), value: 'మ' },
        { label: t('gana_ta'), value: 'త' },
        { label: t('gana_ra'), value: 'ర' },
        { label: t('gana_ja'), value: 'జ' },
        { label: t('gana_bha'), value: 'భ' },
        { label: t('gana_na'), value: 'న' },
        { label: t('gana_sa'), value: 'స' },
        { label: t('gana_ga'), value: 'గ' },
        { label: t('gana_gaa'), value: 'గా' },
        { label: t('gana_va'), value: 'వ' },
        { label: t('gana_ha'), value: 'హ' },
        { label: t('gana_lala'), value: 'లల' },
        { label: t('gana_la'), value: 'ల' }
      ];
    case 'Type': // Jati/UpaJati
      return [
        { label: t('gana_indra'), value: 'Indra' },
        { label: t('gana_surya'), value: 'Surya' },
        { label: t('gana_chandra'), value: 'Chandra' },
        { label: t('gana_guruvu'), value: 'Guruvu' },
        { label: t('gana_laghuvu'), value: 'Laghuvu' }
      ];
    case 'Weight': // Jati matra
      return Array.from({ length: MAX_MATRAS }, (_, i) => ({
        label: `${i + 1} ${i === 0 ? t('matra_singular') : t('matra_plural')}`,
        value: (i + 1).toString()
      }));
    default:
      return [];
  }
}

/**
 * Handle create rule button click
 */
async function handleCreateRule() {
  const ruleDto = buildRuleDtoFromForm();

  // Validate using helper function
  const validationResult = await validateRule(ruleDto);
  if (!validationResult.isValid) {
    alert(validationResult.errors.join('\n'));
    return;
  }

  try {
    const count = await customRulesService.getCustomRulesCount();
    if (count >= 50) {
      alert(t('creator_limit_reached'));
      return;
    }

    await customRulesService.createCustomRule(ruleDto);
    alert(t('creator_success'));
    window.location.href = makeUrl(`/learn/custom-rules/${ruleDto.Identifier}`);
  } catch (error) {
    alert(t('creator_error'));
    console.error(error);
  }
}

/**
 * Build RuleDto object from form data
 */
function buildRuleDtoFromForm(): RuleDto {
  const ruleName = getRequiredElement<HTMLInputElement>(ELEMENT_IDS.RULE_NAME);
  const name = ruleName.value.trim();
  const identifier = generateIdentifierFromName(name);

  const padyamTypeSelect = getRequiredElement<HTMLSelectElement>(ELEMENT_IDS.PADYAM_TYPE);
  const ganaTypeSelect = getRequiredElement<HTMLSelectElement>(ELEMENT_IDS.GANA_TYPE);
  const padyamType = padyamTypeSelect.value as 'Vruttam' | 'Jati' | 'UpaJati';
  const ganaType = ganaTypeSelect.value;

  const prasaInput = getRequiredElement<HTMLInputElement>(ELEMENT_IDS.PRASA);
  const prasaYatiInput = getRequiredElement<HTMLInputElement>(ELEMENT_IDS.PRASA_YATI);
  const anthyaPrasaInput = getRequiredElement<HTMLInputElement>(ELEMENT_IDS.ANTHYA_PRASA);
  const sameRulesInput = getRequiredElement<HTMLInputElement>(ELEMENT_IDS.SAME_RULES);
  const linesSelect = getRequiredElement<HTMLSelectElement>(ELEMENT_IDS.LINES);

  const prasa = prasaInput.checked;
  const prasaYati = prasaYatiInput.checked;
  const anthyaPrasa = anthyaPrasaInput.checked;
  const sameRules = sameRulesInput.checked;
  const lines = sameRules ? parseInt(linesSelect.value) : 0;

  // Build Rules[][] array from pattern rows
  const container = getRequiredElement(ELEMENT_IDS.PATTERN_ROWS_CONTAINER);
  const rules: string[][] = [];
  const rows = container.querySelectorAll(SELECTORS.PATTERN_ROW);

  rows.forEach((_, index) => {
    const rowNum = index + 1;
    const ganaContainer = document.getElementById(`gana-container-${rowNum}`) as HTMLElement;
    if (ganaContainer) {
      const ganaSelects = ganaContainer.querySelectorAll('select');
      const rowGanas: string[] = [];

      ganaSelects.forEach(select => {
        rowGanas.push((select as HTMLSelectElement).value);
      });

      rules.push(rowGanas);
    }
  });

  // Build Yati[][] using helper function
  const yati = collectYatiFromRows(rows);

  const totalLines = sameRules ? lines : rules.length;
  const threshold = Math.max(MIN_THRESHOLD, totalLines - 1);

  return {
    Identifier: identifier,
    Name: name,
    Language: 'Telugu',
    PadyamType: padyamType,
    PadyamSubType: padyamType,
    RuleType: getRuleTypeFromGanaType(ganaType),
    Frequency: 'Rare',
    Lines: totalLines,
    Threshold: threshold,
    Rules: rules,
    Yati: yati.length > 0 ? yati : undefined,
    YatiMode: padyamType === 'Vruttam' ? 'CharPosition' : 'GPosition',
    Prasa: prasa,
    PrasaYati: prasaYati,
    AnthyaPrasa: anthyaPrasa,
    InfiniteLength: false,
    DeferThresold: false,
    YatiRecycle: false,
    ReverseYati: false,
    OnlyPrasaYati: false,
    RuleText: '',
    References: [],
    Examples: []
  };
}

/**
 * Map GanaType to RuleType enum
 */
function getRuleTypeFromGanaType(ganaType: string): 'Name' | 'Type' | 'Weight' {
  switch (ganaType) {
    case 'Name': return 'Name';
    case 'Type': return 'Type';
    case 'Weight': return 'Weight';
    default: return 'Name';
  }
}
