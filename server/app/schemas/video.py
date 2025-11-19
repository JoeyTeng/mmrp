# Copyright 2025 Cisco Systems, Inc. and its affiliates
#
# SPDX-License-Identifier: Apache-2.0

from pydantic import BaseModel


class VideoRequest(BaseModel):
    video_name: str
    output: bool
