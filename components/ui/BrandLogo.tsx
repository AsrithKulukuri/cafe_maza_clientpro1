type BrandLogoProps = {
    className?: string;
};

export function BrandLogo({ className }: BrandLogoProps) {
    return (
        <div
            className={[
                "relative grid h-12 w-12 place-items-center overflow-hidden rounded-full shadow-[0_0_34px_rgba(255,166,59,0.22)]",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true" role="img">
                <defs>
                    <linearGradient id="brandLogoGold" x1="18" y1="16" x2="82" y2="84" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FFE7A3" />
                        <stop offset="0.26" stopColor="#F9C451" />
                        <stop offset="0.58" stopColor="#F2A534" />
                        <stop offset="1" stopColor="#E0781E" />
                    </linearGradient>
                    <linearGradient id="brandLogoGoldSoft" x1="26" y1="24" x2="74" y2="76" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FFF0BF" />
                        <stop offset="1" stopColor="#E59227" />
                    </linearGradient>
                    <path
                        id="brandLogoOrnament"
                        d="M50 9.2C57.8 9.2 63.8 10.8 68.6 14.2C73.1 17.3 76.4 21.7 78.5 27.2C79.4 29.7 80.1 31 81.1 31C82.8 31 84.2 28.5 84.2 25.6C84.2 21.8 81.6 17.8 76.3 13.9C79.4 15 82 16.8 84.4 19.1C87.6 22.1 89.8 25.7 90.9 30.2C91.4 32.2 92.1 33.2 93.4 33.2C94.7 33.2 95.9 32.4 96.6 31.1C95.2 37.1 91.6 41.7 86.1 45C81 48.2 74.7 49.8 67.4 49.8H32.6C25.3 49.8 19 48.2 13.9 45C8.4 41.7 4.8 37.1 3.4 31.1C4.1 32.4 5.3 33.2 6.6 33.2C7.9 33.2 8.6 32.2 9.1 30.2C10.2 25.7 12.4 22.1 15.6 19.1C18 16.8 20.6 15 23.7 13.9C18.4 17.8 15.8 21.8 15.8 25.6C15.8 28.5 17.2 31 18.9 31C19.9 31 20.6 29.7 21.5 27.2C23.6 21.7 26.9 17.3 31.4 14.2C36.2 10.8 42.2 9.2 50 9.2Z"
                    />
                </defs>
                <circle cx="50" cy="50" r="50" fill="#1C1916" />
                <circle cx="50" cy="50" r="44.5" fill="#201D19" />
                <g opacity="0.98">
                    <use href="#brandLogoOrnament" stroke="url(#brandLogoGold)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                    <use href="#brandLogoOrnament" transform="rotate(90 50 50)" stroke="url(#brandLogoGold)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                    <use href="#brandLogoOrnament" transform="rotate(180 50 50)" stroke="url(#brandLogoGold)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                    <use href="#brandLogoOrnament" transform="rotate(270 50 50)" stroke="url(#brandLogoGold)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <circle cx="50" cy="50" r="26.8" stroke="url(#brandLogoGoldSoft)" strokeWidth="2.4" />
                <circle cx="50" cy="50" r="30.8" stroke="url(#brandLogoGold)" strokeWidth="1.1" opacity="0.92" />
                <g fill="url(#brandLogoGold)">
                    <circle cx="50" cy="14.5" r="1.8" />
                    <circle cx="85.5" cy="50" r="1.8" />
                    <circle cx="50" cy="85.5" r="1.8" />
                    <circle cx="14.5" cy="50" r="1.8" />
                    <circle cx="25" cy="25" r="1.65" />
                    <circle cx="75" cy="25" r="1.65" />
                    <circle cx="75" cy="75" r="1.65" />
                    <circle cx="25" cy="75" r="1.65" />
                </g>
                <path d="M34.2 66V33.8H40.6L49.9 54.6L59.2 33.8H65.8V66H60.6V44.2L52.9 61.7H46.9L39.4 44.2V66H34.2Z" fill="url(#brandLogoGold)" />
            </svg>
        </div>
    );
}
