const express = require('express')
const app = express.Router()
require('dotenv').config()
const db = require('../mongo/CRUD')
const request = require('request-promise')



app.get('/refresh-tsheets', async (req,res) => {
    
    const fullData = []
    let page = 1;
    getTsheets()
    async function getTsheets(){
        let response = await request({
            method: 'GET',
            url: 'https://rest.tsheets.com/api/v1/timesheets',
            qs: {
                start_date: startDate(),
                end_date: endDate(),
                page: page,
              },
            headers: {
            'Authorization': 'Bearer ' + process.env.TSHEETS_TOKEN,
            }
        })
    
        response = JSON.parse(response)
    
        const timesheets = Object.entries(response['results']['timesheets']).map(sheet => {
            return sheet[1]
          })
      
        const jobCodes = Object.entries(response['supplemental_data']['jobcodes']).map(job => {
        return job[1]
        })
    
        const users = Object.entries(response['supplemental_data']['users']).map(user => {
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
            time['duration(s)'] = timesheet['duration']
            time['localDate'] = timesheet['start'].split('T')[0]
            

            //User
            const user = users.find(user => {
                return user['id'] == timesheet['user_id']
            })

            time['user'] = user['first_name'] + " " + user['last_name']
            time['payroll_id'] = user['payroll_id']


            return time
          })


        data.forEach(sheet => {
            fullData.push(sheet)
        })

        
        
        if (timesheets.length == 50){
            page ++;
            getTsheets()
        } else {
            res.send(fullData)
        }
        

    }
    


    
    
})

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


module.exports = app
