"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ReactNode } from "react";

type LuxuryButtonProps = {
    href?: string;
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    type?: "button" | "submit";
};

export function LuxuryButton({ href, children, className = "", onClick, type = "button" }: LuxuryButtonProps) {
    const classes = `luxury-button ${className}`;

    if (href) {
        return (
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link href={href} className={classes}>
                    {children}
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className={classes} onClick={onClick} type={type}>
            {children}
        </motion.button>
    );
}
