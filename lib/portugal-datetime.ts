export function portugalLocalToUtc(value: string): Date {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  );

  if (!match) {
    throw new Error("Data/hora inválida.");
  }

  const [, y, m, d, h, min] = match.map(Number);

  const candidate = new Date(
    Date.UTC(y, m - 1, d, h, min)
  );

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(candidate)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );

  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute
  );

  const offset = representedAsUtc - candidate.getTime();

  const result = new Date(candidate.getTime() - offset);

  const check = Object.fromEntries(
    formatter
      .formatToParts(result)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );

  if (
    check.year !== y ||
    check.month !== m ||
    check.day !== d ||
    check.hour !== h ||
    check.minute !== min
  ) {
    throw new Error(
      "Esta hora não existe em Portugal devido à mudança da hora."
    );
  }

  return result;
}
