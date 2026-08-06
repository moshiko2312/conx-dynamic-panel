export interface ButtonAction {
  action: string;
  target?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export type ButtonRole =
  | "toggle"
  | "momentary"
  | "radio"
  | "cover_open"
  | "cover_close";

export interface ButtonConfig {
  index: number;
  name: string;
  action: ButtonAction | null;
  /** Optional double-click HA action (deferred multi-click classification). */
  action_double?: ButtonAction | null;
  /** When profile mode is radio_*, participate in exclusivity (default true). */
  radio_member?: boolean;
  /** Per-button role when profile mode is mixed. */
  role?: ButtonRole;
  /** Pulse duration in seconds for momentary role (0.1–600). */
  pulse_time_s?: number;
  /** Cover id when role is cover_open / cover_close. */
  cover_id?: string | null;
}

export type ActionClickSlot = "single" | "double";

export interface RadioGroup {
  id: string;
  buttons: number[];
}

export type CoverOppositePress = "stop_only" | "stop_then_reverse";

/** One cover/shutter motor mapping and travel timing. */
export interface CoverConfig {
  /** Stable id within the profile (e.g. cover_1). */
  id: string;
  /** 1-based panel button that drives the open direction. */
  open_button: number;
  /** 1-based panel button that drives the close direction. */
  close_button: number;
  open_time_s: number;
  close_time_s: number;
  /** Dead time between de-energizing one direction and energizing the other. */
  direction_settle_s: number;
  opposite_press: CoverOppositePress;
  /**
   * Optional linked Home Assistant `cover.*` entity.
   * Panel relays still drive the motor; this mirrors open/close/stop for HA.
   */
  ha_entity_id?: string | null;
}

export interface CoverMotionState {
  id: string;
  state: "idle" | "open" | "close";
  direction: "open" | "close" | null;
  duration: number | null;
  reason: string | null;
  open_button?: number;
  close_button?: number;
}

export interface CoverState {
  active: boolean;
  state: "idle" | "open" | "close";
  direction: "open" | "close" | null;
  duration: number | null;
  reason: string | null;
  /** Cover currently mirrored by the top-level fields. */
  cover_id?: string | null;
  /** Per-cover live motion when the profile has multiple covers. */
  covers?: CoverMotionState[];
}

export interface Profile {
  id: string;
  name: string;
  mode:
    | "toggle"
    | "radio_mandatory"
    | "radio_optional"
    | "radio_split"
    | "mixed"
    | "cover";
  color_on: string;
  color_off: string;
  radar: string;
  backlight: boolean;
  /** Backlight dimmer level 0–100 (stored even when no HA number entity is mapped). */
  backlight_brightness: number;
  child_lock: boolean;
  selected_button: number | null;
  /** How many gangs (L1…Ln) this profile exposes. */
  gang_count: number;
  buttons: ButtonConfig[];
  /** Classic radio groups for radio_split / mixed radio roles. */
  radio_groups?: RadioGroup[];
  /** Cover/shutter mappings used when mode is cover or mixed. */
  covers?: CoverConfig[];
  /** Legacy single-cover block; normalized into covers[] on load. */
  cover?: CoverConfig;
}

/** Live runtime fields pushed by conx_dynamic_panel/subscribe (never drafts). */
export interface PanelRuntimeUpdate {
  entry_id?: string;
  sync_status?: string;
  last_sync?: string | null;
  last_error?: string | null;
  auto_sync?: boolean;
  holiday_mode?: boolean;
  /** Local per-panel holiday (may be false while master forces effective holiday). */
  panel_holiday_mode?: boolean;
  /** Domain master holiday — when true, every panel is in holiday. */
  master_holiday_mode?: boolean;
  default_profile_id?: string | null;
  active_profile_id?: string | null;
  relay_entities?: string[];
  /** Parallel to relay_entities: true=on, false=off, null=unknown. */
  relay_states?: Array<boolean | null>;
  /** 1-based button indexes with an armed backend momentary OFF timer. */
  momentary_active?: number[];
  cover_state?: CoverState;
  /** True when holiday is off and enabled schedule tasks exist for this panel. */
  scheduler_active?: boolean;
  /** Next effective profile change for the faceplate footer; omit/null to hide. */
  scheduler_next?: SchedulerNextEvent | null;
}

export interface SchedulerNextEvent {
  profile_id: string;
  profile_name: string;
  /** ISO timestamp when the change takes effect. */
  at: string;
  /** Local clock HH:MM for display. */
  at_time: string;
}

export interface ScheduleRange {
  start: string;
  end: string;
  profile_id: string;
}

export type ScheduleConditionOperator = "eq" | "neq" | "gt" | "lt" | "gte" | "lte";

export interface ScheduleCondition {
  entity_id: string;
  operator: ScheduleConditionOperator;
  value: string;
}

export interface SchedulerTask {
  id: string;
  name: string;
  enabled: boolean;
  weekdays: number[];
  months: number[];
  ranges: ScheduleRange[];
  notes?: string;
  scope?: "local" | "master";
  entry_ids?: string[];
  conditions?: ScheduleCondition[];
}

export interface PanelSummary {
  entry_id: string;
  panel_name: string;
}

export interface PanelConfig {
  entry_id: string;
  panel_name: string;
  adapter_type: string;
  active_profile_id: string | null;
  default_profile_id?: string | null;
  holiday_mode?: boolean;
  /** Local per-panel holiday flag. */
  panel_holiday_mode?: boolean;
  /** Domain master holiday — forces holiday on all panels when true. */
  master_holiday_mode?: boolean;
  scheduler_tasks?: Record<string, SchedulerTask>;
  master_scheduler_tasks?: Record<string, SchedulerTask>;
  panels?: PanelSummary[];
  scheduler_active?: boolean;
  scheduler_next?: SchedulerNextEvent | null;
  sync_status: string;
  last_sync: string | null;
  last_error: string | null;
  auto_sync: boolean;
  capabilities: {
    colors: string[];
    radar: string[];
    modes: string[];
    button_count: number;
    gang_count_min?: number;
    gang_count_max?: number;
    cover?: {
      min_time_s: number;
      max_time_s: number;
      min_settle_s: number;
      max_settle_s: number;
      opposite_press: string[];
      max_covers?: number;
    };
    mixed?: {
      roles: string[];
      min_pulse_s: number;
      max_pulse_s: number;
      default_pulse_s: number;
    };
  };
  profiles: Record<string, Profile>;
  applied_snapshot: Record<string, unknown>;
  /** Mapped L1–L4 switch entity IDs for live faceplate rings via hass.states. */
  relay_entities?: string[];
  /** Parallel to relay_entities from get_config / subscribe. */
  relay_states?: Array<boolean | null>;
  /** 1-based button indexes with an armed backend momentary OFF timer. */
  momentary_active?: number[];
  cover_state?: CoverState;
}

export interface ProfilesExport {
  schema_version: number;
  active_profile_id: string | null;
  profiles: Record<string, Profile>;
}

/** Portable scheduler-only export (local + masters for one entry). */
export interface SchedulerExport {
  schema_version: number;
  scope: "scheduler";
  entry_id?: string;
  default_profile_id?: string | null;
  scheduler_tasks: Record<string, SchedulerTask>;
  master_scheduler_tasks?: Record<string, SchedulerTask>;
  notes?: string;
}

export interface CardConfig {
  type: string;
  entry_id: string;
  compact?: boolean;
  language?: string;
  /** Visual UI theme id (noir, ivory). Legacy ids are normalized. */
  theme?: string;
}

export interface HassEntity {
  state: string;
  attributes?: Record<string, unknown>;
}

export interface HassConnection {
  subscribeMessage: <T>(
    callback: (message: T) => void,
    subscribeMessage: Record<string, unknown>
  ) => Promise<() => void>;
}

export interface HomeAssistant {
  language?: string;
  locale?: { language?: string };
  callWS: <T>(msg: Record<string, unknown>) => Promise<T>;
  connection?: HassConnection;
  themes?: Record<string, unknown>;
  states?: Record<string, HassEntity>;
  /** domain → service → description (used for action pickers). */
  services?: Record<string, Record<string, unknown>>;
}
