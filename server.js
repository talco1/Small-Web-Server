import fetch from 'node-fetch'
import express, { response } from 'express'

const app = express()

const port = 8080

var cases_api = "https://covid-api.mmediagroup.fr/v1/cases?country="
var history_api = "https://covid-api.mmediagroup.fr/v1/history?country="

app.get('/', (req, res) => {
    res.send('Welcome to daily COVID-19 confirmed cases server!' +
        '<br/> Enter /COUNTRY/DATE to get information about daily new confirmed cases in the given country' +
        '<br/> Enter /SOURCE_CONTRY/TARGET_COUNTRY/FROM_DATE/TO_DATE", to get the daily difference between the percentages of the population confirmed cases.')
})

app.get('/:country/:date', async (req, res) => {
    try { //try-catch block to handle an error in the asynchronous function
        //convert first letter to upper case
        var country_name = req.params.country[0].toUpperCase() + req.params.country.slice(1)
        //save cases and history paths
        var cases = cases_api + country_name
        var history = history_api + country_name + "&status=Confirmed"
        //reverse date
        var input_date = reverseDate(req.params.date)
        //save the data of history route
        var dates = await getHistory(history)
        var keys = Object.keys(dates)

        var response = "Querying about " + country_name + " " + req.params.date +
            "<br/> Data:<br/>" + country_name + ", confirmed case " + req.params.date + ": "
        //check if the input date is today's date
        if (compareDates(input_date, keys[0])) {
            var confirmed1 = (await getCases(cases))['confirmed']
            var confirmed2 = dates[keys[0]]
            response += confirmed1 + "," + reverseDate(keys[0]) + ": " + confirmed2
        } else {
            var confirmed1 = dates[input_date]
            response += confirmed1
            //find the previous day index in the keys list
            var prevDateIdx = keys.indexOf(input_date) + 1
            var confirmed2 = 0
            //check if the previous day exists in the history
            if (prevDateIdx < keys.length) {
                confirmed2 = dates[keys[prevDateIdx]]
                response += "," + reverseDate(keys[prevDateIdx]) + ": " + confirmed2
            }
        }
        var result = parseInt(confirmed1) - parseInt(confirmed2)
        if (result < 0)
            result = 0
        res.send(response + "<br/>Result: " + result.toString())
    } catch (e) {
        res.send(e)
    }
})

app.get('/:sourceCountry/:targetcountry/:from/:to', async (req, res) => {
    try { //try-catch block to handle an error in the asynchronous function
        //convert first letter to upper case
        var source_country = req.params.sourceCountry[0].toUpperCase() + req.params.sourceCountry.slice(1)
        var target_country = req.params.targetcountry[0].toUpperCase() + req.params.targetcountry.slice(1)
        //save cases and history paths
        var source_cases = await getCases(cases_api + source_country)
        var target_cases = await getCases(cases_api + target_country)
        var source_history = history_api + source_country + "&status=Confirmed"
        var target_history = history_api + target_country + "&status=Confirmed"
        //reverse dates
        var from = reverseDate(req.params.from)
        var to = reverseDate(req.params.to)
    
        var response = "Querying about " + source_country + ", " + target_country + " from " + req.params.from +
            " - to " + req.params.to + "<br/> Data:<br/>"
    
        //get confirmed cases of the countries
        var confirmed_source = await getConfirmedCases(from, to, source_history, source_cases)
        var confirmed_target = await getConfirmedCases(from, to, target_history, target_cases)
    
        var source_pop = source_cases['population'], target_pop = target_cases['population']

        response += source_country + ", population: " + source_pop + ", confirmed case " +
            req.params.to + ": " + confirmed_source[1] + "," + req.params.from + ": " + confirmed_source[0] +
            "<br/>" + target_country + ", population: " + target_pop + ", confirmed case " + req.params.to +
            ": " + confirmed_target[1] + "," + req.params.from + ": " + confirmed_target[0] + "<br/>"
    
        var result = [((confirmed_source[1] / source_pop) - (confirmed_target[1] / target_pop)).toFixed(3),
        ((confirmed_source[0] / source_pop) - (confirmed_target[0] / target_pop)).toFixed(3)]
    
        res.send(response + "Result: [" + result.toString() + "]")
    } catch (e) {
        res.send(e)
    }
})

//deal with wrong input
app.get('/*', (req, res) => {
    res.send("Wrong input! Please follow instruction from README.md file")
})

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`)
  })

/** Helper methods */

//convert data from cases route to json
async function getCases(cases) {
    const response = await fetch(cases)
    const data = await response.json()
    return data['All']
}

//convert data from history route to json
async function getHistory(history) {
    const response = await fetch(history)
    const data = await response.json()
    return data['All']['dates']
}

//get confirmed cases of from and to dates
async function getConfirmedCases(date1, date2, history, cases) {
    var dates = await getHistory(history)
    var keys = Object.keys(dates)
    var confirmed1, confirmed2
    confirmed1 = dates[date1]
    //check if date2 is today's date
    if (compareDates(date2, keys[0]))
        confirmed2 = cases['confirmed']
    else
        confirmed2 = dates[date2]
    return [confirmed1, confirmed2]
}

//reverse date from <day>-<month>-<year> to <year>-<month>-<day> or vice versa
function reverseDate(date) {
    var strArray = date.split("-")
    return strArray[2] + "-" + strArray[1] + "-" + strArray[0]
}

//the function returns true if date1 is today's date, and false otherwise
function compareDates(date1, date2) {
    var str1 = date1.split("-")
    var str2 = date2.split("-")
    //check if str1 is one day after str2 (str[0]=year, str[1]=month, str[2]=day)
    if ((parseInt(str1[2]) == parseInt(str2[2]) + 1) && (parseInt(str1[1]) == parseInt(str2[1])) ||
        (parseInt(str1[2]) == 1 && ((parseInt(str1[1]) == parseInt(str2[1]) + 1) || (parseInt(str2[2]) == 31))))
        return true;
    return false;
}