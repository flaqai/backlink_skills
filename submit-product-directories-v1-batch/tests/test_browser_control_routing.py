from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).parents[1]


class BrowserRoutingTests(unittest.TestCase):
    def test_skill_loads_generic_routing_reference(self) -> None:
        skill = (ROOT / "SKILL.md").read_text(encoding="utf-8")
        self.assertIn("references/browser-control-routing.md", skill)

    def test_reference_is_backend_neutral(self) -> None:
        text = (ROOT / "references" / "browser-control-routing.md").read_text(encoding="utf-8")
        for required in (
            "Platform and capability preflight", "Windows", "macOS", "Linux", "Routing order",
            "Browser runtime path", "Desktop UI-control path", "declared target matches the current platform",
            "user handoff",
        ):
            self.assertIn(required, text)
        for forbidden in ("/Users/", "Chrome-bin", "BitBrowser.app", "sole automation backend"):
            self.assertNotIn(forbidden, text)


if __name__ == "__main__":
    unittest.main()
