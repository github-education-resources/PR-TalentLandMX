
// stepper

// reverse parse markdown from bot comment, determine which step the PR is on:

// * Participated in 2020
//   * no - close PR
// * SDP?
//   * no - request changes
// * Shipping form complete?
//   * no - request changes
// * Correct file path
//   * no - request changes
// * Markdown correct?
//   * no - request changes
// * Follows COC
//   * no - close PR
// * congrats!
// * merge PR

// Load .env in dev
if(!process.env.GITHUB_ACTIONS) {
  const result = require('dotenv').config()

  if (result.error) {
    throw result.error
  }
}


const octokit = require('./app/octokit.js');
const actionEvent = require('./app/action-event.js');
const fileValidator = require('./app/file-validator.js');
const authors = ('../../../README.md');
const author = actionEvent.pullAuthor
const BOT_ACCOUNT_LOGIN = "github-education"

const fs = require('fs');

try {
;(async ()=>{

  const feedback = []

  let pull

  if(actionEvent.name === "review_requested" && actionEvent.requestedReviewer.login !== BOT_ACCOUNT_LOGIN) {
    return true
  }
 
  try {
    pull = await octokit.fetchPr(actionEvent.pullNumber)
  }catch(err) {
    console.log(err)
  } 

    // checks

  // graduated already in 2020 or 2021?
  

  // approved for the student/teacher development pack


  // Has the user completed the shipping form? (address must exist for the form to be submitted)
  const fileNames = pull.files.edges.map((file)=>{
    return file.node.path
  })

  let isMarkdownValid = {}
  let content

  const isFilePathValid = fileValidator.isValidPaths(fileNames)

  try {
    content = isFilePathValid.isValid && await octokit.getContent(`data/${actionEvent.pullAuthor}.md`)
  } catch(err) {
    feedback.push("No pude ver el contenido del archivo markdown, por favor intenta de nuevo en unos minutos")
    console.log(err)
  }

  if(content) {
    isMarkdownValid = await fileValidator.isMarkdownValid(content)
  }

  console.log(content)

 // I have read the instructions on the README file before submitting my application.
 // I made my submission by creating a folder on the data folder and followed the naming convention mentioned in the instructions (<username>) and markdown file.
 // I have submitted a swag shipping form.
 // I have used the Markdown file template to add my information to the Year Book.
 // I understand that a reviewer will merge my pull request after examining it or ask for changes in case needed.
 // I understand I should not tag or add a reviewer to this Pull Request.
 // I have added the event to my Calendar.

  // #################### TODO CACHE AIR TABLE SOMEHOW ########################
  // * cache the entire base in a json file with actions
  // * if the user checks come back negative, query the api directly to double check
  // * if it comes back different, then trigger a cache rebuild


  // ############################ bot posting flow ############################
  // - show initial message with spinner when checks are running
  // - General message with a list of errors
  //   - Already Participated - close PR
  //   - Not applied for SDP
  //   - Not completed the shipping form
  //   - invalid files
  //     - comment on files review request changes
  //   - invalid markdown
  //     - comment on files review request changes
  // - collapse requested changes comment
  // - welcome and congrats
  // - merge PR
  let closePR = false

  // here it vlidated 
  fs.readFile(authors, function (err, data) {
    if (err) throw err;
    if(data.includes(author)){
     console.log("lo ecnontre kachau wey")
     let closePR = true
     feedBackMessage = "I'm really sorry! It looks like you've already participaed in this activity"
     feedback.push("oh oh we have a problem")
    }
  });
 
  

  if(!isFilePathValid.isValid) {
    console.log('Files have errors: \n' + isFilePathValid.errors.join('\n'))
    feedback.push(`* *Uh Oh! He encontrado algunos problemas con el lugar donde creaste tus archivos!* \n\t${isFilePathValid.errors?.join('\n')}`)
  }

  if(isMarkdownValid.isValid === false) {
    console.log("markdown is invalid")
    feedback.push(`* * Echa otro vistazo a tu archivo, hay errores: * \n\t${isMarkdownValid.errors?.join('\n')}`)
  }
  

  let feedBackMessage = ""
  if(closePR) {
    feedBackMessage = "I'm really sorry! It looks like you've already participaed in this activity"
  } else if(feedback.length) {
    feedBackMessage = `
### Tengo algunos elementos de los que necesito que te ocupes antes de que podamos aceptar este PR:\n
${feedback.join('\n')}

Siéntete libre de volver a solicitarme una revisión y volveré y echaré un vistazo.
    `
  } else {
    // All checks pass
    
    feedBackMessage = "Excelente, ahora estás a un paso de participar en la rifa de plaeras de GitHub. Encuentra un hubber o Campus Expert para que pueda aceptar tu Pull request y darte stickers de GitHub."
    

    try {
      // await octokit.mergePR()
      await octokit.addReviewLabel()

    } catch(err) {
      console.error(err)
      feedBackMessage += "\n\n Uh Oh! Intente hacer merge de este PR pero algo salio mal!"
      feedback.push("merge failed")
    }
  }

  console.log(feedBackMessage)

  try {
    await octokit.createReview(`
**Hola ${ actionEvent.pullAuthor },**
**Estamos muy felcies de verte en Talent Land, vamos a revisar ese PR!**

${ feedBackMessage }
`, feedback.length ? "REQUEST_CHANGES" : "APPROVE")
    } catch(err) {
      console.log(err)
    }

  if(closePR) {
    try {
      await octokit.addClosedLabel()
      await octokit.closePR()
    } catch(err) {
      console.log("failed to close PR")
      console.log(err)
    }
  }

  if(feedback.length) {
    console.log(feedback.join('\n'))
    process.exit(1)
  }
})()
} catch(err) {
  console.error(err)
  process.exit(1);
}
