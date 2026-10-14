import assert from "node:assert/strict";
import test from "node:test";
import { getLocalNow, isPastSlot, isWeekend, parseDateOnly } from "../lib/date";
import { ALL_SLOTS, availableSlots } from "../lib/slots";

test("o expediente tem dez horários e termina às 18h", () => {
  assert.equal(ALL_SLOTS.length, 10);
  assert.equal(ALL_SLOTS[0], "08:00");
  assert.equal(ALL_SLOTS[9], "17:00");
});

test("datas impossíveis são recusadas", () => {
  assert.throws(() => parseDateOnly("2026-02-30"));
  assert.throws(() => parseDateOnly("13/10/2026"));
});

test("sábados e domingos são identificados", () => {
  assert.equal(isWeekend(parseDateOnly("2026-10-17")), true);
  assert.equal(isWeekend(parseDateOnly("2026-10-18")), true);
  assert.equal(isWeekend(parseDateOnly("2026-10-19")), false);
});

test("horários ocupados são removidos", () => {
  const times = availableSlots("2026-11-03", ["08:00", "10:00"], () => false);
  assert.equal(times.includes("08:00"), false);
  assert.equal(times.includes("10:00"), false);
  assert.equal(times.length, 8);
});

test("fuso horário de São Paulo é usado", () => {
  assert.deepEqual(getLocalNow(new Date("2026-10-14T01:20:00.000Z")), {
    date: "2026-10-13", time: "22:20",
  });
  assert.equal(isPastSlot("2026-10-13", "22:00", new Date("2026-10-14T01:20:00.000Z")), true);
});
