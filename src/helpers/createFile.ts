import path from "path"
import * as fsPromises from "fs/promises"
import * as fs from "fs"

import { renderEjs } from "../utils/renderEjs";
import { confirm } from "@inquirer/prompts";
import { responsesSchema } from "../utils/makeQuestions";

export type createdFiles = {filename: string, fileFolderPath: string}

type fileConfig = {
    templatePath: string,
    destinationFolderPath: string,
    filePath: string,
    responses?: responsesSchema
}

export async function createFile({ templatePath, destinationFolderPath,  filePath, responses}: fileConfig): Promise<[createdFiles[], boolean]>{
    const filesToCreate = await fsPromises.readdir(templatePath)
    const createdFiles: createdFiles[] = []

    await Promise.all(
        filesToCreate.map(async (file) => {
            const orgFile = path.join(templatePath, file)
    
            const stats = fs.statSync(orgFile)
    
            if(stats.isFile()){
                // verifying existence of the requested file 
                if(fs.existsSync(path.join(destinationFolderPath, file))) {
                    // Change FileName to FilePath => generator/* <folder name is filePath>
                    const fileExtension = file.split(".").at(-1)
                    file = `${filePath}.${fileExtension}` 
    
                    // if folder continue exists
                    if(fs.existsSync(path.join(destinationFolderPath, file))){
                        const overwriteResponse = await confirm({
                            message: "Parece que o arquivo que deseja gerar, já existe. Deseja sobrescrevê-lo?"
                        })
    
                        if(!overwriteResponse) return
                    }
                }
    
                const template = await fsPromises.readFile(orgFile, 'utf-8')

                const templateEjs = responses ? renderEjs(template, responses) : template
                
                fsPromises.writeFile(path.join(destinationFolderPath, file), templateEjs)
    
                createdFiles.push({filename: file, fileFolderPath: destinationFolderPath})
            }
        })
    )

    return [createdFiles, false]
}