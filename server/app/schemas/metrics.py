# Copyright 2025 Cisco Systems, Inc. and its affiliates
#
# SPDX-License-Identifier: Apache-2.0

from pydantic import BaseModel


class Metrics(BaseModel):
    message: str | None
    psnr: float | None
    ssim: float | None
