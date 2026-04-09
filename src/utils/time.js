const parseTimeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map((v) => Number(v));
  return h * 60 + m;
};

const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const addMinutes = (timeStr, minutes) => minutesToTime(parseTimeToMinutes(timeStr) + minutes);

const isOverlap = (startA, endA, startB, endB) => {
  const a1 = parseTimeToMinutes(startA);
  const a2 = parseTimeToMinutes(endA);
  const b1 = parseTimeToMinutes(startB);
  const b2 = parseTimeToMinutes(endB);
  return a1 < b2 && b1 < a2;
};

module.exports = { parseTimeToMinutes, minutesToTime, addMinutes, isOverlap };
