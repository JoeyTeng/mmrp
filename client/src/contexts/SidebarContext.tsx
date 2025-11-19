// Copyright 2025 Cisco Systems, Inc. and its affiliates
//
// SPDX-License-Identifier: Apache-2.0

import { createContext } from "react";

type SidebarContextValue = {
  leftOpenPanelId: string | null;
  setLeftOpenPanelId: (id: string | null) => void;
};

export const SidebarContext = createContext<SidebarContextValue | null>(null);
