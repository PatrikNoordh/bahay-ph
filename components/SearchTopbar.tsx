"use client";

import { useState } from "react";
import { Topbar } from "@/components/Topbar";
import { SettingsSheet } from "@/components/SettingsSheet";

export function SearchTopbar() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <Topbar
        actions={[
          {
            icon: "⚙️",
            label: "Settings",
            onClick: () => setSettingsOpen(true),
          },
        ]}
      />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
