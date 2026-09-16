import React from 'react';

/**
 * Produit Academy Official Brand Logo Component
 * Renders the emerald green circle with precision fountain pen nib.
 * Vector-sharp SVG ensures zero network latency and eliminates broken-image / letter 'P' fallbacks.
 */
export default function Logo({ size = 32, className = '', style = {}, rounded = true }) {
    const radius = rounded ? '50%' : '8px';

    return (
        <div
            className={`produit-logo ${className}`}
            style={{
                width: size,
                height: size,
                minWidth: size,
                minHeight: size,
                borderRadius: radius,
                overflow: 'hidden',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                ...style,
            }}
            title="Produit Academy"
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: '100%', height: '100%', display: 'block' }}
            >
                {/* Emerald Green Circular Background */}
                <circle cx="50" cy="50" r="50" fill="#33ae78" />

                {/* Left Half of Pen Nib (Light Silver) */}
                <path
                    d="M50 0L24 47C24 47 34 68 34 100H50V0Z"
                    fill="#e6e6e6"
                />

                {/* Right Half of Pen Nib (Subtle Shadow Silver) */}
                <path
                    d="M50 0L76 47C76 47 66 68 66 100H50V0Z"
                    fill="#cccccc"
                />

                {/* Center Breather Hole and Slit */}
                <circle cx="50" cy="49" r="6" fill="#212121" />
                <rect x="48.5" y="0" width="3" height="49" fill="#212121" />
            </svg>
        </div>
    );
}
