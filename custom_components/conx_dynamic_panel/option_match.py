"""Normalize and resolve Home Assistant select option strings."""

from __future__ import annotations

from .exceptions import HardwareWriteError

# Z2M ZMS-206 exposes warm_white/warm_yellow but Tuya lookup keys are
# warmwhite/warmyellow — writing the underscored values hangs the panel select.
# Never offer or write these; always resolve to white/yellow instead.
BROKEN_WARM_LED_COLORS: frozenset[str] = frozenset(
    {"warm_white", "warm_yellow", "warmwhite", "warmyellow"}
)
_BROKEN_WARM_LED_REMAP: dict[str, str] = {
    "warm_white": "white",
    "warmwhite": "white",
    "warm_yellow": "yellow",
    "warmyellow": "yellow",
}

# Closest / alternate labels when live select options differ from profile values.
# Order matters: first live match wins.
_OPTION_ALIASES: dict[str, tuple[str, ...]] = {
    # Warm LED enums are remapped before alias lookup; keep white/yellow aliases
    # so resolve still finds a live option after remap.
    "warm_white": ("white",),
    "warm_yellow": ("yellow",),
    "warmwhite": ("white",),
    "warmyellow": ("yellow",),
    # Radar off / disabled variants (Z2M canonical is "none").
    "none": ("off", "0", "disabled", "disable", "no", "ללא", "כבוי", "אין"),
    "off": ("none", "0", "disabled", "disable"),
    "0": ("none", "off"),
    "disabled": ("none", "off"),
    "ללא": ("none", "off"),
    "כבוי": ("none", "off"),
    "אין": ("none", "off"),
}


def is_broken_warm_led_color(value: str) -> bool:
    """Return True for Z2M warm LED enums that hang Zemismart panels."""
    key = normalize_select_option_key(value)
    if key in BROKEN_WARM_LED_COLORS:
        return True
    return compact_select_option_key(value) in BROKEN_WARM_LED_COLORS


def remap_broken_warm_led_color(value: str) -> str:
    """Map broken warm_* LED colors to working white/yellow (never write warm_*)."""
    requested = str(value).strip()
    if not requested:
        return requested
    key = normalize_select_option_key(requested)
    mapped = _BROKEN_WARM_LED_REMAP.get(key)
    if mapped is not None:
        return mapped
    mapped = _BROKEN_WARM_LED_REMAP.get(compact_select_option_key(requested))
    if mapped is not None:
        return mapped
    return requested


def filter_ui_color_options(options: list[str] | None) -> list[str]:
    """Drop known-broken warm LED enums from capabilities shown in the UI."""
    if not options:
        return []
    return [str(option) for option in options if not is_broken_warm_led_color(str(option))]


def normalize_select_option_key(value: str) -> str:
    """Normalize option labels for fuzzy matching (case, spaces, hyphens)."""
    key = str(value).strip().lower()
    for ch in (" ", "-", ".", "/"):
        key = key.replace(ch, "_")
    while "__" in key:
        key = key.replace("__", "_")
    return key.strip("_")


def compact_select_option_key(value: str) -> str:
    """Normalize then drop underscores (warm_white ↔ warmwhite)."""
    return normalize_select_option_key(value).replace("_", "")


def options_match(left: str, right: str) -> bool:
    """Return True when two option strings refer to the same choice."""
    if normalize_select_option_key(left) == normalize_select_option_key(right):
        return True
    return compact_select_option_key(left) == compact_select_option_key(right)


def _find_in_options(wanted_keys: list[str], options: list[str]) -> str | None:
    """Return the live option string matching any normalized/compact wanted key."""
    wanted_norm = {normalize_select_option_key(k) for k in wanted_keys}
    wanted_compact = {compact_select_option_key(k) for k in wanted_keys}
    for option in options:
        if normalize_select_option_key(option) in wanted_norm:
            return str(option)
        if compact_select_option_key(option) in wanted_compact:
            return str(option)
    return None


def resolve_select_option(requested: str, options: list[str] | None) -> str:
    """Map a profile value to an actual select entity option string.

    Prefers an exact match, then normalized / underscore-collapsed match, then
    known aliases (including closest colors / radar-off labels). Broken warm LED
    enums are always remapped to white/yellow before matching so they are never
    written to the device — even when live HA options still list them. When
    options are unknown/empty, returns the (possibly remapped) value.
    """
    original = str(requested).strip()
    requested = remap_broken_warm_led_color(original)
    if not options:
        return requested
    if requested in options and not is_broken_warm_led_color(requested):
        return requested

    direct = _find_in_options([requested], options)
    if direct is not None and not is_broken_warm_led_color(direct):
        return direct

    alias_keys = list(_OPTION_ALIASES.get(normalize_select_option_key(requested), ()))
    # Also try aliases keyed by compact form (warmwhite → …).
    compact = compact_select_option_key(requested)
    for key, aliases in _OPTION_ALIASES.items():
        if compact_select_option_key(key) == compact:
            alias_keys.extend(aliases)
            alias_keys.append(key)
    # If the original request was a broken warm color, prefer white/yellow aliases.
    if is_broken_warm_led_color(original):
        alias_keys = [requested, *alias_keys]

    # Preserve order while deduping; never return a broken warm enum as the write target.
    seen: set[str] = set()
    ordered: list[str] = []
    for key in alias_keys:
        if is_broken_warm_led_color(key):
            continue
        norm = normalize_select_option_key(key)
        if norm in seen:
            continue
        seen.add(norm)
        ordered.append(key)

    aliased = _find_in_options(ordered, options)
    if aliased is not None and not is_broken_warm_led_color(aliased):
        return aliased

    # Last resort: remapped working color may still be absent from a sparse options list.
    if requested != original and requested:
        raise HardwareWriteError(
            f"Option '{original}' (mapped to '{requested}') is not available; "
            f"choices={list(options)}"
        )
    raise HardwareWriteError(f"Option '{requested}' is not available; choices={list(options)}")
