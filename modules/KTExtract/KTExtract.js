const express = require('express')
const app = express.Router()
const request = require('request-promise')
require("dotenv").config();


app.use(require('../web/navigation'))


app.get('/tableau-connect', async function (req, res) {

  function startDate() {
    let today = new Date();
    today.setDate(today.getDate() - 1);
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = today.getFullYear();

    today = yyyy + '-' + mm + '-' + dd;
    return today
  }

  function endDate() {
    let today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = today.getFullYear();

    today = yyyy + '-' + mm + '-' + dd;
    return today
  }

  // //TSHEETS Get

  const fullData = []
  let page = 1;


  getTsheets()
  async function getTsheets() {
    const tSheetsResponse = JSON.parse(await request({
      method: 'GET',
      url: 'https://rest.tsheets.com/api/v1/timesheets',
      qs: {
        start_date: startDate(),
        end_date: endDate(),
        page: page,
        per_page: 50,
      },
      headers: {
        'Authorization': 'Bearer ' + process.env.TSHEETS_TOKEN,
      }
    }))


    const timesheets = Object.entries(tSheetsResponse['results']['timesheets']).map(sheet => {
      return sheet[1]
    })

    const jobCodes = Object.entries(tSheetsResponse['supplemental_data']['jobcodes']).map(job => {
      return job[1]
    })

    const users = Object.entries(tSheetsResponse['supplemental_data']['users']).map(user => {
      return user[1]
    })



    const data = timesheets.map(timesheet => {
      const time = {}

      //Job Title
      jobCodes.find(job => {
        if (job['id'] == timesheet['jobcode_id']) {

          time['jobTitle'] = job['name']

          //Client Name
          jobCodes.find(company => {
            if (company['id'] == job['parent_id']) {
              time['clientName'] = company['name']
            }
          })
        }
      })

      //Duration
      time['duration'] = timesheet['duration']
      time['start'] = timesheet['start']
      time['end'] = timesheet['end']

      return time
    })

    //WorkType 
    // const urls = []

    // data.forEach(time => {
    //   const req = {
    //     method: 'GET',
    //     url: `https://api.karbonhq.com/v3/WorkItems`,
    //     headers: {
    //       'AccessKey': process.env.KARBON_API,
    //       'Authorization': 'Bearer ' + process.env.KARBON_SECRET
    //     },
    //   }
    //   urls.push(req)
    // })


    // const arrayOfPromises = urls.map((url) => request(url));
    // Promise.all(arrayOfPromises)
    //   .then((response) => response.forEach(resp => {
    //     console.log(JSON.parse(resp))
    //   })).catch(err => {
    //     console.log('oops')
    //   })


    //   const csv = arrayToCSV(data)

    //   function arrayToCSV(objArray) {
    //     const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    //     let str = `${Object.keys(array[0]).map(value => `"${value}"`).join(",")}` + '\r\n';

    //     return array.reduce((str, next) => {
    //         str += `${Object.values(next).map(value => `"${value}"`).join(",")}` + '\r\n';
    //         return str;
    //        }, str);
    // }

    data.forEach(time => {
      fullData.push(time)
    })
    page++;

    if (data.length < 50) {
      res.send(fullData)
    } else {
      console.log(page)
      console.log(data.length)
      getTsheets()
    }


  }


})


app.post('/update-karbon', (req,res) => {
  
  const workFlow = []

  workFlow.forEach( flow => {
   
    const rqst = {
      method: 'PATCH',
      url: `https://api.karbonhq.com/v3/WorkItems/$filter=Key eq '{key}'`,
      headers: {
        'AccessKey': process.env.KARBON_API,
        'Authorization': 'Bearer ' + process.env.KARBON_SECRET
      },
      body: {
        title: flow['WorkTitle'],
        workType: flow['WorkType'],
        estimatedBudget: flow['Budget'],
      }
    }
  
    request(rqst)
  })

  

})

module.exports = app