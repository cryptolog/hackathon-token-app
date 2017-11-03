// Author: Ian Annase
// Token Hackathon

const Bot = require('./lib/Bot')
const SOFA = require('sofa-js')
const Fiat = require('./lib/Fiat')

let bot = new Bot()

var api_start = 'http://data.orghunter.com/v1/charitysearch?&rows=3&user_key=e956faf6553635be42ddf4c166fc56e9&eligible=1'
var api_start_ein = 'http://data.orghunter.com/v1/charitysearch?&rows=3&user_key=e956faf6553635be42ddf4c166fc56e9&eligible=1&ein='
var userSearch = ''
var einFromUser = ''

// events
bot.onEvent = function(session, message) {
  switch (message.type) {
    case 'Init':
      welcome(session)
      break
    case 'Message':
      onMessage(session, message)
      break
    case 'Command':
      onCommand(session, message)
      break
    case 'Payment':
      onPayment(session, message)
      break
    case 'PaymentRequest':
      welcome(session)
      break
  }
}

// messages
function onMessage(session, message) {
    m = message.body
    var request = require("request");
    var options = { method: 'POST',
        url: 'https://tokenapp-95f0.restdb.io/rest/interactions',
        headers:
        { 'cache-control': 'no-cache',
        'x-apikey': '15205f8384219f477505a67fc26fa9e23308f',
        'content-type': 'application/json' },
        body: { message: m },
        json: true };
        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            console.log(body);
        });
    // finding orghunter API
    if (session.get('finding') == 1) {
        session.set('finding', 0)
        userSearch = message.body
        form990Z = session.get('form990')
        url = api_start + form990Z + userSearch
        session.set('sessionURL', url)
        var request = require('request');
        request(url, function (error, response, body) {
            jsonObj = JSON.parse(body)
            if (jsonObj.code != 200 || jsonObj.data.length == 0) {
                session.reply(SOFA.Message({
                    body: "Whoops! I didn't find anything for that search term. Want to try again? 😲",
                    controls: [
                        {type: "button", label: "Yes!", value: "charitySize"},
                        {type: "button", label: "No", value: "startOver"}
                    ]
                }))
                return
            }
            name = toTitleCase(jsonObj.data[0].charityName)
            city = toTitleCase(jsonObj.data[0].city)
            state = toTitleCase(jsonObj.data[0].state)
            einNumber = jsonObj.data[0].ein
            session.set('myEIN', einNumber)
            session.set('charityName', name)
            if (jsonObj.data.length == 1) {
            session.reply(SOFA.Message({
                    body: ("Were you looking for " + name + " based in " + city + ", " + state + "? 🤔"),
                    controls: [
                        {type: "button", label: "Yes!", value: "donate"},
                        {type: "button", label: "No", value: "search"},
                        {type: "button", label: "Start Over 🔁", value: "startOver"}
                    ]
                }))
            } else {
                session.reply(SOFA.Message({
                    body: ("Were you looking for " + name + " based in " + city + ", " + state + "? 🤔"),
                    controls: [
                        {type: "button", label: "Yes!", value: "donate"},
                        {type: "button", label: "No", value: "secondResult"},
                        {type: "button", label: "Start Over 🔁", value: "startOver"}
                    ]
                }))
            }
        });

    // custom donation
    } else if (session.get('customDonation') == 1) {
        session.set('customDonation', 0)
        donationFix = '$'+message.body
        session.set('donationAmount', donationFix)
        Fiat.fetch().then((toEth) => {
          session.set('ethValue', toEth.USD(parseFloat(message.body)))
          session.requestEth(toEth.USD(parseFloat(message.body)))
        })

    // enter EIN    
    } else if (session.get('enterEIN') == 1) {
        session.set('enterEIN', 0)
        session.set('myEIN', message.body)
        url = api_start_ein + session.get('myEIN')
        session.set('sessionURL', url)
        var request = require('request');
        request(url, function (error, response, body) {
            jsonObj = JSON.parse(body)
            if (jsonObj.code != 200 || jsonObj.data.length == 0) {
                session.reply(SOFA.Message({
                    body: "Whoops! I didn't find anything for that search term. Want to try again? 😲",
                    controls: [
                        {type: "button", label: "Yes!", value: "charitySize"},
                        {type: "button", label: "No", value: "startOver"}
                    ]
                }))
                return
            }
            name = toTitleCase(jsonObj.data[0].charityName)
            city = toTitleCase(jsonObj.data[0].city)
            state = toTitleCase(jsonObj.data[0].state)
            session.set('charityName', name)
            session.reply(SOFA.Message({
                body: ("Just to make sure, were you looking for " + name + " based in " + city + ", " + state + "? 🤔"),
                controls: [
                    {type: "button", label: "Yes!", value: "donate"},
                    {type: "button", label: "No", value: "ein"},
                    {type: "button", label: "Start Over 🔁", value: "startOver"}
                ]

            }))
        });

    // enter email
    } else if (session.get('enterEmailAddr') == 1) {
        session.set('enterEmailAddr', 0)
        email = message.body
        var request = require("request");
        var options = { method: 'POST',
            url: 'https://tokenapp-95f0.restdb.io/rest/emails',
            headers:
            { 'cache-control': 'no-cache',
            'x-apikey': '15205f8384219f477505a67fc26fa9e23308f',
            'content-type': 'application/json' },
            body: { email: email },
            json: true };
            request(options, function (error, response, body) {
                if (error) throw new Error(error);
                console.log(body);
            });
        session.reply(SOFA.Message({
            body: "Thanks!",
            controls: [
                {type: "button", label: "Go Back 🔁", value: "startOver"}
            ]
        }))

    // enter first name
    } else if (session.get('firstNameEnter') == 1) {
        session.set('firstNameZ', message.body)
        lastName(session)
    
    //enter last name
    } else if (session.get('lastNameEnter') == 1) {
        session.set('lastNameZ', message.body)
        emailAddress(session)

    // enter email 2
    } else if (session.get('emailEnterZ') == 1) {
        session.set('email', message.body)

        hash = session.get('hashX')
        from = session.get('fromX')
        to = session.get('toX')
        thisEin = session.get('myEIN')
        thisCharityName = session.get('charityName')
        status = 'receipt'
        thisEin = session.get('myEIN');
        date = timeStamp()
        thisCharityName = session.get('charityName')
        donationUSD = session.get('donationAmount')
        donationETH = session.get('ethValue')
        accountType = 'alpha'
        firstNameZ = session.get('firstNameZ')
        lastNameZ = session.get('lastNameZ')
        email = session.get('email')

        var request = require("request");
        var options = { method: 'POST',
            url: 'https://tokenapp-95f0.restdb.io/rest/transactions',
            headers:
            { 'cache-control': 'no-cache',
            'x-apikey': '15205f8384219f477505a67fc26fa9e23308f',
            'content-type': 'application/json' },
            body: { transactionHash: hash, fromAddress: from, toAddress: to, ein: thisEin, charityName: thisCharityName, status: status, date: date, donationUSD: donationUSD, donationETH: donationETH, account: accountType, firstName: firstNameZ, lastName: lastNameZ, email: email},
            json: true };
            request(options, function (error, response, body) {
                if (error) throw new Error(error);
                console.log(body);
            });
        thanks(session)
    } else {
        welcome(session)
    }
}

// timestamp
function timeStamp() {
  var now = new Date();
  var date = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ];
  var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];
  var suffix = ( time[0] < 12 ) ? "AM" : "PM";
  time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;
  time[0] = time[0] || 12;
  for ( var i = 1; i < 3; i++ ) {
    if ( time[i] < 10 ) {
      time[i] = "0" + time[i];
    }
  }
  return date.join("/") + " " + time.join(":") + " " + suffix;
}

// titlecase
function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

// commands
function onCommand(session, command) {
  switch (command.content.value) {
    case 'firstName':
      firstName(session)
      break
    case 'lastName':
      lastName(session)
      break
    case 'emailAddress':
      emailAddress(session)
      break
    case 'charitySize':
      charitySize(session)
      break
    case 'largeCharity':
      largeCharity(session)
      break
    case 'smallCharity':
      smallCharity(session)
      break
    case 'enterEmail':
      enterEmail(session)
      break
    case 'bitcoinFoundation':
      bitcoinFoundation(session)
      break
    case 'wwf':
      wwf(session)
      break
    case 'stJude':
      stJude(session)
      break
    case 'redCross':
      redCross(session)
      break
    case 'codeOrg':
      codeOrg(session)
      break
    case 'water':
      water(session)
      break
    case 'about':
      about(session)
      break
    case 'secondResult':
      secondResult(session)
      break
    case 'ein':
      ein(session)
      break
    case 'notThere':
      notThere(session)
      break
    case 'startOver':
      startOver(session)
      break
    case 'search':
      search(session)
      break
    case 'info':
      count(session)
      break
    case 'donate':
      donate(session)
      break
    case 'donate1':
      donate1(session)
      break
    case 'donate5':
      donate5(session)
      break
    case 'donate10':
      donate10(session)
      break
    case 'donate20':
      donate20(session)
      break
    case 'donate100':
      donate100(session)
      break
    case 'donatecustom':
      donatecustom(session)
      break
    case 'find':
      find(session)
      break
    }
}

// payments
function onPayment(session, message) {
  if (message.fromAddress == session.config.paymentAddress) {
    // handle payments sent by the bot
    if (message.status == 'confirmed') {
      // perform special action once the payment has been confirmed
      // on the network
    } else if (message.status == 'error') {
      // oops, something went wrong with a payment we tried to send!
    }
  } else {
    // handle payments sent to the bot
    if (message.status == 'unconfirmed') {
        hash = message.txHash
        session.set('hashX', hash)
        from = message.fromAddress
        session.set('fromX', from)
        to = message.toAddress
        session.set('toX', to)
        status = message.status
        date = timeStamp()
        thisEin = session.get('myEIN');
        thisCharityName = session.get('charityName')
        donationUSD = session.get('donationAmount')
        donationETH = session.get('ethValue')
        accountType = 'alpha'
        var request = require("request");

        var options = { method: 'POST',
            url: 'https://tokenapp-95f0.restdb.io/rest/transactions',
            headers:
            { 'cache-control': 'no-cache',
            'x-apikey': '15205f8384219f477505a67fc26fa9e23308f',
            'content-type': 'application/json' },
            body: { transactionHash: hash, fromAddress: from, toAddress: to, ein: thisEin, charityName: thisCharityName, status: status, date: date, donationUSD: donationUSD, donationETH: donationETH, account: accountType},
            json: true };

            request(options, function (error, response, body) {
                if (error) throw new Error(error);

                console.log(body);
            });
        str = "🤔 Confirming..."
        session.reply(SOFA.Message({
            body: str,
        }))
    } else if (message.status == 'confirmed') {
        hash = message.txHash
        from = message.fromAddress
        to = message.toAddress
        status = message.status
        thisEin = session.get('myEIN');
        date = timeStamp()
        thisCharityName = session.get('charityName')
        donationUSD = session.get('donationAmount')
        donationETH = session.get('ethValue')
        accountType = 'alpha'
        var request = require("request");

        var options = { method: 'POST',
            url: 'https://tokenapp-95f0.restdb.io/rest/transactions',
            headers:
            { 'cache-control': 'no-cache',
            'x-apikey': '15205f8384219f477505a67fc26fa9e23308f',
            'content-type': 'application/json' },
            body: { transactionHash: hash, fromAddress: from, toAddress: to, ein: thisEin, charityName: thisCharityName, status: status, date: date, donationUSD: donationUSD, donationETH: donationETH, account: accountType},
            json: true };

            request(options, function (error, response, body) {
                if (error) throw new Error(error);

                console.log(body);
            });

            str = "😀 Thanks for your donation to " + thisCharityName + " using CryptoGive! 👍 MakeMyDonation is now converting and sending your donation. Would you like an email receipt? ✉️"
            session.reply(SOFA.Message({
                body: str,
                controls: [
                    {type: "button", label: "Yes!", value: "firstName"},
                    {type: "button", label: "Main Menu 🔁", value: "startOver"}
                ]
            }))


    } else if (message.status == 'error') {
      sendMessage(session, `There was an error with your payment!🚫`);
    }
  }
}

// welcome
function welcome(session) {
    session.set('finding', 0)
    session.set('customDonation', 0)
    session.set('enterEIN', 0)
    session.set('enterEmailAddr', 0)
    session.set('firstNameEnter', 0)
    session.set('lastNameEnter', 0)
    session.set('enterEmailZ', 0)

    session.reply(SOFA.Message({
    body: 'Welcome to CryptoGive! 👋 Make fast and easy donations to over 1.5 million charities. What can I help you with? 😀',
    controls: [
        {
            type: "group",
            label: "❤️ Popular Charities ❤️",
        controls: [
            {type: "button", label: "➕ American Red Cross", value: "redCross"},
            {type: "button", label: "🚰  Water.org", value: "water"},
            {type: "button", label: "💻 Code.org", value: "codeOrg"},
            {type: "button", label: "🐼 World Wildlife Foundation", value: "wwf"},
            {type: "button", label: "🏥 St. Jude's Research Hospital", value: "stJude"},
            {type: "button", label: "🌏 The Bitcoin Foundation", value: "bitcoinFoundation"}
        ]
    },
        {type: "button", label: "🔎 Find a Charity 🔎", value: "charitySize"},
        {type: "button", label: "ℹ️ About ℹ️", value: "about"}
    ]
}))
}

// restart
function startOver(session) {
    welcome(session)
}

// charity size
function charitySize(session) {
    session.reply(SOFA.Message({
        body: "Are you looking for a large charity? 🤔",
        controls: [
            {type: "button", label: "Yes!", value: "largeCharity"},
            {type: "button", label: "Let's search for smaller ones.", value: "smallCharity"}
        ]
    }))
}

// large charity
function largeCharity(session) {
    session.set('form990', '&form990_amount_min=100000000&searchTerm=')
    search(session)
}

// small charity
function smallCharity(session) {
    session.set('form990', '&searchTerm=')
    search(session)
}

// not there
function notThere(session) {
    session.reply(SOFA.Message({
        body: "Sorry about that! 😞 Would you like to search for it online? 🌐",
        controls: [
            {type: "button", label: "Yes 👍", value: "ein"},
            {type: "button", label: "No Thanks 👎", value: "startOver"}
        ]
    }))
}

// search for charities
function search(session) {
    session.set('finding', 1)
    session.reply(SOFA.Message({
        body: "Which charity are you looking for? 🤔"
    }))
}

// get EIN
function ein(session) {
    session.set('enterEIN', 1)
    session.reply(SOFA.Message({
        body: "What's the EIN number? 🤔",
        controls: [
            {type: "button", label: "Go Back 🔁", value: "startOver"},
            {type: "button", label: "Search Online 🌐", action: "http://donate.makemydonation.org"}
        ]
    }))
}

// example of how to store state on each user
function count(session) {
  let count = (session.get('count') || 0) + 1
  session.set('count', count)
  sendMessage(session, `${count}`)
}

// donation
function donate(session) {

    session.reply(SOFA.Message({
    body: 'How much would you like to donate? 🤔',
    controls: [
        {
            type: "group",
            label: "❤️ Select Amount ❤️",
        controls: [
            {type: "button", label: "1 💵", value: "donate1"},
            {type: "button", label: "5 💵", value: "donate5"},
            {type: "button", label: "10 💵", value: "donate10"},
            {type: "button", label: "20 💵", value: "donate20"},
            {type: "button", label: "100 💵", value: "donate100"},
            {type: "button", label: "Custom 💵", value: "donatecustom"}
        ]
    },
        {type: "button", label: "Start Over 🔁", value: "startOver"}

    ]
}))
}

// second OrgHunter API resul
function secondResult(session)
{
    url = session.get('sessionURL')
    var request = require('request');
    request(url, function (error, response, body) {

        jsonObj = JSON.parse(body)
        name = toTitleCase(jsonObj.data[1].charityName)
        city = toTitleCase(jsonObj.data[1].city)
        state = toTitleCase(jsonObj.data[1].state)
        einNumber = jsonObj.data[1].ein
        session.set('myEIN', einNumber)
        session.set('charityName', name)
        session.reply(SOFA.Message({
            body: ("How about " + name + " based in " + city + ", " + state + "? 🤔"),
            controls: [
                {type: "button", label: "Yes!", value: "donate"},
                {type: "button", label: "Nope", value: "notThere"},
                {type: "button", label: "Start Over 🔁", value: "startOver"}
            ]
        }))
    });
}

// donate $1
function donate1(session) {
   session.set('donationAmount', '$1.00')
  // request $1 USD at current exchange rates
  Fiat.fetch().then((toEth) => {
    session.set('ethValue', toEth.USD(1))
    session.requestEth(toEth.USD(1))
  })
}

// donate $5
function donate5(session) {
  session.set('donationAmount', '$5.00')
  // request $5 USD at current exchange rates
  Fiat.fetch().then((toEth) => {
    session.set('ethValue', toEth.USD(5))
    session.requestEth(toEth.USD(5))
  })
}

// donate $10
function donate10(session) {
  session.set('donationAmount', '$10.00')
  // request $10 USD at current exchange rates
  Fiat.fetch().then((toEth) => {
    session.set('ethValue', toEth.USD(10))
    session.requestEth(toEth.USD(10))
  })
}

// donate $20
function donate20(session) {
  session.set('donationAmount', '$20.00')
  // request $20 USD at current exchange rates
  Fiat.fetch().then((toEth) => {
    session.set('ethValue', toEth.USD(20))
    session.requestEth(toEth.USD(20))
  })
}

// donate $100
function donate100(session) {
  session.set('donationAmount', '$100.00')
  // request $100 USD at current exchange rates
  Fiat.fetch().then((toEth) => {
    session.set('ethValue', toEth.USD(100))
    session.requestEth(toEth.USD(100))
  })
}

// donate custom amount
function donatecustom(session) {
  session.set('customDonation', 1)
  session.reply(SOFA.Message({
      body: "How much? 😀"
  }))
}

// about
function about(session) {
    session.reply(SOFA.Message({
        body: ("Ethereum and cryptocurrencies like it are growing at an exponential rate 📈 but charitable organizations lack the technology, confidence, and understanding to accept cryptocurrency as payment 💱. At CryptoGive our mission is to use this new form of currency for good ❤️. The annual market size of charitable giving totals to over $398 billion in the United States alone 💸. We work with two market leaders, OrgHunter and MakeMyDonation, to provide an easy platform for cryptocurreny users to donate 💻. Through this partnership, this groundbreaking application will instantly expose 1.5 million US-based charities to an untapped revenue source and will ever-change crypto's role in the vast world of philanthropy 🌎."),
        controls: [
            {type: "button", label: "Keep Me Updated 🤔", value: "enterEmail"},
            {type: "button", label: "Go Back 🔁", value: "startOver"}
        ]

    }))
}

// water
function water(session) {
    session.set('myEIN', 582060131)
    session.set('charityName', 'Water.org')
    session.reply(SOFA.Message({
        body: "Access to safe water can protect and save lives, just because it's there. Access to safe water has the power to turn time spent into time saved, when it's close and not hours away. Access to safe water can turn problems into potential: unlocking education, economic prosperity, and improved health. "
    }))
    donate(session)
}

// code.org
function codeOrg(session) {
    session.set('myEIN', 460858543)
    session.set('charityName', 'Code.org')
    session.reply(SOFA.Message({
        body: "Code.org is a non-profit dedicated to expanding access to computer science, and increasing participation by women and underrepresented minorities. Our vision is that every student in every school should have the opportunity to learn computer science, just like biology, chemistry or algebra. Code.org organizes the annual Hour of Code campaign which has engaged 10% of all students in the world, and provides the leading curriculum for K-12 computer science in the largest school districts in the United States. Code.org is supported by generous donors including Microsoft, Facebook, the Infosys Foundation, Google, Omidyar Network, and many more."
    }))
    donate(session)
}

// bitcoin foundation
function bitcoinFoundation(session) {
    session.set('myEIN', 461671796)
    session.set('charityName', 'The Bitcoin Foundation')
    session.reply(SOFA.Message({
        body: "The Bitcoin Foundation is an American nonprofit corporation. It was founded in September 2012 with the stated mission to standardize, protect and promote the use of bitcoin cryptographic money for the benefit of users worldwide."
    }))
    donate(session)
}

// red cross
function redCross(session) {
    session.set('myEIN', 530196605)
    session.set('charityName', 'The American Red Cross')
    session.reply(SOFA.Message({
        body: "The American Red Cross prevents and alleviates human suffering in the face of emergencies by mobilizing the power of volunteers and the generosity of donors.​"
    }))
    donate(session)
}

// wwf
function wwf(session) {
    session.set('myEIN', 521693387)
    session.set('charityName', 'WWF World Wildlife Fund')
    session.reply(SOFA.Message({
        body: "The world’s leading conservation organization, WWF works in 100 countries and is supported by more than one million members in the United States and close to five million globally. WWF's unique way of working combines global reach with a foundation in science, involves action at every level from local to global, and ensures the delivery of innovative solutions that meet the needs of both people and nature."
    }))
    donate(session)
}

// st jude
function stJude(session) {
    session.set('myEIN', 620646012)
    session.set('charityName', 'St. Judes Childrens Hospital')
    session.reply(SOFA.Message({
        body: "St. Jude is leading the way the world understands, treats and defeats childhood cancer and other life-threatening diseases."
    }))
    donate(session)
}

// enter email
function enterEmail(session) {
    session.set('enterEmailAddr', 1)
    session.reply(SOFA.Message({
        body: "Awesome! Enter your email below and I will update you on my progress with this idea. 😎",
        controls: [
            {type: "button", label: "No Thanks", value: "startOver"}
        ]
    }))
}

// first name
function firstName(session) {
    session.set('firstNameEnter', 1)
    session.reply(SOFA.Message({
        body: "Ok, what's your first name? 😎"
    }))
}

// last name
function lastName(session) {
    session.set('lastNameEnter', 1)
    session.set('firstNameEnter', 0)
    session.reply(SOFA.Message({
        body: "Last Name? 😃"
    }))
}

// email address
function emailAddress(session) {
    session.set('emailEnterZ', 1)
    session.set('lastNameEnter', 0)
    session.reply(SOFA.Message({
        body: "Email? ✉️"
    }))
}

// thanks
function thanks(session) {
    session.set('emailEnterZ', 0)
    session.reply(SOFA.Message({
        body: "Thanks! 😍",
        controls: [
            {type: "button", label: "Main Menu 🔁", value: "startOver"}
        ]
    }))
}
