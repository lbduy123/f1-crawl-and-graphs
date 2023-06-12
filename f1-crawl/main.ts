import { Formula1Scraper } from "./formula1-crawl";

async function main() {
  const scraper = new Formula1Scraper();
  scraper.createTitleFile()
  await scraper.crawl('https://www.formula1.com/en/results.html/2023/races.html');
}

main()