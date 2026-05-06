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

  // Export
  export_book: string;
  export_book_single: string;
  export_progress_title: string;
  export_cancel: string;
  export_book_subtitle: string;
  export_book_generated: string;

  // Pages
  page_about_title: string;
  page_about_content: string;
  page_credits_title: string;
  page_credits_content: string;
  page_contact_title: string;
  page_contact_content: string;
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

    alert_enter_poem: 'Please enter poem text',
    alert_no_matches: 'No matches found',
    alert_error: 'Error occurred',
    alert_select_rule: 'Please select a rule',
    alert_no_match: 'No match',
    alert_no_examples: 'No examples available',

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

    export_book: 'Export as Book',
    export_book_single: 'Export Rule',
    export_progress_title: 'Exporting...',
    export_cancel: 'Cancel',
    export_book_subtitle: 'Telugu Poetry Meters',
    export_book_generated: 'Generated from Chandam',

    page_about_title: 'About Chandam',
    page_about_content: `
      <p>The art of composing poetry requires not only immense creativity but also a deep understanding of prosody (Chandas), including the rules of meter, ganas (metrical feet), and yati-prasa (caesura and rhyme). This demands significant practice, and even for seasoned poets, occasional errors are natural.</p>
      <p>The idea for this tool was born from the thought: "Wouldn't it be great if a technological tool could verify all these rules?" To pass on the tradition of poetry to future generations, we must also provide them with modern tools that aid in poetic composition. <strong>Chandam<sup>©</sup></strong> is such an effort.</p>
      <p>This is a dedicated attempt, driven by the firm resolution to build a comprehensive software for Telugu prosody.</p>
      <p>A major challenge in digitization is typographical errors. A unique feature of metrical poetry is that any spelling mistake often results in a violation of gana, yati, or prasa rules. This tool can easily detect such errors. See the <a title="Case Studies" href="?CaseStudy">Case Studies</a> for examples.</p>
      <p>Experts in poetry [like those who perform Ashtavadhanas, Shatavadhanas, etc.] may not need such a tool. However, if such experts participate in its development, we can make a significant human effort to carry the tradition of poetry to future generations.</p>
      <p><strong>Chandam<sup>©</sup></strong> has been built considering all types of prosody rules. I have personally checked nearly <strong>11,000</strong> individual poems. Nevertheless, due to current <strong>technological limitations</strong> or my own <strong>lack of understanding</strong>, it is possible that the tool may incorrectly flag a correct verse as flawed or vice-versa. If you notice such issues, please bring them to my attention so I can correct them. Currently, it can identify <strong>343+</strong> Telugu meters and includes definitions for over <strong>1300</strong> Sanskrit meters.</p>
      <h3>Uses:</h3>
      <ol>
        <li>Correct old Telugu poems. See <a title="Case Studies" href="?CaseStudy">Case Studies</a>.</li>
        <li>New poets can use it as an editor.</li>
        <li>Identify the meter of unknown poems.</li>
        <li>Verify if a poem conforms to a specific meter.</li>
        <li>It not only points out errors but also explains where they occur in an understandable way.</li>
        <li>Learn prosody. Besides rules, I have included examples (the goal is to have at least 5 for each).</li>
        <li>It can assist those who wish to create new meters.</li>
      </ol>
    `,
    page_credits_title: 'Credits',
    page_credits_content: `
      <ol>
        <li>Special Thanks: <b>Sri K. Naga Bhushanarao (<a href='http://andhrabharati.com/' target='_blank'>Andhra Bharati</a>)</b> - For collecting numerous examples I did not have, personally verifying every rule, and correcting even minor spelling mistakes.</li>
        <li><b>Sri Vulapalli Sambasivarao: <a href='http://www.telugubhaghavatam.org' target='_blank'>Potana Bhagavatam</a></b> - For providing all the verses from his work upon request and for pointing out errors in this application.</li>
        <li>Smt. Lakshmidevi: <a href="https://www.blogger.com/profile/01955992709223887713" target='_blank'>Malati Madhavam, Mandakini, Manobhiramam, Maa Vanta-Varpu</a> - For being the very first user of <strong>Chandam<sup>©</sup></strong> and providing valuable suggestions and advice.</li>
        <li><b>Sri Ambarisha Darbha</b>: For his encouragement and for permitting the use of the <a href='http://adityafonts.com' target='_blank'>fonts</a> he created.</li>
        <li>Sri Jejjala Krishna Mohana Rao: For writing and providing many articles on prosody on the internet.</li>
        <li>Sri Kovela Sampathkumaracharya's "Chandahpadakosam".</li>
        <li>Masters' Telugu Grammar book.</li>
        <li>Sanskrit language resources. <a target="_blank" href="http://sanskrit.sai.uni-heidelberg.de/Chanda/HTML/">Refer</a></li>
        <li>Sri Mallina Narasimharao and Sri Rakeshwar: For their effort in documenting special meters on Wikipedia.</li>
        <li>Sri Murali Korimilli: My friend and colleague, for his immense encouragement.</li>
        <li>Chiranjeevi Phani Pradeep (Arjunu): For giving this idea (2008).</li>
        <li>Chiranjeevi Sandeep: For testing this.</li>
        <li>Finally, my wife Anuradha: For many unstated reasons.</li>
        <li>To all the great souls: For reducing my effort by placing Telugu books, poems, and articles on the internet.</li>
      </ol>
    `,
    page_contact_title: 'Contact',
    page_contact_content: `
      <ol>
        <li>Email me at <a href='mailto:m.dileep@gmail.com'>m.dileep@gmail.com</a> or Call me at <span class='gName'>+91-8978559072</span></li>
        <li>Visit my blog at <a target='_blank' href='http://mdileep.wordpress.com'>http://mdileep.wordpress.com</a></li>
        <li><a href='http://www.miriyala.in'>http://www.miriyala.in</a></li>
        <li>Google: <a target='_blank' href='https://www.google.co.in/search?q=Dileep+Miriyala'>Dileep Miriyala</a> or <a target='_blank' href='https://www.google.co.in/search?q=https://www.google.co.in/search?q=%E0%B0%A6%E0%B0%BF%E0%B0%B2%E0%B1%80%E0%B0%AA%E0%B1%81%2B%E0%B0%AE%E0%B0%BF%E0%B0%B0%E0%B0%BF%E0%B0%AF%E0%B0%BE%E0%B0%B2'>దిలీపు మిరియాల</a></li>
        <li>Facebook <a target='_blank' href='https://www.facebook.com/public/Dileep-Miriyala‎'>Dileep Miriyala</a></li>
      </ol>
    `
  },
  te: {
    nav_home: 'హోమ్',
    nav_about: 'పరిచయం',
    nav_credits: 'కృతజ్ఞతలు',
    nav_contact: 'సంప్రదింపులు',

    loading: 'తెరుచుకుంటోంది...',

    home_title: 'ఛందం: తెలుగు పద్య ఛందస్సు విశ్లేషణ',
    home_subtitle: 'పద్యాలను విశ్లేషించడానికి, ఛందస్సు నేర్చుకోవడానికి, మరియు డెవలపర్‌ల కోసం ఏజెంట్-స్నేహపూర్వక సాధనాలను రూపొందించడానికి ఆధునిక వేదిక.',
    home_btn_analyze: '✏️ విశ్లేషించండి',
    home_btn_learn: '📖 నేర్చుకోండి',

    editor_placeholder: 'పద్యం ఇక్కడ నమోదు చేయండి లేదా అతికించండి...',
    editor_btn_random: '🎲 యాదృచ్ఛిక పద్యం',
    editor_btn_clear: '🧹 ఖాళీ చేయి',
    editor_btn_analyze: 'విశ్లేషించండి',
    editor_auto_detect: 'స్వయంచాలకంగా గుర్తించు',
    editor_yati: 'యతి',
    editor_prasa: 'ప్రాస',
    editor_auto_detect_context: 'ఉత్తమ సరిపోలికను స్వయంచాలకంగా గుర్తిస్తోంది...',
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

    alert_enter_poem: 'దయచేసి విశ్లేషించడానికి పద్యాన్ని నమోదు చేయండి.',
    alert_no_matches: 'సరిపోలే నియమాలు కనుగొనబడలేదు.',
    alert_error: 'ఒక లోపం సంభవించింది. దయచేసి మళ్ళీ ప్రయత్నించండి.',
    alert_select_rule: 'దయచేసి ఒక నియమాన్ని ఎంచుకోండి.',
    alert_no_match: 'ఇచ్చిన పద్యం ఈ నియమానికి సరిపోలలేదు.',
    alert_no_examples: 'ఈ నియమానికి ఉదాహరణలు అందుబాటులో లేవు.',

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

    export_book: 'పుస్తకంగా ఎగుమతి చేయి',
    export_book_single: 'నియమాన్ని ఎగుమతి చేయి',
    export_progress_title: 'ఎగుమతి చేస్తోంది...',
    export_cancel: 'రద్దు',
    export_book_subtitle: 'తెలుగు ఛందస్సులు',
    export_book_generated: 'ఛందం నుండి రూపొందించబడింది',

    page_about_title: 'About Chandam',
    page_about_content: `
      <p>The art of composing poetry requires not only immense creativity but also a deep understanding of prosody (Chandas), including the rules of meter, ganas (metrical feet), and yati-prasa (caesura and rhyme). This demands significant practice, and even for seasoned poets, occasional errors are natural.</p>
      <p>The idea for this tool was born from the thought: "Wouldn't it be great if a technological tool could verify all these rules?" To pass on the tradition of poetry to future generations, we must also provide them with modern tools that aid in poetic composition. <strong>Chandam<sup>©</sup></strong> is such an effort.</p>
      <p>This is a dedicated attempt, driven by the firm resolution to build a comprehensive software for Telugu prosody.</p>
      <p>A major challenge in digitization is typographical errors. A unique feature of metrical poetry is that any spelling mistake often results in a violation of gana, yati, or prasa rules. This tool can easily detect such errors. See the <a title="Case Studies" href="?CaseStudy">Case Studies</a> for examples.</p>
      <p>Experts in poetry [like those who perform Ashtavadhanas, Shatavadhanas, etc.] may not need such a tool. However, if such experts participate in its development, we can make a significant human effort to carry the tradition of poetry to future generations.</p>
      <p><strong>Chandam<sup>©</sup></strong> has been built considering all types of prosody rules. I have personally checked nearly <strong>11,000</strong> individual poems. Nevertheless, due to current <strong>technological limitations</strong> or my own <strong>lack of understanding</strong>, it is possible that the tool may incorrectly flag a correct verse as flawed or vice-versa. If you notice such issues, please bring them to my attention so I can correct them. Currently, it can identify <strong>343+</strong> Telugu meters and includes definitions for over <strong>1300</strong> Sanskrit meters.</p>
      <h3>Uses:</h3>
      <ol>
        <li>Correct old Telugu poems. See <a title="Case Studies" href="?CaseStudy">Case Studies</a>.</li>
        <li>New poets can use it as an editor.</li>
        <li>Identify the meter of unknown poems.</li>
        <li>Verify if a poem conforms to a specific meter.</li>
        <li>It not only points out errors but also explains where they occur in an understandable way.</li>
        <li>Learn prosody. Besides rules, I have included examples (the goal is to have at least 5 for each).</li>
        <li>It can assist those who wish to create new meters.</li>
      </ol>
    `,
    page_credits_title: 'Credits',
    page_credits_content: `
      <ol>
        <li>Special Thanks: <b>Sri K. Naga Bhushanarao (<a href='http://andhrabharati.com/' target='_blank'>Andhra Bharati</a>)</b> - For collecting numerous examples I did not have, personally verifying every rule, and correcting even minor spelling mistakes.</li>
        <li><b>Sri Vulapalli Sambasivarao: <a href='http://www.telugubhaghavatam.org' target='_blank'>Potana Bhagavatam</a></b> - For providing all the verses from his work upon request and for pointing out errors in this application.</li>
        <li>Smt. Lakshmidevi: <a href="https://www.blogger.com/profile/01955992709223887713" target='_blank'>Malati Madhavam, Mandakini, Manobhiramam, Maa Vanta-Varpu</a> - For being the very first user of <strong>Chandam<sup>©</sup></strong> and providing valuable suggestions and advice.</li>
        <li><b>Sri Ambarisha Darbha</b>: For his encouragement and for permitting the use of the <a href='http://adityafonts.com' target='_blank'>fonts</a> he created.</li>
        <li>Sri Jejjala Krishna Mohana Rao: For writing and providing many articles on prosody on the internet.</li>
        <li>Sri Kovela Sampathkumaracharya's "Chandahpadakosam".</li>
        <li>Masters' Telugu Grammar book.</li>
        <li>Sanskrit language resources. <a target="_blank" href="http://sanskrit.sai.uni-heidelberg.de/Chanda/HTML/">Refer</a></li>
        <li>Sri Mallina Narasimharao and Sri Rakeshwar: For their effort in documenting special meters on Wikipedia.</li>
        <li>Sri Murali Korimilli: My friend and colleague, for his immense encouragement.</li>
        <li>Chiranjeevi Phani Pradeep (Arjunu): For giving this idea (2008).</li>
        <li>Chiranjeevi Sandeep: For testing this.</li>
        <li>Finally, my wife Anuradha: For many unstated reasons.</li>
        <li>To all the great souls: For reducing my effort by placing Telugu books, poems, and articles on the internet.</li>
      </ol>
    `,
    page_contact_title: 'Contact',
    page_contact_content: `
      <ol>
        <li>Email me at <a href='mailto:m.dileep@gmail.com'>m.dileep@gmail.com</a> or Call me at <span class='gName'>+91-8978559072</span></li>
        <li>Visit my blog at <a target='_blank' href='http://mdileep.wordpress.com'>http://mdileep.wordpress.com</a></li>
        <li><a href='http://www.miriyala.in'>http://www.miriyala.in</a></li>
        <li>Google: <a target='_blank' href='https://www.google.co.in/search?q=Dileep+Miriyala'>Dileep Miriyala</a> or <a target='_blank' href='https://www.google.co.in/search?q=https://www.google.co.in/search?q=%E0%B0%A6%E0%B0%BF%E0%B0%B2%E0%B1%80%E0%B0%AA%E0%B1%81%2B%E0%B0%AE%E0%B0%BF%E0%B0%B0%E0%B0%BF%E0%B0%AF%E0%B0%BE%E0%B0%B2'>దిలీపు మిరియాల</a></li>
        <li>Facebook <a target='_blank' href='https://www.facebook.com/public/Dileep-Miriyala‪'>Dileep Miriyala</a></li>
      </ol>
    `
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


