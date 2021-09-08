import fetch from 'node-fetch'
import express, { response } from 'express'

const app = express()

const port = 8080

var cases_api = "https://covid-api.mmediagroup.fr/v1/cases?country="
var history_api = "https://covid-api.mmediagroup.fr/v1/history?country="

//todo: deal with empty input
app.get('/', (req, res) => {
    res.send('Hello World!')
})

async function getCases(cases) {
    const response = await fetch(cases)
    const data = await response.json()
    return data['All']
}

async function getHistory(history) {
    const response = await fetch(history)
    const data = await response.json()
    return data['All']['dates']
}

app.get('/:country/:date', async(req, res) => {
    //convert first letter to upper case
    var country_name = req.params.country[0].toUpperCase() + req.params.country.slice(1)

    var cases = cases_api + country_name
    var history = history_api + country_name + "&status=Confirmed"
    var input_date = reverseDate(req.params.date)

    var dates = await getHistory(history)
    var keys = Object.keys(dates)

    var response = "Querying about " + country_name + " " + req.params.date +
        "<br/> Data:<br/>" + country_name + ", confirmed case " + req.params.date + ": "

    if (compareDates(input_date, keys[0])) {
        var confirmed1 = (await getCases(cases))['confirmed']
        var confirmed2 = dates[keys[0]]
        response += confirmed1 + "," + reverseDate(keys[0]) + ": " + confirmed2
    } else {
        var confirmed1 = dates[input_date]
        response += confirmed1
        var prevDateIdx = keys.indexOf(input_date) + 1
        var confirmed2 = 0
        if (prevDateIdx < keys.length) {
            confirmed2 = dates[keys[prevDateIdx]]
            response += "," + reverseDate(keys[prevDateIdx]) + ": " + confirmed2
        }
    }
    var result = parseInt(confirmed1) - parseInt(confirmed2)
    res.send(response + "<br/>Result: " + result.toString())
})



app.get('/:sourceCountry/:targetcountry/:from/:to', async(req, res) => {
    //convert first letter to upper case
    var source_country = req.params.sourceCountry[0].toUpperCase() + req.params.sourceCountry.slice(1)
    var target_country = req.params.targetcountry[0].toUpperCase() + req.params.targetcountry.slice(1)

    var source_cases = await getCases(cases_api + source_country)
    var target_cases = await getCases(cases_api + target_country)
    var source_history = history_api + source_country + "&status=Confirmed"
    var target_history = history_api + target_country + "&status=Confirmed"

    var from = reverseDate(req.params.from)
    var to = reverseDate(req.params.to)
    
    var response = "Querying about " + source_country + ", " + target_country + " from " + req.params.from +
        " - to " + req.params.to + "<br/> Data:<br/>"
 
    var confirmed_source = await getInfo(from, to, source_history, source_cases)
    var confirmed_target = await getInfo(from, to, target_history, target_cases)

    var source_pop = source_cases['population'], target_pop = target_cases['population']
    response += source_country + ", population: " + source_pop + ", confirmed case " +
        req.params.to + ": " + confirmed_source[1] + "," + req.params.from + ": " + confirmed_source[0] + "<br/>"
    response += target_country + ", population: " + target_pop + ", confirmed case " +
        req.params.to + ": " + confirmed_target[1] + "," + req.params.from + ": " + confirmed_target[0] + "<br/>"
    
    var result = [((confirmed_source[1] / source_pop) - (confirmed_target[1] / target_pop)).toFixed(3),
    ((confirmed_source[0] / source_pop) - (confirmed_target[0] / target_pop)).toFixed(3)]
    res.send(response + "Result: " + result.toString())
})

async function getInfo(from, to, history, cases) {
    var dates = await getHistory(history)
    var keys = Object.keys(dates)
    var confirmed1, confirmed2
    confirmed1 = dates[from]
    if (compareDates(to, keys[0]))
        confirmed2 = cases['confirmed']
    else
        confirmed2 = dates[to]
    return [confirmed1, confirmed2]
}

function reverseDate(date) {
    var strArray = date.split("-")
    return strArray[2] + "-" + strArray[1] + "-" + strArray[0]
}
  
function compareDates(date1, date2) {
    var str1 = date1.split("-")
    var str2 = date2.split("-")
    //check if str1 is one day after str2
    if ((parseInt(str1[2]) == parseInt(str2[2]) + 1) && (parseInt(str1[1]) == parseInt(str2[1])) ||
        (parseInt(str1[2]) == 1 && ((parseInt(str1[1]) == parseInt(str2[1]) + 1) || (parseInt(str2[2]) == 31))))
        return true;
    return false;
}

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`)
  })