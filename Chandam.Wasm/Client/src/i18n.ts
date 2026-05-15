export type Language = 'en' | 'te';

export interface Translations {
  // Navigation
  nav_home: string;
  nav_rule_sets: string;
  nav_resources: string;
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
  results_alternatives: string;
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

  // Mode switcher
  mode_learn: string;
  mode_compute: string;
  mode_explore: string;

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
  metric_examples: string;

  // Alerts
  alert_enter_poem: string;
  alert_no_matches: string;
  alert_error: string;
  alert_select_rule: string;
  alert_no_match: string;
  alert_no_examples: string;
  alert_generated_poem: string;

  // Language switcher
  lang_toggle_title: string;
  lang_name: string;

  // Rule Creator
  creator_page_title: string;
  creator_section_basic: string;
  creator_section_classification: string;
  creator_section_pattern: string;
  creator_section_options: string;
  creator_label_name: string;
  creator_label_padyam_type: string;
  creator_label_gana_type: string;
  creator_label_lines: string;
  creator_btn_add_row: string;
  creator_btn_add_row_icon: string;
  creator_btn_remove_row: string;
  creator_btn_remove_row_icon: string;
  creator_btn_add_gana: string;
  creator_btn_remove_gana: string;
  creator_label_yati: string;
  creator_placeholder_yati: string;
  creator_option_prasa: string;
  creator_option_prasa_yati: string;
  creator_option_anthya_prasa: string;
  creator_option_dandakamu: string;
  creator_option_same_rules: string;
  creator_btn_create: string;
  creator_btn_cancel: string;
  creator_success: string;
  creator_error: string;
  creator_validation_name: string;
  creator_validation_ganas: string;
  creator_limit_reached: string;
  creator_gana_count_singular: string;
  creator_gana_count_plural: string;
  creator_delete_confirm: string;

  // Padyam types
  padyam_type_jati: string;
  padyam_type_upajati: string;
  padyam_type_vruttam: string;

  // Gana types
  gana_type_name: string;
  gana_type_type: string;
  gana_type_weight: string;

  // Ganas
  gana_ya: string;
  gana_ma: string;
  gana_ta: string;
  gana_ra: string;
  gana_ja: string;
  gana_bha: string;
  gana_na: string;
  gana_sa: string;
  gana_ga: string;
  gana_gaa: string;
  gana_va: string;
  gana_ha: string;
  gana_lala: string;
  gana_la: string;
  gana_indra: string;
  gana_surya: string;
  gana_chandra: string;
  gana_guruvu: string;
  gana_laghuvu: string;

  // Matras and Padas
  matra_singular: string;
  matra_plural: string;
  pada_singular: string;
  pada_plural: string;

  // Custom rules
  custom_rules_title: string;
  custom_rules_description: string;
  custom_rules_btn_create: string;

  // Results extended
  results_add_to_examples: string;
  results_example_added: string;
  results_example_duplicate: string;
  results_submit_github: string;
  results_file_downloaded: string;

  // Filters
  filter_clear_all: string;
  filter_search_placeholder: string;
  filter_all_categories: string;
  filter_no_results: string;
  filter_try_removing: string;
  filter_showing: string;
  filter_of: string;
  filter_results: string;
  filter_with_examples: string;

  // Examples
  examples_none_available: string;
  examples_contribute_cta: string;
  generated_example_badge: string;
  generated_disclaimer: string;
  btn_regenerate: string;

  // Export
  export_book: string;
  export_book_single: string;
  export_progress_title: string;
  export_cancel: string;
  export_book_subtitle: string;
  export_book_generated: string;

  // Home page - additional
  home_btn_browse_rule_sets: string;
  home_quick_links: string;
  home_link_rule_sets: string;
  home_link_rule_sets_desc: string;
  home_link_about: string;
  home_link_about_desc: string;
  home_link_credits: string;
  home_link_credits_desc: string;
  home_link_contact: string;
  home_link_contact_desc: string;

  // Rule Sets page
  rulesets_page_title: string;
  rulesets_heading: string;
  rulesets_subtitle: string;
  rulesets_rules_suffix: string;
  rulesets_examples_suffix: string;
  rulesets_btn_analyze: string;
  rulesets_btn_learn: string;

  // Breadcrumbs
  breadcrumb_aria_label: string;
  breadcrumb_rule_sets: string;
  breadcrumb_home: string;

  // Mode Switcher
  mode_switcher_aria_label: string;

  // Rule Actions
  action_remove_favorite: string;
  action_add_favorite: string;
  action_delete_custom_rule: string;
  action_submit_github: string;
  action_create_meter: string;
  alert_max_favorites: string;
  alert_favorite_failed: string;
  alert_delete_confirm: string;
  alert_delete_failed: string;

  // Learn Index
  learn_btn_delete: string;

  // Rule Creator Validation
  creator_validation_name_length: string;
  creator_validation_name_invalid: string;
  creator_validation_name_exists: string;
  creator_validation_lines_min: string;

  // Explore
  explore_graph_hint: string;

  // My Writings / Collection
  nav_my_writings: string;
  writings_subtitle: string;
  writings_empty: string;
  writings_delete: string;
  writings_delete_confirm: string;
  results_add_to_collection: string;
  results_added_to_collection: string;
  results_already_in_collection: string;
  results_collection_full: string;

  // My Data
  nav_my_data: string;
  my_data_title: string;
  my_data_clear_btn: string;
  my_data_writings_title: string;
  my_data_writings_desc: string;
  my_data_writings_subtitle: string;
  my_data_favorites_title: string;
  my_data_favorites_desc: string;
  my_data_favorites_subtitle: string;
  my_data_custom_rules_title: string;
  my_data_custom_rules_desc: string;
  my_data_custom_rules_subtitle: string;
  my_data_view: string;

  // Footer
  footer_clear_data: string;
  footer_favorites: string;
  footer_custom_rules: string;
  clear_data_warning: string;

  // Pages
  page_about_title: string;
  page_credits_title: string;
  page_contact_title: string;
}

const translations: Record<Language, Translations> = {
  en: {
    nav_home: 'Home',
    nav_rule_sets: 'Rule Sets',
    nav_resources: 'Resources',
    nav_about: 'About',
    nav_credits: 'Credits',
    nav_contact: 'Contact',

    loading: 'Loading...',

    home_title: 'ఛందం - Telugu Poetry Meter Analysis',
    home_subtitle: 'Select a rule set to begin analyzing or learning about Telugu poetry meters',
    home_btn_analyze: '✏️ Analyze',
    home_btn_learn: '📖 Learn',

    editor_placeholder: 'పద్యం ఇక్కడ టైప్ చేయండి...',
    editor_btn_random: 'Random',
    editor_btn_clear: 'Clear',
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
    results_alternatives: 'Other Possible Matches',
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

    mode_learn: 'Learn',
    mode_compute: 'Compute',
    mode_explore: 'Explore',

    learn_title_prefix: 'Learn:',
    section_description: 'Description',
    section_technical: 'Technical Details',
    section_examples: 'Examples',
    no_description: 'No description available',
    no_examples: 'No examples available',
    btn_try_example: 'Try This Example',

    metric_chars: 'chars',
    metric_matras: 'matras',
    metric_examples: 'ex.',

    alert_enter_poem: 'Please enter poem text',
    alert_no_matches: 'No matches found',
    alert_error: 'Error occurred',
    alert_select_rule: 'Please select a rule',
    alert_no_match: 'No match',
    alert_no_examples: 'No examples available',
    alert_generated_poem: 'Generated sample (not literature)',

    lang_toggle_title: 'Switch to Telugu / తెలుగుకు మార్చండి',
    lang_name: 'EN',

    // Rule Creator
    creator_page_title: 'Create Custom Rule',
    creator_section_basic: 'Basic Information',
    creator_section_classification: 'Classification',
    creator_section_pattern: 'Rule Pattern',
    creator_section_options: 'Options',
    creator_label_name: 'Name',
    creator_label_padyam_type: 'Padyam Type',
    creator_label_gana_type: 'Gana Type',
    creator_label_lines: 'Lines',
    creator_btn_add_row: '➕ Add Pada',
    creator_btn_add_row_icon: '➕',
    creator_btn_remove_row: '🗑️ Remove Pada',
    creator_btn_remove_row_icon: '🗑️',
    creator_btn_add_gana: '➕',
    creator_btn_remove_gana: '➖',
    creator_label_yati: 'Yati',
    creator_placeholder_yati: 'e.g., 8,14',
    creator_option_prasa: 'Prasa (Rhyme)',
    creator_option_prasa_yati: 'Prasa with Yati',
    creator_option_anthya_prasa: 'Anthya Prasa (End Rhyme)',
    creator_option_dandakamu: 'Dandakamu (Infinite Length)',
    creator_option_same_rules: 'Same Rules for All Lines',
    creator_btn_create: '✅ Create Rule',
    creator_btn_cancel: '❌ Cancel',
    creator_success: 'Rule created successfully!',
    creator_error: 'Failed to create rule',
    creator_validation_name: 'Please enter a rule name',
    creator_validation_ganas: 'Please add at least one gana',
    creator_limit_reached: 'Maximum 50 custom rules reached',
    creator_gana_count_singular: 'gana',
    creator_gana_count_plural: 'ganas',
    creator_delete_confirm: 'Are you sure you want to delete this rule?',

    padyam_type_jati: 'Jati',
    padyam_type_upajati: 'UpaJati',
    padyam_type_vruttam: 'Vruttam',

    gana_type_name: 'Name',
    gana_type_type: 'Type',
    gana_type_weight: 'Weight',

    gana_ya: 'య (l-g-g)',
    gana_ma: 'మ (g-g-g)',
    gana_ta: 'త (g-g-l)',
    gana_ra: 'ర (g-l-g)',
    gana_ja: 'జ (l-g-l)',
    gana_bha: 'భ (g-l-l)',
    gana_na: 'న (l-l-l)',
    gana_sa: 'స (l-l-g)',
    gana_ga: 'గ',
    gana_gaa: 'గా (g-g)',
    gana_va: 'వ (l-g)',
    gana_ha: 'హ (g-l)',
    gana_lala: 'లల',
    gana_la: 'ల',

    gana_indra: 'Indra',
    gana_surya: 'Surya',
    gana_chandra: 'Chandra',
    gana_guruvu: 'Guruvu',
    gana_laghuvu: 'Laghuvu',

    matra_singular: 'matra',
    matra_plural: 'matras',

    pada_singular: 'pada',
    pada_plural: 'padas',

    custom_rules_title: '🎨 Custom Rules',
    custom_rules_description: 'custom rules created',
    custom_rules_btn_create: 'Create Custom Rule',

    results_add_to_examples: '+ Add to Examples',
    results_example_added: 'Added!',
    results_example_duplicate: 'Already exists',
    results_submit_github: 'Submit to GitHub',
    results_file_downloaded: 'File downloaded! Attach it to the GitHub issue.',

    filter_clear_all: 'Clear',
    filter_search_placeholder: 'Search rules...',
    filter_all_categories: 'All Categories',
    filter_no_results: 'No rules match your filters.',
    filter_try_removing: 'Try removing some filters to see more results.',
    filter_showing: 'Showing',
    filter_of: 'of',
    filter_results: 'Results',
    filter_with_examples: 'With Examples',

    examples_none_available: 'No examples available yet.',
    examples_contribute_cta: 'You may contribute by writing one!',
    generated_example_badge: 'Machine-Generated (యంత్ర-నిర్మితం)',
    generated_disclaimer: 'Sample generated using స-రి-గ-మ-ప-ద-ని syllables to demonstrate meter structure. Not literature.',
    btn_regenerate: 'Regenerate',

    export_book: 'Export as Book',
    export_book_single: 'Export Rule',
    export_progress_title: 'Exporting...',
    export_cancel: 'Cancel',
    export_book_subtitle: 'Telugu Poetry Meters',
    export_book_generated: 'Generated from Chandam',

    // Home page - additional
    home_btn_browse_rule_sets: 'Browse Rule Sets',
    home_quick_links: 'Quick Links',
    home_link_rule_sets: 'Rule Sets',
    home_link_rule_sets_desc: 'Browse all meter collections',
    home_link_about: 'About',
    home_link_about_desc: 'Learn about this project',
    home_link_credits: 'Credits',
    home_link_credits_desc: 'Contributors and sources',
    home_link_contact: 'Contact',
    home_link_contact_desc: 'Get in touch',

    // Rule Sets page
    rulesets_page_title: 'Rule Sets',
    rulesets_heading: 'Telugu Poetry Meter Rule Sets',
    rulesets_subtitle: 'Choose a rule set to analyze poetry or learn about meters',
    rulesets_rules_suffix: 'Rules',
    rulesets_examples_suffix: 'Examples',
    rulesets_btn_analyze: 'Analyze',
    rulesets_btn_learn: 'Learn',

    // Breadcrumbs
    breadcrumb_aria_label: 'Breadcrumb',
    breadcrumb_rule_sets: 'Rule Sets',
    breadcrumb_home: 'Home',

    // Mode Switcher
    mode_switcher_aria_label: 'Mode selection',

    // Rule Actions
    action_remove_favorite: 'Remove from favorites',
    action_add_favorite: 'Add to favorites',
    action_delete_custom_rule: 'Delete this custom rule',
    action_submit_github: 'Submit to GitHub',
    action_create_meter: 'Create new meter',
    alert_max_favorites: 'Maximum 50 favorites reached. Please remove some to add new ones.',
    alert_favorite_failed: 'Failed to update favorite',
    alert_delete_confirm: 'Are you sure you want to delete this custom rule? This action cannot be undone.',
    alert_delete_failed: 'Failed to delete rule. Please try again.',

    // Learn Index
    learn_btn_delete: 'Delete',

    // Rule Creator Validation
    creator_validation_name_length: 'Rule name must be {max} characters or less',
    creator_validation_name_invalid: 'Rule name contains invalid characters',
    creator_validation_name_exists: 'A rule with this name already exists. Please choose a different name.',
    creator_validation_lines_min: 'Number of lines must be at least 1',

    // Explore
    explore_graph_hint: 'Scroll to zoom. Drag nodes to rearrange. Click a rule to view details.',

    // My Writings / Collection
    nav_my_writings: 'My Writings',
    writings_subtitle: 'Your collection ({count} poems)',
    writings_empty: 'No poems saved yet. Analyze a poem and save it to your collection!',
    writings_delete: 'Remove',
    writings_delete_confirm: 'Remove this poem from your collection?',
    results_add_to_collection: 'Save',
    results_added_to_collection: 'Saved!',
    results_already_in_collection: 'Already saved',
    results_collection_full: 'Collection full (20/20)',

    // My Data
    nav_my_data: 'My Data',
    my_data_title: 'My Data',
    my_data_clear_btn: 'Clear All Data',
    my_data_writings_title: 'My Writings',
    my_data_writings_desc: 'poems',
    my_data_writings_subtitle: 'Your saved poems and compositions',
    my_data_favorites_title: 'Favorites',
    my_data_favorites_desc: 'rules',
    my_data_favorites_subtitle: 'Rules you have favorited for quick access',
    my_data_custom_rules_title: 'Custom Rules',
    my_data_custom_rules_desc: 'rules',
    my_data_custom_rules_subtitle: 'Meters you have created',
    my_data_view: 'View',

    // Footer
    footer_clear_data: 'Clear Site Data',
    footer_favorites: 'Favorites',
    footer_custom_rules: 'Custom Rules',
    clear_data_warning: 'This will delete all your saved poems, favorites, custom rules, and editor state. This action cannot be undone. Continue?',

    page_about_title: 'About Chandam',
    page_credits_title: 'Credits',
    page_contact_title: 'Contact',
  },
  te: {
    nav_home: 'హోమ్',
    nav_rule_sets: 'నియమావళులు',
    nav_resources: 'వనరులు',
    nav_about: 'పరిచయం',
    nav_credits: 'కృతజ్ఞతలు',
    nav_contact: 'సంప్రదింపులు',

    loading: 'తెరుచుకుంటోంది...',

    home_title: 'ఛందం: తెలుగు పద్య ఛందస్సు విశ్లేషణ',
    home_subtitle: 'పద్యాలను విశ్లేషించడానికి, ఛందస్సు నేర్చుకోవడానికి, మరియు డెవలపర్‌ల కోసం ఏజెంట్-స్నేహపూర్వక సాధనాలను రూపొందించడానికి ఆధునిక వేదిక.',
    home_btn_analyze: '✏️ విశ్లేషించండి',
    home_btn_learn: '📖 నేర్చుకోండి',

    editor_placeholder: 'పద్యమును ఇక్కడ ఉంచండి.',
    editor_btn_random: 'ఏదేని పద్యం',
    editor_btn_clear: 'తీసివేయి',
    editor_btn_analyze: 'విశ్లేషించండి',
    editor_auto_detect: 'స్వయంచాలకంగా గుర్తించు',
    editor_yati: 'యతి',
    editor_prasa: 'ప్రాస',
    editor_auto_detect_context: 'ఉత్తమ సరిపోలికను స్వయంచాలకంగా గుర్తిస్తోంది.',
    editor_matching_with: 'దీనితో సరిపోలుస్తోంది:',
    editor_select_rule: 'ఒక నియమాన్ని ఎంచుకోండి ▼',

    label_rule_set: 'నియమావళులు:',
    label_rule: 'నియమం:',
    label_rules_count: 'నియమాలు',
    label_type: 'రకం:',
    label_frequency: 'తరచుదనం:',
    label_yes: 'అవును',
    label_no: 'కాదు',
    label_example_n: 'ఉదాహరణ',
    label_author: 'రచయిత:',
    label_date: 'తేదీ:',
    label_pattern_sequence: 'గణాల క్రమం:',
    label_matra_series: 'మాత్రల శ్రేణి:',
    label_yati_caesura: 'యతి:',
    label_prasa_rhyme: 'ప్రాస:',

    results_title: 'ఫలితాలు',
    results_view_details: 'నియమ వివరాలు చూడండి ↗',
    results_alternatives: 'ఇతర సాధ్యమైన సరిపోలికలు',
    results_line: 'పంక్తి',
    results_position: 'స్థానం',
    results_type: 'రకం',
    results_expected: 'ఆశించినది',
    results_actual: 'వాస్తవమైనది',
    results_description: 'వివరణ',
    results_mismatch_singular: 'లోపం',
    results_mismatch_plural: 'లోపాలు',

    link_browse_rules: 'నియమాలను చూడండి',
    link_learn_more: 'మరింత తెలుసుకోండి',
    link_browse_all_rules: 'అన్ని నియమాలను చూడండి',
    link_go_to_compute: 'విశ్లేషణకు వెళ్లండి',
    link_try_in_compute: 'విశ్లేషణలో ప్రయత్నించండి',
    link_back_to_browse: '← వెనక్కి వెళ్ళు',
    link_learn: 'నేర్చుకోండి',
    link_try: 'ప్రయత్నించండి',

    mode_learn: 'నేర్చుకోండి',
    mode_compute: 'విశ్లేషించండి',
    mode_explore: 'అన్వేషించండి',

    learn_title_prefix: 'నేర్చుకోండి:',
    section_description: 'వివరణ',
    section_technical: 'సాంకేతిక వివరాలు',
    section_examples: 'ఉదాహరణలు',
    no_description: 'వివరణ అందుబాటులో లేదు',
    no_examples: 'ఉదాహరణలు అందుబాటులో లేవు',
    btn_try_example: 'ఈ ఉదాహరణను ప్రయత్నించండి',

    metric_chars: 'అక్షరాలు',
    metric_matras: 'మాత్రలు',
    metric_examples: 'ఉదాహరణలు',

    alert_enter_poem: 'దయచేసి విశ్లేషించడానికి పద్యాన్ని నమోదు చేయండి.',
    alert_no_matches: 'సరిపోలే నియమాలు కనుగొనబడలేదు.',
    alert_error: 'ఒక లోపం సంభవించింది. దయచేసి మళ్ళీ ప్రయత్నించండి.',
    alert_select_rule: 'దయచేసి ఒక నియమాన్ని ఎంచుకోండి.',
    alert_no_match: 'ఇచ్చిన పద్యం ఈ నియమానికి సరిపోలలేదు.',
    alert_no_examples: 'ఈ నియమానికి ఉదాహరణలు అందుబాటులో లేవు.',
    alert_generated_poem: 'యంత్ర-నిర్మిత నమూనా (సాహిత్యం కాదు)',

    lang_toggle_title: 'Switch to English / ఇంగ్లీష్‌కు మార్చండి',
    lang_name: 'తె',

    // Rule Creator
    creator_page_title: 'కొత్త నియమాన్ని సృష్టించండి',
    creator_section_basic: 'ప్రాథమిక సమాచారం',
    creator_section_classification: 'వర్గీకరణ',
    creator_section_pattern: 'నియమ నమూనా',
    creator_section_options: 'ఎంపికలు',
    creator_label_name: 'పేరు',
    creator_label_padyam_type: 'పద్య రకం',
    creator_label_gana_type: 'గణ రకం',
    creator_label_lines: 'పాదాలు',
    creator_btn_add_row: '➕ పాదం జోడించు',
    creator_btn_add_row_icon: '➕',
    creator_btn_remove_row: '🗑️ పాదం తొలగించు',
    creator_btn_remove_row_icon: '🗑️',
    creator_btn_add_gana: '➕',
    creator_btn_remove_gana: '➖',
    creator_label_yati: 'యతి',
    creator_placeholder_yati: 'ఉదా., 8,14',
    creator_option_prasa: 'ప్రాస',
    creator_option_prasa_yati: 'ప్రాసయతి',
    creator_option_anthya_prasa: 'అంత్యప్రాస',
    creator_option_dandakamu: 'దండకము',
    creator_option_same_rules: 'అన్ని పాదాలకు ఒకే నియమాలు',
    creator_btn_create: '✅ నియమం సృష్టించు',
    creator_btn_cancel: '❌ రద్దు చేయి',
    creator_success: 'నియమం విజయవంతంగా సృష్టించబడింది!',
    creator_error: 'నియమం సృష్టించడంలో విఫలమైంది',
    creator_validation_name: 'దయచేసి నియమం పేరును నమోదు చేయండి',
    creator_validation_ganas: 'దయచేసి కనీసం ఒక గణం జోడించండి',
    creator_limit_reached: 'గరిష్టంగా 50 అనుకూల నియమాలు చేరుకున్నాయి',
    creator_gana_count_singular: 'గణం',
    creator_gana_count_plural: 'గణాలు',
    creator_delete_confirm: 'మీరు ఈ నియమాన్ని తొలగించాలని ఖచ్చితంగా అనుకుంటున్నారా?',

    padyam_type_jati: 'జాతి',
    padyam_type_upajati: 'ఉపజాతి',
    padyam_type_vruttam: 'వృత్తం',

    gana_type_name: 'పేరు',
    gana_type_type: 'రకం',
    gana_type_weight: 'బరువు',

    gana_ya: 'య (ల-గ-గ)',
    gana_ma: 'మ (గ-గ-గ)',
    gana_ta: 'త (గ-గ-ల)',
    gana_ra: 'ర (గ-ల-గ)',
    gana_ja: 'జ (ల-గ-ల)',
    gana_bha: 'భ (గ-ల-ల)',
    gana_na: 'న (ల-ల-ల)',
    gana_sa: 'స (ల-ల-గ)',
    gana_ga: 'గ',
    gana_gaa: 'గా (గ-గ)',
    gana_va: 'వ (ల-గ)',
    gana_ha: 'హ (గ-ల)',
    gana_lala: 'లల',
    gana_la: 'ల',

    gana_indra: 'ఇంద్ర',
    gana_surya: 'సూర్య',
    gana_chandra: 'చంద్ర',
    gana_guruvu: 'గురువు',
    gana_laghuvu: 'లఘువు',

    matra_singular: 'మాత్ర',
    matra_plural: 'మాత్రలు',

    pada_singular: 'పాదం',
    pada_plural: 'పాదాలు',

    custom_rules_title: '🎨 అనుకూల నియమాలు',
    custom_rules_description: 'సృష్టించబడిన అనుకూల నియమాలు',
    custom_rules_btn_create: 'అనుకూల నియమాన్ని సృష్టించండి',

    results_add_to_examples: '+ ఉదాహరణలకు జోడించు',
    results_example_added: 'జోడించబడింది!',
    results_example_duplicate: 'ఇప్పటికే ఉంది',
    results_submit_github: 'GitHubకు సమర్పించు',
    results_file_downloaded: 'ఫైల్ డౌన్‌లోడ్ చేయబడింది! దయచేసి GitHub ఇష్యూకు జోడించండి.',

    filter_clear_all: 'అన్నీ తీసివేయి',
    filter_search_placeholder: 'నియమాల కోసం వెతకండి...',
    filter_all_categories: 'అన్ని వర్గాలు',
    filter_no_results: 'మీ వడపోతలకు సరిపోలే నియమాలు లేవు.',
    filter_try_removing: 'మరిన్ని ఫలితాలను చూడటానికి కొన్ని వడపోతలను తీసివేయడానికి ప్రయత్నించండి.',
    filter_showing: 'చూపిస్తున్నవి',
    filter_of: '/',
    filter_results: 'ఫలితాలు',
    filter_with_examples: 'ఉదాహరణలతో',

    examples_none_available: 'ఉదాహరణలు ఇంకా అందుబాటులో లేవు.',
    examples_contribute_cta: 'మీరు ఒకటి వ్రాసి సహకరించవచ్చు!',
    generated_example_badge: 'యంత్ర-నిర్మితం (Machine-Generated)',
    generated_disclaimer: 'స-రి-గ-మ-ప-ద-ని అక్షరాలతో ఛందస్సు నమూనా. సాహిత్యం కాదు.',
    btn_regenerate: 'మరొకటి',

    export_book: 'పుస్తకంగా ఎగుమతి చేయి',
    export_book_single: 'నియమాన్ని ఎగుమతి చేయి',
    export_progress_title: 'ఎగుమతి చేస్తోంది...',
    export_cancel: 'రద్దు',
    export_book_subtitle: 'తెలుగు ఛందస్సులు',
    export_book_generated: 'ఛందం నుండి రూపొందించబడింది',

    // Home page - additional
    home_btn_browse_rule_sets: 'నియమావళులను చూడండి',
    home_quick_links: 'త్వరిత లింకులు',
    home_link_rule_sets: 'నియమావళులు',
    home_link_rule_sets_desc: 'అన్ని ఛందస్సుల సమూహాలను చూడండి',
    home_link_about: 'పరిచయం',
    home_link_about_desc: 'ఈ ప్రాజెక్టు గురించి తెలుసుకోండి',
    home_link_credits: 'కృతజ్ఞతలు',
    home_link_credits_desc: 'సహకారులు మరియు మూలాలు',
    home_link_contact: 'సంప్రదింపులు',
    home_link_contact_desc: 'మమ్మల్ని సంప్రదించండి',

    // Rule Sets page
    rulesets_page_title: 'నియమావళులు',
    rulesets_heading: 'తెలుగు పద్య ఛందస్సు నియమావళులు',
    rulesets_subtitle: 'పద్యాలను విశ్లేషించడానికి లేదా ఛందస్సు నేర్చుకోవడానికి ఒక నియమావళిని ఎంచుకోండి',
    rulesets_rules_suffix: 'నియమాలు',
    rulesets_examples_suffix: 'ఉదాహరణలు',
    rulesets_btn_analyze: 'విశ్లేషించండి',
    rulesets_btn_learn: 'నేర్చుకోండి',

    // Breadcrumbs
    breadcrumb_aria_label: 'నావిగేషన్ పథం',
    breadcrumb_rule_sets: 'నియమావళులు',
    breadcrumb_home: 'హోమ్',

    // Mode Switcher
    mode_switcher_aria_label: 'మోడ్ ఎంపిక',

    // Rule Actions
    action_remove_favorite: 'ఇష్టమైనవి నుండి తొలగించు',
    action_add_favorite: 'ఇష్టమైనవాటికి జోడించు',
    action_delete_custom_rule: 'ఈ అనుకూల నియమాన్ని తొలగించు',
    action_submit_github: 'GitHubకు సమర్పించు',
    action_create_meter: 'కొత్త ఛందస్సు సృష్టించు',
    alert_max_favorites: 'గరిష్టంగా 50 ఇష్టమైనవి చేరుకున్నాయి. కొత్తవి జోడించడానికి కొన్నింటిని తొలగించండి.',
    alert_favorite_failed: 'ఇష్టమైనవి నవీకరించడంలో విఫలమైంది',
    alert_delete_confirm: 'మీరు ఈ అనుకూల నియమాన్ని తొలగించాలని ఖచ్చితంగా అనుకుంటున్నారా? ఈ చర్యను రద్దు చేయలేరు.',
    alert_delete_failed: 'నియమాన్ని తొలగించడంలో విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.',

    // Learn Index
    learn_btn_delete: 'తొలగించు',

    // Rule Creator Validation
    creator_validation_name_length: 'నియమం పేరు {max} అక్షరాలు లేదా అంతకంటే తక్కువ ఉండాలి',
    creator_validation_name_invalid: 'నియమం పేరులో చెల్లని అక్షరాలు ఉన్నాయి',
    creator_validation_name_exists: 'ఈ పేరుతో ఒక నియమం ఇప్పటికే ఉంది. దయచేసి వేరే పేరు ఎంచుకోండి.',
    creator_validation_lines_min: 'పాదాల సంఖ్య కనీసం 1 ఉండాలి',

    // Explore
    explore_graph_hint: 'జూమ్ చేయడానికి స్క్రోల్ చేయండి. నోడ్‌లను లాగి అమర్చండి. వివరాలు చూడటానికి నియమంపై క్లిక్ చేయండి.',

    // My Writings / Collection
    nav_my_writings: 'నా రచనలు',
    writings_subtitle: 'మీ సేకరణ ({count} పద్యాలు)',
    writings_empty: 'ఇంకా పద్యాలు భద్రపరచబడలేదు. ఒక పద్యాన్ని విశ్లేషించి మీ సేకరణకు జోడించండి!',
    writings_delete: 'తొలగించు',
    writings_delete_confirm: 'ఈ పద్యాన్ని మీ సేకరణ నుండి తొలగించాలా?',
    results_add_to_collection: 'భద్రపరచు',
    results_added_to_collection: 'భద్రపరచబడింది!',
    results_already_in_collection: 'ఇప్పటికే భద్రపరచబడింది',
    results_collection_full: 'సేకరణ నిండింది (20/20)',

    // My Data
    nav_my_data: 'నా డేటా',
    my_data_title: 'నా డేటా',
    my_data_clear_btn: 'మొత్తం డేటా తొలగించు',
    my_data_writings_title: 'నా రచనలు',
    my_data_writings_desc: 'పద్యాలు',
    my_data_writings_subtitle: 'మీ భద్రపరచిన పద్యాలు మరియు రచనలు',
    my_data_favorites_title: 'ఇష్టమైనవి',
    my_data_favorites_desc: 'నియమాలు',
    my_data_favorites_subtitle: 'శీఘ్ర ప్రాప్యత కోసం మీరు ఇష్టపడిన నియమాలు',
    my_data_custom_rules_title: 'అనుకూల నియమాలు',
    my_data_custom_rules_desc: 'నియమాలు',
    my_data_custom_rules_subtitle: 'మీరు సృష్టించిన ఛందస్సులు',
    my_data_view: 'చూడండి',

    // Footer
    footer_clear_data: 'డేటా తొలగించు',
    footer_favorites: 'ఇష్టమైనవి',
    footer_custom_rules: 'అనుకూల నియమాలు',
    clear_data_warning: 'ఇది మీ భద్రపరచిన పద్యాలు, ఇష్టమైనవి, అనుకూల నియమాలు మరియు ఎడిటర్ స్థితిని తొలగిస్తుంది. ఈ చర్యను రద్దు చేయలేరు. కొనసాగించాలా?',

    page_about_title: 'పరిచయం',
    page_credits_title: 'కృతజ్ఞతలు',
    page_contact_title: 'సంప్రదింపులు',
  },
};

import { STORAGE_KEYS } from './constants';
const STORAGE_KEY = STORAGE_KEYS.UI_LANGUAGE;

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


