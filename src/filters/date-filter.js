import dayjs from "dayjs";

export default (date) => {
  return `${dayjs(date, "YYYY-MM-DD").format("D MMMM YYYY")}`;
};
