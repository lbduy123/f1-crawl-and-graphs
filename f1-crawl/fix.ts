import fs from 'fs';
import { Formula1Scraper } from './formula1-crawl';
import axios from 'axios';

const scraper = new Formula1Scraper()
const jsonString = fs.readFileSync(scraper.titleFilePath, "utf8")
const titles = JSON.parse(jsonString);
if (titles.fails.length === 0) {
  console.log('No missing url found')
  process.exit(1)
}
const failUrls: string[] = [...titles.fails]

titles.fails = []
fs.writeFileSync(scraper.titleFilePath, JSON.stringify(titles, null, 2), 'utf8')

failUrls.map(async (url) => {
  if (url.includes('/race-result.html')) {
    await scraper.scrapeRaceResultByGrandPrix(url)
  } else if (url.includes('/races.html')) {
    await scraper.scrapeYearlyRaceResult(url)
  } else if (url.includes('/drivers.html')) {
    await scraper.scrapeYearlyDriverResult(url)
  } else if (url.includes('/drivers/')) {
    await scraper.scrapeDriverResultByGrandPrix(url)
  } else if (url.includes('/team.html')) {
    await scraper.scrapeYearlyTeamResult(url)
  } else if (url.includes('/team/')) {
    await scraper.scrapeTeamResultByGrandPrix(url)
  } else if (url.includes('/fastest-laps.html')) {
    await scraper.scrapeYearlyAward(url)
  }
})