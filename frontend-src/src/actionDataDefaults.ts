/**
 * Sensible default `data:` YAML snippets for Home Assistant services.
 * Prefill when the user picks an action; keep flat key: value (or JSON values)
 * so the lightweight Action data editor can parse them.
 */

import { actionDomain } from "./haPickers";
import {
  actionDataEqual,
  parseActionData,
  serializeActionData,
} from "./actionDataYaml";

/** Exact `domain.service` → example YAML body (may be empty). */
const SERVICE_DEFAULTS: Record<string, string> = {
  "light.turn_on": "brightness_pct: 70\nrgb_color: [255, 200, 120]",
  "light.turn_off": "transition: 1",
  "light.toggle": "",
  "switch.turn_on": "",
  "switch.turn_off": "",
  "switch.toggle": "",
  "cover.open_cover": "",
  "cover.close_cover": "",
  "cover.stop_cover": "",
  "cover.set_cover_position": "position: 50",
  "cover.set_cover_tilt_position": "tilt_position: 50",
  "climate.set_temperature": "temperature: 22\nhvac_mode: heat",
  "climate.set_hvac_mode": "hvac_mode: heat",
  "climate.set_preset_mode": "preset_mode: home",
  "climate.set_fan_mode": "fan_mode: auto",
  "media_player.volume_set": "volume_level: 0.5",
  "media_player.play_media":
    'media_content_id: "https://example.com/media.mp3"\nmedia_content_type: music',
  "media_player.media_play": "",
  "media_player.media_pause": "",
  "media_player.media_stop": "",
  "media_player.media_next_track": "",
  "media_player.media_previous_track": "",
  "fan.turn_on": "percentage: 50",
  "fan.turn_off": "",
  "fan.toggle": "",
  "fan.set_percentage": "percentage: 50",
  "fan.set_preset_mode": "preset_mode: auto",
  "lock.lock": "",
  "lock.unlock": "",
  "lock.open": "",
  "vacuum.start": "",
  "vacuum.pause": "",
  "vacuum.stop": "",
  "vacuum.return_to_base": "",
  "vacuum.set_fan_speed": "fan_speed: medium",
  "script.turn_on": 'variables: {"name": "day", "run": true}',
  "script.turn_off": "",
  "script.toggle": "",
  "scene.turn_on": "transition: 2",
  "input_boolean.turn_on": "",
  "input_boolean.turn_off": "",
  "input_boolean.toggle": "",
  "input_select.select_option": "option: Morning",
  "input_number.set_value": "value: 21",
  "input_text.set_value": 'value: "Hello"',
  "input_datetime.set_datetime": 'datetime: "2026-01-01 08:00:00"',
  "number.set_value": "value: 50",
  "select.select_option": "option: option_1",
  "text.set_value": 'value: "Hello"',
  "button.press": "",
  "automation.trigger": "",
  "automation.turn_on": "",
  "automation.turn_off": "",
  "automation.toggle": "",
  "notify.notify": 'message: "Hello from ConX"\ntitle: ConX',
  "persistent_notification.create":
    'message: "Hello from ConX"\ntitle: ConX\nnotification_id: conx',
  "remote.send_command": "command: Power",
  "alarm_control_panel.alarm_arm_home": 'code: "1234"',
  "alarm_control_panel.alarm_arm_away": 'code: "1234"',
  "alarm_control_panel.alarm_disarm": 'code: "1234"',
  "humidifier.set_humidity": "humidity: 45",
  "humidifier.set_mode": "mode: normal",
  "water_heater.set_temperature": "temperature: 45",
  "water_heater.set_operation_mode": "operation_mode: eco",
  "timer.start": 'duration: "00:05:00"',
  "timer.cancel": "",
  "timer.finish": "",
  "counter.increment": "",
  "counter.decrement": "",
  "counter.reset": "",
  "counter.set_value": "value: 0",
  "siren.turn_on": "",
  "siren.turn_off": "",
  "siren.toggle": "",
  "homeassistant.turn_on": "",
  "homeassistant.turn_off": "",
  "homeassistant.toggle": "",
};

/** Domain fallback when the exact service has no entry. */
const DOMAIN_DEFAULTS: Record<string, string> = {
  light: "brightness_pct: 70",
  switch: "",
  cover: "position: 50",
  climate: "temperature: 22",
  media_player: "volume_level: 0.5",
  fan: "percentage: 50",
  lock: "",
  vacuum: "",
  script: 'variables: {"name": "day", "run": true}',
  scene: "transition: 2",
  input_boolean: "",
  input_select: "option: Morning",
  input_number: "value: 21",
  input_text: 'value: "Hello"',
  number: "value: 50",
  select: "option: option_1",
  text: 'value: "Hello"',
  button: "",
  automation: "",
  notify: 'message: "Hello from ConX"\ntitle: ConX',
  remote: "command: Power",
  alarm_control_panel: 'code: "1234"',
  humidifier: "humidity: 45",
  water_heater: "temperature: 45",
  timer: 'duration: "00:05:00"',
  counter: "value: 0",
  siren: "",
};

/** Services that normally need no (or empty) data — beat domain fallbacks. */
const EMPTY_SERVICE_NAMES = new Set([
  "toggle",
  "turn_off",
  "stop",
  "stop_cover",
  "open_cover",
  "close_cover",
  "media_play",
  "media_pause",
  "media_stop",
  "media_next_track",
  "media_previous_track",
  "lock",
  "unlock",
  "open",
  "start",
  "pause",
  "return_to_base",
  "press",
  "trigger",
  "cancel",
  "finish",
  "increment",
  "decrement",
  "reset",
]);

/**
 * Return the example YAML body for a `domain.service` action.
 * Empty string means no extra data fields are typically needed.
 */
export function defaultActionDataYaml(
  action: string | null | undefined
): string {
  const trimmed = (action || "").trim();
  if (!trimmed) {
    return "";
  }
  if (Object.prototype.hasOwnProperty.call(SERVICE_DEFAULTS, trimmed)) {
    return SERVICE_DEFAULTS[trimmed];
  }
  const domain = actionDomain(trimmed);
  const dot = trimmed.indexOf(".");
  const service = dot > 0 ? trimmed.slice(dot + 1) : "";
  if (EMPTY_SERVICE_NAMES.has(service)) {
    return "";
  }
  if (domain && Object.prototype.hasOwnProperty.call(DOMAIN_DEFAULTS, domain)) {
    return DOMAIN_DEFAULTS[domain];
  }
  // notify.* family (notify.mobile_app_…)
  if (domain === "notify" || trimmed.startsWith("notify.")) {
    return DOMAIN_DEFAULTS.notify;
  }
  return "";
}

/** Parsed default data object for an action ({} when empty / invalid). */
export function defaultActionData(
  action: string | null | undefined
): Record<string, unknown> {
  const yaml = defaultActionDataYaml(action);
  if (!yaml.trim()) {
    return {};
  }
  const parsed = parseActionData(yaml);
  return parsed.ok ? parsed.data : {};
}

/**
 * Whether changing the action should replace the YAML editor contents.
 * Replace when empty, or when the text still matches the last auto-default.
 * Preserve when the user has customized away from that default.
 */
export function shouldReplaceActionDataYaml(
  currentText: string | null | undefined,
  previousAutoDefault: string | undefined
): boolean {
  const current = (currentText || "").trim();
  if (!current) {
    return true;
  }
  if (previousAutoDefault === undefined) {
    return false;
  }
  const previous = previousAutoDefault.trim();
  if (current === previous) {
    return true;
  }
  const curParsed = parseActionData(current);
  const prevParsed = parseActionData(previous);
  if (
    curParsed.ok &&
    prevParsed.ok &&
    actionDataEqual(curParsed.data, prevParsed.data)
  ) {
    return true;
  }
  return false;
}

/**
 * Decide the next YAML / data after an action change.
 * Returns `null` when the existing editor contents must be preserved.
 */
export function nextActionDataPrefill(
  action: string | null | undefined,
  currentText: string | null | undefined,
  previousAutoDefault: string | undefined
): { yaml: string; data: Record<string, unknown> } | null {
  const nextAction = (action || "").trim();
  if (!nextAction) {
    return { yaml: "", data: {} };
  }
  if (!shouldReplaceActionDataYaml(currentText, previousAutoDefault)) {
    return null;
  }
  const yaml = defaultActionDataYaml(nextAction);
  const data = defaultActionData(nextAction);
  // Prefer serialize of parsed data so display matches round-trip form.
  const normalized = serializeActionData(data);
  return { yaml: normalized || yaml, data };
}
