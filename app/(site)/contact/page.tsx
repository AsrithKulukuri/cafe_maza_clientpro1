export default function ContactPage() {
    return (
        <div className="mx-auto grid max-w-6xl gap-8 px-6 pb-20 md:grid-cols-2 md:px-10">
            <section className="glass-card rounded-2xl border border-[#CFAF63]/20 p-7">
                <p className="text-sm uppercase tracking-[0.2em] text-[#CFAF63]">Contact</p>
                <h1 className="mt-2 font-[var(--font-heading)] text-4xl text-[#F5F5F5]">Visit Cafe Maza</h1>
                <div className="mt-6 space-y-3 text-[#F5F5F5]/80">
                    <p>Address: Road 12, Banjara Hills, Hyderabad</p>
                    <p>Phone: +91 90000 12345</p>
                    <p>Opening Hours: 12:00 PM - 11:30 PM</p>
                </div>
            </section>
            <section className="overflow-hidden rounded-2xl border border-[#CFAF63]/20">
                <iframe
                    title="Cafe Maza Location"
                    src="https://www.google.com/maps?q=Banjara+Hills,+Hyderabad&output=embed"
                    className="h-[420px] w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            </section>
        </div>
    );
}
