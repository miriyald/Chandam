export type Language = 'en' | 'te';

export interface Translations {
  // Navigation
  nav_home: string;
  nav_about: string;
  nav_credits: string;
  nav_contact: string;

  // Loading
  loading: string;

  // Home page
  home_title: string;
  home_subtitle: string;
  home_btn_analyze: string;
  home_btn_learn: string;

  // Editor
  editor_placeholder: string;
  editor_btn_random: string;
  editor_btn_clear: string;
  editor_btn_analyze: string;
  editor_auto_detect: string;
  editor_yati: string;
  editor_prasa: string;
  editor_auto_detect_context: string;
  editor_matching_with: string;
  editor_select_rule: string;

  // Labels
  label_rule_set: string;
  label_rule: string;
  label_rules_count: string;
  label_type: string;
  label_frequency: string;
  label_yes: string;
  label_no: string;
  label_example_n: string;
  label_author: string;
  label_date: string;
  label_pattern_sequence: string;
  label_matra_series: string;
  label_yati_caesura: string;
  label_prasa_rhyme: string;

  // Results
  results_title: string;
  results_view_details: string;
  results_line: string;
  results_position: string;
  results_type: string;
  results_expected: string;
  results_actual: string;
  results_description: string;
  results_mismatch_singular: string;
  results_mismatch_plural: string;

  // Links
  link_browse_rules: string;
  link_learn_more: string;
  link_browse_all_rules: string;
  link_go_to_compute: string;
  link_try_in_compute: string;
  link_back_to_browse: string;
  link_learn: string;
  link_try: string;

  // Learn sections
  learn_title_prefix: string;
  section_description: string;
  section_technical: string;
  section_examples: string;
  no_description: string;
  no_examples: string;
  btn_try_example: string;

  // Metrics
  metric_chars: string;
  metric_matras: string;

  // Alerts
  alert_enter_poem: string;
  alert_no_matches: string;
  alert_error: string;
  alert_select_rule: string;
  alert_no_match: string;
  alert_no_examples: string;

  // Language switcher
  lang_toggle_title: string;
  lang_name: string;
}

const translations: Record<Language, Translations> = {
  en: {
    nav_home: 'Home',
    nav_about: 'About',
    nav_credits: 'Credits',
    nav_contact: 'Contact',

    loading: 'Loading...',

    home_title: 'ఛందం - Telugu Poetry Meter Analysis',
    home_subtitle: 'Select a rule set to begin analyzing or learning about Telugu poetry meters',
    home_btn_analyze: '✏️ Analyze',
    home_btn_learn: '📖 Learn',

    editor_placeholder: 'పద్యం ఇక్కడ టైప్ చేయండి...',
    editor_btn_random: '🎲 Random',
    editor_btn_clear: '🧹 Clear',
    editor_btn_analyze: 'Analyze Poem',
    editor_auto_detect: 'Auto-detect',
    editor_yati: 'Yati',
    editor_prasa: 'Prasa',
    editor_auto_detect_context: 'Auto-detecting best match...',
    editor_matching_with: 'Matching with:',
    editor_select_rule: 'Select a rule ▼',

    label_rule_set: 'Rule Set:',
    label_rule: 'Rule:',
    label_rules_count: 'Rules',
    label_type: 'Type:',
    label_frequency: 'Frequency:',
    label_yes: 'Yes',
    label_no: 'No',
    label_example_n: 'Example',
    label_author: 'Author:',
    label_date: 'Date:',
    label_pattern_sequence: 'Pattern (Sequence):',
    label_matra_series: 'Matra Series:',
    label_yati_caesura: 'Yati (Caesura):',
    label_prasa_rhyme: 'Prasa (Rhyme):',

    results_title: 'Results',
    results_view_details: 'View Rule Details ↗',
    results_line: 'Line',
    results_position: 'Pos',
    results_type: 'Type',
    results_expected: 'Expected',
    results_actual: 'Actual',
    results_description: 'Description',
    results_mismatch_singular: 'Mismatch',
    results_mismatch_plural: 'Mismatches',

    link_browse_rules: 'Browse Rules',
    link_learn_more: 'Learn More',
    link_browse_all_rules: 'Browse All Rules',
    link_go_to_compute: 'Go to Compute',
    link_try_in_compute: 'Try in Compute',
    link_back_to_browse: '← Back to Browse',
    link_learn: 'Learn',
    link_try: 'Try',

    learn_title_prefix: 'Learn:',
    section_description: 'Description',
    section_technical: 'Technical Details',
    section_examples: 'Examples',
    no_description: 'No description available',
    no_examples: 'No examples available',
    btn_try_example: 'Try This Example',

    metric_chars: 'chars',
    metric_matras: 'matras',

    alert_enter_poem: 'Please enter poem text',
    alert_no_matches: 'No matches found',
    alert_error: 'Error occurred',
    alert_select_rule: 'Please select a rule',
    alert_no_match: 'No match',
    alert_no_examples: 'No examples available',

    lang_toggle_title: 'Switch to Telugu / తెలుగుకు మార్చండి',
    lang_name: 'EN',
  },
  te: {
    nav_home: 'హోమ్',
    nav_about: 'గురించి',
    nav_credits: 'క్రెడిట్స్',
    nav_contact: 'సంప్రదించండి',

    loading: 'లోడవుతోంది...',

    home_title: 'ఛందం - తెలుగు పద్య ఛందస్సు విశ్లేషణ',
    home_subtitle: 'తెలుగు పద్య మీటర్లను విశ్లేషించడానికి లేదా నేర్చుకోవడానికి ఒక నియమ సమూహాన్ని ఎంచుకోండి',
    home_btn_analyze: '✏️ విశ్లేషించు',
    home_btn_learn: '📖 నేర్చుకో',

    editor_placeholder: 'పద్యం ఇక్కడ టైప్ చేయండి...',
    editor_btn_random: '🎲 యాదృచ్ఛిక',
    editor_btn_clear: '🧹 తుడుచు',
    editor_btn_analyze: 'పద్యం విశ్లేషించు',
    editor_auto_detect: 'స్వయంచాలక గుర్తింపు',
    editor_yati: 'యతి',
    editor_prasa: 'ప్రాస',
    editor_auto_detect_context: 'అత్యుత్తమ సరిపోలికను స్వయంచాలకంగా గుర్తిస్తోంది...',
    editor_matching_with: 'సరిపోలుతున్నది:',
    editor_select_rule: 'నియమం ఎంచుకోండి ▼',

    label_rule_set: 'నియమ సమూహం:',
    label_rule: 'నియమం:',
    label_rules_count: 'నియమాలు',
    label_type: 'రకం:',
    label_frequency: 'తరచుదనం:',
    label_yes: 'అవును',
    label_no: 'కాదు',
    label_example_n: 'ఉదాహరణ',
    label_author: 'రచయిత:',
    label_date: 'తేదీ:',
    label_pattern_sequence: 'నమూనా (క్రమం):',
    label_matra_series: 'మాత్రా శ్రేణి:',
    label_yati_caesura: 'యతి:',
    label_prasa_rhyme: 'ప్రాస:',

    results_title: 'ఫలితాలు',
    results_view_details: 'నియమ వివరాలు చూడండి ↗',
    results_line: 'పంక్తి',
    results_position: 'స్థానం',
    results_type: 'రకం',
    results_expected: 'ఆశించినది',
    results_actual: 'వాస్తవం',
    results_description: 'వివరణ',
    results_mismatch_singular: 'సరిపోలలేదు',
    results_mismatch_plural: 'సరిపోలలేదు',

    link_browse_rules: 'నియమాలు చూడండి',
    link_learn_more: 'మరింత నేర్చుకోండి',
    link_browse_all_rules: 'అన్ని నియమాలు చూడండి',
    link_go_to_compute: 'విశ్లేషణకు వెళ్ళండి',
    link_try_in_compute: 'విశ్లేషణలో ప్రయత్నించండి',
    link_back_to_browse: '← వెనక్కి వెళ్ళు',
    link_learn: 'నేర్చుకో',
    link_try: 'ప్రయత్నించు',

    learn_title_prefix: 'నేర్చుకో:',
    section_description: 'వివరణ',
    section_technical: 'సాంకేతిక వివరాలు',
    section_examples: 'ఉదాహరణలు',
    no_description: 'వివరణ అందుబాటులో లేదు',
    no_examples: 'ఉదాహరణలు అందుబాటులో లేవు',
    btn_try_example: 'ఈ ఉదాహరణ ప్రయత్నించండి',

    metric_chars: 'అక్షరాలు',
    metric_matras: 'మాత్రలు',

    alert_enter_poem: 'దయచేసి పద్యం టెక్స్ట్ ఇవ్వండి',
    alert_no_matches: 'సరిపోలికలు దొరకలేదు',
    alert_error: 'లోపం సంభవించింది',
    alert_select_rule: 'దయచేసి ఛందం ఎంచుకోండి',
    alert_no_match: 'సరిపోలలేదు',
    alert_no_examples: 'ఉదాహరణలు అందుబాటులో లేవు',

    lang_toggle_title: 'Switch to English / ఇంగ్లీష్‌కు మార్చండి',
    lang_name: 'తె',
  },
};

const STORAGE_KEY = 'chandam-ui-lang';

let currentLanguage: Language = 'te';

export function getLanguage(): Language {
  return currentLanguage;
}

export function initLanguage(): void {
  const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
  currentLanguage = stored === 'en' ? 'en' : 'te';
}

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: lang } }));
}

export function toggleLanguage(): void {
  setLanguage(currentLanguage === 'en' ? 'te' : 'en');
}

export function t(key: keyof Translations): string {
  return translations[currentLanguage][key] ?? translations['en'][key] ?? key;
}
