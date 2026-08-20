import React from 'react';

export const GridPattern: React.FC<{ className?: string }> = ({ className = '' }) => <div aria-hidden="true" className={`pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)] [background-size:32px_32px] ${className}`} />;
export const DotPattern: React.FC<{ className?: string }> = ({ className = '' }) => <div aria-hidden="true" className={`pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(#000_1px,transparent_1px)] [background-size:18px_18px] ${className}`} />;
