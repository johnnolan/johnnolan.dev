import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);

function editorialDate(value) {
  if (value === undefined || value === null || value === "") return undefined;

  const date = dayjs.utc(value);
  if (!date.isValid()) throw new TypeError(`Invalid editorial date: ${value}`);
  return date;
}

export function displayDate(value) {
  return editorialDate(value)?.format("D MMMM YYYY") ?? "";
}

export function isoDate(value) {
  return editorialDate(value)?.format("YYYY-MM-DD") ?? "";
}
