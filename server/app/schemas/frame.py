# Copyright 2025 Cisco Systems, Inc. and its affiliates
#
# SPDX-License-Identifier: Apache-2.0

from pydantic import BaseModel
from app.schemas.metrics import Metrics


class FrameData(BaseModel):
    fps: float
    mime: str
    metrics: Metrics
