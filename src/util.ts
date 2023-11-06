import { HTMLElement } from "node-html-parser";

export const getAvailableOptionsBasedOnDom = (dom: HTMLElement): string[] =>
  [...dom.querySelectorAll(".nf-route:not(.is-disabled)")].map(
    (route) =>
      (route.querySelector(".nf-route__time") as unknown as HTMLElement)
        .innerText
  );

export const isCorrectDate = (date: string): boolean =>
  /^(19|20)\d\d-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/.test(date);
