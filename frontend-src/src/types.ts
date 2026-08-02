export interface ButtonAction {
  action: string;
  target?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface ButtonConfig {
  index: number;
  name: string;
  action: ButtonAction | null;
}

export interface Profile {
  id: string;
  name: string;
  mode: "toggle" | "radio_mandatory" | "radio_optional";
  color_on: string;
  color_off: string;
  radar: string;
  backlight: boolean;
  child_lock: boolean;
  selected_button: number | null;
  buttons: ButtonConfig[];
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
  };
  profiles: Record<string, Profile>;
  applied_snapshot: Record<string, unknown>;
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
