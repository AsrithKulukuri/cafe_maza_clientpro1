"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { revealUp } from "@/lib/motionPresets";

type SectionRevealProps = {
    children: ReactNode;
    className?: string;
};

export function SectionReveal({ children, className }: SectionRevealProps) {
    return (
        <motion.section
            className={className}
            variants={revealUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
        >
            {children}
        </motion.section>
    );
}
