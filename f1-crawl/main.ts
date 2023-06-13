import { Formula1Scraper } from "./formula1-crawl";

async function main() {
  const scraper = new Formula1Scraper();
  scraper.createTitleFile()
  await scraper.crawl('https://www.formula1.com/en/results.html/2023/races.html');
  // await scraper.scrapeYearlyDriverResult('https://www.formula1.com/en/results.html/2023/drivers.html')
  // await scraper.scrapeYearlyTeamResult('https://www.formula1.com/en/results.html/2023/team.html')
  // await scraper.scrapeYearlyAward('https://www.formula1.com/en/results.html/2023/fastest-laps.html')
  // await scraper.scrapeTeamResultByGrandPrix('https://www.formula1.com/en/results.html/1975/team/frank_williams_racing_cars.html')
}

main()