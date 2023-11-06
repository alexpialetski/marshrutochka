import fetch from "node-fetch";
import { HTMLElement, parse } from "node-html-parser";

type City = "oshmyany" | "minsk";

const CITY_ID_MAP: Record<City, number> = {
  oshmyany: 24,
  minsk: 5,
};

export const getSiteHtml = (
  from: City,
  to: City,
  date: string
): Promise<HTMLElement> =>
  fetch(
    `https://xn--90aiim0b.xn--80aa3agllaqi6bg.xn--90ais/schedules?station_from_id=0&station_to_id=0&frame_id=&city_from_id=${CITY_ID_MAP[from]}&places=1&city_to_id=${CITY_ID_MAP[to]}&date=${date}`
  )
    .then((res) => res.json())
    .then((res) => parse((res as any).html));
