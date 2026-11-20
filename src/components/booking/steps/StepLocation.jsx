import ChoiceCard from "../ChoiceCard";
import { CITIES } from "@/lib/site";

const CITY_NOTES = {
  Chandigarh: "Sectors across the city, including southern sectors.",
  Mohali: "Phases, sectors and nearby localities.",
  Panchkula: "Sectors and adjoining areas.",
};

export default function StepLocation({ form, setField }) {
  return (
    <div>
      <h2 className="font-heading text-[1.6rem] leading-tight text-foreground sm:text-[1.9rem]">
        Where should the companion come?
      </h2>
      <p className="mt-2 text-[0.95rem] text-muted-foreground">
        We match companions by locality, so this also helps us choose the right person.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {CITIES.map((city) => (
          <ChoiceCard
            key={city}
            selected={form.city === city}
            onClick={() => setField("city", city)}
            title={city}
            description={CITY_NOTES[city]}
          />
        ))}
      </div>

      <div className="mt-6">
        <label htmlFor="address" className="label-strong">
          Area or address <span className="font-normal text-muted-foreground">(optional, but helpful)</span>
        </label>
        <input
          id="address"
          value={form.address}
          onChange={(event) => setField("address", event.target.value)}
          placeholder="Sector 21, near the market — or the full address"
          className="field"
          autoComplete="street-address"
        />
        <p className="mt-2 text-[0.8rem] text-muted-foreground">
          We share the exact address with the companion only after you confirm the visit.
        </p>
      </div>
    </div>
  );
}
