const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();

async function run() {

    // How to use this scraper!
    // Step 1: Make sure to have Node.js installed on your computer
    // Step 2: Install the following packages by running the following commands in your terminal: npm install puppeteer fs
    // Step 3: Copy and paste this entire script into a new file called main.js
    // Step 4: Update the baseUrl, csvUrl, email, and password variables with your own information
    // Step 5: Run the script by running the following command in your terminal: node main.js
    // Step 6: Sit back and relax as the scraper does the hard work for you!

    const baseUrl = 'https://app.apollo.io/#/people?page=1&tour=true&sortAscending=false&personLocations[]=Montreal%2C%20Canada&sortByField=organization_estimated_number_employees&personTitles[]=owner&personTitles[]=founder&personTitles[]=founder%20and%20ceo&personTitles[]=director&personTitles[]=hr%20manager&personTitles[]=talent%20acquisition%20specialist&personSeniorities[]=owner&personSeniorities[]=founder&personSeniorities[]=c_suite&personSeniorities[]=director&personSeniorities[]=manager&organizationNumEmployeesRanges[]=51%2C100&organizationNumEmployeesRanges[]=101%2C200&organizationNumEmployeesRanges[]=201%2C500&organizationNumEmployeesRanges[]=501%2C1000&organizationNumEmployeesRanges[]=1001%2C2000&organizationNumEmployeesRanges[]=2001%2C5000&organizationNumEmployeesRanges[]=5001%2C10000&organizationNumEmployeesRanges[]=10001&organizationNumEmployeesRanges[]=21%2C50&includedOrganizationKeywordFields[]=tags&includedOrganizationKeywordFields[]=name&organizationIndustryTagIds[]=5567ce2673696453d95c0000';
    const csvUrl = 'output.csv';
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;

    // Start the Puppeteer browser
    console.time("ScriptRunTime");
    const browser = await puppeteer.launch({
        headless: false, // Set to true to run headless
        defaultViewport: null
    });

    const page = await browser.newPage();
    // Set custom User-Agent
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0");

    await page.goto('https://app.apollo.io/#/login');
    await page.waitForSelector('input[name="email"]', { visible: true });
    await page.waitForSelector('input[name="password"]', { visible: true });
    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await page.goto(baseUrl);
    await new Promise(resolve => setTimeout(resolve, 10000));
    const totalText = await page.evaluate(() => {
        const targetElement = document.querySelector('.zp_nashx .zp_Hypuh .zp_tZMYK .zp_mE7no');
        return targetElement ? targetElement.textContent.trim() : null;
    });
    
    let totalItems = 0;
    if (totalText) {
        const totalItemsMatch = totalText.match(/\d+/);
        if (totalItemsMatch) {
            totalItems = parseInt(totalItemsMatch[0], 10);
            console.log(`Total items: ${totalItems}`);
        }
    }
    if (totalItems > 0) {
        const itemsPerPage = 25;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        console.log(`Total pages: ${totalPages}`);
        let allData = [];
        for (let i = 1; i <= totalPages; i++) {
            const pageUrl = `${baseUrl}&page=${i}`;
            await page.goto(pageUrl);
            await page.waitForSelector('.zp_tFLCQ', { visible: true });

            const data = await page.$$eval('.zp_tFLCQ', tbodies => tbodies.map(tbody => {
                const trs = tbody.querySelectorAll('div[role=row]');
                let arrayData = []
                for (let index = 0; index < trs.length; index++) {
                    const tr = trs[index];
                    const tdName = tr ? tr.querySelector('div[role=gridcell] .zp_TPCm2 a') : null;
                    tdName.style.border = '1px solid green';
                    let name = tdName ? tdName.innerText.trim() : null;
                    name = name.replace("------", "").trim();
                    
                    let parts = name.split(' ');
                    let firstName = parts.shift();
                    let lastName = parts.join(' '); 
            
                    const quote = (str) => `"${str.replace(/"/g, '""')}"`;

                    firstName = quote(firstName);
                    lastName = quote(lastName);
                    const fullName = quote(name); 
                    
                    const tdJobTitle = tr ? tr.querySelector('div[role=gridcell]:nth-child(2) .zp_xvo3G') : null;
                    let jobTitle = tdJobTitle ? tdJobTitle.innerText.trim() : '';
                    jobTitle = quote(jobTitle);
                    const tdCompanyName = tr ? tr.querySelector('div[role=gridcell]:nth-child(2) .zp_xvo3G') : null;
                    let companyName = tdCompanyName ? tdCompanyName.innerText.trim() : '';
                    companyName = quote(companyName);
            
                    const tdLocation = tr ? tr.querySelector('div[role=gridcell]:nth-child(8) .zp_xvo3G') : null;
                    let location = tdLocation ? tdLocation.innerText.trim() : '';
                    location = quote(location);
            
                    const tdEmployeeCount = tr ? tr.querySelector('div[role=gridcell]:nth-child(9) .zp_xvo3G') : null;
                    let employeeCount = tdEmployeeCount ? tdEmployeeCount.innerText.trim() : '';
                    employeeCount = quote(employeeCount);
            
                    const tdIndustry = tr ? tr.querySelector('div[role=gridcell]:nth-child(10) .zp_xvo3G') : null;
                    let industry = tdIndustry ? tdIndustry.innerText.trim() : '';
                    industry = quote(industry);
            
                    const tdKeywords = tr ? tr.querySelector('div[role=gridcell]:nth-child(11) .zp_xvo3G') : null;
                    let keywords = tdKeywords ? tdKeywords.innerText.trim() : '';
                    keywords = quote(keywords);
            
                    let facebookUrl = '', twitterUrl = '', companyLinkedinUrl = '', companyUrl = '';
                    const tdCompanyNameTDiv = tr ? tr.querySelector('div[role=gridcell]:nth-child(2)') : null;
                    if (tdCompanyNameTDiv) {
                        const links = tdCompanyNameTDiv.querySelectorAll('a[href]');
                        links.forEach(link => {
                            const href = link.href.trim();
                            if (href.includes('facebook.com')) facebookUrl = quote(href);
                            if (href.includes('twitter.com')) twitterUrl = quote(href);
                            else if (href.includes('linkedin.com/company')) companyLinkedinUrl = quote(href);
                            else if (link.querySelector('.apollo-icon-link')) companyUrl = quote(href);
                        });
                    }
            
                    const firstHref = tbody.querySelector('a[href]') ? tbody.querySelector('a[href]').href : '';
                    const linkedinUrl = tdName && tdName.querySelector('a[href*="linkedin.com/in"]') ? tdName.querySelector('a[href*="linkedin.com/in"]').href : '';
                    
                    arrayData.push({
                        firstName: firstName, 
                        lastName: lastName, 
                        fullName: fullName,
                        jobTitle: jobTitle, 
                        companyName: companyName, 
                        location: location,
                        employeeCount: employeeCount, 
                        industry: industry, 
                        firstHref: quote(firstHref), 
                        linkedinUrl: quote(linkedinUrl),
                        facebookUrl: facebookUrl, 
                        twitterUrl: twitterUrl, 
                        companyLinkedinUrl: companyLinkedinUrl, 
                        companyUrl: companyUrl,
                        keywords: keywords,
                    });
                }
                return arrayData;
            }));
            allData = allData.concat(data);
        }

        const csvHeader = "First Name,Last Name,Full Name,Job Title,Company Name,Location,Employee Count,Industry,LinkedIn URL,Keywords\n";
        const csvRows = allData.map(person => {
            return `${person.firstName},${person.lastName},${person.fullName},${person.jobTitle},${person.companyName},${person.location},${person.employeeCount},${person.industry},${person.linkedinUrl},${person.keywords}`;
        }).join('\n');

        // Create and write into CSV file
        fs.writeFileSync(csvUrl, csvHeader + csvRows, 'utf8');
        console.log('Data has been saved to the CSV file.');
    }

    await browser.close();
    console.timeEnd("ScriptRunTime");
}

run().catch(error => console.error('Error during script execution', error));

