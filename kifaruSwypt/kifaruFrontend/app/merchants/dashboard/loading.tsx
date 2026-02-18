"use client";

import React from "react";
import { Spin } from "antd";

export default function Loading() {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                minHeight: "300px",
                width: "100%",
            }}
        >
            <Spin size="large" tip="Loading..." />
        </div>
    );
}
