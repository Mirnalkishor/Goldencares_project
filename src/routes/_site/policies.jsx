import { createFileRoute } from "@tanstack/react-router";
import PageHero from "@/components/site/PageHero";
import { CONTACT } from "@/lib/site";

export const Route = createFileRoute("/_site/policies")({
  head: () => ({
    meta: [
      { title: "Policies, Privacy & Terms | GoldenCares" },
      {
        name: "description",
        content:
          "Privacy, terms, data, refund, shipping and account deletion policies for GoldenCares senior companionship services in the Tricity.",
      },
    ],
  }),
  component: PoliciesPage,
});

const sections = [
  {
    id: "privacy",
    title: "Privacy Policy",
    body: [
      "We collect only what is needed to arrange a companion visit: the name and contact details of the person booking, the senior's city and area, the service requested, and any notes you choose to share.",
      "Your details are used to contact you about your request, to brief the assigned companion, and to keep a record of the visit. If you choose to pay online, your name, email, phone number and payment amount are sent to Razorpay to process the transaction. We do not sell personal data or share it for third-party marketing.",
      `You may ask us to correct or delete your information at any time by writing to ${CONTACT.email}.`,
    ],
  },
  {
    id: "terms",
    title: "Terms and Conditions",
    body: [
      "GoldenCares provides companionship and assistance services only. We do not offer overnight care, medical or nursing services, or clinical treatment. Our Doctor Visit service is accompaniment to appointments only. For medical needs, please consult healthcare professionals.",
      "A booking request is not a confirmed appointment. The quoted visit price depends on the service and duration and is shown before you submit. You may pay that quote online through Razorpay; the companion, date and time are still confirmed with you by our team.",
      "Companions are guests in the senior's home. Any behaviour that is unsafe, abusive or unlawful ends the visit immediately, and further bookings may be declined.",
    ],
  },
  {
    id: "data",
    title: "Data Collection",
    body: [
      "Details you submit through this website are stored in our booking system, which our team uses to arrange and confirm visits.",
      "If you create an account, you can sign in to review the visits you requested. Your account is protected by a password, and you can request deletion at any time.",
      "Visits you submit while signed in are visible to you and to GoldenCares administrators. Other families cannot see your requests.",
    ],
  },
  {
    id: "refunds",
    title: "Refund Policy",
    body: [
      "If you choose to pay online, payments are processed by Razorpay. For a cancelled visit, contact us at the email below with your booking details so we can review and arrange any applicable refund.",
      "If a visit does not take place for a reason on our side, we will reschedule it or refund any amount paid for that visit.",
      "If you cancel with reasonable notice, any amount paid for the cancelled visit is refunded. Write to us and we will confirm the outcome in writing.",
    ],
  },
  {
    id: "shipping",
    title: "Shipping Policy",
    body: [
      "GoldenCares is a companionship service. We do not sell or ship physical goods, so no shipping charges apply.",
      "Visits are delivered in person by a companion at the address you share with us.",
    ],
  },
  {
    id: "account-deletion",
    title: "Account Deletion",
    body: [
      `To delete your GoldenCares account and the personal details attached to it, email ${CONTACT.email} with the subject "Account deletion" from the email address you registered with.`,
      "We will confirm the deletion in writing, usually within seven working days. Visit records we must retain for legal or accounting reasons may be kept in a restricted form.",
    ],
  },
];

function PoliciesPage() {
  return (
    <>
      <PageHero
        eyebrow="Policies"
        title="Clear terms, plainly written."
        intro="How we handle your information, what a booking means, and how to reach us about any of it."
      />

      <section className="container-page py-14 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.3fr_0.7fr] lg:items-start">
          <nav aria-label="Policy sections" className="flex flex-wrap gap-2 lg:sticky lg:top-32 lg:flex-col lg:items-start">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border border-border bg-card px-4 py-2 text-[0.82rem] font-medium text-foreground/75 transition-colors hover:border-primary/40 hover:text-primary"
              >
                {section.title}
              </a>
            ))}
          </nav>

          <div className="space-y-12">
            {sections.map((section) => (
              <article key={section.id} id={section.id} className="scroll-mt-32">
                <h2 className="font-heading text-[1.8rem] leading-tight text-foreground">{section.title}</h2>
                <div className="mt-4 space-y-3.5 text-[0.97rem] leading-relaxed text-muted-foreground">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}

            <p className="border-t border-border pt-6 text-[0.85rem] text-muted-foreground">
              Last updated November 2026. Questions? Write to{" "}
              <a href={`mailto:${CONTACT.email}`} className="font-semibold text-primary">
                {CONTACT.email}
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
