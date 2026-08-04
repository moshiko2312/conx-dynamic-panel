export interface ButtonAction {
  action: string;
  target?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface ButtonConfig {
  index: number;
  name: string;
  action: ButtonAction | null;
  /** When profile mode is radio_*, participate in exclusivity (default true). */
  radio_member?: boolean;
}

export interface RadioGroup {
  id: string;
  buttons: number[];
}

export type CoverOppositePress = "stop_only" | "stop_then_reverse";

/** Cover/shutter wiring and travel timing enforced by the backend engine. */
export interface CoverConfig {
  /** 1-based panel button that drives the open direction. */
  open_button: number;
  /** 1-based panel button that drives the close direction. */
  close_button: number;
  open_time_s: number;
  close_time_s: number;
  /** Dead time between de-energizing one direction and energizing the other. */
  direction_settle_s: number;
  opposite_press: CoverOppositePress;
}

export interface CoverState {
  active: boolean;
  state: "idle" | "open" | "close";
  direction: "open" | "close" | null;
  duration: number | null;
  reason: string | null;
}

export interface Profile {
  id: string;
  name: string;
  mode:
    | "toggle"
    | "radio_mandatory"
    | "radio_optional"
    | "radio_split"
    | "cover";
  color_on: string;
  color_off: string;
  radar: string;
  backlight: boolean;
  /** Backlight dimmer level 0–100 (stored even when no HA number entity is mapped). */
  backlight_brightness: number;
  child_lock: boolean;
  selected_button: number | null;
  buttons: ButtonConfig[];
  /** Classic radio groups for radio_split (exactly one ON per group; ungrouped stay toggles). */
  radio_groups?: RadioGroup[];
  /** Cover/shutter mapping and travel times, used when mode is cover. */
  cover?: CoverConfig;
}

export interface PanelConfig {
  entry_id: string;
  panel_name: string;
  adapter_type: string;
  active_profile_id: string | null;
  sync_status: string;
  last_sync: string | null;
  last_error: string | null;
  auto_sync: boolean;
  capabilities: {
    colors: string[];
    radar: string[];
    modes: string[];
    button_count: number;
    cover?: {
      min_time_s: number;
      max_time_s: number;
      min_settle_s: number;
      max_settle_s: number;
      opposite_press: string[];
    };
  };
  profiles: Record<string, Profile>;
  applied_snapshot: Record<string, unknown>;
  cover_state?: CoverState;
}

export interface ProfilesExport {
  schema_version: number;
  active_profile_id: string | null;
  profiles: Record<string, Profile>;
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

export interface HomeAssistant {
  language?: string;
  locale?: { language?: string };
  callWS: <T>(msg: Record<string, unknown>) => Promise<T>;
  themes?: Record<string, unknown>;
  states?: Record<string, HassEntity>;
}
