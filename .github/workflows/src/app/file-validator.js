const actionEvent = require('./action-event.js');
const path = require('path')
const yaml = require('yaml')
const md = require('markdown-it')

const pullAuthor = actionEvent.pull.user.login
const expectedPath = `data`
const authors1 = `data/authors.txt`
const characterLimits = {  quote: 280 }

class FileVaidator {
  constructor() {

  }

  async isMarkdownValid(markdown) {
    // hack to import a module TOO Enable modules and swap all the requires
    const metadataBlock = (await import("markdown-it-metadata-block")).default;
    const meta = {}
    const errors = []
    let mdContent = false

    const mdParser = md({
      html: true,
      linkify: true,
      typographer: true
    }).use(metadataBlock,{
      parseMetadata: yaml.parse,
      meta: meta
    });

    try {
     mdContent = mdParser.render(markdown)
    } catch(err) {
      console.log("markdown error: " + err)
      errors.push(`* El archivo creado en \`${expectedPath}/${pullAuthor}.md\` tiene errores de sintaxis*`)
    }

    if(mdContent !== false) {
      // user validation
      /*if(meta.github_user !== pullAuthor) {
        errors.push(`*The yaml content in \`${expectedPath}/${pullAuthor}.md\` must contain your github username*`)
      }*/

      for(const key of [ "quote" ]) {
        if(!meta[key]) {
          errors.push(`*El atributo \`${key}\` es requerido en \`${expectedPath}/${pullAuthor}.md\` echa un vistaso a la plantilla*`)
        } else if(meta[key].length > characterLimits[key]) {
          errors.push(`*El valor \`${key}\` solo puede tener **${characterLimits[key]}** caracteres maximo (I veo **${meta[key].length }**)*`)
        }
      }
    } else {
      errors.push(`*\`${expectedPath}/${pullAuthor}.md\` does not contain any yaml metadata*`)
    }

    return { isValid: !errors.length, errors: errors }
  }

  isValidPaths(filePaths=[]) {
    console.log(pullAuthor)
    const errors = []
    const invalidPaths = []
    let invalidDirectory = false
    let InvalidMarkdownFile = true
    let isValid = true
    let pathData

    for(let filePath of filePaths) {
      pathData = path.parse(filePath)

      if(pathData.dir !== expectedPath) {
        invalidPaths.push("`" + filePath + "`")
        invalidDirectory = true
      }

      if(pathData.base === `${pullAuthor}.md`) {
        InvalidMarkdownFile = false
      }
    }

    if(InvalidMarkdownFile) {
      errors.push(`*El archivo .md requerido no existe, asegúrete de que el archivo \`${expectedPath}/${pullAuthor}.md\` existe*`)
    }

    if(invalidDirectory) {
      errors.push(`*Asegúrete de que todos los cambios estén incluidos en el directorio\`${expectedPath}/\`. Invalid file paths:* \n\n\t* ${invalidPaths.join('\n\t* ')}\n`)
    }

    return { isValid: !errors.length, errors }
  }
}

module.exports = new FileVaidator()
