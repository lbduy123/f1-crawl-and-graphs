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
    let response
    try {
      response = await axios.get(url)
    } catch (err) {
      console.log(`Error while trying to connect to ${url}`)
      const jsonString = fs.readFileSync(scraper.titleFilePath, "utf8")
      const titles = JSON.parse(jsonString);
      titles.fails.push(url)
      fs.writeFileSync(scraper.titleFilePath, JSON.stringify(titles, null, 2), 'utf8')
      return
    }
    await scraper.scrapeResultByGrandPrix(url)
  } else if (url.includes('/races.html')) {
    await scraper.scrapeYearlyRaceResult(url)
  }
})