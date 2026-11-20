import ChoiceCard from "../ChoiceCard";

const RELATIONSHIPS = ["Daughter", "Son", "Spouse", "I'm the senior", "Another relative or friend"];
const LANGUAGES = ["Hindi", "Punjabi", "English"];
const CONTACT_METHODS = [
  { value: "Phone call", title: "Phone call", description: "We call you to confirm the details." },
  { value: "WhatsApp", title: "WhatsApp", description: "A message first, then a call if needed." },
  { value: "Email", title: "Email", description: "We write, and call only if you ask us to." },
];

export default function StepContact({ form, setField }) {
  return (
    <div>
      <h2 className="font-heading text-[1.6rem] leading-tight text-foreground sm:text-[1.9rem]">
        How do we reach you?
      </h2>
      <p className="mt-2 text-[0.95rem] text-muted-foreground">
        We use your phone to confirm the visit and your email for the payment receipt. Your details are shared
        with PayU only if you choose to pay online.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className="label-strong">Your name</label>
          <input
            id="full_name"
            value={form.full_name}
            onChange={(event) => setField("full_name", event.target.value)}
            className="field"
            autoComplete="name"
            placeholder="Full name"
          />
        </div>
        <div>
          <label htmlFor="phone" className="label-strong">Phone number</label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(event) => setField("phone", event.target.value)}
            className="field"
            autoComplete="tel"
            placeholder="We will call this number"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="label-strong">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => setField("email", event.target.value)}
            className="field"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label htmlFor="relationship" className="label-strong">You are the senior's…</label>
          <select
            id="relationship"
            value={form.relationship}
            onChange={(event) => setField("relationship", event.target.value)}
            className="field"
          >
            <option value="">Prefer not to say</option>
            {RELATIONSHIPS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        <span className="label-strong">Language your parent prefers</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {LANGUAGES.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => setField("language_preference", form.language_preference === language ? "" : language)}
              aria-pressed={form.language_preference === language}
              className={`rounded-full border px-4 py-2 text-[0.85rem] font-medium transition-colors ${
                form.language_preference === language
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground/75 hover:border-primary/40"
              }`}
            >
              {language}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <span className="label-strong">Best way to reach you</span>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {CONTACT_METHODS.map((method) => (
            <ChoiceCard
              key={method.value}
              selected={form.preferred_contact === method.value}
              onClick={() => setField("preferred_contact", method.value)}
              title={method.title}
              description={method.description}
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="notes" className="label-strong">
          Anything we should know? <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(event) => setField("notes", event.target.value)}
          placeholder="Mobility, hearing, what they enjoy, gate details, anything that helps."
          className="field-area"
        />
      </div>
    </div>
  );
}
