export type CardLanguage = "en" | "he" | "ru";

const STORAGE_KEY = "conx-dynamic-panel-lang";
const memoryStore: { language?: CardLanguage } = {};

const EN: Record<string, string> = {
  "card.title": "ConX Dynamic Panel",
  "card.sync": "Sync to Panel",
  "card.pull": "Pull from Panel",
  "card.save": "Save Draft",
  "card.discard": "Discard Changes",
  "card.create": "Create",
  "card.duplicate": "Duplicate",
  "card.rename": "Rename",
  "card.delete": "Delete",
  "card.profiles": "Profiles",
  "card.editor": "Appearance",
  "card.buttons": "Buttons",
  "card.preview": "Panel preview",
  "card.actions": "Actions",
  "card.status": "Status",
  "card.error": "Error",
  "card.mode": "Mode",
  "card.color_on": "Color ON",
  "card.color_off": "Color OFF",
  "card.radar": "Radar",
  "color.red": "Red",
  "color.blue": "Blue (looks cyan on panel)",
  "color.green": "Green",
  "color.white": "White",
  "color.yellow": "Yellow",
  "color.magenta": "Magenta",
  "color.cyan": "Cyan",
  "color.warm_white": "Warm white",
  "color.warm_yellow": "Warm yellow",
  "radar.none": "None (off)",
  "card.backlight": "Backlight",
  "card.backlight_brightness": "Backlight brightness",
  "card.child_lock": "Child lock",
  "card.theme": "Interface theme",
  "card.open_export_wizard": "Export wizard",
  "card.back_to_editor": "Back to editor",
  "card.button": "Button",
  "card.button_expand": "Expand button settings",
  "card.button_collapse": "Collapse button settings",
  "card.label": "Label",
  "card.action": "Action",
  "card.entity_id": "Entity ID",
  "card.action_none": "No Home Assistant action",
  "card.entity_none": "No entity (optional)",
  "card.action_picker_hint": "Searchable Home Assistant service (domain.service).",
  "card.entity_picker_hint": "Searchable entity list, filtered by the action domain when set.",
  "card.action_data": "Action data (YAML)",
  "card.action_data_hint":
    "Optional service data fields (like Developer Tools → Actions → data:). One key: value per line, or a JSON object. Entity picker still sets target; use this for extra fields (name, value, run, …).",
  "card.action_data_placeholder": "name: day\nvalue: Morning\nrun: true",
  "card.action_data_invalid": "Invalid action data",
  "card.picker_search": "Search…",
  "card.radio_participation": "Button behavior",
  "card.radio_member": "Radio group",
  "card.radio_toggle": "Independent toggle",
  "card.radio_groups": "Radio groups",
  "card.radio_groups_hint": "Tap L1–L4 to add or remove a button. Buttons in a group act as classic radio: exactly one stays on. Ungrouped buttons stay independent toggles.",
  "card.radio_groups_toggle": "Show radio groups",
  "card.radio_group": "Group",
  "card.radio_groups_overlap": "Each button can belong to only one radio group.",
  "card.cover": "Cover / shutter",
  "card.cover_hint":
    "Pick which panel buttons drive the motor. Pressing a direction starts a timed travel; pressing again stops it. The integration never energizes both directions at once.",
  "card.cover_open_button": "Open button",
  "card.cover_close_button": "Close button",
  "card.cover_open_time": "Open travel time",
  "card.cover_close_time": "Close travel time",
  "card.cover_settle": "Direction change delay",
  "card.cover_times": "Travel times",
  "card.mixed_cover_times_hint":
    "Open/close come from the roles above. Travel times sit inside the cover-role card.",
  "card.mixed_cover_times_on": "Travel times for this motor are set on L{n}.",
  "card.cover_id_hint":
    "Internal motor slot for open/close pairing — not a Home Assistant cover.* entity.",
  "card.cover_ha_entity": "HA cover entity (optional)",
  "card.cover_ha_entity_hint":
    "Panel L1/L2 still drive the physical motor relays. Link a cover.* entity to mirror open/close/stop for HA status and automations.",
  "card.cover_ha_entity_none": "No HA cover (optional)",
  "card.cover_settle_hint":
    "Brief pause before reversing direction (motor relay safety).",
  "card.cover_opposite": "Opposite press",
  "card.cover_same_button": "Open and close must use different buttons.",
  "card.cover_live": "Cover control",
  "card.cover_open": "Open",
  "card.cover_close": "Close",
  "card.cover_stop": "Stop",
  "card.cover_state_idle": "Stopped",
  "card.cover_state_open": "Opening",
  "card.cover_state_close": "Closing",
  "card.cover_seconds": "s",
  "card.cover_safety":
    "Safety: presses run through the integration. Both direction relays are forced off on stop, timer expiry, profile change, sync, and reload.",
  "card.cover_add": "Add cover",
  "card.cover_remove": "Remove",
  "card.cover_slot_empty": "Not configured",
  "card.cover_slot_hint":
    "Assign the remaining buttons to a second shutter. Each cover needs two different buttons (open + close).",
  "card.gang_count": "Panel gangs",
  "card.gang_count_hint":
    "How many physical buttons (L1…Ln) this profile uses. Cover count is limited to floor(n/2). Choose 4 to use two covers.",
  "cover.stop_only": "Stop only",
  "cover.stop_then_reverse": "Stop, then reverse",
  "theme.noir": "Noir gray",
  "theme.ivory": "Ivory cool",
  "card.unsaved":
    "Unsaved draft — physical presses still use the last saved profile. Save Draft to apply roles/actions; Sync updates panel labels and colors.",
  "card.sync_needed":
    "Draft saved. Press behavior already uses this draft. Sync to Panel to push labels, colors, and on-panel settings.",
  "card.missing_action": "No Home Assistant action — only the panel relay will change.",
  "card.loading": "Loading panel…",
  "card.missing_entry": "Configure an entry_id for this card.",
  "card.compact": "Compact mode",
  "card.operate": "Operate",
  "card.operate_exit": "Settings",
  "card.operate_hint": "Show only the panel faceplate and live controls",
  "card.language": "Language",
  "card.import": "Import",
  "card.export": "Export",
  "card.import_merge": "Import (merge)",
  "card.import_replace": "Import (replace)",
  "card.import_ok": "Profiles imported.",
  "card.export_ok": "Profiles exported.",
  "card.import_invalid": "Invalid profiles JSON file.",
  "card.section_toggle": "Show section",
  "card.activate": "Activate",
  "card.profile_name": "Profile name",
  "card.panel_name": "Panel name",
  "card.panel_name_ok": "Panel name updated.",
  "card.menu": "Settings",
  "card.tabs_hint": "Three setup steps under the panel preview",
  "card.step_1": "Step 1",
  "card.step_2": "Step 2",
  "card.step_3": "Step 3",
  "card.wizard": "Setup wizard",
  "card.wizard_next": "Next",
  "card.wizard_back": "Back",
  "card.step_language": "Language",
  "card.step_profiles": "Panel / profile",
  "card.step_edit": "Edit settings",
  "card.step_preview": "Faceplate preview",
  "card.step_review": "Review & sync",
  "card.step_transfer": "Export / Import",
  "card.step_language_hint": "Choose the card language. Hebrew uses right-to-left layout.",
  "card.step_profiles_hint": "Select the active profile and how many physical buttons (gangs) it uses.",
  "card.step_edit_hint": "Edit appearance and button labels. Draft changes stay local until you save or sync.",
  "card.step_preview_hint": "Live Zemismart faceplate: labels on top, LED rings bottom left→right.",
  "card.step_review_hint": "Review the draft, save it, then Sync to push settings to the physical panel.",
  "card.step_transfer_hint": "Download or upload the portable JSON file used by Home Assistant.",
  "card.import_mode": "Import mode",
  "card.schema_title": "Supported JSON schema",
  "card.schema_body": "File must match export_profiles: schema_version, active_profile_id, profiles.",
  "card.service_yaml": "Service call YAML",
  "card.copy_yaml": "Copy YAML",
  "card.copied": "Copied",
  "card.close": "Close",
  "card.choose_file": "Choose JSON file",
  "card.download_export": "Download .json",
  "card.more": "More",
  "card.info": "Info",
  "info.title": "Card guide",
  "info.intro":
    "Short reference for the main controls on this card. Open anytime from the menu.",
  "info.profiles_title": "Profiles",
  "info.profiles_body":
    "Create, rename, duplicate, delete, and activate profiles. Panel gangs (1–4) sets how many physical buttons (L1…Ln) this profile uses.",
  "info.appearance_title": "Appearance",
  "info.appearance_body":
    "LED colors ON/OFF, radar, backlight, brightness, and child lock. These update on the hardware when you Sync to Panel.",
  "info.buttons_title": "Buttons",
  "info.buttons_body":
    "Choose a mode, then edit labels and behavior. In Free mix, set a role per L#. Expand a button row for Action, Entity, and optional Action data (YAML).",
  "info.modes_title": "Modes",
  "info.modes_body":
    "Toggle: each button latches independently. Radio mandatory / optional / split: exclusive groups. Cover: dedicated shutter mapping. Free mix: each button picks its own role.",
  "info.roles_title": "Free-mix roles",
  "info.roles_body":
    "Toggle = latched relay. Momentary = ON then OFF after the pulse time (re-press cancels). Radio = classic radio group. Cover open / close = shutter directions for a motor slot.",
  "info.sync_title": "Save Draft vs Sync",
  "info.sync_body":
    "Save Draft stores roles and actions so presses follow the draft. Sync pushes labels, colors, and on-panel settings to the hardware. While a draft is unsaved, physical presses still use the last saved profile.",
  "info.operate_title": "Operate mode",
  "info.operate_body":
    "Shows only the faceplate for day-to-day use. Open the corner menu and choose Settings to return to the full editor.",
  "info.cover_title": "Cover motor vs HA entity",
  "info.cover_body":
    "Motor / Cover slot pairs open and close internally — it is not a Home Assistant cover.* entity. Travel times and opposite-press sit on the first cover-role card for that motor. Optionally link a cover.* entity to mirror open/close/stop for HA status and automations; panel relays still drive the physical motor.",
  "info.actions_title": "Actions & YAML data",
  "info.actions_body":
    "Action is a Home Assistant service (domain.service). Entity sets the target. Action data (YAML) adds extra service data fields (name, value, run, …) without replacing the entity target.",
  "info.menu_title": "Settings menu",
  "info.menu_body":
    "Language, theme, export/import, automation example YAML, and this Info guide.",
  "card.automation_example": "Automation example",
  "card.automation_example_hint":
    "Switch profiles by time of day. Activating a profile only updates the stored draft — the physical panel changes only when the call also syncs, so every action below uses sync: true.",
  "card.automation_yaml_alias": "ConX Dynamic Panel - profile by time of day",
  "card.automation_yaml_header":
    "ConX Dynamic Panel: switch the active profile by time of day.",
  "card.automation_yaml_sync":
    "sync: true pushes the profile to the physical panel. Without it only the draft changes.",
  "card.automation_yaml_ids":
    "Replace entry_id and profile_id with the values of your panel.",
  "card.automation_yaml_morning": "Morning",
  "card.automation_yaml_evening": "Evening",
  "card.automation_yaml_night": "Night",
  "editor.entry_id": "Config entry ID",
  "mode.toggle": "Toggle",
  "mode.radio_mandatory": "Radio mandatory",
  "mode.radio_optional": "Radio optional",
  "mode.radio_split": "Radio split",
  "mode.mixed": "Free mix",
  "mode.cover": "Cover / shutter",
  "card.mixed_hint":
    "Configure each button freely: toggle (latched relay), momentary pulse, radio group, or cover open/close. Momentary turns ON then OFF after the pulse time; a re-press cancels and turns OFF. There is no separate “relay” role — use Toggle for a latched relay, and set an Action if Home Assistant should also run.",
  "card.mixed_roles": "Per-button roles",
  "card.button_role": "Button role",
  "card.pulse_time": "Pulse time",
  "card.cover_id": "Motor / Cover slot",
  "card.mixed_radio_hint":
    "Assign this button to a radio group below. Classic radio keeps exactly one member ON (turning it off snaps it back). Only role=Radio buttons stay in groups.",
  "card.mixed_cover_hint":
    "Shutter motor: Open/Close roles + travel times here. Motor slot is internal (not an HA entity). Optionally link a cover.* entity below to mirror open/close/stop for HA status and automations. Panel relays still drive the physical motor.",
  "role.toggle": "Toggle",
  "role.momentary": "Momentary",
  "role.radio": "Radio group",
  "role.cover_open": "Cover open",
  "role.cover_close": "Cover close",
};

const HE: Record<string, string> = {
  "card.title": "ConX Dynamic Panel",
  "card.sync": "סנכרון לפאנל",
  "card.pull": "משיכה מהפאנל",
  "card.save": "שמור טיוטה",
  "card.discard": "בטל שינויים",
  "card.create": "צור",
  "card.duplicate": "שכפל",
  "card.rename": "שנה שם",
  "card.delete": "מחק",
  "card.profiles": "פרופילים",
  "card.editor": "מראה",
  "card.buttons": "כפתורים",
  "card.preview": "תצוגת פאנל",
  "card.actions": "פעולות",
  "card.status": "סטטוס",
  "card.error": "שגיאה",
  "card.mode": "מצב",
  "card.color_on": "צבע דלוק",
  "card.color_off": "צבע כבוי",
  "card.radar": "רדאר",
  "color.red": "אדום",
  "color.blue": "כחול (נראה כסיאן על הפאנל)",
  "color.green": "ירוק",
  "color.white": "לבן",
  "color.yellow": "צהוב",
  "color.magenta": "מג׳נטה",
  "color.cyan": "סיאן",
  "color.warm_white": "לבן חם",
  "color.warm_yellow": "צהוב חם",
  "radar.none": "ללא (כבוי)",
  "card.backlight": "תאורת רקע",
  "card.backlight_brightness": "עוצמת תאורת רקע",
  "card.child_lock": "נעילת ילדים",
  "card.theme": "ערכת נושא",
  "card.open_export_wizard": "אשף ייצוא",
  "card.back_to_editor": "חזרה לעריכה",
  "card.button": "כפתור",
  "card.button_expand": "הרחב הגדרות כפתור",
  "card.button_collapse": "כווץ הגדרות כפתור",
  "card.label": "תווית",
  "card.action": "פעולה",
  "card.entity_id": "מזהה ישות",
  "card.action_none": "ללא פעולת Home Assistant",
  "card.entity_none": "ללא ישות (אופציונלי)",
  "card.action_picker_hint": "שירות Home Assistant עם חיפוש (דומיין.שירות).",
  "card.entity_picker_hint": "רשימת ישויות עם חיפוש, מסוננת לפי דומיין הפעולה כשנבחרה.",
  "card.action_data": "נתוני פעולה (YAML)",
  "card.action_data_hint":
    "שדות data אופציונליים לשירות (כמו כלי המפתחים → פעולות → data:). שורה לכל מפתח: ערך, או אובייקט JSON. בחירת הישות עדיין מגדירה את target; כאן מוסיפים שדות נוספים (name, value, run וכו').",
  "card.action_data_placeholder": "name: day\nvalue: Morning\nrun: true",
  "card.action_data_invalid": "נתוני פעולה לא תקינים",
  "card.picker_search": "חיפוש…",
  "card.radio_participation": "התנהגות כפתור",
  "card.radio_member": "משתתף ברדיו",
  "card.radio_toggle": "טוגל עצמאי",
  "card.radio_groups": "קבוצות רדיו",
  "card.radio_groups_hint": "הקישו על L1–L4 כדי לצרף או להסיר כפתור. כפתורים בקבוצה מתנהגים כרדיו קלאסי: תמיד אחד דלוק. כפתורים מחוץ לקבוצה נשארים טוגלים עצמאיים.",
  "card.radio_groups_toggle": "הצג קבוצות רדיו",
  "card.radio_group": "קבוצה",
  "card.radio_groups_overlap": "כל כפתור יכול להשתייך לקבוצת רדיו אחת בלבד.",
  "card.cover": "תריס",
  "card.cover_hint":
    "בחרו אילו כפתורים בפאנל מפעילים את המנוע. לחיצה על כיוון מתחילה תנועה מתוזמנת, ולחיצה נוספת עוצרת אותה. האינטגרציה לעולם לא מפעילה את שני הכיוונים יחד.",
  "card.cover_open_button": "כפתור פתיחה",
  "card.cover_close_button": "כפתור סגירה",
  "card.cover_open_time": "זמן פתיחה",
  "card.cover_close_time": "זמן סגירה",
  "card.cover_settle": "השהיה בהחלפת כיוון",
  "card.cover_times": "זמני נסיעה",
  "card.mixed_cover_times_hint":
    "פתיחה/סגירה נקבעים בתפקידים למעלה. זמני הנסיעה מופיעים בכרטיס תפקיד התריס.",
  "card.mixed_cover_times_on": "זמני הנסיעה למנוע זה מוגדרים ב־L{n}.",
  "card.cover_id_hint":
    "מזהה מנוע פנימי לזיווג פתיחה/סגירה — לא ישות cover של Home Assistant.",
  "card.cover_ha_entity": "ישות תריס ב-HA (אופציונלי)",
  "card.cover_ha_entity_hint":
    "כפתורי הפאנל עדיין מפעילים את ממסרי המנוע. קשרו ישות cover.* כדי לשקף פתיחה/סגירה/עצירה לסטטוס ואוטומציות ב-HA.",
  "card.cover_ha_entity_none": "ללא ישות תריס ב-HA (אופציונלי)",
  "card.cover_settle_hint":
    "השהיה קצרה לפני היפוך כיוון (בטיחות ממסרי מנוע).",
  "card.cover_opposite": "לחיצה הפוכה",
  "card.cover_same_button": "פתיחה וסגירה חייבות להשתמש בכפתורים שונים.",
  "card.cover_live": "שליטה בתריס",
  "card.cover_open": "פתיחה",
  "card.cover_close": "סגירה",
  "card.cover_stop": "עצירה",
  "card.cover_state_idle": "עצור",
  "card.cover_state_open": "נפתח",
  "card.cover_state_close": "נסגר",
  "card.cover_seconds": "שנ׳",
  "card.cover_safety":
    "בטיחות: הלחיצות עוברות דרך האינטגרציה. שני ממסרי הכיוון מכובים בעצירה, בתום הזמן, בהחלפת פרופיל, בסנכרון ובטעינה מחדש.",
  "card.cover_add": "הוסף תריס",
  "card.cover_remove": "הסר",
  "card.cover_slot_empty": "לא מוגדר",
  "card.cover_slot_hint":
    "שייכו את הכפתורים הנותרים לתריס שני. לכל תריס נדרשים שני כפתורים שונים (פתיחה + סגירה).",
  "card.gang_count": "מספר גאנגים",
  "card.gang_count_hint":
    "כמה כפתורים פיזיים (L1…Ln) הפרופיל משתמש. מספר התריסים מוגבל ל־floor(n/2). בחרו 4 כדי להשתמש בשני תריסים.",
  "cover.stop_only": "עצירה בלבד",
  "cover.stop_then_reverse": "עצירה ואז כיוון הפוך",
  "theme.noir": "נואר אפור",
  "theme.ivory": "שנהב קר",
  "card.unsaved":
    "יש שינויי טיוטה שלא נשמרו — לחיצות על הפאנל עדיין לפי הפרופיל השמור האחרון. שמרו טיוטה כדי להחיל תפקידים/פעולות; סנכרון מעדכן תוויות וצבעים בפאנל.",
  "card.sync_needed":
    "הטיוטה נשמרה. התנהגות הלחיצות כבר לפי הטיוטה. סנכרנו לפאנל כדי לדחוף תוויות, צבעים והגדרות על החומרה.",
  "card.missing_action": "אין פעולת Home Assistant — ישתנה רק ממסר הפאנל.",
  "card.loading": "טוען פאנל…",
  "card.missing_entry": "יש להגדיר entry_id לכרטיס.",
  "card.compact": "מצב קומפקטי",
  "card.operate": "תפעול",
  "card.operate_exit": "הגדרות",
  "card.operate_hint": "הצג רק את תצוגת הפאנל ופקדי התריס החיים",
  "card.language": "שפה",
  "card.import": "ייבוא",
  "card.export": "ייצוא",
  "card.import_merge": "ייבוא (מיזוג)",
  "card.import_replace": "ייבוא (החלפה)",
  "card.import_ok": "הפרופילים יובאו.",
  "card.export_ok": "הפרופילים יוצאו.",
  "card.import_invalid": "קובץ JSON של פרופילים לא תקין.",
  "card.section_toggle": "הצג מקטע",
  "card.activate": "הפעל",
  "card.profile_name": "שם פרופיל",
  "card.panel_name": "שם פאנל",
  "card.panel_name_ok": "שם הפאנל עודכן.",
  "card.menu": "הגדרות",
  "card.tabs_hint": "שלושה שלבי הגדרה מתחת לתצוגת הפאנל",
  "card.step_1": "שלב 1",
  "card.step_2": "שלב 2",
  "card.step_3": "שלב 3",
  "card.wizard": "אשף הגדרה",
  "card.wizard_next": "הבא",
  "card.wizard_back": "חזרה",
  "card.step_language": "שפה",
  "card.step_profiles": "פאנל / פרופיל",
  "card.step_edit": "עריכת הגדרות",
  "card.step_preview": "תצוגת פאנל",
  "card.step_review": "סקירה וסנכרון",
  "card.step_transfer": "ייצוא / ייבוא",
  "card.step_language_hint": "בחרו שפת ממשק. בעברית הפריסה מימין לשמאל.",
  "card.step_profiles_hint": "בחרו פרופיל פעיל ומספר גאנגים (מפסק) לפרופיל.",
  "card.step_edit_hint": "ערכו מראה ותוויות. שינויי טיוטה נשארים מקומיים עד שמירה או סנכרון.",
  "card.step_preview_hint": "תצוגה חיה בסגנון Zemismart: תוויות למעלה, טבעות LED משמאל לימין.",
  "card.step_review_hint": "סקרו את הטיוטה, שמרו, ואז סנכרנו לפאנל הפיזי.",
  "card.step_transfer_hint": "הורידו או העלו קובץ JSON נייד שנתמך ב־Home Assistant.",
  "card.import_mode": "מצב ייבוא",
  "card.schema_title": "סכמת JSON נתמכת",
  "card.schema_body": "הקובץ חייב להתאים ל־export_profiles: schema_version, active_profile_id, profiles.",
  "card.service_yaml": "קריאת שירות YAML",
  "card.copy_yaml": "העתק YAML",
  "card.copied": "הועתק",
  "card.close": "סגירה",
  "card.choose_file": "בחרו קובץ JSON",
  "card.download_export": "הורדת .json",
  "card.more": "עוד",
  "card.info": "מידע",
  "info.title": "מדריך לכרטיס",
  "info.intro":
    "הסבר קצר על הפקדים העיקריים בכרטיס. אפשר לפתוח בכל עת מתפריט ההגדרות.",
  "info.profiles_title": "פרופילים",
  "info.profiles_body":
    "יצירה, שינוי שם, שכפול, מחיקה והפעלה של פרופילים. מספר גאנגים (1–4) קובע כמה כפתורים פיזיים (L1…Ln) הפרופיל משתמש.",
  "info.appearance_title": "מראה",
  "info.appearance_body":
    "צבעי LED דלוק/כבוי, רדאר, תאורת רקע, עוצמה ונעילת ילדים. אלה מתעדכנים בחומרה בסנכרון לפאנל.",
  "info.buttons_title": "כפתורים",
  "info.buttons_body":
    "בחרו מצב ואז ערכו תוויות והתנהגות. במיקס חופשי מגדירים תפקיד לכל L#. הרחבת שורת כפתור מאפשרת פעולה, ישות ונתוני פעולה (YAML) אופציונליים.",
  "info.modes_title": "מצבים",
  "info.modes_body":
    "טוגל: כל כפתור ננעל בנפרד. רדיו חובה / אופציונלי / ספליט: קבוצות בלעדיות. תריס: מיפוי ייעודי. מיקס חופשי: כל כפתור בוחר תפקיד משלו.",
  "info.roles_title": "תפקידים במיקס חופשי",
  "info.roles_body":
    "טוגל = ממסר נעול. רגעי = הדלקה ואז כיבוי אחרי זמן הפולס (לחיצה חוזרת מבטלת). רדיו = קבוצת רדיו קלאסית. פתיחה/סגירת תריס = כיווני מנוע לפי מזהה מנוע.",
  "info.sync_title": "שמירת טיוטה מול סנכרון",
  "info.sync_body":
    "שמור טיוטה שומר תפקידים ופעולות כדי שלחיצות יעבדו לפי הטיוטה. סנכרון דוחף תוויות, צבעים והגדרות על הפאנל. בזמן שיש טיוטה לא שמורה, לחיצות פיזיות עדיין לפי הפרופיל השמור האחרון.",
  "info.operate_title": "מצב תפעול",
  "info.operate_body":
    "מציג רק את תצוגת הפאנל לשימוש יומיומי. בתפריט הפינה בחרו «הגדרות» כדי לחזור לעורך המלא.",
  "info.cover_title": "מנוע תריס מול ישות HA",
  "info.cover_body":
    "מנוע / מזהה תריס מזווג פתיחה וסגירה פנימית — זו לא ישות cover.* של Home Assistant. זמני נסיעה ולחיצה הפוכה מופיעים בכרטיס תפקיד התריס הראשון של אותו מנוע. אפשר לקשר ישות cover.* כדי לשקף פתיחה/סגירה/עצירה לסטטוס ואוטומציות; ממסרי הפאנל עדיין מפעילים את המנוע.",
  "info.actions_title": "פעולות ונתוני YAML",
  "info.actions_body":
    "פעולה היא שירות Home Assistant (דומיין.שירות). הישות מגדירה את היעד. נתוני פעולה (YAML) מוסיפים שדות data נוספים (name, value, run וכו') בלי להחליף את יעד הישות.",
  "info.menu_title": "תפריט הגדרות",
  "info.menu_body":
    "שפה, ערכת נושא, ייצוא/ייבוא, דוגמת אוטומציה YAML, ומדריך המידע הזה.",
  "card.automation_example": "דוגמה לאוטומציה",
  "card.automation_example_hint":
    "החלפת פרופילים לפי שעות היום. הפעלת פרופיל מעדכנת רק את הטיוטה השמורה — הפאנל הפיזי משתנה רק כשהקריאה גם מסנכרנת, ולכן בכל פעולה כאן מופיע sync: true.",
  "card.automation_yaml_alias": "ConX Dynamic Panel - פרופיל לפי שעות היום",
  "card.automation_yaml_header":
    "ConX Dynamic Panel: החלפת הפרופיל הפעיל לפי שעות היום.",
  "card.automation_yaml_sync":
    "sync: true שולח את הפרופיל לפאנל הפיזי. בלעדיו משתנה רק הטיוטה.",
  "card.automation_yaml_ids":
    "החליפו את entry_id ואת profile_id בערכים של הפאנל שלכם.",
  "card.automation_yaml_morning": "בוקר",
  "card.automation_yaml_evening": "ערב",
  "card.automation_yaml_night": "לילה",
  "editor.entry_id": "מזהה רשומת הגדרה",
  "mode.toggle": "החלפה",
  "mode.radio_mandatory": "רדיו חובה",
  "mode.radio_optional": "רדיו אופציונלי",
  "mode.radio_split": "רדיו ספליט",
  "mode.mixed": "מיקס חופשי",
  "mode.cover": "תריס",
  "card.mixed_hint":
    "הגדירו כל כפתור בנפרד: טוגל (ממסר נעול), רגעי, קבוצת רדיו או פתיחה/סגירה של תריס. רגעי מדליק ואז מכבה אחרי זמן הפולס; לחיצה חוזרת מבטלת ומכבה. אין תפקיד נפרד בשם «רליי» — לטוגל של הממסר בחרו טוגל, ולהפעלת Home Assistant הגדירו גם פעולה.",
  "card.mixed_roles": "תפקיד לכל כפתור",
  "card.button_role": "תפקיד כפתור",
  "card.pulse_time": "זמן פולס",
  "card.cover_id": "מנוע / מזהה תריס",
  "card.mixed_radio_hint":
    "שייכו את הכפתור לקבוצת רדיו למטה. רדיו קלאסי משאיר תמיד חבר אחד דלוק (כיבוי מחזיר להדלקה). רק כפתורים בתפקיד «קבוצת רדיו» נשארים בקבוצה.",
  "card.mixed_cover_hint":
    "מנוע תריס: תפקידי פתיחה/סגירה וזמני נסיעה כאן. מזהה המנוע פנימי (לא ישות HA). אפשר לקשר ישות cover.* למטה כדי לשקף פתיחה/סגירה/עצירה לסטטוס ואוטומציות — ממסרי הפאנל עדיין מפעילים את המנוע.",
  "role.toggle": "טוגל",
  "role.momentary": "רגעי",
  "role.radio": "קבוצת רדיו",
  "role.cover_open": "פתיחת תריס",
  "role.cover_close": "סגירת תריס",
};

const RU: Record<string, string> = {
  "card.title": "ConX Dynamic Panel",
  "card.sync": "Синхронизация",
  "card.pull": "Считать с панели",
  "card.save": "Сохранить черновик",
  "card.discard": "Отменить изменения",
  "card.create": "Создать",
  "card.duplicate": "Дублировать",
  "card.rename": "Переименовать",
  "card.delete": "Удалить",
  "card.profiles": "Профили",
  "card.editor": "Внешний вид",
  "card.buttons": "Кнопки",
  "card.preview": "Превью панели",
  "card.actions": "Действия",
  "card.status": "Статус",
  "card.error": "Ошибка",
  "card.mode": "Режим",
  "card.color_on": "Цвет ВКЛ",
  "card.color_off": "Цвет ВЫКЛ",
  "card.radar": "Радар",
  "color.red": "Красный",
  "color.blue": "Синий (на панели выглядит как циан)",
  "color.green": "Зелёный",
  "color.white": "Белый",
  "color.yellow": "Жёлтый",
  "color.magenta": "Пурпурный",
  "color.cyan": "Циан",
  "color.warm_white": "Тёплый белый",
  "color.warm_yellow": "Тёплый жёлтый",
  "radar.none": "Нет (выкл.)",
  "card.backlight": "Подсветка",
  "card.backlight_brightness": "Яркость подсветки",
  "card.child_lock": "Блокировка",
  "card.theme": "Тема интерфейса",
  "card.open_export_wizard": "Мастер экспорта",
  "card.back_to_editor": "Назад к редактору",
  "card.button": "Кнопка",
  "card.button_expand": "Развернуть настройки кнопки",
  "card.button_collapse": "Свернуть настройки кнопки",
  "card.label": "Название",
  "card.action": "Действие",
  "card.entity_id": "Entity ID",
  "card.action_none": "Без действия Home Assistant",
  "card.entity_none": "Без сущности (необязательно)",
  "card.action_picker_hint": "Поиск службы Home Assistant (домен.служба).",
  "card.entity_picker_hint": "Поиск сущностей; фильтр по домену действия, если он выбран.",
  "card.action_data": "Данные действия (YAML)",
  "card.action_data_hint":
    "Необязательные поля data службы (как Инструменты разработчика → Действия → data:). Одна строка key: value или JSON-объект. Выбор сущности по-прежнему задаёт target; здесь — доп. поля (name, value, run и т.д.).",
  "card.action_data_placeholder": "name: day\nvalue: Morning\nrun: true",
  "card.action_data_invalid": "Некорректные данные действия",
  "card.picker_search": "Поиск…",
  "card.radio_participation": "Поведение кнопки",
  "card.radio_member": "В радиогруппе",
  "card.radio_toggle": "Независимый тоггл",
  "card.radio_groups": "Радиогруппы",
  "card.radio_groups_hint": "Нажмите L1–L4, чтобы добавить или убрать кнопку. Кнопки в группе работают как классическое радио: ровно одна включена. Кнопки вне групп остаются независимыми тогглами.",
  "card.radio_groups_toggle": "Показать радиогруппы",
  "card.radio_group": "Группа",
  "card.radio_groups_overlap": "Каждая кнопка может входить только в одну радиогруппу.",
  "card.cover": "Ролета / жалюзи",
  "card.cover_hint":
    "Выберите кнопки панели, управляющие мотором. Нажатие направления запускает движение по таймеру, повторное нажатие останавливает его. Интеграция никогда не включает оба направления одновременно.",
  "card.cover_open_button": "Кнопка открытия",
  "card.cover_close_button": "Кнопка закрытия",
  "card.cover_open_time": "Время открытия",
  "card.cover_close_time": "Время закрытия",
  "card.cover_settle": "Задержка смены направления",
  "card.cover_times": "Время хода",
  "card.mixed_cover_times_hint":
    "Открыть/закрыть задаются ролями выше. Время хода — в карточке роли ролеты.",
  "card.mixed_cover_times_on": "Время хода для этого мотора задано на L{n}.",
  "card.cover_id_hint":
    "Внутренний слот мотора для пары открыть/закрыть — не сущность cover.* Home Assistant.",
  "card.cover_ha_entity": "Сущность cover в HA (необязательно)",
  "card.cover_ha_entity_hint":
    "Кнопки панели по-прежнему управляют реле мотора. Свяжите cover.*, чтобы зеркалировать открытие/закрытие/стоп для статуса и автоматизаций HA.",
  "card.cover_ha_entity_none": "Без cover в HA (необязательно)",
  "card.cover_settle_hint":
    "Короткая пауза перед сменой направления (безопасность реле мотора).",
  "card.cover_opposite": "Противоположное нажатие",
  "card.cover_same_button": "Открытие и закрытие должны использовать разные кнопки.",
  "card.cover_live": "Управление ролетой",
  "card.cover_open": "Открыть",
  "card.cover_close": "Закрыть",
  "card.cover_stop": "Стоп",
  "card.cover_state_idle": "Остановлено",
  "card.cover_state_open": "Открывается",
  "card.cover_state_close": "Закрывается",
  "card.cover_seconds": "с",
  "card.cover_safety":
    "Безопасность: нажатия обрабатываются интеграцией. Оба реле направлений принудительно выключаются при остановке, истечении таймера, смене профиля, синхронизации и перезагрузке.",
  "card.cover_add": "Добавить ролету",
  "card.cover_remove": "Удалить",
  "card.cover_slot_empty": "Не настроено",
  "card.cover_slot_hint":
    "Назначьте оставшиеся кнопки второй ролете. Каждой ролете нужны две разные кнопки (открыть + закрыть).",
  "card.gang_count": "Число кнопок",
  "card.gang_count_hint":
    "Сколько физических кнопок (L1…Ln) использует профиль. Число ролет ограничено floor(n/2). Выберите 4, чтобы использовать две ролеты.",
  "cover.stop_only": "Только стоп",
  "cover.stop_then_reverse": "Стоп, затем реверс",
  "theme.noir": "Нуар серый",
  "theme.ivory": "Слоновая кость холодная",
  "card.unsaved":
    "Несохранённый черновик — нажатия на панели всё ещё по последнему сохранённому профилю. Сохраните черновик для ролей/действий; синхронизация обновляет подписи и цвета на панели.",
  "card.sync_needed":
    "Черновик сохранён. Поведение кнопок уже по этому черновику. Синхронизируйте панель, чтобы отправить подписи, цвета и настройки на железо.",
  "card.missing_action": "Нет действия Home Assistant — изменится только реле панели.",
  "card.loading": "Загрузка панели…",
  "card.missing_entry": "Укажите entry_id для карточки.",
  "card.compact": "Компактный режим",
  "card.operate": "Управление",
  "card.operate_exit": "Настройки",
  "card.operate_hint": "Показать только панель и живые элементы управления",
  "card.language": "Язык",
  "card.import": "Импорт",
  "card.export": "Экспорт",
  "card.import_merge": "Импорт (слияние)",
  "card.import_replace": "Импорт (замена)",
  "card.import_ok": "Профили импортированы.",
  "card.export_ok": "Профили экспортированы.",
  "card.import_invalid": "Некорректный JSON файл профилей.",
  "card.section_toggle": "Показать раздел",
  "card.activate": "Активировать",
  "card.profile_name": "Имя профиля",
  "card.panel_name": "Имя панели",
  "card.panel_name_ok": "Имя панели обновлено.",
  "card.menu": "Настройки",
  "card.tabs_hint": "Три шага настройки под превью панели",
  "card.step_1": "Шаг 1",
  "card.step_2": "Шаг 2",
  "card.step_3": "Шаг 3",
  "card.wizard": "Мастер настройки",
  "card.wizard_next": "Далее",
  "card.wizard_back": "Назад",
  "card.step_language": "Язык",
  "card.step_profiles": "Панель / профиль",
  "card.step_edit": "Настройки",
  "card.step_preview": "Превью панели",
  "card.step_review": "Обзор и синхронизация",
  "card.step_transfer": "Экспорт / импорт",
  "card.step_language_hint": "Выберите язык карточки. Иврит использует RTL.",
  "card.step_profiles_hint": "Выберите активный профиль и число физических кнопок.",
  "card.step_edit_hint": "Редактируйте внешний вид и подписи. Черновик локальный до сохранения/синхронизации.",
  "card.step_preview_hint": "Живое превью Zemismart: подписи сверху, LED-кольца слева направо.",
  "card.step_review_hint": "Проверьте черновик, сохраните, затем синхронизируйте на панель.",
  "card.step_transfer_hint": "Скачайте или загрузите JSON-файл, поддерживаемый Home Assistant.",
  "card.import_mode": "Режим импорта",
  "card.schema_title": "Поддерживаемая схема JSON",
  "card.schema_body": "Файл должен соответствовать export_profiles: schema_version, active_profile_id, profiles.",
  "card.service_yaml": "YAML вызова сервиса",
  "card.copy_yaml": "Копировать YAML",
  "card.copied": "Скопировано",
  "card.close": "Закрыть",
  "card.more": "Ещё",
  "card.info": "Справка",
  "info.title": "Справочник по карточке",
  "info.intro":
    "Краткий обзор основных элементов карточки. Открывается из меню в любой момент.",
  "info.profiles_title": "Профили",
  "info.profiles_body":
    "Создание, переименование, дублирование, удаление и активация профилей. Число кнопок (1–4) задаёт, сколько физических кнопок (L1…Ln) использует профиль.",
  "info.appearance_title": "Внешний вид",
  "info.appearance_body":
    "Цвета LED ВКЛ/ВЫКЛ, радар, подсветка, яркость и блокировка. Обновляются на железе при синхронизации.",
  "info.buttons_title": "Кнопки",
  "info.buttons_body":
    "Выберите режим, затем правьте подписи и поведение. В свободном миксе задайте роль для каждого L#. Раскройте строку кнопки для Action, Entity и необязательных данных действия (YAML).",
  "info.modes_title": "Режимы",
  "info.modes_body":
    "Toggle: каждая кнопка фиксируется отдельно. Radio mandatory / optional / split: взаимоисключающие группы. Cover: отдельная схема ролеты. Free mix: у каждой кнопки своя роль.",
  "info.roles_title": "Роли свободного микса",
  "info.roles_body":
    "Toggle = зафиксированное реле. Momentary = ВКЛ, затем ВЫКЛ после времени импульса (повторное нажатие отменяет). Radio = классическая радиогруппа. Cover open/close = направления мотора по слоту.",
  "info.sync_title": "Черновик и синхронизация",
  "info.sync_body":
    "Сохранить черновик записывает роли и действия, чтобы нажатия шли по черновику. Синхронизация отправляет подписи, цвета и настройки на панель. Пока черновик не сохранён, физические нажатия идут по последнему сохранённому профилю.",
  "info.operate_title": "Режим управления",
  "info.operate_body":
    "Показывает только лицевую панель для повседневного использования. В угловом меню выберите «Настройки», чтобы вернуться к полному редактору.",
  "info.cover_title": "Мотор ролеты и сущность HA",
  "info.cover_body":
    "Мотор / слот ролеты связывает открытие и закрытие внутри — это не сущность cover.* Home Assistant. Время хода и противоположное нажатие задаются на первой карточке роли cover для этого мотора. Можно связать cover.*, чтобы зеркалировать open/close/stop для статуса и автоматизаций; реле панели по-прежнему управляют мотором.",
  "info.actions_title": "Действия и YAML",
  "info.actions_body":
    "Action — служба Home Assistant (домен.служба). Entity задаёт цель. Данные действия (YAML) добавляют поля data (name, value, run, …), не заменяя цель сущности.",
  "info.menu_title": "Меню настроек",
  "info.menu_body":
    "Язык, тема, экспорт/импорт, пример автоматизации YAML и эта справка.",
  "card.automation_example": "Пример автоматизации",
  "card.automation_example_hint":
    "Переключение профилей по времени суток. Активация профиля меняет только сохранённый черновик — физическая панель меняется, только если вызов также синхронизирует, поэтому во всех действиях указано sync: true.",
  "card.automation_yaml_alias": "ConX Dynamic Panel - профиль по времени суток",
  "card.automation_yaml_header":
    "ConX Dynamic Panel: переключение активного профиля по времени суток.",
  "card.automation_yaml_sync":
    "sync: true отправляет профиль на физическую панель. Без него меняется только черновик.",
  "card.automation_yaml_ids":
    "Замените entry_id и profile_id на значения вашей панели.",
  "card.automation_yaml_morning": "Утро",
  "card.automation_yaml_evening": "Вечер",
  "card.automation_yaml_night": "Ночь",
  "card.choose_file": "Выбрать JSON",
  "card.download_export": "Скачать .json",
  "editor.entry_id": "ID записи конфигурации",
  "mode.toggle": "Переключатель",
  "mode.radio_mandatory": "Радио (обязательно)",
  "mode.radio_optional": "Радио (опционально)",
  "mode.radio_split": "Радио сплит",
  "mode.mixed": "Свободный микс",
  "mode.cover": "Ролета / жалюзи",
  "card.mixed_hint":
    "Настройте каждую кнопку отдельно: тоггл (защёлка реле), импульс, радиогруппа или открытие/закрытие ролеты. Импульс включает, затем выключает по таймеру; повторное нажатие отменяет и выключает. Отдельной роли «реле» нет — для защёлки реле выберите Тоггл и при необходимости задайте действие Home Assistant.",
  "card.mixed_roles": "Роль каждой кнопки",
  "card.button_role": "Роль кнопки",
  "card.pulse_time": "Время импульса",
  "card.cover_id": "Мотор / слот ролеты",
  "card.mixed_radio_hint":
    "Назначьте кнопку в радиогруппу ниже. Классическое радио держит ровно одного участника включённым (выключение возвращает включение). В группах остаются только кнопки с ролью «Радиогруппа».",
  "card.mixed_cover_hint":
    "Мотор ролеты: роли Открыть/Закрыть и время хода здесь. Слот мотора внутренний (не сущность HA). Ниже можно связать cover.* для зеркалирования открытия/закрытия/стопа в HA — реле панели по-прежнему управляют мотором.",
  "role.toggle": "Тоггл",
  "role.momentary": "Импульс",
  "role.radio": "Радиогруппа",
  "role.cover_open": "Открыть ролету",
  "role.cover_close": "Закрыть ролету",
};

const TABLES: Record<CardLanguage, Record<string, string>> = {
  en: EN,
  he: HE,
  ru: RU,
};

export const LANGUAGE_OPTIONS: Array<{
  id: CardLanguage;
  label: string;
  flag: string;
}> = [
  { id: "he", label: "עברית", flag: "IL" },
  { id: "en", label: "English", flag: "GB" },
  { id: "ru", label: "Русский", flag: "RU" },
];

export function normalizeLanguage(language: string | undefined): CardLanguage {
  const lang = (language || "en").toLowerCase();
  if (lang.startsWith("he") || lang.startsWith("iw")) {
    return "he";
  }
  if (lang.startsWith("ru")) {
    return "ru";
  }
  return "en";
}

export function loadStoredLanguage(): CardLanguage | null {
  try {
    const value = globalThis.localStorage?.getItem?.(STORAGE_KEY);
    if (value === "en" || value === "he" || value === "ru") {
      return value;
    }
  } catch {
    /* ignore */
  }
  return memoryStore.language || null;
}

export function persistLanguage(language: CardLanguage): void {
  memoryStore.language = language;
  try {
    globalThis.localStorage?.setItem?.(STORAGE_KEY, language);
  } catch {
    /* ignore */
  }
}

/** Test helper to reset in-memory language preference. */
export function clearStoredLanguage(): void {
  delete memoryStore.language;
  try {
    globalThis.localStorage?.removeItem?.(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function localize(language: string | undefined, key: string): string {
  const lang = normalizeLanguage(language);
  const table = TABLES[lang];
  return table[key] || EN[key] || key;
}

export function isRtl(language: string | undefined): boolean {
  return normalizeLanguage(language) === "he";
}
