import * as fsPromises from "fs/promises"
import * as fs from "fs"
import path from "path";

import * as prompt from "@inquirer/prompts"
import { generatorProps } from "../@types/generator";
import { renderEjs } from "../utils/renderEjs";
import { PossiblePromptTypes, QuestionContent, QuestionSchema } from "../@types/questions";
import { adaptManifest, manifestSchema } from "../adapters/adaptManifest";

type responsesSchema = {
    [key: string]: any
}

type createdFiles = {filename: string, fileFolderPath: string}

async function fetchWebappFolder(){
    const CUR_DIR = process.cwd();

    if(CUR_DIR.includes('webapp')){
        const pathSplitted = CUR_DIR.split("\\")
        const webAppFolderIndex = pathSplitted.indexOf("webapp")

        const webAppIsLastFolder = pathSplitted.length === (webAppFolderIndex+1)        
        if(webAppIsLastFolder) return CUR_DIR

        const webappPath = pathSplitted.slice(0, webAppFolderIndex).join("\\")
        return webappPath
    }

    const files = await fsPromises.readdir(CUR_DIR);
    const webappFolder = files.find((file) => file === 'webapp');
    if (!webappFolder) {
        console.log('It must be running inside a UI5 app that contains a webapp');
        process.exit();
    }
    
    return path.join(CUR_DIR, webappFolder)
}

async function createFolder (generatorType: string, webAppPath: string){
    const fileFolder = path.join(webAppPath, generatorType)

    if(!fs.existsSync(fileFolder)){
        fsPromises.mkdir(fileFolder)
    }

    return fileFolder
}

async function createFile(templatePath: string, createdFolderPath: string, responses: responsesSchema, filePath: string): Promise<[createdFiles[], boolean]>{
    const filesToCreate = await fsPromises.readdir(templatePath)
    const createdFiles: createdFiles[] = []

    await Promise.all(
        filesToCreate.map(async (file) => {
            const orgFile = path.join(templatePath, file)
    
            const stats = fs.statSync(orgFile)
    
            if(stats.isFile()){
                // verifying existence of the requested file 
                if(fs.existsSync(path.join(createdFolderPath, file))) {
                    // Change FileName to FilePath => generator/* <folder name is filePath>
                    const fileExtension = file.split(".").at(-1)
                    file = `${filePath}.${fileExtension}` 
    
                    // if folder continue exists
                    if(fs.existsSync(path.join(createdFolderPath, file))){
                        const overwriteResponse = await prompt.confirm({
                            message: "Parece que o arquivo que deseja gerar, já existe. Deseja sobrescrevê-lo?"
                        })
    
                        if(!overwriteResponse) return
                    }
                }
    
                const template = await fsPromises.readFile(orgFile, 'utf-8')
                const templateEjs = renderEjs(template, responses)
                
                fsPromises.writeFile(path.join(createdFolderPath, file), templateEjs)
    
                createdFiles.push({filename: file, fileFolderPath: createdFolderPath})
            }
        })
    )

    return [createdFiles, false]
}

// Main func
export async function generateMicroComponent({templatePath, generatorType, filePath}: generatorProps) {
    const webAppPath = await fetchWebappFolder()

    const responses = await makeQuestions(generatorType, filePath) 

    const manifestFile = await adaptManifest(webAppPath)

    if(responses.wantConnections){
        if(manifestFile.dataSources.length === 0) console.log("Nenhuma conexão foi detectada") 
        responses.existingConnections = manifestFile.dataSources.filter(connection => connection.type.toLowerCase() === "odata")
    }

    const createdFolderPath = await createFolder(generatorType, webAppPath)

    const [generatedFiles, err] = await createFile(templatePath, createdFolderPath, responses, filePath)
    if(err) console.log("Houve algum problema ao gerar o arquivo, tente novamente!")

    // no file was generated
    if(generatedFiles.length === 0) return process.exit()

    switch(filePath){
        case "connector-v4": {
            const componentJs = await getComponentJs(webAppPath)

            const connectorGenerated = generatedFiles.find(fileStats => fileStats.fileFolderPath.includes("connection"))

            if(connectorGenerated) {
                const connectorInfo = {
                    ...connectorGenerated,
                    generatorType
                }

                modifyComponentJs(webAppPath, componentJs, manifestFile, connectorInfo)
            }

            break;
        }
    }
}

function addNewImport (projectId: string, imports: string[], fileGenerated: createdFiles & {generatorType: string}, ){
    // Changing Whitespace to Tab and Removing Open\close Array rested
    const importsArrayToTab = imports.map(val => val.replace(/ {4}/g, "\t")).filter(val => val !== "\t" && val.trim() !== "")
    
    // Adding comma in last Import
    const lastImport = importsArrayToTab.at(-1)

    if(lastImport){
        const addingCommaInLastElement = (lastImport.indexOf(",") === lastImport.length - 1) ? lastImport : `${lastImport},`
        importsArrayToTab[importsArrayToTab.length-1] = addingCommaInLastElement
    }

    const newImport = `\t\t"${projectId}/${fileGenerated.generatorType}/${fileGenerated.filename}"`
    importsArrayToTab.push(newImport)

    //Add Tab on the final -> Indentation
    importsArrayToTab.push("\t")

    const transformInExpectedString = `[\n${importsArrayToTab.join("\r\n")}]`

    return transformInExpectedString
}

async function modifyComponentJs(webAppPath: string, componentJs: string, manifestFile: manifestSchema, fileGenerated: createdFiles & {generatorType: string}){
    const projectIdWithSlash = manifestFile.projectId.replaceAll(".", "/")

    const regexDetachArrayFromComponent = /\[([\s\S]*?)\]/
    const [_, importsComponent]: string[] = componentJs.split(regexDetachArrayFromComponent)
    
    const importsArray = importsComponent.split("\r\n")

    const hasConnectorImported = importsArray.some(val => val.includes(fileGenerated.filename))

    if(hasConnectorImported) return console.log("Connector already imported, no need import")

    const importsModified = addNewImport(projectIdWithSlash, importsArray, fileGenerated)
    
    const replaceOnlyArrayRegex = /\[\s*([\s\S]*?)\s*\]/;
    const modifiedComponent = componentJs.replace(replaceOnlyArrayRegex, importsModified)
    fs.writeFileSync(path.join(webAppPath, "Component.js"), modifiedComponent)
}

async function getComponentJs(webAppPath: string){
    const componentPath = path.join(webAppPath, "Component.js")

    // verifying existence of the requested file 
    if(fs.existsSync(componentPath)){
        const componentBuffer = await fsPromises.readFile(componentPath, 'utf-8')

        return componentBuffer.toString()
    }

    return ""
}

// ---------------------

// below ONLY funcs to WORK with PROMPTS
type questionStructure = {
    [key: string]: {
        [anotherKey: string]: QuestionSchema[]
    }
}

const questions: questionStructure = {
    "connection": {
        "connector-v4": [
            {
                confirm: {
                    message: "Deseja que o arquivo contenha a documentação?",
                    name: "wantDocs",
                }
            }
        ],
        "connector-v2": [
            {
                confirm: {
                    message: "Deseja vincular a connector as models existentes?",
                    name: "wantConnections",
                }
            }
        ]
    }
}

async function makeQuestions(generatorType: string, filePath: string){
    const selectedQuestions = questions[generatorType][filePath]
    const responses: responsesSchema = {}

      for await (const questionData of selectedQuestions) {
          const [promptType, question] = Object.entries(questionData).at(0) as [PossiblePromptTypes, QuestionContent<PossiblePromptTypes>]

          if(question === undefined) throw new Error("Error in Question Structure")

          if(!promptType) throw new Error("Necessary prompt type in Question Schema")
        
          const handler = prompt[promptType] as (question: QuestionContent<typeof promptType>) => Promise<any>
        
          if(!handler) throw new Error("Prompt type not found")

          const questionResponse = await handler(question)
  
          responses[question.name] = questionResponse
      }
    
      return responses
}