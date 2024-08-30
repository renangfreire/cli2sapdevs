import * as fsPromises from "fs/promises"
import * as fs from "fs"
import path from "path";

import * as prompt from "@inquirer/prompts"
import { generatorProps } from "../@types/generator";
import { renderEjs } from "./renderEjs";
import { PossiblePromptTypes, QuestionContent, QuestionSchema } from "../@types/questions";
import { adaptManifest, manifestSchema } from "../adapters/adaptManifest";

type responsesSchema = {
    [key: string]: any
}

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

async function createFile(templatePath: string, createdFileFolder: string, responses: responsesSchema, filePath: string): Promise<[{filename: string}[], boolean]>{
    const filesToCreate = await fsPromises.readdir(templatePath)
    const createdFiles: {filename: string}[] = []

    await Promise.all(
        filesToCreate.map(async (file) => {
            const orgFile = path.join(templatePath, file)
    
            const stats = fs.statSync(orgFile)
    
            if(stats.isFile()){
                // verifying existence of the requested file 
                if(fs.existsSync(path.join(createdFileFolder, file))) {
                    // Change FileName to FilePath => generator/* <folder name is filePath>
                    const fileExtension = file.split(".").at(-1)
                    file = `${filePath}.${fileExtension}` 
    
                    // if folder continue exists
                    if(fs.existsSync(path.join(createdFileFolder, file))){
                        const overwriteResponse = await prompt.confirm({
                            message: "Parece que o arquivo que deseja gerar, já existe. Deseja sobrescrevê-lo?"
                        })
    
                        if(!overwriteResponse) return
                    }
                }
    
                const template = await fsPromises.readFile(orgFile, 'utf-8')
                const templateEjs = renderEjs(template, responses)
                
                fsPromises.writeFile(path.join(createdFileFolder, file), templateEjs)
    
                createdFiles.push({filename: file})
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
        if(manifestFile.dataSources.length === 0) {
            console.log("Nenhuma conexão foi detectada") 
        } else {
            responses.existingConnections = manifestFile.dataSources.filter(connection => connection.type.toLowerCase() === "odata")
        }
    }

    const createdFileFolder = await createFolder(generatorType, webAppPath)

    const [generatedFiles, err] = await createFile(templatePath, createdFileFolder, responses, filePath)
    if(err) console.log("Houve algum problema ao gerar o arquivo, tente novamente!")

    // no file was generated
    if(generatedFiles.length === 0) return process.exit()

    switch(filePath){
        case "connector-v4": {
            const componentJs = await getComponentJs(webAppPath)
            modifyComponentJs(webAppPath, componentJs, manifestFile)
            break;
        }
    }
}

async function modifyComponentJs(webAppPath: string, componentJs: string, manifestFile: manifestSchema){
    const projectId = manifestFile.projectId
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