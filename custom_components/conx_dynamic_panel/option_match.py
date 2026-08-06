"""Normalize and resolve Home Assistant select option strings."""

from __future__ import annotations

from .exceptions import HardwareWriteError


def normalize_select_option_key(value: str) -> str:
    """Normalize option labels for fuzzy matching (case, spaces, hyphens)."""
    key = str(value).strip().lower()
    for ch in (" ", "-", ".", "/"):
        key = key.replace(ch, "_")
    while "__" in key:
        key = key.replace("__", "_")
    return key.strip("_")


def options_match(left: str, right: str) -> bool:
    """Return True when two option strings refer to the same choice."""
    return normalize_select_option_key(left) == normalize_select_option_key(right)


def resolve_select_option(requested: str, options: list[str] | None) -> str:
    """Map a profile value to an actual select entity option string.

    Prefers an exact match, then a normalized match against live options.
    When options are unknown/empty, returns the requested value unchanged.
    """
    requested = str(requested).strip()
    if not options:
        return requested
    if requested in options:
        return requested
    wanted = normalize_select_option_key(requested)
    for option in options:
        if normalize_select_option_key(option) == wanted:
            return str(option)
    raise HardwareWriteError(
        f"Option '{requested}' is not available; choices={list(options)}"
    )
