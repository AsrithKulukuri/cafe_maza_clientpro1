import type { Variants } from "framer-motion";

export const revealUp: Variants = {
    hidden: { opacity: 0, y: 34, scale: 0.985 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
    },
};

export const staggerChildren: Variants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.05,
        },
    },
};

export const cardHover = {
    whileHover: { y: -6, scale: 1.01 },
    transition: { duration: 0.24, ease: "easeOut" },
};
