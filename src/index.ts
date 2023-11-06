import { CronJob } from "cron";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { diff } from "fast-array-diff";

import { getAvailableOptionsBasedOnDom, isCorrectDate } from "./util.js";
import { getSiteHtml } from "./service.js";

const DATE_FORMAT = "yyyy-mm-dd";
const TELEGRAM_BOT_TOKEN = process.env["TELEGRAM_BOT_TOKEN"];

if (!TELEGRAM_BOT_TOKEN) {
  process.exit(1);
}

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

type WorkingMap = Map<
  number,
  {
    date: string;
    job: CronJob;
  }
>;

const WORKING_MAP: WorkingMap = new Map();

const cleanupJobs = (map: WorkingMap) => {
  for (const [, { job }] of map) {
    job.stop();
  }
};

const prepareCronJob = (chatId: number, date: string): CronJob => {
  let prevOptions: string[] = [];

  return new CronJob(
    "*/20 * * * * *",
    () =>
      getSiteHtml("oshmyany", "minsk", date)
        .then(getAvailableOptionsBasedOnDom)
        .then((options) => {
          let resultMessage = "";

          const { added, removed } = diff(prevOptions, options);

          if (added.length) {
            resultMessage += `New options: ${added.join(", ")} \n`;
          }

          if (removed.length) {
            resultMessage += `Removed options: ${removed.join(", ")}`;
          }

          if (resultMessage) {
            bot.telegram.sendMessage(chatId, resultMessage);
          }

          prevOptions = options;
        }),
    null
  );
};

// BOT FLOW //////////////////////////////////

bot.start((ctx) => {
  ctx.reply(
    `Hello, I am your assistant... Tired of this crap though...\nAlright, so, type the date in ${DATE_FORMAT} format and I will message you.`
  );
});

bot.command("stop", (ctx) => {
  const info = WORKING_MAP.get(ctx.chat.id);

  if (info) {
    info.job.stop();
    WORKING_MAP.delete(ctx.chat.id);
    ctx.reply("Cleaned up, all good.");
  }
});

bot.on(message("text"), (ctx) => {
  const date = ctx.message.text;
  const chatId = ctx.chat.id;

  if (isCorrectDate(date)) {
    const job = prepareCronJob(chatId, date);

    WORKING_MAP.set(chatId, {
      date,
      job,
    });

    ctx.reply(
      `Good, I will message if something comes up.\nDon't forget to stop me with /stop.`
    );
    job.start();
  } else {
    ctx.reply(
      `Don't full around with me, son. I know where you live.\nI said ${DATE_FORMAT} format.`
    );
  }
});

// //////////////////////////////////////////
bot.launch();

// Enable graceful stop
process.once("SIGINT", () => {
  bot.stop("SIGINT");
  cleanupJobs(WORKING_MAP);
});
process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
  cleanupJobs(WORKING_MAP);
});
