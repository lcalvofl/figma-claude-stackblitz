import { useState } from "react";
import DatePicker from "./DatePicker.jsx";

export default function App() {
  const [picked, setPicked] = useState<Date | null>(null);

  return (
    <div style={{ padding: "48px" }}>
      <DatePicker label="Date of birth" id="dob" onChange={setPicked} />

      {picked && (
        <p style={{ marginTop: "24px" }}>
          Selected:{" "}
          {picked.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}
    </div>
  );
}