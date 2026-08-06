"""Normalize and resolve Home Assistant select option strings."""

from __future__ import annotations

from .exceptions import HardwareWriteError

# Closest / alternate labels when live select options differ from profile values.
# Order matters: first live match wins.
_OPTION_ALIASES: dict[str, tuple[str, ...]] = {
    # Z2M expose uses warm_white; some converters / firmwares use warmwhite.
    # Closest working LED colors when warm variants are absent: white / yellow.
    "warm_white": ("warmwhite", "warm white", "white"),
    "warm_yellow": ("warmyellow", "warm yellow", "yellow"),
    "warmwhite": ("warm_white", "warm white", "white"),
    "warmyellow": ("warm_yellow", "warm yellow", "yellow"),
    # Radar off / disabled variants (Z2M canonical is "none").
    "none": ("off", "0", "disabled", "disable", "no", "ללא", "כבוי", "אין"),
    "off": ("none", "0", "disabled", "disable"),
    "0": ("none", "off"),
    "disabled": ("none", "off"),
    "ללא": ("none", "off"),
    "כבוי": ("none", "off"),
    "אין": ("none", "off"),
}


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
    known aliases (including closest colors / radar-off labels). When options
    are unknown/empty, returns the requested value unchanged.
    """
    requested = str(requested).strip()
    if not options:
        return requested
    if requested in options:
        return requested

    direct = _find_in_options([requested], options)
    if direct is not None:
        return direct

    alias_keys = list(_OPTION_ALIASES.get(normalize_select_option_key(requested), ()))
    # Also try aliases keyed by compact form (warmwhite → …).
    compact = compact_select_option_key(requested)
    for key, aliases in _OPTION_ALIASES.items():
        if compact_select_option_key(key) == compact:
            alias_keys.extend(aliases)
            alias_keys.append(key)

    # Preserve order while deduping.
    seen: set[str] = set()
    ordered: list[str] = []
    for key in alias_keys:
        norm = normalize_select_option_key(key)
        if norm in seen:
            continue
        seen.add(norm)
        ordered.append(key)

    aliased = _find_in_options(ordered, options)
    if aliased is not None:
        return aliased

    raise HardwareWriteError(f"Option '{requested}' is not available; choices={list(options)}")
