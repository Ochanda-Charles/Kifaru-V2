"use client";

import React from "react";
import NextTopLoader from "nextjs-toploader";

const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <NextTopLoader
                color="#16a34a"
                initialPosition={0.08}
                crawlSpeed={200}
                height={3}
                crawl={true}
                showSpinner={false}
                easing="ease"
                speed={200}
                shadow="0 0 10px #2299DD,0 0 5px #2299DD"
                zIndex={1600}
            />
            {children}
        </>
    );
};

export default Providers;
